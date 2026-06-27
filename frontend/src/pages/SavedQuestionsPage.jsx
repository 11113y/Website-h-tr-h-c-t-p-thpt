import React, { useState, useEffect } from 'react';
import axios from '../api/client';
import { Bookmark, ChevronDown, ChevronUp, HelpCircle, Lock, Trash2, Search, Filter, Pin, Edit3, Save, Check, Folder, Library, X } from 'lucide-react';
import { renderMathText } from './QuizPage';
import { useDialog } from '../contexts/DialogContext';
import { useNavigate } from 'react-router-dom';

export default function SavedQuestionsPage({ isLoggedIn, savedQuestions = [], toggleSaveQuestion }) {
  const navigate = useNavigate();
  const { alert, confirm } = useDialog();
  const [bookmarks, setBookmarks] = useState([]);
  const [folders, setFolders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  const [selectedBookmarkForFolder, setSelectedBookmarkForFolder] = useState(null);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTopic, setFilterTopic] = useState('ALL');
  const [filterSection, setFilterSection] = useState('ALL');
  const [filterTest, setFilterTest] = useState('ALL');
  const [filterFolder, setFilterFolder] = useState('ALL');
  const [filterPinned, setFilterPinned] = useState(false);

  // Notes state
  const [editingNotes, setEditingNotes] = useState({});
  const [savingNoteId, setSavingNoteId] = useState(null);

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

  const handleRemove = async (qId) => {
    const confirmed = await confirm('Bạn có chắc muốn bỏ lưu câu hỏi này?');
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

  const handleMoveToFolder = async (folderId) => {
    if (!selectedBookmarkForFolder) return;
    try {
      const res = await axios.put(`/bookmarks/${selectedBookmarkForFolder.id}`, {
        folderId: folderId
      });
      if (res.data && res.data.success) {
        setBookmarks(prev => prev.map(item => 
          item.id === selectedBookmarkForFolder.id ? { ...item, folderId } : item
        ));
        fetchFolders();
        setSelectedBookmarkForFolder(null);
        alert('Cập nhật bộ sưu tập thành công!');
      }
    } catch (err) {
      console.error(err);
      alert('Không thể cập nhật bộ sưu tập cho câu hỏi.');
    }
  };

  // Get unique topics for dropdown filter
  const uniqueTopics = Array.from(new Set(
    bookmarks
      .map(b => b.question?.topic?.title || b.question?.topicTitle)
      .filter(Boolean)
  )).sort();

  // Get unique tests/exams for dropdown filter
  const uniqueTests = Array.from(new Set(
    bookmarks
      .map(b => b.question?.test?.title)
      .filter(Boolean)
  )).sort();

  // Sort: Pinned first, then by savedAt descending
  const sortedBookmarks = [...bookmarks].sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    return new Date(b.savedAt) - new Date(a.savedAt);
  });

  // Filter bookmarks
  const filteredBookmarks = sortedBookmarks.filter(b => {
    const q = b.question;
    if (!q) return false;

    // Search query (in question title, topic, or personal notes)
    const textToSearch = `${q.question} ${b.note || ''} ${q.topicTitle || ''}`.toLowerCase();
    if (searchQuery && !textToSearch.includes(searchQuery.toLowerCase())) {
      return false;
    }

    // Topic filter
    const qTopic = q.topic?.title || q.topicTitle;
    if (filterTopic !== 'ALL' && qTopic !== filterTopic) {
      return false;
    }

    // Section filter
    if (filterSection !== 'ALL' && q.section !== filterSection) {
      return false;
    }

    // Test filter
    if (filterTest !== 'ALL' && q.test?.title !== filterTest) {
      return false;
    }

    // Pinned filter
    if (filterPinned && !b.isPinned) {
      return false;
    }

    // Folder filter
    if (filterFolder !== 'ALL') {
      if (filterFolder === 'UNASSIGNED') {
        if (b.folderId) return false;
      } else {
        if (b.folderId !== filterFolder) return false;
      }
    }

    return true;
  });

  if (!isLoggedIn) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-8 text-center max-w-md mx-auto space-y-6 animate-fadeIn">
        <div className="w-20 h-20 bg-[var(--accent-light)] rounded-full flex items-center justify-center text-[var(--accent)] shadow-inner animate-pulse">
          <Lock size={40} />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-extrabold text-[var(--text)]">Kho lưu trữ cá nhân</h2>
          <p className="text-sm font-semibold text-[var(--text-muted)] leading-relaxed">
            Đăng nhập tài khoản để lưu trữ các câu hỏi toán học quan trọng, xem lại lời giải chi tiết và đồng bộ hóa trên mọi thiết bị.
          </p>
        </div>
        <button
          onClick={() => navigate('/login')}
          className="w-full bg-[var(--primary)] text-white py-3.5 rounded-[16px] font-bold shadow-lg hover:bg-[var(--primary-dark)] transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
        >
          Đăng nhập ngay
        </button>
      </div>
    );
  }

  return (
    <div className="container" style={{ maxWidth: 1000, padding: '32px 16px' }}>
      <div className="space-y-6 pb-6 text-left animate-fadeIn">
        
        {/* Navigation Header */}
        <div className="collections-header-bar">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-[var(--primary-light)] text-[var(--primary)] rounded-2xl shadow-sm border border-[var(--primary-light)]">
              <Library size={28} />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-[var(--text)] flex items-center gap-2">
                Kho lưu trữ câu hỏi
                <span className="px-2.5 py-0.5 bg-[var(--primary-light)] text-[var(--primary)] font-extrabold text-xs rounded-full uppercase tracking-wider">
                  {bookmarks.length} câu hỏi
                </span>
              </h2>
              <p className="text-xs font-bold text-[var(--text-muted)] mt-1">Nơi lưu giữ tất cả các câu hỏi toán bạn đã đánh dấu trong quá trình học tập</p>
            </div>
          </div>
          <button 
            onClick={() => navigate('/collections')}
            className="btn btn-outline flex items-center gap-2 text-xs"
          >
            <Folder className="w-4 h-4" /> Quản lý Bộ sưu tập
          </button>
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
            placeholder="Tìm kiếm theo đề bài, ghi chú, chuyên đề..."
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
            <p className="text-xs font-black text-[var(--text-muted)] tracking-widest uppercase">Đang tải câu hỏi đã lưu...</p>
          </div>
        ) : filteredBookmarks.length === 0 ? (
          <div 
            className="bg-white border border-[var(--border)] rounded-[24px] p-16 shadow-sm animate-fadeIn"
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
              style={{
                width: '64px',
                height: '64px',
                backgroundColor: 'var(--bg)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--text-muted)',
                border: '1.5px dashed var(--border)'
              }}
            >
              <Bookmark size={28} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: '800', color: 'var(--text)', margin: 0 }}>
                Không tìm thấy câu hỏi nào
              </h3>
              <p style={{ fontSize: '0.9rem', fontWeight: '600', color: 'var(--text-muted)', maxWidth: '400px', margin: 0, lineHeight: '1.6' }}>
                Thử thay đổi từ khóa tìm kiếm để hiển thị các câu hỏi đã lưu của bạn nhé.
              </p>
            </div>
          </div>
        ) : (
          <div className="animate-fadeIn" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {filteredBookmarks.map((b) => {
              const q = b.question;
              if (!q) return null;
              const isExpanded = expandedId === q.id;
              
              // Resolve folder / collection label
              const currentFolder = folders.find(f => f.id === b.folderId);
              const folderLabel = currentFolder ? `BST: ${currentFolder.name}` : "Thêm vào bộ sưu tập";

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
                    <div className="space-y-2.5 flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        {/* Pinned badge */}
                        {b.isPinned && (
                          <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border border-amber-200 shadow-sm">
                            📌 Đã ghim
                          </span>
                        )}
                        <span className="inline-flex items-center bg-[var(--primary-light)] text-[var(--primary)] px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border border-[var(--primary-light)]">
                          {q.topic?.title || q.topicTitle || 'Chuyên đề'}
                        </span>
                        {q.test?.title && (
                          <span className="inline-flex items-center bg-sky-50 text-sky-700 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border border-sky-100">
                            Đề: {q.test.title}
                          </span>
                        )}
                        <span className="inline-flex items-center bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border border-emerald-100">
                          {q.section === 'I' ? 'Phần I: Nhiều lựa chọn' : q.section === 'II' ? 'Phần II: Đúng/Sai' : 'Phần III: Trả lời ngắn'}
                        </span>
                        {b.note && (
                          <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border border-amber-100">
                            📝 Có ghi chú
                          </span>
                        )}
                      </div>
                      <div className="text-sm md:text-base font-extrabold text-[var(--text)] leading-relaxed pr-6 mt-1 text-left">
                        {renderMathText(q.question)}
                      </div>
                    </div>
                    
                    {/* Actions */}
                    <div className="flex items-center gap-1.5 shrink-0" onClick={e => e.stopPropagation()}>
                      {/* Folder / Collection button */}
                      <button
                        onClick={() => {
                          setSelectedBookmarkForFolder(b);
                        }}
                        className={`p-2 rounded-xl transition-all cursor-pointer border ${
                          currentFolder 
                            ? 'text-emerald-600 bg-emerald-50 border-emerald-200 hover:bg-emerald-100' 
                            : 'text-slate-400 border-slate-100 hover:text-[var(--primary)] hover:bg-[var(--primary-light)]'
                        }`}
                        title={folderLabel}
                      >
                        <Folder size={16} className={currentFolder ? 'fill-emerald-600/10' : ''} />
                      </button>

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

                      {/* Trash/Remove button */}
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
                    <div className="px-6 pb-5 flex flex-col gap-4">
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
      </div>

      {/* Modal: Select Folder / Collection */}
      {selectedBookmarkForFolder && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div 
            className="bg-white border border-[var(--border)] rounded-[28px] max-w-md w-full overflow-hidden shadow-2xl text-left flex flex-col max-h-[85vh]"
            style={{ minHeight: '360px' }}
          >
            <div className="border-b border-slate-100 flex justify-between items-center bg-slate-50/50" style={{ padding: '24px' }}>
              <div>
                <h3 className="text-lg font-extrabold text-[var(--text)] flex items-center gap-2">
                  <Folder className="w-5.5 h-5.5 text-[var(--primary)]" />
                  Lưu vào bộ sưu tập
                </h3>
                <p className="text-xs font-bold text-[var(--text-muted)] mt-1">
                  Chọn bộ sưu tập để phân loại câu hỏi này
                </p>
              </div>
              <button 
                onClick={() => setSelectedBookmarkForFolder(null)}
                className="text-slate-400 hover:text-slate-600 font-extrabold text-sm w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>
            
            <div className="overflow-y-auto" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '12px', flex: 1 }}>
              {/* Option: Unassigned */}
              <button
                onClick={() => handleMoveToFolder(null)}
                className={`w-full border rounded-2xl flex items-center justify-between text-sm font-bold transition-all cursor-pointer ${
                  !selectedBookmarkForFolder.folderId 
                    ? 'border-[var(--primary)] bg-[var(--primary-light)] text-[var(--primary)]' 
                    : 'border-slate-100 hover:border-slate-200 text-slate-700 bg-white'
                }`}
                style={{ padding: '16px 20px', minHeight: '56px' }}
              >
                <span>Chưa phân loại (Mặc định)</span>
                {!selectedBookmarkForFolder.folderId && <Check size={18} className="text-[var(--primary)]" />}
              </button>

              {folders.map(f => {
                const isCurrent = selectedBookmarkForFolder.folderId === f.id;
                return (
                  <button
                    key={f.id}
                    onClick={() => handleMoveToFolder(f.id)}
                    className={`w-full border rounded-2xl flex items-center justify-between text-sm font-bold transition-all cursor-pointer ${
                      isCurrent 
                        ? 'border-[var(--primary)] bg-[var(--primary-light)]/50 text-[var(--primary)]' 
                        : 'border-slate-100 hover:border-slate-200 text-slate-700 bg-white'
                    }`}
                    style={{ padding: '16px 20px', minHeight: '56px' }}
                  >
                    <span>{f.name}</span>
                    {isCurrent && <Check size={18} className="text-[var(--primary)]" />}
                  </button>
                );
              })}

              {folders.length === 0 && (
                <div className="text-center py-8 text-[var(--text-muted)] text-sm font-bold" style={{ display: 'flex', flexDirection: 'column', gap: '12px', alignItems: 'center' }}>
                  <span>Chưa có bộ sưu tập nào. Hãy sang trang Bộ sưu tập để tạo mới!</span>
                </div>
              )}
            </div>
            
            <div className="border-t border-slate-100 bg-slate-50/50" style={{ padding: '20px 24px', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button
                onClick={() => {
                  setSelectedBookmarkForFolder(null);
                  navigate('/collections');
                }}
                className="btn btn-outline text-xs cursor-pointer"
                style={{ padding: '10px 18px', height: '40px' }}
              >
                Quản lý bộ sưu tập
              </button>
              <button
                onClick={() => setSelectedBookmarkForFolder(null)}
                className="btn btn-ghost text-xs cursor-pointer"
                style={{ padding: '10px 18px', height: '40px' }}
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
