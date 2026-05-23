import { X } from "lucide-react";
import { useState } from "react";

export interface SavePresetDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (name: string) => void;
}

export function SavePresetDialog({ isOpen, onClose, onSave }: SavePresetDialogProps) {
  const [name, setName] = useState('');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-studio-800 border border-studio-600 rounded-xl w-full max-w-sm shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center p-5 border-b border-studio-700">
          <h2 className="text-lg font-serif tracking-widest text-studio-50">Lưu Preset</h2>
          <button onClick={onClose} className="text-studio-400 hover:text-studio-100 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-5 flex flex-col gap-4">
          <label className="block text-xs font-medium text-studio-400">
            Tên preset
          </label>
          <input 
            type="text" 
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="VD: Chân dung cinematic..."
            className="w-full bg-studio-900 border border-studio-600 rounded-lg p-3 text-sm text-studio-50 placeholder:text-studio-600 focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent"
            autoFocus
          />
          <div className="flex justify-end gap-3 mt-4">
            <button 
              onClick={onClose}
              className="px-4 py-2 bg-studio-800 border border-studio-600 text-studio-300 rounded-lg hover:border-studio-500 hover:text-studio-100 transition-colors font-medium text-sm"
            >
              Hủy
            </button>
            <button 
              onClick={() => {
                if (name.trim()) {
                  onSave(name.trim());
                  setName('');
                }
              }}
              disabled={!name.trim()}
              className="px-4 py-2 bg-accent text-studio-900 font-semibold rounded-lg hover:bg-[#d6b78e] transition-colors disabled:opacity-50 text-sm"
            >
              Lưu
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
