import { APP_CONFIG } from "../constants";
import { getModelOptimizationRule } from "../utils/promptOptimizer";

export async function enhancePromptWithProxy(
  idea: string,
  proxyUrl: string,
  modelName?: string,
  customRules?: string,
  referenceImage?: string,
  targetRenderModel?: string,
  characterProfile?: string
): Promise<string> {
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

  if (referenceImage) {
    systemInstruction += `\n\nNgười dùng có cung cấp một bức ảnh phác thảo/tham khảo. Hãy quan sát bố cục, màu sắc, nhân vật, phong cảnh trong bức ảnh đó để kết hợp vào việc tạo ra đoạn prompt tiếng Anh một cách sát với ảnh gốc nhất có thể.`;
  }

  const endpoint = proxyUrl || 'https://text.pollinations.ai/';
  const modelToUse = modelName || 'openai-large';

  try {
    const messages: any[] = [
      { role: 'system', content: systemInstruction }
    ];

    if (referenceImage) {
      messages.push({
        role: 'user',
        content: [
          { type: 'text', text: idea },
          { type: 'image_url', image_url: { url: referenceImage } }
        ]
      });
    } else {
      messages.push({ role: 'user', content: idea });
    }

    const payload: any = {
      messages,
      model: modelToUse
    };

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    const response = await fetch(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload)
    });
    
    if (!response.ok) {
        throw new Error(`Proxy API returned status: ${response.status}`);
    }
    
    // API có thể trả về JSON (OpenAI format) hoặc text trực tiếp (như pollinations standard)
    const text = await response.text();
    try {
      const json = JSON.parse(text);
      if (json.choices && json.choices.length > 0 && json.choices[0].message) {
         return json.choices[0].message.content.trim();
      }
      return text.trim() || idea;
    } catch(e) {
      // Nếu không phải JSON, trả về nguyên bản là text
      return text.trim() || idea;
    }
  } catch (error: any) {
    console.error("Proxy API Error:", error);
    throw new Error(error.message || "Lỗi khi nội suy bằng Proxy API. Vui lòng kiểm tra lại URL hoặc ID Model.");
  }
}
