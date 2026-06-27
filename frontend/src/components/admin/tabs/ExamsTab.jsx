import React, { useState, useEffect, useRef } from 'react';
import { Trash2, Edit2, Plus, X, Upload, Check, ArrowLeft, HelpCircle, Save, Download, FileText, BookOpen, ImagePlus, Trash } from 'lucide-react';
import ImportExamModal from '../ImportExamModal';
import { getSubjects, getChapters, getLessons } from '../../../api/subjects';
import { getExams } from '../../../api/exams';
import * as adminApi from '../../../api/admin';
import { getAdminExamDetail } from '../../../api/admin';
import { useDialog } from '../../../contexts/DialogContext';
import { extractQuestionsFromDocx } from '../../../utils/docxParser';
import { extractQuestionsFromExcel, parseExcelAnswerKey } from '../../../utils/excelParser';
import * as XLSX from 'xlsx';

export default function ExamsTab() {
  const { alert, confirm } = useDialog();
  const formRef = useRef(null);

  // Reference lists loaded on mount
  const [subjects, setSubjects] = useState([]);
  const [allLessons, setAllLessons] = useState([]);

  // Form cascading states
  const [formSubjectId, setFormSubjectId] = useState('');
  const [formFormChapters, setFormFormChapters] = useState([]); // avoid name clash with chapters
  const [formChapters, setFormChapters] = useState([]);
  const [formChapterId, setFormChapterId] = useState('');
  const [formLessons, setFormLessons] = useState([]);
  const [formLessonId, setFormLessonId] = useState('');
  // Lists & view modes
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState('list'); // 'list', 'create', 'edit'

  // Tracks question IDs imported via Word extract before final exam save
  const [extractedQuestionIds, setExtractedQuestionIds] = useState([]);

  const [examForm, setExamForm] = useState({
    id: null,
    title: '',
    description: '',
    time_limit_minutes: 45,
    question_ids: [],
  });

  // Questions belonging to the currently selected formChapterId (for manual exam construction)
  const [chapterQuestions, setChapterQuestions] = useState([]);
  const [loadingQuestions, setLoadingQuestions] = useState(false);

  // Import State
  const [file, setFile] = useState(null);
  const [isParsing, setIsParsing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState({ current: 0, total: 0 });
  const [parsedQuestions, setParsedQuestions] = useState([]);
  const [selectedParsedIndex, setSelectedParsedIndex] = useState(0);

  // Modal Control
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  // Batch states for import
  const [batchType, setBatchType] = useState('single_choice');
  const [batchDifficulty, setBatchDifficulty] = useState('medium');
  const [batchPoints, setBatchPoints] = useState(10);

  const [errorMsg, setErrorMsg] = useState('');

  // Load all lookups and load all exams on mount
  const loadInitialData = async () => {
    setLoading(true);
    try {
      const subsRes = await getSubjects();
      const subs = subsRes.data?.subjects || [];
      setSubjects(subs);
      
      const tempLessons = [];
      for (const s of subs) {
        const chRes = await getChapters(s.id);
        const chs = chRes.data?.chapters || [];
        for (const c of chs) {
          const lesRes = await getLessons(c.id);
          const les = lesRes.data?.lessons || [];
          for (const l of les) {
            tempLessons.push({
              ...l,
              subject_name: s.name,
              subject_id: s.id,
              chapter_name: c.name,
              chapter_id: c.id
            });
          }
        }
      }
      setAllLessons(tempLessons);

      const examsRes = await getExams({});
      setExams(examsRes.data?.exams || []);
    } catch (err) {
      console.error('Lỗi tải dữ liệu ban đầu:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  // Handle Subject selection manually
  const handleSubjectChange = async (val) => {
    setFormSubjectId(val);
    if (!val) {
      setFormChapters([]);
      setFormChapterId('');
      setFormLessons([]);
      setFormLessonId('');
      return;
    }
    try {
      const res = await getChapters(val);
      setFormChapters(res.data?.chapters || []);
      setFormChapterId('');
      setFormLessons([]);
      setFormLessonId('');
    } catch (err) {
      console.error('Lỗi tải chuyên đề form:', err);
    }
  };

  // Handle Chapter selection manually
  const handleChapterChange = async (val) => {
    setFormChapterId(val);
    if (!val) {
      setFormLessons([]);
      setFormLessonId('');
      return;
    }
    try {
      const res = await getLessons(val);
      setFormLessons(res.data?.lessons || []);
      setFormLessonId('');
    } catch (err) {
      console.error('Lỗi tải bài tập form:', err);
    }
  };

  // Fetch chapter questions for manual construction when formChapterId is chosen
  useEffect(() => {
    if ((viewMode === 'create' || viewMode === 'edit') && formChapterId) {
      setLoadingQuestions(true);
      adminApi.getChapterQuestions(formChapterId)
        .then(res => {
          setChapterQuestions(res.data?.questions || []);
        })
        .catch(err => console.error('Lỗi tải câu hỏi chuyên đề:', err))
        .finally(() => setLoadingQuestions(false));
    } else {
      setChapterQuestions([]);
    }
  }, [viewMode, formChapterId]);

  const loadAllExams = async () => {
    setLoading(true);
    try {
      const res = await getExams({});
      setExams(res.data?.exams || []);
    } catch (err) {
      console.error('Lỗi tải đề thi:', err);
    } finally {
      setLoading(false);
    }
  };

  const [uploadingPdf, setUploadingPdf] = useState(false);
  const [uploadingExcel, setUploadingExcel] = useState(false);

  const handlePdfUpload = async (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;
    setUploadingPdf(true);
    try {
      const res = await adminApi.uploadFile(selectedFile);
      if (res.data?.success && res.data?.fileUrl) {
        setExamForm(prev => ({ ...prev, pdf_url: res.data.fileUrl }));
        alert('Tải file PDF lên thành công!');
      } else {
        alert('Tải file PDF thất bại.');
      }
    } catch (err) {
      alert('Lỗi tải file PDF: ' + (err.message || ''));
    } finally {
      setUploadingPdf(false);
    }
  };

  const handleExcelKeyUpload = async (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;
    setUploadingExcel(true);
    try {
      const parsedKey = await parseExcelAnswerKey(selectedFile);
      setExamForm(prev => ({ ...prev, answer_key: parsedKey }));
      alert(`Đã nạp bảng đáp án Excel thành công (${Object.keys(parsedKey).length} câu)!`);
    } catch (err) {
      alert('Lỗi đọc bảng đáp án Excel: ' + (err.message || ''));
    } finally {
      setUploadingExcel(false);
    }
  };

  // ── Download Excel answer key template ─────────────────────────────────────
  const downloadAnswerKeyTemplate = () => {
    const totalRows = 50;
    const rows = [['Câu', 'Đáp án']];
    for (let i = 1; i <= totalRows; i++) {
      rows.push([i, '']);
    }
    const ws = XLSX.utils.aoa_to_sheet(rows);
    // Style header row width
    ws['!cols'] = [{ wch: 10 }, { wch: 12 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Đáp án');
    XLSX.writeFile(wb, 'mau-dap-an-de-thi.xlsx');
  };

  const updateAnswerKeyVal = (qNum, val) => {
    setExamForm(prev => {
      const nextKey = { ...(prev.answer_key || {}), [qNum]: val.toUpperCase() };
      return { ...prev, answer_key: nextKey };
    });
  };

  const addAnswerKeyRow = () => {
    setExamForm(prev => {
      const currentKeys = Object.keys(prev.answer_key || {}).map(Number).filter(n => !isNaN(n));
      const nextNum = currentKeys.length > 0 ? Math.max(...currentKeys) + 1 : 1;
      const nextKey = { ...(prev.answer_key || {}), [nextNum]: 'A' };
      return { ...prev, answer_key: nextKey };
    });
  };

  const removeAnswerKeyRow = (qNum) => {
    setExamForm(prev => {
      const nextKey = { ...prev.answer_key };
      delete nextKey[qNum];
      return { ...prev, answer_key: nextKey };
    });
  };

  const [editingTempIds, setEditingTempIds] = useState({});
  const toggleEditQuestion = (tempId) => {
    setEditingTempIds(prev => {
      const updated = { ...prev, [tempId]: !prev[tempId] };
      if (!updated[tempId]) {
        setTimeout(() => {
          if (window.MathJax) {
            window.MathJax.typesetPromise ? window.MathJax.typesetPromise() : window.MathJax.typeset();
          }
        }, 80);
      }
      return updated;
    });
  };

  const handleQuestionImageAdd = async (tempId, fileObj) => {
    if (!fileObj) return;
    try {
      const res = await adminApi.uploadFile(fileObj);
      if (res.data && res.data.success && res.data.fileUrl) {
        setParsedQuestions(prev => prev.map(q => {
          if (q.tempId !== tempId) return q;
          const currentImages = q.images || [];
          return { ...q, images: [...currentImages, res.data.fileUrl] };
        }));
      }
    } catch (err) {
      console.error("Error adding question image:", err);
      alert("Tải ảnh lên thất bại");
    }
  };

  const handleQuestionImageChange = async (tempId, imgIdx, fileObj) => {
    if (!fileObj) return;
    try {
      const res = await adminApi.uploadFile(fileObj);
      if (res.data && res.data.success && res.data.fileUrl) {
        setParsedQuestions(prev => prev.map(q => {
          if (q.tempId !== tempId) return q;
          const nextImages = [...(q.images || [])];
          nextImages[imgIdx] = res.data.fileUrl;
          return { ...q, images: nextImages };
        }));
      }
    } catch (err) {
      console.error("Error changing question image:", err);
      alert("Tải ảnh lên thất bại");
    }
  };

  const handleQuestionImageDelete = (tempId, imgIdx) => {
    setParsedQuestions(prev => prev.map(q => {
      if (q.tempId !== tempId) return q;
      const nextImages = (q.images || []).filter((_, idx) => idx !== imgIdx);
      return { ...q, images: nextImages };
    }));
  };

  const updateQuestionField = (tempId, field, value) => {
    setParsedQuestions(prev => prev.map(q => q.tempId === tempId ? { ...q, [field]: value } : q));
  };

  const updateQuestionType = (tempId, type) => {
    setParsedQuestions(prev => prev.map(q => {
      if (q.tempId !== tempId) return q;
      let opts = [];
      if (type === 'single_choice') {
        opts = [
          { key: 'A', option_text: '', is_correct: true, option_value: '' },
          { key: 'B', option_text: '', is_correct: false, option_value: '' },
          { key: 'C', option_text: '', is_correct: false, option_value: '' },
          { key: 'D', option_text: '', is_correct: false, option_value: '' }
        ];
      } else if (type === 'input_number') {
        opts = [
          { key: 'ANSWER', option_text: 'Đáp án đúng', is_correct: true, option_value: '' }
        ];
      }
      return { ...q, questionType: type, options: opts };
    }));
  };

  const updateOptionField = (tempId, optionKey, field, value) => {
    setParsedQuestions(prev => prev.map(q => {
      if (q.tempId !== tempId) return q;
      const nextOpts = q.options.map(o => {
        if (o.key !== optionKey) {
          if (field === 'is_correct' && value === true) {
            return { ...o, is_correct: false };
          }
          return o;
        }
        return { ...o, [field]: value };
      });
      return { ...q, options: nextOpts };
    }));
  };

  const toggleSelectQuestion = (tempId) => {
    setParsedQuestions(prev => prev.map(q => q.tempId === tempId ? { ...q, selected: !q.selected } : q));
  };

  const deleteQuestionFromList = (tempId) => {
    setParsedQuestions(prev => prev.filter(q => q.tempId !== tempId));
  };

  const applyBatchDifficulty = () => {
    setParsedQuestions(prev => prev.map(q => ({ ...q, difficulty: batchDifficulty })));
  };

  const applyBatchPoints = () => {
    setParsedQuestions(prev => prev.map(q => ({ ...q, points: Number(batchPoints) })));
  };

  const handleStartExtract = async (meta, questions) => {
    // Fetch all cascading data FIRST, then set all state at once
    try {
      const [chaptersRes, lessonsRes] = await Promise.all([
        getChapters(meta.subject_id.toString()),
        getLessons(meta.chapter_id.toString())
      ]);

      setExamForm({
        id: null,
        title: meta.title,
        description: meta.description,
        time_limit_minutes: meta.time_limit_minutes,
        question_ids: [],
      });
      setFormSubjectId(meta.subject_id.toString());
      setFormChapters(chaptersRes.data?.chapters || []);
      setFormChapterId(meta.chapter_id.toString());
      setFormLessons(lessonsRes.data?.lessons || []);
      setFormLessonId(meta.lesson_id.toString());
      setParsedQuestions(questions);
      setEditingTempIds({});
      setViewMode('create');
    } catch (err) {
      console.error('Lỗi tải dữ liệu trích xuất:', err);
    }
  };


  // ── Manual Exam Operations ──────────────────────────────────────────────────
  const handleOpenCreate = () => {
    setFormSubjectId('');
    setFormChapters([]);
    setFormChapterId('');
    setFormLessons([]);
    setFormLessonId('');
    
    setExamForm({
      id: null,
      title: 'Đề thi mới',
      description: '',
      time_limit_minutes: 45,
      question_ids: [],
    });
    setExtractedQuestionIds([]);
    setFile(null);
    setParsedQuestions([]);
    setEditingTempIds({});
    setErrorMsg('');
    setViewMode('create');
  };

  const handleOpenEdit = async (exam) => {
    setLoading(true);
    try {
      const res = await getAdminExamDetail(exam.id);
      const detail = res.data?.exam || exam;
      
      // Resolve subject and chapter hierarchy from the flat lessons list
      const lesObj = allLessons.find(l => l.id.toString() === detail.lesson_id?.toString());
      let sId = '';
      let cId = '';
      let lId = detail.lesson_id || '';
      
      if (lesObj) {
        sId = lesObj.subject_id.toString();
        cId = lesObj.chapter_id.toString();
      }

      // Preload cascaded selections for editing
      if (sId) {
        const chsRes = await getChapters(sId);
        setFormChapters(chsRes.data?.chapters || []);
      } else {
        setFormChapters([]);
      }

      if (cId) {
        const lesRes = await getLessons(cId);
        setFormLessons(lesRes.data?.lessons || []);
      } else {
        setFormLessons([]);
      }

      setFormSubjectId(sId);
      setFormChapterId(cId);
      setFormLessonId(lId);

      const fetchedQuestions = res.data?.questions || [];
      const formattedForEditing = fetchedQuestions.map(q => ({
        tempId: q.id,
        id: q.id,
        questionText: q.question_text,
        questionType: q.question_type,
        difficulty: q.difficulty || 'medium',
        explanation: q.explanation || '',
        points: q.points || 10,
        selected: true,
        images: (q.images || []),
        sol_images: (q.sol_images || []),
        options: (q.options || []).map(o => ({
          key: o.key,
          option_text: o.option_text || '',
          is_correct: o.is_correct,
          option_value: o.option_value || ''
        }))
      }));
      setParsedQuestions(formattedForEditing);
      setEditingTempIds({});

      setExamForm({
        id: detail.id,
        title: detail.title,
        description: detail.description || '',
        time_limit_minutes: detail.time_limit_minutes,
        question_ids: detail.question_ids || [],
      });
      setExtractedQuestionIds(detail.question_ids || []);
      setViewMode('edit');
    } catch (err) {
      alert('Lỗi tải chi tiết đề thi: ' + (err.message || ''));
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteExam = async (id) => {
    const confirmed = await confirm('Bạn có chắc chắn muốn xóa đề thi này? Các câu hỏi trong đề thi vẫn được giữ lại trong cơ sở dữ liệu.');
    if (!confirmed) return;
    try {
      await adminApi.deleteExam(id);
      alert('Xóa đề thi thành công!');
      loadAllExams();
    } catch (err) {
      alert('Lỗi khi xóa đề thi: ' + (err.message || ''));
    }
  };


  const toggleQuestionSelected = (qId) => {
    setExamForm(prev => {
      const exists = prev.question_ids.includes(qId);
      const next = exists 
        ? prev.question_ids.filter(id => id !== qId) 
        : [...prev.question_ids, qId];
      return { ...prev, question_ids: next };
    });
  };

  // ── Import Operations ────────────────────────────────────────────────────────
  const handleFileChange = async (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setIsParsing(true);
    setErrorMsg('');
    setParsedQuestions([]);

    const ext = selectedFile.name.split('.').pop().toLowerCase();
    try {
      let questions = [];
      if (ext === 'docx') {
        const raw = await extractQuestionsFromDocx(selectedFile);
        let tempId = 1;
        questions = raw.map(eq => {
          if (eq.section === 'I') {
            return {
              tempId: tempId++,
              questionText: eq.qtext,
              questionType: 'single_choice',
              difficulty: 'medium',
              points: 10,
              selected: true,
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
                  tempId: tempId++,
                  questionText: `${eq.qtext}\n\n*) Phát biểu: ${stmt.key}) ${stmt.text}`,
                  questionType: 'single_choice',
                  difficulty: 'medium',
                  points: 10,
                  selected: true,
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
              tempId: tempId++,
              questionText: eq.qtext,
              questionType: 'input_number',
              difficulty: 'medium',
              points: 10,
              selected: true,
              options: [
                { key: 'ANSWER', option_text: 'Đáp án đúng', is_correct: true, option_value: eq.answer?.val || '' }
              ]
            };
          }
        }).flat();
      } else if (ext === 'xlsx' || ext === 'xls') {
        questions = await extractQuestionsFromExcel(selectedFile);
      } else {
        throw new Error('Chỉ hỗ trợ file định dạng .docx hoặc .xlsx / .xls');
      }

      setParsedQuestions(questions);
      setEditingTempIds({});
      setSelectedParsedIndex(0);
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message || 'Lỗi đọc file.');
    } finally {
      setIsParsing(false);
    }
  };

  const updateParsedQuestion = (index, field, value) => {
    setParsedQuestions(prev => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  const updateParsedOption = (qIdx, optIdx, field, value) => {
    setParsedQuestions(prev => {
      const copy = [...prev];
      const nextOpts = [...copy[qIdx].options];
      nextOpts[optIdx] = { ...nextOpts[optIdx], [field]: value };
      copy[qIdx] = { ...copy[qIdx], options: nextOpts };
      return copy;
    });
  };

  const setParsedCorrectOption = (qIdx, optIdx) => {
    setParsedQuestions(prev => {
      const copy = [...prev];
      const nextOpts = copy[qIdx].options.map((o, idx) => ({
        ...o,
        is_correct: idx === optIdx
      }));
      copy[qIdx] = { ...copy[qIdx], options: nextOpts };
      return copy;
    });
  };

  const handleImportAndCreateExam = async () => {
    if (!formSubjectId) {
      alert('Vui lòng chọn ít nhất Lớp ở đầu trang để nhập câu hỏi!');
      return;
    }
    if (!examForm.title.trim()) {
      alert('Vui lòng điền tiêu đề đề thi tự động!');
      return;
    }

    const selectedQs = parsedQuestions.filter(q => q.selected);
    if (selectedQs.length === 0) {
      alert('Vui lòng tích chọn ít nhất 1 câu hỏi để nhập!');
      return;
    }

    setIsImporting(true);
    setImportProgress({ current: 0, total: selectedQs.length });

    try {
      const createdIds = [];
      for (let i = 0; i < selectedQs.length; i++) {
        const q = selectedQs[i];
        
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

        const res = await adminApi.createQuestion({
          chapter_id: formChapterId || null,
          question_text: q.questionText,
          question_type: q.questionType,
          difficulty: q.difficulty || 'medium',
          explanation: q.explanation || '',
          points: Number(q.points || 10),
          options: opts,
          images: q.images || [],
          sol_images: q.sol_images || []
        });

        if (res.data?.success && res.data?.id) {
          createdIds.push(res.data.id);
        }
        setImportProgress(prev => ({ ...prev, current: i + 1 }));
      }

      // Create the Exam
      await adminApi.createExam({
        title: examForm.title.trim(),
        description: examForm.description.trim() || null,
        subject_id: formSubjectId ? Number(formSubjectId) : null,
        lesson_id: formLessonId || null,
        time_limit_minutes: Number(examForm.time_limit_minutes),
        question_ids: createdIds
      });

      alert(`Đã trích xuất và lưu thành công ${createdIds.length} câu hỏi và tự động tạo đề thi "${examForm.title}"!`);

      setViewMode('list');
      loadAllExams();
      loadInitialData();
    } catch (err) {
      alert('Lỗi tạo đề thi tự động: ' + (err.response?.data?.message || err.message));
    } finally {
      setIsImporting(false);
    }
  };

  // Helper to format breadcrumb location of each exam in the main table
  const getExamLocationText = (lessonId) => {
    if (!lessonId) return 'Chưa gán bài tập';
    const les = allLessons.find(l => l.id.toString() === lessonId.toString());
    if (les) {
      return (
        <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
          {les.subject_name} <span style={{ color: '#cbd5e1', margin: '0 4px' }}>→</span> {les.chapter_name} <span style={{ color: '#cbd5e1', margin: '0 4px' }}>→</span> <strong style={{ color: '#334155' }}>{les.title}</strong>
        </span>
      );
    }
    return `Bài tập ID: ${lessonId}`;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, width: '100%' }}>
      
      {/* 1. Header with single add button (Only show in 'list' mode) */}
      {viewMode === 'list' && (
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: '#f8fafc',
          padding: '16px 24px',
          borderRadius: 16,
          border: '1px solid #e2e8f0'
        }}>
          <div>
            <h4 style={{ margin: 0, fontWeight: 900, color: '#1e293b', fontSize: '1.25rem' }}>Quản lý Đề thi</h4>
            <p style={{ margin: '2px 0 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>Xem và phân bổ tất cả các đề thi trong hệ thống</p>
          </div>
          <button
            className="btn btn-primary"
            onClick={() => setIsImportModalOpen(true)}
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <Plus size={16} /> Nhập đề từ Word
          </button>
        </div>
      )}

      {/* 2. MAIN LIST VIEW */}
      {viewMode === 'list' && (
        <>
          {loading ? (
            <div className="page-loading" style={{ padding: '60px 0' }}><div className="spinner" /></div>
          ) : (
            <div className="card" style={{ borderRadius: 16, overflow: 'hidden', padding: 0 }}>
              <div className="table-wrapper" style={{ margin: 0 }}>
                <table className="table">
                  <thead>
                    <tr>
                      <th>Tiêu đề đề thi</th>
                      <th>Vị trí</th>
                      <th>Số câu hỏi</th>
                      <th>Thời gian làm bài</th>
                      <th style={{ width: 120 }}>Hành động</th>
                    </tr>
                  </thead>
                  <tbody>
                    {exams.length === 0 ? (
                      <tr>
                        <td colSpan={5} style={{ textAlign: 'center', padding: 30, color: 'var(--text-muted)' }}>
                          Chưa có đề thi nào trong hệ thống. Hãy nhấn nút "Thêm đề thi mới" phía trên để tạo.
                        </td>
                      </tr>
                    ) : exams.map(ex => (
                      <tr key={ex.id}>
                        <td style={{ fontWeight: 800, color: '#1e293b' }}>{ex.title}</td>
                        <td>{getExamLocationText(ex.lesson_id)}</td>
                        <td style={{ fontWeight: 700 }}>{ex.question_count || 0} câu</td>
                        <td>{ex.time_limit_minutes} phút</td>
                        <td>
                          <div style={{ display: 'flex', gap: 6 }}>
                            <button
                              className="btn btn-ghost btn-sm btn-icon"
                              onClick={() => handleOpenEdit(ex)}
                              style={{ color: 'var(--primary)' }}
                              title="Chỉnh sửa đề thi"
                            >
                              <Edit2 size={14} />
                            </button>
                            <button
                              className="btn btn-ghost btn-sm btn-icon"
                              onClick={() => handleDeleteExam(ex.id)}
                              style={{ color: 'var(--danger)' }}
                              title="Xóa đề thi"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* 3. INLINE MANUAL CREATE / EDIT & FILE EXTRACT WORKSPACE */}
      {(viewMode === 'create' || viewMode === 'edit') && (
        <div className="card" style={{ borderRadius: 16, padding: 24 }}>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, borderBottom: '1px solid #f1f5f9', paddingBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <button className="btn btn-ghost btn-sm" onClick={() => setViewMode('list')} style={{ padding: 6 }}>
                <ArrowLeft size={20} />
              </button>
              <div>
                <h3 style={{ margin: 0, fontWeight: 900, color: '#1e293b' }}>
                  {viewMode === 'create' ? 'Chi tiết đề thi mới (Trích xuất từ Word)' : 'Chỉnh sửa chi tiết đề thi'}
                </h3>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => setViewMode('list')}>Hủy bỏ</button>
              <button 
                type="button" 
                className="btn btn-primary btn-sm" 
                onClick={() => formRef.current?.requestSubmit()} 
                style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                disabled={loading}
              >
                <Save size={16} /> Lưu đề thi
              </button>
            </div>
          </div>

          {/* Cascading selectors put AT THE VERY TOP as requested by user */}
          <div style={{
            background: '#f8fafc',
            padding: '16px 20px',
            borderRadius: 12,
            border: '1px solid #e2e8f0',
            display: 'flex',
            gap: 16,
            flexWrap: 'wrap',
            marginBottom: 20
          }}>
            {/* Subject Selector */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 200 }}>
              <label style={{ fontWeight: 800, fontSize: '0.85rem', color: '#475569' }}>1. Chọn Lớp:</label>
              <select
                className="form-control"
                value={formSubjectId}
                onChange={e => handleSubjectChange(e.target.value)}
              >
                <option value="">-- Chọn Lớp --</option>
                {subjects.map(s => (
                  <option key={s.id} value={s.id}>Lớp {s.grade}</option>
                ))}
              </select>
            </div>

            {/* Chapter Selector */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 220 }}>
              <label style={{ fontWeight: 800, fontSize: '0.85rem', color: '#475569' }}>2. Chọn Bài học:</label>
              <select
                className="form-control"
                value={formChapterId}
                onChange={e => handleChapterChange(e.target.value)}
                disabled={!formSubjectId}
              >
                <option value="">-- Chọn Bài học --</option>
                {formChapters.map(ch => (
                  <option key={ch.id} value={ch.id}>{ch.name}</option>
                ))}
              </select>
            </div>

            {/* Lesson Selector */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 220 }}>
              <label style={{ fontWeight: 800, fontSize: '0.85rem', color: '#475569' }}>3. Chọn Bài tập (Bài luyện tập / kiểm tra):</label>
              <select
                className="form-control"
                value={formLessonId}
                onChange={e => setFormLessonId(e.target.value)}
                disabled={!formChapterId}
              >
                <option value="">-- Chọn Bài tập --</option>
                {formLessons.map(l => (
                  <option key={l.id} value={l.id}>{l.title}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Detailed Question Preview and Metadata Form */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <form
              ref={formRef}
              onSubmit={async (e) => {
                e.preventDefault();
                if (!formSubjectId) {
                  alert('Vui lòng chọn ít nhất Lớp đích!');
                  return;
                }
                if (!examForm.title.trim()) {
                  alert('Vui lòng điền tiêu đề đề thi!');
                  return;
                }
                
                const selectedQuestions = parsedQuestions.filter(q => q.selected);
                if (selectedQuestions.length === 0) {
                  alert('Vui lòng chọn ít nhất một câu hỏi trong đề thi!');
                  return;
                }

                setLoading(true);
                try {
                  // 1. Save or update questions first
                  const savedQuestionIds = [];
                  for (let i = 0; i < selectedQuestions.length; i++) {
                    const q = selectedQuestions[i];
                    let opts = [];
                    if (q.questionType === 'single_choice') {
                      opts = q.options.map(o => ({
                        key: o.key,
                        option_text: o.option_text || `Đáp án ${o.key}`,
                        is_correct: o.is_correct,
                        option_value: ''
                      }));
                    } else if (q.questionType === 'input_number') {
                      opts = [{
                        key: 'ANSWER',
                        option_text: 'Đáp án đúng',
                        is_correct: true,
                        option_value: (q.options[0]?.option_value || '').trim()
                      }];
                    }

                    const questionPayload = {
                      chapter_id: formChapterId || null,
                      question_text: q.questionText,
                      question_type: q.questionType,
                      difficulty: q.difficulty || 'medium',
                      explanation: q.explanation || '',
                      points: Number(q.points || 10),
                      options: opts,
                      images: q.images || [],
                      sol_images: q.sol_images || []
                    };

                    if (viewMode === 'edit' && q.id) {
                      // Update existing question
                      await adminApi.updateQuestion(q.id, questionPayload);
                      savedQuestionIds.push(q.id);
                    } else {
                      // Create new question
                      const resQ = await adminApi.createQuestion(questionPayload);
                      if (resQ.data?.success && resQ.data?.id) {
                        savedQuestionIds.push(resQ.data.id);
                      }
                    }
                  }

                  // 2. Save/Update the exam with the questions
                  const examPayload = {
                    title: examForm.title.trim(),
                    description: examForm.description.trim() || null,
                    subject_id: formSubjectId ? Number(formSubjectId) : null,
                    lesson_id: formLessonId || null,
                    time_limit_minutes: Number(examForm.time_limit_minutes),
                    question_ids: savedQuestionIds
                  };

                  if (viewMode === 'create') {
                    await adminApi.createExam(examPayload);
                    alert(`Tạo đề thi "${examForm.title}" thành công với ${savedQuestionIds.length} câu hỏi!`);
                  } else {
                    await adminApi.updateExam(examForm.id, examPayload);
                    alert('Cập nhật đề thi thành công!');
                  }

                  setViewMode('list');
                  loadAllExams();
                  loadInitialData();
                } catch (err) {
                  alert('Lỗi lưu đề thi: ' + (err.response?.data?.message || err.message));
                } finally {
                  setLoading(false);
                }
              }}
              style={{ display: 'flex', flexDirection: 'column', gap: 24 }}
            >
              {/* Form Metadata Card */}
              <div style={{ background: '#f8fafc', padding: 24, borderRadius: 16, border: '1px solid #e2e8f0' }}>
                <h4 style={{ margin: '0 0 16px', fontWeight: 800, color: '#334155', fontSize: '1rem' }}>Thông tin chung đề thi</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '3fr 1fr', gap: 16 }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" style={{ fontWeight: 700, fontSize: '0.8rem' }}>Tiêu đề đề thi</label>
                    <input
                      className="form-control"
                      required
                      placeholder="Ví dụ: Đề thi học kỳ 2 lớp 10"
                      value={examForm.title}
                      onChange={e => setExamForm(p => ({ ...p, title: e.target.value }))}
                    />
                  </div>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" style={{ fontWeight: 700, fontSize: '0.8rem' }}>Thời gian làm bài (phút)</label>
                    <input type="number" className="form-control" required value={examForm.time_limit_minutes}
                      onChange={e => setExamForm(p => ({ ...p, time_limit_minutes: Number(e.target.value) }))} />
                  </div>
                </div>
                <div className="form-group" style={{ marginTop: 12, marginBottom: 0 }}>
                  <label className="form-label" style={{ fontWeight: 700, fontSize: '0.8rem' }}>Mô tả ngắn</label>
                  <textarea
                    className="form-control"
                    rows={2}
                    placeholder="Nhập mô tả đề thi..."
                    value={examForm.description}
                    onChange={e => setExamForm(p => ({ ...p, description: e.target.value }))}
                  />
                </div>
              </div>

              {/* Questions List Card */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h4 style={{ margin: 0, fontWeight: 900, color: '#1e293b', fontSize: '1.1rem' }}>
                    Danh sách câu hỏi đề thi ({parsedQuestions.length} câu)
                  </h4>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button 
                      type="button" 
                      className="btn btn-ghost btn-xs"
                      onClick={() => setParsedQuestions(prev => prev.map(q => ({ ...q, selected: true })))}
                    >
                      Chọn tất cả
                    </button>
                    <button 
                      type="button" 
                      className="btn btn-ghost btn-xs"
                      onClick={() => setParsedQuestions(prev => prev.map(q => ({ ...q, selected: false })))}
                    >
                      Bỏ chọn tất cả
                    </button>
                  </div>
                </div>

                {/* Batch Actions Panel */}
                <div style={{ background: '#f1f5f9', padding: 16, borderRadius: 12, border: '1px solid #cbd5e1', display: 'flex', gap: 20, flexWrap: 'wrap', alignItems: 'center' }}>
                  <span style={{ fontWeight: 800, fontSize: '0.8rem', color: '#475569' }}>Thiết lập nhanh hàng loạt:</span>
                  

                  {/* Points */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: '0.8rem', color: '#475569' }}>Điểm:</span>
                    <input type="number" className="form-control" style={{ padding: '2px 6px', fontSize: '0.8rem', width: 60, height: 28 }} value={batchPoints} onChange={e => setBatchPoints(e.target.value)} />
                    <button type="button" className="btn btn-primary" style={{ padding: '3px 10px', fontSize: '0.75rem', height: 28 }} onClick={applyBatchPoints}>Áp dụng</button>
                  </div>
                </div>

                {/* Question Items */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {parsedQuestions.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px', color: '#64748b', background: '#f8fafc', borderRadius: 12 }}>
                      Chưa có câu hỏi nào.
                    </div>
                  ) : parsedQuestions.map((q, idx) => (
                    <div 
                      key={q.tempId} 
                      style={{ 
                        background: '#fff', 
                        borderRadius: 12, 
                        border: q.selected ? '2px solid #10b981' : '1px solid #cbd5e1', 
                        padding: 16,
                        opacity: q.selected ? 1 : 0.7
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: 8, marginBottom: 12 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <input 
                            type="checkbox" 
                            checked={q.selected} 
                            onChange={() => toggleSelectQuestion(q.tempId)} 
                            style={{ width: 18, height: 18, cursor: 'pointer' }}
                          />
                          <span style={{ fontWeight: 800, color: '#1e293b', fontSize: '0.9rem' }}>Câu hỏi {idx + 1}</span>
                          <select 
                            style={{ 
                              padding: '2px 6px', 
                              fontSize: '0.75rem', 
                              height: 24, 
                              background: q.questionType === 'single_choice' ? '#dbeafe' : '#fef3c7', 
                              color: q.questionType === 'single_choice' ? '#1e40af' : '#92400e',
                              fontWeight: 'bold',
                              border: 'none',
                              borderRadius: 6,
                              cursor: 'pointer'
                            }}
                            value={q.questionType}
                            onChange={e => updateQuestionType(q.tempId, e.target.value)}
                          >
                            <option value="single_choice">Trắc nghiệm</option>
                            <option value="input_number">Điền số</option>
                          </select>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>

                          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Điểm:</span>
                            <input type="number" style={{ width: 50, fontSize: '0.75rem', padding: '2px 4px', height: 24 }} value={q.points} onChange={e => updateQuestionField(q.tempId, 'points', Number(e.target.value))} />
                          </div>
                          <button 
                            type="button" 
                            onClick={() => toggleEditQuestion(q.tempId)}
                            className="btn btn-ghost btn-xs btn-icon"
                            style={{ color: editingTempIds[q.tempId] ? '#10b981' : '#3b82f6', marginRight: 4 }}
                            title={editingTempIds[q.tempId] ? "Xong" : "Sửa câu hỏi"}
                          >
                            {editingTempIds[q.tempId] ? <Check size={14} /> : <Edit2 size={14} />}
                          </button>
                          <button 
                            type="button" 
                            onClick={() => deleteQuestionFromList(q.tempId)}
                            className="btn btn-ghost btn-xs btn-icon"
                            style={{ color: '#dc2626' }}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>

                      {/* Question Text */}
                      {editingTempIds[q.tempId] ? (
                        <>
                          <textarea
                            className="form-control"
                            rows={2}
                            style={{ fontSize: '0.85rem', width: '100%', resize: 'vertical', fontWeight: 600, color: '#1e293b' }}
                            value={q.questionText}
                            onChange={e => updateQuestionField(q.tempId, 'questionText', e.target.value)}
                          />
                          <div className="no-mathjax" style={{ marginTop: 6, padding: '6px 12px', background: '#f8fafc', borderRadius: 6, fontSize: '0.85rem', borderLeft: '3px solid #10b981', color: '#1e293b' }}>
                            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', display: 'block', marginBottom: 2 }}>Xem trước đề bài:</span>
                            <div className="mathjax" style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                              {q.questionText || <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>(Trống)</span>}
                            </div>
                          </div>
                        </>
                      ) : (
                        <div style={{ fontSize: '0.9rem', color: '#1e293b', lineHeight: 1.6 }}>
                          <div className="mathjax" style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                            {q.questionText || <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>(Trống)</span>}
                          </div>
                        </div>
                      )}

                      {/* Display Question Images */}
                      {q.images && q.images.length > 0 ? (
                        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 10 }}>
                          {q.images.map((url, imgIdx) => (
                            <div key={imgIdx} style={{ position: 'relative', display: 'inline-block' }}>
                              <img 
                                src={url} 
                                alt={`Question image ${imgIdx + 1}`} 
                                style={{ maxHeight: 150, maxWidth: '100%', borderRadius: 8, border: '1px solid #cbd5e1' }}
                              />
                              {editingTempIds[q.tempId] && (
                                <div style={{
                                  position: 'absolute',
                                  top: 4,
                                  right: 4,
                                  display: 'flex',
                                  gap: 4,
                                  background: 'rgba(15, 23, 42, 0.75)',
                                  padding: '4px',
                                  borderRadius: 6,
                                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                                }}>
                                  <label style={{ margin: 0, cursor: 'pointer', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', width: 22, height: 22 }} title="Đổi ảnh">
                                    <Edit2 size={12} />
                                    <input 
                                      type="file" 
                                      accept="image/*" 
                                      style={{ display: 'none' }} 
                                      onChange={(e) => handleQuestionImageChange(q.tempId, imgIdx, e.target.files[0])} 
                                    />
                                  </label>
                                  <button 
                                    type="button" 
                                    style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', width: 22, height: 22 }} 
                                    onClick={() => handleQuestionImageDelete(q.tempId, imgIdx)}
                                    title="Xóa ảnh"
                                  >
                                    <Trash size={12} />
                                  </button>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        editingTempIds[q.tempId] && (
                          <div style={{ marginTop: 10, marginBottom: 10 }}>
                            <label style={{ 
                              display: 'inline-flex', 
                              alignItems: 'center', 
                              gap: 6, 
                              padding: '6px 12px', 
                              borderRadius: 6, 
                              background: '#f1f5f9', 
                              border: '1px dashed #cbd5e1', 
                              fontSize: '0.8rem', 
                              color: '#475569', 
                              cursor: 'pointer',
                              fontWeight: 600,
                              transition: 'all 0.2s'
                            }}>
                              <ImagePlus size={14} /> Thêm hình ảnh câu hỏi
                              <input 
                                type="file" 
                                accept="image/*" 
                                style={{ display: 'none' }} 
                                onChange={(e) => handleQuestionImageAdd(q.tempId, e.target.files[0])} 
                              />
                            </label>
                          </div>
                        )
                      )}

                      {/* Display Solution Images */}
                      {q.sol_images && q.sol_images.length > 0 && (
                        <div style={{ marginTop: 10 }}>
                          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', display: 'block', marginBottom: 4 }}>Hình ảnh lời giải:</span>
                          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                            {q.sol_images.map((url, imgIdx) => (
                              <div key={imgIdx} style={{ position: 'relative' }}>
                                <img 
                                  src={url} 
                                  alt={`Solution image ${imgIdx + 1}`} 
                                  style={{ maxHeight: 150, maxWidth: '100%', borderRadius: 8, border: '1px solid #cbd5e1' }}
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Options */}
                      {q.questionType === 'single_choice' && (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 12 }}>
                          {q.options.map(opt => {
                            const isCorrect = opt.is_correct;
                            return (
                              <div 
                                key={opt.key} 
                                style={{ 
                                  display: 'flex', 
                                  alignItems: 'center', 
                                  gap: 8, 
                                  background: isCorrect ? '#ecfdf5' : '#f8fafc', 
                                  padding: '8px 12px', 
                                  borderRadius: 8, 
                                  border: isCorrect ? '1.5px solid #10b981' : '1px solid #e2e8f0' 
                                }}
                              >
                                {editingTempIds[q.tempId] ? (
                                  <>
                                    <input 
                                      type="radio" 
                                      name={`q_${q.tempId}`} 
                                      checked={opt.is_correct}
                                      onChange={() => updateOptionField(q.tempId, opt.key, 'is_correct', true)}
                                      style={{ cursor: 'pointer' }}
                                    />
                                    <span style={{ fontWeight: 800, fontSize: '0.8rem', color: isCorrect ? '#047857' : '#475569' }}>{opt.key}:</span>
                                    <div className="no-mathjax" style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
                                      <input 
                                        type="text"
                                        className="form-control"
                                        style={{ padding: '2px 6px', fontSize: '0.8rem', height: 24, width: '100%' }}
                                        value={opt.option_text}
                                        onChange={e => updateOptionField(q.tempId, opt.key, 'option_text', e.target.value)}
                                      />
                                      <div className="mathjax" style={{ fontSize: '0.75rem', color: '#0f766e', paddingLeft: 4 }}>
                                        {opt.option_text || <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>(Trống)</span>}
                                      </div>
                                    </div>
                                  </>
                                ) : (
                                  <>
                                    <div style={{
                                      width: 20, height: 20, borderRadius: '50%',
                                      border: isCorrect ? '2px solid #10b981' : '2px solid #cbd5e1',
                                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                                      background: isCorrect ? '#10b981' : 'transparent',
                                      color: isCorrect ? '#fff' : 'transparent',
                                      fontSize: '0.7rem', fontWeight: 900
                                    }}>
                                      ✓
                                    </div>
                                    <span style={{ fontWeight: 800, fontSize: '0.85rem', color: isCorrect ? '#047857' : '#475569' }}>{opt.key}.</span>
                                    <div className="mathjax" style={{ fontSize: '0.85rem', color: isCorrect ? '#065f46' : '#1e293b', fontWeight: 600 }}>
                                      {opt.option_text || <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>(Trống)</span>}
                                    </div>
                                  </>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {q.questionType === 'input_number' && (
                        <div style={{ marginTop: 12, background: '#f8fafc', padding: 10, borderRadius: 8, border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontWeight: 800, fontSize: '0.8rem', color: '#475569' }}>Đáp án đúng (Số):</span>
                          {editingTempIds[q.tempId] ? (
                            <input 
                              type="text"
                              className="form-control"
                              style={{ maxWidth: 200, padding: '2px 6px', fontSize: '0.8rem', height: 24 }}
                              value={q.options[0]?.option_value || ''}
                              onChange={e => updateOptionField(q.tempId, 'ANSWER', 'option_value', e.target.value)}
                            />
                          ) : (
                            <span style={{ fontWeight: 800, fontSize: '0.85rem', color: '#10b981', background: '#ecfdf5', padding: '2px 8px', borderRadius: 6, border: '1px solid #10b981' }}>
                              {q.options[0]?.option_value || <span style={{ fontStyle: 'italic', fontWeight: 'normal', color: '#94a3b8' }}>(Trống)</span>}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Submit Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, borderTop: '1px solid #e2e8f0', paddingTop: 20 }}>
                <button type="button" className="btn btn-ghost" onClick={() => setViewMode('list')}>Hủy bỏ</button>
                <button type="submit" className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Save size={16} /> Lưu đề thi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Render the unified import modal */}
      {isImportModalOpen && (
        <ImportExamModal
          isOpen={isImportModalOpen}
          onClose={() => setIsImportModalOpen(false)}
          subjects={subjects}
          onStartExtract={handleStartExtract}
        />
      )}
    </div>
  );
}
