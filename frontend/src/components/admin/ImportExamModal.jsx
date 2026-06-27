import React, { useState, useEffect } from 'react';
import { X, Upload, HelpCircle } from 'lucide-react';
import { getChapters, getLessons } from '../../api/subjects';
import { extractQuestionsFromDocx } from '../../utils/docxParser';
import { uploadFile } from '../../api/admin';

export default function ImportExamModal({ isOpen, onClose, subjects, onStartExtract }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [timeLimit, setTimeLimit] = useState(45);
  
  // Cascading location state
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [chapters, setChapters] = useState([]);
  const [selectedChapterId, setSelectedChapterId] = useState('');
  const [lessons, setLessons] = useState([]);
  const [selectedLessonId, setSelectedLessonId] = useState('');

  // File parsing states
  const [file, setFile] = useState(null);
  const [isParsing, setIsParsing] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Sync chapters when subject changes
  useEffect(() => {
    if (!selectedSubjectId) {
      setChapters([]);
      setSelectedChapterId('');
      setLessons([]);
      setSelectedLessonId('');
      return;
    }
    getChapters(selectedSubjectId)
      .then(res => {
        setChapters(res.data?.chapters || []);
        setSelectedChapterId('');
        setLessons([]);
        setSelectedLessonId('');
      })
      .catch(err => console.error('Lỗi tải chuyên đề:', err));
  }, [selectedSubjectId]);

  // Sync lessons when chapter changes
  useEffect(() => {
    if (!selectedChapterId) {
      setLessons([]);
      setSelectedLessonId('');
      return;
    }
    getLessons(selectedChapterId)
      .then(res => {
        setLessons(res.data?.lessons || []);
        setSelectedLessonId('');
      })
      .catch(err => console.error('Lỗi tải bài tập:', err));
  }, [selectedChapterId]);

  if (!isOpen) return null;

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setErrorMsg('');
    }
  };

  const uploadBase64Image = async (base64Data, index, type) => {
    try {
      const mimeM = base64Data.match(/^data:(image\/[^;]+);base64,/);
      const mime = mimeM ? mimeM[1] : 'image/png';
      const ext = mime.split('/')[1] || 'png';
      
      const base64Content = base64Data.replace(/^data:image\/[^;]+;base64,/, '');
      const binary = atob(base64Content);
      const len = binary.length;
      const u8arr = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        u8arr[i] = binary.charCodeAt(i);
      }
      
      const blob = new Blob([u8arr], { type: mime });
      const fileObj = new File([blob], `extracted_img_${index}_${type}.${ext}`, { type: mime });
      
      const res = await uploadFile(fileObj);
      if (res.data && res.data.success) {
        return res.data.fileUrl;
      }
      throw new Error('Upload failed');
    } catch (err) {
      console.error('Error uploading image:', err);
      return null;
    }
  };

  const handleExtract = async () => {
    if (!title.trim()) {
      setErrorMsg('Vui lòng nhập Tiêu đề đề thi!');
      return;
    }
    if (!selectedSubjectId) {
      setErrorMsg('Vui lòng chọn Khối lớp đích!');
      return;
    }
    if (!file) {
      setErrorMsg('Vui lòng chọn hoặc kéo thả file Word (.docx) chứa đề thi!');
      return;
    }

    setIsParsing(true);
    setErrorMsg('');

    try {
      // Parse file client-side
      const rawExtracted = await extractQuestionsFromDocx(file);
      if (!rawExtracted || rawExtracted.length === 0) {
        throw new Error('Không trích xuất được câu hỏi nào từ file Word. Vui lòng kiểm tra lại định dạng tệp!');
      }

      // Map raw questions from parser and upload images
      let tempId = 1;
      const mappedQuestions = [];

      for (let eqIdx = 0; eqIdx < rawExtracted.length; eqIdx++) {
        const eq = rawExtracted[eqIdx];
        
        // Upload images for the question
        const uploadedQuestionImages = [];
        if (eq.images && eq.images.length > 0) {
          for (let idx = 0; idx < eq.images.length; idx++) {
            const url = await uploadBase64Image(eq.images[idx], idx + eqIdx * 100, 'q');
            if (url) uploadedQuestionImages.push(url);
          }
        }

        // Upload solution images
        const uploadedSolImages = [];
        if (eq.sol_images && eq.sol_images.length > 0) {
          for (let idx = 0; idx < eq.sol_images.length; idx++) {
            const url = await uploadBase64Image(eq.sol_images[idx], idx + eqIdx * 100, 'sol');
            if (url) uploadedSolImages.push(url);
          }
        }

        if (eq.section === 'I') {
          mappedQuestions.push({
            tempId: tempId++,
            questionText: eq.qtext,
            questionType: 'single_choice',
            difficulty: 'medium',
            points: 10,
            selected: true,
            images: uploadedQuestionImages,
            sol_images: uploadedSolImages,
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
          });
        } else if (eq.section === 'II') {
          eq.tfStatements.forEach((stmt, idx) => {
            const ansVal = eq.answer?.vals?.[idx] || 'Đ';
            mappedQuestions.push({
              tempId: tempId++,
              questionText: `${eq.qtext}\n\n*) Phát biểu: ${stmt.key}) ${stmt.text}`,
              questionType: 'single_choice',
              difficulty: 'medium',
              points: 10,
              selected: true,
              images: uploadedQuestionImages,
              sol_images: uploadedSolImages,
              options: [
                { key: 'A', option_text: 'Đúng', is_correct: ansVal === 'Đ', option_value: '' },
                { key: 'B', option_text: 'Sai', is_correct: ansVal === 'S', option_value: '' }
              ]
            });
          });
        } else if (eq.section === 'III') {
          mappedQuestions.push({
            tempId: tempId++,
            questionText: eq.qtext,
            questionType: 'input_number',
            difficulty: 'medium',
            points: 10,
            selected: true,
            images: uploadedQuestionImages,
            sol_images: uploadedSolImages,
            options: [
              { key: 'ANSWER', option_text: 'Đáp án đúng', is_correct: true, option_value: eq.answer?.val || '' }
            ]
          });
        }
      }

      // Pass parsed metadata and questions back to ExamsTab
      onStartExtract({
        title: title.trim(),
        description: description.trim(),
        time_limit_minutes: Number(timeLimit),
        subject_id: Number(selectedSubjectId),
        chapter_id: selectedChapterId,
        lesson_id: selectedLessonId
      }, mappedQuestions);

      onClose();
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message || 'Lỗi khi trích xuất file Word.');
    } finally {
      setIsParsing(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(15, 23, 42, 0.6)',
      backdropFilter: 'blur(4px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1050,
      padding: 20
    }}>
      <div style={{
        background: '#fff',
        borderRadius: 24,
        width: '100%',
        maxWidth: 1000,
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        display: 'flex',
        flexDirection: 'column',
        maxHeight: '90vh',
        overflow: 'hidden',
        border: '1px solid #e2e8f0'
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '24px 32px',
          borderBottom: '1px solid #f1f5f9'
        }}>
          <h3 style={{ margin: 0, fontWeight: 900, color: '#1e293b', fontSize: '1.4rem', display: 'flex', alignItems: 'center', gap: 10 }}>
            📝 Nhập đề thi mới từ file Word (.docx)
          </h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: 4 }}>
            <X size={24} />
          </button>
        </div>

        {/* Body */}
        <div style={{
          padding: '32px',
          overflowY: 'auto',
          display: 'grid',
          gridTemplateColumns: '1.2fr 1fr',
          gap: 32,
          background: '#f8fafc'
        }}>
          
          {/* Left Column: Metadata & File upload */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontWeight: 800, fontSize: '0.85rem', color: '#475569' }}>TIÊU ĐỀ ĐỀ THI *</label>
              <input 
                type="text" 
                className="form-control"
                placeholder="VD: Đề thi khảo sát chất lượng môn Toán học kì 2"
                style={{ borderRadius: 10, padding: '10px 14px' }}
                value={title}
                onChange={e => setTitle(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontWeight: 800, fontSize: '0.85rem', color: '#475569' }}>MÔ TẢ NGẮN ĐỀ THI</label>
              <textarea 
                className="form-control"
                rows={2}
                placeholder="VD: Đề thi ôn tập đầy đủ các kiến thức lớp 12"
                style={{ borderRadius: 10, padding: '10px 14px', resize: 'none' }}
                value={description}
                onChange={e => setDescription(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontWeight: 800, fontSize: '0.85rem', color: '#475569' }}>CHỌN FILE WORD (.DOCX) *</label>
              <div style={{
                border: '2px dashed #cbd5e1',
                borderRadius: 16,
                background: '#fff',
                padding: '24px 20px',
                textAlign: 'center',
                cursor: 'pointer',
                position: 'relative',
                transition: 'all 0.2s'
              }}>
                <input 
                  type="file" 
                  accept=".docx" 
                  style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }}
                  onChange={handleFileChange}
                />
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                  <Upload size={28} color="#059669" />
                  {file ? (
                    <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0f766e' }}>{file.name}</span>
                  ) : (
                    <>
                      <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#475569' }}>Kéo thả hoặc nhấp để chọn file</span>
                      <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Chỉ hỗ trợ định dạng Microsoft Word (.docx)</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontWeight: 800, fontSize: '0.85rem', color: '#475569' }}>THỜI GIAN LÀM BÀI (PHÚT)</label>
              <input 
                type="number" 
                className="form-control"
                style={{ borderRadius: 10, padding: '10px 14px' }}
                value={timeLimit}
                onChange={e => setTimeLimit(Number(e.target.value))}
              />
            </div>
          </div>

          {/* Right Column: Cascading target location selects */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontWeight: 800, fontSize: '0.85rem', color: '#475569' }}>KHỐI LỚP *</label>
              <select 
                className="form-control"
                style={{ borderRadius: 10, padding: '10px 14px', height: 'auto' }}
                value={selectedSubjectId}
                onChange={e => setSelectedSubjectId(e.target.value)}
              >
                <option value="">-- Chọn lớp --</option>
                {subjects.map(s => (
                  <option key={s.id} value={s.id}>Lớp {s.grade}</option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontWeight: 800, fontSize: '0.85rem', color: '#475569' }}>BÀI HỌC (CHUYÊN ĐỀ LỚN)</label>
              <select 
                className="form-control"
                style={{ borderRadius: 10, padding: '10px 14px', height: 'auto' }}
                value={selectedChapterId}
                onChange={e => setSelectedChapterId(e.target.value)}
                disabled={!selectedSubjectId}
              >
                <option value="">-- Chọn bài học --</option>
                {chapters.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontWeight: 800, fontSize: '0.85rem', color: '#475569' }}>BÀI TẬP / ĐỀ THI ĐÍCH</label>
              <select 
                className="form-control"
                style={{ borderRadius: 10, padding: '10px 14px', height: 'auto' }}
                value={selectedLessonId}
                onChange={e => setSelectedLessonId(e.target.value)}
                disabled={!selectedChapterId}
              >
                <option value="">-- Chọn bài tập --</option>
                {lessons.map(l => (
                  <option key={l.id} value={l.id}>{l.title}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{
          display: 'flex',
          justifyContent: 'flex-end',
          alignItems: 'center',
          gap: 12,
          padding: '20px 32px',
          borderTop: '1px solid #f1f5f9',
          background: '#fff'
        }}>
          {errorMsg && (
            <span style={{ color: '#dc2626', fontSize: '0.85rem', marginRight: 'auto', fontWeight: 600 }}>⚠️ {errorMsg}</span>
          )}
          <button 
            type="button" 
            className="btn btn-ghost" 
            onClick={onClose} 
            disabled={isParsing}
            style={{ borderRadius: 10, padding: '10px 20px' }}
          >
            ĐÓNG LẠI
          </button>
          <button 
            type="button" 
            className="btn btn-primary"
            onClick={handleExtract}
            disabled={isParsing}
            style={{
              borderRadius: 10,
              padding: '10px 24px',
              background: '#059669',
              borderColor: '#059669',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: 8
            }}
          >
            {isParsing ? 'ĐANG TRÍCH XUẤT...' : 'BẮT ĐẦU TRÍCH XUẤT'}
          </button>
        </div>
      </div>
    </div>
  );
}
