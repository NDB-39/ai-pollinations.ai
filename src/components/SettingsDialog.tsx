import { X, Trash2 } from "lucide-react";
import { useState } from "react";
import { ConfirmDialog } from "./ConfirmDialog";

export interface Settings {
  useGemini: boolean;
  apiKey: string;
  customModel: string;
  geminiModel: string;
  proxyModel?: string;
}

interface SettingsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  settings: Settings;
  onSettingsChange: (newSettings: Settings) => void;
}

export function SettingsDialog({ isOpen, onClose, settings, onSettingsChange }: SettingsDialogProps) {
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  if (!isOpen) return null;

  const handleResetData = () => {
    localStorage.clear();
    window.location.reload();
  };

  return (
    <div id="settings-dialog-overlay" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        id="settings-dialog-content"
        className="glass-panel border border-white/10 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in slide-in-from-bottom-4 duration-300"
      >
        <div className="flex justify-between items-center p-5 border-b border-white/5 relative shrink-0">
          <h2 className="text-xl font-serif font-semibold text-studio-50 tracking-wide">Cài đặt Hệ thống</h2>
          <button 
            id="close-settings-btn"
            onClick={onClose}
            className="p-2 text-studio-400 hover:text-studio-100 hover:bg-white/5 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6 overflow-y-auto custom-scrollbar flex-1">
          <div className="space-y-4">
            <h3 className="text-sm font-semibold tracking-wider text-studio-400 uppercase">Cấu hình Nội Suy (Gemini)</h3>
            
            <label className="flex items-center space-x-3 cursor-pointer group">
              <div className="relative">
                <input 
                  type="checkbox"
                  id="use-gemini-toggle"
                  className="sr-only"
                  checked={settings.useGemini}
                  onChange={(e) => onSettingsChange({ ...settings, useGemini: e.target.checked })}
                />
                <div className={`block w-11 h-6 rounded-full transition-colors ${settings.useGemini ? 'bg-accent' : 'bg-studio-600'}`}></div>
                <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${settings.useGemini ? 'translate-x-5' : ''}`}></div>
              </div>
              <span className="text-studio-100 group-hover:text-white transition-colors">
                {settings.useGemini ? 'Dùng Gemini AI Nội Suy Ý Tưởng' : 'Dùng API Proxy Nội Suy Ý Tưởng'}
              </span>
            </label>

            {settings.useGemini ? (
              <div className="space-y-2 mt-4 animate-in fade-in slide-in-from-top-2 duration-300">
                <label htmlFor="gemini-api-key" className="block text-sm text-studio-300">
                  Google Gemini API Key
                </label>
                <input
                  id="gemini-api-key"
                  type="password"
                  placeholder="Nhập API Key của bạn (bắt buộc)"
                  value={settings.apiKey}
                  onChange={(e) => onSettingsChange({ ...settings, apiKey: e.target.value })}
                  className="w-full bg-studio-900 border border-studio-600 rounded-lg px-4 py-2 text-studio-100 focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all placeholder:text-studio-600"
                />
                <p className="text-xs text-studio-400 mt-1 mb-2">
                  API Key chỉ lưu trên trình duyệt của bạn (Local Storage) để bảo mật.
                </p>
                
                <label htmlFor="gemini-custom-model" className="block text-sm text-studio-300 mt-4 pt-4 border-t border-studio-700/50">
                  Model Gemini (Tùy chọn)
                </label>
                <input
                  id="gemini-custom-model"
                  type="text"
                  placeholder="VD: gemini-3.1-pro, gemini-2.5-pro..."
                  value={settings.geminiModel || ''}
                  onChange={(e) => onSettingsChange({ ...settings, geminiModel: e.target.value })}
                  className="w-full bg-studio-900 border border-studio-600 rounded-lg px-4 py-2 text-studio-100 focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all placeholder:text-studio-600"
                />
                <p className="text-[11px] text-studio-400 mt-1">
                  Nhập ID của model Gemini bạn muốn dùng (ngăn cách bởi dấu phẩy ",").
                </p>
              </div>
            ) : (
              <div className="space-y-2 mt-4 animate-in fade-in slide-in-from-top-2 duration-300">
                <label htmlFor="proxy-custom-model" className="block text-sm text-studio-300">
                  Model ID (Tùy chọn)
                </label>
                <input
                  id="proxy-custom-model"
                  type="text"
                  placeholder="VD: openai, mistral, qwen-coder, gemini-fast..."
                  value={settings.proxyModel || ''}
                  onChange={(e) => onSettingsChange({ ...settings, proxyModel: e.target.value })}
                  className="w-full bg-studio-900 border border-studio-600 rounded-lg px-4 py-2 text-studio-100 focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all placeholder:text-studio-600"
                />

                <p className="text-[11px] text-studio-400 mt-2 leading-relaxed">
                  Nhập ID của model bạn muốn dùng qua Proxy API (ngăn cách bởi dấu phẩy ",").
                  <br/>
                  <span className="text-accent text-[10px]">Lưu ý: API Proxy đã được tích hợp sẵn (không cần nhập thêm URL hay API Key). Bạn có thể dùng các model Premium thoải mái!</span>
                </p>
              </div>
            )}
            
            <div className="pt-4 border-t border-white/5 space-y-2 mt-2">
              <label htmlFor="custom-model" className="block text-sm font-semibold tracking-wider text-studio-400 uppercase">
                Render Model (Pollinations.ai)
              </label>
              <input
                id="custom-model"
                type="text"
                placeholder="VD: flux, gptimage-large, zimage..."
                value={settings.customModel}
                onChange={(e) => onSettingsChange({ ...settings, customModel: e.target.value })}
                className="w-full bg-studio-900/50 border border-white/10 rounded-lg px-4 py-3 text-studio-100 focus:outline-none focus:border-studio-400 focus:ring-1 focus:ring-studio-400 transition-all placeholder:text-studio-600"
              />
              <p className="text-xs text-studio-400 mt-1">
                Nhập ID của các model bạn muốn sử dụng (phân cách bằng dấu phẩy ",").
              </p>
            </div>
            
            <div className="pt-6 mt-4">
               <button
                 onClick={() => setShowResetConfirm(true)}
                 className="w-full py-3 bg-red-950/30 hover:bg-red-900/40 text-red-400 border border-red-900/30 rounded-xl flex items-center justify-center gap-2 transition-colors text-sm font-medium uppercase tracking-wider"
               >
                 <Trash2 className="w-4 h-4" />
                 Reset Dữ Liệu Ứng Dụng
               </button>
               <p className="text-center mt-3 text-[10px] text-studio-500">
                 Xóa toàn bộ Cài đặt, Lịch sử, Tác phẩm khỏi trình duyệt.
               </p>
            </div>
          </div>
        </div>

        <div className="p-4 md:p-5 border-t border-white/5 bg-studio-950/30 flex justify-end shrink-0">
          <button
            id="close-settings-done-btn"
            onClick={onClose}
            className="px-6 py-2.5 bg-accent hover:bg-accent-hover text-studio-950 font-medium rounded-xl transition-colors"
          >
            Hoàn tất
          </button>
        </div>
      </div>

      <ConfirmDialog
        isOpen={showResetConfirm}
        title="Xóa toàn bộ dữ liệu?"
        message="Hành động này sẽ xóa vĩnh viễn tất cả Cài đặt, Lịch sử prompt và Bộ sưu tập tác phẩm trên trình duyệt này. Đồng thời tải lại trang."
        onConfirm={handleResetData}
        onCancel={() => setShowResetConfirm(false)}
      />
    </div>
  );
}
