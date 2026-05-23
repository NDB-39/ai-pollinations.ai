import { AlertTriangle } from "lucide-react";

export interface ConfirmDialogProps {
  isOpen: boolean;
  title?: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({ isOpen, title = "Xác nhận", message, onConfirm, onCancel }: ConfirmDialogProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-studio-800 border border-studio-600 rounded-xl w-full max-w-sm shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-6 text-center space-y-4">
          <div className="mx-auto w-12 h-12 bg-red-900/30 text-red-400 rounded-full flex items-center justify-center mb-4">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-serif text-studio-50">{title}</h3>
          <p className="text-studio-300 text-sm leading-relaxed">{message}</p>
        </div>
        <div className="flex border-t border-studio-700 bg-studio-900/50">
          <button
            onClick={onCancel}
            className="flex-1 px-6 py-4 text-studio-300 hover:text-studio-100 font-medium hover:bg-studio-800 transition-colors"
          >
            Hủy
          </button>
          <div className="w-px bg-studio-700"></div>
          <button
            onClick={onConfirm}
            className="flex-1 px-6 py-4 text-red-400 hover:text-red-300 font-medium hover:bg-studio-800 transition-colors"
          >
            Đồng ý
          </button>
        </div>
      </div>
    </div>
  );
}
