import { useState, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useNavigate } from "react-router-dom";
import { Upload, FileText, ArrowRight, Zap } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ThemeToggle } from "@/components/ThemeToggle";
import { supabase } from "@/integrations/supabase/client";

type SourceFormat = "citizens" | "znpcs" | "znpcsplus";

const Convert = () => {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [sourceFormat, setSourceFormat] = useState<SourceFormat>("citizens");
  const [isConverting, setIsConverting] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = e.dataTransfer.files;
    if (files && files[0]) {
      const file = files[0];
      if (file.name.endsWith('.yml') || file.name.endsWith('.yaml')) {
        setSelectedFile(file);
        toast({
          title: "File uploaded successfully",
          description: `${file.name} is ready for conversion`,
        });
      } else {
        toast({
          title: "Invalid file type",
          description: "Please upload a .yml or .yaml file",
          variant: "destructive",
        });
      }
    }
  }, [toast]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      const file = files[0];
      if (file.name.endsWith('.yml') || file.name.endsWith('.yaml')) {
        setSelectedFile(file);
        toast({
          title: "File uploaded successfully",
          description: `${file.name} is ready for conversion`,
        });
      } else {
        toast({
          title: "Invalid file type",
          description: "Please upload a .yml or .yaml file",
          variant: "destructive",
        });
      }
    }
  };

  const handleConvert = async () => {
    if (!selectedFile) {
      toast({
        title: "No file selected",
        description: "Please upload a YAML file first",
        variant: "destructive",
      });
      return;
    }

    setIsConverting(true);
    
    try {
      // Read the YAML file
      const fileContent = await selectedFile.text();
      
      // Parse YAML to JSON
      const yamlData = parseSimpleYaml(fileContent);
      
      // Call the conversion edge function
      const { data, error } = await supabase.functions.invoke('convert-npc', {
        body: {
          citizensData: yamlData,
          sourceFormat
        }
      });

      if (error) {
        throw new Error(error.message || 'Conversion failed');
      }

      if (!data.success) {
        throw new Error(data.error || 'Conversion failed');
      }

      toast({
        title: "Conversion successful!",
        description: `Converted ${data.stats.convertedCount} NPCs`,
      });
      
      // Navigate to finished page with conversion result
      navigate('/finished', { 
        state: { 
          originalFile: selectedFile.name,
          sourceFormat,
          convertedFileName: 'npcs.yml',
          convertedData: data.data,
          stats: data.stats
        }
      });
    } catch (error) {
      console.error('Conversion error:', error);
      toast({
        title: "Conversion failed",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive",
      });
      setIsConverting(false);
    }
  };

  // Simple YAML parser for basic structure
  const parseSimpleYaml = (yamlContent: string) => {
    try {
      // This is a very basic YAML parser
      // In production, use a proper YAML parsing library
      const lines = yamlContent.split('\n');
      const result: any = {};
      const stack: any[] = [result];
      let currentPath: string[] = [];

      for (const line of lines) {
        if (line.trim() === '' || line.trim().startsWith('#')) continue;
        
        const indent = line.length - line.trimStart().length;
        const content = line.trim();
        
        if (content.includes(':')) {
          const [key, ...valueParts] = content.split(':');
          const value = valueParts.join(':').trim();
          
          // Adjust stack based on indentation
          const level = Math.floor(indent / 2);
          currentPath = currentPath.slice(0, level);
          currentPath.push(key.trim());
          
          // Navigate to the correct object
          let current = result;
          for (let i = 0; i < currentPath.length - 1; i++) {
            if (!current[currentPath[i]]) current[currentPath[i]] = {};
            current = current[currentPath[i]];
          }
          
          // Set the value
          if (value === '' || value === '{}') {
            current[key.trim()] = {};
          } else if (value.startsWith("'") && value.endsWith("'")) {
            current[key.trim()] = value.slice(1, -1);
          } else if (value === 'true') {
            current[key.trim()] = true;
          } else if (value === 'false') {
            current[key.trim()] = false;
          } else if (!isNaN(Number(value))) {
            current[key.trim()] = Number(value);
          } else {
            current[key.trim()] = value;
          }
        }
      }
      
      return result;
    } catch (error) {
      console.error('YAML parsing error:', error);
      throw new Error('Failed to parse YAML file');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-accent/30">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12 relative">
            <div className="absolute top-0 right-4">
              <ThemeToggle />
            </div>
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-6">
              <Zap className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-4xl font-bold mb-4">
              <span className="bg-gradient-to-r from-primary via-gold to-cyan bg-clip-text text-transparent">
                FancyNPConverters
              </span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Transform your old NPCs YAML files into FancyNPCs format with ease!
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Upload Section */}
            <Card className="p-8 space-y-6 bg-card/60 backdrop-blur-sm border border-border/50">
              <div className="space-y-2">
                <h2 className="text-2xl font-semibold flex items-center gap-2">
                  <Upload className="w-6 h-6 text-primary" />
                  Upload Your File
                </h2>
                <p className="text-muted-foreground">
                  Drag and drop your YAML file or click to browse
                </p>
              </div>

              <div
                className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-all duration-300 ${
                  dragActive
                    ? "border-primary bg-primary/5 scale-105"
                    : selectedFile
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50 hover:bg-accent/20"
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <input
                  type="file"
                  accept=".yml,.yaml"
                  onChange={handleFileSelect}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                
                {selectedFile ? (
                  <div className="space-y-3">
                    <FileText className="w-12 h-12 text-primary mx-auto" />
                    <div>
                      <p className="font-medium text-foreground">{selectedFile.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {(selectedFile.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <Upload className="w-12 h-12 text-muted-foreground mx-auto" />
                    <div>
                      <p className="font-medium text-foreground">Choose a file or drag it here</p>
                      <p className="text-sm text-muted-foreground">
                        Supports .yml and .yaml files
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </Card>

            {/* Configuration Section */}
            <Card className="p-8 space-y-6 bg-card/60 backdrop-blur-sm border border-border/50">
              <div className="space-y-2">
                <h2 className="text-2xl font-semibold">Source Format</h2>
                <p className="text-muted-foreground">
                  Select the format of your original YAML file
                </p>
              </div>

              <RadioGroup value={sourceFormat} onValueChange={(value: SourceFormat) => setSourceFormat(value)}>
                <div className="space-y-4">
                  <Label
                    htmlFor="citizens"
                    className={`flex items-center space-x-3 p-4 rounded-lg border transition-all cursor-pointer ${
                      sourceFormat === "citizens"
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50 hover:bg-accent/20"
                    }`}
                  >
                    <RadioGroupItem value="citizens" id="citizens" />
                    <div className="flex-1">
                      <p className="font-medium">Citizens</p>
                      <p className="text-sm text-muted-foreground">
                        Convert from Citizens plugin format
                      </p>
                    </div>
                  </Label>
                  
                  <Label
                    htmlFor="znpcsplus"
                    className={`flex items-center space-x-3 p-4 rounded-lg border transition-all cursor-pointer ${
                      sourceFormat === "znpcsplus"
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50 hover:bg-accent/20"
                    }`}
                  >
                    <RadioGroupItem value="znpcsplus" id="znpcsplus" />
                    <div className="flex-1">
                      <p className="font-medium">znpcsplus</p>
                      <p className="text-sm text-muted-foreground">
                        Convert from zNPCsPlus plugin format
                      </p>
                    </div>
                  </Label>


                  <Label
                    htmlFor="znpcs"
                    className={`flex items-center space-x-3 p-4 rounded-lg border transition-all cursor-pointer ${
                      sourceFormat === "znpcs"
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50 hover:bg-accent/20"
                    }`}
                  >
                    <RadioGroupItem value="znpcs" id="znpcs" />
                    <div className="flex-1">
                      <p className="font-medium">zNPCs</p>
                      <p className="text-sm text-muted-foreground">
                        Convert from zNPCs plugin format
                      </p>
                    </div>
                  </Label>
                </div>
              </RadioGroup>

              <Button
                onClick={handleConvert}
                disabled={!selectedFile || isConverting}
                className="w-full h-12 text-base font-medium bg-primary hover:bg-primary/90 transition-all duration-300"
                style={{ boxShadow: "var(--shadow-elegant)" }}
              >
                {isConverting ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-primary-foreground/20 border-t-primary-foreground rounded-full animate-spin" />
                    Converting...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    Convert to FancyNPCs
                    <ArrowRight className="w-4 h-4" />
                  </div>
                )}
              </Button>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Convert;