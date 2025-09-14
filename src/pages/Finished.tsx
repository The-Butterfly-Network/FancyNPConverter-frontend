import { useLocation, useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, Download, ArrowLeft, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const Finished = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Get the conversion data from navigation state
  const { originalFile, sourceFormat, convertedFileName } = location.state || {};

  // If no state data, redirect back to convert page
  if (!originalFile) {
    navigate('/');
    return null;
  }

  const handleDownload = () => {
    // For demo purposes, create a sample converted YAML content
    const sampleContent = `# Converted from ${sourceFormat} to FancyNPCs format
# Original file: ${originalFile}

npcs:
  example_npc:
    name: "&6Example NPC"
    displayName: "&6Example NPC"
    skin:
      texture: ""
      signature: ""
    location:
      world: "world"
      x: 0.0
      y: 64.0
      z: 0.0
      yaw: 0.0
      pitch: 0.0
    actions:
      interact:
        - "[CONSOLE] say Hello from FancyNPCs!"
    settings:
      showInTab: false
      collidable: false
      lookAtPlayer: true
      turnToPlayer: true
`;

    // Create and download the file
    const blob = new Blob([sampleContent], { type: 'text/yaml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = convertedFileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Download started",
      description: `${convertedFileName} has been downloaded successfully`,
    });
  };

  const handleNewConversion = () => {
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-accent/30">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto">
          {/* Success Animation */}
          <div className="text-center mb-12">
            <div className="relative inline-flex items-center justify-center w-24 h-24 rounded-full bg-primary/10 mb-6">
              <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping" />
              <CheckCircle className="w-12 h-12 text-primary relative z-10" />
            </div>
            <h1 className="text-4xl font-bold mb-4">
              <span className="bg-gradient-to-r from-primary via-gold to-cyan bg-clip-text text-transparent">
                Conversion Complete!
              </span>
            </h1>
            <p className="text-xl text-muted-foreground">
              Your YAML file has been successfully converted to FancyNPCs format
            </p>
          </div>

          {/* Conversion Summary */}
          <Card className="p-8 mb-8 bg-card/60 backdrop-blur-sm border border-border/50">
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-6">
                <Sparkles className="w-6 h-6 text-primary" />
                <h2 className="text-2xl font-semibold">Conversion Summary</h2>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center p-4 rounded-lg bg-accent/30">
                  <span className="text-muted-foreground">Original File:</span>
                  <span className="font-medium">{originalFile}</span>
                </div>
                
                <div className="flex justify-between items-center p-4 rounded-lg bg-accent/30">
                  <span className="text-muted-foreground">Source Format:</span>
                  <span className="font-medium capitalize">{sourceFormat}</span>
                </div>
                
                <div className="flex justify-between items-center p-4 rounded-lg bg-accent/30">
                  <span className="text-muted-foreground">Output File:</span>
                  <span className="font-medium">{convertedFileName}</span>
                </div>
                
                <div className="flex justify-between items-center p-4 rounded-lg bg-primary/10">
                  <span className="text-muted-foreground">Target Format:</span>
                  <span className="font-medium text-primary">FancyNPCs</span>
                </div>
              </div>
            </div>
          </Card>

          {/* Action Buttons */}
          <div className="space-y-4">
            <Button
              onClick={handleDownload}
              className="w-full h-14 text-lg font-medium bg-primary hover:bg-primary/90 transition-all duration-300"
              style={{ boxShadow: "var(--shadow-elegant)" }}
            >
              <Download className="w-5 h-5 mr-2" />
              Download Converted File
            </Button>
            
            <Button
              onClick={handleNewConversion}
              variant="outline"
              className="w-full h-12 text-base font-medium border-2 hover:bg-accent/20"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Convert Another File
            </Button>
          </div>

          {/* Help Text */}
          <div className="mt-8 p-6 rounded-lg bg-muted/50 border border-border/50">
            <h3 className="font-medium mb-2">Next Steps:</h3>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Place the converted file in your FancyNpcs plugin folder</li>
              <li>• Restart your server</li>
              <li>• Your NPCs should now be available in FancyNPCs format</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Finished;