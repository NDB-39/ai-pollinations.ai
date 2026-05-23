import { GoogleGenAI } from "@google/genai";
import { APP_CONFIG } from "../constants";
import { getModelOptimizationRule } from "../utils/promptOptimizer";

export interface StoryboardFrame {
  id: string;
  title: string;
  prompt: string;
}

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

export async function generateStoryboardWithGemini(
  idea: string, 
  frameCount: number, 
  apiKey: string, 
  customRules?: string, 
  modelName?: string, 
  targetRenderModel?: string, 
  characterProfile?: string
): Promise<StoryboardFrame[]> {
  if (!apiKey) {
    throw new Error("Vui lòng nhập API Key của Gemini trong Cài đặt.");
  }

  const ai = new GoogleGenAI({ apiKey });

  let systemInstruction = `Bạn là một Đạo diễn Điện ảnh / Storyboard Artist (Cine-Tech Game Architect). 
Nhiệm vụ của bạn là lấy kịch bản sơ bộ của người dùng và tạo ra một storyboard gồm chính xác ${frameCount} cảnh (frames) nối tiếp nhau tạo thành một câu chuyện trực quan.
Sự quán nhất (consistency) về hình thể, khuôn mặt và trang phục nhân vật (Character ID Lock) là MỤC TIÊU TỐI THƯỢNG. Bạn PHẢI lặp lại chính xác và đầy đủ mô tả ngoại hình, trang phục, màu tóc, phụ kiện của nhân vật chính trong MỌI prompt tiếng Anh ở TẤT CẢ các cảnh. TUYỆT ĐỐI không thay đổi trang phục của nhân vật trừ khi kịch bản có yêu cầu bắt buộc rõ ràng.

Trả về kết quả dưới dạng MẢNG JSON thuần túy (JSON Array). Tuyệt đối KHÔNG bọc trong markdown (không có \`\`\`json). Mảng phải chứa các object có định dạng sau:
[
  {
    "id": "frame-1",
    "title": "Tên cảnh ngắn gọn (Tiếng Việt)",
    "prompt": "Prompt tiếng Anh cực kỳ chi tiết cho AI tạo ảnh. (BẮT BUỘC CHỨA ĐẦY ĐỦ PROFILE NHÂN VẬT & TRANG PHỤC CỐ ĐỊNH)"
  }
]

Prompt tiếng Anh phải ưu tiên sự chân thực (photorealistic), tập trung vào: ánh sáng, góc máy, loại phim, phong cách cinematic.`;

  if (targetRenderModel) {
    const renderOpt = getModelOptimizationRule(targetRenderModel);
    if (renderOpt) {
      systemInstruction += `\n\n${renderOpt}`;
    }
  }

  if (characterProfile && characterProfile.trim()) {
    systemInstruction += `\n\nThông tin chi tiết về profile/ngoại hình/trang phục cố định của nhân vật:\n${characterProfile}\n=> BẮT BUỘC: Bạn phải dịch và lồng ghép nguyên vẹn mô tả này vào phần 'prompt' tiếng Anh của MỌI frame để đảm bảo AI tạo ảnh khóa nhân dạng thành công.`;
  }

  if (customRules && customRules.trim()) {
    systemInstruction += `\n\nHướng dẫn bổ sung từ người dùng:\n${customRules}`;
  }

  try {
    const response = await ai.models.generateContent({
      model: modelName || APP_CONFIG.GEMINI_MODEL,
      contents: idea,
      config: {
        systemInstruction,
        temperature: 0.7,
        responseMimeType: "application/json",
      }
    });

    const text = response.text?.trim() || "[]";
    try {
      const frames = JSON.parse(text);
      if (Array.isArray(frames)) {
        return frames;
      }
      if (typeof frames === 'object' && frames !== null && frames.id) {
        return [frames];
      }
    } catch(e) {
      console.error("Lỗi parse JSON từ Gemini:", e, text);
      throw new Error("Kết quả từ Gemini không đúng định dạng JSON.");
    }
    return [];
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw new Error("Lỗi khi kết nối với Gemini API. Vui lòng kiểm tra lại cấu hình API key.");
  }
}
