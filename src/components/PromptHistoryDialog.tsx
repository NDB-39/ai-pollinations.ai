import { X, Search, Clock, ArrowDownAz, ArrowUpZa, Trash2, CheckSquare, Square } from "lucide-react";
import { useState, useMemo } from "react";
import { ConfirmDialog } from "./ConfirmDialog";

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
  onDelete: (id: string) => void;
  onDeleteMultiple: (ids: string[]) => void;
}

export function PromptHistoryDialog({ isOpen, history, onClose, onSelectPattern, onDelete, onDeleteMultiple }: PromptHistoryDialogProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isSelectionMode, setIsSelectionMode] = useState<boolean>(false);
  const [showMultiDeleteConfirm, setShowMultiDeleteConfirm] = useState<boolean>(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const filteredAndSorted = useMemo(() => {
    return history
      .filter(item => 
        item.prompt.toLowerCase().includes(searchTerm.toLowerCase()) || 
        item.idea.toLowerCase().includes(searchTerm.toLowerCase())
      )
      .sort((a, b) => sortOrder === 'desc' ? b.createdAt - a.createdAt : a.createdAt - b.createdAt);
  }, [history, searchTerm, sortOrder]);

  if (!isOpen) return null;

  const toggleSelection = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredAndSorted.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredAndSorted.map(item => item.id)));
    }
  };

  const confirmMultiDelete = () => {
    if (selectedIds.size > 0) {
      onDeleteMultiple(Array.from(selectedIds));
      setSelectedIds(new Set());
      setIsSelectionMode(false);
      setShowMultiDeleteConfirm(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="glass-panel border border-white/10 rounded-2xl w-full max-w-2xl max-h-[85vh] shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center p-5 border-b border-white/5 shrink-0 flex-wrap gap-4">
          <h2 className="text-xl font-serif font-semibold text-studio-50">Lịch sử Prompt nội suy</h2>
          
          <div className="flex items-center gap-2">
            {history.length > 0 && (
              <button 
                onClick={() => {
                  setIsSelectionMode(!isSelectionMode);
                  if (isSelectionMode) setSelectedIds(new Set());
                }}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors border ${isSelectionMode ? 'bg-accent/20 border-accent/50 text-accent' : 'bg-studio-950 border-white/10 text-studio-300 hover:text-studio-100'}`}
              >
                {isSelectionMode ? 'Hủy Chọn' : 'Chọn Nhiều'}
              </button>
            )}
            
            {isSelectionMode && selectedIds.size > 0 && (
              <button 
                onClick={() => setShowMultiDeleteConfirm(true)}
                className="px-3 py-1.5 text-xs font-medium rounded-lg bg-red-950/40 border border-red-900/50 text-red-400 hover:bg-red-900/60 transition-colors flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Xóa ({selectedIds.size})
              </button>
            )}

            <button onClick={onClose} className="p-2 ml-2 text-studio-400 hover:text-studio-100 hover:bg-white/5 rounded-lg transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
        
        {isSelectionMode && filteredAndSorted.length > 0 && (
          <div className="bg-studio-950/50 border-b border-white/5 px-4 py-2 flex items-center shrink-0">
            <button 
              onClick={toggleSelectAll}
              className="flex items-center gap-2 text-sm text-studio-300 hover:text-studio-100 transition-colors"
            >
              {selectedIds.size === filteredAndSorted.length ? <CheckSquare className="w-4 h-4 text-accent" /> : <Square className="w-4 h-4" />}
              Chọn tất cả
            </button>
            <span className="ml-auto text-xs text-studio-500">{selectedIds.size} / {filteredAndSorted.length} đã chọn</span>
          </div>
        )}

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
              <div 
                key={item.id} 
                className={`bg-studio-900/50 border rounded-xl p-4 flex flex-col gap-3 group relative transition-colors ${selectedIds.has(item.id) ? 'border-accent shadow-[0_0_15px_rgba(201,167,124,0.15)]' : 'border-white/5 hover:border-white/20'}`}
              >
                {isSelectionMode && (
                  <div 
                    className="absolute -top-2 -left-2 z-10 p-1 cursor-pointer"
                    onClick={() => toggleSelection(item.id)}
                  >
                    <div className="bg-black/80 backdrop-blur-md rounded-md p-1 border border-white/10">
                      {selectedIds.has(item.id) ? <CheckSquare className="w-5 h-5 text-accent" /> : <Square className="w-5 h-5 text-white/70" />}
                    </div>
                  </div>
                )}

                <div className="text-xs text-studio-500 flex justify-between items-center">
                  <span>{new Date(item.createdAt).toLocaleString()}</span>
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={() => setDeletingId(item.id)}
                      disabled={isSelectionMode}
                      className="text-red-400 opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-0 p-1 hover:bg-white/5 rounded"
                      title="Xóa lịch sử"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => {
                        onSelectPattern(item);
                        onClose();
                      }}
                      disabled={isSelectionMode}
                      className="text-accent opacity-0 group-hover:opacity-100 transition-opacity font-medium disabled:opacity-0 pointer-events-auto"
                    >
                      Sử dụng lại
                    </button>
                  </div>
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
      
      <ConfirmDialog
        isOpen={!!deletingId}
        title="Xóa lịch sử"
        message="Bạn có chắc chắn muốn xóa lịch sử này?"
        onConfirm={() => {
          if (deletingId) {
            onDelete(deletingId);
            setDeletingId(null);
          }
        }}
        onCancel={() => setDeletingId(null)}
      />

      <ConfirmDialog
        isOpen={showMultiDeleteConfirm}
        title="Xóa nhiều lịch sử"
        message={`Bạn có chắc chắn muốn xóa ${selectedIds.size} lịch sử đã chọn?`}
        onConfirm={confirmMultiDelete}
        onCancel={() => setShowMultiDeleteConfirm(false)}
      />
    </>
  );
}
