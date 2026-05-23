export interface AlertDialogProps {
  isOpen: boolean;
  message: string;
  onClose: () => void;
}

export function AlertDialog({ isOpen, message, onClose }: AlertDialogProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-studio-800 border border-studio-600 rounded-xl w-full max-w-sm shadow-2xl p-6 text-center space-y-6">
        <h3 className="text-xl font-serif text-studio-50">Thông báo</h3>
        <p className="text-studio-300 text-sm leading-relaxed">{message}</p>
        <button
          id="btn-alert-ok"
          onClick={onClose}
          className="px-8 py-2 bg-accent hover:bg-[#d6b78e] text-studio-900 font-medium rounded-lg transition-colors w-full"
        >
          Đồng ý
        </button>
      </div>
    </div>
  );
}
