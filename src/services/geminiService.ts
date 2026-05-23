import { GoogleGenAI } from "@google/genai";
import { APP_CONFIG } from "../constants";
import { getModelOptimizationRule } from "../utils/promptOptimizer";

export async function enhancePromptWithGemini(idea: string, apiKey: string, customRules?: string, modelName?: string, referenceImageBase64?: string, targetRenderModel?: string, characterProfile?: string): Promise<string> {
  if (!apiKey) {
    throw new Error("Vui lòng nhập API Key của Gemini trong Cài đặt.");
  }

  const ai = new GoogleGenAI({ apiKey });

  let systemInstruction = `Bạn là một chuyên gia Nhiếp ảnh / Đạo diễn Điện ảnh (Cine-Tech Game Architect). 
Nhiệm vụ của bạn là lấy ý tưởng bằng tiếng Việt (hoặc ngôn ngữ khác) của người dùng và chuyển đổi nó thành một prompt tiếng Anh cực kỳ chi tiết dành cho AI tạo ảnh.
Prompt phải ưu tiên sự chân thực (photorealistic), tập trung vào: ánh sáng (lighting), góc máy (camera angle), loại phim (film stock/lens), phong cách cinematic, và chi tiết chất liệu/thời trang cao cấp.
Chỉ trả về DUY NHẤT một đoạn prompt tiếng Anh, không kèm theo bất kỳ văn bản, giải thích hay định dạng dư thừa nào. Không dùng dấu ngoặc kép bọc kết quả.`;

  if (targetRenderModel) {
    const renderOpt = getModelOptimizationRule(targetRenderModel);
    if (renderOpt) {
      systemInstruction += `\n\n${renderOpt}`;
    }
  }

  if (characterProfile && characterProfile.trim()) {
    systemInstruction += `\n\nThông tin chi tiết về profile/ngoại hình nhân vật (hãy đảm bảo mô tả nhân vật sát với các thông tin này):\n${characterProfile}`;
  }

  if (customRules && customRules.trim()) {
    systemInstruction += `\n\nHướng dẫn bổ sung từ người dùng:\n${customRules}`;
  }
  
  let contentsPayload: any = idea;
  if (referenceImageBase64) {
    try {
      const mimeType = referenceImageBase64.split(';')[0].split(':')[1];
      const data = referenceImageBase64.split(',')[1];
      const imagePart = {
        inlineData: { mimeType, data }
      };
      const textPart = { text: idea || "Describe this image and write a detailed prompt based on it." };
      contentsPayload = { parts: [imagePart, textPart] };
      
      systemInstruction += `\n\nNgười dùng đã đính kèm một bức ảnh tham khảo (Reference Image). Hãy phân tích kỹ các yếu tố hình ảnh (bố cục, tông màu, ánh sáng, chủ thể) từ bức ảnh này, kết hợp với ý tưởng của họ để phát triển prompt.`;
    } catch(e) {
      console.warn("Lỗi xử lý ảnh base64", e);
    }
  }

  try {
    const response = await ai.models.generateContent({
      model: modelName || APP_CONFIG.GEMINI_MODEL,
      contents: contentsPayload,
      config: {
        systemInstruction,
        temperature: 0.7,
      }
    });

    if (response.text?.trim()) {
      return response.text?.trim() || idea;
    }
    return idea;
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw new Error("Lỗi khi kết nối với Gemini API. Vui lòng kiểm tra lại cấu hình API key.");
  }
}
