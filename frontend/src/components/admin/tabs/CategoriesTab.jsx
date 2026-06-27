import React, { useState, useEffect } from 'react';
import { 
  Trash2, Edit, Plus, X, Folder, BookOpen, FileText, Award, 
  ChevronRight, ArrowRight, Settings, Upload, Check, Loader, Video
} from 'lucide-react';
import { getSubjects, getChapters, getLessons, getStudyMaterials } from '../../../api/subjects';
import { getExams } from '../../../api/exams';
import * as adminApi from '../../../api/admin';
import { useDialog } from '../../../contexts/DialogContext';
import client from '../../../api/client';
import { extractQuestionsFromDocx } from '../../../utils/docxParser';

const toVietnameseSlug = (str) => {
  if (!str) return '';
  str = str.toLowerCase();
  str = str.replace(/à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ/g, 'a');
  str = str.replace(/è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ/g, 'e');
  str = str.replace(/ì|í|ị|ỉ|ĩ/g, 'i');
  str = str.replace(/ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ/g, 'o');
  str = str.replace(/ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ/g, 'u');
  str = str.replace(/ỳ|ý|ỵ|ỷ|ỹ/g, 'y');
  str = str.replace(/đ/g, 'd');
  str = str.replace(/[^a-z0-9\s-]/g, '');
  str = str.replace(/[\s-]+/g, '-');
  str = str.replace(/^-+|-+$/g, '');
  return str;
};

export default function CategoriesTab() {
  const { alert, confirm } = useDialog();

  // Core Data Lists
  const [subjects, setSubjects] = useState([]); // Level 1: Lớp (Subjects)
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [chapters, setChapters] = useState([]); // Level 2: Bài học (Chapters)
  const [lessonsMap, setLessonsMap] = useState({}); // Level 3: Chuyên đề (Lessons) mapped by chapterId
  const [loading, setLoading] = useState(false);

  // Active items for CRUD modals
  const [activeSubject, setActiveSubject] = useState(null);
  const [activeChapter, setActiveChapter] = useState(null);
  const [activeLesson, setActiveLesson] = useState(null);

  // Modals visibility
  const [showSubjectModal, setShowSubjectModal] = useState(false);
  const [showChapterModal, setShowChapterModal] = useState(false);
  const [showLessonModal, setShowLessonModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false); // Level 4 modal

  // Form states
  const [subjectForm, setSubjectForm] = useState({ id: null, name: '', slug: '', grade: 10, orderIndex: 0 });
  const [chapterForm, setChapterForm] = useState({ id: null, name: '', slug: '', orderIndex: 0, subjectId: '' });
  const [lessonForm, setLessonForm] = useState({ id: null, title: '', slug: '', content: '', isVip: false, pointsRequired: 0, orderIndex: 0, chapterId: '' });

  // Detail Modal Sub-states (Materials and Exams)
  const [selectedLesson, setSelectedLesson] = useState(null);
  const [materials, setMaterials] = useState([]);
  const [exams, setExams] = useState([]);
  const [loadingDetails, setLoadingDetails] = useState(false);

  // Material Form state
  const [showAddMaterial, setShowAddMaterial] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState(null);
  const [materialForm, setMaterialForm] = useState({
    title: '', content: '', isVip: false, pointsRequired: 0, pdfUrl: '', videoUrl: ''
  });
  const [uploadingPdf, setUploadingPdf] = useState(false);

  // Exam Form state
  const [showAddExam, setShowAddExam] = useState(false);
  const [editingExam, setEditingExam] = useState(null);
  const [examForm, setExamForm] = useState({
    title: '', description: '', timeLimit: 45, pointsRewarded: 50, difficulty: 'medium'
  });
  const [importFile, setImportFile] = useState(null);
  const [isImporting, setIsImporting] = useState(false);

  // ----------------------------------------------------------------
  // 1. Initial Load & Cascade fetch
  // ----------------------------------------------------------------
  useEffect(() => {
    loadSubjects();
  }, []);

  const loadSubjects = async () => {
    setLoading(true);
    try {
      const res = await getSubjects();
      const subs = res.data?.subjects || [];
      setSubjects(subs);
      if (subs.length > 0 && !selectedSubjectId) {
        setSelectedSubjectId(subs[0].id.toString());
      }
    } catch (err) {
      console.error('Lỗi tải danh sách Lớp:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedSubjectId) {
      loadChaptersAndLessons(selectedSubjectId);
    } else {
      setChapters([]);
      setLessonsMap({});
    }
  }, [selectedSubjectId]);

  const loadChaptersAndLessons = async (subjectId) => {
    setLoading(true);
    try {
      const chapRes = await getChapters(subjectId);
      const chs = chapRes.data?.chapters || [];
      setChapters(chs);
      
      const newLessonsMap = {};
      for (const ch of chs) {
        try {
          const lesRes = await getLessons(ch.id);
          newLessonsMap[ch.id] = lesRes.data?.lessons || [];
        } catch (e) {
          console.error(`Lỗi tải chuyên đề của bài học ${ch.id}:`, e);
          newLessonsMap[ch.id] = [];
        }
      }
      setLessonsMap(newLessonsMap);
    } catch (err) {
      console.error('Lỗi tải chương/bài học:', err);
    } finally {
      setLoading(false);
    }
  };

  // ----------------------------------------------------------------
  // 2. Class (Subject) Actions
  // ----------------------------------------------------------------
  const handleOpenSubjectModal = (subj = null) => {
    if (subj) {
      setSubjectForm({ id: subj.id, name: subj.name, slug: subj.slug, grade: subj.grade, orderIndex: subj.order_index });
    } else {
      setSubjectForm({ id: null, name: '', slug: '', grade: 10, orderIndex: subjects.length + 1 });
    }
    setShowSubjectModal(true);
  };

  const handleSubjectSubmit = async (e) => {
    e.preventDefault();
    if (!subjectForm.name.trim()) return alert('Vui lòng nhập tên Lớp!');
    const payload = {
      name: subjectForm.name.trim(),
      slug: subjectForm.slug.trim() || toVietnameseSlug(subjectForm.name),
      grade: Number(subjectForm.grade),
      order_index: Number(subjectForm.orderIndex)
    };
    try {
      if (subjectForm.id) {
        await adminApi.updateSubject(subjectForm.id, payload);
        alert('Cập nhật Lớp thành công!');
      } else {
        await adminApi.createSubject(payload);
        alert('Tạo Lớp thành công!');
      }
      setShowSubjectModal(false);
      loadSubjects();
    } catch (err) {
      alert('Lỗi: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleDeleteSubject = async (subjId) => {
    const ok = await confirm('Bạn có chắc chắn muốn xóa Lớp này? Mọi bài học, chuyên đề, tài liệu, và bài kiểm tra thuộc lớp này cũng sẽ bị xóa!');
    if (!ok) return;
    try {
      await adminApi.deleteSubject(subjId);
      alert('Xóa Lớp thành công!');
      if (selectedSubjectId === subjId.toString()) {
        setSelectedSubjectId('');
      }
      loadSubjects();
    } catch (err) {
      alert('Lỗi xóa Lớp: ' + (err.response?.data?.message || err.message));
    }
  };

  // ----------------------------------------------------------------
  // 3. Chapter (Bài học) Actions
  // ----------------------------------------------------------------
  const handleOpenChapterModal = (chap = null) => {
    if (chap) {
      setChapterForm({ id: chap.id, name: chap.name, slug: chap.slug, orderIndex: chap.order_index, subjectId: selectedSubjectId });
    } else {
      setChapterForm({ id: null, name: '', slug: '', orderIndex: chapters.length + 1, subjectId: selectedSubjectId });
    }
    setShowChapterModal(true);
  };

  const handleChapterSubmit = async (e) => {
    e.preventDefault();
    if (!chapterForm.name.trim()) return alert('Vui lòng nhập tên Bài học!');
    const payload = {
      subject_id: Number(selectedSubjectId),
      name: chapterForm.name.trim(),
      slug: chapterForm.slug.trim() || toVietnameseSlug(chapterForm.name),
      order_index: Number(chapterForm.orderIndex)
    };
    try {
      if (chapterForm.id) {
        await adminApi.updateChapter(chapterForm.id, payload);
        alert('Cập nhật Bài học thành công!');
      } else {
        await adminApi.createChapter(payload);
        alert('Thêm Bài học mới thành công!');
      }
      setShowChapterModal(false);
      loadChaptersAndLessons(selectedSubjectId);
    } catch (err) {
      alert('Lỗi: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleDeleteChapter = async (chapId) => {
    const ok = await confirm('Bạn có chắc chắn muốn xóa Bài học này? Tất cả các chuyên đề và tài liệu, bài tập bên trong sẽ bị xóa!');
    if (!ok) return;
    try {
      await adminApi.deleteChapter(chapId);
      alert('Xóa Bài học thành công!');
      loadChaptersAndLessons(selectedSubjectId);
    } catch (err) {
      alert('Lỗi: ' + (err.response?.data?.message || err.message));
    }
  };

  // ----------------------------------------------------------------
  // 4. Lesson (Chuyên đề) Actions
  // ----------------------------------------------------------------
  const handleOpenLessonModal = (chapId, les = null) => {
    const siblingCount = lessonsMap[chapId]?.length || 0;
    if (les) {
      setLessonForm({
        id: les.id,
        title: les.title,
        slug: les.slug,
        content: les.content || '',
        isVip: les.is_vip || false,
        pointsRequired: les.points_required || 0,
        orderIndex: les.order_index || 0,
        chapterId: chapId
      });
    } else {
      setLessonForm({
        id: null,
        title: '',
        slug: '',
        content: '',
        isVip: false,
        pointsRequired: 0,
        orderIndex: siblingCount + 1,
        chapterId: chapId
      });
    }
    setShowLessonModal(true);
  };

  const handleLessonSubmit = async (e) => {
    e.preventDefault();
    if (!lessonForm.title.trim()) return alert('Vui lòng nhập tên Chuyên đề!');
    const payload = {
      chapter_id: Number(lessonForm.chapterId),
      title: lessonForm.title.trim(),
      slug: lessonForm.slug.trim() || toVietnameseSlug(lessonForm.title),
      content: lessonForm.content.trim(),
      is_vip: lessonForm.isVip,
      points_required: Number(lessonForm.pointsRequired),
      order_index: Number(lessonForm.orderIndex),
      pdf_url: null
    };
    try {
      if (lessonForm.id) {
        await adminApi.updateLesson(lessonForm.id, payload);
        alert('Cập nhật Chuyên đề thành công!');
      } else {
        await adminApi.createLesson(payload);
        alert('Thêm Chuyên đề thành công!');
      }
      setShowLessonModal(false);
      loadChaptersAndLessons(selectedSubjectId);
    } catch (err) {
      alert('Lỗi: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleDeleteLesson = async (lesId) => {
    const ok = await confirm('Bạn có chắc chắn muốn xóa Chuyên đề này?');
    if (!ok) return;
    try {
      await adminApi.deleteLesson(lesId);
      alert('Xóa Chuyên đề thành công!');
      loadChaptersAndLessons(selectedSubjectId);
    } catch (err) {
      alert('Lỗi: ' + (err.response?.data?.message || err.message));
    }
  };

  // ----------------------------------------------------------------
  // 5. Level 4 Detail Modal (Study Materials & Exams Manager)
  // ----------------------------------------------------------------
  const handleOpenDetailModal = (les) => {
    setSelectedLesson(les);
    setShowDetailModal(true);
    loadLessonDetails(les.id);
  };

  const loadLessonDetails = async (lesId) => {
    setLoadingDetails(true);
    try {
      const [matRes, examRes] = await Promise.all([
        getStudyMaterials(lesId),
        getExams({ lesson_id: lesId })
      ]);
      setMaterials(matRes.data?.materials || matRes.data || []);
      setExams(examRes.data?.exams || examRes.data || []);
    } catch (err) {
      console.error('Lỗi tải chi tiết chuyên đề:', err);
    } finally {
      setLoadingDetails(false);
    }
  };

  // Upload PDF handler
  const handleUploadPdf = async (e, isEdit = false) => {
    const file = e.target.files[0];
    if (!file) return;
    const form = new FormData();
    form.append('file', file);
    setUploadingPdf(true);
    try {
      const res = await client.post('/admin/upload', form, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (res.data?.fileUrl) {
        if (isEdit) {
          setEditingMaterial(prev => ({ ...prev, pdf_url: res.data.fileUrl }));
        } else {
          setMaterialForm(prev => ({ ...prev, pdfUrl: res.data.fileUrl }));
        }
        alert('Tải lên tệp thành công!');
      }
    } catch (err) {
      alert('Lỗi tải lên: ' + (err.response?.data?.message || err.message));
    } finally {
      setUploadingPdf(false);
    }
  };

  // Material CRUD Submit
  const handleMaterialSubmit = async (e) => {
    e.preventDefault();
    const active = editingMaterial || materialForm;
    if (!active.title.trim()) return alert('Tiêu đề tài liệu không được để trống!');
    
    const payload = {
      lesson_id: selectedLesson.id,
      title: active.title.trim(),
      slug: toVietnameseSlug(active.title),
      content: active.content.trim(),
      is_vip: active.isVip || active.is_vip || false,
      points_required: Number(active.pointsRequired || active.points_required || 0),
      order_index: 0,
      pdf_url: (active.pdfUrl || active.pdf_url || '').trim() || null,
      video_url: (active.videoUrl || active.video_url || '').trim() || null
    };

    try {
      if (editingMaterial) {
        await adminApi.updateStudyMaterial(editingMaterial.id, payload);
        alert('Cập nhật tài liệu thành công!');
        setEditingMaterial(null);
      } else {
        await adminApi.createStudyMaterial(payload);
        alert('Thêm tài liệu thành công!');
        setShowAddMaterial(false);
        setMaterialForm({ title: '', content: '', isVip: false, pointsRequired: 0, pdfUrl: '', videoUrl: '' });
      }
      loadLessonDetails(selectedLesson.id);
    } catch (err) {
      alert('Lỗi lưu tài liệu: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleDeleteMaterial = async (matId) => {
    const ok = await confirm('Bạn có chắc chắn muốn xóa tài liệu lý thuyết này?');
    if (!ok) return;
    try {
      await adminApi.deleteStudyMaterial(matId);
      alert('Xóa tài liệu thành công!');
      loadLessonDetails(selectedLesson.id);
    } catch (err) {
      alert('Lỗi: ' + (err.response?.data?.message || err.message));
    }
  };

  // Exam CRUD Submit (Always parsing docx)
  const handleExamSubmit = async (e) => {
    e.preventDefault();
    const active = editingExam || examForm;
    if (!active.title.trim()) return alert('Vui lòng nhập tiêu đề đề thi!');

    setIsImporting(true);
    try {
      if (editingExam) {
        // Simple update metadata
        await adminApi.updateExam(editingExam.id, {
          title: active.title.trim(),
          description: active.description || '',
          subject_id: selectedLesson.subject_id || Number(selectedSubjectId),
          lesson_id: selectedLesson.id,
          time_limit_minutes: Number(active.timeLimit || active.time_limit_minutes || 45),
          difficulty: active.difficulty || 'medium',
          points_rewarded: Number(active.pointsRewarded || active.points_rewarded || 50),
          question_ids: active.question_ids || []
        });
        alert('Cập nhật thông tin đề thi thành công!');
        setEditingExam(null);
      } else {
        // Create new Exam (Extract Word client-side)
        if (!importFile) {
          alert('Vui lòng chọn tệp Word (.docx) chứa danh sách câu hỏi đề thi!');
          setIsImporting(false);
          return;
        }

        // Extract questions
        let rawExtracted = [];
        try {
          rawExtracted = await extractQuestionsFromDocx(importFile);
        } catch (parseErr) {
          alert('Lỗi đọc file Word: ' + parseErr.message);
          setIsImporting(false);
          return;
        }

        if (rawExtracted.length === 0) {
          alert('Không tìm thấy câu hỏi nào trong file Word!');
          setIsImporting(false);
          return;
        }

        // Map to structured question payload format
        const mappedQuestions = rawExtracted.map(eq => {
          if (eq.section === 'I') {
            return {
              questionText: eq.qtext,
              questionType: 'single_choice',
              difficulty: active.difficulty || 'medium',
              explanation: eq.solution.join('\n'),
              points: 10,
              options: (eq.choices && eq.choices.length > 0)
                ? eq.choices.map(c => ({
                    key: c.key,
                    option_text: c.text,
                    is_correct: eq.answer?.val === c.key,
                    option_value: ''
                  }))
                : [
                    { key: 'A', option_text: '', is_correct: false, option_value: '' },
                    { key: 'B', option_text: '', is_correct: false, option_value: '' },
                    { key: 'C', option_text: '', is_correct: false, option_value: '' },
                    { key: 'D', option_text: '', is_correct: false, option_value: '' },
                  ]
            };
          } else if (eq.section === 'II') {
            const subQs = [];
            if (eq.tfStatements && eq.tfStatements.length > 0) {
              eq.tfStatements.forEach((stmt, idx) => {
                const ansVal = eq.answer?.vals?.[idx] || 'Đ';
                subQs.push({
                  questionText: `${eq.qtext}\n\n*) Phát biểu: ${stmt.key}) ${stmt.text}`,
                  questionType: 'single_choice',
                  difficulty: active.difficulty || 'medium',
                  explanation: eq.solution.join('\n'),
                  points: 10,
                  options: [
                    { key: 'A', option_text: 'Đúng', is_correct: ansVal === 'Đ', option_value: '' },
                    { key: 'B', option_text: 'Sai', is_correct: ansVal === 'S', option_value: '' }
                  ]
                });
              });
            }
            return subQs;
          } else {
            return {
              questionText: eq.qtext,
              questionType: 'input_number',
              difficulty: active.difficulty || 'medium',
              explanation: eq.solution.join('\n'),
              points: 10,
              options: [
                { key: 'ANSWER', option_text: 'Đáp án đúng', is_correct: true, option_value: (eq.answer?.val || '').trim() }
              ]
            };
          }
        }).flat();

        // Save questions to backend
        const createdIds = [];
        for (let i = 0; i < mappedQuestions.length; i++) {
          const q = mappedQuestions[i];
          
          let opts = [];
          if (q.questionType === 'single_choice') {
            opts = q.options.map(o => ({
              key: o.key,
              option_text: o.option_text || `Đáp án ${o.key}`,
              is_correct: o.is_correct,
              option_value: ''
            }));
          } else {
            opts = [{
              key: 'ANSWER',
              option_text: 'Đáp án đúng',
              is_correct: true,
              option_value: (q.options[0]?.option_value || '').trim()
            }];
          }

          const qRes = await adminApi.createQuestion({
            chapter_id: selectedLesson.chapter_id,
            question_text: q.questionText,
            question_type: q.questionType,
            difficulty: q.difficulty,
            explanation: q.explanation,
            points: Number(q.points || 10),
            options: opts
          });

          if (qRes.data?.success && qRes.data?.id) {
            createdIds.push(qRes.data.id);
          }
        }

        // Create the Exam
        await adminApi.createExam({
          title: active.title.trim(),
          description: active.description?.trim() || null,
          subject_id: selectedLesson.subject_id || Number(selectedSubjectId),
          lesson_id: selectedLesson.id,
          time_limit_minutes: Number(active.timeLimit || 45),
          difficulty: active.difficulty || 'medium',
          points_rewarded: Number(active.pointsRewarded || 50),
          question_ids: createdIds
        });

        alert(`Đã trích xuất ${createdIds.length} câu hỏi và tự động tạo đề thi "${active.title}" thành công!`);
        setShowAddExam(false);
        setExamForm({ title: '', description: '', timeLimit: 45, pointsRewarded: 50, difficulty: 'medium' });
        setImportFile(null);
      }
      loadLessonDetails(selectedLesson.id);
    } catch (err) {
      alert('Lỗi lưu đề thi: ' + (err.response?.data?.message || err.message));
    } finally {
      setIsImporting(false);
    }
  };

  const handleDeleteExam = async (examId) => {
    const ok = await confirm('Bạn có chắc chắn muốn xóa đề thi này? Các câu hỏi của đề thi cũng sẽ bị xóa khỏi hệ thống.');
    if (!ok) return;
    try {
      await adminApi.deleteExam(examId);
      alert('Xóa đề thi thành công!');
      loadLessonDetails(selectedLesson.id);
    } catch (err) {
      alert('Lỗi: ' + (err.response?.data?.message || err.message));
    }
  };

  // ----------------------------------------------------------------
  // Helper to render class pills
  // ----------------------------------------------------------------
  const currentSubjectObj = subjects.find(s => s.id.toString() === selectedSubjectId);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      
      {/* LEVEL 1: CLASS SELECTION ROW */}
      <div style={{
        background: '#fff', borderRadius: 16, padding: '20px 24px',
        boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -1px rgba(0,0,0,0.03)',
        display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 16
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          {subjects.map(s => {
            const isSelected = s.id.toString() === selectedSubjectId;
            return (
              <button
                key={s.id}
                onClick={() => setSelectedSubjectId(s.id.toString())}
                style={{
                  padding: '10px 20px',
                  borderRadius: 12,
                  fontSize: '0.9rem',
                  fontWeight: 700,
                  border: isSelected ? '2px solid var(--primary)' : '1px solid #e2e8f0',
                  background: isSelected ? '#e6f2f0' : '#fff',
                  color: isSelected ? 'var(--primary)' : '#475569',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: isSelected ? '0 4px 12px rgba(10,186,115,0.1)' : 'none'
                }}
              >
                Lớp {s.grade}
              </button>
            );
          })}
          
          <button 
            onClick={() => handleOpenSubjectModal()}
            style={{
              padding: '10px 16px',
              borderRadius: 12,
              fontSize: '0.85rem',
              fontWeight: 700,
              border: '1px dashed var(--primary)',
              background: '#fff',
              color: 'var(--primary)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6
            }}
          >
            <Plus size={16} /> Thêm Lớp mới
          </button>
        </div>

        {currentSubjectObj && (
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={() => handleOpenSubjectModal(currentSubjectObj)}
              style={{
                background: '#f1f5f9', border: 'none', borderRadius: 10,
                color: '#475569', padding: '8px 14px', fontSize: '0.85rem',
                fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6
              }}
            >
              <Edit size={14} /> Sửa Lớp hiện tại
            </button>
            <button
              onClick={() => handleDeleteSubject(currentSubjectObj.id)}
              style={{
                background: 'var(--danger-light)', border: 'none', borderRadius: 10,
                color: 'var(--danger)', padding: '8px 14px', fontSize: '0.85rem',
                fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6
              }}
            >
              <Trash2 size={14} /> Xóa Lớp
            </button>
          </div>
        )}
      </div>

      {/* LEVEL 2: CHAPTERS CONTAINER */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 850, color: '#1e293b', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
            <BookOpen size={22} color="var(--primary)" /> Danh sách Bài học của {currentSubjectObj?.name || 'lớp đã chọn'}
          </h2>
          {selectedSubjectId && (
            <button
              onClick={() => handleOpenChapterModal()}
              className="btn btn-primary"
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 16px', borderRadius: 12 }}
            >
              <Plus size={16} /> Thêm Bài học mới
            </button>
          )}
        </div>

        {!selectedSubjectId ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', background: '#fff', borderRadius: 16, border: '1px dashed #cbd5e1', color: 'var(--text-muted)' }}>
            Vui lòng chọn hoặc tạo một Lớp để quản lý nội dung.
          </div>
        ) : loading ? (
          <div className="page-loading" style={{ padding: '60px 0' }}><div className="spinner" /></div>
        ) : chapters.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', background: '#fff', borderRadius: 16, border: '1px dashed #cbd5e1', color: 'var(--text-muted)' }}>
            Chưa có bài học nào được tạo trong Lớp này. Hãy nhấn "Thêm Bài học mới" ở trên để bắt đầu!
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {chapters.map(chap => {
              const lessonsList = lessonsMap[chap.id] || [];
              return (
                <div 
                  key={chap.id}
                  style={{
                    background: '#fff',
                    borderRadius: 16,
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02), 0 2px 4px -1px rgba(0,0,0,0.01)',
                    overflow: 'hidden'
                  }}
                >
                  {/* Chapter Header */}
                  <div style={{
                    background: '#f8fafc',
                    padding: '16px 24px',
                    borderBottom: '1px solid #e2e8f0',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: 12
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <Folder size={20} color="var(--primary)" />
                      <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#1e293b', margin: 0 }}>
                        {chap.name} <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 500 }}>(Thứ tự: {chap.order_index})</span>
                      </h3>
                    </div>
                    
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button
                        onClick={() => handleOpenChapterModal(chap)}
                        className="btn-icon"
                        style={{ background: '#fff', border: '1px solid #e2e8f0', color: '#64748b' }}
                        title="Sửa Bài học"
                      >
                        <Edit size={14} />
                      </button>
                      <button
                        onClick={() => handleDeleteChapter(chap.id)}
                        className="btn-icon"
                        style={{ background: 'var(--danger-light)', color: 'var(--danger)' }}
                        title="Xóa Bài học"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  {/* Chapter Body: LEVEL 3: LESSONS LIST */}
                  <div style={{ padding: 20 }}>
                    {lessonsList.length === 0 ? (
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textAlign: 'center', padding: '20px 0' }}>
                        Chưa có chuyên đề nào thuộc bài học này. Click nút phía dưới để thêm chuyên đề con.
                      </div>
                    ) : (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 320px), 1fr))', gap: 14 }}>
                        {lessonsList.map(les => (
                          <div 
                            key={les.id}
                            style={{
                              border: '1px solid #e2e8f0',
                              borderRadius: 12,
                              padding: 16,
                              display: 'flex',
                              flexDirection: 'column',
                              justifyContent: 'space-between',
                              background: '#fff',
                              transition: 'all 0.2s',
                              boxShadow: '0 1px 3px rgba(0,0,0,0.01)'
                            }}
                          >
                            <div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--primary)', background: '#e6f2f0', padding: '2px 8px', borderRadius: 6 }}>
                                  Thứ tự: {les.order_index}
                                </span>
                                {les.is_vip && (
                                  <span style={{ fontSize: '0.7rem', fontWeight: 900, background: 'var(--warning-light)', color: 'var(--warning)', padding: '2px 8px', borderRadius: 4 }}>
                                    VIP ({les.points_required}đ)
                                  </span>
                                )}
                              </div>
                              <h4 style={{ fontSize: '0.925rem', fontWeight: 800, color: '#1e293b', margin: '0 0 10px', lineHeight: 1.4 }}>
                                {les.title}
                              </h4>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, paddingTop: 12, borderTop: '1px dashed #e2e8f0' }}>
                              <div style={{ display: 'flex', gap: 6 }}>
                                <button
                                  onClick={() => handleOpenLessonModal(chap.id, les)}
                                  className="btn-icon"
                                  style={{ width: 28, height: 28, background: '#f8fafc', color: '#64748b', border: '1px solid #e2e8f0' }}
                                >
                                  <Edit size={12} />
                                </button>
                                <button
                                  onClick={() => handleDeleteLesson(les.id)}
                                  className="btn-icon"
                                  style={{ width: 28, height: 28, background: 'var(--danger-light)', color: 'var(--danger)' }}
                                >
                                  <Trash2 size={12} />
                                </button>
                              </div>
                              
                              <button
                                onClick={() => handleOpenDetailModal(les)}
                                style={{
                                  fontSize: '0.8rem',
                                  fontWeight: 800,
                                  color: 'var(--primary)',
                                  background: '#e6f2f0',
                                  border: 'none',
                                  borderRadius: 8,
                                  padding: '6px 12px',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 4
                                }}
                              >
                                Quản lý nội dung <ChevronRight size={14} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Chapter Footer: Add Lesson button */}
                  <div style={{
                    padding: '12px 24px',
                    background: '#fafafa',
                    borderTop: '1px solid #f1f5f9',
                    display: 'flex',
                    justifyContent: 'flex-end'
                  }}>
                    <button
                      onClick={() => handleOpenLessonModal(chap.id)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--primary)',
                        fontWeight: 800,
                        fontSize: '0.85rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6
                      }}
                    >
                      <Plus size={14} /> Thêm chuyên đề con
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ---------------------------------------------------------------- */}
      {/* MODAL 1: CREATE/EDIT SUBJECT */}
      {/* ---------------------------------------------------------------- */}
      {showSubjectModal && (
        <div style={{ position: 'fixed', top:0, left:0, right:0, bottom:0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div style={{ background: '#fff', borderRadius: 20, width: '100%', maxWidth: 450, padding: 24, boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ margin:0, fontSize: '1.2rem', fontWeight: 900, color: '#1e293b' }}>
                {subjectForm.id ? 'Cập nhật Lớp học' : 'Thêm Lớp học mới'}
              </h3>
              <button onClick={() => setShowSubjectModal(false)} style={{ background:'none', border:'none', cursor:'pointer', color:'#64748b' }}><X size={20}/></button>
            </div>
            <form onSubmit={handleSubjectSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="form-group">
                <label className="form-label">Tên Lớp (Môn học)</label>
                <input 
                  className="form-control" required placeholder="Ví dụ: Toán Lớp 10" 
                  value={subjectForm.name} onChange={e => setSubjectForm(p => ({...p, name: e.target.value}))}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Khối lớp (Số)</label>
                <input 
                  type="number" className="form-control" required placeholder="Ví dụ: 10"
                  value={subjectForm.grade} onChange={e => setSubjectForm(p => ({...p, grade: Number(e.target.value)}))}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Thứ tự hiển thị</label>
                <input 
                  type="number" className="form-control" required
                  value={subjectForm.orderIndex} onChange={e => setSubjectForm(p => ({...p, orderIndex: Number(e.target.value)}))}
                />
              </div>
              <div style={{ display:'flex', justifyContent:'flex-end', gap:12, marginTop: 8 }}>
                <button type="button" className="btn btn-outline" onClick={() => setShowSubjectModal(false)}>Hủy</button>
                <button type="submit" className="btn btn-primary">Lưu</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------------------- */}
      {/* MODAL 2: CREATE/EDIT CHAPTER */}
      {/* ---------------------------------------------------------------- */}
      {showChapterModal && (
        <div style={{ position: 'fixed', top:0, left:0, right:0, bottom:0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div style={{ background: '#fff', borderRadius: 20, width: '100%', maxWidth: 450, padding: 24, boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ margin:0, fontSize: '1.2rem', fontWeight: 900, color: '#1e293b' }}>
                {chapterForm.id ? 'Sửa tên Bài học' : 'Thêm Bài học mới'}
              </h3>
              <button onClick={() => setShowChapterModal(false)} style={{ background:'none', border:'none', cursor:'pointer', color:'#64748b' }}><X size={20}/></button>
            </div>
            <form onSubmit={handleChapterSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="form-group">
                <label className="form-label">Tên Bài học</label>
                <input 
                  className="form-control" required placeholder="Ví dụ: Đại số tổ hợp" 
                  value={chapterForm.name} onChange={e => setChapterForm(p => ({...p, name: e.target.value}))}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Thứ tự hiển thị</label>
                <input 
                  type="number" className="form-control" required
                  value={chapterForm.orderIndex} onChange={e => setChapterForm(p => ({...p, orderIndex: Number(e.target.value)}))}
                />
              </div>
              <div style={{ display:'flex', justifyContent:'flex-end', gap:12, marginTop: 8 }}>
                <button type="button" className="btn btn-outline" onClick={() => setShowChapterModal(false)}>Hủy</button>
                <button type="submit" className="btn btn-primary">Lưu</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------------------- */}
      {/* MODAL 3: CREATE/EDIT LESSON */}
      {/* ---------------------------------------------------------------- */}
      {showLessonModal && (
        <div style={{ position: 'fixed', top:0, left:0, right:0, bottom:0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div style={{ background: '#fff', borderRadius: 20, width: '100%', maxWidth: 550, padding: 24, boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ margin:0, fontSize: '1.2rem', fontWeight: 900, color: '#1e293b' }}>
                {lessonForm.id ? 'Sửa Chuyên đề' : 'Thêm Chuyên đề mới'}
              </h3>
              <button onClick={() => setShowLessonModal(false)} style={{ background:'none', border:'none', cursor:'pointer', color:'#64748b' }}><X size={20}/></button>
            </div>
            <form onSubmit={handleLessonSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 12 }}>
                <div className="form-group">
                  <label className="form-label">Tiêu đề Chuyên đề</label>
                  <input 
                    className="form-control" required placeholder="Ví dụ: Quy tắc cộng và quy tắc nhân" 
                    value={lessonForm.title} onChange={e => setLessonForm(p => ({...p, title: e.target.value}))}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Thứ tự hiển thị</label>
                  <input 
                    type="number" className="form-control" required
                    value={lessonForm.orderIndex} onChange={e => setLessonForm(p => ({...p, orderIndex: Number(e.target.value)}))}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Mô tả tóm tắt Chuyên đề</label>
                <textarea 
                  className="form-control" rows={4} placeholder="Nhập giới thiệu ngắn hoặc chỉ dẫn tự học..." 
                  value={lessonForm.content} onChange={e => setLessonForm(p => ({...p, content: e.target.value}))}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 24, background: '#f8fafc', padding: 12, borderRadius: 12 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700, cursor: 'pointer', margin: 0 }}>
                  <input 
                    type="checkbox" checked={lessonForm.isVip}
                    onChange={e => setLessonForm(p => ({...p, isVip: e.target.checked}))}
                  />
                  Yêu cầu VIP để truy cập
                </label>
                {lessonForm.isVip && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Điểm mở khóa:</span>
                    <input 
                      type="number" className="form-control" style={{ width: 80, padding: '4px 8px' }}
                      value={lessonForm.pointsRequired} onChange={e => setLessonForm(p => ({ ...p, pointsRequired: Number(e.target.value) }))}
                    />
                  </div>
                )}
              </div>

              <div style={{ display:'flex', justifyContent:'flex-end', gap:12, marginTop: 8 }}>
                <button type="button" className="btn btn-outline" onClick={() => setShowLessonModal(false)}>Hủy</button>
                <button type="submit" className="btn btn-primary">Lưu</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------------------- */}
      {/* MODAL 4: DETAIL CONTENT MANAGER (MATERIALS & EXAMS) */}
      {/* ---------------------------------------------------------------- */}
      {showDetailModal && selectedLesson && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(15,23,42,0.65)', display: 'flex',
          alignItems: 'center', justifyContent: 'center', zIndex: 999
        }}>
          <div style={{
            background: '#fff', borderRadius: 24, width: '95vw', maxWidth: 1200,
            padding: 32, boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
            height: '90vh', display: 'flex', flexDirection: 'column'
          }}>
            
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #cbd5e1', paddingBottom: 16, marginBottom: 20 }}>
              <div>
                <span style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 800, textTransform: 'uppercase' }}>Quản lý chi tiết nội dung</span>
                <h3 style={{ margin: '4px 0 0', fontSize: '1.25rem', fontWeight: 900, color: '#0f172a' }}>
                  {selectedLesson.title}
                </h3>
              </div>
              <button 
                onClick={() => {
                  setShowDetailModal(false);
                  setShowAddMaterial(false);
                  setEditingMaterial(null);
                  setShowAddExam(false);
                  setEditingExam(null);
                  loadChaptersAndLessons(selectedSubjectId);
                }} 
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}
              >
                <X size={24} />
              </button>
            </div>

            {/* Content Columns split */}
            {loadingDetails ? (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
                <Loader className="spinner" size={32} />
                <span style={{ marginTop: 12, color: 'var(--text-muted)', fontWeight: 600 }}>Đang tải tài nguyên chuyên đề...</span>
              </div>
            ) : (
              <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32, overflowY: 'auto', paddingRight: 4 }}>
                
                {/* COLUMN 1: STUDY MATERIALS */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16, borderRight: '1px solid #f1f5f9', paddingRight: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 900, color: '#1e293b', display: 'flex', alignItems: 'center', gap: 8 }}>
                      📚 Tài liệu lý thuyết ({materials.length})
                    </h4>
                    {!showAddMaterial && !editingMaterial && (
                      <button 
                        onClick={() => {
                          setMaterialForm({ title: '', content: '', isVip: false, pointsRequired: 0, pdfUrl: '', videoUrl: '' });
                          setShowAddMaterial(true);
                        }}
                        style={{
                          fontSize: '0.75rem', fontWeight: 800, padding: '6px 12px',
                          color: 'var(--primary)', background: '#e6f2f0', border: 'none', borderRadius: 8, cursor: 'pointer'
                        }}
                      >
                        <Plus size={14} /> Thêm tài liệu
                      </button>
                    )}
                  </div>

                  {/* Add / Edit Material Form */}
                  {(showAddMaterial || editingMaterial) ? (
                    <div style={{ background: '#f8fafc', padding: 20, borderRadius: 16, border: '1px solid #e2e8f0' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                        <h5 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 800, color: '#1e293b' }}>
                          {editingMaterial ? 'Sửa tài liệu học tập' : 'Tạo mới tài liệu học tập'}
                        </h5>
                        <button 
                          onClick={() => { setShowAddMaterial(false); setEditingMaterial(null); }}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', fontSize: '0.75rem', fontWeight: 700 }}
                        >
                          Đóng form
                        </button>
                      </div>

                      <form onSubmit={handleMaterialSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        <div className="form-group">
                          <label className="form-label" style={{ fontSize: '0.8rem' }}>Tiêu đề tài liệu</label>
                          <input 
                            className="form-control" required style={{ height: 36, fontSize: '0.85rem' }}
                            value={editingMaterial ? editingMaterial.title : materialForm.title}
                            onChange={e => {
                              const title = e.target.value;
                              if (editingMaterial) setEditingMaterial(p => ({ ...p, title }));
                              else setMaterialForm(p => ({ ...p, title }));
                            }}
                          />
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                          <div className="form-group">
                            <label className="form-label" style={{ fontSize: '0.8rem' }}>Tệp PDF đính kèm</label>
                            <input 
                              type="file" accept="application/pdf" id="pdf-file-level4" style={{ display: 'none' }}
                              onChange={e => handleUploadPdf(e, !!editingMaterial)}
                            />
                            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                              <label htmlFor="pdf-file-level4" style={{
                                background: '#fff', border: '1px solid #cbd5e1', cursor: 'pointer',
                                padding: '6px 10px', borderRadius: 8, fontSize: '0.75rem', fontWeight: 700
                              }}>Tải lên</label>
                              {uploadingPdf && <span style={{ fontSize: '0.7rem', color: 'var(--primary)' }}>Đang lưu...</span>}
                              {(editingMaterial?.pdf_url || materialForm.pdfUrl) && !uploadingPdf && (
                                <span style={{ fontSize: '0.7rem', color: '#16a34a', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis', maxWidth: 100 }}>
                                  ✓ Đã có
                                </span>
                              )}
                            </div>
                            <input 
                              className="form-control" placeholder="Đường dẫn PDF..." style={{ height: 32, fontSize: '0.75rem', marginTop: 4 }}
                              value={editingMaterial ? (editingMaterial.pdf_url || '') : materialForm.pdfUrl}
                              onChange={e => {
                                const val = e.target.value;
                                if (editingMaterial) setEditingMaterial(p => ({ ...p, pdf_url: val }));
                                else setMaterialForm(p => ({ ...p, pdfUrl: val }));
                              }}
                            />
                          </div>

                          <div className="form-group">
                            <label className="form-label" style={{ fontSize: '0.8rem' }}>Đường dẫn Video giảng</label>
                            <input 
                              className="form-control" placeholder="Youtube URL..." style={{ height: 36, fontSize: '0.85rem' }}
                              value={editingMaterial ? (editingMaterial.video_url || '') : materialForm.videoUrl}
                              onChange={e => {
                                const val = e.target.value;
                                if (editingMaterial) setEditingMaterial(p => ({ ...p, video_url: val }));
                                else setMaterialForm(p => ({ ...p, videoUrl: val }));
                              }}
                            />
                          </div>
                        </div>

                        <div className="form-group">
                          <label className="form-label" style={{ fontSize: '0.8rem' }}>Nội dung chi tiết</label>
                          <textarea 
                            className="form-control" required rows={4} style={{ fontSize: '0.85rem' }}
                            value={editingMaterial ? editingMaterial.content : materialForm.content}
                            onChange={e => {
                              const content = e.target.value;
                              if (editingMaterial) setEditingMaterial(p => ({ ...p, content }));
                              else setMaterialForm(p => ({ ...p, content }));
                            }}
                          />
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: 16, background: '#fff', padding: 10, borderRadius: 10, border: '1px solid #e2e8f0' }}>
                          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer', margin: 0 }}>
                            <input 
                              type="checkbox" 
                              checked={editingMaterial ? (editingMaterial.is_vip || false) : materialForm.isVip}
                              onChange={e => {
                                const checked = e.target.checked;
                                if (editingMaterial) setEditingMaterial(p => ({ ...p, is_vip: checked }));
                                else setMaterialForm(p => ({ ...p, isVip: checked }));
                              }}
                            />
                            Tài liệu VIP
                          </label>
                          {(editingMaterial?.is_vip || materialForm.isVip) && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <span style={{ fontSize: '0.75rem' }}>Điểm tải:</span>
                              <input 
                                type="number" className="form-control" style={{ width: 60, height: 26, padding: 4, fontSize: '0.75rem' }}
                                value={editingMaterial ? (editingMaterial.points_required || 0) : materialForm.pointsRequired}
                                onChange={e => {
                                  const val = Number(e.target.value);
                                  if (editingMaterial) setEditingMaterial(p => ({ ...p, points_required: val }));
                                  else setMaterialForm(p => ({ ...p, pointsRequired: val }));
                                }}
                              />
                            </div>
                          )}
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 6 }}>
                          <button type="submit" className="btn btn-primary btn-sm" style={{ padding: '6px 12px', fontSize: '0.8rem' }}>
                            Lưu tài liệu
                          </button>
                        </div>
                      </form>
                    </div>
                  ) : null}

                  {/* List Materials */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {materials.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                        Chưa có tài liệu học tập nào trong chuyên đề này.
                      </div>
                    ) : (
                      materials.map(mat => (
                        <div 
                          key={mat.id}
                          style={{
                            border: '1px solid #e2e8f0', borderRadius: 12, padding: 14,
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                            background: '#fff'
                          }}
                        >
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <span style={{ fontWeight: 800, color: '#1e293b', fontSize: '0.875rem' }}>{mat.title}</span>
                              {mat.is_vip && (
                                <span style={{ background: 'var(--warning-light)', color: 'var(--warning)', fontSize: '0.65rem', fontWeight: 900, padding: '1px 6px', borderRadius: 4 }}>
                                  VIP
                                </span>
                              )}
                            </div>
                            <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                              {mat.pdf_url && <span style={{ fontSize: '0.7rem', color: '#0ea5e9', fontWeight: 600 }}>📄 PDF</span>}
                              {mat.video_url && <span style={{ fontSize: '0.7rem', color: '#ef4444', fontWeight: 600 }}>🎥 Video</span>}
                            </div>
                          </div>

                          <div style={{ display: 'flex', gap: 4 }}>
                            <button
                              onClick={() => setEditingMaterial(mat)}
                              className="btn-icon"
                              style={{ width: 26, height: 26, color: 'var(--primary)' }}
                            >
                              <Edit size={12} />
                            </button>
                            <button
                              onClick={() => handleDeleteMaterial(mat.id)}
                              className="btn-icon"
                              style={{ width: 26, height: 26, color: 'var(--danger)' }}
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* COLUMN 2: EXAMS */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 900, color: '#1e293b', display: 'flex', alignItems: 'center', gap: 8 }}>
                      ✍️ Đề thi & kiểm tra ({exams.length})
                    </h4>
                    {!showAddExam && !editingExam && (
                      <button 
                        onClick={() => {
                          setExamForm({ title: '', description: '', timeLimit: 45, pointsRewarded: 50, difficulty: 'medium' });
                          setImportFile(null);
                          setShowAddExam(true);
                        }}
                        style={{
                          fontSize: '0.75rem', fontWeight: 800, padding: '6px 12px',
                          color: 'var(--primary)', background: '#e6f2f0', border: 'none', borderRadius: 8, cursor: 'pointer'
                        }}
                      >
                        <Plus size={14} /> Thêm đề thi
                      </button>
                    )}
                  </div>

                  {/* Add / Edit Exam Form */}
                  {(showAddExam || editingExam) ? (
                    <div style={{ background: '#f8fafc', padding: 20, borderRadius: 16, border: '1px solid #e2e8f0' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                        <h5 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 800, color: '#1e293b' }}>
                          {editingExam ? 'Sửa thông tin đề thi' : 'Tạo đề thi mới (Nhập từ Word)'}
                        </h5>
                        <button 
                          onClick={() => { setShowAddExam(false); setEditingExam(null); }}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', fontSize: '0.75rem', fontWeight: 700 }}
                        >
                          Đóng form
                        </button>
                      </div>

                      <form onSubmit={handleExamSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        <div className="form-group">
                          <label className="form-label" style={{ fontSize: '0.8rem' }}>Tiêu đề đề thi</label>
                          <input 
                            className="form-control" required style={{ height: 36, fontSize: '0.85rem' }}
                            value={editingExam ? editingExam.title : examForm.title}
                            onChange={e => {
                              const title = e.target.value;
                              if (editingExam) setEditingExam(p => ({ ...p, title }));
                              else setExamForm(p => ({ ...p, title }));
                            }}
                          />
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                          <div className="form-group">
                            <label className="form-label" style={{ fontSize: '0.8rem' }}>Thời gian làm bài (Phút)</label>
                            <input 
                              type="number" className="form-control" required style={{ height: 36, fontSize: '0.85rem' }}
                              value={editingExam ? (editingExam.time_limit_minutes || 45) : examForm.timeLimit}
                              onChange={e => {
                                const val = Number(e.target.value);
                                if (editingExam) setEditingExam(p => ({ ...p, time_limit_minutes: val }));
                                else setExamForm(p => ({ ...p, timeLimit: val }));
                              }}
                            />
                          </div>

                          <div className="form-group">
                            <label className="form-label" style={{ fontSize: '0.8rem' }}>Điểm thưởng (Khi hoàn thành)</label>
                            <input 
                              type="number" className="form-control" required style={{ height: 36, fontSize: '0.85rem' }}
                              value={editingExam ? (editingExam.points_rewarded || 50) : examForm.pointsRewarded}
                              onChange={e => {
                                const val = Number(e.target.value);
                                if (editingExam) setEditingExam(p => ({ ...p, points_rewarded: val }));
                                else setExamForm(p => ({ ...p, pointsRewarded: val }));
                              }}
                            />
                          </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                          <div className="form-group">
                            <label className="form-label" style={{ fontSize: '0.8rem' }}>Mức độ khó</label>
                            <select 
                              className="form-control" style={{ height: 36, fontSize: '0.85rem' }}
                              value={editingExam ? editingExam.difficulty : examForm.difficulty}
                              onChange={e => {
                                const val = e.target.value;
                                if (editingExam) setEditingExam(p => ({ ...p, difficulty: val }));
                                else setExamForm(p => ({ ...p, difficulty: val }));
                              }}
                            >
                              <option value="easy">Dễ</option>
                              <option value="medium">Trung bình</option>
                              <option value="hard">Khó</option>
                            </select>
                          </div>

                          {!editingExam && (
                            <div className="form-group">
                              <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 800 }}>Tệp câu hỏi Word (.docx)</label>
                              <input 
                                type="file" accept=".docx" required
                                onChange={e => setImportFile(e.target.files[0])}
                                style={{ fontSize: '0.75rem' }}
                              />
                            </div>
                          )}
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 6 }}>
                          <button 
                            type="submit" 
                            disabled={isImporting}
                            className="btn btn-primary btn-sm" 
                            style={{ padding: '6px 12px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: 6 }}
                          >
                            {isImporting && <Loader className="spinner" size={14} />}
                            {editingExam ? 'Cập nhật đề thi' : 'Tải lên & Tạo đề thi'}
                          </button>
                        </div>
                      </form>
                    </div>
                  ) : null}

                  {/* List Exams */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {exams.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                        Chưa có đề thi nào trong chuyên đề này.
                      </div>
                    ) : (
                      exams.map(ex => (
                        <div 
                          key={ex.id}
                          style={{
                            border: '1px solid #e2e8f0', borderRadius: 12, padding: 14,
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                            background: '#fff'
                          }}
                        >
                          <div>
                            <span style={{ fontWeight: 800, color: '#1e293b', fontSize: '0.875rem' }}>{ex.title}</span>
                            <div style={{ display: 'flex', gap: 10, marginTop: 4, color: '#64748b', fontSize: '0.7rem' }}>
                              <span>⏱️ {ex.time_limit_minutes || 45} phút</span>
                              <span>❓ {ex.question_count || 0} câu</span>
                              <span style={{ textTransform: 'capitalize' }}>Difficulty: {ex.difficulty || 'medium'}</span>
                            </div>
                          </div>

                          <div style={{ display: 'flex', gap: 4 }}>
                            <button
                              onClick={() => setEditingExam(ex)}
                              className="btn-icon"
                              style={{ width: 26, height: 26, color: 'var(--primary)' }}
                            >
                              <Edit size={12} />
                            </button>
                            <button
                              onClick={() => handleDeleteExam(ex.id)}
                              className="btn-icon"
                              style={{ width: 26, height: 26, color: 'var(--danger)' }}
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

              </div>
            )}
            
          </div>
        </div>
      )}

    </div>
  );
}
