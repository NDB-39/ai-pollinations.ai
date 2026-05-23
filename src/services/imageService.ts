import { APP_CONFIG } from "../constants";

export function generateImageUrl(prompt: string, model?: string, seed?: number, width: number = 1024, height: number = 1024, negativePrompt?: string): string {
  const encPrompt = encodeURIComponent(prompt.trim());
  const randomSeed = seed || Math.floor(Math.random() * 1000000);
  let url = `${APP_CONFIG.PROXY_URL}/prompt/${encPrompt}?width=${width}&height=${height}&nologo=true&seed=${randomSeed}`;
  if (model && model.trim() !== '') {
    url += `&model=${encodeURIComponent(model.trim())}`;
  }
  if (negativePrompt && negativePrompt.trim() !== '') {
    url += `&negative_prompt=${encodeURIComponent(negativePrompt.trim())}`;
  }
  return url;
}
