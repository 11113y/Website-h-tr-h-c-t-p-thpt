import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  FileText, Plus, Edit, Trash2, Search, ArrowLeft, Download, 
  ExternalLink, Paperclip, Upload, X, Save, AlertCircle, Eye, 
  Folder, BookOpen, ChevronDown, Check, Link as LinkIcon, AlertTriangle
} from 'lucide-react';
import Pagination from './shared/Pagination';

export default function AdminArticles({ showAlert, setConfirmModal }) {

  const [activeTab, setActiveTab] = useState('articles'); // 'articles' | 'categories'
  
  // Articles state
  const [articles, setArticles] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedType, setSelectedType] = useState('all');

  // Pagination states
  const [articlePage, setArticlePage] = useState(1);
  const [categoryPage, setCategoryPage] = useState(1);
  const ARTICLE_PAGE_SIZE = 20;
  const CATEGORY_PAGE_SIZE = 20;

  const handleSearchTermChange = (val) => {
    setSearchTerm(val);
    setArticlePage(1);
  };
  const handleCategoryFilterChange = (val) => {
    setSelectedCategory(val);
    setArticlePage(1);
  };
  const handleTypeFilterChange = (val) => {
    setSelectedType(val);
    setArticlePage(1);
  };
  
  // Article Modal
  const [showArticleModal, setShowArticleModal] = useState(false);
  const [articleModalType, setArticleModalType] = useState('add'); // 'add' | 'edit'
  const [articleForm, setArticleForm] = useState({
    id: '',
    title: '',
    description: '',
    content: '',
    thumbnail: '',
    type: 'NORMAL', // 'NORMAL' | 'DOWNLOAD'
    fileUrl: '',
    categoryId: '',
    vipPoints: 0
  });
  
  // Category Modal
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [categoryModalType, setCategoryModalType] = useState('add'); // 'add' | 'edit'
  const [categoryForm, setCategoryForm] = useState({
    id: '',
    name: ''
  });

  // Upload state
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');

  // Thumbnail Upload state
  const [uploadProgressThumbnail, setUploadProgressThumbnail] = useState(0);
  const [isUploadingThumbnail, setIsUploadingThumbnail] = useState(false);
  const [uploadErrorThumbnail, setUploadErrorThumbnail] = useState('');
  
  // General validation errors
  const [formError, setFormError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Fetch all articles and categories
  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [articlesRes, categoriesRes] = await Promise.all([
        axios.get('/api/articles', { withCredentials: true }),
        axios.get('/api/articles/categories', { withCredentials: true })
      ]);
      
      if (articlesRes.data && articlesRes.data.success) {
        setArticles(articlesRes.data.articles);
      }
      if (categoriesRes.data && categoriesRes.data.success) {
        setCategories(categoriesRes.data.categories);
      }
    } catch (error) {
      console.error('Lỗi khi tải dữ liệu bài viết:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Handle article delete
  const handleDeleteArticle = (id) => {
    setConfirmModal({
      show: true,
      title: 'Xóa bài viết',
      message: 'Bạn có chắc chắn muốn xóa bài viết này không?',
      type: 'warning',
      isAlert: false,
      onConfirm: async () => {
        try {
          const res = await axios.delete(`/api/articles/${id}`, { withCredentials: true });
          if (res.data && res.data.success) {
            showAlert('Xóa bài viết thành công.', 'Thành công', 'success');
            fetchData();
          }
        } catch (error) {
          showAlert(error.response?.data?.message || 'Đã xảy ra lỗi khi xóa bài viết.', 'Lỗi', 'error');
        }
      }
    });
  };

  // Handle category delete
  const handleDeleteCategory = (id) => {
    const category = categories.find(c => c.id === id);
    const postCount = category?._count?.articles || 0;
    const msg = postCount > 0 
      ? `Danh mục này đang có ${postCount} bài viết. Xóa danh mục sẽ xóa toàn bộ bài viết thuộc danh mục này. Bạn có chắc chắn muốn tiếp tục không?`
      : 'Bạn có chắc chắn muốn xóa danh mục này không?';

    setConfirmModal({
      show: true,
      title: 'Xóa danh mục bài viết',
      message: msg,
      type: 'warning',
      isAlert: false,
      onConfirm: async () => {
        try {
          const res = await axios.delete(`/api/articles/categories/${id}`, { withCredentials: true });
          if (res.data && res.data.success) {
            showAlert('Xóa danh mục thành công.', 'Thành công', 'success');
            fetchData();
          }
        } catch (error) {
          showAlert(error.response?.data?.message || 'Đã xảy ra lỗi khi xóa danh mục.', 'Lỗi', 'error');
        }
      }
    });
  };

  // Handle file upload
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadError('');
    setUploadProgress(10);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await axios.post('/api/articles/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(Math.max(10, percentCompleted));
        },
        withCredentials: true
      });

      if (res.data && res.data.success) {
        setArticleForm(prev => ({
          ...prev,
          fileUrl: res.data.fileUrl
        }));
        setUploadProgress(100);
      }
    } catch (error) {
      setUploadError(error.response?.data?.message || 'Tải file lên thất bại.');
    } finally {
      setTimeout(() => {
        setIsUploading(false);
        setUploadProgress(0);
      }, 500);
    }
  };

  // Handle thumbnail upload
  const handleThumbnailUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setUploadErrorThumbnail('Vui lòng chọn file hình ảnh (png, jpg, jpeg, webp, gif).');
      return;
    }

    setIsUploadingThumbnail(true);
    setUploadErrorThumbnail('');
    setUploadProgressThumbnail(10);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await axios.post('/api/articles/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgressThumbnail(Math.max(10, percentCompleted));
        },
        withCredentials: true
      });

      if (res.data && res.data.success) {
        setArticleForm(prev => ({
          ...prev,
          thumbnail: res.data.fileUrl
        }));
        setUploadProgressThumbnail(100);
      }
    } catch (error) {
      setUploadErrorThumbnail(error.response?.data?.message || 'Tải ảnh lên thất bại.');
    } finally {
      setTimeout(() => {
        setIsUploadingThumbnail(false);
        setUploadProgressThumbnail(0);
      }, 500);
    }
  };

  // Handle Article submit (create or update)
  const handleSubmitArticle = async (e) => {
    e.preventDefault();
    setFormError('');
    
    if (!articleForm.title.trim()) {
      setFormError('Vui lòng điền tiêu đề bài viết.');
      return;
    }
    if (!articleForm.categoryId) {
      setFormError('Vui lòng chọn danh mục bài viết.');
      return;
    }
    if (articleForm.type === 'DOWNLOAD' && !articleForm.fileUrl.trim()) {
      setFormError('Vui lòng tải file lên hoặc nhập link tải Drive.');
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        title: articleForm.title,
        description: articleForm.description,
        content: articleForm.content,
        thumbnail: articleForm.thumbnail,
        type: articleForm.type,
        fileUrl: articleForm.type === 'DOWNLOAD' ? articleForm.fileUrl : null,
        categoryId: articleForm.categoryId,
        vipPoints: Number(articleForm.vipPoints || 0)
      };

      let res;
      if (articleModalType === 'add') {
        res = await axios.post('/api/articles', payload, { withCredentials: true });
      } else {
        res = await axios.put(`/api/articles/${articleForm.id}`, payload, { withCredentials: true });
      }

      if (res.data && res.data.success) {
        showAlert(articleModalType === 'add' ? 'Thêm bài viết thành công.' : 'Cập nhật bài viết thành công.', 'Thành công', 'success');
        setShowArticleModal(false);
        fetchData();
      }
    } catch (error) {
      setFormError(error.response?.data?.message || 'Lỗi khi lưu bài viết.');
    } finally {
      setIsSaving(false);
    }
  };

  // Handle Category submit (create or update)
  const handleSubmitCategory = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!categoryForm.name.trim()) {
      setFormError('Vui lòng điền tên danh mục.');
      return;
    }

    setIsSaving(true);
    try {
      let res;
      if (categoryModalType === 'add') {
        res = await axios.post('/api/articles/categories', { name: categoryForm.name }, { withCredentials: true });
      } else {
        res = await axios.put(`/api/articles/categories/${categoryForm.id}`, { name: categoryForm.name }, { withCredentials: true });
      }

      if (res.data && res.data.success) {
        showAlert(categoryModalType === 'add' ? 'Thêm danh mục thành công.' : 'Cập nhật danh mục thành công.', 'Thành công', 'success');
        setShowCategoryModal(false);
        fetchData();
      }
    } catch (error) {
      setFormError(error.response?.data?.message || 'Lỗi khi lưu danh mục.');
    } finally {
      setIsSaving(false);
    }
  };

  // Open Add Article modal
  const openAddArticleModal = () => {
    setArticleModalType('add');
    setArticleForm({
      id: '',
      title: '',
      description: '',
      content: '',
      thumbnail: '',
      type: 'NORMAL',
      fileUrl: '',
      categoryId: categories[0]?.id || '',
      vipPoints: 0
    });
    setFormError('');
    setShowArticleModal(true);
  };

  // Open Edit Article modal
  const openEditArticleModal = (article) => {
    setArticleModalType('edit');
    setArticleForm({
      id: article.id,
      title: article.title,
      description: article.description || '',
      content: article.content || '',
      thumbnail: article.thumbnail || '',
      type: article.type,
      fileUrl: article.fileUrl || '',
      categoryId: article.categoryId,
      vipPoints: article.vipPoints || 0
    });
    setFormError('');
    setShowArticleModal(true);
  };

  // Open Add Category modal
  const openAddCategoryModal = () => {
    setCategoryModalType('add');
    setCategoryForm({ id: '', name: '' });
    setFormError('');
    setShowCategoryModal(true);
  };

  // Open Edit Category modal
  const openEditCategoryModal = (cat) => {
    setCategoryModalType('edit');
    setCategoryForm({ id: cat.id, name: cat.name });
    setFormError('');
    setShowCategoryModal(true);
  };

  // Filtered articles
  const filteredArticles = articles.filter(article => {
    const matchesSearch = article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (article.description && article.description.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = selectedCategory === 'all' || article.categoryId === selectedCategory;
    const matchesType = selectedType === 'all' || article.type === selectedType;
    return matchesSearch && matchesCategory && matchesType;
  });

  const totalArticlePages = Math.ceil(filteredArticles.length / ARTICLE_PAGE_SIZE);
  const pagedArticles = filteredArticles.slice(
    (articlePage - 1) * ARTICLE_PAGE_SIZE,
    articlePage * ARTICLE_PAGE_SIZE
  );

  const totalCategoryPages = Math.ceil(categories.length / CATEGORY_PAGE_SIZE);
  const pagedCategories = categories.slice(
    (categoryPage - 1) * CATEGORY_PAGE_SIZE,
    categoryPage * CATEGORY_PAGE_SIZE
  );

  return (
    <div className="space-y-6 text-left animate-fadeIn">
      {/* Upper header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b border-[#dfc0b7]/20">
        <div className="space-y-1">
          <h2 className="text-3xl font-black text-[#241916]">Quản lý Bài viết & Tài liệu</h2>
          <p className="text-xs font-bold text-[#8b716a]">
            Đăng các bài viết học tập thông thường hoặc đính kèm các tài liệu tải về dạng file/link Google Drive cho học sinh.
          </p>
        </div>
        
        {/* Tab switcher inside view */}
        <div className="flex bg-slate-100 p-1.5 rounded-2xl border border-slate-200/60">
          <button 
            onClick={() => setActiveTab('articles')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'articles' 
                ? 'bg-white text-[#8c3315] shadow-sm' 
                : 'text-slate-600 hover:text-[#8c3315]'
            }`}
          >
            Bài viết & Tài liệu
          </button>
          <button 
            onClick={() => setActiveTab('categories')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'categories' 
                ? 'bg-white text-[#8c3315] shadow-sm' 
                : 'text-slate-600 hover:text-[#8c3315]'
            }`}
          >
            Danh mục bài viết
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-4">
          <div className="animate-spin rounded-full h-10 w-10 border-4 border-[#8c3315] border-t-transparent"></div>
          <p className="text-xs font-black text-[#8b716a]">Đang tải dữ liệu bài viết...</p>
        </div>
      ) : (
        <>
          {activeTab === 'articles' ? (
            <div className="space-y-6">
              {/* Toolbar & Filters */}
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white border border-[#dfc0b7]/30 rounded-3xl p-5 shadow-sm">
                <div className="flex flex-wrap items-center gap-3 flex-1">
                  {/* Search */}
                  <div className="relative min-w-[200px] flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                    <input 
                      type="text" 
                      placeholder="Tìm kiếm tiêu đề, mô tả..."
                      value={searchTerm}
                      onChange={(e) => handleSearchTermChange(e.target.value)}
                      className="w-full pl-9 pr-4 py-2.5 bg-gray-50/50 border border-[#dfc0b7]/40 focus:border-[#8c3315] focus:bg-white rounded-2xl text-xs font-bold text-[#241916] outline-none transition-all placeholder-gray-400"
                    />
                  </div>

                  {/* Category Filter */}
                  <div className="relative">
                    <select
                      value={selectedCategory}
                      onChange={(e) => handleCategoryFilterChange(e.target.value)}
                      className="appearance-none pl-4 pr-10 py-2.5 bg-gray-50 border border-[#dfc0b7]/40 hover:border-[#8c3315] rounded-2xl text-xs font-bold text-[#57423b] outline-none transition-all cursor-pointer"
                    >
                      <option value="all">Tất cả danh mục</option>
                      {categories.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={14} />
                  </div>

                  {/* Type Filter */}
                  <div className="relative">
                    <select
                      value={selectedType}
                      onChange={(e) => handleTypeFilterChange(e.target.value)}
                      className="appearance-none pl-4 pr-10 py-2.5 bg-gray-50 border border-[#dfc0b7]/40 hover:border-[#8c3315] rounded-2xl text-xs font-bold text-[#57423b] outline-none transition-all cursor-pointer"
                    >
                      <option value="all">Tất cả loại bài viết</option>
                      <option value="NORMAL">Bài viết thường</option>
                      <option value="DOWNLOAD">Tải file tài liệu</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={14} />
                  </div>
                </div>

                <button 
                  onClick={openAddArticleModal}
                  className="flex items-center gap-2 px-5 py-2.5 bg-[#8c3315] hover:bg-[#72270e] text-white rounded-2xl text-xs font-black uppercase tracking-wider shadow-sm hover:shadow-md transition-all cursor-pointer"
                >
                  <Plus size={16} /> Thêm bài viết mới
                </button>
              </div>

              {/* Articles List Table */}
              <div className="bg-white border border-[#dfc0b7]/30 rounded-[32px] overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-[#fffdfb] border-b border-[#dfc0b7]/30">
                        <th className="py-3 px-3 text-left text-[10px] font-black text-[#8b716a] uppercase tracking-wider min-w-[180px]">Bài viết</th>
                        <th className="py-3 px-3 text-left text-[10px] font-black text-[#8b716a] uppercase tracking-wider whitespace-nowrap">Danh mục</th>
                        <th className="py-3 px-3 text-left text-[10px] font-black text-[#8b716a] uppercase tracking-wider whitespace-nowrap">Loại</th>
                        <th className="py-3 px-3 text-left text-[10px] font-black text-[#8b716a] uppercase tracking-wider whitespace-nowrap">Lượt xem</th>
                        <th className="py-3 px-3 text-left text-[10px] font-black text-[#8b716a] uppercase tracking-wider whitespace-nowrap">Tải về / Liên kết</th>
                        <th className="py-3 px-3 text-right text-[10px] font-black text-[#8b716a] uppercase tracking-wider whitespace-nowrap">Hành động</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#dfc0b7]/10">
                      {pagedArticles.length > 0 ? (
                        pagedArticles.map((article) => (
                          <tr key={article.id} className="hover:bg-gray-50/50 transition-colors">
                            <td className="py-3 px-3">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-[#fff3f0] border border-[#dfc0b7]/30 flex-shrink-0 overflow-hidden flex items-center justify-center">
                                  {article.thumbnail ? (
                                    <img src={article.thumbnail} alt={article.title} className="w-full h-full object-cover" />
                                  ) : (
                                    <FileText className="text-[#8c3315]" size={18} />
                                  )}
                                </div>
                                <div className="min-w-0 pr-1">
                                  <h4 className="text-xs font-black text-[#241916] whitespace-normal break-words leading-tight flex items-center gap-1.5 flex-wrap">
                                    {article.title}
                                    {article.vipPoints > 0 && (
                                      <span className="shrink-0 px-2 py-0.5 bg-amber-50 border border-amber-200 text-amber-800 rounded-md text-[8px] font-black uppercase flex items-center gap-0.5">
                                        🧀 {article.vipPoints} VIP
                                      </span>
                                    )}
                                  </h4>
                                  <p className="text-[10px] font-bold text-[#8b716a] whitespace-normal break-words leading-normal mt-0.5">
                                    {article.description || 'Không có mô tả.'}
                                  </p>
                                </div>
                              </div>
                            </td>
                            <td className="py-3 px-3 whitespace-nowrap">
                              <span className="px-3 py-1 bg-gray-100 text-[#57423b] rounded-full text-[10px] font-black uppercase whitespace-nowrap">
                                {article.category?.name || 'Chưa phân loại'}
                              </span>
                            </td>
                            <td className="py-3 px-3 whitespace-nowrap">
                              {article.type === 'DOWNLOAD' ? (
                                <span className="px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-[10px] font-black uppercase flex items-center gap-1 w-fit whitespace-nowrap">
                                  <Download size={10} /> Tải tài liệu
                                </span>
                              ) : (
                                <span className="px-3 py-1 bg-[#fff3f0] text-[#8c3315] border border-[#dfc0b7]/30 rounded-full text-[10px] font-black uppercase flex items-center gap-1 w-fit whitespace-nowrap">
                                  <FileText size={10} /> Bài viết
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-3 whitespace-nowrap">
                              <div className="flex items-center gap-1 text-[11px] font-bold text-[#57423b] whitespace-nowrap">
                                <Eye size={12} className="text-[#8b716a]" />
                                {article.views}
                              </div>
                            </td>
                            <td className="py-3 px-3 whitespace-nowrap">
                              {article.type === 'DOWNLOAD' && article.fileUrl ? (
                                <a 
                                  href={article.fileUrl} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 px-2.5 py-1 bg-gray-50 hover:bg-[#e6fcf4] hover:text-[#006b58] border border-[#dfc0b7]/40 hover:border-emerald-200 rounded-lg text-[10px] font-black transition-all whitespace-nowrap"
                                >
                                  {article.fileUrl.startsWith('/uploads/') ? (
                                    <>
                                      <Paperclip size={10} /> Xem File
                                    </>
                                  ) : (
                                    <>
                                      <LinkIcon size={10} /> Xem Link
                                    </>
                                  )}
                                  <ExternalLink size={10} />
                                </a>
                              ) : (
                                <span className="text-[10px] font-bold text-gray-400 whitespace-nowrap">—</span>
                              )}
                            </td>
                            <td className="py-3 px-3 whitespace-nowrap text-right">
                              <div className="flex items-center justify-end gap-1.5 flex-nowrap">
                                <button 
                                  onClick={() => openEditArticleModal(article)}
                                  className="p-1.5 bg-[#fffbeb] hover:bg-[#fef3c7] text-[#b45309] rounded-lg transition-all hover:scale-110 active:scale-95 cursor-pointer shadow-sm"
                                  title="Chỉnh sửa bài viết"
                                >
                                  <Edit size={13} />
                                </button>
                                <button 
                                  onClick={() => handleDeleteArticle(article.id)}
                                  className="p-1.5 bg-[#fff3f0] hover:bg-[#fddcd2] text-[#8c3315] rounded-lg transition-all hover:scale-110 active:scale-95 cursor-pointer shadow-sm"
                                  title="Xóa bài viết"
                                >
                                  <Trash2 size={13} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={6} className="py-12 text-center text-xs font-black text-[#8b716a] bg-[#fffdfb]">
                            Không tìm thấy bài viết nào phù hợp.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Categories Section */}
              <div className="flex items-center justify-between bg-white border border-[#dfc0b7]/30 rounded-3xl p-5 shadow-sm">
                <div>
                  <h3 className="text-sm font-black text-[#241916] uppercase tracking-wider flex items-center gap-2">
                    <Folder size={16} className="text-[#8c3315]" /> Danh mục bài viết ({categories.length})
                  </h3>
                  <p className="text-[10px] font-bold text-[#8b716a] mt-0.5">Phân loại các bài viết để học sinh dễ dàng tra cứu.</p>
                </div>
                <button 
                  onClick={openAddCategoryModal}
                  className="flex items-center gap-2 px-5 py-2.5 bg-[#8c3315] hover:bg-[#72270e] text-white rounded-2xl text-xs font-black uppercase tracking-wider shadow-sm hover:shadow-md transition-all cursor-pointer"
                >
                  <Plus size={16} /> Thêm danh mục mới
                </button>
              </div>

              {/* Categories Table */}
              <div className="bg-white border border-[#dfc0b7]/30 rounded-[32px] overflow-hidden shadow-sm">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-[#fffdfb] border-b border-[#dfc0b7]/30">
                      <th className="py-4 px-6 text-left text-[10px] font-black text-[#8b716a] uppercase tracking-wider">Tên danh mục</th>
                      <th className="py-4 px-6 text-center text-[10px] font-black text-[#8b716a] uppercase tracking-wider">Số bài viết</th>
                      <th className="py-4 px-6 text-right text-[10px] font-black text-[#8b716a] uppercase tracking-wider">Hành động</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#dfc0b7]/10">
                    {pagedCategories.length > 0 ? (
                      pagedCategories.map((cat) => (
                        <tr key={cat.id} className="hover:bg-gray-50/50 transition-colors">
                          <td className="py-4 px-6 text-xs font-black text-[#241916]">
                            {cat.name}
                          </td>
                          <td className="py-4 px-6 text-center text-xs font-bold text-[#57423b]">
                            {cat._count?.articles || 0}
                          </td>
                          <td className="py-4 px-6 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button 
                                onClick={() => openEditCategoryModal(cat)}
                                className="p-1.5 bg-[#fffbeb] hover:bg-[#fef3c7] text-[#b45309] rounded-lg transition-all hover:scale-110 active:scale-95 cursor-pointer shadow-sm"
                                title="Sửa danh mục"
                              >
                                <Edit size={13} />
                              </button>
                              <button 
                                onClick={() => handleDeleteCategory(cat.id)}
                                className="p-1.5 bg-[#fff3f0] hover:bg-[#fddcd2] text-[#8c3315] rounded-lg transition-all hover:scale-110 active:scale-95 cursor-pointer shadow-sm"
                                title="Xóa danh mục"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={3} className="py-12 text-center text-xs font-black text-[#8b716a] bg-[#fffdfb]">
                          Chưa có danh mục nào. Hãy tạo danh mục mới.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
                <Pagination currentPage={categoryPage} totalPages={totalCategoryPages} onPageChange={setCategoryPage} />
              </div>
            </div>
          )}
        </>
      )}

      {/* ================= ARTICLE MODAL ================= */}
      {showArticleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-all animate-fadeIn">
          <div className="bg-white border border-[#dfc0b7]/40 rounded-[36px] w-full max-w-3xl overflow-hidden flex flex-col shadow-2xl animate-scaleIn text-left max-h-[90vh]">
            {/* Modal Header */}
            <div className="p-6 border-b border-[#dfc0b7]/20 flex items-center justify-between bg-[#fffdfb]">
              <div>
                <h3 className="text-base font-black text-[#241916]">
                  {articleModalType === 'add' ? 'Thêm Bài viết & Tài liệu Mới' : 'Cập nhật Bài viết & Tài liệu'}
                </h3>
                <p className="text-[10px] font-bold text-[#8b716a] mt-0.5">Tạo bài viết học tập hoặc tải lên tài liệu ôn thi.</p>
              </div>
              <button 
                onClick={() => setShowArticleModal(false)}
                className="p-2 bg-gray-50 border border-[#dfc0b7]/40 hover:bg-rose-50 hover:text-rose-600 rounded-full transition-all cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmitArticle} className="flex-1 overflow-y-auto p-6 space-y-6">
              {formError && (
                <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl text-xs font-bold text-rose-600 flex items-center gap-2">
                  <AlertCircle size={16} /> {formError}
                </div>
              )}

              {/* Title & Category */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-[#57423b] uppercase tracking-wider">Tiêu đề bài viết *</label>
                  <input 
                    type="text" 
                    value={articleForm.title}
                    onChange={(e) => setArticleForm({...articleForm, title: e.target.value})}
                    placeholder="Nhập tiêu đề bài viết..."
                    className="w-full px-4 py-3 bg-gray-50 border border-[#dfc0b7]/40 focus:border-[#8c3315] focus:bg-white rounded-2xl text-xs font-bold text-[#241916] outline-none transition-all"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-[#57423b] uppercase tracking-wider">Danh mục bài viết *</label>
                  <div className="relative">
                    <select
                      value={articleForm.categoryId}
                      onChange={(e) => setArticleForm({...articleForm, categoryId: e.target.value})}
                      className="w-full appearance-none px-4 py-3 bg-gray-50 border border-[#dfc0b7]/40 focus:border-[#8c3315] focus:bg-white rounded-2xl text-xs font-bold text-[#241916] outline-none transition-all cursor-pointer"
                    >
                      <option value="" disabled>-- Chọn danh mục --</option>
                      {categories.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={14} />
                  </div>
                </div>
              </div>

              {/* Description & Thumbnail */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-[#57423b] uppercase tracking-wider">Mô tả ngắn</label>
                  <textarea 
                    value={articleForm.description}
                    onChange={(e) => setArticleForm({...articleForm, description: e.target.value})}
                    placeholder="Mô tả tóm tắt nội dung bài viết..."
                    rows={3}
                    className="w-full px-4 py-3 bg-gray-50 border border-[#dfc0b7]/40 focus:border-[#8c3315] focus:bg-white rounded-2xl text-xs font-bold text-[#241916] outline-none transition-all resize-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-[#57423b] uppercase tracking-wider block">Ảnh bìa (Thumbnail) *</label>
                  <div className="flex flex-col sm:flex-row items-center gap-4 p-4 border border-[#dfc0b7]/40 rounded-2xl bg-gray-50/30">
                    {/* Preview Box */}
                    <div className="w-32 h-20 rounded-xl border border-[#dfc0b7]/40 bg-white overflow-hidden flex items-center justify-center shrink-0 relative group">
                      {articleForm.thumbnail ? (
                        <>
                          <img src={articleForm.thumbnail} alt="Thumbnail preview" className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => setArticleForm({ ...articleForm, thumbnail: '' })}
                            className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity cursor-pointer font-black text-xs"
                          >
                            Xóa ảnh
                          </button>
                        </>
                      ) : (
                        <div className="flex flex-col items-center justify-center text-gray-400 p-2">
                          <Upload size={20} className="mb-1 text-gray-400/80" />
                          <span className="text-[9px] font-bold text-center">Chưa có ảnh</span>
                        </div>
                      )}
                    </div>

                    {/* Controls */}
                    <div className="flex-1 space-y-2 w-full text-center sm:text-left">
                      <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                        <label className="px-4 py-2 bg-white border border-[#dfc0b7]/60 hover:border-[#8c3315] hover:text-[#8c3315] text-[#57423b] rounded-xl text-xs font-black transition-all cursor-pointer inline-flex items-center gap-1.5 shadow-sm">
                          <Upload size={12} />
                          Chọn từ máy tính
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleThumbnailUpload}
                            className="hidden"
                            disabled={isUploadingThumbnail}
                          />
                        </label>
                      </div>

                      <p className="text-[9px] font-bold text-gray-400 leading-normal">
                        Hỗ trợ PNG, JPG, JPEG, WEBP. Dung lượng tối đa 10MB.
                      </p>

                      {isUploadingThumbnail && (
                        <div className="space-y-1 animate-fadeIn">
                          <div className="flex justify-between text-[9px] font-black text-[#8b716a]">
                            <span>Đang tải ảnh lên...</span>
                            <span>{uploadProgressThumbnail}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-1 overflow-hidden">
                            <div className="bg-[#8c3315] h-1 rounded-full transition-all duration-300" style={{ width: `${uploadProgressThumbnail}%` }}></div>
                          </div>
                        </div>
                      )}

                      {uploadErrorThumbnail && (
                        <span className="text-[9px] font-bold text-rose-600 block">{uploadErrorThumbnail}</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Choose Article Type */}
              <div className="space-y-2 p-5 bg-gray-50 border border-[#dfc0b7]/30 rounded-3xl">
                <label className="text-[10px] font-black text-[#8c3315] uppercase tracking-wider block">Loại bài viết</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                  <label className={`flex items-center gap-3 p-3.5 border rounded-2xl cursor-pointer transition-all ${
                    articleForm.type === 'NORMAL' 
                      ? 'bg-white border-[#8c3315] shadow-sm' 
                      : 'bg-transparent border-[#dfc0b7]/40 hover:bg-white/50'
                  }`}>
                    <input 
                      type="radio" 
                      name="articleType" 
                      value="NORMAL"
                      checked={articleForm.type === 'NORMAL'}
                      onChange={() => setArticleForm({...articleForm, type: 'NORMAL'})}
                      className="accent-[#8c3315]"
                    />
                    <div>
                      <span className="text-xs font-black text-[#241916] block">Bài viết thường (NORMAL)</span>
                      <span className="text-[9px] font-semibold text-[#8b716a]">Chỉ chứa văn bản, bài giảng lý thuyết.</span>
                    </div>
                  </label>

                  <label className={`flex items-center gap-3 p-3.5 border rounded-2xl cursor-pointer transition-all ${
                    articleForm.type === 'DOWNLOAD' 
                      ? 'bg-white border-[#8c3315] shadow-sm' 
                      : 'bg-transparent border-[#dfc0b7]/40 hover:bg-white/50'
                  }`}>
                    <input 
                      type="radio" 
                      name="articleType" 
                      value="DOWNLOAD"
                      checked={articleForm.type === 'DOWNLOAD'}
                      onChange={() => setArticleForm({...articleForm, type: 'DOWNLOAD'})}
                      className="accent-[#8c3315]"
                    />
                    <div>
                      <span className="text-xs font-black text-[#241916] block">Tải file tài liệu (DOWNLOAD)</span>
                      <span className="text-[9px] font-semibold text-[#8b716a]">Tải PDF/Word lên hoặc đính kèm link tải Drive.</span>
                    </div>
                  </label>
                </div>
              </div>

              {/* Conditional options for Download type */}
              {articleForm.type === 'DOWNLOAD' && (
                <div className="space-y-4 p-5 border-2 border-dashed border-[#dfc0b7]/40 rounded-3xl bg-[#fffdfb] animate-fadeIn">
                  <div className="space-y-1">
                    <h4 className="text-xs font-black text-[#241916]">Đính kèm File hoặc Nhập Link tải</h4>
                    <p className="text-[9px] font-bold text-[#8b716a]">Học sinh sẽ tải file này về từ trang chi tiết bài viết.</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                    {/* Method 1: Upload PDF/Word */}
                    <div className="space-y-2 border-r border-[#dfc0b7]/20 pr-0 md:pr-6">
                      <label className="text-[10px] font-black text-[#57423b] uppercase tracking-wider block">Cách 1: Tải trực tiếp từ máy</label>
                      <div className="relative border-2 border-dashed border-gray-300 rounded-2xl p-4 flex flex-col items-center justify-center bg-gray-50/50 hover:bg-gray-50 hover:border-[#8c3315] transition-all">
                        <Upload size={24} className="text-gray-400 mb-2" />
                        <span className="text-[10px] font-black text-[#57423b] text-center block mb-1">Kéo thả file hoặc nhấn để chọn</span>
                        <span className="text-[8px] font-bold text-gray-400">PDF, DOC, DOCX, ZIP (tối đa 20MB)</span>
                        <input 
                          type="file" 
                          accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip,.rar" 
                          onChange={handleFileUpload}
                          className="absolute inset-0 opacity-0 cursor-pointer" 
                          disabled={isUploading}
                        />
                      </div>
                      
                      {isUploading && (
                        <div className="space-y-1.5 animate-fadeIn">
                          <div className="flex justify-between text-[9px] font-black text-[#8b716a]">
                            <span>Đang tải file lên...</span>
                            <span>{uploadProgress}%</span>
                          </div>
                          <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                            <div className="bg-[#8c3315] h-1.5 rounded-full transition-all duration-300" style={{ width: `${uploadProgress}%` }}></div>
                          </div>
                        </div>
                      )}

                      {uploadError && (
                        <span className="text-[9px] font-bold text-rose-600 block">{uploadError}</span>
                      )}
                    </div>

                    {/* Method 2: Paste Google Drive Link */}
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-[#57423b] uppercase tracking-wider block">Cách 2: Đường dẫn Google Drive / OneDrive</label>
                      <div className="space-y-2.5">
                        <input 
                          type="text" 
                          value={articleForm.fileUrl}
                          onChange={(e) => setArticleForm({...articleForm, fileUrl: e.target.value})}
                          placeholder="https://drive.google.com/file/d/..."
                          className="w-full px-4 py-3 bg-gray-50 border border-[#dfc0b7]/40 focus:border-[#8c3315] focus:bg-white rounded-2xl text-xs font-bold text-[#241916] outline-none transition-all"
                        />
                        <p className="text-[8px] font-bold text-gray-400 leading-normal">
                          Lưu ý: Hãy bật quyền truy cập "Bất kỳ ai có liên kết đều có thể xem/tải" (Anyone with the link can view) trên Google Drive để học sinh tải về được nhé.
                        </p>
                      </div>
                    </div>
                  </div>

                  {articleForm.fileUrl && (
                    <div className="flex items-center gap-2 p-3 bg-emerald-50 text-emerald-800 border border-emerald-100 rounded-xl text-[10px] font-bold justify-between">
                      <span className="truncate max-w-[90%]">
                        File liên kết hiện tại: <strong>{articleForm.fileUrl}</strong>
                      </span>
                      <button 
                        type="button" 
                        onClick={() => setArticleForm({...articleForm, fileUrl: ''})}
                        className="text-rose-600 hover:text-rose-800 p-1 hover:bg-rose-50 rounded"
                        title="Xóa file đính kèm"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* VIP Points Config */}
              <div className="space-y-1.5 p-4 bg-amber-50/40 border border-amber-200/50 rounded-2xl">
                <label className="text-[10px] font-black text-amber-800 uppercase tracking-wider block">Điểm VIP mở khóa (Điểm)</label>
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                  <input 
                    type="number" 
                    min={0}
                    value={articleForm.vipPoints}
                    onChange={(e) => setArticleForm({...articleForm, vipPoints: Math.max(0, parseInt(e.target.value) || 0)})}
                    placeholder="VD: 10, 50, 100... (Nhập 0 nếu tài liệu này là miễn phí)"
                    className="w-full sm:w-48 px-4 py-2 bg-white border border-[#dfc0b7]/40 focus:border-amber-500 rounded-xl text-xs font-bold text-[#241916] outline-none transition-all"
                  />
                  <p className="text-[9px] font-bold text-amber-700 leading-normal">
                    Đặt số điểm cần có để học sinh mở khóa xem và tải tài liệu này. Đặt là <strong>0</strong> để chia sẻ miễn phí.
                  </p>
                </div>
              </div>

              {/* Main Content Area */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-[#57423b] uppercase tracking-wider flex justify-between">
                  <span>Nội dung bài viết (Hỗ trợ định dạng văn bản & LaTeX)</span>
                  {articleForm.type === 'DOWNLOAD' && <span className="text-[9px] text-gray-400 font-bold">(Không bắt buộc đối với tài liệu tải về)</span>}
                </label>
                <textarea 
                  value={articleForm.content}
                  onChange={(e) => setArticleForm({...articleForm, content: e.target.value})}
                  placeholder="Viết nội dung chi tiết bài viết ở đây..."
                  rows={8}
                  className="w-full px-4 py-3 bg-gray-50 border border-[#dfc0b7]/40 focus:border-[#8c3315] focus:bg-white rounded-2xl text-xs font-bold text-[#241916] outline-none transition-all font-mono"
                />
              </div>

              {/* Modal Footer */}
              <div className="flex justify-end gap-3 pt-4 border-t border-[#dfc0b7]/10">
                <button 
                  type="button"
                  onClick={() => setShowArticleModal(false)}
                  className="px-5 py-2.5 bg-white border border-[#dfc0b7]/50 hover:bg-[#fff3f0] hover:text-[#8c3315] text-[#57423b] rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer"
                >
                  Hủy
                </button>
                <button 
                  type="submit"
                  disabled={isSaving}
                  className="flex items-center gap-1.5 px-6 py-2.5 bg-[#8c3315] hover:bg-[#72270e] disabled:bg-gray-300 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-md hover:shadow-lg disabled:shadow-none transition-all cursor-pointer"
                >
                  <Save size={14} /> {isSaving ? 'Đang lưu...' : 'Lưu bài viết'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= CATEGORY MODAL ================= */}
      {showCategoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-all animate-fadeIn">
          <div className="bg-white border border-[#dfc0b7]/40 rounded-[32px] w-full max-w-md overflow-hidden flex flex-col shadow-2xl animate-scaleIn text-left">
            {/* Modal Header */}
            <div className="p-5 border-b border-[#dfc0b7]/20 flex items-center justify-between bg-[#fffdfb]">
              <div>
                <h3 className="text-base font-black text-[#241916]">
                  {categoryModalType === 'add' ? 'Thêm Danh Mục Bài Viết Mới' : 'Cập Nhật Danh Mục'}
                </h3>
              </div>
              <button 
                onClick={() => setShowCategoryModal(false)}
                className="p-2 bg-gray-50 border border-[#dfc0b7]/40 hover:bg-rose-50 hover:text-rose-600 rounded-full transition-all cursor-pointer"
              >
                <X size={14} />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmitCategory} className="p-5 space-y-4">
              {formError && (
                <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl text-xs font-bold text-rose-600 flex items-center gap-2">
                  <AlertCircle size={14} /> {formError}
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-[#57423b] uppercase tracking-wider">Tên danh mục *</label>
                <input 
                  type="text" 
                  value={categoryForm.name}
                  onChange={(e) => setCategoryForm({...categoryForm, name: e.target.value})}
                  placeholder="VD: Tài liệu lớp 12, Đề ôn thi thử..."
                  className="w-full px-4 py-2.5 bg-gray-50 border border-[#dfc0b7]/40 focus:border-[#8c3315] focus:bg-white rounded-2xl text-xs font-bold text-[#241916] outline-none transition-all"
                  autoFocus
                />
              </div>

              {/* Modal Footer */}
              <div className="flex justify-end gap-3 pt-4 border-t border-[#dfc0b7]/10">
                <button 
                  type="button"
                  onClick={() => setShowCategoryModal(false)}
                  className="px-4 py-2 bg-white border border-[#dfc0b7]/50 hover:bg-[#fff3f0] hover:text-[#8c3315] text-[#57423b] rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer"
                >
                  Hủy
                </button>
                <button 
                  type="submit"
                  disabled={isSaving}
                  className="flex items-center gap-1.5 px-5 py-2 bg-[#8c3315] hover:bg-[#72270e] disabled:bg-gray-300 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-md hover:shadow-lg disabled:shadow-none transition-all cursor-pointer"
                >
                  <Save size={12} /> {isSaving ? 'Đang lưu...' : 'Lưu danh mục'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
