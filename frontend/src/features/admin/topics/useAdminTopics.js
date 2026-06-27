/**
 * useAdminTopics.js — ViewModel Hook
 * Manages topics (chuyên đề) CRUD state and API calls.
 */
import { useState } from 'react';
import axios from 'axios';
import { flattenTree } from '../../../utils/adminHelpers';

export function useAdminTopics({ showAlert, setConfirmModal }) {
  const [topics,       setTopics]       = useState([]);
  const [loading,      setLoading]      = useState(false);
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [expanded,     setExpanded]     = useState({});
  const [showForm,     setShowForm]     = useState(false);
  const [formMode,     setFormMode]     = useState('add'); // 'add' | 'edit'
  const [formSaving,   setFormSaving]   = useState(false);
  const [formData,     setFormData]     = useState({ title: '', description: '', parentId: '' });

  const fetchTopics = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/topics');
      if (res.data?.success) {
        setTopics(res.data.topics);
        const exp = {};
        res.data.topics.forEach((t) => { exp[t.id] = true; });
        setExpanded((prev) => ({ ...exp, ...prev }));
      } else {
        showAlert('Không thể tải danh sách chuyên đề.', 'Lỗi', 'error');
      }
    } catch (err) {
      console.error(err);
      showAlert('Đã xảy ra lỗi khi kết nối với server.', 'Lỗi', 'error');
    } finally {
      setLoading(false);
    }
  };

  const openForm = (mode, parentId = null, topic = null) => {
    setFormMode(mode);
    if (mode === 'add') {
      setFormData({ title: '', description: '', parentId: parentId || '' });
    } else if (mode === 'edit' && topic) {
      setFormData({ id: topic.id, title: topic.title, description: topic.description || '', parentId: topic.parentId || '' });
    }
    setShowForm(true);
  };

  const saveForm = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      showAlert('Vui lòng nhập tiêu đề chuyên đề.', 'Cảnh báo', 'warning');
      return;
    }
    setFormSaving(true);
    try {
      const payload = { title: formData.title.trim(), description: formData.description.trim() || null, parentId: formData.parentId || null };
      if (formMode === 'add') {
        const res = await axios.post('/api/topics', payload);
        if (res.data?.success) {
          showAlert('Tạo chuyên đề mới thành công!', 'Thành công', 'success');
          setShowForm(false);
          await fetchTopics();
          if (formData.parentId) setExpanded((p) => ({ ...p, [formData.parentId]: true }));
        } else {
          showAlert(res.data?.message || 'Lỗi khi tạo chuyên đề.', 'Lỗi', 'error');
        }
      } else {
        const res = await axios.put(`/api/topics/${formData.id}`, payload);
        if (res.data?.success) {
          showAlert('Cập nhật chuyên đề thành công!', 'Thành công', 'success');
          setShowForm(false);
          await fetchTopics();
          // Refresh selectedTopic if it was the edited one
          if (selectedTopic?.id === formData.id) {
            const res2 = await axios.get('/api/topics');
            if (res2.data?.success) {
              const updated = flattenTree(res2.data.topics).find((t) => t.id === formData.id);
              if (updated) setSelectedTopic(updated);
            }
          }
        } else {
          showAlert(res.data?.message || 'Lỗi khi cập nhật chuyên đề.', 'Lỗi', 'error');
        }
      }
    } catch (err) {
      console.error(err);
      showAlert(err.response?.data?.message || 'Đã xảy ra lỗi khi lưu chuyên đề.', 'Lỗi', 'error');
    } finally {
      setFormSaving(false);
    }
  };

  const deleteTopic = (id, title) => {
    setConfirmModal({
      show: true,
      title: 'Xóa chuyên đề',
      message: `Bạn có chắc chắn muốn xóa chuyên đề "${title}"?\nLƯU Ý: Tất cả chuyên đề con trực thuộc cũng sẽ bị xóa vĩnh viễn!`,
      type: 'warning',
      isAlert: false,
      onConfirm: async () => {
        try {
          const res = await axios.delete(`/api/topics/${id}`);
          if (res.data?.success) {
            showAlert('Xóa chuyên đề thành công!', 'Thành công', 'success');
            if (selectedTopic?.id === id) setSelectedTopic(null);
            await fetchTopics();
          } else {
            showAlert(res.data?.message || 'Lỗi khi xóa chuyên đề.', 'Lỗi', 'error');
          }
        } catch (err) {
          showAlert(err.response?.data?.message || 'Đã xảy ra lỗi khi xóa chuyên đề.', 'Lỗi', 'error');
        }
      },
    });
  };

  const toggleExpand = (id) => setExpanded((p) => ({ ...p, [id]: !p[id] }));

  return {
    topics, loading, selectedTopic, setSelectedTopic,
    expanded, toggleExpand,
    showForm, setShowForm, formMode, formData, setFormData, formSaving,
    fetchTopics, openForm, saveForm, deleteTopic,
    flatTopics: flattenTree(topics),
  };
}
