import { Info } from "lucide-react";

export function InstructionBanner() {
  return (
    <div className="bg-studio-900 border-b border-studio-800 p-3 shrink-0 relative z-10 text-xs md:text-sm">
      <div className="max-w-[1920px] mx-auto flex gap-3 lg:gap-4 items-start md:items-center text-studio-400 px-2 lg:px-4">
        <Info className="w-4 h-4 md:w-5 md:h-5 mt-0.5 md:mt-0 shrink-0 text-studio-300" />
        <div className="flex-1 space-y-1">
          <p className="font-semibold text-studio-200">Hướng dẫn AI-pollinations.ai-STUDIO:</p>
          <ul className="list-disc pl-5 space-y-1 md:flex md:space-y-0 md:space-x-8 md:pl-0 md:list-none text-[11px] md:text-xs">
            <li className="md:relative md:pl-4 md:before:content-['•'] md:before:absolute md:before:left-0 md:before:text-studio-600">
              <span className="text-studio-200 font-medium">Chế độ Direct:</span> Nhập trực tiếp prompt Tiếng Anh để tạo ảnh chính xác.
            </li>
            <li className="md:relative md:pl-4 md:before:content-['•'] md:before:absolute md:before:left-0 md:before:text-studio-600">
              <span className="text-studio-200 font-medium">Chế độ Idea:</span> Nhập ý tưởng/concept bằng tiếng Việt, AI sẽ định hình phong cách.
            </li>
            <li className="md:relative md:pl-4 md:before:content-['•'] md:before:absolute md:before:left-0 md:before:text-studio-600">
              Tùy chỉnh model tối ưu hoặc sử dụng ảnh mẫu trong mục cài đặt Idea.
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
