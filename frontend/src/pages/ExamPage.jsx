import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getExamDetail, submitExam } from '../api/exams';
import { useAuth } from '../contexts/AuthContext';
import { Clock, ChevronLeft, ChevronRight, Send, AlertTriangle, BookOpen, Bookmark } from 'lucide-react';
import { renderMathText } from './QuizPage';

const LABELS = ['A','B','C','D','E','F'];

// Wrap in stable component so React always reconciles against a single <span> root
// (avoids removeChild crash when mixed string+element arrays change between renders)
const MathText = ({ text }) => {
  if (!text) return null;
  return <span>{renderMathText(text)}</span>;
};

export default function ExamPage({ isLoggedIn: isLoggedInProp, savedQuestions = [], toggleSaveQuestion }) {
  const { examId } = useParams();
  const navigate = useNavigate();
  const { isLoggedIn: authIsLoggedIn } = useAuth();
  const isLoggedIn = isLoggedInProp !== undefined ? isLoggedInProp : authIsLoggedIn;
  const [exam, setExam] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [current, setCurrent] = useState(0);
  const [timeLeft, setTimeLeft] = useState(5400);
  const [started, setStarted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showConfirm, setShowConfirm] = useState(false);
  const timerRef = useRef(null);
  const mainRef = useRef(null);

  useEffect(() => {
    getExamDetail(examId).then(res => {
      const examData = res.data?.exam || res.data;
      const questionsData = res.data?.questions || [];
      setExam(examData);
      setQuestions(questionsData);
      setTimeLeft((examData?.time_limit_minutes || 90) * 60);
    }).catch(() => {}).finally(() => setLoading(false));
    return () => clearInterval(timerRef.current);
  }, [examId]);

  const startExam = () => {
    setStarted(true);
    timerRef.current = setInterval(() => {
      setTimeLeft(p => {
        if (p <= 1) { clearInterval(timerRef.current); handleSubmit(true); return 0; }
        return p - 1;
      });
    }, 1000);
  };

  const goTo = (idx) => {
    setCurrent(idx);
    mainRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectOption = (optId) => {
    if (!started) return;
    setAnswers(prev => ({ ...prev, [current]: { type: 'option', value: optId } }));
  };

  const handleInputChange = (val) => {
    if (!started) return;
    setAnswers(prev => ({ ...prev, [current]: { type: 'input', value: val } }));
  };

  const handleSubmit = async (auto = false) => {
    clearInterval(timerRef.current);
    setShowConfirm(false);
    setSubmitting(true);
    const answersList = questions.map((q, i) => {
      const ans = answers[i];
      return {
        question_id: q.id,
        selected_option_id: ans?.type === 'option' ? ans.value : null,
        input_value: ans?.type === 'input' ? String(ans.value) : null,
      };
    });
    const timeSpent = (exam?.time_limit_minutes || 90) * 60 - timeLeft;
    try {
      const res = await submitExam(examId, { answers: answersList, time_spent_seconds: timeSpent });
      const resultData = res.data?.result || res.data;
      navigate(`/exams/${examId}/result`, { state: { result: resultData, questions, answers } });
    } catch {
      alert('Nộp bài thất bại, vui lòng thử lại');
    } finally {
      setSubmitting(false);
    }
  };

  const fmt = s => `${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`;
  const answered = Object.keys(answers).length;
  const q = questions[current];
  const urgent = timeLeft < 300;

  if (loading) return <div className="page-loading"><div className="spinner"/></div>;
  if (!exam) return <div className="container" style={{padding:'60px 0',textAlign:'center'}}>Không tìm thấy đề thi</div>;

  /* ── START SCREEN ── */
  if (!started) return (
    <div style={{ minHeight:'80vh', display:'flex', alignItems:'center', justifyContent:'center', padding:'24px 16px' }}>
      <div style={{ maxWidth:520, width:'100%', textAlign:'center' }}>
        <div style={{ width:80, height:80, background:'linear-gradient(135deg,#6366f1,#8b5cf6)', borderRadius:20, display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 20px', boxShadow:'0 8px 24px #6366f140' }}>
          <BookOpen size={36} color="#fff"/>
        </div>
        <h1 style={{ fontSize:'1.6rem', fontWeight:900, color:'var(--text)', marginBottom:8 }}>{exam.title}</h1>
        <p style={{ color:'var(--text-muted)', marginBottom:24 }}>{exam.description || 'Đề kiểm tra trắc nghiệm'}</p>
        <div style={{ display:'flex', justifyContent:'center', gap:16, marginBottom:28 }}>
          {[
            { icon:'⏱️', label:`${exam.time_limit_minutes || 90} phút` },
            { icon:'📋', label:`${questions.length} câu hỏi` },
          ].map((item,i) => (
            <div key={i} style={{ padding:'10px 20px', background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:12, fontWeight:700, color:'var(--text)', fontSize:'0.9rem' }}>
              {item.icon} {item.label}
            </div>
          ))}
        </div>
        {!isLoggedIn && (
          <div style={{ display:'flex', alignItems:'center', gap:8, padding:'12px 16px', background:'#fef9c3', border:'1px solid #fde047', borderRadius:12, marginBottom:20, textAlign:'left', fontSize:'0.85rem', color:'#854d0e' }}>
            <AlertTriangle size={16}/> Bạn chưa đăng nhập. Kết quả sẽ không được lưu.
          </div>
        )}
        <button className="btn btn-primary btn-lg" style={{ width:'100%', justifyContent:'center', fontSize:'1rem' }} onClick={startExam}>
          Bắt đầu làm bài →
        </button>
      </div>
    </div>
  );

  /* ── EXAM LAYOUT ── */
  return (
    <div className="exam-taking-layout" style={{ display:'flex', height:'calc(100vh - 60px)', overflow:'hidden', background:'var(--bg)' }}>

      {/* ── MAIN CONTENT ── */}
      <div ref={mainRef} className="exam-taking-main" style={{ flex:1, overflowY:'auto', padding:'24px 28px' }}>
        {q && (
          <div style={{ maxWidth:780, margin:'0 auto' }}>
            {/* Question header */}
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:10, marginBottom:20 }}>
              <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                <span style={{ background:'linear-gradient(135deg,#6366f1,#8b5cf6)', color:'#fff', fontWeight:800, fontSize:'0.8rem', padding:'4px 12px', borderRadius:20 }}>
                  Câu {current+1}/{questions.length}
                </span>
                {q.points && <span style={{ background:'var(--bg-card)', border:'1px solid var(--border)', color:'var(--text-muted)', fontWeight:700, fontSize:'0.8rem', padding:'4px 10px', borderRadius:20 }}>{q.points} điểm</span>}
                {q.question_type === 'input_number' && <span style={{ background:'#fef3c7', border:'1px solid #fcd34d', color:'#92400e', fontWeight:700, fontSize:'0.75rem', padding:'4px 10px', borderRadius:20 }}>Điền số</span>}
              </div>
              {isLoggedIn && (
                <button
                  onClick={() => toggleSaveQuestion && toggleSaveQuestion(q.id)}
                  style={{
                    border: 'none',
                    background: 'none',
                    padding: '6px',
                    borderRadius: '50%',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.2s',
                    color: savedQuestions.includes(q.id) ? '#6366f1' : '#94a3b8',
                    backgroundColor: savedQuestions.includes(q.id) ? '#eef2ff' : 'transparent',
                  }}
                  title={savedQuestions.includes(q.id) ? "Bỏ lưu câu hỏi" : "Lưu câu hỏi"}
                >
                  <Bookmark size={20} className={savedQuestions.includes(q.id) ? "fill-current" : ""} />
                </button>
              )}
            </div>

            {/* Question card — key=current forces full remount on question change */}
            <div key={current} style={{ background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:16, padding:'28px 28px 24px', marginBottom:20, boxShadow:'0 2px 12px rgba(0,0,0,0.04)' }}>
              {/* Question text */}
              <div style={{ fontSize:'1rem', fontWeight:600, lineHeight:1.8, color:'var(--text)', marginBottom: q.images?.length ? 16 : 0 }}>
                <MathText text={q.question_text} />
              </div>

              {/* Images */}
              {q.images?.length > 0 && (
                <div style={{ display:'flex', gap:12, flexWrap:'wrap', margin:'16px 0' }}>
                  {q.images.map((src,i) => (
                    <img key={i} src={src} alt="" style={{ maxWidth:'100%', maxHeight:320, borderRadius:10, border:'1px solid var(--border)', objectFit:'contain' }}/>
                  ))}
                </div>
              )}

              {/* Options — single_choice */}
              {q.question_type !== 'input_number' && (
                <div style={{ display:'flex', flexDirection:'column', gap:10, marginTop:20 }}>
                  {(q.options || []).map((opt, oi) => {
                    const optId = opt.id || opt.key;
                    const isSelected = answers[current]?.value === optId;
                    return (
                      <button
                        key={oi}
                        onClick={() => handleSelectOption(optId)}
                        style={{
                          display:'flex', alignItems:'center', gap:14,
                          padding:'13px 18px', borderRadius:12, cursor:'pointer',
                          border: isSelected ? '2px solid #6366f1' : '1.5px solid var(--border)',
                          background: isSelected ? '#eef2ff' : 'var(--bg)',
                          textAlign:'left', transition:'all 0.15s', width:'100%'
                        }}
                      >
                        <span style={{
                          width:32, height:32, borderRadius:8, flexShrink:0,
                          display:'flex', alignItems:'center', justifyContent:'center',
                          fontWeight:800, fontSize:'0.85rem',
                          background: isSelected ? '#6366f1' : 'var(--bg-card)',
                          color: isSelected ? '#fff' : 'var(--text-muted)',
                          border: isSelected ? 'none' : '1.5px solid var(--border)',
                        }}>
                          {LABELS[oi]}
                        </span>
                        <span style={{ flex:1, fontSize:'0.95rem', fontWeight:500, lineHeight:1.6, color: isSelected ? '#3730a3' : 'var(--text)' }}>
                          <MathText text={opt.option_text || opt.text || ''} />
                        </span>
                        {isSelected && <span style={{ color:'#6366f1', fontWeight:800, fontSize:'1rem' }}>✓</span>}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Input — input_number */}
              {q.question_type === 'input_number' && (
                <div style={{ marginTop:20 }}>
                  <label style={{ display:'block', fontWeight:700, color:'var(--text-muted)', fontSize:'0.85rem', marginBottom:8 }}>Nhập đáp án của bạn:</label>
                  <input
                    type="text"
                    placeholder="Nhập số..."
                    value={answers[current]?.value || ''}
                    onChange={e => handleInputChange(e.target.value)}
                    style={{
                      width:'100%', maxWidth:240, padding:'12px 16px', borderRadius:10,
                      border:'2px solid var(--border)', fontSize:'1.1rem', fontWeight:700,
                      outline:'none', color:'var(--text)', background:'var(--bg)',
                      transition:'border-color 0.2s',
                    }}
                    onFocus={e => e.target.style.borderColor='#6366f1'}
                    onBlur={e => e.target.style.borderColor='var(--border)'}
                  />
                </div>
              )}
            </div>

            {/* Navigation */}
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <button className="btn btn-ghost" onClick={() => goTo(Math.max(0, current-1))} disabled={current===0}>
                <ChevronLeft size={16}/> Câu trước
              </button>
              <span style={{ fontSize:'0.8rem', color:'var(--text-muted)', fontWeight:600 }}>
                {answered} / {questions.length} đã trả lời
              </span>
              {current < questions.length-1 ? (
                <button className="btn btn-primary" onClick={() => goTo(current+1)}>
                  Câu tiếp <ChevronRight size={16}/>
                </button>
              ) : (
                <button className="btn btn-accent" onClick={() => setShowConfirm(true)}>
                  <Send size={15}/> Nộp bài
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── SIDEBAR ── */}
      <div className="exam-taking-sidebar" style={{ width:260, flexShrink:0, background:'var(--bg-card)', borderLeft:'1px solid var(--border)', display:'flex', flexDirection:'column', overflow:'hidden' }}>
        {/* Timer */}
        <div style={{ padding:'16px 16px 12px', borderBottom:'1px solid var(--border)' }}>
          <div style={{
            display:'flex', alignItems:'center', justifyContent:'center', gap:8,
            padding:'10px 0', borderRadius:12, fontWeight:900, fontSize:'1.4rem',
            background: urgent ? '#fef2f2' : '#eef2ff',
            color: urgent ? '#dc2626' : '#6366f1',
            letterSpacing:'2px',
          }}>
            <Clock size={18}/> {fmt(timeLeft)}
          </div>
          {urgent && <p style={{ textAlign:'center', fontSize:'0.75rem', color:'#dc2626', fontWeight:700, marginTop:6 }}>⚠️ Sắp hết giờ!</p>}
          <div style={{ display:'flex', justifyContent:'space-between', fontSize:'0.8rem', color:'var(--text-muted)', fontWeight:600, marginTop:10 }}>
            <span>Đã làm: <strong style={{color:'var(--text)'}}>{answered}</strong></span>
            <span>Còn lại: <strong style={{color:'var(--text)'}}>{questions.length - answered}</strong></span>
          </div>
          {/* Progress bar */}
          <div style={{ height:6, background:'var(--border)', borderRadius:4, marginTop:8, overflow:'hidden' }}>
            <div style={{ height:'100%', width:`${questions.length ? (answered/questions.length*100) : 0}%`, background:'linear-gradient(90deg,#6366f1,#8b5cf6)', borderRadius:4, transition:'width 0.3s' }}/>
          </div>
        </div>

        {/* Question grid */}
        <div className="exam-question-map" style={{ flex:1, overflowY:'auto', padding:'14px 12px' }}>
          <p style={{ fontSize:'0.75rem', color:'var(--text-muted)', fontWeight:700, marginBottom:10, letterSpacing:'0.5px', textTransform:'uppercase' }}>Danh sách câu hỏi</p>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:5 }}>
            {questions.map((_, i) => {
              const isAns = answers[i] !== undefined;
              const isCur = i === current;
              return (
                <button
                  key={i}
                  onClick={() => goTo(i)}
                  title={`Câu ${i+1}`}
                  style={{
                    height:34, borderRadius:8, border:'1.5px solid',
                    fontSize:'0.8rem', fontWeight:800, cursor:'pointer',
                    transition:'all 0.15s',
                    borderColor: isCur ? '#6366f1' : isAns ? '#10b981' : 'var(--border)',
                    background: isCur ? '#6366f1' : isAns ? '#d1fae5' : 'var(--bg)',
                    color: isCur ? '#fff' : isAns ? '#065f46' : 'var(--text-muted)',
                    boxShadow: isCur ? '0 2px 8px #6366f140' : 'none',
                  }}
                >
                  {i+1}
                </button>
              );
            })}
          </div>

          {/* Legend */}
          <div style={{ marginTop:16, display:'flex', flexDirection:'column', gap:6 }}>
            {[
              { color:'#6366f1', bg:'#6366f1', label:'Câu đang xem', textColor:'#fff' },
              { color:'#10b981', bg:'#d1fae5', label:'Đã trả lời', textColor:'#065f46' },
              { color:'var(--border)', bg:'var(--bg)', label:'Chưa trả lời', textColor:'var(--text-muted)' },
            ].map((item,i) => (
              <div key={i} style={{ display:'flex', alignItems:'center', gap:8, fontSize:'0.75rem', color:'var(--text-muted)' }}>
                <div style={{ width:16, height:16, borderRadius:4, background:item.bg, border:`1.5px solid ${item.color}`, flexShrink:0 }}/>
                {item.label}
              </div>
            ))}
          </div>
        </div>

        {/* Submit button */}
        <div style={{ padding:'12px 14px', borderTop:'1px solid var(--border)' }}>
          <button
            className="btn btn-accent"
            style={{ width:'100%', justifyContent:'center', fontWeight:800 }}
            onClick={() => setShowConfirm(true)}
          >
            <Send size={15}/> Nộp bài thi
          </button>
        </div>
      </div>

      {/* ── CONFIRM MODAL ── */}
      {showConfirm && (
        <div className="modal-overlay" onClick={() => setShowConfirm(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth:420 }}>
            <div className="modal-header"><h3>Xác nhận nộp bài</h3></div>
            <div className="modal-body">
              <p>Bạn đã trả lời <strong>{answered}/{questions.length}</strong> câu hỏi.</p>
              {answered < questions.length && (
                <div style={{ display:'flex', alignItems:'center', gap:8, padding:'12px', background:'#fef3c7', border:'1px solid #fcd34d', borderRadius:10, marginTop:12, fontSize:'0.85rem', color:'#92400e', fontWeight:600 }}>
                  <AlertTriangle size={16}/> Còn <strong>{questions.length - answered}</strong> câu chưa trả lời
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setShowConfirm(false)}>Tiếp tục làm</button>
              <button className="btn btn-accent" onClick={() => handleSubmit(false)} disabled={submitting}>
                {submitting ? 'Đang nộp...' : 'Nộp bài ngay'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
