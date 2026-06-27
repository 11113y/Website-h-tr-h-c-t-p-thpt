import React, { useState, useEffect } from 'react';
import { X, Upload, Check, Trash2, Edit2, Save, FileText, HelpCircle, ImagePlus, Trash } from 'lucide-react';
import { extractQuestionsFromDocx } from '../../utils/docxParser';
import * as adminApi from '../../api/admin';
import { getChapters } from '../../api/subjects';
import { useDialog } from '../../contexts/DialogContext';

export default function WordImportModal({
  isOpen,
  onClose,
  preselectedChapterId = null,
  subjects = [],
  onImportSuccess,
  inline = false
}) {
  const [file, setFile] = useState(null);
  const [isParsing, setIsParsing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState({ current: 0, total: 0 });
  const [questions, setQuestions] = useState([]);
  const [errorMsg, setErrorMsg] = useState('');

  // Batch states
  const [batchDifficulty, setBatchDifficulty] = useState('medium');
  const [batchPoints, setBatchPoints] = useState(10);
  const [batchType, setBatchType] = useState('single_choice');
  
  // Subject & Chapter selection
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [chapters, setChapters] = useState([]);
  const [selectedChapterId, setSelectedChapterId] = useState(preselectedChapterId || '');

  // Load chapters when subject changes
  useEffect(() => {
    if (selectedSubjectId) {
      getChapters(selectedSubjectId)
        .then(res => {
          setChapters(res.data?.chapters || []);
          if (res.data?.chapters?.length > 0 && !preselectedChapterId) {
            setSelectedChapterId(res.data.chapters[0].id);
          }
        })
        .catch(err => {
          console.error('Lỗi tải chuyên đề:', err);
        });
    } else {
      setChapters([]);
    }
  }, [selectedSubjectId]);

  // Sync preselectedChapterId
  useEffect(() => {
    if (preselectedChapterId) {
      setSelectedChapterId(preselectedChapterId);
    }
  }, [preselectedChapterId]);

  if (!isOpen && !inline) return null;

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
      
      const res = await adminApi.uploadFile(fileObj);
      if (res.data && res.data.success) {
        return res.data.fileUrl;
      }
      throw new Error('Upload failed');
    } catch (err) {
      console.error('Error uploading image:', err);
      return null;
    }
  };

  const handleFileChange = async (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;
    
    setFile(selectedFile);
    setIsParsing(true);
    setErrorMsg('');
    setQuestions([]);

    try {
      const extracted = await extractQuestionsFromDocx(selectedFile);
      
      // Map extracted questions to our standard format
      const mapped = [];
      let tempIdCounter = 1;

      for (let eqIdx = 0; eqIdx < extracted.length; eqIdx++) {
        const eq = extracted[eqIdx];

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
          mapped.push({
            tempId: tempIdCounter++,
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
          // If Section II (True/False list of statements)
          if (eq.tfStatements && eq.tfStatements.length > 0) {
            eq.tfStatements.forEach((stmt, idx) => {
              const ansVal = eq.answer?.vals?.[idx] || 'Đ'; // Default Đúng
              mapped.push({
                tempId: tempIdCounter++,
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
          }
        } else if (eq.section === 'III') {
          // Section III (Short Fill-in Answer)
          mapped.push({
            tempId: tempIdCounter++,
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

      setQuestions(mapped);
      setEditingTempIds({});
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message || 'Lỗi khi giải nén hoặc phân tích file docx.');
    } finally {
      setIsParsing(false);
    }
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
        setQuestions(prev => prev.map(q => {
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
        setQuestions(prev => prev.map(q => {
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
    setQuestions(prev => prev.map(q => {
      if (q.tempId !== tempId) return q;
      const nextImages = (q.images || []).filter((_, idx) => idx !== imgIdx);
      return { ...q, images: nextImages };
    }));
  };

  // Toggle selection
  const toggleSelectQuestion = (tempId) => {
    setQuestions(prev => prev.map(q => q.tempId === tempId ? { ...q, selected: !q.selected } : q));
  };

  // Update single field of a question
  const updateQuestionField = (tempId, field, value) => {
    setQuestions(prev => prev.map(q => q.tempId === tempId ? { ...q, [field]: value } : q));
  };

  // Update option of a question
  const updateOptionField = (tempId, optIndex, field, value) => {
    setQuestions(prev => prev.map(q => {
      if (q.tempId !== tempId) return q;
      const nextOptions = [...q.options];
      nextOptions[optIndex] = { ...nextOptions[optIndex], [field]: value };
      return { ...q, options: nextOptions };
    }));
  };

  // Set correct option for single choice
  const setCorrectOption = (tempId, optIndex) => {
    setQuestions(prev => prev.map(q => {
      if (q.tempId !== tempId) return q;
      const nextOptions = q.options.map((opt, idx) => ({
        ...opt,
        is_correct: idx === optIndex
      }));
      return { ...q, options: nextOptions };
    }));
  };

  // Update question type and sync options shape
  const updateQuestionType = (tempId, nextType) => {
    setQuestions(prev => prev.map(q => {
      if (q.tempId !== tempId) return q;
      if (q.questionType === nextType) return q;
      const nextOptions = nextType === 'input_number'
        ? [{ key: 'ANSWER', option_text: 'Đáp án đúng', is_correct: true, option_value: '' }]
        : [
            { key: 'A', option_text: '', is_correct: false, option_value: '' },
            { key: 'B', option_text: '', is_correct: false, option_value: '' },
            { key: 'C', option_text: '', is_correct: false, option_value: '' },
            { key: 'D', option_text: '', is_correct: false, option_value: '' }
          ];
      return { ...q, questionType: nextType, options: nextOptions };
    }));
  };

  // Batch Apply Methods
  const applyBatchDifficulty = () => {
    setQuestions(prev => prev.map(q => ({ ...q, difficulty: batchDifficulty })));
  };

  const applyBatchPoints = () => {
    setQuestions(prev => prev.map(q => ({ ...q, points: Number(batchPoints || 10) })));
  };

  const applyBatchType = () => {
    setQuestions(prev => prev.map(q => {
      const nextOptions = batchType === 'input_number'
        ? [{ key: 'ANSWER', option_text: 'Đáp án đúng', is_correct: true, option_value: '' }]
        : [
            { key: 'A', option_text: '', is_correct: false, option_value: '' },
            { key: 'B', option_text: '', is_correct: false, option_value: '' },
            { key: 'C', option_text: '', is_correct: false, option_value: '' },
            { key: 'D', option_text: '', is_correct: false, option_value: '' }
          ];
      return { ...q, questionType: batchType, options: nextOptions };
    }));
  };

  // Remove question from list
  const removeQuestion = (tempId) => {
    setQuestions(prev => prev.filter(q => q.tempId !== tempId));
  };

  // Submit to Server
  const handleImportSubmit = async () => {
    if (!selectedChapterId) {
      alert('Vui lòng chọn Chuyên đề đích!');
      return;
    }

    const selectedQuestions = questions.filter(q => q.selected);
    if (selectedQuestions.length === 0) {
      alert('Vui lòng chọn ít nhất một câu hỏi để nhập!');
      return;
    }

    setIsImporting(true);
    setImportProgress({ current: 0, total: selectedQuestions.length });

    const importedIds = [];
    let successCount = 0;

    for (let i = 0; i < selectedQuestions.length; i++) {
      const q = selectedQuestions[i];
      try {
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

        const res = await adminApi.createQuestion({
          chapter_id: selectedChapterId,
          question_text: q.questionText,
          question_type: q.questionType,
          difficulty: q.difficulty,
          points: Number(q.points || 10),
          options: opts,
          images: q.images || [],
          sol_images: q.sol_images || []
        });

        if (res.data?.success && res.data?.id) {
          importedIds.push(res.data.id);
          successCount++;
        }
      } catch (err) {
        console.error('Lỗi khi nhập câu hỏi:', q, err);
      }
      setImportProgress(prev => ({ ...prev, current: i + 1 }));
    }

    setIsImporting(false);
    alert(`Nhập thành công ${successCount}/${selectedQuestions.length} câu hỏi vào hệ thống!`);
    
    if (onImportSuccess) {
      onImportSuccess(importedIds, selectedChapterId);
    }
    onClose();
  };

  const content = (
    <div className={inline ? "" : "modal"} style={inline ? {
      width: '100%',
      background: '#fff',
      borderRadius: 20,
      border: '1px solid #cbd5e1',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      height: '80vh'
    } : { maxWidth: '1000px', width: '95vw', height: '90vh', display: 'flex', flexDirection: 'column' }}>
      
      {/* Modal Header */}
      <div className="modal-header" style={{
        padding: '16px 24px',
        borderBottom: '1px solid #e2e8f0',
        background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
        color: '#fff',
        borderRadius: inline ? '20px 20px 0 0' : undefined,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div>
          <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: 8 }}>
            <FileText size={20} />
            Trích xuất câu hỏi từ Microsoft Word (.docx)
          </h3>
          <span style={{ fontSize: '0.8rem', opacity: 0.9 }}>Tự động phân tách trắc nghiệm, đúng sai và điền số</span>
        </div>
        <button 
          onClick={onClose} 
          style={{ background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: '50%', color: '#fff', width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s' }}
          className="hover-scale"
        >
          <X size={18} />
        </button>
      </div>

      {/* Modal Body */}
        <div className="modal-body" style={{ flex: 1, overflowY: 'auto', padding: '20px', background: '#f8fafc', display: 'flex', flexDirection: 'column', gap: 16 }}>
          
          {/* Target Location Selection - Hidden if inline is true */}
          {!inline && (
            <div style={{ background: '#fff', padding: 16, borderRadius: 12, border: '1px solid #e2e8f0', display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center' }}>
              <span style={{ fontWeight: 800, fontSize: '0.9rem', color: '#1e293b' }}>Đích nhập câu hỏi:</span>
              
              {preselectedChapterId ? (
                <div style={{ background: '#e0f2fe', color: '#0369a1', padding: '6px 12px', borderRadius: 8, fontSize: '0.85rem', fontWeight: 700 }}>
                  Nhập vào Chuyên đề hiện tại (ID: {preselectedChapterId})
                </div>
              ) : (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: '0.85rem', color: '#64748b' }}>Bài học:</span>
                    <select 
                      className="form-control"
                      style={{ minWidth: 180, padding: '6px 10px', fontSize: '0.85rem' }}
                      value={selectedSubjectId}
                      onChange={e => setSelectedSubjectId(e.target.value)}
                    >
                      <option value="">-- Chọn Bài học --</option>
                      {subjects.map(sub => (
                        <option key={sub.id} value={sub.id}>{sub.name}</option>
                      ))}
                    </select>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: '0.85rem', color: '#64748b' }}>Chuyên đề:</span>
                    <select 
                      className="form-control"
                      style={{ minWidth: 200, padding: '6px 10px', fontSize: '0.85rem' }}
                      value={selectedChapterId}
                      onChange={e => setSelectedChapterId(e.target.value)}
                      disabled={!selectedSubjectId}
                    >
                      <option value="">-- Chọn Chuyên đề --</option>
                      {chapters.map(ch => (
                        <option key={ch.id} value={ch.id}>{ch.name}</option>
                      ))}
                    </select>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Upload Dropzone */}
          {questions.length === 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, flex: 1, justifyContent: 'center' }}>
              {inline && !preselectedChapterId ? (
                <div 
                  style={{ 
                    border: '2px dashed #cbd5e1', 
                    borderRadius: 16, 
                    background: '#f8fafc', 
                    padding: '60px 20px', 
                    textAlign: 'center',
                  }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#fffbeb', color: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <HelpCircle size={32} />
                    </div>
                    <div>
                      <h4 style={{ margin: '0 0 4px 0', color: '#b45309', fontWeight: 800 }}>Chưa chọn Bài học đích</h4>
                      <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b' }}>Vui lòng chọn <strong>Lớp</strong> và <strong>Bài học</strong> ở bộ lọc phía trên để bắt đầu tải file Word.</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div 
                  style={{ 
                    border: '2px dashed #cbd5e1', 
                    borderRadius: 16, 
                    background: '#fff', 
                    padding: '40px 20px', 
                    textAlign: 'center', 
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    position: 'relative'
                  }}
                  className="hover-shadow"
                >
                  <input 
                    type="file" 
                    accept=".docx" 
                    style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }} 
                    onChange={handleFileChange}
                    disabled={isParsing}
                  />
                  
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#ecfdf5', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Upload size={32} />
                    </div>
                    {isParsing ? (
                      <div>
                        <h4 style={{ margin: '0 0 4px 0', color: '#1e293b' }}>Đang phân tích file Word...</h4>
                        <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b' }}>Vui lòng đợi giây lát, hệ thống đang giải nén và phân tách đề thi</p>
                      </div>
                    ) : (
                      <div>
                        <h4 style={{ margin: '0 0 4px 0', color: '#1e293b' }}>Nhấp hoặc kéo thả file Word (.docx) vào đây</h4>
                        <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b' }}>File tải lên phải chứa định dạng đề thi chuẩn</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {errorMsg && (
                <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b', padding: '12px 16px', borderRadius: 8, fontSize: '0.85rem' }}>
                  {errorMsg}
                </div>
              )}

              {/* Formatting Guide */}
              <div style={{ background: '#fff', borderRadius: 12, padding: 20, border: '1px solid #e2e8f0' }}>
                <h5 style={{ margin: '0 0 10px 0', color: '#1e293b', fontWeight: 800, fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <HelpCircle size={16} color="#059669" />
                  Hướng dẫn định dạng file Word (.docx) trích xuất:
                </h5>
                <ul style={{ margin: 0, paddingLeft: 20, fontSize: '0.8rem', color: '#475569', lineHeight: 1.6 }}>
                  <li><strong>Câu hỏi thường:</strong> Đặt tiêu đề bắt đầu bằng <code style={{ background: '#f1f5f9', padding: '2px 4px', borderRadius: 4 }}>Câu X.</code> (ví dụ: Câu 1.)</li>
                  <li><strong>Phương án lựa chọn:</strong> Soạn thảo các lựa chọn bắt đầu bằng <code style={{ background: '#f1f5f9', padding: '2px 4px', borderRadius: 4 }}>A.</code>, <code style={{ background: '#f1f5f9', padding: '2px 4px', borderRadius: 4 }}>B.</code>, <code style={{ background: '#f1f5f9', padding: '2px 4px', borderRadius: 4 }}>C.</code>, <code style={{ background: '#f1f5f9', padding: '2px 4px', borderRadius: 4 }}>D.</code> trên cùng một hàng (ngăn cách bằng phím Tab) hoặc mỗi phương án một dòng mới.</li>
                  <li><strong>Đáp án trắc nghiệm:</strong> Viết rõ chữ <code style={{ background: '#f1f5f9', padding: '2px 4px', borderRadius: 4 }}>Đáp án: A</code> (hoặc B, C, D) có tô nền màu vàng hoặc chữ màu đỏ để bộ máy nhận diện chuẩn xác.</li>
                  <li><strong>Đúng/Sai (Phần II):</strong> Nhận diện các câu hỏi Đúng/Sai gồm các mệnh đề a), b), c), d).</li>
                  <li><strong>Điền số (Phần III):</strong> Nhập đáp án số sau nhãn <code style={{ background: '#f1f5f9', padding: '2px 4px', borderRadius: 4 }}>Đáp án: 3.14</code>.</li>
                </ul>
              </div>
            </div>
          )}

          {/* List of Parsed Questions */}
          {questions.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Thiết lập nhanh hàng loạt */}
              <div style={{ background: '#f1f5f9', padding: 16, borderRadius: 12, border: '1px solid #cbd5e1', display: 'flex', flexDirection: 'column', gap: 12 }}>
                <span style={{ fontWeight: 800, fontSize: '0.85rem', color: '#1e293b' }}>⚙️ Thiết lập nhanh hàng loạt (Áp dụng cho toàn bộ câu hỏi):</span>
                <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', alignItems: 'center' }}>
                  
                  {/* Loại câu hỏi */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: '0.8rem', color: '#475569', fontWeight: 600 }}>Loại câu hỏi:</span>
                    <select 
                      className="form-control"
                      style={{ padding: '2px 8px', fontSize: '0.8rem', height: 28, minWidth: 120 }}
                      value={batchType}
                      onChange={e => setBatchType(e.target.value)}
                    >
                      <option value="single_choice">Trắc nghiệm</option>
                      <option value="input_number">Điền số</option>
                    </select>
                    <button 
                      type="button" 
                      onClick={applyBatchType}
                      className="btn btn-primary"
                      style={{ padding: '3px 10px', fontSize: '0.75rem', height: 28, minHeight: 'auto' }}
                    >
                      Áp dụng
                    </button>
                  </div>


                  {/* Điểm số */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: '0.8rem', color: '#475569', fontWeight: 600 }}>Điểm:</span>
                    <input 
                      type="number"
                      className="form-control"
                      style={{ padding: '2px 6px', fontSize: '0.8rem', width: 60, height: 28 }}
                      value={batchPoints}
                      onChange={e => setBatchPoints(e.target.value)}
                    />
                    <button 
                      type="button" 
                      onClick={applyBatchPoints}
                      className="btn btn-primary"
                      style={{ padding: '3px 10px', fontSize: '0.75rem', height: 28, minHeight: 'auto' }}
                    >
                      Áp dụng
                    </button>
                  </div>

                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.85rem', color: '#475569', fontWeight: 600 }}>
                  Đã phân tích được <strong>{questions.length}</strong> câu hỏi. Chọn các câu hỏi muốn lưu:
                </span>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button 
                    type="button" 
                    className="btn btn-ghost btn-xs"
                    onClick={() => setQuestions(prev => prev.map(q => ({ ...q, selected: true })))}
                  >
                    Chọn tất cả
                  </button>
                  <button 
                    type="button" 
                    className="btn btn-ghost btn-xs"
                    onClick={() => setQuestions(prev => prev.map(q => ({ ...q, selected: false })))}
                  >
                    Bỏ chọn tất cả
                  </button>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {questions.map((q, idx) => (
                  <div 
                    key={q.tempId} 
                    style={{ 
                      background: '#fff', 
                      borderRadius: 12, 
                      border: q.selected ? '2px solid #10b981' : '1px solid #cbd5e1', 
                      padding: 16,
                      boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                      transition: 'all 0.2s',
                      opacity: q.selected ? 1 : 0.7
                    }}
                  >
                    {/* Question Header Card */}
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
                          <option value="single_choice" style={{ background: '#fff', color: '#1e293b' }}>Trắc nghiệm</option>
                          <option value="input_number" style={{ background: '#fff', color: '#1e293b' }}>Điền số</option>
                        </select>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>

                        {/* Points */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Điểm:</span>
                          <input 
                            type="number"
                            className="form-control"
                            style={{ padding: '2px 6px', fontSize: '0.8rem', width: 50, height: 26 }}
                            value={q.points}
                            onChange={e => updateQuestionField(q.tempId, 'points', e.target.value)}
                          />
                        </div>

                        {/* Edit Card Button */}
                        <button 
                          type="button" 
                          style={{ background: 'none', border: 'none', color: editingTempIds[q.tempId] ? '#10b981' : '#3b82f6', cursor: 'pointer', padding: 4, marginLeft: 8 }}
                          onClick={() => toggleEditQuestion(q.tempId)}
                          title={editingTempIds[q.tempId] ? "Xong" : "Sửa câu hỏi"}
                        >
                          {editingTempIds[q.tempId] ? <Check size={16} /> : <Edit2 size={16} />}
                        </button>

                        {/* Delete Card */}
                        <button 
                          type="button" 
                          style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: 4 }}
                          onClick={() => removeQuestion(q.tempId)}
                          title="Xóa câu hỏi này khỏi danh sách xem trước"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>

                    {/* Question Content */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {editingTempIds[q.tempId] ? (
                        <>
                          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569' }}>Đề bài:</span>
                          <textarea
                            className="form-control"
                            rows={2}
                            style={{ fontSize: '0.85rem', width: '100%', resize: 'vertical' }}
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
                        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 8 }}>
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
                          <div style={{ marginTop: 8, marginBottom: 8 }}>
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
                        <div style={{ marginTop: 8 }}>
                          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>Hình ảnh lời giải:</span>
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
                    </div>

                    {/* Options Form / Choices list */}
                    {q.questionType === 'single_choice' && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 12 }}>
                        {editingTempIds[q.tempId] ? (
                          <>
                            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569' }}>Các phương án lựa chọn (Chọn nút tròn để cài đáp án ĐÚNG):</span>
                            {q.options.map((opt, oIdx) => (
                              <div key={opt.key} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <input 
                                  type="radio" 
                                  name={`correct-docx-opt-${q.tempId}`} 
                                  checked={opt.is_correct} 
                                  onChange={() => setCorrectOption(q.tempId, oIdx)}
                                  style={{ cursor: 'pointer' }}
                                />
                                <span style={{ fontSize: '0.8rem', fontWeight: 700 }}>{opt.key}:</span>
                                <div className="no-mathjax" style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
                                  <input 
                                    className="form-control" 
                                    style={{ flex: 1, padding: '4px 8px', fontSize: '0.8rem', width: '100%' }}
                                    value={opt.option_text}
                                    onChange={e => updateOptionField(q.tempId, oIdx, 'option_text', e.target.value)}
                                  />
                                  <div className="mathjax" style={{ fontSize: '0.75rem', color: '#0f766e', paddingLeft: 4 }}>
                                    {opt.option_text || <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>(Trống)</span>}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </>
                        ) : (
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 6 }}>
                            {q.options.map((opt, oIdx) => {
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
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}

                    {q.questionType === 'input_number' && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 12 }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569' }}>Đáp án số đúng:</span>
                        {editingTempIds[q.tempId] ? (
                          <input 
                            className="form-control" 
                            placeholder="Ví dụ: 3.14"
                            style={{ padding: '6px 12px', fontSize: '0.85rem', maxWidth: 200 }}
                            value={q.options[0]?.option_value || ''}
                            onChange={e => updateOptionField(q.tempId, 0, 'option_value', e.target.value)}
                          />
                        ) : (
                          <span style={{ fontWeight: 800, fontSize: '0.85rem', color: '#10b981', background: '#ecfdf5', padding: '4px 12px', borderRadius: 6, border: '1px solid #10b981', display: 'inline-block', width: 'fit-content' }}>
                            {q.options[0]?.option_value || <span style={{ fontStyle: 'italic', fontWeight: 'normal', color: '#94a3b8' }}>(Trống)</span>}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="modal-footer" style={{ padding: '16px 24px', borderTop: '1px solid #e2e8f0', background: '#fff', borderRadius: '0 0 16px 16px' }}>
          {isImporting ? (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ flex: 1, height: 8, background: '#e2e8f0', borderRadius: 4, overflow: 'hidden' }}>
                <div 
                  style={{ 
                    height: '100%', 
                    background: '#10b981', 
                    width: `${(importProgress.current / importProgress.total) * 100}%`,
                    transition: 'width 0.2s ease-in-out' 
                  }}
                />
              </div>
              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#475569', minWidth: 80, textAlign: 'right' }}>
                {importProgress.current} / {importProgress.total} câu
              </span>
            </div>
          ) : (
            <button 
              type="button" 
              className="btn btn-ghost" 
              onClick={() => {
                setQuestions([]);
                setFile(null);
                onClose();
              }}
              style={{ padding: '8px 16px', fontSize: '0.85rem' }}
            >
              Hủy bỏ
            </button>
          )}

          {questions.length > 0 && (
            <button 
              type="button" 
              className="btn btn-primary"
              disabled={isImporting || !selectedChapterId}
              onClick={handleImportSubmit}
              style={{ 
                padding: '8px 20px', 
                fontSize: '0.85rem', 
                background: '#10b981', 
                borderColor: '#10b981', 
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                gap: 6
              }}
            >
              {isImporting ? 'Đang nhập...' : `Nhập ${questions.filter(q => q.selected).length} câu hỏi`}
            </button>
          )}
        </div>

      </div>
    );

    if (inline) {
      return content;
    }

    return (
      <div className="modal-overlay" style={{ background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(6px)' }}>
        {content}
      </div>
    );
}
