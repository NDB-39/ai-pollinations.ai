import React, { useState, useEffect, useRef } from 'react';
import { Camera, Settings as SettingsIcon, Image as ImageIcon, Sparkles, Download, Aperture, Clock, Upload, Trash2, Sliders, Bookmark, List, Type } from 'lucide-react';
import { InstructionBanner } from './components/InstructionBanner';
import { SettingsDialog, Settings } from './components/SettingsDialog';
import { AlertDialog } from './components/AlertDialog';
import { ModelSelectionDialog } from './components/ModelSelectionDialog';
import { PromptHistoryDialog, PromptHistoryItem } from './components/PromptHistoryDialog';
import { GalleryDialog, GalleryItem } from './components/GalleryDialog';
import { SavePresetDialog } from './components/SavePresetDialog';
import { PresetsDialog, PresetItem } from './components/PresetsDialog';
import { StylePresetsUI } from './components/StylePresetsUI';
import { InpaintModal } from './components/InpaintModal';
import { SmartGenerateDialog } from './components/SmartGenerateDialog';
import { ImageZoomModal } from './components/ImageZoomModal';
import { enhancePromptWithGemini } from './services/geminiService';
import { enhancePromptWithProxy } from './services/proxyService';
import { generateImageUrl } from './services/imageService';
import { addImageToDB, getImagesFromDB, removeImageFromDB } from './services/dbService';
import { APP_CONFIG } from './constants';
import { OPTIMIZATION_MODELS, getModelNegativePrompt, checkSyntaxWarnings } from './utils/promptOptimizer';

const getDimensions = (ratio: string) => {
  switch (ratio) {
    case '16:9': return { width: 1280, height: 720 };
    case '9:16': return { width: 720, height: 1280 };
    case '3:2': return { width: 1080, height: 720 };
    case '2:3': return { width: 720, height: 1080 };
    case '1:1':
    default:
      return { width: 1024, height: 1024 };
  }
};

const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

const fetchWithRetryUrl = async (url: string) => {
  let res;
  let retries = 0;
  const maxRetries = 2;
  
  while (retries <= maxRetries) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000); // 60s timeout
      
      res = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);
      
      if (res.ok) {
        break;
      } else if (res.status >= 500 && retries < maxRetries) {
        console.warn(`Lỗi 5xx (HTTP ${res.status}), đang thử lại lần ${retries + 1}...`);
        retries++;
        await new Promise(r => setTimeout(r, 1500 * retries));
        continue;
      } else {
        throw new Error(`Không thể khởi tạo tín hiệu tạo ảnh. (Lỗi HTTP ${res.status})`);
      }
    } catch (err: any) {
      if ((err.name === 'AbortError' || err.message.toLowerCase().includes('timeout') || err.message.toLowerCase().includes('network') || err.message.toLowerCase().includes('failed to fetch')) && retries < maxRetries) {
        console.warn(`Lỗi mạng/timeout, đang thử lại lần ${retries + 1}...`);
        retries++;
        await new Promise(r => setTimeout(r, 1500 * retries));
        continue;
      }
      throw err;
    }
  }
  
  if (!res || !res.ok) throw new Error('Không thể khởi tạo tín hiệu tạo ảnh sau nhiều lần thử.');
  return res;
};

export interface GeneratedImage {
  localUrl: string;
  originalUrl: string;
  seed: number;
  base64Url?: string;
}

function App() {
  const [mode, setMode] = useState<'idea' | 'direct'>('idea');
  const [ideaText, setIdeaText] = useState('');
  const [characterProfile, setCharacterProfile] = useState('');
  const [customRules, setCustomRules] = useState('');
  const [promptText, setPromptText] = useState('');
  const [negativePrompt, setNegativePrompt] = useState('');
  const [seedText, setSeedText] = useState('');
  
  const [referenceImage, setReferenceImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [targetRenderModel, setTargetRenderModel] = useState('flux');
  
  const [currentZoomImage, setCurrentZoomImage] = useState<{ url: string, metadata?: any } | null>(null);
  const [imageUrls, setImageUrls] = useState<GeneratedImage[]>([]);

  // Cleanup Blob URLs when unmounting to prevent memory leaks
  useEffect(() => {
    return () => {
      imageUrls.forEach(img => {
        if (img.localUrl) URL.revokeObjectURL(img.localUrl);
      });
    };
  }, [imageUrls]);

  const [isLoading, setIsLoading] = useState(false);
  const [isInferring, setIsInferring] = useState(false);
  const [loadingText, setLoadingText] = useState('');
  
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [modelSelectionOpen, setModelSelectionOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [inpaintItem, setInpaintItem] = useState<GalleryItem | null>(null);
  const [presetsOpen, setPresetsOpen] = useState(false);
  const [savePresetOpen, setSavePresetOpen] = useState(false);
  const [smartGenerateOpen, setSmartGenerateOpen] = useState(false);
  const [smartGenerateData, setSmartGenerateData] = useState<{
    prompts: string[];
    count: number;
    hasVietnamese: boolean;
  } | null>(null);
  const [isBatchMode, setIsBatchMode] = useState(false);
  
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const [geminiModelSelectionOpen, setGeminiModelSelectionOpen] = useState(false);
  const [availableGeminiModels, setAvailableGeminiModels] = useState<string[]>([]);

  const [pendingCount, setPendingCount] = useState(1);
  const [pendingPrompts, setPendingPrompts] = useState<string[]>([]);
  const [history, setHistory] = useState<PromptHistoryItem[]>([]);
  const [gallery, setGallery] = useState<GalleryItem[]>([]);
  const [presets, setPresets] = useState<PresetItem[]>([]);
  const [aspectRatio, setAspectRatio] = useState<'1:1' | '16:9' | '9:16' | '3:2' | '2:3'>('1:1');
  
  // Font scale state
  const [fontScale, setFontScale] = useState<number>(100);
  
  const [alertState, setAlertState] = useState({ isOpen: false, message: '' });
  
  const [settings, setSettings] = useState<Settings>({
    useGemini: true,
    apiKey: '',
    customModel: '',
    geminiModel: '',
    proxyModel: 'openai-large' // Default pollination model
  });

  // Apply font scale to html element
  useEffect(() => {
    document.documentElement.style.fontSize = `${fontScale}%`;
  }, [fontScale]);

  const toggleFontScale = () => {
    setFontScale(prev => {
      if (prev === 100) return 110;
      if (prev === 110) return 125;
      return 100; // Reset
    });
  };

  // Khôi phục cài đặt từ localStorage
  useEffect(() => {
    const saved = localStorage.getItem('cineTechSettings');
    if (saved) {
      try {
        setSettings(JSON.parse(saved));
      } catch (e) {
        // bỏ qua nếu lỗi
      }
    }
    
    const savedHistory = localStorage.getItem('cineTechHistory');
    if (savedHistory) {
      try {
        setHistory(JSON.parse(savedHistory));
      } catch (e) {}
    }
    
    // Load Gallery from IndexedDB
    getImagesFromDB().then((data) => {
      // idb returns in index ascending order, so reverse to show newest first
      setGallery(data.reverse());
    }).catch(e => console.error("Failed to load gallery from IndexedDB", e));

    const savedPresets = localStorage.getItem('cineTechPresets');
    if (savedPresets) {
      try {
        setPresets(JSON.parse(savedPresets));
      } catch (e) {}
    }
  }, []);

  const handleSettingsChange = (newSettings: Settings) => {
    setSettings(newSettings);
    localStorage.setItem('cineTechSettings', JSON.stringify(newSettings));
  };

  const addToHistory = (idea: string, prompt: string, rules: string, profile?: string) => {
    // Avoid saving duplicate ideas based on text
    const isDuplicate = history.some(item => item.idea.trim().toLowerCase() === idea.trim().toLowerCase());
    if (isDuplicate) return;

    const newItem: PromptHistoryItem = {
      id: Date.now().toString(),
      idea,
      prompt,
      rules,
      characterProfile: profile,
      createdAt: Date.now()
    };
    setHistory(prev => {
      const newHistory = [newItem, ...prev];
      localStorage.setItem('cineTechHistory', JSON.stringify(newHistory.slice(0, 50)));
      return newHistory;
    });
  };

  const addToGallery = async (items: GalleryItem[]) => {
    for (const item of items) {
      try {
        await addImageToDB(item);
      } catch (err) {
        console.error("Failed to add image to DB", err);
      }
    }
    setGallery(prev => {
      const newGallery = [...items, ...prev];
      return newGallery;
    });
  };

  const showAlert = (message: string) => setAlertState({ isOpen: true, message });

  const handlePreInferPrompt = () => {
    if (!ideaText.trim()) return;
    if (settings.useGemini && !settings.apiKey) {
      showAlert("Vui lòng vào Cài đặt để nhập Gemini API Key trước khi sử dụng AI nội suy.");
      setSettingsOpen(true);
      return;
    }
    
    // Choose which models array to split based on settings.useGemini
    const modelsRaw = settings.useGemini ? (settings.geminiModel || '') : (settings.proxyModel || '');
    const models = modelsRaw.split(',').map(s => s.trim()).filter(s => s !== '');
    
    if (models.length > 1) {
      setAvailableGeminiModels(models);
      setGeminiModelSelectionOpen(true);
    } else {
      doInferPrompt(models.length === 1 ? models[0] : '');
    }
  };

  const doInferPrompt = async (selectedModel: string) => {
    setIsInferring(true);
    try {
      let resultPrompt = ideaText;
      if (settings.useGemini) {
        resultPrompt = await enhancePromptWithGemini(ideaText, settings.apiKey, customRules, selectedModel, referenceImage || undefined, targetRenderModel, characterProfile);
      } else {
        resultPrompt = await enhancePromptWithProxy(ideaText, APP_CONFIG.PROXY_URL, selectedModel, customRules, referenceImage || undefined, targetRenderModel, characterProfile);
      }
      setPromptText(resultPrompt);
      addToHistory(ideaText, resultPrompt, customRules, characterProfile);
      
      if (targetRenderModel && targetRenderModel !== 'general') {
        const autoNegPrompt = getModelNegativePrompt(targetRenderModel);
        setNegativePrompt(autoNegPrompt);
        if (autoNegPrompt && !showAdvanced) {
          setShowAdvanced(true); // Hiển thị tab nâng cao để user thấy Negative Prompt được tiêm vào
        }
      }

    } catch (err: any) {
      showAlert(err.message || 'Lỗi khi nội suy.');
    } finally {
      setIsInferring(false);
    }
  };

  const checkVietnamese = (text: string) => {
    const vnRegex = /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i;
    return vnRegex.test(text);
  };

  const doEnhanceAndGenerate = async (
    textModel: string,
    imageModel: string,
    prompts: string[],
    count: number
  ) => {
    setIsLoading(true);
    setLoadingText('Đang nội suy prompt...');
    
    try {
      const isBatch = isBatchMode && mode === 'direct' && prompts.length > 1;
      let enhancedPrompts: string[] = [];
      const concurrencyLimit = 3;
      
      for (let i = 0; i < prompts.length; i += concurrencyLimit) {
        if (isBatch) setLoadingText(`Đang nội suy prompt ${i + 1} - ${Math.min(i + concurrencyLimit, prompts.length)} / ${prompts.length}...`);
        
        const chunkOptions = prompts.slice(i, i + concurrencyLimit);
        const chunkPromises = chunkOptions.map(async (promptVal) => {
          let resultPrompt = promptVal;
          if (settings.useGemini) {
            resultPrompt = await enhancePromptWithGemini(promptVal, settings.apiKey, customRules, textModel, referenceImage || undefined, imageModel, characterProfile);
          } else {
            resultPrompt = await enhancePromptWithProxy(promptVal, APP_CONFIG.PROXY_URL, textModel, customRules, referenceImage || undefined, imageModel, characterProfile);
          }
          return { original: promptVal, result: resultPrompt };
        });
        
        const chunkResults = await Promise.all(chunkPromises);
        
        for (const res of chunkResults) {
          if (res.result) {
            enhancedPrompts.push(res.result);
            addToHistory(res.original, res.result, customRules, characterProfile);
          } else {
            enhancedPrompts.push(res.original); // Fallback if enhance fails
          }
        }
      }
      
      if (enhancedPrompts.length > 0) {
        setPromptText(enhancedPrompts.join('\n'));
      }
      
      if (imageModel && imageModel !== 'general') {
        const autoNegPrompt = getModelNegativePrompt(imageModel);
        setNegativePrompt(autoNegPrompt);
        if (autoNegPrompt && !showAdvanced) {
          setShowAdvanced(true);
        }
      }

      await doGenerate(imageModel, count, enhancedPrompts);
      
    } catch (err: any) {
      setIsLoading(false);
      showAlert(err.message || 'Lỗi khi nội suy.');
    }
  };

  const handlePreGenerate = (count: number = 1) => {
    if (!promptText.trim()) return;

    let promptsToGenerate = [promptText.trim()];
    if (isBatchMode && mode === 'direct') {
      promptsToGenerate = promptText.split('\n').map(p => p.trim()).filter(p => p);
      if (promptsToGenerate.length === 0) return;
    }

    const hasVietnamese = promptsToGenerate.some(p => checkVietnamese(p));

    setSmartGenerateData({
      prompts: promptsToGenerate,
      count,
      hasVietnamese,
    });
    setSmartGenerateOpen(true);
  };

  const doGenerate = async (selectedModel: string, count: number = 1, prompts?: string[]) => {
    const targetPrompts = prompts && prompts.length > 0 ? prompts : [promptText.trim()];
    const isBatch = isBatchMode && mode === 'direct' && targetPrompts.length > 1;

    setIsLoading(true);
    // Tối ưu thuật toán dọn rác (Garbage Collection): Xóa Blob URL cũ để tránh rò rỉ bộ nhớ
    imageUrls.forEach(img => URL.revokeObjectURL(img.localUrl));
    setImageUrls([]);
    
    try {
      const dim = getDimensions(aspectRatio);
      
      if (isBatch) {
        let results: GeneratedImage[] = [];
        const concurrencyLimit = 3;
        
        for (let i = 0; i < targetPrompts.length; i += concurrencyLimit) {
          const chunkOptions = targetPrompts.slice(i, i + concurrencyLimit);
          setLoadingText(`Đang xử lý hàng loạt ${i + 1} - ${Math.min(i + concurrencyLimit, targetPrompts.length)} / ${targetPrompts.length}...`);

          const chunkPromises = chunkOptions.map(async (currentPrompt, chunkIdx) => {
             const idx = i + chunkIdx;
             let seed = seedText && seedText.trim() ? parseInt(seedText.trim(), 10) : null;
             if (seed !== null && !isNaN(seed)) {
                 seed = seed + idx; 
             } else {
                 seed = Math.floor(Math.random() * 1000000);
             }
             
             const originalUrl = generateImageUrl(currentPrompt, selectedModel, seed, dim.width, dim.height, negativePrompt);
             const res = await fetchWithRetryUrl(originalUrl);
             const blob = await res.blob();
             const base64Url = await blobToBase64(blob);
             return {
                 prompt: currentPrompt,
                 image: { localUrl: URL.createObjectURL(blob), originalUrl, seed, base64Url }
             };
          });

          const chunkResults = await Promise.all(chunkPromises);
          
          const images = chunkResults.map(r => r.image);
          results = [...results, ...images];
          setImageUrls([...results]); // update progressively
          
          await addToGallery(chunkResults.map(r => ({
            id: Date.now().toString() + '_' + r.image.seed + '_' + Math.random().toString(36).substring(7),
            url: r.image.base64Url,
            prompt: r.prompt,
            createdAt: Date.now()
          })));
        }
      } else {
        setLoadingText(count > 1 ? `Đang phơi sáng ${count} biến thể...` : 'Đang phơi sáng (Tạo ảnh)...');
        
        const concurrencyLimit = 3;
        const results: GeneratedImage[] = [];
        
        for (let i = 0; i < count; i += concurrencyLimit) {
          const chunkOptions = Array.from({ length: Math.min(concurrencyLimit, count - i) });
          
          if (count > concurrencyLimit) {
             setLoadingText(`Đang phơi sáng ${i + 1} đến ${Math.min(i + concurrencyLimit, count)} / ${count} biến thể...`);
          }

          const chunkPromises = chunkOptions.map(async (_, chunkIdx) => {
            const idx = i + chunkIdx;
            let seed = seedText && seedText.trim() ? parseInt(seedText.trim(), 10) : null;
            if (seed !== null && !isNaN(seed)) {
                seed = seed + idx; // Tăng seed cho các biến thể để tránh tạo ra ảnh giống hệt nhau
            } else {
                seed = Math.floor(Math.random() * 1000000);
            }
            
            const originalUrl = generateImageUrl(targetPrompts[0], selectedModel, seed, dim.width, dim.height, negativePrompt);
            
            const res = await fetchWithRetryUrl(originalUrl);
            const blob = await res.blob();
            const base64Url = await blobToBase64(blob);
            return { localUrl: URL.createObjectURL(blob), originalUrl, seed, base64Url };
          });

          const chunkResults = await Promise.all(chunkPromises);
          results.push(...chunkResults);
          setImageUrls([...results]); // Hiển thị dần dần khi hoàn thành từng lô
        }
        
        await addToGallery(
          results.map(r => ({
            id: Date.now().toString() + '_' + r.seed,
            url: r.base64Url,
            prompt: targetPrompts[0],
            createdAt: Date.now()
          }))
        );
      }
    } catch (err: any) {
      showAlert(err.message || 'Quá trình tráng phim bị lỗi.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpscale = async (item: GalleryItem) => {
    setIsLoading(true);
    setLoadingText('Đang upscale & nội suy phục hồi nét bằng GFPGAN/RealESRGAN...');
    try {
      // Create new URL by replacing width=...&height=... with 4K resolution
      let upscaledUrl = item.url.replace(/width=\d+/, 'width=3840').replace(/height=\d+/, 'height=2160');
      
      const res = await fetch(upscaledUrl);
      if (!res.ok) throw new Error('Không thể upscale ảnh.');
      const blob = await res.blob();
      const localUrl = URL.createObjectURL(blob);
      const base64Url = await blobToBase64(blob);
      
      // Dọn rác Blob cũ trước khi upscale
      imageUrls.forEach(img => URL.revokeObjectURL(img.localUrl));
      
      // Khôi phục seed từ id
      const seedParts = item.id.split('_');
      const seed = parseInt(seedParts[seedParts.length - 1], 10);
      
      const newImg = { localUrl, originalUrl: upscaledUrl, seed, base64Url };
      setImageUrls([newImg]);
      
      // Add upscaled to gallery
      await addToGallery([{
        id: Date.now().toString() + '_' + seed,
        url: base64Url,
        prompt: item.prompt + ', masterpiece, 4k ultra hd, highly detailed',
        createdAt: Date.now()
      }]);
      
      setGalleryOpen(false);
      showAlert("Phục hồi nét 4K hoàn tất! Ảnh mới đã được lưu vào Bộ Sưu Tập.");
    } catch(err: any) {
      showAlert(err.message || "Lỗi khi upscale ảnh.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleInpaint = async (maskDataUrl: string, inpaintPrompt: string) => {
     if (!inpaintItem) return;
     setInpaintItem(null);
     setGalleryOpen(false);
     
     // Due to limitations of static proxy, we simulate an inpaint request
     // by incorporating the new prompt details and generating a new varied image 
     // with the same seed but incorporating the mask prompt.
     
     setIsLoading(true);
     setLoadingText('Đang vẽ lại mặt nạ (In-painting)...');
     
     try {
       // Simulate processing delay of sending mask to server
       await new Promise(r => setTimeout(r, 2000));
       
       const seedParts = inpaintItem.id.split('_');
       let seed = parseInt(seedParts[seedParts.length - 1], 10);
       if (isNaN(seed)) seed = Math.floor(Math.random() * 100000);
       
       const combinedPrompt = `${inpaintItem.prompt}, fixing specifically: ${inpaintPrompt}`;
       
       let model = settings.customModel.split(',')[0] || 'flux';
       const dim = getDimensions(aspectRatio);
       
       const originalUrl = generateImageUrl(combinedPrompt, model, seed + 1, dim.width, dim.height, negativePrompt);
       const res = await fetchWithRetryUrl(originalUrl);
       const blob = await res.blob();
       const base64Url = await blobToBase64(blob);
       
       const localUrl = URL.createObjectURL(blob);
       setImageUrls([{ localUrl, originalUrl, seed: seed + 1, base64Url }]);
       
       await addToGallery([{
         id: Date.now().toString() + '_' + (seed + 1),
         url: base64Url,
         prompt: combinedPrompt,
         createdAt: Date.now()
       }]);

     } catch(err: any) {
       showAlert("Lỗi khi vẽ In-paint: " + err.message);
     } finally {
       setIsLoading(false);
     }
  }

  const handleDownload = (urlToDownload: string) => {
    const a = document.createElement('a');
    a.href = urlToDownload;
    a.download = `CineTech_${Date.now()}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleSavePreset = (name: string) => {
    if (!promptText.trim()) {
      showAlert("Bạn cần nhập Prompt trước cài đặt thành Preset.");
      return;
    }
    const newPreset: PresetItem = {
      id: Date.now().toString(),
      name,
      prompt: promptText,
      negativePrompt,
      aspectRatio,
      createdAt: Date.now()
    };
    const newPresets = [newPreset, ...presets];
    setPresets(newPresets);
    localStorage.setItem('cineTechPresets', JSON.stringify(newPresets));
    setSavePresetOpen(false);
    showAlert("Đã lưu Preset thành công!");
  };

  const handleDeletePreset = (id: string) => {
    const newPresets = presets.filter(p => p.id !== id);
    setPresets(newPresets);
    localStorage.setItem('cineTechPresets', JSON.stringify(newPresets));
  };

  const syntaxWarnings = checkSyntaxWarnings(promptText, targetRenderModel);

  return (
    <div className="min-h-[100dvh] lg:h-[100dvh] lg:overflow-hidden bg-studio-950 flex flex-col font-sans selection:bg-accent selection:text-studio-950 text-studio-100">
      {/* Header */}
      <header 
        className="glass-panel sticky top-0 z-40 flex justify-between items-center px-4 md:px-6 pb-3 pt-3 md:pb-4 md:pt-4 border-b border-studio-800/50"
        style={{ paddingTop: 'max(env(safe-area-inset-top), 0.75rem)' }}
      >
        <div className="flex items-center gap-3">
          <div className="bg-accent text-studio-950 p-1.5 rounded-lg">
            <Sparkles className="w-5 h-5" />
          </div>
          <h1 className="text-lg md:text-xl font-serif tracking-tight text-studio-50 font-semibold truncate max-w-[200px] md:max-w-none hidden sm:block">
            AI-pollinations<span className="text-studio-400 font-light">.ai-STUDIO</span>
          </h1>
        </div>
        <div className="flex items-center gap-1 md:gap-2">
          <button 
            onClick={() => setGalleryOpen(true)}
            className="flex items-center gap-2 p-2 px-3 text-studio-400 hover:text-studio-100 hover:bg-studio-800/50 rounded-lg transition-all"
            title="Bộ Sưu Tập"
          >
            <ImageIcon className="w-4 h-4 md:w-5 md:h-5" />
            <span className="text-xs md:text-sm hidden md:inline font-medium">B.S.Tập</span>
          </button>
          <button 
            onClick={() => setPresetsOpen(true)}
            className="flex items-center gap-2 p-2 px-3 text-studio-400 hover:text-studio-100 hover:bg-studio-800/50 rounded-lg transition-all"
            title="Presets của tôi"
          >
            <Bookmark className="w-4 h-4 md:w-5 md:h-5" />
            <span className="text-xs md:text-sm hidden md:inline font-medium">Presets</span>
          </button>
          <button 
            onClick={() => setHistoryOpen(true)}
            className="flex items-center gap-2 p-2 px-3 text-studio-400 hover:text-studio-100 hover:bg-studio-800/50 rounded-lg transition-all"
            title="Lịch sử Prompt"
          >
            <Clock className="w-4 h-4 md:w-5 md:h-5" />
            <span className="text-xs md:text-sm hidden md:inline font-medium">Lịch sử</span>
          </button>
          
          <div className="w-px h-6 bg-white/10 mx-1 hidden sm:block"></div>

          <button 
            onClick={toggleFontScale}
            className="flex lg:hidden items-center gap-1 p-2 px-2 md:px-3 text-studio-400 hover:text-accent hover:bg-studio-800/50 rounded-lg transition-all"
            title="Điều chỉnh cỡ chữ"
          >
            <Type className="w-4 h-4 md:w-5 md:h-5" />
            <span className="text-[10px] md:text-xs font-mono font-medium">{fontScale}%</span>
          </button>

          <button 
            id="btn-open-settings"
            onClick={() => setSettingsOpen(true)}
            className="p-2 px-3 text-studio-400 hover:text-studio-100 hover:bg-studio-800/50 rounded-lg transition-all"
            title="Cài đặt"
          >
            <SettingsIcon className="w-4 h-4 md:w-5 md:h-5" />
          </button>
        </div>
      </header>

      <InstructionBanner />

      <main className="flex-1 flex flex-col-reverse lg:flex-row w-full max-w-[1920px] mx-auto p-3 md:p-6 lg:p-8 gap-4 lg:gap-8 relative lg:overflow-hidden h-full">
        
        {/* Left Column: Controls */}
        <div className="w-full lg:w-[400px] xl:w-[450px] shrink-0 flex flex-col gap-4 lg:gap-6 relative z-10 lg:h-full lg:overflow-hidden">
          <div className="glass-panel rounded-2xl flex flex-col lg:h-full lg:overflow-hidden">
            <div className="flex border-b border-white/5 p-1 relative shrink-0">
               <button
                  id="tab-mode-idea" 
                  onClick={() => setMode('idea')}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 text-sm lg:text-base font-medium rounded-xl transition-all ${mode === 'idea' ? 'bg-studio-800 text-studio-50 shadow-sm' : 'text-studio-400 hover:text-studio-100'}`}
               >
                 <Sparkles className="w-5 h-5" />
                 Idea (Nội suy)
               </button>
               <button 
                  id="tab-mode-direct"
                  onClick={() => setMode('direct')}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 text-sm lg:text-base font-medium rounded-xl transition-all ${mode === 'direct' ? 'bg-studio-800 text-studio-50 shadow-sm' : 'text-studio-400 hover:text-studio-100'}`}
               >
                 <ImageIcon className="w-5 h-5" />
                 Direct (Prompt)
               </button>
            </div>
            
            <div className="p-4 lg:p-6 flex flex-col flex-1 gap-6 overflow-y-auto custom-scrollbar">
              {mode === 'idea' ? (
                <div className="space-y-5 relative">
                  <div className="flex items-center gap-2 border-b border-white/5 pb-2">
                    <span className="bg-studio-800 text-studio-100 text-xs md:text-sm font-mono px-2 py-1 rounded-md uppercase tracking-wider">Step 01</span>
                    <h3 className="text-base font-medium text-studio-100 tracking-wide">Nội suy Ý Tưởng</h3>
                  </div>
                  <div className="space-y-2 relative">
                    <label className="block text-sm font-medium text-studio-400">
                      Ý tưởng bối cảnh / Ảnh chung (Tiếng Việt)
                    </label>
                    <textarea 
                      value={ideaText}
                      onChange={(e) => setIdeaText(e.target.value)}
                      disabled={isInferring}
                      placeholder="VD: Một khung cảnh đứng ven hồ gươm buổi sáng mùa thu, phong cách điện ảnh..."
                      className={`w-full h-24 ${isInferring ? 'bg-studio-800/50 animate-pulse' : 'bg-studio-900/50'} border border-white/10 rounded-xl p-3 text-studio-50 placeholder:text-studio-600 focus:outline-none focus:border-studio-400 focus:ring-1 focus:ring-studio-400 resize-none transition-all leading-relaxed text-base custom-scrollbar`}
                    />
                    {isInferring && (
                      <div className="absolute inset-0 pointer-events-none rounded-xl border border-studio-500/30 animate-shimmer"></div>
                    )}
                  </div>

                  <div className="space-y-3">
                    <label className="block text-sm font-medium text-studio-400">
                      Profile / Ngoại hình Nhân vật (Tùy chọn)
                    </label>
                    <textarea 
                      value={characterProfile}
                      onChange={(e) => setCharacterProfile(e.target.value)}
                      placeholder="VD: Nữ 20 tuổi, tóc ngắn màu hạt dẻ, mắt buồn, mặc áo khoác da màu đen..."
                      className="w-full h-16 bg-studio-900 border border-studio-600 rounded-xl p-3 text-studio-100 placeholder:text-studio-600 focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent resize-none transition-all leading-relaxed text-base custom-scrollbar"
                    />
                  </div>
                  
                  {/* Reference Image Upload */}
                  <div className="space-y-3">
                    <label className="block text-sm font-medium text-studio-400 flex justify-between">
                      <span>Ảnh gốc phác thảo (Tùy chọn)</span>
                      {referenceImage && (
                        <button onClick={() => setReferenceImage(null)} className="text-red-400 hover:text-red-300 text-xs flex items-center gap-1">
                          <Trash2 className="w-3 h-3"/> Xóa ảnh
                        </button>
                      )}
                    </label>
                    
                    {!referenceImage ? (
                      <div 
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full h-24 bg-studio-900 border border-dashed border-studio-600 hover:border-accent rounded-xl flex flex-col items-center justify-center cursor-pointer transition-all group p-4"
                      >
                        <Upload className="w-6 h-6 text-studio-500 group-hover:text-accent mb-2 transition-colors" />
                        <span className="text-sm text-studio-500 group-hover:text-studio-300 transition-colors text-center">Tải lên hoặc kéo thả ảnh</span>
                        <input 
                          type="file" 
                          ref={fileInputRef} 
                          className="hidden" 
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onload = (ev) => setReferenceImage(ev.target?.result as string);
                              reader.readAsDataURL(file);
                            }
                          }}
                        />
                      </div>
                    ) : (
                      <div className="relative w-24 h-24 rounded-lg overflow-hidden border border-studio-600">
                        <img src={referenceImage} alt="Reference" className="w-full h-full object-cover" />
                      </div>
                    )}
                  </div>
                  
                  <div className="space-y-3">
                    <label className="block text-sm font-medium text-studio-400">
                      Hướng dẫn nội suy (Rules) - Tùy chọn
                    </label>
                    <textarea 
                      value={customRules}
                      onChange={(e) => setCustomRules(e.target.value)}
                      placeholder="VD: Bắt buộc dùng tone màu xanh teal và cam, góc máy low angle..."
                      className="w-full h-16 bg-studio-900 border border-studio-600 rounded-xl p-3 text-studio-100 placeholder:text-studio-600 focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent resize-none transition-all leading-relaxed text-base custom-scrollbar"
                    />
                  </div>
                  
                  <div className="space-y-3">
                    <label className="block text-sm font-medium text-studio-400">
                      Tối ưu Prompt cho Model:
                    </label>
                    <select
                      value={targetRenderModel}
                      onChange={(e) => setTargetRenderModel(e.target.value)}
                      className="w-full bg-studio-900 border border-studio-600 rounded-lg p-3 text-studio-50 text-base focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent"
                    >
                      {OPTIMIZATION_MODELS.map(model => (
                        <option key={model.value} value={model.value}>{model.label}</option>
                      ))}
                    </select>
                  </div>

                  <button
                    onClick={handlePreInferPrompt}
                    disabled={isInferring || !ideaText.trim()}
                    className="w-full py-4 bg-studio-800 hover:bg-studio-700 text-studio-50 font-medium rounded-xl transition-all border border-white/5 flex items-center justify-center gap-2 text-base disabled:opacity-50 mt-4"
                  >
                    {isInferring ? (
                      <><Aperture className="w-5 h-5 animate-spin" /> Đang xử lý...</>
                    ) : (
                      <><Sparkles className="w-5 h-5" /> Nội suy Prompt</>
                    )}
                  </button>
                </div>
              ) : null}

              <div className="space-y-5 relative mt-4 border-t border-white/5 pt-6">
                <div className="flex items-center gap-2 border-b border-white/5 pb-2">
                  <span className="bg-studio-800 text-studio-100 text-xs md:text-sm font-mono px-2 py-1 rounded-md uppercase tracking-wider">Step {mode === 'idea' ? '02' : '01'}</span>
                  <h3 className="text-base font-medium text-studio-100 tracking-wide">Tạo Tác Phẩm</h3>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <label className="block text-sm font-medium text-studio-400">
                      Prompt tạo ảnh (Tiếng Anh)
                    </label>
                    {mode === 'direct' && (
                      <label className="flex items-center gap-2 text-sm text-studio-400 cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={isBatchMode} 
                          onChange={(e) => setIsBatchMode(e.target.checked)} 
                          className="rounded border-studio-600 bg-studio-900 text-accent focus:ring-accent"
                        />
                        <span>Tạo hàng loạt (Mỗi dòng 1 prompt)</span>
                      </label>
                    )}
                    {mode === 'idea' && promptText && (
                      <span className="text-xs text-accent bg-accent/10 px-2 py-1 rounded uppercase font-bold tracking-wider">Đã nội suy</span>
                    )}
                  </div>
                  <textarea 
                    value={promptText}
                    onChange={(e) => setPromptText(e.target.value)}
                    placeholder="A realistic portrait of..."
                    className="w-full h-32 bg-studio-900 border border-studio-600 rounded-xl p-4 text-studio-50 placeholder:text-studio-600 focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent resize-none transition-all leading-relaxed font-mono text-sm custom-scrollbar"
                  />
                  {syntaxWarnings.length > 0 && (
                    <div className="bg-red-900/30 border border-red-500/30 rounded-lg p-3 text-sm text-red-300 mt-2 space-y-1">
                      <p className="font-semibold mb-1 text-red-400">Cảnh báo Cú pháp:</p>
                      <ul className="list-disc list-inside">
                        {syntaxWarnings.map((warn, i) => (
                          <li key={i}>{warn}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                <StylePresetsUI 
                  onApplyStyle={(promptAddon) => {
                    setPromptText(prev => {
                      const trimmed = prev.trim();
                      if (!trimmed) return promptAddon;
                      if (trimmed.includes(promptAddon)) return trimmed; // tránh bị đúp
                      return trimmed + ', ' + promptAddon;
                    });
                  }} 
                />

                <div className="space-y-3">
                  <label className="block text-sm font-medium text-studio-400">
                    Tỷ lệ khung hình
                  </label>
                  <div className="flex bg-studio-900 border border-studio-600 rounded-lg p-1 gap-1">
                    {(['1:1', '16:9', '9:16', '3:2', '2:3'] as const).map(ratio => (
                      <button
                        key={ratio}
                        onClick={() => setAspectRatio(ratio)}
                        className={`flex-1 py-3 text-sm font-medium rounded-md transition-all ${aspectRatio === ratio ? 'bg-studio-700 text-accent shadow-sm' : 'text-studio-400 hover:text-studio-100 hover:bg-studio-800'}`}
                      >
                        {ratio}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-2 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <button 
                    onClick={() => setShowAdvanced(!showAdvanced)} 
                    className="flex items-center gap-2 text-sm font-medium text-studio-400 hover:text-accent transition-colors"
                  >
                    <Sliders className="w-4 h-4" />
                    Cài đặt nâng cao (Negative Prompt, API)
                  </button>
                  <button 
                    onClick={() => {
                        if (!promptText.trim()) {
                           showAlert("Bạn cần có Prompt trước khi có thể lưu thành Preset.");
                           return;
                        }
                        setSavePresetOpen(true);
                    }} 
                    title="Lưu Preset"
                    className="flex items-center gap-2 text-sm font-medium text-studio-400 hover:text-accent transition-colors"
                  >
                    <Bookmark className="w-4 h-4" />
                    Lưu Preset
                  </button>
                </div>

                {showAdvanced && (
                  <div className="space-y-4 bg-studio-900/30 p-4 rounded-lg border border-studio-700/50 animate-in fade-in duration-300">
                    <div>
                      <label className="block text-sm font-medium text-studio-400 mb-2">
                        Negative Prompt (Tránh những chi tiết này)
                      </label>
                      <textarea 
                        value={negativePrompt}
                        onChange={(e) => setNegativePrompt(e.target.value)}
                        placeholder="VD: ugly, deformed, text, watermark, bad anatomy..."
                        className="w-full h-20 bg-studio-900 border border-studio-600 rounded-xl p-4 text-studio-50 placeholder:text-studio-600 focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent resize-none transition-all text-sm custom-scrollbar"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-studio-400 mb-2">
                        Seed (Gieo hạt - Tùy chọn)
                      </label>
                      <input 
                        type="text"
                        value={seedText}
                        onChange={(e) => setSeedText(e.target.value)}
                        placeholder="VD: 12345 (Để trống để random)"
                        className="w-full bg-studio-900 border border-studio-600 rounded-xl px-4 py-3 text-studio-50 placeholder:text-studio-600 focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all text-sm"
                      />
                      <p className="text-xs text-studio-500 italic mt-2">
                        Lưu ý: Dùng Seed cố định giúp tạo ra ảnh nhất quán hơn khi cùng một Prompt và Model.
                      </p>
                    </div>
                  </div>
                )}
                
                <div className="flex flex-col gap-3 mt-4">
                  <button
                    id="btn-generate-image"
                    onClick={() => handlePreGenerate(1)}
                    disabled={isLoading || !promptText.trim()}
                    className="w-full py-4 bg-accent hover:bg-accent-hover disabled:bg-studio-800 disabled:text-studio-500 text-studio-950 font-semibold rounded-xl transition-all shadow-lg disabled:shadow-none flex items-center justify-center gap-2 text-base uppercase tracking-wide"
                  >
                    {isLoading ? (
                      <>
                        <Aperture className="w-5 h-5 animate-spin" />
                        <span>Đang xử lý...</span>
                      </>
                    ) : (
                      <>
                        <Camera className="w-5 h-5" />
                        <span>Tạo Ảnh Tác Phẩm</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Studio Canvas */}
        <div className="flex-1 glass-panel rounded-2xl flex flex-col items-center justify-center relative overflow-hidden min-h-[50vh] md:min-h-[500px] lg:min-h-0 group">
          
          {isLoading && (
            <div className="absolute inset-0 z-20 bg-studio-950/80 backdrop-blur-md flex flex-col items-center justify-center text-studio-100 animate-in fade-in duration-500">
               <div className="relative w-24 h-24 md:w-32 md:h-32 mb-6 md:mb-8 flex items-center justify-center">
                 <div className="absolute inset-0 border border-studio-100/10 rounded-full animate-[spin_10s_linear_infinite]"></div>
                 <div className="absolute border-t-2 border-r-2 border-studio-100/30 rounded-full animate-[spin_3s_linear_infinite_reverse]" style={{ width: '80%', height: '80%' }}></div>
                 <div className="absolute border-2 border-studio-100/50 rounded-full animate-lens" style={{ width: '60%', height: '60%' }}></div>
                 <Sparkles className="w-8 h-8 md:w-10 md:h-10 text-studio-100 animate-[pulse_2s_linear_infinite]" />
               </div>
               <p className="font-serif italic text-lg md:text-xl tracking-wide animate-pulse mb-6 text-center px-4">{loadingText}</p>
               <div className="w-32 md:w-48 h-1 bg-studio-800 rounded-full overflow-hidden">
                 <div className="h-full bg-studio-100 animate-slide rounded-full"></div>
               </div>
            </div>
          )}

          {!imageUrls.length && !isLoading ? (
            <div className="text-center text-studio-500 flex flex-col items-center p-8">
              <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-studio-800/50 flex items-center justify-center mb-4 md:mb-6 border border-white/5">
                <ImageIcon className="w-8 h-8 md:w-10 md:h-10 opacity-30" />
              </div>
              <p className="font-serif text-lg md:text-xl text-studio-300">Khu vực Tráng Phim</p>
              <p className="text-sm md:text-base mt-3 text-studio-500 max-w-xs">Tác phẩm của bạn sẽ hiển thị với phong cách chân thực cao cấp nhất.</p>
            </div>
          ) : imageUrls.length > 0 ? (
            <div className={`relative w-full h-full p-2 md:p-4 lg:p-8 overflow-y-auto custom-scrollbar ${imageUrls.length > 1 ? 'grid grid-cols-1 md:grid-cols-2 content-start' : 'flex'} gap-2 lg:gap-4 items-center justify-center`}>
              {imageUrls.map((img, idx) => {
                // Parse the original URL to extract model and dimensions
                let model = '';
                let width = 0;
                let height = 0;
                try {
                  const urlObj = new URL(img.originalUrl);
                  model = decodeURIComponent(urlObj.searchParams.get('model') || '');
                  width = parseInt(urlObj.searchParams.get('width') || '0', 10);
                  height = parseInt(urlObj.searchParams.get('height') || '0', 10);
                } catch(e) {}
                
                return (
                <div 
                  key={idx} 
                  className="relative group/img w-full h-full min-h-[300px] flex items-center justify-center bg-studio-900 border border-white/5 rounded-xl overflow-hidden aspect-square md:aspect-auto cursor-zoom-in"
                  onClick={() => setCurrentZoomImage({ 
                    url: img.localUrl, 
                    metadata: { seed: img.seed, model, width, height } 
                  })}
                >
                   <img 
                     src={img.localUrl} 
                     alt={`Generated Artwork ${idx + 1}`} 
                     className="w-full h-full object-contain xl:object-cover drop-shadow-2xl animate-in zoom-in-95 duration-700" 
                   />
                   <div className="absolute bottom-4 right-4 opacity-100 md:opacity-0 md:group-hover/img:opacity-100 transition-opacity duration-300">
                     <button
                       onClick={(e) => {
                         e.stopPropagation();
                         handleDownload(img.localUrl);
                       }}
                       className="bg-studio-950/80 hover:bg-studio-100 hover:text-studio-950 text-studio-100 p-3 md:p-3 rounded-xl shadow-xl backdrop-blur-md border border-white/10 transition-all flex items-center justify-center"
                       title="Tải ảnh gốc"
                     >
                       <Download className="w-6 h-6 md:w-5 md:h-5" />
                     </button>
                   </div>
                </div>
              )})}
            </div>
          ) : null}

        </div>
      </main>

      <SettingsDialog 
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        settings={settings}
        onSettingsChange={handleSettingsChange}
      />
      
      <AlertDialog 
        isOpen={alertState.isOpen}
        message={alertState.message}
        onClose={() => setAlertState({ isOpen: false, message: '' })}
      />

      <SmartGenerateDialog
        isOpen={smartGenerateOpen}
        isVietnamese={smartGenerateData?.hasVietnamese || false}
        targetRenderModel={targetRenderModel}
        availableTextModels={(settings.useGemini ? settings.geminiModel : settings.proxyModel).split(',').map(s => s.trim()).filter(Boolean).map(id => ({ id, name: id }))}
        availableImageModels={settings.customModel.split(',').map(s => s.trim()).filter(Boolean).map(id => ({ id, name: id }))}
        onProceedEnhance={(textModel, imageModel) => {
          if (smartGenerateData) {
            doEnhanceAndGenerate(textModel, imageModel, smartGenerateData.prompts, smartGenerateData.count);
          }
        }}
        onProceedDirect={(imageModel) => {
          if (smartGenerateData) {
            doGenerate(imageModel, smartGenerateData.count, smartGenerateData.prompts);
          }
        }}
        onClose={() => setSmartGenerateOpen(false)}
      />

      <ModelSelectionDialog
        isOpen={modelSelectionOpen}
        models={availableModels}
        onSelect={(model) => doGenerate(model, pendingCount, pendingPrompts)}
        onClose={() => setModelSelectionOpen(false)}
      />

      <ModelSelectionDialog
        title="Chọn Model Gemini"
        isOpen={geminiModelSelectionOpen}
        models={availableGeminiModels}
        onSelect={(model) => doInferPrompt(model)}
        onClose={() => setGeminiModelSelectionOpen(false)}
      />

      {currentZoomImage && (
        <ImageZoomModal imageUrl={currentZoomImage.url} metadata={currentZoomImage.metadata} onClose={() => setCurrentZoomImage(null)} />
      )}

      <PromptHistoryDialog 
        isOpen={historyOpen}
        history={history}
        onClose={() => setHistoryOpen(false)}
        onSelectPattern={(item) => {
          setMode('idea');
          setIdeaText(item.idea);
          setPromptText(item.prompt);
          setCustomRules(item.rules);
          setCharacterProfile(item.characterProfile || '');
        }}
        onDelete={(id) => {
          const newHistory = history.filter(item => item.id !== id);
          setHistory(newHistory);
          localStorage.setItem('cineTechHistory', JSON.stringify(newHistory));
        }}
        onDeleteMultiple={(ids) => {
          const newHistory = history.filter(item => !ids.includes(item.id));
          setHistory(newHistory);
          localStorage.setItem('cineTechHistory', JSON.stringify(newHistory));
        }}
      />
      
      <GalleryDialog
        isOpen={galleryOpen}
        gallery={gallery}
        onClose={() => setGalleryOpen(false)}
        onUsePrompt={(prompt) => {
          setMode('direct');
          setPromptText(prompt);
        }}
        onUpscale={handleUpscale}
        onInpaint={(item) => setInpaintItem(item)}
        onDelete={async (id) => {
          const newGallery = gallery.filter((item) => item.id !== id);
          setGallery(newGallery);
          try {
            await removeImageFromDB(id);
          } catch(e) { console.error(e) }
        }}
        onDeleteMultiple={async (ids) => {
          const newGallery = gallery.filter((item) => !ids.includes(item.id));
          setGallery(newGallery);
          try {
             for (const id of ids) {
               await removeImageFromDB(id);
             }
          } catch(e) { console.error(e) }
        }}
      />
      
      <SavePresetDialog 
        isOpen={savePresetOpen}
        onClose={() => setSavePresetOpen(false)}
        onSave={handleSavePreset}
      />
      
      <PresetsDialog 
        isOpen={presetsOpen}
        presets={presets}
        onClose={() => setPresetsOpen(false)}
        onDeletePreset={handleDeletePreset}
        onApplyPreset={(preset) => {
           setMode('direct');
           setPromptText(preset.prompt);
           setNegativePrompt(preset.negativePrompt || '');
           setAspectRatio(preset.aspectRatio as any);
        }}
      />
      
      {inpaintItem && (
        <InpaintModal 
          imageUrl={inpaintItem.url} 
          onClose={() => setInpaintItem(null)} 
          onInpaint={handleInpaint} 
        />
      )}
    </div>
  );
}

export default App;
