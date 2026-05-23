import { X, Aperture, Info } from "lucide-react";

export interface ModelSelectionDialogProps {
  isOpen: boolean;
  models: string[];
  title?: string;
  onSelect: (model: string) => void;
  onClose: () => void;
}

const MODEL_DESCRIPTIONS: Record<string, string> = {
  'flux': 'Model đa dụng cân bằng giữa tốc độ và chất lượng chi tiết ấn tượng.',
  'flux-realism': 'Tối ưu cho ảnh chân dung, phong cảnh với độ chân thực (photorealistic) cao nhất.',
  'flux-anime': 'Chuyên biệt tạo artwork phong cách Anime/Manga Nhật Bản sắc nét.',
  'flux-3d': 'Phù hợp tạo nhân vật 3D, concept art 3D, render CGI.',
  'flux-pro': 'Phiên bản cao cấp, xử lý prompt chi tiết và phức tạp cực tốt.',
  'turbo': 'Tốc độ render siêu tốc, phù hợp để test nhanh concept ý tưởng.',
  'any-dark': 'Phong cách dark fantasy, ảm đạm, điện ảnh kịch tính.'
};

export function ModelSelectionDialog({ isOpen, models, title = "Chọn Model Phơi Sáng", onSelect, onClose }: ModelSelectionDialogProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="glass-panel border border-white/10 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center p-5 border-b border-white/5 shrink-0 bg-studio-950/30">
          <div>
            <h2 className="text-xl font-serif font-semibold text-studio-50 tracking-wide">{title}</h2>
            <p className="text-xs text-studio-400 mt-1">Chọn Engine Render phù hợp với phong cách nghệ thuật của bạn.</p>
          </div>
          <button onClick={onClose} className="p-2 text-studio-400 hover:text-studio-100 hover:bg-white/5 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-4 overflow-y-auto custom-scrollbar flex flex-col gap-3">
          {models.map((model) => (
            <button
              key={model}
              onClick={() => {
                onClose();
                onSelect(model);
              }}
              className="px-4 py-4 bg-studio-900/50 border border-white/5 hover:border-accent/40 hover:bg-studio-900 text-studio-100 rounded-xl flex items-start gap-4 transition-all text-left group"
            >
              <Aperture className="w-5 h-5 text-studio-400 group-hover:text-accent mt-0.5 shrink-0 transition-colors" />
              <div className="flex-1">
                <span className="truncate font-mono text-sm font-semibold">{model}</span>
                {MODEL_DESCRIPTIONS[model] && (
                  <p className="text-xs text-studio-400 mt-1.5 leading-relaxed group-hover:text-studio-300 transition-colors">
                    {MODEL_DESCRIPTIONS[model]}
                  </p>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
