export const OPTIMIZATION_MODELS = [
  { value: 'flux', label: 'Flux (Mặc định)' },
  { value: 'gptimage-large', label: 'GPTImage Large' },
  { value: 'qwen-image', label: 'Qwen Image' },
  { value: 'wan-image', label: 'Wan Image' },
  { value: 'zimage', label: 'zImage' },
  { value: 'general', label: 'Chung (General)' }
];

export const getModelOptimizationRule = (model: string): string => {
  switch (model) {
    case 'flux':
      return "Quy tắc tối ưu cho Flux: Hãy mô tả dưới dạng ngôn ngữ tự nhiên (natural language narrative) giống như một câu kể mạch lạc, miêu tả chi tiết chủ thể, trang phục, bối cảnh, và ánh sáng. Không sử dụng định dạng danh sách (bullet points) hay chỉ liệt kê từ khóa (comma-separated keywords).";
    case 'gptimage-large':
      return "Quy tắc tối ưu cho GPTImage Large: Sử dụng cấu trúc mô tả trực diện, tập trung mạnh vào các thuật ngữ nhiếp ảnh chất lượng cao. Bắt đầu bằng loại ảnh (ví dụ: A cinematic shot of, A close-up portrait of), sau đó liệt kê các thuộc tính bằng dấu phẩy. Yêu cầu ánh sáng Dramatic và Ultra-high definition.";
    case 'qwen-image':
      return "Quy tắc tối ưu cho Qwen-Image: Mô tả chi tiết chính xác về tỷ lệ, cấu trúc khuôn mặt và trang phục. Bố cục phải thật cân đối. Sử dụng các keyword như 'masterpiece, best quality, ultra-detailed, 8k resolution' để kích hoạt nội dung chất lượng cao nhất.";
    case 'wan-image':
      return "Quy tắc tối ưu cho Wan-Image: Ưu tiên mô tả bối cảnh và môi trường sâu sắc. Yêu cầu độ chân thực cao, sử dụng các thuật ngữ như 'photorealistic, DSLR, f/1.8, shallow depth of field, real-life photography'.";
    case 'zimage':
      return "Quy tắc tối ưu cho zImage: Tập trung vào độ tương phản cao, phong cách Dramatic và chi tiết vi mô (micro-details). Sử dụng các từ khóa 'hyper-realistic, sharp focus, volumetric lighting, unreal engine 5 render, cinematic lighting'. Giữ prompt súc tích nhưng chặt chẽ ở các từ vựng kết cấu.";
    default:
      return "";
  }
};

export const getModelNegativePrompt = (model: string): string => {
  switch (model) {
    case 'qwen-image':
      return "ugly, deformed, bad anatomy, bad proportions, bad perspective, watermark, signature, text, out of frame, lowres, error, cropped, worst quality, low quality, jpeg artifacts";
    case 'zimage':
      return "ugly, duplicate, morbid, mutilated, mutated hands, poorly drawn hands, poorly drawn face, mutation, deformed, blurry, bad anatomy, bad proportions, extra limbs, cloned face, disfigured, gross proportions, malformed limbs, missing arms, missing legs, extra arms, extra legs, fused fingers, too many fingers, long neck, bad shading, fake cg, 3d render";
    case 'wan-image':
      return "ugly, deformed, text, watermark, bad anatomy, bad proportions, blur, blurry, low res, oversaturated, overexposed, underexposed, fake, cartoon, illustration, painting";
    case 'flux':
      return "bad quality, poor quality, bad anatomy, deformed, blurry, watermark, signature, text, ugly, morbid, mutated, out of frame, extra fingers, mutated hands, poorly drawn hands, poorly drawn face, mutation, extra limbs, cloned face, disfigured";
    case 'gptimage-large':
      return ""; // Not required
    default:
      return "ugly, deformed, text, watermark, bad anatomy, bad proportions, worst quality, low quality";
  }
};

export const checkSyntaxWarnings = (prompt: string, model: string): string[] => {
  const warnings: string[] = [];
  if (!prompt) return warnings;

  // Lora warning for models that might not support standard SD1.5 lora syntax
  if (prompt.includes('<lora:') && ['flux', 'qwen-image', 'wan-image'].includes(model)) {
    warnings.push('Phát hiện cú pháp <lora:...>. Model hiện tại có thể không hỗ trợ hoặc cần format LoRA đặc biệt.');
  }

  // Weighting warning (foo:1.5) usually not native to some
  if (/\([\w\s]+:\d+\.\d+\)/.test(prompt) && ['flux', 'gptimage-large'].includes(model)) {
    warnings.push('Phát hiện cú pháp trọng số (weight). Flux/GPTImage phản hồi tốt hơn với ngôn ngữ kể chuyện tả thực thay vì dùng trọng số.');
  }

  // Bullet point / comma keyword spam warning for Flux/GPTImage
  if (prompt.split(',').length > 15 && model === 'flux') {
    warnings.push('Prompt dường như chứa quá nhiều từ khóa rời rạc. Flux phản hồi tốt hơn với câu văn mô tả tự nhiên.');
  }

  return warnings;
};
