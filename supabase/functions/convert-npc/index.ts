import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CitizensNPC {
  metadata?: {
    [key: string]: any;
  };
  name: string;
  uuid: string;
  traits: {
    skintrait?: {
      textureRaw?: string;
      skinName?: string;
      signature?: string;
    };
    hologramtrait?: {
      lines: {
        [key: string]: {
          text: string;
          textshadow?: boolean;
          margin?: {
            top: number;
            bottom: number;
          };
        };
      };
    };
    location: {
      world: string;
      x: number;
      y: number;
      z: number;
      yaw: number;
      pitch: number;
      bodyYaw?: number;
    };
    lookclose?: {
      range: number;
      enabled: boolean;
    };
    type: string;
    owner?: {
      uuid: string;
    };
    [key: string]: any;
  };
}

interface TextureData {
  timestamp: number;
  profileId: string;
  profileName: string;
  signatureRequired: boolean;
  textures: {
    SKIN: {
      url: string;
      metadata?: {
        model: string;
      };
    };
  };
}

interface FancyNPC {
  name: string;
  creator: string;
  displayName: string;
  type: string;
  location: {
    world: string;
    x: number;
    y: number;
    z: number;
    yaw: number;
    pitch: number;
  };
  showInTab: boolean;
  spawnEntity: boolean;
  collidable: boolean;
  glowing: boolean;
  glowingColor: string;
  turnToPlayer: boolean;
  turnToPlayerDistance: number;
  interactionCooldown: number;
  scale: number;
  visibility_distance: number;
  skin: {
    identifier: string;
    variant: string;
    mirrorSkin: boolean;
  };
  attributes: {
    shaking: string;
    pose: string;
  };
}

function convertCitizensToFancyNPCs(citizensData: { npc: { [key: string]: CitizensNPC } }): { npcs: { [key: string]: FancyNPC } } {
  const result: { npcs: { [key: string]: FancyNPC } } = { npcs: {} };

  for (const [npcId, npcData] of Object.entries(citizensData.npc)) {
    let skinIdentifier = "steve"; // Default skin
    let skinVariant = "CLASSIC";

    // Extract skin data from textureRaw
    if (npcData.traits.skintrait?.textureRaw) {
      try {
        const decodedTexture = atob(npcData.traits.skintrait.textureRaw);
        const textureData: TextureData = JSON.parse(decodedTexture);
        
        if (textureData.textures?.SKIN?.url) {
          skinIdentifier = textureData.textures.SKIN.url;
          skinVariant = textureData.textures.SKIN.metadata?.model === "slim" ? "SLIM" : "CLASSIC";
        }
      } catch (error) {
        console.error("Failed to decode textureRaw:", error);
      }
    }

    // Clean display name from color codes and formatting
    const cleanDisplayName = npcData.name.replace(/&[0-9a-fk-or]/g, '');

    const fancyNPC: FancyNPC = {
      name: `converted_${npcId}`,
      creator: npcData.traits.owner?.uuid || "00000000-0000-0000-0000-000000000000",
      displayName: cleanDisplayName === "(&7Rechtsklick&)" ? "<empty>" : cleanDisplayName,
      type: npcData.traits.type || "PLAYER",
      location: {
        world: npcData.traits.location.world,
        x: npcData.traits.location.x,
        y: npcData.traits.location.y,
        z: npcData.traits.location.z,
        yaw: npcData.traits.location.yaw,
        pitch: npcData.traits.location.pitch
      },
      showInTab: false,
      spawnEntity: true,
      collidable: false,
      glowing: false,
      glowingColor: "dark_aqua",
      turnToPlayer: npcData.traits.lookclose?.enabled || false,
      turnToPlayerDistance: npcData.traits.lookclose?.range || -1,
      interactionCooldown: 0.0,
      scale: 1.0,
      visibility_distance: 2147483647,
      skin: {
        identifier: skinIdentifier,
        variant: skinVariant,
        mirrorSkin: false
      },
      attributes: {
        shaking: "false",
        pose: "standing"
      }
    };

    result.npcs[npcData.uuid] = fancyNPC;
  }

  return result;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { 
          status: 405, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const { citizensData, sourceFormat } = await req.json();

    if (!citizensData) {
      return new Response(
        JSON.stringify({ error: 'No data provided' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    let convertedData;

    if (sourceFormat === 'citizens') {
      convertedData = convertCitizensToFancyNPCs(citizensData);
    } else if (sourceFormat === 'znpcs') {
      // TODO: Implement zNPCs conversion
      return new Response(
        JSON.stringify({ error: 'zNPCs conversion not yet implemented' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    } else {
      return new Response(
        JSON.stringify({ error: 'Invalid source format' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('Conversion successful:', {
      sourceFormat,
      originalNPCs: Object.keys(citizensData.npc || {}).length,
      convertedNPCs: Object.keys(convertedData.npcs).length
    });

    return new Response(
      JSON.stringify({ 
        success: true, 
        data: convertedData,
        stats: {
          originalCount: Object.keys(citizensData.npc || {}).length,
          convertedCount: Object.keys(convertedData.npcs).length
        }
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Conversion error:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Conversion failed', 
        details: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});