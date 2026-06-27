/**
 * useAdminCategories.js — ViewModel Hook
 * Manages categories CRUD, test-assignment state, exams list, and API calls.
 */
import { useState } from 'react';
import axios from 'axios';
import { flattenTree, buildChildCategoryOptions } from '../../../utils/adminHelpers';

export function useAdminCategories({ showAlert, setConfirmModal }) {
  const [categories,     setCategories]     = useState([]);
  const [exams,          setExams]          = useState([]);
  const [loading,        setLoading]        = useState(false);
  const [loadingExams,   setLoadingExams]   = useState(false);
  const [activeGrade,    setActiveGrade]    = useState('GRADE_12');
  const [selectedCat,    setSelectedCat]    = useState(null);
  const [expanded,       setExpanded]       = useState({});
  const [showForm,       setShowForm]       = useState(false);
  const [formMode,       setFormMode]       = useState('add');
  const [formSaving,     setFormSaving]     = useState(false);
  const [formData,       setFormData]       = useState({ name: '', parentId: '', grade: 'GRADE_12' });
  const [detailView,     setDetailView]     = useState(null); // selected child category for detail view
  const [page,           setPage]           = useState(1);
  const PAGE_SIZE = 10;

  const setActiveGradeWithReset = (grade) => {
    setActiveGrade(grade);
    setPage(1);
  };

  const fetchCategories = async (grade = null) => {
    setLoading(true);
    try {
      const url = grade ? `/api/categories?grade=${grade}` : '/api/categories';
      const res = await axios.get(url);
      if (res.data?.success) {
        setCategories(res.data.categories);
        const exp = {};
        res.data.categories.forEach((c) => { exp[c.id] = true; });
        setExpanded((prev) => ({ ...exp, ...prev }));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchExams = async () => {
    setLoadingExams(true);
    try {
      const res = await axios.get('/api/tests');
      if (res.data?.success) {
        setExams(res.data.tests);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingExams(false);
    }
  };

  const openForm = (mode, parentId = null, cat = null) => {
    setFormMode(mode);
    if (mode === 'add') {
      setFormData({ name: '', parentId: parentId || '', grade: activeGrade });
    } else if (mode === 'edit' && cat) {
      setFormData({ id: cat.id, name: cat.name, parentId: cat.parentId || '', grade: cat.grade || activeGrade });
    }
    setShowForm(true);
  };

  const saveForm = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      showAlert('Vui lòng nhập tên danh mục.', 'Cảnh báo', 'warning');
      return;
    }
    setFormSaving(true);
    try {
      const payload = {
        name: formData.name.trim(),
        parentId: formData.parentId || null,
        grade: formData.parentId ? null : formData.grade || activeGrade,
      };
      if (formMode === 'add') {
        const res = await axios.post('/api/categories', payload);
        if (res.data?.success) {
          showAlert('Tạo danh mục mới thành công!', 'Thành công', 'success');
          setShowForm(false);
          await fetchCategories(activeGrade);
          if (formData.parentId) setExpanded((p) => ({ ...p, [formData.parentId]: true }));
        }
      } else {
        const res = await axios.put(`/api/categories/${formData.id}`, payload);
        if (res.data?.success) {
          showAlert('Cập nhật danh mục thành công!', 'Thành công', 'success');
          setShowForm(false);
          await fetchCategories(activeGrade);
          // Refresh selectedCat if it was the edited one
          if (selectedCat?.id === formData.id) {
            const res2 = await axios.get(`/api/categories?grade=${activeGrade}`);
            if (res2.data?.success) {
              const updated = flattenTree(res2.data.categories).find((c) => c.id === formData.id);
              if (updated) setSelectedCat(updated);
            }
          }
        }
      }
    } catch (err) {
      showAlert(err.response?.data?.message || 'Lỗi khi lưu danh mục.', 'Lỗi', 'error');
    } finally {
      setFormSaving(false);
    }
  };

  const deleteCategory = (id, name) => {
    setConfirmModal({
      show: true,
      title: 'Xóa danh mục',
      message: `Bạn có chắc chắn muốn xóa danh mục "${name}"?\nLƯU Ý: Tất cả danh mục con trực thuộc cũng sẽ bị xóa vĩnh viễn!`,
      type: 'warning',
      isAlert: false,
      onConfirm: async () => {
        try {
          const res = await axios.delete(`/api/categories/${id}`);
          if (res.data?.success) {
            showAlert('Xóa danh mục thành công!', 'Thành công', 'success');
            if (selectedCat?.id === id) setSelectedCat(null);
            await fetchCategories(activeGrade);
          } else {
            showAlert(res.data?.message || 'Lỗi khi xóa danh mục.', 'Lỗi', 'error');
          }
        } catch (err) {
          showAlert(err.response?.data?.message || 'Lỗi khi xóa danh mục.', 'Lỗi', 'error');
        }
      },
    });
  };

  const assignTest = async (testId, categoryId) => {
    if (!testId || !categoryId) return;
    try {
      const res = await axios.patch(`/api/admin/tests/${testId}/category`, { categoryId });
      if (res.data?.success) {
        showAlert('Thêm đề thi vào danh mục thành công!', 'Thành công', 'success');
        await fetchCategories(activeGrade);
        await fetchExams();
        // Refresh selectedCat
        const res2 = await axios.get(`/api/categories?grade=${activeGrade}`);
        if (res2.data?.success) {
          const updated = flattenTree(res2.data.categories).find((c) => c.id === categoryId);
          if (updated) setSelectedCat(updated);
        }
      }
    } catch (err) {
      showAlert(err.response?.data?.message || 'Không thể gán danh mục cho đề thi.', 'Lỗi', 'error');
    }
  };

  const removeTest = (testId, categoryId) => {
    setConfirmModal({
      show: true,
      title: 'Loại đề thi khỏi danh mục',
      message: 'Bạn có chắc muốn loại đề thi này khỏi danh mục?',
      type: 'warning',
      isAlert: false,
      onConfirm: async () => {
        try {
          const res = await axios.patch(`/api/admin/tests/${testId}/category`, { categoryId: null });
          if (res.data?.success) {
            showAlert('Đã loại đề thi khỏi danh mục!', 'Thành công', 'success');
            await fetchCategories(activeGrade);
            await fetchExams();
            const res2 = await axios.get(`/api/categories?grade=${activeGrade}`);
            if (res2.data?.success) {
              const updated = flattenTree(res2.data.categories).find((c) => c.id === categoryId);
              if (updated) setSelectedCat(updated);
            }
          }
        } catch (err) {
          showAlert(err.response?.data?.message || 'Không thể loại đề thi khỏi danh mục.', 'Lỗi', 'error');
        }
      },
    });
  };

  const toggleExpand = (id) => setExpanded((p) => ({ ...p, [id]: !p[id] }));

  // Computed: only categories for active grade (root level)
  const gradeRootCategories = categories.filter(
    (c) => c.grade === activeGrade && !c.parentId
  );

  const totalPages = Math.ceil(gradeRootCategories.length / PAGE_SIZE);
  const pagedRootCategories = gradeRootCategories.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // Child category options for exam assign dropdowns
  const childCategoryOptions = buildChildCategoryOptions(categories);

  return {
    categories, exams, loading, loadingExams, activeGrade, setActiveGrade: setActiveGradeWithReset,
    selectedCat, setSelectedCat,
    expanded, toggleExpand,
    showForm, setShowForm, formMode, formData, setFormData, formSaving,
    detailView, setDetailView,
    page, setPage, totalPages,
    fetchCategories, fetchExams, openForm, saveForm, deleteCategory,
    assignTest, removeTest,
    gradeRootCategories, pagedRootCategories,
    childCategoryOptions,
    flatCategories: flattenTree(categories),
  };
}
