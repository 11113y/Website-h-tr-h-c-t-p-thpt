import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import * as adminApi from '../api/admin';
import { getSubjects, getChapters, getLessons } from '../api/subjects';
import { getExams, getExamDetail } from '../api/exams';
import { getDocuments } from '../api/documents';
import { getArticles } from '../api/articles';
import { 
  LayoutDashboard, Users, BookOpen, FileText, Download, 
  Plus, Trash2, ChevronDown, ChevronRight, Award, Eye, X, Book, Sparkles,
  ArrowLeft, Home, Folder, HelpCircle, Calculator, User, LogOut, MessageSquare
} from 'lucide-react';
import WordImportModal from '../components/admin/WordImportModal';
import OverviewTab from '../components/admin/tabs/OverviewTab';
import UsersTab from '../components/admin/tabs/UsersTab';
import SubjectsTab from '../components/admin/tabs/SubjectsTab';
import ChaptersTab from '../components/admin/tabs/ChaptersTab';
import LessonsTab from '../components/admin/tabs/LessonsTab';
import StudyMaterialsTab from '../components/admin/tabs/StudyMaterialsTab';
import ExamsTab from '../components/admin/tabs/ExamsTab';
import BlogTab from '../components/admin/tabs/BlogTab';
import FormulasTab from '../components/admin/tabs/FormulasTab';
import FeedbacksTab from '../components/admin/tabs/FeedbacksTab';
import AdminProfileTab from '../components/admin/tabs/AdminProfileTab';
import { useDialog } from '../contexts/DialogContext';
import { useAuth } from '../contexts/AuthContext';


export default function AdminPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuth();
  const activeTab = location.pathname.split('/')[2] || 'overview';
  const { alert, confirm } = useDialog();

  const handleLogout = async () => {
    const confirmLogout = await confirm('Bạn có chắc chắn muốn đăng xuất?');
    if (!confirmLogout) return;
    logout();
    navigate('/');
  };

  // Overview stats
  const [stats, setStats] = useState(null);
  const [settings, setSettings] = useState({ restore_streak_cost: 50 });
  const [loading, setLoading] = useState(true);

  // Lists
  const [usersList, setUsersList] = useState([]);
  const [subjectsList, setSubjectsList] = useState([]);
  const [examsList, setExamsList] = useState([]);
  const [documentsList, setDocumentsList] = useState([]);
  const [articlesList, setArticlesList] = useState([]);

  // Hierarchical expand states for Subjects -> Chapters -> Lessons
  const [expandedSubjects, setExpandedSubjects] = useState([]);
  const [expandedChapters, setExpandedChapters] = useState([]);
  const [subjectChapters, setSubjectChapters] = useState({});
  const [chapterLessons, setChapterLessons] = useState({});
  const [chapterQuestions, setChapterQuestions] = useState({});

  // Adding sub-items inside tree states
  const [newChapterForm, setNewChapterForm] = useState({ subjectId: null, name: '', slug: '', orderIndex: 0 });
  const [newLessonForm, setNewLessonForm] = useState({ chapterId: null, title: '', slug: '', content: '', isVip: false, pointsRequired: 0, orderIndex: 0 });
  const [newQuestionForm, setNewQuestionForm] = useState({
    chapterId: null,
    questionText: '',
    questionType: 'single_choice',
    difficulty: 'medium',
    explanation: '',
    points: 10,
    options: [
      { key: 'A', optionText: '', isCorrect: false, optionValue: '' },
      { key: 'B', optionText: '', isCorrect: false, optionValue: '' },
      { key: 'C', optionText: '', isCorrect: false, optionValue: '' },
      { key: 'D', optionText: '', isCorrect: false, optionValue: '' },
    ]
  });

  // Modals / Editor States
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({});
  const [editingUser, setEditingUser] = useState(null);
  const [editingExam, setEditingExam] = useState(null);
  const [availableQuestions, setAvailableQuestions] = useState([]);
  const [selectedQuestionIds, setSelectedQuestionIds] = useState([]);

  // Word document import configuration
  const [wordImportConfig, setWordImportConfig] = useState({
    isOpen: false,
    chapterId: null,
    subjectId: null
  });

  const openWordImportModal = (chapterId = null, subjectId = null) => {
    setWordImportConfig({
      isOpen: true,
      chapterId,
      subjectId
    });
  };

  // User pagination & search states
  const [userPage, setUserPage] = useState(1);
  const [userSearch, setUserSearch] = useState('');
  const [userTotal, setUserTotal] = useState(0);

  const [prevTab, setPrevTab] = useState(activeTab);
  if (activeTab !== prevTab) {
    setPrevTab(activeTab);
    setUserPage(1);
    setUserSearch('');
  }

  useEffect(() => {
    loadTabDetails();
  }, [activeTab, userPage, userSearch]);

  const fetchQuestionsForSubject = async (subjectId) => {
    if (!subjectId) {
      setAvailableQuestions([]);
      return;
    }
    try {
      const res = await adminApi.getQuestions({ subject_id: Number(subjectId) });
      setAvailableQuestions(res.data?.questions || []);
    } catch (err) {
      console.error('Lỗi tải danh sách câu hỏi:', err);
    }
  };

  const loadTabDetails = async () => {
    setLoading(true);
    try {
      if (activeTab === 'overview') {
        const [statsRes, attemptsRes] = await Promise.all([
          adminApi.getDashboard(),
          adminApi.getAllAttempts()
        ]);
        setStats({
          stats: statsRes.data?.stats || {},
          growth_attempts: statsRes.data?.growth_attempts || [],
          growth_users: statsRes.data?.growth_users || [],
          top_exams: statsRes.data?.top_exams || [],
          recentAttempts: attemptsRes.data?.attempts || []
        });
      } else if (activeTab === 'students' || activeTab === 'admins') {
        const targetRole = activeTab === 'students' ? 'student' : 'admin';
        const res = await adminApi.getAdminUsers({
          page: userPage,
          limit: 20,
          role: targetRole,
          search: userSearch
        });
        setUsersList(res.data?.users || []);
        setUserTotal(res.data?.total || 0);
      } else if (activeTab === 'subjects') {
        const res = await getSubjects();
        setSubjectsList(res.data?.subjects || []);
      } else if (activeTab === 'exams') {
        const [examsRes, subjectsRes] = await Promise.all([
          getExams(),
          getSubjects()
        ]);
        setExamsList(examsRes.data?.exams || []);
        setSubjectsList(subjectsRes.data?.subjects || []);
      } else if (activeTab === 'blog' || activeTab === 'documents' || activeTab === 'articles') {
        const [docsRes, articlesRes, subjectsRes] = await Promise.all([
          getDocuments(),
          getArticles(),
          getSubjects()
        ]);
        setDocumentsList(docsRes.data?.documents || []);
        setArticlesList(articlesRes.data?.articles || []);
        setSubjectsList(subjectsRes.data?.subjects || []);
      } else if (activeTab === 'settings') {
        const sRes = await adminApi.getSettings();
        setSettings(sRes.data || { restore_streak_cost: 50 });
      }
    } catch (e) {
      console.error('Lỗi tải dữ liệu quản trị:', e);
    } finally {
      setLoading(false);
    }
  };

  // Toggle Subject Expansion
  const toggleSubject = async (subjectId) => {
    if (expandedSubjects.includes(subjectId)) {
      setExpandedSubjects(prev => prev.filter(id => id !== subjectId));
    } else {
      setExpandedSubjects(prev => [...prev, subjectId]);
      try {
        const res = await getChapters(subjectId);
        setSubjectChapters(prev => ({ ...prev, [subjectId]: res.data?.chapters || [] }));
      } catch (err) {
        console.error('Lỗi tải danh sách chuyên đề:', err);
      }
    }
  };

  // Toggle Chapter Expansion
  const toggleChapter = async (chapterId) => {
    if (expandedChapters.includes(chapterId)) {
      setExpandedChapters(prev => prev.filter(id => id !== chapterId));
    } else {
      setExpandedChapters(prev => [...prev, chapterId]);
      try {
        const [lessonsRes, questionsRes] = await Promise.all([
          getLessons(chapterId),
          adminApi.getChapterQuestions(chapterId)
        ]);
        setChapterLessons(prev => ({ ...prev, [chapterId]: lessonsRes.data?.lessons || [] }));
        setChapterQuestions(prev => ({ ...prev, [chapterId]: questionsRes.data?.questions || [] }));
      } catch (err) {
        console.error('Lỗi tải danh sách bài học/câu hỏi:', err);
      }
    }
  };

  // Add Chapter Submit
  const handleAddChapterSubmit = async (e, subjectId) => {
    e.preventDefault();
    try {
      await adminApi.createChapter({
        subject_id: subjectId,
        name: newChapterForm.name,
        slug: newChapterForm.slug,
        order_index: Number(newChapterForm.orderIndex || 0)
      });
      alert('Đã thêm chuyên đề mới!');
      setNewChapterForm({ subjectId: null, name: '', slug: '', orderIndex: 0 });
      // Refresh chapters
      const res = await getChapters(subjectId);
      setSubjectChapters(prev => ({ ...prev, [subjectId]: res.data?.chapters || [] }));
    } catch (err) {
      alert('Lỗi: ' + (err.response?.data?.message || err.message));
    }
  };

  // Add Lesson Submit
  const handleAddLessonSubmit = async (e, chapterId, subjectId) => {
    e.preventDefault();
    try {
      await adminApi.createLesson({
        chapter_id: chapterId,
        title: newLessonForm.title,
        slug: newLessonForm.slug,
        content: newLessonForm.content,
        is_vip: newLessonForm.isVip,
        points_required: Number(newLessonForm.pointsRequired || 0),
        order_index: Number(newLessonForm.orderIndex || 0)
      });
      alert('Đã thêm bài học mới!');
      setNewLessonForm({ chapterId: null, title: '', slug: '', content: '', isVip: false, pointsRequired: 0, orderIndex: 0 });
      // Refresh lessons
      const res = await getLessons(chapterId);
      setChapterLessons(prev => ({ ...prev, [chapterId]: res.data?.lessons || [] }));
    } catch (err) {
      alert('Lỗi: ' + (err.response?.data?.message || err.message));
    }
  };

  // Add Question Submit
  const handleAddQuestionSubmit = async (e, chapterId) => {
    e.preventDefault();
    try {
      let opts = [];
      if (newQuestionForm.questionType === 'single_choice') {
        opts = newQuestionForm.options.map(o => ({
          key: o.key,
          option_text: o.optionText.trim(),
          is_correct: o.isCorrect,
          option_value: null
        }));
      } else if (newQuestionForm.questionType === 'input_number') {
        opts = [{
          key: 'ANSWER',
          option_text: 'Đáp án đúng',
          is_correct: true,
          option_value: newQuestionForm.options[0].optionValue.trim()
        }];
      }

      await adminApi.createQuestion({
        chapter_id: chapterId,
        question_text: newQuestionForm.questionText,
        question_type: newQuestionForm.questionType,
        difficulty: newQuestionForm.difficulty,
        explanation: newQuestionForm.explanation,
        points: Number(newQuestionForm.points || 10),
        options: opts
      });

      alert('Đã thêm câu hỏi mới!');
      setNewQuestionForm({
        chapterId: null,
        questionText: '',
        questionType: 'single_choice',
        difficulty: 'medium',
        explanation: '',
        points: 10,
        options: [
          { key: 'A', optionText: '', isCorrect: false, optionValue: '' },
          { key: 'B', optionText: '', isCorrect: false, optionValue: '' },
          { key: 'C', optionText: '', isCorrect: false, optionValue: '' },
          { key: 'D', optionText: '', isCorrect: false, optionValue: '' },
        ]
      });

      const res = await adminApi.getChapterQuestions(chapterId);
      setChapterQuestions(prev => ({ ...prev, [chapterId]: res.data?.questions || [] }));
    } catch (err) {
      alert('Lỗi: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleDelete = async (type, id, extraId = null) => {
    const confirmed = await confirm('Bạn có chắc chắn muốn xóa mục này?');
    if (!confirmed) return;
    try {
      if (type === 'subject') {
        await adminApi.deleteSubject(id);
        loadTabDetails();
      } else if (type === 'chapter') {
        await adminApi.deleteChapter(id);
        if (extraId) {
          const res = await getChapters(extraId);
          setSubjectChapters(prev => ({ ...prev, [extraId]: res.data?.chapters || [] }));
        }
      } else if (type === 'lesson') {
        await adminApi.deleteLesson(id);
        if (extraId) {
          const res = await getLessons(extraId);
          setChapterLessons(prev => ({ ...prev, [extraId]: res.data?.lessons || [] }));
        }
      } else if (type === 'question') {
        await adminApi.deleteQuestion(id);
        if (extraId) {
          const res = await adminApi.getChapterQuestions(extraId);
          setChapterQuestions(prev => ({ ...prev, [extraId]: res.data?.questions || [] }));
        }
      } else if (type === 'exam') {
        await adminApi.deleteExam(id);
        loadTabDetails();
      } else if (type === 'document') {
        await adminApi.deleteDocument(id);
        loadTabDetails();
      } else if (type === 'article') {
        await adminApi.deleteArticle(id);
        loadTabDetails();
      } else if (type === 'user') {
        await adminApi.deleteUser(id);
        loadTabDetails();
      }
      alert('Đã xóa thành công!');
    } catch (e) {
      alert('Lỗi khi xóa: ' + (e.response?.data?.message || e.message));
    }
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    try {
      if (activeTab === 'subjects') {
        await adminApi.createSubject({
          name: formData.name,
          slug: formData.slug,
          grade: Number(formData.grade || 10),
          order_index: Number(formData.orderIndex || 0)
        });
      } else if (activeTab === 'exams') {
        if (!formData.title || !formData.title.trim()) {
          alert('Vui lòng nhập tiêu đề đề thi!');
          return;
        }
        const subjectId = formData.subject_id ? Number(formData.subject_id) : null;
        if (!subjectId) {
          alert('Vui lòng chọn Lớp / Chuyên đề!');
          return;
        }
        const timeLimit = Number(formData.time_limit_minutes !== undefined ? formData.time_limit_minutes : 45);
        if (isNaN(timeLimit) || timeLimit <= 0) {
          alert('Thời gian làm bài phải là số nguyên dương!');
          return;
        }
        const points = Number(formData.points_rewarded !== undefined ? formData.points_rewarded : 50);
        if (isNaN(points) || points < 0) {
          alert('Điểm thưởng phải là số không âm!');
          return;
        }

        await adminApi.createExam({
          title: formData.title.trim(),
          description: formData.description || '',
          subject_id: subjectId,
          time_limit_minutes: timeLimit,
          difficulty: formData.difficulty || 'medium',
          points_rewarded: points,
          question_ids: selectedQuestionIds
        });
      } else if (activeTab === 'documents') {
        await adminApi.createDocument({
          title: formData.title,
          description: formData.description || '',
          subject_id: Number(formData.subject_id),
          file_url: formData.file_url,
          is_vip: formData.is_vip || false,
          points_required: Number(formData.points_required || 0)
        });
      } else if (activeTab === 'articles') {
        await adminApi.createArticle({
          title: formData.title,
          summary: formData.summary || '',
          content: formData.content
        });
      } else if (activeTab === 'students' || activeTab === 'admins') {
        const role = activeTab === 'students' ? 'student' : 'admin';
        await adminApi.createUser({
          username: formData.username,
          email: formData.email,
          role,
          password: formData.password || '123456'
        });
      }
      alert('Thêm mới thành công!');
      setShowAddForm(false);
      setFormData({});
      setSelectedQuestionIds([]);
      setAvailableQuestions([]);
      loadTabDetails();
    } catch (err) {
      alert('Lỗi tạo mới: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleUpdateUserSubmit = async (e) => {
    e.preventDefault();
    try {
      await adminApi.updateUser(editingUser.id, {
        username: editingUser.username,
        email: editingUser.email,
        role: editingUser.role,
        points: Number(editingUser.points || 0),
        streak_count: Number(editingUser.streak_count || 0),
        password: editingUser.password || undefined
      });
      alert('Cập nhật thành viên thành công!');
      setEditingUser(null);
      loadTabDetails();
    } catch (err) {
      alert('Lỗi cập nhật: ' + (err.response?.data?.message || err.message));
    }
  };


  const handleEditExam = async (exam) => {
    try {
      setLoading(true);
      const res = await getExamDetail(exam.id);
      const examData = res.data?.exam || exam;
      const currentQuestions = res.data?.questions || [];
      
      setEditingExam(examData);
      setSelectedQuestionIds(currentQuestions.map(q => q.id));
      
      // Fetch available questions for the subject of this exam
      const questionsRes = await adminApi.getQuestions({ subject_id: Number(examData.subject_id) });
      setAvailableQuestions(questionsRes.data?.questions || []);
    } catch (err) {
      alert('Lỗi khi tải chi tiết đề thi: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleWordImportSuccess = async (importedIds, targetChapterId) => {
    if (wordImportConfig.chapterId) {
      // Reload current chapter questions list
      try {
        const res = await adminApi.getChapterQuestions(wordImportConfig.chapterId);
        setChapterQuestions(prev => ({ ...prev, [wordImportConfig.chapterId]: res.data?.questions || [] }));
      } catch (err) {
        console.error('Lỗi tải lại danh sách câu hỏi của chuyên đề:', err);
      }
    } else {
      // From Exam create/edit form
      const currentSubjectId = formData.subject_id || editingExam?.subject_id;
      if (currentSubjectId) {
        await fetchQuestionsForSubject(currentSubjectId);
        setSelectedQuestionIds(prev => {
          const next = [...prev];
          importedIds.forEach(id => {
            if (!next.includes(id)) next.push(id);
          });
          return next;
        });
      }
    }
  };

  const handleUpdateExamSubmit = async (e) => {
    e.preventDefault();
    if (!editingExam.title || !editingExam.title.trim()) {
      alert('Vui lòng nhập tiêu đề đề thi!');
      return;
    }
    const subjectId = editingExam.subject_id ? Number(editingExam.subject_id) : null;
    if (!subjectId) {
      alert('Vui lòng chọn Lớp / Chuyên đề!');
      return;
    }
    const timeLimit = Number(editingExam.time_limit_minutes);
    if (isNaN(timeLimit) || timeLimit <= 0) {
      alert('Thời gian làm bài phải là số nguyên dương!');
      return;
    }
    const points = Number(editingExam.points_rewarded);
    if (isNaN(points) || points < 0) {
      alert('Điểm thưởng phải là số không âm!');
      return;
    }

    try {
      await adminApi.updateExam(editingExam.id, {
        title: editingExam.title.trim(),
        description: editingExam.description || '',
        subject_id: subjectId,
        time_limit_minutes: timeLimit,
        difficulty: editingExam.difficulty || 'medium',
        points_rewarded: points,
        question_ids: selectedQuestionIds
      });
      alert('Cập nhật đề thi thành công!');
      setEditingExam(null);
      loadTabDetails();
    } catch (err) {
      alert('Lỗi cập nhật đề thi: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      await adminApi.saveSettings({
        restore_streak_cost: Number(settings.restore_streak_cost)
      });
      alert('Đã lưu cấu hình thành công!');
    } catch (err) {
      alert('Lỗi: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'overview', label: 'Tổng quan', icon: <LayoutDashboard size={16} /> },
    { id: 'students', label: 'Học sinh', icon: <Users size={16} /> },
    { id: 'admins', label: 'Quản trị viên', icon: <Users size={16} /> },
    { id: 'subjects', label: 'Lớp', icon: <BookOpen size={16} /> },
    { id: 'chapters', label: 'Bài học', icon: <Folder size={16} /> },
    { id: 'lessons', label: 'Chuyên đề', icon: <Book size={16} /> },
    { id: 'study-materials', label: 'TL học tập', icon: <FileText size={16} /> },
    { id: 'exams', label: 'Đề thi', icon: <Award size={16} /> },
    { id: 'formulas', label: 'Kho công thức', icon: <Calculator size={16} /> },
    { id: 'feedbacks', label: 'Góp ý & phản hồi', icon: <MessageSquare size={16} /> },
    { id: 'blog', label: 'Quản lý Blog', icon: <FileText size={16} /> },
    { id: 'settings', label: 'Cấu hình', icon: <Sparkles size={16} /> },
    { id: 'profile', label: 'Trang cá nhân', icon: <User size={16} /> },
  ];

  return (
    <div className="layout-with-sidebar" style={{ display: 'flex', minHeight: '100vh' }}>
      {/* Admin Sidebar */}
      <aside className="sidebar" style={{ width: 240, background: '#f8fafc', borderRight: '1px solid #e2e8f0', padding: '20px 10px', top: 0, height: '100vh', overflowY: 'auto' }}>
        <div style={{ padding: '0 12px 16px', borderBottom: '1px solid #e2e8f0', marginBottom: 16 }}>
          <div style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', tracking: '0.05em' }}>Quản trị hệ thống</div>
          <div style={{ fontSize: '1rem', fontWeight: 900, color: 'var(--primary)', marginTop: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Sparkles size={16} /> TD Math Admin
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {tabs.map(t => (
            <Link 
              key={t.id} 
              to={`/admin/${t.id}`} 
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '10px 16px',
                borderRadius: 10,
                color: activeTab === t.id ? 'var(--primary)' : '#475569',
                backgroundColor: activeTab === t.id ? '#e6f2f0' : 'transparent',
                fontWeight: activeTab === t.id ? 700 : 600,
                textDecoration: 'none',
                transition: 'all 0.2s ease'
              }}
            >
              <span>{t.icon}</span>
              <span>{t.label}</span>
            </Link>
          ))}
          <div style={{ borderTop: '1px solid #e2e8f0', marginTop: 16, paddingTop: 16, display: 'flex', flexDirection: 'column', gap: 4 }}>
            <button 
              onClick={handleLogout}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '10px 16px',
                borderRadius: 10,
                color: '#ef4444',
                fontWeight: 600,
                background: 'none',
                border: 'none',
                width: '100%',
                textAlign: 'left',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={e => {
                e.currentTarget.style.backgroundColor = '#fef2f2';
                e.currentTarget.style.color = '#dc2626';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = '#ef4444';
              }}
            >
              <LogOut size={16} />
              <span>Đăng xuất</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Admin Main Content */}
      <div className="main-content" style={{ flex: 1, padding: 32, background: '#fff' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 900, color: '#1e293b' }}>
              {tabs.find(t => t.id === activeTab)?.label || 'Quản lý Blog'}
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: 2 }}>Trang quản lý dữ liệu và thống kê tổng quát</p>
          </div>
          {['students', 'admins', 'documents', 'articles'].includes(activeTab) && (
            <button 
              className="btn btn-primary btn-sm" 
              onClick={() => {
                setFormData({ grade: 10, difficulty: 'medium', is_vip: false, password: '123456' });
                setShowAddForm(true);
              }}
              style={{ display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <Plus size={16} /> 
              {activeTab === 'students' ? 'Thêm học sinh' : activeTab === 'admins' ? 'Thêm quản trị viên' : 'Thêm mới'}
            </button>
          )}
        </div>

        {loading ? (
          <div className="page-loading" style={{ padding: '80px 0' }}><div className="spinner" /></div>
        ) : (
          <div>
            {activeTab === 'overview' && (
              <OverviewTab stats={stats} />
            )}

            {(activeTab === 'students' || activeTab === 'admins') && (
              <UsersTab
                activeTab={activeTab}
                usersList={usersList}
                userTotal={userTotal}
                userSearch={userSearch}
                setUserSearch={setUserSearch}
                userPage={userPage}
                setUserPage={setUserPage}
                setEditingUser={setEditingUser}
                handleDelete={handleDelete}
              />
            )}

            {activeTab === 'subjects' && (
              <SubjectsTab />
            )}

            {activeTab === 'chapters' && (
              <ChaptersTab />
            )}

            {activeTab === 'study-materials' && (
              <StudyMaterialsTab />
            )}

            {activeTab === 'lessons' && (
              <LessonsTab />
            )}

            {activeTab === 'exams' && (
              <ExamsTab />
            )}

            {activeTab === 'formulas' && (
              <FormulasTab />
            )}

            {activeTab === 'feedbacks' && (
              <FeedbacksTab />
            )}

            {(activeTab === 'blog' || activeTab === 'documents' || activeTab === 'articles') && (
              <BlogTab
                articlesList={articlesList}
                documentsList={documentsList}
                subjectsList={subjectsList}
                handleDelete={handleDelete}
                loadTabDetails={loadTabDetails}
              />
            )}

            {activeTab === 'settings' && (
              <div style={{ maxWidth: 500, padding: 28, background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8, color: 'var(--primary)' }}>
                  <Sparkles size={20} /> Cấu hình chuỗi học tập (Streak)
                </h3>
                <form onSubmit={handleSaveSettings} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div className="form-group">
                    <label className="form-label" style={{ fontWeight: 600 }}>Chi phí khôi phục chuỗi (điểm)</label>
                    <input 
                      type="number" 
                      className="form-control"
                      value={settings.restore_streak_cost || ''} 
                      onChange={e => setSettings(p => ({ ...p, restore_streak_cost: e.target.value }))}
                      required 
                      min="0"
                    />
                    <small style={{ color: 'var(--text-muted)' }}>Số điểm học sinh phải trả khi muốn khôi phục lại chuỗi học tập đã mất.</small>
                  </div>
                  <button type="submit" className="btn btn-primary" style={{ alignSelf: 'flex-start' }}>Lưu cấu hình</button>
                </form>
              </div>
            )}

            {activeTab === 'profile' && (
              <AdminProfileTab />
            )}
          </div>
        )}
      {/* Add New Modal */}
      {showAddForm && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999
        }}>
          <div style={{
            background: '#fff',
            borderRadius: 20,
            width: '100%',
            maxWidth: 500,
            padding: 28,
            boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 900, color: '#1e293b' }}>
                Thêm {activeTab === 'subjects' ? 'Chuyên đề' : activeTab === 'exams' ? 'Đề thi' : activeTab === 'documents' ? 'Tài liệu PDF' : activeTab === 'students' ? 'Học sinh' : activeTab === 'admins' ? 'Quản trị viên' : 'Bài viết'} mới
              </h3>
              <button onClick={() => setShowAddForm(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleCreateSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {(activeTab === 'students' || activeTab === 'admins') && (
                <>
                  <div className="form-group">
                    <label className="form-label">Tên tài khoản / Họ tên</label>
                    <input 
                      className="form-control" 
                      required 
                      placeholder="Ví dụ: Nguyễn Văn A" 
                      value={formData.username || ''}
                      onChange={e => setFormData(p => ({ ...p, username: e.target.value }))}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Địa chỉ Email</label>
                    <input 
                      type="email"
                      className="form-control" 
                      required 
                      placeholder="Ví dụ: student@gmail.com" 
                      value={formData.email || ''}
                      onChange={e => setFormData(p => ({ ...p, email: e.target.value }))}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Mật khẩu</label>
                    <input 
                      type="password"
                      className="form-control" 
                      required 
                      placeholder="Nhập mật khẩu (mặc định: 123456)" 
                      value={formData.password || ''}
                      onChange={e => setFormData(p => ({ ...p, password: e.target.value }))}
                    />
                  </div>
                </>
              )}

              {activeTab === 'subjects' && (
                <>
                  <div className="form-group">
                    <label className="form-label">Tên môn học / Chuyên đề</label>
                    <input 
                      className="form-control" 
                      required 
                      placeholder="Ví dụ: Chuyên đề Đại Số lớp 10" 
                      value={formData.name || ''}
                      onChange={e => setFormData(p => ({ ...p, name: e.target.value }))}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Slug URL</label>
                    <input 
                      className="form-control" 
                      required 
                      placeholder="Ví dụ: dai-so-10" 
                      value={formData.slug || ''}
                      onChange={e => setFormData(p => ({ ...p, slug: e.target.value }))}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Khối lớp học</label>
                    <select 
                      className="form-control" 
                      required
                      value={formData.grade !== undefined ? formData.grade : 10}
                      onChange={e => setFormData(p => ({ ...p, grade: Number(e.target.value) }))}
                    >
                      {Array.from({ length: 12 }, (_, i) => i + 1).map(g => (
                        <option key={g} value={g}>Lớp {g}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Thứ tự hiển thị</label>
                    <input 
                      type="number"
                      className="form-control" 
                      placeholder="Ví dụ: 1" 
                      value={formData.orderIndex || 0}
                      onChange={e => setFormData(p => ({ ...p, orderIndex: Number(e.target.value) }))}
                    />
                  </div>
                </>
              )}

              {activeTab === 'exams' && (
                <>
                  <div className="form-group">
                    <label className="form-label">Tiêu đề đề thi</label>
                    <input 
                      className="form-control" 
                      required 
                      placeholder="Ví dụ: Đề thi khảo sát chất lượng Hàm Số" 
                      value={formData.title || ''}
                      onChange={e => setFormData(p => ({ ...p, title: e.target.value }))}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Mô tả</label>
                    <input 
                      className="form-control" 
                      placeholder="Mô tả ngắn về đề thi này..." 
                      value={formData.description || ''}
                      onChange={e => setFormData(p => ({ ...p, description: e.target.value }))}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Chọn Lớp / Chuyên đề</label>
                    <select 
                      className="form-control" 
                      required
                      value={formData.subject_id || ''}
                      onChange={e => {
                        const val = e.target.value;
                        setFormData(p => ({ ...p, subject_id: val }));
                        setSelectedQuestionIds([]);
                        fetchQuestionsForSubject(val);
                      }}
                    >
                      <option value="">-- Chọn chuyên đề học tập --</option>
                      {subjectsList.map(s => (
                        <option key={s.id} value={s.id}>{s.name} (Khối {s.grade})</option>
                      ))}
                    </select>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div className="form-group">
                      <label className="form-label">Thời gian làm bài (phút)</label>
                      <input 
                        type="number"
                        className="form-control" 
                        required
                        placeholder="Ví dụ: 45" 
                        value={formData.time_limit_minutes || 45}
                        onChange={e => setFormData(p => ({ ...p, time_limit_minutes: Number(e.target.value) }))}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Điểm thưởng</label>
                      <input 
                        type="number"
                        className="form-control" 
                        required
                        placeholder="Ví dụ: 50" 
                        value={formData.points_rewarded || 50}
                        onChange={e => setFormData(p => ({ ...p, points_rewarded: Number(e.target.value) }))}
                      />
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Độ khó</label>
                    <select 
                      className="form-control" 
                      value={formData.difficulty || 'medium'}
                      onChange={e => setFormData(p => ({ ...p, difficulty: e.target.value }))}
                    >
                      <option value="easy">Dễ</option>
                      <option value="medium">Trung bình</option>
                      <option value="hard">Khó</option>
                    </select>
                  </div>

                  {/* Select questions for exam */}
                  <div className="form-group">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                      <label className="form-label" style={{ fontWeight: 800, margin: 0 }}>Chọn câu hỏi của lớp này</label>
                      {formData.subject_id && (
                        <button 
                          type="button"
                          className="btn btn-ghost btn-sm"
                          style={{ color: '#16a34a', fontWeight: 700, padding: '2px 8px', fontSize: '0.8rem' }}
                          onClick={() => openWordImportModal(null, formData.subject_id)}
                        >
                          📄 Trích xuất từ Word (.docx)
                        </button>
                      )}
                    </div>
                    <div style={{ 
                      border: '1px solid #e2e8f0', 
                      borderRadius: 12, 
                      maxHeight: 250, 
                      overflowY: 'auto', 
                      padding: 12,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 8,
                      background: '#f8fafc'
                    }}>
                      {!formData.subject_id ? (
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textAlign: 'center', padding: '12px 0' }}>
                          Vui lòng chọn Lớp / Chuyên đề phía trên trước để hiển thị câu hỏi.
                        </span>
                      ) : availableQuestions.length === 0 ? (
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textAlign: 'center', padding: '12px 0' }}>
                          Chưa có câu hỏi nào thuộc Lớp / Chuyên đề này. Hãy thêm câu hỏi ở tab Lớp & Bài học trước.
                        </span>
                      ) : (
                        availableQuestions.map(q => {
                          const isChecked = selectedQuestionIds.includes(q.id);
                          return (
                            <label key={q.id} style={{ 
                              display: 'flex', 
                              alignItems: 'flex-start', 
                              gap: 10, 
                              fontSize: '0.85rem',
                              background: isChecked ? '#eff6ff' : '#fff',
                              padding: 8,
                              borderRadius: 8,
                              border: isChecked ? '1px solid #bfdbfe' : '1px solid #e2e8f0',
                              cursor: 'pointer'
                            }}>
                              <input 
                                type="checkbox" 
                                style={{ marginTop: 3 }}
                                checked={isChecked}
                                onChange={() => {
                                  setSelectedQuestionIds(prev => 
                                    prev.includes(q.id) ? prev.filter(id => id !== q.id) : [...prev, q.id]
                                  );
                                }}
                              />
                              <div style={{ flex: 1 }}>
                                <span style={{ fontWeight: 700, color: 'var(--primary)', marginRight: 6 }}>
                                  [{q.difficulty.toUpperCase()} - {q.points}đ]
                                </span>
                                <span style={{ color: '#334155' }}>{q.question_text}</span>
                              </div>
                            </label>
                          );
                        })
                      )}
                    </div>
                    {formData.subject_id && (
                      <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: 4, fontWeight: 600 }}>
                        Đã chọn {selectedQuestionIds.length} câu hỏi.
                      </div>
                    )}
                  </div>
                </>
              )}

              {activeTab === 'documents' && (
                <>
                  <div className="form-group">
                    <label className="form-label">Tiêu đề tài liệu</label>
                    <input 
                      className="form-control" 
                      required 
                      placeholder="Ví dụ: Tóm tắt công thức Hình học 10" 
                      value={formData.title || ''}
                      onChange={e => setFormData(p => ({ ...p, title: e.target.value }))}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Mô tả</label>
                    <input 
                      className="form-control" 
                      placeholder="Mô tả sơ lược về tài liệu..." 
                      value={formData.description || ''}
                      onChange={e => setFormData(p => ({ ...p, description: e.target.value }))}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Chọn Môn học</label>
                    <select 
                      className="form-control" 
                      required
                      value={formData.subject_id || ''}
                      onChange={e => setFormData(p => ({ ...p, subject_id: e.target.value }))}
                    >
                      <option value="">-- Chọn chuyên đề học tập --</option>
                      {subjectsList.map(s => (
                        <option key={s.id} value={s.id}>{s.name} (Khối {s.grade})</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Đường dẫn tệp tài liệu (file_url / PDF Link)</label>
                    <input 
                      className="form-control" 
                      required
                      placeholder="Ví dụ: /uploads/hinh-hoc-10.pdf" 
                      value={formData.file_url || ''}
                      onChange={e => setFormData(p => ({ ...p, file_url: e.target.value }))}
                    />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 8 }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700, fontSize: '0.9rem' }}>
                      <input 
                        type="checkbox" 
                        checked={formData.is_vip || false}
                        onChange={e => setFormData(p => ({ ...p, is_vip: e.target.checked }))}
                      />
                      Tài liệu VIP
                    </label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 'auto' }}>
                      <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Điểm yêu cầu tải:</span>
                      <input 
                        type="number"
                        className="form-control" 
                        style={{ width: 80 }}
                        value={formData.points_required || 0}
                        onChange={e => setFormData(p => ({ ...p, points_required: Number(e.target.value) }))}
                      />
                    </div>
                  </div>
                </>
              )}

              {activeTab === 'articles' && (
                <>
                  <div className="form-group">
                    <label className="form-label">Tiêu đề bài viết</label>
                    <input 
                      className="form-control" 
                      required 
                      placeholder="Ví dụ: Bí quyết ôn thi THPT Quốc gia đạt điểm cao" 
                      value={formData.title || ''}
                      onChange={e => setFormData(p => ({ ...p, title: e.target.value }))}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Tóm tắt ngắn</label>
                    <input 
                      className="form-control" 
                      placeholder="Một vài câu tóm tắt nội dung chính..." 
                      value={formData.summary || ''}
                      onChange={e => setFormData(p => ({ ...p, summary: e.target.value }))}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Nội dung bài viết</label>
                    <textarea 
                      className="form-control" 
                      required
                      rows={6}
                      placeholder="Nội dung chính..." 
                      value={formData.content || ''}
                      onChange={e => setFormData(p => ({ ...p, content: e.target.value }))}
                      style={{ resize: 'vertical' }}
                    />
                  </div>
                </>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 16 }}>
                <button type="button" className="btn btn-ghost" onClick={() => setShowAddForm(false)}>Hủy bỏ</button>
                <button type="submit" className="btn btn-primary">Tạo mới</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {editingUser && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999
        }}>
          <div style={{
            background: '#fff',
            borderRadius: 20,
            width: '100%',
            maxWidth: 500,
            padding: 28,
            boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 900, color: '#1e293b' }}>
                Sửa thông tin {editingUser.role === 'admin' ? 'Quản trị viên' : 'Học sinh'}
              </h3>
              <button onClick={() => setEditingUser(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleUpdateUserSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="form-group">
                <label className="form-label">Tên tài khoản / Họ tên</label>
                <input 
                  className="form-control" 
                  required 
                  placeholder="Ví dụ: Nguyễn Văn A" 
                  value={editingUser.username || ''}
                  onChange={e => setEditingUser(p => ({ ...p, username: e.target.value }))}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Địa chỉ Email</label>
                <input 
                  type="email"
                  className="form-control" 
                  required 
                  placeholder="Ví dụ: email@gmail.com" 
                  value={editingUser.email || ''}
                  onChange={e => setEditingUser(p => ({ ...p, email: e.target.value }))}
                />
              </div>
              
              <div className="form-group">
                <label className="form-label">Vai trò</label>
                <select 
                  className="form-control"
                  value={editingUser.role || 'student'}
                  onChange={e => setEditingUser(p => ({ ...p, role: e.target.value }))}
                >
                  <option value="student">student</option>
                  <option value="admin">admin</option>
                </select>
              </div>

              {editingUser.role === 'student' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div className="form-group">
                    <label className="form-label">Điểm tích lũy</label>
                    <input 
                      type="number"
                      className="form-control" 
                      required
                      value={editingUser.points || 0}
                      onChange={e => setEditingUser(p => ({ ...p, points: Number(e.target.value) }))}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Chuỗi ngày học (streak)</label>
                    <input 
                      type="number"
                      className="form-control" 
                      required
                      value={editingUser.streak_count || 0}
                      onChange={e => setEditingUser(p => ({ ...p, streak_count: Number(e.target.value) }))}
                    />
                  </div>
                </div>
              )}

              <div className="form-group">
                <label className="form-label">Mật khẩu mới (để trống nếu không đổi)</label>
                <input 
                  type="password"
                  className="form-control" 
                  placeholder="Nhập mật khẩu mới" 
                  value={editingUser.password || ''}
                  onChange={e => setEditingUser(p => ({ ...p, password: e.target.value }))}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 16 }}>
                <button type="button" className="btn btn-ghost" onClick={() => setEditingUser(null)}>Hủy bỏ</button>
                <button type="submit" className="btn btn-primary">Lưu thay đổi</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Exam Modal */}
      {editingExam && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999
        }}>
          <div style={{
            background: '#fff',
            borderRadius: 20,
            width: '100%',
            maxWidth: 600,
            padding: 28,
            boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 900, color: '#1e293b' }}>
                Chỉnh sửa đề kiểm tra / thi
              </h3>
              <button onClick={() => setEditingExam(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleUpdateExamSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="form-group">
                <label className="form-label">Tiêu đề đề thi</label>
                <input 
                  className="form-control" 
                  required 
                  placeholder="Ví dụ: Đề kiểm tra chuyên đề Hàm Số" 
                  value={editingExam.title || ''}
                  onChange={e => setEditingExam(p => ({ ...p, title: e.target.value }))}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Mô tả</label>
                <input 
                  className="form-control" 
                  placeholder="Mô tả ngắn..." 
                  value={editingExam.description || ''}
                  onChange={e => setEditingExam(p => ({ ...p, description: e.target.value }))}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Chọn Lớp / Chuyên đề</label>
                <select 
                  className="form-control" 
                  required
                  value={editingExam.subject_id || ''}
                  onChange={e => {
                    const val = e.target.value;
                    setEditingExam(p => ({ ...p, subject_id: val }));
                    setSelectedQuestionIds([]);
                    fetchQuestionsForSubject(val);
                  }}
                >
                  <option value="">-- Chọn chuyên đề học tập --</option>
                  {subjectsList.map(s => (
                    <option key={s.id} value={s.id}>{s.name} (Khối {s.grade})</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="form-group">
                  <label className="form-label">Thời gian làm bài (phút)</label>
                  <input 
                    type="number"
                    className="form-control" 
                    required
                    min={1}
                    value={editingExam.time_limit_minutes || 45}
                    onChange={e => setEditingExam(p => ({ ...p, time_limit_minutes: Number(e.target.value) }))}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Điểm thưởng</label>
                  <input 
                    type="number"
                    className="form-control" 
                    required
                    min={0}
                    value={editingExam.points_rewarded || 50}
                    onChange={e => setEditingExam(p => ({ ...p, points_rewarded: Number(e.target.value) }))}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Độ khó</label>
                <select 
                  className="form-control" 
                  value={editingExam.difficulty || 'medium'}
                  onChange={e => setEditingExam(p => ({ ...p, difficulty: e.target.value }))}
                >
                  <option value="easy">Dễ</option>
                  <option value="medium">Trung bình</option>
                  <option value="hard">Khó</option>
                </select>
              </div>

              {/* Select questions for exam */}
              <div className="form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <label className="form-label" style={{ fontWeight: 800, margin: 0 }}>Chọn câu hỏi của lớp này</label>
                  {editingExam.subject_id && (
                    <button 
                      type="button"
                      className="btn btn-ghost btn-sm"
                      style={{ color: '#16a34a', fontWeight: 700, padding: '2px 8px', fontSize: '0.8rem' }}
                      onClick={() => openWordImportModal(null, editingExam.subject_id)}
                    >
                      📄 Trích xuất từ Word (.docx)
                    </button>
                  )}
                </div>
                <div style={{ 
                  border: '1px solid #e2e8f0', 
                  borderRadius: 12, 
                  maxHeight: 200, 
                  overflowY: 'auto', 
                  padding: 12,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8,
                  background: '#f8fafc'
                }}>
                  {!editingExam.subject_id ? (
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textAlign: 'center', padding: '12px 0' }}>
                      Vui lòng chọn Lớp / Chuyên đề phía trên trước để hiển thị câu hỏi.
                    </span>
                  ) : availableQuestions.length === 0 ? (
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textAlign: 'center', padding: '12px 0' }}>
                      Chưa có câu hỏi nào thuộc Lớp / Chuyên đề này. Hãy thêm câu hỏi ở tab Lớp & Bài học trước.
                    </span>
                  ) : (
                    availableQuestions.map(q => {
                      const isChecked = selectedQuestionIds.includes(q.id);
                      return (
                        <label key={q.id} style={{ 
                          display: 'flex', 
                          alignItems: 'flex-start', 
                          gap: 10, 
                          fontSize: '0.85rem',
                          background: isChecked ? '#eff6ff' : '#fff',
                          padding: 8,
                          borderRadius: 8,
                          border: isChecked ? '1px solid #bfdbfe' : '1px solid #e2e8f0',
                          cursor: 'pointer'
                        }}>
                          <input 
                            type="checkbox" 
                            style={{ marginTop: 3 }}
                            checked={isChecked}
                            onChange={() => {
                              setSelectedQuestionIds(prev => 
                                prev.includes(q.id) ? prev.filter(id => id !== q.id) : [...prev, q.id]
                              );
                            }}
                          />
                          <div style={{ flex: 1 }}>
                            <span style={{ fontWeight: 700, color: 'var(--primary)', marginRight: 6 }}>
                              [{q.difficulty.toUpperCase()} - {q.points}đ]
                            </span>
                            <span style={{ color: '#334155' }}>{q.question_text}</span>
                          </div>
                        </label>
                      );
                    })
                  )}
                </div>
                {editingExam.subject_id && (
                  <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: 4, fontWeight: 600 }}>
                    Đã chọn {selectedQuestionIds.length} câu hỏi.
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 16 }}>
                <button type="button" className="btn btn-ghost" onClick={() => setEditingExam(null)}>Hủy bỏ</button>
                <button type="submit" className="btn btn-primary">Lưu thay đổi</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Word Document Question Extractor Modal */}
      <WordImportModal
        isOpen={wordImportConfig.isOpen}
        onClose={() => setWordImportConfig(prev => ({ ...prev, isOpen: false }))}
        preselectedChapterId={wordImportConfig.chapterId}
        subjects={subjectsList}
        onImportSuccess={handleWordImportSuccess}
      />
      </div>
    </div>
  );
}
