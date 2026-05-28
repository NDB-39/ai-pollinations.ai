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
      return "QUY TẮC TỐI QUAN TRỌNG CHO WAN-IMAGE: Bạn BẮT BUỘC phải viết prompt như một nhà văn miêu tả cảnh quan, sử dụng NGÔN NGỮ TỰ NHIÊN (Natural Language) thành những câu văn dài, mạch lạc. KHÔNG DÙNG DẤU PHẨY để liệt kê từ khóa (tức là không viết 'masterpiece, best quality, 8k').\nĐỂ ẢNH ĐẠT ĐỘ CHÂN THỰC TỐI ĐA (Photorealistic): Áp dụng 'Natural Chaos' (Sự lộn xộn tự nhiên/Bất đối xứng) - hãy miêu tả cụ thể sự không hoàn hảo chân thực của chủ thể và môi trường xung quanh: lọn tóc bay lộn xộn trong gió, kết cấu da có vật lý thực tế như tàn nhang hoặc lỗ chân lông, quần áo hơi nhăn tự nhiên, ánh sáng tản mạn không đồng đều, các vật thể nhỏ xuất hiện ngẫu nhiên ở hậu cảnh, nhiễu hạt nhẹ (film grain). Tạo ra cảm giác ảnh chụp lén/phóng sự (candid photography), khoảnh khắc bắt được một cách tự nhiên chứ KHÔNG pose dáng hoàn hảo cứng nhắc giống AI rendering.";
    case 'zimage':
      return "QUY TẮC TỐI ƯU ĐẶC BIỆT CHO ZIMAGE NHẰM KHẮC PHỤC LỖI VẼ: 1. Để tránh lỗi dị dạng (đặc biệt là lỗi cấu trúc cơ thể, tay và khuôn mặt), bạn PHẢI nhấn mạnh các từ khóa: 'masterpiece, best quality, ultra-detailed, photorealistic, anatomically correct, perfect human anatomy, symmetrical perfect face, highly detailed eyes, perfectly drawn hands, exactly five fingers'. 2. Sử dụng ánh sáng và chi tiết vi mô: 'hyper-realistic, volumetric lighting, cinematic lighting, sharp focus, ultra-sharp, 8k resolution'. 3. Mô tả dáng đứng và góc máy thật rõ ràng, tránh tư thế quá rối rắm hoặc che khuất; đảm bảo cấu trúc hình học chuẩn xác.";
    default:
      return "";
  }
};

export const getModelNegativePrompt = (model: string): string => {
  switch (model) {
    case 'qwen-image':
      return "ugly, deformed, bad anatomy, bad proportions, bad perspective, watermark, signature, text, out of frame, lowres, error, cropped, worst quality, low quality, jpeg artifacts";
    case 'zimage':
      return "ugly, duplicate, morbid, mutilated, mutated hands, poorly drawn hands, poorly drawn face, poorly drawn eyes, cross-eyed, mutation, deformed, blurry, bad anatomy, bad proportions, extra limbs, cloned face, disfigured, gross proportions, malformed limbs, missing arms, missing legs, extra arms, extra legs, extra fingers, missing fingers, fused fingers, too many fingers, broken finger, six fingers, long neck, bad shading, fake cg, 3d render, watermark, signature, text, out of frame, lowres, worst quality, low quality, jpeg artifacts, overexposed, underexposed, unnatural pose";
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

  // Bullet point / comma keyword spam warning for Flux/GPTImage/Wan
  const wordCount = prompt.trim().split(/\s+/).length;
  const commaCount = (prompt.match(/,/g) || []).length;
  
  // Nếu có nhiều dấu phẩy và mật độ từ trên mỗi dấu phẩy quá thấp (dấu hiệu của việc liệt kê từ khóa)
  if (commaCount > 8 && (wordCount / commaCount) < 6 && ['flux', 'wan-image'].includes(model)) {
    warnings.push('Cảnh báo: Prompt có vẻ đang sử dụng liệt kê từ khóa (comma-separated keywords). Model này hoạt động tốt nhất bằng Ngôn ngữ kể chuyện tự nhiên (Natural Language narrative). Hãy chuyển thành câu văn.');
  }

  return warnings;
};
