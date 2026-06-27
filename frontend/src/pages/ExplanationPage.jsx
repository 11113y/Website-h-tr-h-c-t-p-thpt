import React, { useEffect, useState } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { getExplanations } from '../api/exams';
import { ChevronLeft, CheckCircle, XCircle, Lightbulb } from 'lucide-react';

const LABELS = ['A','B','C','D','E','F'];

export default function ExplanationPage() {
  const { examId } = useParams();
  const { state } = useLocation();
  const navigate = useNavigate();
  const [explanations, setExplanations] = useState([]);
  const [loading, setLoading] = useState(true);
  const questions = state?.questions || [];
  const answers = state?.answers || {};
  const results = state?.results || [];

  useEffect(() => {
    getExplanations(examId)
      .then(res => setExplanations(res.data?.explanations || res.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [examId]);

  if (loading) return <div className="page-loading"><div className="spinner"/></div>;

  const mergedQuestions = questions.length > 0 ? questions : explanations.map(e => ({ id: e.questionId, content: e.question, options: e.options }));

  return (
    <div className="container" style={{ maxWidth:860, padding:'32px 16px' }}>
      <button className="btn btn-ghost btn-sm" style={{ marginBottom:20 }} onClick={() => navigate(-1)}>
        <ChevronLeft size={16}/> Quay lại
      </button>
      <h1 style={{ marginBottom:4 }}>Đáp án & Giải thích</h1>
      <p style={{ color:'var(--text-muted)', marginBottom:28 }}>Xem lại toàn bộ câu hỏi và phân tích đáp án</p>

      {mergedQuestions.map((q, idx) => {
        const exp = explanations.find(e => (e.questionId || e.question_id) === q.id);
        const res = results.find(r => (r.questionId || r.question_id) === q.id);
        const userAns = answers[idx];
        const correctIdx = exp?.correctAnswer ?? exp?.correctIndex ?? (q.options || exp?.options || []).findIndex(o => o.is_correct || o.isCorrect);
        const isCorrect = res?.isCorrect ?? res?.is_correct ?? (userAns === correctIdx);

        return (
          <div key={q.id || idx} className="card" style={{ marginBottom:16 }}>
            <div className="card-header">
              <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                <span className="badge badge-primary">Câu {idx+1}</span>
                {userAns !== undefined && (isCorrect
                  ? <span style={{ display:'flex', alignItems:'center', gap:4, color:'var(--success)', fontWeight:700, fontSize:'.875rem' }}><CheckCircle size={16}/> Đúng</span>
                  : <span style={{ display:'flex', alignItems:'center', gap:4, color:'var(--danger)', fontWeight:700, fontSize:'.875rem' }}><XCircle size={16}/> Sai</span>)}
              </div>
            </div>
            <div className="card-body">
              <div style={{ fontWeight:700, marginBottom:16, lineHeight:1.6 }}
                dangerouslySetInnerHTML={{ __html: q.content || q.text || q.question }} />
              <div style={{ display:'flex', flexDirection:'column', gap:8, marginBottom:16 }}>
                {(q.options || exp?.options || []).map((opt, oi) => {
                  const isCorrectOpt = oi === correctIdx;
                  const isUserOpt = oi === userAns;
                  return (
                    <div key={oi} className={`option-item ${isCorrectOpt ? 'correct' : isUserOpt && !isCorrectOpt ? 'wrong' : ''}`}>
                      <div className="option-label">{LABELS[oi]}</div>
                      <span dangerouslySetInnerHTML={{ __html: typeof opt === 'string' ? opt : opt.content || opt.text }}/>
                      {isCorrectOpt && <CheckCircle size={16} color="var(--success)" style={{ marginLeft:'auto' }}/>}
                      {isUserOpt && !isCorrectOpt && <XCircle size={16} color="var(--danger)" style={{ marginLeft:'auto' }}/>}
                    </div>
                  );
                })}
              </div>
              {exp?.explanation && (
                <div className="alert alert-info">
                  <Lightbulb size={16}/>
                  <div>
                    <strong>Giải thích:</strong>
                    <div style={{ marginTop:4, lineHeight:1.7 }} dangerouslySetInnerHTML={{ __html: exp.explanation }}/>
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
