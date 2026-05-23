import { X, Search, Clock, ArrowDownAz, ArrowUpZa } from "lucide-react";
import { useState, useMemo } from "react";

export interface PromptHistoryItem {
  id: string;
  idea: string;
  prompt: string;
  rules: string;
  characterProfile?: string;
  createdAt: number;
}

export interface PromptHistoryDialogProps {
  isOpen: boolean;
  history: PromptHistoryItem[];
  onClose: () => void;
  onSelectPattern: (item: PromptHistoryItem) => void;
}

export function PromptHistoryDialog({ isOpen, history, onClose, onSelectPattern }: PromptHistoryDialogProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');

  const filteredAndSorted = useMemo(() => {
    return history
      .filter(item => 
        item.prompt.toLowerCase().includes(searchTerm.toLowerCase()) || 
        item.idea.toLowerCase().includes(searchTerm.toLowerCase())
      )
      .sort((a, b) => sortOrder === 'desc' ? b.createdAt - a.createdAt : a.createdAt - b.createdAt);
  }, [history, searchTerm, sortOrder]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="glass-panel border border-white/10 rounded-2xl w-full max-w-2xl max-h-[85vh] shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center p-5 border-b border-white/5 shrink-0">
          <h2 className="text-xl font-serif font-semibold text-studio-50">Lịch sử Prompt nội suy</h2>
          <button onClick={onClose} className="p-2 text-studio-400 hover:text-studio-100 hover:bg-white/5 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-4 border-b border-white/5 bg-studio-950/50 flex gap-4 shrink-0">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-studio-400" />
            <input 
              type="text" 
              placeholder="Tìm kiếm ý tưởng hoặc prompt..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-studio-950 border border-white/10 rounded-xl pl-9 pr-4 py-2 text-sm text-studio-100 focus:outline-none focus:border-studio-400 focus:ring-1 focus:ring-studio-400"
            />
          </div>
          <button 
            onClick={() => setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc')}
            className="px-4 py-2 bg-studio-950 border border-white/10 rounded-xl flex items-center gap-2 text-sm text-studio-300 hover:text-studio-100 transition-colors"
          >
            <Clock className="w-4 h-4" />
            {sortOrder === 'desc' ? <ArrowDownAz className="w-4 h-4" /> : <ArrowUpZa className="w-4 h-4" />}
          </button>
        </div>

        <div className="overflow-y-auto custom-scrollbar p-4 flex flex-col gap-4">
          {filteredAndSorted.length === 0 ? (
            <div className="text-center text-studio-500 py-8">Không có lịch sử nào.</div>
          ) : (
            filteredAndSorted.map(item => (
              <div key={item.id} className="bg-studio-900/50 border border-white/5 rounded-xl p-4 flex flex-col gap-3 group relative hover:border-white/20 transition-colors">
                <div className="text-xs text-studio-500 flex justify-between">
                  <span>{new Date(item.createdAt).toLocaleString()}</span>
                  <button 
                    onClick={() => {
                      onSelectPattern(item);
                      onClose();
                    }}
                    className="text-accent opacity-0 group-hover:opacity-100 transition-opacity font-medium pointer-events-auto"
                  >
                    Sử dụng lại
                  </button>
                </div>
                
                {item.idea && (
                  <div>
                    <span className="text-xs uppercase tracking-widest text-studio-400 font-medium mb-1 block">Ý tưởng</span>
                    <p className="text-sm text-studio-100 line-clamp-2">{item.idea}</p>
                  </div>
                )}
                
                {item.characterProfile && (
                  <div>
                    <span className="text-xs uppercase tracking-widest text-studio-400 font-medium mb-1 block">Profile Nhân Vật</span>
                    <p className="text-sm text-studio-100 line-clamp-2">{item.characterProfile}</p>
                  </div>
                )}

                <div className="bg-studio-950 p-3 rounded-xl border border-white/5">
                  <span className="text-xs uppercase tracking-tight text-accent font-medium mb-1 block">Prompt</span>
                  <p className="text-xs text-studio-300 font-mono line-clamp-3 leading-relaxed">{item.prompt}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
