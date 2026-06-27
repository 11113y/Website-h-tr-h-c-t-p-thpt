import React, { useState, useEffect } from 'react';
import axios from '../api/client';
import { Bookmark, ChevronDown, ChevronUp, HelpCircle, Lock, Trash2, Library, Search, Filter, Pin, Edit3, Save, Check, Folder, FolderPlus, Plus, X } from 'lucide-react';
import { renderMathText } from './QuizPage';
import { useDialog } from '../contexts/DialogContext';
import { useNavigate } from 'react-router-dom';

export default function CollectionsPage({ isLoggedIn, savedQuestions = [], toggleSaveQuestion }) {
  const navigate = useNavigate();
  const { alert, confirm, prompt } = useDialog();
  const [bookmarks, setBookmarks] = useState([]);
  const [folders, setFolders] = useState([]);
  const [selectedFolderId, setSelectedFolderId] = useState(null); // folderId or 'UNASSIGNED'
  const [viewMode, setViewMode] = useState('collections'); // 'collections' | 'questions'
  const [showCreateFolderModal, setShowCreateFolderModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [editingFolderId, setEditingFolderId] = useState(null);
  const [editingFolderName, setEditingFolderName] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [expandedId, setExpandedId] = useState(null);

  // Search & Filter state for questions inside a folder
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTopic, setFilterTopic] = useState('ALL');
  const [filterSection, setFilterSection] = useState('ALL');
  const [filterTest, setFilterTest] = useState('ALL');
  const [filterPinned, setFilterPinned] = useState(false);

  // Notes state
  const [editingNotes, setEditingNotes] = useState({});
  const [savingNoteId, setSavingNoteId] = useState(null);

  // Batch Add Questions modal state
  const [showAddQuestionsModal, setShowAddQuestionsModal] = useState(false);
  const [modalSearchQuery, setModalSearchQuery] = useState('');
  const [selectedBookmarkIds, setSelectedBookmarkIds] = useState([]);
  const [modalLoading, setModalLoading] = useState(false);

  const fetchBookmarks = async () => {
    if (!isLoggedIn) return;
    setLoading(true);
    try {
      const res = await axios.get('/bookmarks');
      if (res.data && res.data.success) {
        setBookmarks(res.data.bookmarks);
      }
    } catch (err) {
      console.error(err);
      setError('Không thể tải danh sách câu hỏi đã lưu.');
    } finally {
      setLoading(false);
    }
  };

  const fetchFolders = async () => {
    if (!isLoggedIn) return;
    try {
      const res = await axios.get('/bookmarks/folders');
      if (res.data && res.data.success) {
        setFolders(res.data.folders);
      }
    } catch (err) {
      console.error('Failed to fetch folders:', err);
    }
  };

  useEffect(() => {
    fetchBookmarks();
    fetchFolders();
  }, [isLoggedIn, savedQuestions]);

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;
    try {
      const res = await axios.post('/bookmarks/folders', { name: newFolderName.trim() });
      if (res.data && res.data.success) {
        setFolders(prev => [...prev, res.data.folder]);
        setNewFolderName('');
        setShowCreateFolderModal(false);
        alert(res.data.message || 'Tạo bộ sưu tập thành công!');
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Không thể tạo bộ sưu tập.');
    }
  };

  const handleDeleteFolder = async (folderId) => {
    const confirmed = await confirm('Bạn có chắc muốn xóa bộ sưu tập này? Các câu hỏi bên trong sẽ được giữ lại ở mục "Chưa phân loại".');
    if (!confirmed) return;
    try {
      const res = await axios.delete(`/bookmarks/folders/${folderId}`);
      if (res.data && res.data.success) {
        setFolders(prev => prev.filter(f => f.id !== folderId));
        if (selectedFolderId === folderId) {
          setSelectedFolderId(null);
          setViewMode('collections');
        }
        fetchBookmarks();
        alert(res.data.message || 'Xóa bộ sưu tập thành công.');
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Không thể xóa bộ sưu tập.');
    }
  };

  const handleRenameFolder = async (folderId, nameParam) => {
    const nameToUse = nameParam || editingFolderName;
    if (!nameToUse.trim()) return;
    try {
      const res = await axios.put(`/bookmarks/folders/${folderId}`, { name: nameToUse.trim() });
      if (res.data && res.data.success) {
        setFolders(prev => prev.map(f => f.id === folderId ? { ...f, name: res.data.folder.name } : f));
        setEditingFolderId(null);
        setEditingFolderName('');
        alert(res.data.message || 'Đổi tên bộ sưu tập thành công!');
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Không thể đổi tên bộ sưu tập.');
    }
  };

  const handleRemoveFromFolder = async (bookmarkId) => {
    try {
      const res = await axios.put(`/bookmarks/${bookmarkId}`, {
        folderId: null
      });
      if (res.data && res.data.success) {
        setBookmarks(prev => prev.map(b => 
          b.id === bookmarkId ? { ...b, folderId: null } : b
        ));
        fetchFolders();
        alert('Đã gỡ câu hỏi khỏi bộ sưu tập này.');
      }
    } catch (err) {
      console.error(err);
      alert('Không thể gỡ câu hỏi khỏi bộ sưu tập.');
    }
  };

  const handleRemove = async (qId) => {
    const confirmed = await confirm('Bạn có chắc chắn muốn bỏ lưu câu hỏi này?');
    if (!confirmed) return;
    await toggleSaveQuestion(qId, true);
    setBookmarks(prev => prev.filter(b => b.questionId !== qId));
    setTimeout(fetchFolders, 500);
  };

  const handleTogglePin = async (b) => {
    try {
      const res = await axios.put(`/bookmarks/${b.id}`, {
        isPinned: !b.isPinned
      });
      if (res.data && res.data.success) {
        setBookmarks(prev => prev.map(item => 
          item.id === b.id ? { ...item, isPinned: res.data.bookmark.isPinned } : item
        ));
      }
    } catch (err) {
      console.error(err);
      alert('Không thể cập nhật trạng thái ghim.');
    }
  };

  const handleSaveNote = async (bId, noteText) => {
    setSavingNoteId(bId);
    try {
      const res = await axios.put(`/bookmarks/${bId}`, {
        note: noteText
      });
      if (res.data && res.data.success) {
        setBookmarks(prev => prev.map(item => 
          item.id === bId ? { ...item, note: res.data.bookmark.note } : item
        ));
        const updatedEditingNotes = { ...editingNotes };
        delete updatedEditingNotes[bId];
        setEditingNotes(updatedEditingNotes);
      }
    } catch (err) {
      console.error(err);
      alert('Không thể lưu ghi chú.');
    } finally {
      setSavingNoteId(null);
    }
  };

  // Batch add questions to folder logic
  const handleOpenAddQuestionsModal = () => {
    // Select bookmarks that are NOT in the current folder
    setSelectedBookmarkIds([]);
    setModalSearchQuery('');
    setShowAddQuestionsModal(true);
  };

  const handleBatchAddQuestions = async () => {
    if (selectedBookmarkIds.length === 0) {
      alert('Vui lòng chọn ít nhất một câu hỏi.');
      return;
    }
    setModalLoading(true);
    try {
      const res = await axios.post(`/bookmarks/folders/${selectedFolderId}/add-questions`, {
        bookmarkIds: selectedBookmarkIds
      });
      if (res.data && res.data.success) {
        alert(res.data.message || 'Thêm câu hỏi vào bộ sưu tập thành công!');
        setShowAddQuestionsModal(false);
        fetchBookmarks();
        fetchFolders();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Không thể thêm câu hỏi.');
    } finally {
      setModalLoading(false);
    }
  };

  const handleToggleSelectBookmark = (bId) => {
    setSelectedBookmarkIds(prev => 
      prev.includes(bId) ? prev.filter(id => id !== bId) : [...prev, bId]
    );
  };

  // Filter bookmarks for current view
  const currentFolderBookmarks = bookmarks.filter(b => {
    if (selectedFolderId === 'UNASSIGNED') {
      return !b.folderId;
    }
    return b.folderId === selectedFolderId;
  });

  const uniqueTopics = Array.from(new Set(
    currentFolderBookmarks
      .map(b => b.question?.topic?.title || b.question?.topicTitle)
      .filter(Boolean)
  )).sort();

  const uniqueTests = Array.from(new Set(
    currentFolderBookmarks
      .map(b => b.question?.test?.title)
      .filter(Boolean)
  )).sort();

  const sortedBookmarks = [...currentFolderBookmarks].sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    return new Date(b.savedAt) - new Date(a.savedAt);
  });

  const filteredBookmarks = sortedBookmarks.filter(b => {
    const q = b.question;
    if (!q) return false;

    const textToSearch = `${q.question} ${b.note || ''} ${q.topicTitle || ''}`.toLowerCase();
    if (searchQuery && !textToSearch.includes(searchQuery.toLowerCase())) {
      return false;
    }

    const qTopic = q.topic?.title || q.topicTitle;
    if (filterTopic !== 'ALL' && qTopic !== filterTopic) {
      return false;
    }

    if (filterSection !== 'ALL' && q.section !== filterSection) {
      return false;
    }

    if (filterTest !== 'ALL' && q.test?.title !== filterTest) {
      return false;
    }

    if (filterPinned && !b.isPinned) {
      return false;
    }

    return true;
  });

  // Questions available to add to folder (for the modal)
  const availableBookmarks = bookmarks.filter(b => {
    // Cannot add if already in current folder
    if (b.folderId === selectedFolderId) return false;

    if (modalSearchQuery) {
      const q = b.question;
      if (!q) return false;
      const textToSearch = `${q.question} ${b.note || ''} ${q.topicTitle || ''}`.toLowerCase();
      return textToSearch.includes(modalSearchQuery.toLowerCase());
    }
    return true;
  });

  if (!isLoggedIn) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-8 text-center max-w-md mx-auto space-y-6 animate-fadeIn">
        <div className="w-20 h-20 bg-[var(--accent-light)] rounded-full flex items-center justify-center text-[var(--accent)]">
          <Lock size={40} />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-extrabold text-[var(--text)]">Bộ sưu tập học tập</h2>
          <p className="text-sm font-semibold text-[var(--text-muted)] leading-relaxed">
            Đăng nhập tài khoản để quản lý các bộ sưu tập câu hỏi cá nhân, tạo thư mục ôn tập chuyên đề và lưu trữ kiến thức.
          </p>
        </div>
        <button
          onClick={() => navigate('/login')}
          className="w-full bg-[var(--primary)] text-white py-3 rounded-2xl font-bold shadow-md hover:bg-[var(--primary-dark)] transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          Đăng nhập ngay
        </button>
      </div>
    );
  }

  // 1. RENDER COLLECTIONS GALLERY VIEW
  if (viewMode === 'collections') {
    return (
      <div className="container animate-fadeIn" style={{ maxWidth: 1000, padding: '32px 16px' }}>
        <div className="space-y-6 pb-6 text-left">
          {/* Header section */}
          <div className="collections-header-bar">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-[var(--primary-light)] text-[var(--primary)] rounded-2xl shadow-sm border border-[var(--primary-light)]">
                <Bookmark size={24} />
              </div>
              <div>
                <h2 className="text-xl font-extrabold text-[var(--text)] flex items-center gap-2">
                  Bộ sưu tập của tôi
                  <span className="px-2.5 py-0.5 bg-[var(--primary-light)] text-[var(--primary)] font-extrabold text-[10px] rounded-full uppercase tracking-wider">
                    {folders.length} bộ sưu tập
                  </span>
                </h2>
                <p className="text-xs font-bold text-[var(--text-muted)] mt-0.5">Tạo các bộ sưu tập để lưu trữ câu hỏi ôn tập theo ý muốn</p>
              </div>
            </div>
            <button 
              onClick={() => navigate('/saved-questions')}
              className="btn btn-outline flex items-center gap-2 text-xs"
            >
              <Library size={14} /> Đi tới Kho lưu trữ
            </button>
          </div>

          {/* Collections Gallery Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">

            {/* Default Collection: Unassigned */}
            <div 
              onClick={() => { setSelectedFolderId('UNASSIGNED'); setViewMode('questions'); }}
              className="collection-card group"
            >
              {/* Card Header */}
              <div className="collection-card-header">
                <div className="collection-card-icon unassigned">
                  <Folder size={20} className="fill-slate-500/10" />
                </div>
                <span className="collection-card-badge unassigned font-extrabold">
                  {bookmarks.filter(b => !b.folderId).length} câu hỏi
                </span>
              </div>

              {/* Card Content */}
              <div className="space-y-1.5 mt-auto text-left">
                <h3 className="text-base font-extrabold text-slate-800 tracking-tight group-hover:text-[var(--primary)] transition-colors">Chưa phân loại</h3>
                <p className="text-xs font-semibold text-slate-400 leading-relaxed line-clamp-2">
                  Các câu hỏi đã lưu của bạn chưa được đưa vào thư mục hoặc bộ sưu tập cụ thể nào.
                </p>
              </div>
            </div>

            {/* Cards: Custom Folders */}
            {folders.map(f => {
              const isEditing = editingFolderId === f.id;

              return (
                <div 
                  key={f.id}
                  onClick={() => { if (!isEditing) { setSelectedFolderId(f.id); setViewMode('questions'); } }}
                  className="collection-card group"
                >
                  {/* Card Header */}
                  <div className="collection-card-header">
                    <div className="collection-card-icon custom">
                      <Folder size={20} className="fill-[var(--primary)]/10" />
                    </div>
                    <span className="collection-card-badge custom font-extrabold">
                      {f.count} câu hỏi
                    </span>
                  </div>

                  {/* Card Content & Action Bar */}
                  <div className="space-y-2 mt-auto text-left">
                    {isEditing ? (
                      <div className="flex items-center gap-1.5 w-full" onClick={e => e.stopPropagation()}>
                        <input
                          type="text"
                          value={editingFolderName}
                          onChange={(e) => setEditingFolderName(e.target.value)}
                          className="flex-1 bg-slate-50 border border-slate-200 focus:border-[var(--primary)] rounded-2xl px-3 py-2 text-xs font-extrabold text-slate-700 outline-none"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleRenameFolder(f.id);
                            if (e.key === 'Escape') setEditingFolderId(null);
                          }}
                        />
                        <button
                          onClick={() => handleRenameFolder(f.id)}
                          className="p-2 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-xl transition-all cursor-pointer"
                        >
                          <Check size={14} />
                        </button>
                        <button
                          onClick={() => setEditingFolderId(null)}
                          className="p-2 bg-slate-50 text-slate-400 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ) : (
                      <>
                        <h3 className="text-base font-extrabold text-slate-800 tracking-tight group-hover:text-[var(--primary)] transition-colors truncate">
                          {f.name}
                        </h3>
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-semibold text-slate-400 group-hover:text-slate-500 transition-colors">
                            Xem chi tiết →
                          </span>
                          
                          {/* Minimal Inline Actions at bottom right, visible on hover */}
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all duration-300 bg-slate-50 border border-slate-100 rounded-xl p-1 shadow-sm" onClick={e => e.stopPropagation()}>
                            <button
                              onClick={() => {
                                setEditingFolderId(f.id);
                                setEditingFolderName(f.name);
                              }}
                              className="p-1.5 text-slate-400 hover:text-[var(--primary)] hover:bg-white rounded-lg transition-all cursor-pointer"
                              title="Đổi tên bộ sưu tập"
                            >
                              <Edit3 size={13} />
                            </button>
                            <button
                              onClick={() => handleDeleteFolder(f.id)}
                              className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-white rounded-lg transition-all cursor-pointer"
                              title="Xóa bộ sưu tập"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Card: Add new collection */}
            <div 
              onClick={() => setShowCreateFolderModal(true)}
              className="collection-card collection-card-new group"
            >
              <div className="collection-card-new-icon shadow-inner">
                <Plus size={24} />
              </div>
              <div className="text-center w-full">
                <h3 className="text-sm font-black text-slate-700 group-hover:text-[var(--primary)] transition-colors">Tạo bộ sưu tập mới</h3>
                <p className="text-[10px] font-semibold text-slate-400 mt-1 max-w-[190px] mx-auto">Phân loại các câu hỏi đã lưu theo chủ đề mong muốn</p>
              </div>
            </div>
          </div>

          {/* Modal: Create Folder */}
          {showCreateFolderModal && (
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fadeIn">
              <div 
                className="bg-white shadow-2xl text-left"
                style={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  maxHeight: '85vh', 
                  minHeight: '340px', 
                  width: '100%',
                  maxWidth: '440px',
                  borderRadius: '28px',
                  overflow: 'hidden', 
                  border: '1px solid var(--border)' 
                }}
              >
                {/* Header */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '20px 24px',
                  borderBottom: '1px solid #f1f5f9',
                  flexShrink: 0
                }}>
                  <h4 
                    className="text-[var(--text)]"
                    style={{ 
                      fontSize: '16px', 
                      fontWeight: 900, 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '10px',
                      margin: 0
                    }}
                  >
                    <FolderPlus size={20} className="text-[var(--primary)]" />
                    Tạo bộ sưu tập mới
                  </h4>
                  <button 
                    onClick={() => setShowCreateFolderModal(false)}
                    className="text-slate-400 hover:text-slate-600 bg-slate-100 flex items-center justify-center transition-colors cursor-pointer"
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      border: 'none',
                      outline: 'none'
                    }}
                  >
                    <X size={16} />
                  </button>
                </div>

                {/* Body */}
                <div style={{
                  padding: '24px',
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '20px'
                }}>
                  <p 
                    className="text-[var(--text-muted)]"
                    style={{
                      fontSize: '12px',
                      fontWeight: 600,
                      lineHeight: '1.6',
                      margin: 0
                    }}
                  >
                    Nhập tên bộ sưu tập của bạn để bắt đầu lưu, phân loại và quản lý các câu hỏi toán học theo chuyên đề hoặc mục đích ôn tập.
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <label style={{
                      fontSize: '10px',
                      fontWeight: 900,
                      color: '#64748b',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      margin: 0
                    }}>
                      Tên bộ sưu tập
                    </label>
                    <input
                      type="text"
                      placeholder="Ví dụ: Công thức tính nhanh, Hình học Oxyz..."
                      value={newFolderName}
                      onChange={(e) => setNewFolderName(e.target.value)}
                      className="bg-slate-50 focus:bg-white transition-all"
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        border: '1px solid var(--border)',
                        borderRadius: '12px',
                        fontSize: '13px',
                        fontWeight: 'bold',
                        color: 'var(--text)',
                        outline: 'none',
                        boxShadow: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.04)'
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleCreateFolder();
                        }
                      }}
                    />
                  </div>
                </div>

                {/* Footer */}
                <div style={{
                  backgroundColor: '#fffbf9',
                  borderTop: '1px solid #f1f5f9',
                  padding: '16px 24px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'flex-end',
                  gap: '12px',
                  flexShrink: 0
                }}>
                  <button
                    onClick={() => setShowCreateFolderModal(false)}
                    className="hover:bg-slate-50 transition-all cursor-pointer"
                    style={{
                      padding: '10px 20px',
                      backgroundColor: '#ffffff',
                      border: '1px solid #e2e8f0',
                      borderRadius: '12px',
                      color: '#64748b',
                      fontSize: '12px',
                      fontWeight: 900,
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em'
                    }}
                  >
                    Hủy
                  </button>
                  <button
                    onClick={handleCreateFolder}
                    className="hover:opacity-90 transition-all cursor-pointer"
                    style={{
                      padding: '10px 20px',
                      backgroundColor: 'var(--primary)',
                      border: 'none',
                      borderRadius: '12px',
                      color: '#ffffff',
                      fontSize: '12px',
                      fontWeight: 900,
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}
                  >
                    Tạo bộ sưu tập
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // 2. RENDER QUESTIONS LIST VIEW FOR SELECTED COLLECTION
  const currentFolderName = selectedFolderId === 'UNASSIGNED' 
    ? 'Chưa phân loại' 
    : folders.find(f => f.id === selectedFolderId)?.name || 'Bộ sưu tập';

  const isCustomFolder = selectedFolderId !== 'UNASSIGNED';

  return (
    <div className="container animate-fadeIn" style={{ maxWidth: 1000, padding: '32px 16px' }}>
      <div className="space-y-6 pb-6 text-left">
        
        {/* Navigation Header */}
        <div className="collections-header-bar">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setViewMode('collections')}
              className="flex items-center gap-1.5 px-4 py-2 bg-[var(--primary-light)] border border-[var(--primary-light)] text-[var(--primary)] hover:bg-[var(--primary)] hover:text-white rounded-xl font-bold text-xs uppercase shadow-sm transition-all cursor-pointer mr-2"
            >
              ← Tất cả bộ sưu tập
            </button>
            
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-xl font-extrabold text-[var(--text)] flex items-center gap-2">
                {currentFolderName}
                <span className="px-2.5 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-100 font-extrabold text-[10px] rounded-full uppercase tracking-wider">
                  {filteredBookmarks.length} câu hỏi
                </span>
              </h2>

              {/* Quick Rename/Delete buttons in header if it's a custom folder */}
              {isCustomFolder && (
                <div className="flex items-center gap-1.5 ml-2 border-l border-slate-200 pl-3">
                  <button
                    onClick={async () => {
                      const newName = await prompt("Nhập tên mới cho bộ sưu tập:", currentFolderName, "Đổi tên bộ sưu tập");
                      if (newName && newName.trim() && newName.trim() !== currentFolderName) {
                        handleRenameFolder(selectedFolderId, newName.trim());
                      }
                    }}
                    className="p-1.5 text-slate-400 hover:text-[var(--primary)] hover:bg-slate-50 rounded-xl transition-all cursor-pointer"
                    title="Đổi tên bộ sưu tập"
                  >
                    <Edit3 size={14} />
                  </button>
                  <button
                    onClick={() => handleDeleteFolder(selectedFolderId)}
                    className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-rose-50 rounded-xl transition-all cursor-pointer"
                    title="Xóa bộ sưu tập"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Add questions button */}
          {isCustomFolder && (
            <button 
              onClick={handleOpenAddQuestionsModal}
              className="btn btn-primary flex items-center gap-1.5 text-xs"
            >
              <Plus size={14} /> Chọn từ kho lưu trữ
            </button>
          )}
        </div>

        {/* Search Panel */}
        <div style={{ position: 'relative', width: '100%', marginBottom: '24px' }}>
            <Search 
              className="text-slate-400" 
              size={20} 
              style={{ 
                position: 'absolute', 
                left: '20px', 
                top: '50%', 
                transform: 'translateY(-50%)',
                pointerEvents: 'none'
              }} 
            />
            <input
              type="text"
              placeholder="Tìm kiếm trong bộ sưu tập này..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                paddingLeft: '56px',
                paddingRight: '20px',
                paddingTop: '16px',
                paddingBottom: '16px',
                backgroundColor: '#ffffff',
                border: '1.5px solid var(--border)',
                borderRadius: '24px',
                fontSize: '1rem',
                fontWeight: '600',
                color: 'var(--text)',
                outline: 'none',
                transition: 'border-color var(--transition), box-shadow var(--transition)',
                boxShadow: 'var(--shadow-sm)'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = 'var(--primary)';
                e.target.style.boxShadow = '0 0 0 4px rgba(43, 85, 222, 0.1)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'var(--border)';
                e.target.style.boxShadow = 'var(--shadow-sm)';
              }}
            />
          </div>

          {error && (
            <div className="p-4 bg-rose-50 text-rose-800 border border-rose-200 rounded-xl text-xs font-bold text-center animate-fadeIn">
              {error}
            </div>
          )}

          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 space-y-3">
              <div className="w-10 h-10 border-4 border-[var(--primary)] border-t-transparent rounded-full animate-spin" />
              <p className="text-xs font-black text-[var(--text-muted)] tracking-widest uppercase">Đang tải câu hỏi...</p>
            </div>
          ) : filteredBookmarks.length === 0 ? (
            <div 
              className="bg-white border border-[var(--border)] rounded-[24px] p-12 shadow-sm animate-fadeIn"
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center',
                gap: '16px'
              }}
            >
              <div 
                className="bg-slate-50 border border-dashed border-[var(--border)] rounded-full flex items-center justify-center text-slate-400"
                style={{
                  width: '64px',
                  height: '64px'
                }}
              >
                <Bookmark size={28} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                <h3 className="text-lg font-extrabold text-[var(--text)]" style={{ margin: 0 }}>
                  Bộ sưu tập này trống
                </h3>
                <p className="text-xs font-semibold text-[var(--text-muted)] max-w-sm leading-relaxed" style={{ margin: 0 }}>
                  {isCustomFolder 
                    ? 'Hãy click nút "Chọn từ kho lưu trữ" ở trên để chọn các câu hỏi đã lưu đưa vào bộ sưu tập này.'
                    : 'Không có câu hỏi chưa phân loại nào phù hợp.'}
                </p>
              </div>
            </div>
          ) : (
            <div 
              className="animate-fadeIn"
              style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}
            >
              {filteredBookmarks.map((b) => {
                const q = b.question;
                if (!q) return null;
                const isExpanded = expandedId === q.id;

                return (
                  <div 
                    key={b.id} 
                    className={`bg-white border rounded-[20px] overflow-hidden shadow-sm hover:shadow-md transition-all duration-200 ${
                      b.isPinned ? 'border-amber-300 ring-2 ring-amber-100/50' : 'border-[var(--border)]'
                    }`}
                    style={{ display: 'flex', flexDirection: 'column' }}
                  >
                    {/* Question Header Row */}
                    <div 
                      className="flex items-start justify-between gap-4 cursor-pointer select-none"
                      style={{ padding: '24px' }}
                      onClick={() => setExpandedId(isExpanded ? null : q.id)}
                    >
                      <div className="space-y-2 flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          {/* Pinned badge */}
                          {b.isPinned && (
                            <span className="inline-flex items-center gap-0.5 bg-amber-50 text-amber-700 px-2.5 py-1 rounded-full text-[8px] font-black uppercase tracking-wider border border-amber-200 shadow-sm">
                              📌 Đã ghim
                            </span>
                          )}
                          <span className="inline-flex items-center bg-[var(--primary-light)] text-[var(--primary)] px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider border border-[var(--primary-light)]">
                            {q.topic?.title || q.topicTitle || 'Chuyên đề'}
                          </span>
                          {q.test?.title && (
                            <span className="inline-flex items-center bg-sky-50 text-sky-700 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider border border-sky-100">
                              Đề: {q.test.title}
                            </span>
                          )}
                          <span className="inline-flex items-center bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider border border-emerald-100">
                            {q.section === 'I' ? 'Phần I: Nhiều lựa chọn' : q.section === 'II' ? 'Phần II: Đúng/Sai' : 'Phần III: Trả lời ngắn'}
                          </span>
                          {b.note && (
                            <span className="inline-flex items-center gap-0.5 bg-amber-50 text-amber-700 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider border border-amber-100">
                              📝 Có ghi chú
                            </span>
                          )}

                          {/* Move out of folder / move to uncategorized option */}
                          {isCustomFolder && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRemoveFromFolder(b.id);
                              }}
                              className="inline-flex items-center bg-slate-50 border border-slate-200 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-full px-2.5 py-1 text-[9px] font-black uppercase tracking-wider transition-colors cursor-pointer"
                            >
                              Gỡ khỏi bộ sưu tập
                            </button>
                          )}
                        </div>
                        <div className="text-sm md:text-base font-extrabold text-[var(--text)] leading-relaxed pr-6 mt-1 text-left">
                          {renderMathText(q.question)}
                        </div>
                      </div>
                      
                      {/* Actions */}
                      <div className="flex items-center gap-1.5 shrink-0" onClick={e => e.stopPropagation()}>
                        {/* Pin button */}
                        <button
                          onClick={() => handleTogglePin(b)}
                          className={`p-2 rounded-xl transition-all cursor-pointer border ${
                            b.isPinned 
                              ? 'text-amber-600 bg-amber-50 border-amber-200 hover:bg-amber-100' 
                              : 'text-slate-400 border-slate-100 hover:text-amber-600 hover:bg-amber-50'
                          }`}
                          title={b.isPinned ? "Bỏ ghim câu hỏi" : "Ghim câu hỏi lên đầu"}
                        >
                          <Pin size={16} className={b.isPinned ? 'fill-amber-600' : ''} />
                        </button>

                        {/* Trash/Remove button (Unsave entirely) */}
                        <button
                          onClick={() => handleRemove(q.id)}
                          className="p-2 text-slate-400 hover:text-red-500 hover:bg-rose-50 border border-slate-100 hover:border-rose-200 rounded-xl transition-all cursor-pointer"
                          title="Xóa khỏi danh sách lưu"
                        >
                          <Trash2 size={16} />
                        </button>
                        
                        {/* Expand button */}
                        <button
                          onClick={() => setExpandedId(isExpanded ? null : q.id)}
                          className="p-2 text-slate-400 hover:text-[var(--primary)] hover:bg-[var(--primary-light)] border border-slate-100 rounded-xl transition-all cursor-pointer"
                        >
                          {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                        </button>
                      </div>
                    </div>

                    {/* Images in question */}
                    {((q.images && q.images.length > 0) || q.image) && (
                      <div className="px-6 pb-4 flex flex-col gap-4">
                        {q.images && q.images.map((imgUrl, imgIdx) => (
                          <div key={imgIdx} className="bg-white border border-slate-200 rounded-2xl p-3 flex justify-center max-w-md shadow-inner">
                            <img alt="Question graphic" className="w-full h-auto rounded-lg bg-white" src={imgUrl} />
                          </div>
                        ))}
                        {q.image && !q.images && (
                          <div className="bg-white border border-slate-200 rounded-2xl p-3 flex justify-center max-w-md shadow-inner">
                            <img alt="Question graphic" className="w-full h-auto rounded-lg bg-white" src={q.image} />
                          </div>
                        )}
                      </div>
                    )}

                    {/* Expanded Answer and Solution Detail */}
                    {isExpanded && (
                      <div 
                        className="border-t border-[var(--border)] bg-slate-50/50 animate-fadeIn"
                        style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}
                      >
                        {/* Choices or Answer Display */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                          <h4 className="font-extrabold text-xs text-[var(--text-muted)] uppercase tracking-wider text-left" style={{ margin: 0 }}>Đáp án chính xác:</h4>
                          
                          {(!q.section || q.section === 'I') ? (
                            <div 
                              className="grid grid-cols-1 sm:grid-cols-2"
                              style={{ gap: '16px' }}
                            >
                              {(q.options || []).map((option, optIdx) => {
                                const isCorrectOption = q.answer === optIdx;
                                return (
                                  <div 
                                    key={optIdx} 
                                    className={`flex items-center border rounded-xl shadow-sm text-left ${
                                      isCorrectOption 
                                        ? 'border-emerald-500 bg-emerald-50/60 text-emerald-800' 
                                        : 'border-slate-200 bg-white'
                                      }`}
                                    style={{ padding: '16px', minHeight: '56px' }}
                                  >
                                    <span 
                                      className={`rounded-full flex items-center justify-center font-black text-xs mr-3 ${
                                        isCorrectOption ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-400'
                                      }`}
                                      style={{ width: '28px', height: '28px', flexShrink: 0 }}
                                    >
                                      {String.fromCharCode(65 + optIdx)}
                                    </span>
                                    <span className="font-extrabold text-sm leading-relaxed">{renderMathText(option)}</span>
                                  </div>
                                );
                              })}
                            </div>
                          ) : q.section === 'II' ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                              {(q.tfStatements || []).map((st, sIdx) => {
                                const correctVal = q.answer?.vals?.[sIdx];
                                return (
                                  <div 
                                    key={st.key} 
                                    className="flex justify-between items-center border border-slate-200 rounded-xl bg-white text-sm font-bold shadow-sm text-left"
                                    style={{ padding: '16px' }}
                                  >
                                    <span>{st.key}) {renderMathText(st.text)}</span>
                                    <span className={`px-3 py-1 rounded-lg text-xs font-black text-white ${correctVal === 'Đ' ? 'bg-emerald-500' : 'bg-rose-500'}`}>
                                      {correctVal === 'Đ' ? 'Đúng' : 'Sai'}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          ) : (
                            <div 
                              className="bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl font-bold text-sm flex items-center justify-between shadow-sm"
                              style={{ padding: '16px' }}
                            >
                              <span>Đáp án số học:</span>
                              <span className="font-mono bg-emerald-500 text-white px-4 py-1.5 rounded-lg text-sm font-black">
                                {q.answer?.val}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Explanation Detail */}
                        <div className="bg-[var(--primary-light)]/30 border border-dashed border-[var(--primary-light)] rounded-2xl p-5 space-y-3 text-left shadow-sm">
                          <h4 className="font-bold text-xs text-[var(--primary)] flex items-center gap-1.5 uppercase tracking-wider">
                            <HelpCircle size={16} /> Hướng dẫn giải chi tiết:
                          </h4>
                          <div className="text-xs md:text-sm font-semibold text-[var(--text)] leading-relaxed whitespace-pre-line">
                            {renderMathText(q.explanation)}
                          </div>
                        </div>

                        {/* Personal Notes Section */}
                        <div 
                          className="bg-amber-50/30 border border-dashed border-amber-200 rounded-2xl text-left"
                          style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}
                        >
                          <div className="flex items-center justify-between">
                            <label className="text-xs font-extrabold text-amber-800 uppercase tracking-wider flex items-center gap-1.5">
                              <Edit3 size={14} /> Ghi chú cá nhân của bạn
                            </label>
                            {b.note && (
                              <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-amber-700 bg-amber-100/60 px-2.5 py-1 rounded-md shadow-sm">
                                <Check size={12} /> Đã lưu
                              </span>
                            )}
                          </div>
                          <textarea
                            value={editingNotes[b.id] !== undefined ? editingNotes[b.id] : (b.note || '')}
                            onChange={(e) => setEditingNotes({ ...editingNotes, [b.id]: e.target.value })}
                            placeholder="Nhập công thức, mẹo giải nhanh hoặc lưu ý đặc biệt cho câu này..."
                            rows={4}
                            className="w-full bg-white border border-[var(--border)] focus:border-amber-500 rounded-xl text-sm font-semibold text-[var(--text)] outline-none transition-all resize-none shadow-inner"
                            style={{ padding: '16px', minHeight: '100px', lineHeight: '1.6' }}
                          />
                          <div className="flex justify-end">
                            <button
                              onClick={() => handleSaveNote(b.id, editingNotes[b.id] !== undefined ? editingNotes[b.id] : (b.note || ''))}
                              disabled={savingNoteId === b.id}
                              className="btn btn-primary btn-sm text-xs cursor-pointer shadow-md active:scale-95"
                            >
                              <Save size={12} />
                              {savingNoteId === b.id ? 'Đang lưu...' : 'Lưu ghi chú'}
                            </button>
                          </div>
                        </div>

                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

        {/* ===== BATCH ADD QUESTIONS MODAL ===== */}
        {showAddQuestionsModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-50 p-4">
            <div className="bg-white border border-[var(--border)] rounded-[28px] max-w-2xl w-full overflow-hidden shadow-2xl text-left flex flex-col max-h-[85vh]">
              {/* Modal Header */}
              <div className="bg-gradient-to-r from-[var(--primary)] to-[var(--primary-dark)] p-5 text-white flex justify-between items-center shrink-0">
                <div>
                  <h3 className="text-base font-black flex items-center gap-2">
                    <Bookmark className="w-5 h-5 text-amber-300" />
                    Thêm câu hỏi vào bộ sưu tập
                  </h3>
                  <p className="text-[10px] font-bold text-orange-100 mt-0.5">
                    Chọn các câu hỏi từ Kho lưu trữ để phân loại vào: <span className="underline">{currentFolderName}</span>
                  </p>
                </div>
                <button 
                  onClick={() => setShowAddQuestionsModal(false)}
                  className="text-white/80 hover:text-white font-extrabold text-sm w-7 h-7 rounded-full bg-black/10 flex items-center justify-center transition-colors cursor-pointer"
                >
                  ✕
                </button>
              </div>

              {/* Modal search bar */}
              <div className="p-4 border-b border-[var(--border)] bg-slate-50 shrink-0">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                  <input
                    type="text"
                    placeholder="Tìm kiếm câu hỏi để thêm..."
                    value={modalSearchQuery}
                    onChange={(e) => setModalSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 bg-white border border-[var(--border)] focus:border-[var(--primary)] rounded-xl text-xs font-bold text-[var(--text)] outline-none"
                  />
                </div>
              </div>

              {/* Modal Question List */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[250px]">
                {availableBookmarks.length === 0 ? (
                  <div className="text-center py-10 space-y-2">
                    <Library className="mx-auto text-slate-300" size={36} />
                    <p className="text-xs font-black text-slate-400 uppercase tracking-wide">Không tìm thấy câu hỏi phù hợp</p>
                  </div>
                ) : (
                  availableBookmarks.map((b) => {
                    const q = b.question;
                    if (!q) return null;
                    const isChecked = selectedBookmarkIds.includes(b.id);

                    return (
                      <div 
                        key={b.id}
                        onClick={() => handleToggleSelectBookmark(b.id)}
                        className={`p-3.5 border rounded-2xl cursor-pointer transition-all flex items-start gap-3 select-none ${
                          isChecked 
                            ? 'border-[var(--primary)] bg-[var(--primary-light)]/30 shadow-sm' 
                            : 'border-[var(--border)] bg-white hover:border-slate-300'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {}} // handled by div onClick
                          className="mt-1 accent-[var(--primary)] shrink-0 cursor-pointer"
                        />
                        <div className="space-y-1.5 flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="bg-[var(--primary-light)] text-[var(--primary)] px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider border border-[var(--primary-light)]">
                              {q.topic?.title || q.topicTitle || 'Chuyên đề'}
                            </span>
                            {b.folderId && (
                              <span className="bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded text-[8px] font-bold">
                                Thuộc BST: {folders.find(f => f.id === b.folderId)?.name || 'Khác'}
                              </span>
                            )}
                          </div>
                          <p className="text-xs font-extrabold text-[var(--text)] leading-relaxed break-words text-left">
                            {renderMathText(q.question)}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Modal Footer */}
              <div className="p-4 border-t border-[var(--border)] bg-slate-50 flex justify-between items-center shrink-0">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-wide">
                  Đã chọn: <strong className="text-[var(--primary)]">{selectedBookmarkIds.length}</strong> câu hỏi
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowAddQuestionsModal(false)}
                    className="btn btn-ghost text-xs cursor-pointer"
                  >
                    Hủy
                  </button>
                  <button
                    onClick={handleBatchAddQuestions}
                    disabled={modalLoading || selectedBookmarkIds.length === 0}
                    className="btn btn-primary text-xs cursor-pointer"
                  >
                    {modalLoading ? 'Đang lưu...' : 'Thêm vào bộ sưu tập'}
                  </button>
                </div>
              </div>

            </div>
          </div>
        )}

      </div>
    </div>
  );
}
