import { APP_CONFIG } from "../constants";
import { getModelOptimizationRule } from "../utils/promptOptimizer";
import { StoryboardFrame } from "./geminiService";

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

export async function generateStoryboardWithProxy(
  idea: string,
  frameCount: number,
  proxyUrl: string,
  modelName?: string,
  customRules?: string,
  targetRenderModel?: string,
  characterProfile?: string
): Promise<StoryboardFrame[]> {
  let systemInstruction = `Bạn là một Đạo diễn Điện ảnh / Storyboard Artist (Cine-Tech Game Architect). 
Nhiệm vụ của bạn là lấy kịch bản sơ bộ của người dùng và tạo ra một storyboard gồm chính xác ${frameCount} cảnh (frames) nối tiếp nhau tạo thành một câu chuyện trực quan.
Sự quán nhất (consistency) về hình thể, khuôn mặt và trang phục nhân vật (Character ID Lock) là MỤC TIÊU TỐI THƯỢNG. Bạn PHẢI lặp lại chính xác và đầy đủ mô tả ngoại hình, trang phục, màu tóc, phụ kiện của nhân vật chính trong MỌI prompt tiếng Anh ở TẤT CẢ các cảnh. TUYỆT ĐỐI không thay đổi trang phục của nhân vật trừ khi kịch bản có yêu cầu bắt buộc rõ ràng.

Trả về kết quả dưới dạng MẢNG JSON thuần túy (JSON Array). Tuyệt đối KHÔNG chứa markdown \`\`\`json. Mảng phải chứa các object có định dạng sau:
[
  {
    "id": "frame-1",
    "title": "Tên cảnh ngắn gọn (Tiếng Việt)",
    "prompt": "Prompt tiếng Anh cực kỳ chi tiết cho AI tạo ảnh. (BẮT BUỘC CHỨA ĐẦY ĐỦ PROFILE NHÂN VẬT & TRANG PHỤC CỐ ĐỊNH)"
  }
]

Prompt tiếng Anh phải ưu tiên sự chân thực, lighting, camera angle, cinematic style.`;

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

  const endpoint = proxyUrl || 'https://text.pollinations.ai/';
  const modelToUse = modelName || 'openai-large';

  try {
    const messages = [
      { role: 'system', content: systemInstruction },
      { role: 'user', content: idea }
    ];

    const payload: any = {
      messages,
      model: modelToUse,
      jsonMode: true // Hint for pollinations API to prefer json
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
    
    const text = await response.text();
    let jsonText = text.trim();
    if (jsonText.startsWith('```json')) {
       jsonText = jsonText.replace(/^```json/i, '').replace(/```$/, '').trim();
    } else if (jsonText.startsWith('```')) {
       jsonText = jsonText.replace(/^```/, '').replace(/```$/, '').trim();
    }
    
    try {
      const json = JSON.parse(jsonText);
      // For OpenAI format
      if (json.choices && json.choices.length > 0 && json.choices[0].message) {
         const content = json.choices[0].message.content.trim();
         let contentJsonText = content;
         if (contentJsonText.startsWith('```json')) {
            contentJsonText = contentJsonText.replace(/^```json/i, '').replace(/```$/, '').trim();
         } else if (contentJsonText.startsWith('```')) {
            contentJsonText = contentJsonText.replace(/^```/, '').replace(/```$/, '').trim();
         }
         const parsedContent = JSON.parse(contentJsonText);
         if (Array.isArray(parsedContent)) return parsedContent;
         if (typeof parsedContent === 'object' && parsedContent !== null && parsedContent.id) {
            return [parsedContent];
         }
      }
      if (Array.isArray(json)) {
          return json;
      }
      if (typeof json === 'object' && json !== null && json.id) {
          return [json];
      }
      throw new Error("Không thể parse cấu trúc JSON mảng");
    } catch(e) {
      console.error("Lỗi parse JSON từ Proxy:", e, jsonText);
      throw new Error("Kết quả từ Proxy không đúng định dạng JSON mảng.");
    }
  } catch (error: any) {
    console.error("Proxy API Error:", error);
    throw new Error(error.message || "Lỗi khi tạo Storyboard bằng Proxy API.");
  }
}
