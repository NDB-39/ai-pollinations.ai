import { X, Aperture } from "lucide-react";

export interface ModelSelectionDialogProps {
  isOpen: boolean;
  models: string[];
  title?: string;
  onSelect: (model: string) => void;
  onClose: () => void;
}

export function ModelSelectionDialog({ isOpen, models, title = "Chọn Model Phơi Sáng", onSelect, onClose }: ModelSelectionDialogProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-studio-800 border border-studio-600 rounded-xl w-full max-w-sm shadow-2xl overflow-hidden flex flex-col max-h-[80vh] animate-in fade-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center p-5 border-b border-studio-700 shrink-0">
          <h2 className="text-xl font-serif font-semibold text-studio-50">{title}</h2>
          <button onClick={onClose} className="text-studio-400 hover:text-studio-100 transition-colors">
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
              className="px-4 py-3 bg-studio-900 border border-studio-700 hover:border-accent hover:bg-studio-800 text-studio-100 rounded-lg flex items-center gap-3 transition-colors text-left group"
            >
              <Aperture className="w-4 h-4 text-studio-400 group-hover:text-accent shrink-0 transition-colors" />
              <span className="truncate font-mono text-sm">{model}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
