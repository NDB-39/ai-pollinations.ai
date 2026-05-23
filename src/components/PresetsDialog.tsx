import { X, Search, Clock, Trash2, Check } from "lucide-react";
import { useState, useMemo } from "react";
import { ConfirmDialog } from "./ConfirmDialog";

export interface PresetItem {
  id: string;
  name: string;
  prompt: string;
  negativePrompt: string;
  aspectRatio: string;
  createdAt: number;
}

export interface PresetsDialogProps {
  isOpen: boolean;
  presets: PresetItem[];
  onClose: () => void;
  onApplyPreset: (preset: PresetItem) => void;
  onDeletePreset: (id: string) => void;
}

export function PresetsDialog({ isOpen, presets, onClose, onApplyPreset, onDeletePreset }: PresetsDialogProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return presets
      .filter(item => item.name.toLowerCase().includes(searchTerm.toLowerCase()) || item.prompt.toLowerCase().includes(searchTerm.toLowerCase()))
      .sort((a, b) => b.createdAt - a.createdAt);
  }, [presets, searchTerm]);

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
        <div className="glass-panel border border-white/10 rounded-2xl w-full max-w-2xl max-h-[85vh] shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
          <div className="flex justify-between items-center p-5 border-b border-white/5 shrink-0">
            <h2 className="text-xl font-serif font-semibold text-studio-50">Presets đã lưu</h2>
            <button onClick={onClose} className="p-2 text-studio-400 hover:text-studio-100 hover:bg-white/5 rounded-lg transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <div className="p-4 border-b border-white/5 bg-studio-950/50 shrink-0">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-studio-400" />
              <input 
                type="text" 
                placeholder="Tìm kiếm preset..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-studio-950 border border-white/10 rounded-xl pl-9 pr-4 py-2 text-sm text-studio-100 focus:outline-none focus:border-studio-400 focus:ring-1 focus:ring-studio-400"
              />
            </div>
          </div>

          <div className="overflow-y-auto custom-scrollbar p-4 flex flex-col gap-4">
            {filtered.length === 0 ? (
              <div className="text-center text-studio-500 py-8">Chưa có preset nào được lưu.</div>
            ) : (
              filtered.map(item => (
                <div key={item.id} className="bg-studio-900/50 border border-white/5 rounded-xl p-4 flex flex-col gap-3 group relative hover:border-white/20 transition-colors">
                  <div className="flex justify-between items-start">
                    <h3 className="font-semibold text-studio-100 text-base">{item.name}</h3>
                    <div className="flex items-center gap-2">
                       <span className="text-xs text-studio-500 flex items-center gap-1">
                         <Clock className="w-3 h-3" />
                         {new Date(item.createdAt).toLocaleDateString()}
                       </span>
                    </div>
                  </div>
                  
                  <div className="bg-studio-950 p-3 rounded-xl border border-white/5">
                    <span className="text-[10px] uppercase tracking-tight text-accent font-medium mb-1 block">Prompt</span>
                    <p className="text-xs text-studio-300 font-mono line-clamp-2 leading-relaxed">{item.prompt}</p>
                  </div>

                  {item.negativePrompt && (
                    <div className="bg-studio-950 p-3 rounded-xl border border-white/5">
                      <span className="text-[10px] uppercase tracking-tight text-red-400 font-medium mb-1 block">Negative Prompt</span>
                      <p className="text-xs text-studio-300 font-mono line-clamp-1 leading-relaxed">{item.negativePrompt}</p>
                    </div>
                  )}

                  <div className="flex gap-2 items-center justify-between">
                    <span className="text-xs text-studio-400 bg-studio-950 px-3 py-1.5 rounded-lg border border-white/5">
                      Tỷ lệ: {item.aspectRatio}
                    </span>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => setDeletingId(item.id)}
                        className="p-2 text-red-400 hover:text-red-300 bg-studio-950 hover:bg-studio-900 rounded-lg transition-colors border border-white/5 hidden md:block opacity-0 group-hover:opacity-100 md:opacity-100 md:opacity-100"
                        title="Xóa preset"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => {
                          onApplyPreset(item);
                          onClose();
                        }}
                        className="px-4 py-2 bg-accent text-studio-950 text-xs font-semibold rounded-lg hover:bg-accent-hover transition-colors flex items-center gap-1.5 shadow-sm"
                      >
                        <Check className="w-3.5 h-3.5" /> Áp dụng
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <ConfirmDialog 
        isOpen={deletingId !== null}
        title="Xóa Preset"
        message="Bạn có chắc chắn muốn xóa preset này? Hành động này không thể hoàn tác."
        onConfirm={() => {
          if (deletingId) onDeletePreset(deletingId);
          setDeletingId(null);
        }}
        onCancel={() => setDeletingId(null)}
      />
    </>
  );
}
