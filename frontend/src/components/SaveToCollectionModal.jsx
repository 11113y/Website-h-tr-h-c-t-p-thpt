import React, { useState, useEffect } from 'react';
import axios from '../api/client';
import { Folder, FolderPlus, Check, X, Bookmark, Trash2, Plus } from 'lucide-react';

export default function SaveToCollectionModal({ isOpen, onClose, questionId, isLoggedIn, onSaveSuccess }) {
  const [folders, setFolders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [existingBookmark, setExistingBookmark] = useState(null);
  const [selectedFolderId, setSelectedFolderId] = useState(null); // null means 'Unclassified' / 'Chưa phân loại'
  const [newFolderName, setNewFolderName] = useState('');
  const [showCreateInput, setShowCreateInput] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen && isLoggedIn && questionId) {
      fetchData();
    }
  }, [isOpen, isLoggedIn, questionId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch folders
      const foldersRes = await axios.get('/bookmarks/folders');
      if (foldersRes.data && foldersRes.data.success) {
        setFolders(foldersRes.data.folders);
      }

      // Fetch bookmarks to find if this question is already saved
      const bookmarksRes = await axios.get('/bookmarks');
      if (bookmarksRes.data && bookmarksRes.data.success) {
        const found = bookmarksRes.data.bookmarks.find(b => b.questionId === questionId);
        setExistingBookmark(found || null);
        if (found) {
          setSelectedFolderId(found.folderId);
        } else {
          setSelectedFolderId(null);
        }
      }
    } catch (err) {
      console.error('Failed to fetch modal data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateFolder = async (e) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;
    try {
      const res = await axios.post('/bookmarks/folders', { name: newFolderName });
      if (res.data && res.data.success) {
        const newFolder = res.data.folder;
        setFolders(prev => [...prev, newFolder]);
        setSelectedFolderId(newFolder.id);
        setNewFolderName('');
        setShowCreateInput(false);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Không thể tạo bộ sưu tập.');
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (existingBookmark) {
        // Update existing bookmark folder
        await axios.put(`/bookmarks/${existingBookmark.id}`, {
          folderId: selectedFolderId
        });
      } else {
        // Create new bookmark in selected folder
        await axios.post('/bookmarks/toggle', {
          questionId,
          folderId: selectedFolderId
        });
      }
      onSaveSuccess && onSaveSuccess();
      onClose();
    } catch (err) {
      console.error(err);
      alert('Không thể lưu câu hỏi vào bộ sưu tập.');
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveBookmark = async () => {
    if (!existingBookmark) return;
    setSaving(true);
    try {
      await axios.post('/bookmarks/toggle', { questionId });
      onSaveSuccess && onSaveSuccess();
      onClose();
    } catch (err) {
      console.error(err);
      alert('Không thể bỏ lưu câu hỏi.');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-[#241916]/60 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fadeIn">
      <div className="bg-[#fffdfb] border-2 border-[#dfc0b7] rounded-[36px] max-w-md w-full overflow-hidden shadow-2xl text-left flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#8c3315] to-[#b34d28] p-5 text-white flex justify-between items-center shrink-0">
          <div className="flex items-center gap-2">
            <Bookmark size={20} className="text-amber-300 fill-amber-300" />
            <h3 className="text-base font-black uppercase tracking-wider">
              {existingBookmark ? 'Thay đổi bộ sưu tập' : 'Lưu vào bộ sưu tập'}
            </h3>
          </div>
          <button 
            onClick={onClose}
            className="text-white/80 hover:text-white bg-black/10 hover:bg-black/20 w-7 h-7 rounded-full flex items-center justify-center transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 space-y-3">
              <div className="w-8 h-8 border-4 border-[#8c3315] border-t-transparent rounded-full animate-spin" />
              <p className="text-xs font-black text-[#8b716a] tracking-widest uppercase">Đang tải danh sách...</p>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-xs font-bold text-[#8b716a] leading-relaxed">
                {existingBookmark 
                  ? 'Câu hỏi này đã được lưu. Chọn bộ sưu tập bên dưới để phân loại, hoặc nhấp lại vào bộ sưu tập đó để bỏ chọn (chỉ lưu ở Kho lưu trữ).' 
                  : 'Chọn bộ sưu tập bên dưới để phân loại câu hỏi này, hoặc bỏ chọn để chỉ lưu ở Kho lưu trữ.'}
              </p>

              {/* Collections list */}
              <div className="space-y-1.5 max-h-[240px] overflow-y-auto pr-1">
                {/* Custom collections list */}
                {folders.map(f => {
                  const isSelected = selectedFolderId === f.id;
                  return (
                    <button
                      key={f.id}
                      onClick={() => setSelectedFolderId(isSelected ? null : f.id)}
                      className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl text-xs font-bold transition-all text-left border ${
                        isSelected
                          ? 'bg-[#fff3f0] border-[#8c3315] text-[#8c3315] font-black'
                          : 'bg-white border-gray-100 text-[#57423b] hover:bg-gray-50'
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <Folder size={16} className={isSelected ? 'text-[#8c3315] fill-[#8c3315]/10' : 'text-gray-400'} />
                        {f.name}
                      </span>
                      {isSelected && <Check size={16} className="text-[#8c3315]" />}
                    </button>
                  );
                })}
              </div>

              {/* Inline Create Input */}
              {showCreateInput ? (
                <form onSubmit={handleCreateFolder} className="space-y-2 pt-3 border-t border-gray-100 animate-fadeIn">
                  <label className="text-[10px] font-black text-[#8b716a] uppercase tracking-wider block">Tên bộ sưu tập mới</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Ví dụ: Công thức tính nhanh, Hình học..."
                      value={newFolderName}
                      onChange={(e) => setNewFolderName(e.target.value)}
                      className="flex-1 px-4 py-2.5 bg-gray-50 border border-[#dfc0b7]/40 focus:border-[#8c3315] rounded-xl text-xs font-bold text-[#241916] outline-none transition-all shadow-inner"
                      autoFocus
                    />
                    <button
                      type="submit"
                      className="px-4 py-2.5 bg-[#8c3315] hover:bg-[#72270e] text-white rounded-xl text-xs font-black uppercase tracking-wider cursor-pointer shadow-sm"
                    >
                      Thêm
                    </button>
                    <button
                      type="button"
                      onClick={() => { setShowCreateInput(false); setNewFolderName(''); }}
                      className="px-3 py-2.5 bg-white border border-[#dfc0b7] hover:bg-gray-50 text-[#8b716a] rounded-xl cursor-pointer transition-colors"
                    >
                      <X size={14} />
                    </button>
                  </div>
                </form>
              ) : (
                <button
                  onClick={() => setShowCreateInput(true)}
                  className="w-full flex items-center justify-center gap-1.5 py-3 border-2 border-dashed border-gray-200 hover:border-[#8c3315] hover:text-[#8c3315] text-[#8b716a] rounded-2xl text-xs font-black transition-all cursor-pointer bg-white"
                >
                  <FolderPlus size={14} />
                  Tạo bộ sưu tập mới
                </button>
              )}
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="bg-[#fffbf9] border-t border-[#dfc0b7]/40 px-6 py-4 flex items-center justify-between shrink-0">
          {existingBookmark ? (
            <button
              onClick={handleRemoveBookmark}
              disabled={saving}
              className="px-4 py-2.5 border border-red-200 text-red-600 hover:bg-red-50 disabled:bg-gray-100 disabled:text-gray-400 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Trash2 size={14} />
              Bỏ lưu
            </button>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2.5 bg-white border border-[#dfc0b7] hover:bg-gray-50 text-[#57423b] rounded-xl text-xs font-black uppercase tracking-wider transition-all"
            >
              Hủy
            </button>
            <button
              onClick={handleSave}
              disabled={loading || saving}
              className="px-5 py-2.5 bg-[#8c3315] hover:bg-[#72270e] disabled:bg-gray-300 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-md"
            >
              {saving ? 'Đang lưu...' : 'Xác nhận'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
