// Runware.ai Image Generation Service
// https://docs.runware.ai

export interface RunwareImageRequest {
  positivePrompt: string;
  negativePrompt?: string;
  width?: number;
  height?: number;
  model?: string;
  steps?: number;
  seed?: number;
}

export interface RunwareImageResponse {
  imageURL: string;
  taskType: string;
  imageUUID: string;
  cost: number;
  NSFWContent: boolean;
}

export async function generateImage(params: RunwareImageRequest): Promise<RunwareImageResponse | null> {
  const apiKey = process.env.RUNWARE_API_KEY || '';
  if (!apiKey) {
    console.warn('RUNWARE_API_KEY not set, using placeholder image');
    return null;
  }

  try {
    const res = await fetch('https://api.runware.ai/v1', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        taskType: 'imageInference',
        positivePrompt: params.positivePrompt,
        negativePrompt: params.negativePrompt || '',
        width: params.width || 1024,
        height: params.height || 768,
        model: params.model || 'runware:100@1', // SDXL
        steps: params.steps || 30,
        seed: params.seed || Math.floor(Math.random() * 1000000),
        numberResults: 1,
        outputType: 'URL',
      }),
    });

    if (!res.ok) {
      const error = await res.text();
      console.error('Runware error:', error);
      return null;
    }

    const data = await res.json();
    return data.data?.[0] || null;
  } catch (error) {
    console.error('Image generation failed:', error);
    return null;
  }
}

export async function generateHeroImage(businessName: string, industry: string): Promise<string> {
  const prompt = `Professional hero image for a ${industry} business website called "${businessName}". Clean, modern, business-friendly, high quality, no text, no logos.`;
  const result = await generateImage({ positivePrompt: prompt, width: 1920, height: 1080 });
  return result?.imageURL || `https://picsum.photos/1920/1080?random=${Math.floor(Math.random() * 1000)}`;
}

export async function generateIcon(description: string): Promise<string> {
  const prompt = `Simple icon representing: ${description}. Flat design, minimal, white background, single color, vector style.`;
  const result = await generateImage({ positivePrompt: prompt, width: 512, height: 512 });
  return result?.imageURL || `https://picsum.photos/512/512?random=${Math.floor(Math.random() * 1000)}`;
}
