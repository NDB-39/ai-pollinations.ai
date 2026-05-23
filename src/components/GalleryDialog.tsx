import { X, Copy, Download, Image as ImageIcon, Check, Trash2, Maximize2, Sparkles } from "lucide-react";
import { useState } from "react";
import { ConfirmDialog } from "./ConfirmDialog";

export interface GalleryItem {
  id: string;
  url: string;
  prompt: string;
  createdAt: number;
}

export interface GalleryDialogProps {
  isOpen: boolean;
  gallery: GalleryItem[];
  onClose: () => void;
  onUsePrompt: (prompt: string) => void;
  onDelete: (id: string) => void;
  onUpscale?: (item: GalleryItem) => void;
}

export function GalleryDialog({ isOpen, gallery, onClose, onUsePrompt, onDelete, onUpscale }: GalleryDialogProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [zoomedImageUrl, setZoomedImageUrl] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDownload = async (url: string) => {
    try {
      const res = await fetch(url);
      const blob = await res.blob();
      const localUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = localUrl;
      a.download = `CineTech_Gallery_${Date.now()}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(localUrl);
    } catch {}
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-2 md:p-4 bg-black/80 backdrop-blur-sm">
      <div className="glass-panel border border-white/10 rounded-2xl w-full max-w-5xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh] animate-in fade-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center p-4 md:p-5 border-b border-white/5 shrink-0">
          <div className="flex items-center gap-3">
            <ImageIcon className="w-5 h-5 text-accent" />
            <h2 className="text-lg md:text-xl font-serif font-semibold text-studio-50">Bộ Sưu Tập (Gallery)</h2>
          </div>
          <button onClick={onClose} className="p-2 text-studio-400 hover:text-studio-100 hover:bg-white/5 rounded-lg transition-colors">
            <X className="w-5 h-5 md:w-6 md:h-6" />
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
          {gallery.length === 0 ? (
            <div className="text-center py-20 text-studio-500">
              <ImageIcon className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p>Chưa có tác phẩm nào trong Bộ Sưu Tập.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6 content-start">
              {gallery.map(item => (
                <div key={item.id} className="bg-studio-900/50 border border-white/5 rounded-xl overflow-hidden group hover:border-accent/40 transition-colors flex flex-col backdrop-blur-sm">
                  <div 
                    className="relative aspect-square w-full bg-studio-950 overflow-hidden cursor-pointer"
                    onClick={() => setZoomedImageUrl(item.url)}
                  >
                    <img 
                      src={item.url} 
                      alt="Gallery Item" 
                      loading="lazy"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-3 opacity-0 group-hover:opacity-100 transition-opacity flex justify-end">
                      <Maximize2 className="w-4 h-4 text-white drop-shadow-md" />
                    </div>
                  </div>
                  
                  <div className="p-3 flex flex-col gap-3 flex-1">
                    <p className="text-[11px] text-studio-300 line-clamp-3 leading-relaxed font-sans" title={item.prompt}>
                      {item.prompt}
                    </p>

                    <div className="flex flex-wrap gap-1.5 mt-auto">
                      <button 
                        onClick={() => {
                          onClose();
                          onUsePrompt(item.prompt);
                        }}
                        className="flex-1 min-w-[70px] py-1.5 bg-accent text-studio-950 text-[10px] sm:text-xs font-semibold rounded-lg hover:bg-accent-hover transition-colors shadow-sm"
                      >
                        Dùng Lại
                      </button>
                      {onUpscale && (
                        <button 
                          onClick={() => onUpscale(item)}
                          className="flex-1 min-w-[70px] py-1.5 bg-studio-800/80 hover:bg-studio-700 text-accent text-[10px] sm:text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-1 border border-white/5 shadow-sm"
                          title="Nâng cấp độ phân giải 4K"
                        >
                          <Sparkles className="w-3 h-3 text-accent" /> Upscale
                        </button>
                      )}
                      
                      <button 
                        onClick={() => handleCopy(item.id, item.prompt)}
                        className="p-1.5 bg-studio-800/80 hover:bg-studio-700 text-studio-100 rounded-lg transition-colors border border-white/5"
                        title="Copy Prompt"
                      >
                        {copiedId === item.id ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                      
                      <button 
                        onClick={() => handleDownload(item.url)}
                        className="p-1.5 bg-studio-800/80 hover:bg-studio-700 text-studio-100 rounded-lg transition-colors border border-white/5"
                        title="Tải ảnh"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>
                      
                      <button 
                        onClick={() => setDeletingId(item.id)}
                        className="p-1.5 bg-red-950/40 hover:bg-red-900/60 text-red-400 hover:text-red-300 rounded-lg transition-colors border border-red-900/30"
                        title="Xóa ảnh"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  
                  <div className="px-3 py-2 text-[10px] text-studio-500 flex justify-between border-t border-white/5 bg-studio-950/30">
                    <span>{new Date(item.createdAt).toLocaleDateString('vi-VN')}</span>
                    <span>{new Date(item.createdAt).toLocaleTimeString('vi-VN')}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      </div>

      <ConfirmDialog
        isOpen={!!deletingId}
        title="Xóa khỏi bộ sưu tập"
        message="Bạn có chắc chắn muốn xóa ảnh này khỏi bộ sưu tập?"
        onConfirm={() => {
          if (deletingId) {
            onDelete(deletingId);
            setDeletingId(null);
          }
        }}
        onCancel={() => setDeletingId(null)}
      />
      
      {/* Zoom Modal */}
      {zoomedImageUrl && (
        <div 
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/95 p-4 cursor-zoom-out animate-in fade-in duration-200"
          onClick={() => setZoomedImageUrl(null)}
        >
          <img 
            src={zoomedImageUrl} 
            alt="Zoomed Artwork" 
            className="max-w-full max-h-full object-contain animate-in zoom-in-95 duration-300" 
          />
          <button 
            className="absolute top-6 right-6 p-2 text-studio-400 hover:text-white bg-studio-900/50 rounded-full transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              setZoomedImageUrl(null);
            }}
          >
            <X className="w-6 h-6" />
          </button>
        </div>
      )}
    </>
  );
}
