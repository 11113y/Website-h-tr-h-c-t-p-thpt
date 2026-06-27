/**
 * useAdminExams.js — ViewModel Hook
 * Manages exam list, categories list, import from Word, editor, and preview state + API calls.
 */
import { useState } from 'react';
import axios from 'axios';
import { formatCategoryType, flattenTree, buildBreadcrumb } from '../../../utils/adminHelpers';

export function useAdminExams({ showAlert, setConfirmModal }) {
  // List state
  const [exams,          setExams]          = useState([]);
  const [categories,     setCategories]     = useState([]);
  const [loadingExams,   setLoadingExams]   = useState(false);
  const [loadingCats,    setLoadingCats]    = useState(false);
  const [searchQuery,    setSearchQuery]    = useState('');
  const [filterType,     setFilterType]     = useState('all');
  const [filterGrade,    setFilterGrade]    = useState('all');
  const [filterRoadmapId, setFilterRoadmapId] = useState('all');
  const [filterSubcategoryId, setFilterSubcategoryId] = useState('all');
  const [filterTopicId,  setFilterTopicId]  = useState('all');
  const [page,           setPage]           = useState(1);
  const PAGE_SIZE = 20;

  const setSearchQueryAndReset = (val) => { setSearchQuery(val); setPage(1); };
  const setFilterTypeAndReset = (val) => { 
    setFilterType(val); 
    if (val !== 'thematic') {
      setFilterTopicId('all');
    }
    setPage(1); 
  };
  const setFilterGradeAndReset = (val) => { setFilterGrade(val); setPage(1); };
  const setFilterRoadmapIdAndReset = (val) => { setFilterRoadmapId(val); setFilterSubcategoryId('all'); setPage(1); };
  const setFilterSubcategoryIdAndReset = (val) => { setFilterSubcategoryId(val); setPage(1); };
  const setFilterTopicIdAndReset = (val) => { setFilterTopicId(val); setPage(1); };

  const resetFilters = () => {
    setSearchQuery('');
    setFilterType('all');
    setFilterGrade('all');
    setFilterRoadmapId('all');
    setFilterSubcategoryId('all');
    setFilterTopicId('all');
    setPage(1);
  };

  // Preview modal
  const [previewExam,    setPreviewExam]    = useState(null);
  const [loadingPreview, setLoadingPreview] = useState(false);

  // Import from Word form
  const [showImportForm, setShowImportForm] = useState(false);
  const [importTitle,    setImportTitle]    = useState('');
  const [importDesc,     setImportDesc]     = useState('');
  const [importCategory, setImportCategory] = useState('PRACTICE_THEMATIC');
  const [importGrade,    setImportGrade]    = useState('GRADE_12');
  const [importDuration, setImportDuration] = useState(90);
  const [importFile,     setImportFile]     = useState(null);
  const [importing,      setImporting]      = useState(false);
  const [importError,    setImportError]    = useState('');
  const [importSuccess,  setImportSuccess]  = useState('');
  const [importCategoryId, setImportCategoryId] = useState('');
  const [importCategoryIds, setImportCategoryIds] = useState([]);
  const [importParentId, setImportParentId] = useState('');
  const [importTopicId, setImportTopicId] = useState('');
  const [importHasTopic, setImportHasTopic] = useState(false);
  const [topics, setTopics] = useState([]);

  // Topic Generator Form
  const [showTopicGenerator, setShowTopicGenerator] = useState(false);
  const [generatorTitle, setGeneratorTitle] = useState('');
  const [generatorDesc, setGeneratorDesc] = useState('');
  const [generatorGrade, setGeneratorGrade] = useState('GRADE_12');
  const [generatorDuration, setGeneratorDuration] = useState(90);
  const [generatorCategoryId, setGeneratorCategoryId] = useState('');
  const [generatorCategoryIds, setGeneratorCategoryIds] = useState([]);
  const [generatorParentId, setGeneratorParentId] = useState('');
  const [topicCounts, setTopicCounts] = useState({}); // { [topicId]: count }
  const [topicsForGenerator, setTopicsForGenerator] = useState([]);
  const [generatingByTopics, setGeneratingByTopics] = useState(false);
  const [generatorError, setGeneratorError] = useState('');
  const [generatorSuccess, setGeneratorSuccess] = useState('');

  // Editor (after parse)
  const [editingExam,    setEditingExam]    = useState(null); // parsed exam object
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [editingQIndex,  setEditingQIndex]  = useState(-1);
  const [showQuestionEditor, setShowQuestionEditor] = useState(false);
  const [saving,         setSaving]         = useState(false);

  const fetchExams = async () => {
    setLoadingExams(true);
    try {
      const res = await axios.get('/api/tests');
      if (res.data?.success) setExams(res.data.tests);
      else showAlert('Không thể tải danh sách đề thi.', 'Lỗi', 'error');
    } catch (err) {
      console.error(err);
      showAlert('Đã xảy ra lỗi khi kết nối với server.', 'Lỗi', 'error');
    } finally { setLoadingExams(false); }
  };

  const fetchCategories = async () => {
    setLoadingCats(true);
    try {
      const res = await axios.get('/api/categories');
      if (res.data?.success) setCategories(res.data.categories);
    } catch (err) {
      console.error(err);
    } finally { setLoadingCats(false); }
  };

  const fetchTopics = async () => {
    try {
      const res = await axios.get('/api/topics');
      if (res.data?.success) {
        setTopics(flattenTree(res.data.topics));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const previewExamById = async (examId) => {
    setLoadingPreview(true);
    try {
      const res = await axios.get(`/api/tests/${examId}?includeAnswers=true`);
      if (res.data?.success) setPreviewExam(res.data.test);
      else showAlert('Không thể tải thông tin đề thi.', 'Lỗi', 'error');
    } catch (err) {
      console.error(err);
      showAlert('Lỗi kết nối máy chủ.', 'Lỗi', 'error');
    } finally { setLoadingPreview(false); }
  };

  const editExistingExam = async (examId) => {
    console.log("=== Clicked Edit Existing Exam ===");
    console.log("examId:", examId);
    setLoadingPreview(true);
    try {
      console.log("Sending GET request to /api/tests/" + examId);
      const res = await axios.get(`/api/tests/${examId}?includeAnswers=true`);
      console.log("API Response:", res.data);
      if (res.data?.success) {
        const test = res.data.test;
        console.log("Retrieved test:", test);
        
        let parentId = '';
        if (test.categoryId) {
          console.log("test.categoryId:", test.categoryId);
          console.log("Checking categories:", categories);
          // 1. Try to find the child category in parent children to get parentId
          for (const parent of categories) {
            if (parent.children && parent.children.some(child => child.id === test.categoryId)) {
              parentId = parent.id;
              console.log("Found parentId in children:", parentId);
              break;
            }
          }
          // 2. Fallback to direct parent match if not found in children
          if (!parentId) {
            const directParent = categories.find(c => c.id === test.categoryId);
            if (directParent) {
              parentId = directParent.id;
            }
          }
        }
        
        console.log("Setting editingExam state with parentId:", parentId);
        setEditingExam({
          id: test.id,
          title: test.title,
          description: test.description,
          category: test.category,
          grade: test.grade,
          categoryId: test.categoryId || null,
          categoryIds: test.categoryIds || (test.categoryId ? [test.categoryId] : []),
          parentId: parentId,
          topicId: test.topicId || null,
          hasTopic: !!test.topicId,
          durationMinutes: test.durationMinutes,
          questions: (test.questions || []).map((q, i) => ({
            ...q,
            num: i + 1,
            topicTitle: q.topic?.title || 'Chủ đề mặc định'
          }))
        });
        console.log("editingExam state update requested successfully!");
      } else {
        showAlert('Không thể tải thông tin đề thi.', 'Lỗi', 'error');
      }
    } catch (err) {
      console.error(err);
      showAlert('Lỗi kết nối máy chủ.', 'Lỗi', 'error');
    } finally {
      setLoadingPreview(false);
    }
  };

  const deleteExam = (id, title) => {
    setConfirmModal({
      show: true, title: 'Xóa đề thi',
      message: `Bạn có chắc chắn muốn xóa đề thi "${title}"? Hành động này sẽ xóa toàn bộ câu hỏi và kết quả thi liên quan.`,
      type: 'warning', isAlert: false,
      onConfirm: async () => {
        try {
          const res = await axios.delete(`/api/admin/tests/${id}`);
          if (res.data?.success) {
            showAlert('Xóa đề thi thành công!', 'Thành công', 'success');
            setExams((prev) => prev.filter((e) => e.id !== id));
            if (previewExam?.id === id) setPreviewExam(null);
          }
        } catch (err) {
          showAlert(err.response?.data?.message || 'Đã xảy ra lỗi khi xóa đề thi.', 'Lỗi', 'error');
        }
      },
    });
  };

  const importFromWord = async (e) => {
    e.preventDefault();
    if (!importTitle) { setImportError('Vui lòng nhập tiêu đề đề thi.'); return; }
    if (!importFile)  { setImportError('Vui lòng chọn file Word (.docx).'); return; }
    setImporting(true); setImportError(''); setImportSuccess('');
    const form = new FormData();
    form.append('title', importTitle);
    form.append('description', importDesc);
    form.append('category', importCategory);
    form.append('durationMinutes', String(Number(importDuration) || 90));
    form.append('file', importFile);
    try {
      const res = await axios.post('/api/admin/tests/parse-word', form, { headers: { 'Content-Type': 'multipart/form-data' } });
      if (res.data?.success) {
        const primaryCatId = importCategoryId || (importCategoryIds[0] || null);
        setEditingExam({
          title: importTitle,
          description: importDesc,
          category: importCategory,
          grade: importGrade,
          categoryId: primaryCatId,
          categoryIds: importCategoryIds,
          parentId: importParentId || null,
          topicId: importHasTopic ? (importTopicId || null) : null,
          hasTopic: importHasTopic,
          durationMinutes: Number(importDuration) || 90,
          questions: (res.data.questions || []).map((q, i) => ({
            ...q,
            num: i + 1
          }))
        });
        setImportSuccess('Trích xuất đề thi thành công! Đang chuyển sang màn hình chỉnh sửa...');
        setImportTitle(''); setImportDesc(''); setImportCategory('PRACTICE_THEMATIC'); setImportFile(null);
        setImportCategoryIds([]);
        setImportTopicId('');
        setTimeout(() => { setShowImportForm(false); setImportSuccess(''); }, 1500);
      }
    } catch (err) {
      setImportError(err.response?.data?.message || 'Đã xảy ra lỗi khi trích xuất đề thi.');
    } finally { setImporting(false); }
  };

  const fetchTopicsForGenerator = async (gradeVal) => {
    try {
      const targetGrade = gradeVal || generatorGrade;
      const res = await axios.get(`/api/topics/practice?grade=${targetGrade}`);
      if (res.data?.success) {
        setTopicsForGenerator(res.data.topics);
        const initialCounts = {};
        res.data.topics.forEach(t => {
          initialCounts[t.id] = 0;
        });
        setTopicCounts(initialCounts);
      }
    } catch (err) {
      console.error('Lỗi khi tải danh sách chủ đề:', err);
    }
  };

  const generateTestFromTopicsAction = async (e) => {
    e.preventDefault();
    if (!generatorTitle) { setGeneratorError('Vui lòng nhập tiêu đề đề thi.'); return; }
    
    const hasActiveTopic = Object.values(topicCounts).some(c => parseInt(c) > 0);
    if (!hasActiveTopic) {
      setGeneratorError('Vui lòng nhập số câu hỏi cho ít nhất một chuyên đề.');
      return;
    }

    setGeneratingByTopics(true);
    setGeneratorError('');
    setGeneratorSuccess('');

    const primaryCatId = generatorCategoryId || (generatorCategoryIds[0] || null);

    try {
      const res = await axios.post('/api/admin/tests/generate-by-topics', {
        title: generatorTitle,
        description: generatorDesc,
        category: 'PRACTICE_THEMATIC',
        grade: generatorGrade,
        categoryId: primaryCatId,
        categoryIds: generatorCategoryIds,
        durationMinutes: Number(generatorDuration) || 90,
        topicConfigs: topicCounts,
      });

      if (res.data?.success) {
        setGeneratorSuccess('Tạo đề thi từ các chủ đề thành công!');
        setGeneratorTitle('');
        setGeneratorDesc('');
        setGeneratorDuration(90);
        setGeneratorCategoryIds([]);
        setGeneratorParentId('');
        
        const resetCounts = {};
        topicsForGenerator.forEach(t => {
          resetCounts[t.id] = 0;
        });
        setTopicCounts(resetCounts);

        await fetchExams();
        setTimeout(() => {
          setShowTopicGenerator(false);
          setGeneratorSuccess('');
        }, 1500);
      }
    } catch (err) {
      setGeneratorError(err.response?.data?.message || 'Đã xảy ra lỗi khi tạo đề thi.');
    } finally {
      setGeneratingByTopics(false);
    }
  };

  const saveExam = async () => {
    if (!editingExam?.title) { showAlert('Vui lòng điền tiêu đề đề thi.', 'Cảnh báo', 'warning'); return; }
    if (!editingExam?.questions?.length) { showAlert('Đề thi phải có ít nhất một câu hỏi.', 'Cảnh báo', 'warning'); return; }
    setSaving(true);
    try {
      const url = editingExam.id ? `/api/admin/tests/${editingExam.id}` : '/api/admin/tests';
      const method = editingExam.id ? 'put' : 'post';
      const res = await axios[method](url, {
        title: editingExam.title,
        description: editingExam.description,
        category: editingExam.category,
        grade: editingExam.grade || 'GRADE_12',
        categoryId: editingExam.categoryId || null,
        categoryIds: editingExam.categoryIds || (editingExam.categoryId ? [editingExam.categoryId] : []),
        durationMinutes: Number(editingExam.durationMinutes) || 90,
        questions: editingExam.questions,
        topicId: editingExam.topicId || null,
      });
      if (res.data?.success) {
        showAlert(editingExam.id ? 'Cập nhật đề thi thành công!' : 'Lưu đề thi thành công!', 'Thành công', 'success');
        setEditingExam(null);
        await fetchExams();
      }
    } catch (err) {
      showAlert(err.response?.data?.message || 'Đã xảy ra lỗi khi lưu đề thi.', 'Lỗi', 'error');
    } finally { setSaving(false); }
  };

  const filteredExams = exams.filter((e) => {
    const matchTitle = e.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchGrade = filterGrade === 'all' || e.grade === filterGrade;
    
    // 1. Filter Type ("Tổng hợp" vs "Chuyên đề")
    let matchType = true;
    if (filterType === 'synthetic') {
      matchType = !e.topicId;
    } else if (filterType === 'thematic') {
      matchType = !!e.topicId;
      if (filterTopicId !== 'all' && e.topicId !== filterTopicId) {
        matchType = false;
      }
    }

    // 2. Filter Lộ trình (Parent Category)
    let matchRoadmap = true;
    if (filterRoadmapId !== 'all') {
      const parentId = e.categoryRel?.parentId || e.categoryRel?.id;
      matchRoadmap = parentId === filterRoadmapId;
    }

    // 3. Filter Danh mục con (Child Category)
    let matchSubcategory = true;
    if (filterSubcategoryId !== 'all') {
      matchSubcategory = e.categoryId === filterSubcategoryId;
    }
    
    return matchTitle && matchGrade && matchType && matchRoadmap && matchSubcategory;
  });

  const totalPages = Math.ceil(filteredExams.length / PAGE_SIZE);
  const pagedExams = filteredExams.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // Flat helper for categories
  const getFlatCategories = () => {
    let result = [];
    categories.forEach((parent) => {
      if (parent.children) {
        parent.children.forEach((child) => {
          const gradeLabel = parent.grade === 'GRADE_12' ? 'Lớp 12' : parent.grade === 'GRADE_11' ? 'Lớp 11' : parent.grade === 'GRADE_10' ? 'Lớp 10' : '';
          const prefix = gradeLabel ? `[${gradeLabel}] ` : '';
          result.push({
            id: child.id,
            name: child.name,
            parentName: parent.name,
            gradeLabel: gradeLabel,
            displayName: `${prefix}${parent.name} > ${child.name}`
          });
        });
      }
    });
    return result;
  };

  return {
    exams, categories, loadingExams, loadingCats, 
    searchQuery, setSearchQuery: setSearchQueryAndReset,
    filterType, setFilterType: setFilterTypeAndReset, 
    filterGrade, setFilterGrade: setFilterGradeAndReset,
    filterRoadmapId, setFilterRoadmapId: setFilterRoadmapIdAndReset,
    filterSubcategoryId, setFilterSubcategoryId: setFilterSubcategoryIdAndReset,
    filterTopicId, setFilterTopicId: setFilterTopicIdAndReset,
    filteredExams, pagedExams, page, setPage, totalPages,
    previewExam, setPreviewExam, loadingPreview,
    editingExam, setEditingExam,
    showImportForm, setShowImportForm,
    importTitle, setImportTitle, importDesc, setImportDesc,
    importCategory, setImportCategory, importGrade, setImportGrade,
    importDuration, setImportDuration, importFile, setImportFile,
    importCategoryId, setImportCategoryId,
    importCategoryIds, setImportCategoryIds,
    importParentId, setImportParentId,
    importing, importError, importSuccess,
    editingQuestion, setEditingQuestion, editingQIndex, setEditingQIndex,
    showQuestionEditor, setShowQuestionEditor,
    saving,
    showTopicGenerator, setShowTopicGenerator,
    generatorTitle, setGeneratorTitle, generatorDesc, setGeneratorDesc,
    generatorGrade, setGeneratorGrade,
    generatorDuration, setGeneratorDuration, generatorCategoryId, setGeneratorCategoryId,
    generatorCategoryIds, setGeneratorCategoryIds, generatorParentId, setGeneratorParentId,
    topicCounts, setTopicCounts, topicsForGenerator, setTopicsForGenerator,
    generatingByTopics, generatorError, generatorSuccess,
    fetchExams, fetchCategories, previewExamById, editExistingExam, deleteExam, importFromWord, saveExam,
    fetchTopicsForGenerator, generateTestFromTopicsAction,
    formatCategoryType, getFlatCategories,
    importTopicId, setImportTopicId, importHasTopic, setImportHasTopic, topics, fetchTopics,
    resetFilters
  };
}
