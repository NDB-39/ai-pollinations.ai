import React, { useRef, useState, useEffect } from 'react';
import { X, Brush, Eraser, Download, Check, Sparkles } from 'lucide-react';

interface InpaintModalProps {
  imageUrl: string;
  onClose: () => void;
  onInpaint: (maskDataUrl: string, prompt: string) => void;
}

export function InpaintModal({ imageUrl, onClose, onInpaint }: InpaintModalProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageCanvasRef = useRef<HTMLCanvasElement>(null);
  
  const [isDrawing, setIsDrawing] = useState(false);
  const [brushSize, setBrushSize] = useState(30);
  const [isEraser, setIsEraser] = useState(false);
  const [prompt, setPrompt] = useState('');
  
  // Setup canvases
  useEffect(() => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = imageUrl;
    img.onload = () => {
      const cvs = canvasRef.current;
      const imgCvs = imageCanvasRef.current;
      const container = containerRef.current;
      if (!cvs || !imgCvs || !container) return;

      // Fit inside container
      const maxWidth = container.clientWidth - 32;
      const maxHeight = container.clientHeight - 90;
      let width = img.width;
      let height = img.height;

      const ratio = Math.min(maxWidth / width, maxHeight / height);
      if (ratio < 1) {
        width *= ratio;
        height *= ratio;
      }

      imgCvs.width = width;
      imgCvs.height = height;
      cvs.width = width;
      cvs.height = height;

      const imgCtx = imgCvs.getContext('2d');
      imgCtx?.drawImage(img, 0, 0, width, height);
      
      const ctx = cvs.getContext('2d');
      if (ctx) {
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
      }
    };
  }, [imageUrl]);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    draw(e);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    e.preventDefault();
    
    // Support touch and mouse
    let clientX, clientY;
    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    const rect = canvas.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    ctx.lineWidth = brushSize;
    
    if (isEraser) {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.strokeStyle = 'rgba(0,0,0,1)';
    } else {
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = 'rgba(201,167,124,0.6)'; // Tiệp với màu accent nhưng blur ra
    }

    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    const ctx = canvasRef.current?.getContext('2d');
    if (ctx) ctx.beginPath(); // Reset the path
  };
  
  const handleClear = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (ctx && canvas) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  };

  const handleSubmit = () => {
    if (!prompt.trim()) {
      alert("Vui lòng nhập prompt để sửa chi tiết đã bôi!");
      return;
    }
    const canvas = canvasRef.current;
    if (canvas) {
      // Create a clean black and white mask
      const maskCanvas = document.createElement('canvas');
      maskCanvas.width = canvas.width;
      maskCanvas.height = canvas.height;
      const mCtx = maskCanvas.getContext('2d');
      if (mCtx) {
        mCtx.fillStyle = 'black';
        mCtx.fillRect(0, 0, maskCanvas.width, maskCanvas.height);
        
        // Draw the user lines as white
        mCtx.globalCompositeOperation = 'source-over';
        mCtx.drawImage(canvas, 0, 0);
        // User drawn strokes are RGBA(201,167,124,0.6) on transparent. We need to threshold them to white.
        const imgData = mCtx.getImageData(0, 0, maskCanvas.width, maskCanvas.height);
        for(let i=0; i<imgData.data.length; i+=4) {
          if(imgData.data[i] !== 0) { // Not black background
            imgData.data[i] = 255;
            imgData.data[i+1] = 255;
            imgData.data[i+2] = 255;
            imgData.data[i+3] = 255;
          }
        }
        mCtx.putImageData(imgData, 0, 0);
      }
      onInpaint(maskCanvas.toDataURL('image/png'), prompt);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/90 backdrop-blur-md">
      <div className="glass-panel border border-white/10 rounded-2xl w-full max-w-6xl shadow-2xl overflow-hidden flex flex-col h-[95vh] animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-white/5 shrink-0">
          <div className="flex items-center gap-3">
            <Brush className="w-5 h-5 text-accent" />
            <h2 className="text-lg font-serif font-semibold text-studio-50">In-painting (Vẽ đè & Sửa lỗi chi tiết)</h2>
          </div>
          <button onClick={onClose} className="p-2 text-studio-400 hover:text-studio-100 hover:bg-white/5 rounded-lg transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content Workspace */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative" ref={containerRef}>
          {/* Drawing Area */}
          <div className="flex-1 overflow-auto flex items-center justify-center bg-studio-950 relative p-4 custom-scrollbar pattern-cross text-studio-950/20">
             <div className="relative shadow-2xl rounded-lg overflow-hidden border border-white/10" style={{ cursor: isEraser ? 'cell' : 'crosshair' }}>
               <canvas ref={imageCanvasRef} className="absolute inset-0 pointer-events-none" />
               <canvas 
                 ref={canvasRef} 
                 className="relative z-10 touch-none"
                 onMouseDown={startDrawing}
                 onMouseMove={draw}
                 onMouseUp={stopDrawing}
                 onMouseLeave={stopDrawing}
                 onTouchStart={startDrawing}
                 onTouchMove={draw}
                 onTouchEnd={stopDrawing}
               />
             </div>
          </div>
          
          {/* Controls Panel */}
          <div className="w-full md:w-80 border-t md:border-t-0 md:border-l border-white/5 bg-studio-900/50 p-4 shrink-0 overflow-y-auto custom-scrollbar flex flex-col gap-5">
            <div>
               <h3 className="text-sm font-medium text-studio-300 mb-3">Công cụ cọ</h3>
               <div className="flex gap-2">
                 <button 
                  onClick={() => setIsEraser(false)}
                  className={`flex-1 py-2 flex items-center justify-center gap-2 rounded-lg text-sm transition-colors ${!isEraser ? 'bg-accent text-studio-950 font-bold' : 'bg-studio-800 text-studio-400 hover:bg-studio-700'}`}
                 >
                   <Brush className="w-4 h-4" /> Vẽ Mặt Nạ
                 </button>
                 <button 
                  onClick={() => setIsEraser(true)}
                  className={`flex-1 py-2 flex items-center justify-center gap-2 rounded-lg text-sm transition-colors ${isEraser ? 'bg-studio-700 text-studio-100 font-bold border border-white/10' : 'bg-studio-800 text-studio-400 hover:bg-studio-700'}`}
                 >
                   <Eraser className="w-4 h-4" /> Tẩy
                 </button>
               </div>
            </div>
            
            <div>
               <div className="flex justify-between items-center mb-2">
                 <label className="text-sm font-medium text-studio-300">Cỡ cọ: {brushSize}px</label>
               </div>
               <input 
                 type="range" 
                 min="5" 
                 max="100" 
                 value={brushSize} 
                 onChange={(e) => setBrushSize(parseInt(e.target.value))}
                 className="w-full accent-accent"
               />
            </div>
            
            <div className="flex gap-2">
               <button onClick={handleClear} className="w-full py-2 bg-studio-800 hover:bg-studio-700 text-studio-300 text-sm rounded-lg transition-colors border border-white/5">
                 Xóa trống Mặt Nạ
               </button>
            </div>

            <div className="divider h-px w-full bg-white/5 my-2"></div>

            <div className="flex-1 flex flex-col">
               <label className="text-sm font-medium text-studio-300 mb-2">Thay thế bằng gì?</label>
               <textarea 
                 value={prompt}
                 onChange={(e) => setPrompt(e.target.value)}
                 className="w-full h-32 bg-studio-950 border border-studio-700 rounded-xl p-3 text-studio-50 text-sm focus:border-accent focus:ring-1 focus:ring-accent resize-none custom-scrollbar mb-4"
                 placeholder="VD: Một bàn tay hoàn hảo, khuôn mặt mỉm cười..."
               />
               
               <button 
                 onClick={handleSubmit} 
                 className="w-full py-3 bg-accent hover:bg-accent-hover text-studio-950 font-bold rounded-xl transition-colors shadow-lg flex items-center justify-center gap-2 mt-auto"
               >
                 <Sparkles className="w-5 h-5" />
                 Tiến hành In-paint
               </button>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
