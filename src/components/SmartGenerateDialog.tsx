import { X, Sparkles, ImagePlay, BrainCircuit } from "lucide-react";
import { useState, useEffect } from "react";

export interface SmartGenerateDialogProps {
  isOpen: boolean;
  isVietnamese: boolean;
  availableTextModels: { id: string; name: string }[];
  availableImageModels: { id: string; name: string }[];
  targetRenderModel?: string;
  onProceedEnhance: (textModel: string, imageModel: string) => void;
  onProceedDirect: (imageModel: string) => void;
  onClose: () => void;
}

export function SmartGenerateDialog({
  isOpen,
  isVietnamese,
  availableTextModels,
  availableImageModels,
  targetRenderModel,
  onProceedEnhance,
  onProceedDirect,
  onClose
}: SmartGenerateDialogProps) {
  const [selectedAction, setSelectedAction] = useState<'enhance' | 'direct'>('direct');
  const [textModel, setTextModel] = useState('');
  const [imageModel, setImageModel] = useState('');

  useEffect(() => {
    if (isOpen) {
      setSelectedAction(isVietnamese ? 'enhance' : 'direct');
      if (availableTextModels.length > 0) setTextModel(availableTextModels[0].id);
      
      const defaultImgModel = targetRenderModel && targetRenderModel !== 'general' 
        ? targetRenderModel 
        : (availableImageModels.filter(m => m.id !== 'general')[0]?.id || '');
      setImageModel(defaultImgModel);
    }
  }, [isOpen, isVietnamese, availableTextModels, availableImageModels, targetRenderModel]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="glass-panel border border-white/10 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center p-5 border-b border-white/5 shrink-0 bg-studio-950/30">
          <div>
            <h2 className="text-xl font-serif font-semibold text-studio-50 tracking-wide">
              {isVietnamese ? 'Phát hiện Tiếng Việt' : 'Tùy chọn tạo ảnh'}
            </h2>
          </div>
          <button onClick={onClose} className="p-2 text-studio-400 hover:text-studio-100 hover:bg-white/5 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-5 flex flex-col gap-6 overflow-y-auto custom-scrollbar">
          {isVietnamese ? (
            <p className="text-sm text-studio-300">
              Hệ thống phát hiện prompt có chứa Tiếng Việt. Để AI Render hình ảnh tốt nhất, bạn nên <strong className="text-accent">Nội suy (Enhance)</strong> sang tiếng Anh trước.
            </p>
          ) : (
            <p className="text-sm text-studio-300">
              Bạn có thể tạo ảnh ngay với prompt hiện tại, hoặc để AI Nội suy thêm chi tiết phong phú hơn.
            </p>
          )}

          <div className="flex flex-col gap-3">
            <button
              onClick={() => setSelectedAction('enhance')}
              className={`p-4 rounded-xl border flex gap-4 transition-all text-left ${selectedAction === 'enhance' ? 'border-accent bg-accent/10' : 'border-white/5 bg-studio-900/50 hover:border-white/20'}`}
            >
              <BrainCircuit className={`w-5 h-5 shrink-0 mt-0.5 ${selectedAction === 'enhance' ? 'text-accent' : 'text-studio-400'}`} />
              <div>
                <div className={`font-semibold ${selectedAction === 'enhance' ? 'text-accent' : 'text-studio-100'}`}>Nội suy Prompt</div>
                <div className="text-xs text-studio-400 mt-1">Dùng AI Text để dịch sang tiếng Anh và thêm chi tiết phong phú (ánh sáng, phong cách, camera...).</div>
              </div>
            </button>

            <button
              onClick={() => setSelectedAction('direct')}
              className={`p-4 rounded-xl border flex gap-4 transition-all text-left ${selectedAction === 'direct' ? 'border-accent bg-accent/10' : 'border-white/5 bg-studio-900/50 hover:border-white/20'}`}
            >
              <ImagePlay className={`w-5 h-5 shrink-0 mt-0.5 ${selectedAction === 'direct' ? 'text-accent' : 'text-studio-400'}`} />
              <div>
                <div className={`font-semibold ${selectedAction === 'direct' ? 'text-accent' : 'text-studio-100'}`}>Tạo ảnh ngay</div>
                <div className="text-xs text-studio-400 mt-1">Render trực tiếp bằng prompt hiện tại của bạn. (Sẽ hiệu quả hơn với tiếng Anh)</div>
              </div>
            </button>
          </div>

          <div className="space-y-4 pt-4 border-t border-white/5">
            {selectedAction === 'enhance' && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-studio-300">Model Text (Nội suy)</label>
                <select
                  value={textModel}
                  onChange={(e) => setTextModel(e.target.value)}
                  className="w-full bg-studio-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-studio-100 outline-none focus:border-accent"
                >
                  {availableTextModels.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                </select>
              </div>
            )}
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-studio-300">Model Render (Tạo ảnh)</label>
              <select
                value={imageModel}
                onChange={(e) => setImageModel(e.target.value)}
                className="w-full bg-studio-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-studio-100 outline-none focus:border-accent"
              >
                {availableImageModels.filter(m => m.id !== 'general').map(m => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-white/5 bg-studio-950/30 flex justify-end gap-3 shrink-0">
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm font-medium text-studio-300 hover:text-white hover:bg-white/5 transition-colors">
            Hủy
          </button>
          <button
            onClick={() => {
               if (!imageModel) return;
               if (selectedAction === 'enhance') {
                 if (!textModel) return;
                 onProceedEnhance(textModel, imageModel);
               } else {
                 onProceedDirect(imageModel);
               }
               onClose();
            }}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-accent text-studio-950 hover:bg-accent/90 transition-colors flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            Bắt đầu tác vụ
          </button>
        </div>
      </div>
    </div>
  );
}
