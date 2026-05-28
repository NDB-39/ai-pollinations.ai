import { X, ZoomIn, ZoomOut, Maximize, Settings2, Hash, Maximize2 } from "lucide-react";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";

export interface ImageZoomMetadata {
  model?: string;
  width?: number;
  height?: number;
  seed?: number;
  prompt?: string;
}

interface ImageZoomModalProps {
  imageUrl: string;
  onClose: () => void;
  metadata?: ImageZoomMetadata | null;
}

export function ImageZoomModal({ imageUrl, onClose, metadata }: ImageZoomModalProps) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 animate-in fade-in duration-200">
      <button 
        className="absolute top-6 right-6 p-2 z-[110] text-studio-400 hover:text-white bg-studio-900/50 rounded-full transition-colors cursor-pointer"
        onClick={onClose}
      >
        <X className="w-6 h-6" />
      </button>

      {/* Thông tin Overlay */}
      {metadata && (
        <div className="absolute top-6 left-6 z-[110] max-w-sm pointer-events-none">
          <div className="bg-studio-900/40 backdrop-blur-md rounded-2xl p-4 border border-white/10 shadow-2xl space-y-3 pointer-events-auto">
            {metadata.model && (
              <div className="flex items-center gap-2 text-sm text-studio-200">
                <Settings2 className="w-4 h-4 text-studio-400" />
                <span className="font-medium text-white">{metadata.model}</span>
              </div>
            )}
            
            {(metadata.width && metadata.height) && (
              <div className="flex items-center gap-2 text-sm text-studio-200">
                <Maximize2 className="w-4 h-4 text-studio-400" />
                <span>{metadata.width} &times; {metadata.height}</span>
              </div>
            )}
            
            {metadata.seed && (
              <div className="flex items-center gap-2 text-sm text-studio-200">
                <Hash className="w-4 h-4 text-studio-400" />
                <span className="font-mono text-xs">{metadata.seed}</span>
              </div>
            )}
          </div>
        </div>
      )}

      <TransformWrapper
        initialScale={1}
        minScale={0.5}
        maxScale={8}
        centerOnInit={true}
        wheel={{ step: 0.02 }}
        smooth={true}
      >
        {({ zoomIn, zoomOut, resetTransform }) => (
          <>
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-2 z-[110] bg-studio-900/70 p-2 rounded-2xl backdrop-blur-md border border-white/10 shadow-2xl">
              <button 
                onClick={() => zoomOut()} 
                className="p-3 text-studio-300 hover:text-white hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
                title="Thu nhỏ"
              >
                <ZoomOut className="w-5 h-5" />
              </button>
              <div className="w-px h-6 bg-white/10 mx-1"></div>
              <button 
                onClick={() => resetTransform()} 
                className="p-3 text-studio-300 hover:text-white hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
                title="Mặc định"
              >
                <Maximize className="w-5 h-5" />
              </button>
              <div className="w-px h-6 bg-white/10 mx-1"></div>
              <button 
                onClick={() => zoomIn()} 
                className="p-3 text-studio-300 hover:text-white hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
                title="Phóng to"
              >
                <ZoomIn className="w-5 h-5" />
              </button>
            </div>
            
            <TransformComponent wrapperClass="!w-screen !h-screen cursor-grab active:cursor-grabbing" contentClass="!w-full !h-full flex items-center justify-center">
              <img 
                src={imageUrl} 
                alt="Zoomed Artwork" 
                className="max-w-full max-h-full object-contain pointer-events-auto select-none" 
              />
            </TransformComponent>
          </>
        )}
      </TransformWrapper>
    </div>
  );
}
