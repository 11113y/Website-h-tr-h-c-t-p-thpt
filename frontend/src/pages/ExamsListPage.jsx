import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getExams } from '../api/exams';
import { getSubjects } from '../api/subjects';
import { FileText, Clock, List, Search } from 'lucide-react';

export default function ExamsListPage() {
  const navigate = useNavigate();
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [grade, setGrade] = useState('');

  useEffect(() => {
    Promise.all([
      getExams(),
      getSubjects()
    ]).then(([examsRes, subjectsRes]) => {
      const examData = examsRes.data?.exams || examsRes.data || [];
      const subjectData = subjectsRes.data?.subjects || subjectsRes.data || [];
      
      const mappedExams = examData.map(exam => {
        const sub = subjectData.find(s => s.id === exam.subject_id);
        return {
          ...exam,
          grade: sub ? `Lớp ${sub.grade}` : 'THPT'
        };
      });
      setExams(mappedExams);
      setError('');
    }).catch((err) => {
      console.error('Error loading exams:', err);
      setError('Không thể tải kho đề thi. Vui lòng thử lại sau.');
    }).finally(() => setLoading(false));
  }, []);

  const filtered = exams.filter(e => {
    const matchSearch = !search || (e.title || '').toLowerCase().includes(search.toLowerCase());
    const matchGrade = !grade || e.grade === grade;
    return matchSearch && matchGrade;
  });

  const grades = [...new Set(exams.map(e => e.grade).filter(Boolean))];

  return (
    <div className="container" style={{ padding:'32px 16px' }}>
      <div style={{ marginBottom:28 }}>
        <h1 style={{ marginBottom:6 }}>Kho Đề Thi</h1>
        <p style={{ color:'var(--text-muted)' }}>Luyện tập với hàng trăm đề thi thử và kiểm tra học kỳ</p>
      </div>

      {/* Filters */}
      <div style={{ display:'flex', gap:12, marginBottom:24, flexWrap:'wrap' }}>
        <div style={{ position:'relative', flex:1, minWidth:220 }}>
          <Search size={16} style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', color:'var(--text-muted)' }}/>
          <input className="form-control" style={{ paddingLeft:38 }} placeholder="Tìm đề thi..."
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="form-control" style={{ width:'auto', minWidth:150 }} value={grade} onChange={e => setGrade(e.target.value)}>
          <option value="">Tất cả lớp</option>
          {grades.map(g => <option key={g} value={g}>{g}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="page-loading"><div className="spinner"/></div>
      ) : error ? (
        <div className="alert alert-danger" style={{ marginBottom: 16 }}>{error}</div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign:'center', padding:'60px', color:'var(--text-muted)' }}>
          <FileText size={48} style={{ margin:'0 auto 12px', opacity:.3 }}/>
          <p>Không tìm thấy đề thi nào</p>
        </div>
      ) : (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(min(100%, 300px),1fr))', gap:16 }}>
          {filtered.map(exam => {
            const qCount = exam.question_count || 0;
            const diffLower = (exam.difficulty || 'medium').toLowerCase();
            const diffText = diffLower === 'hard' ? 'Khó' : diffLower === 'medium' ? 'Trung bình' : 'Dễ';
            const diffBadge = diffLower === 'hard' ? 'badge-danger' : diffLower === 'medium' ? 'badge-warning' : 'badge-success';

            return (
              <div key={exam.id} className="card exam-card" style={{ cursor:'pointer' }} onClick={() => navigate(`/exams/${exam.id}`)}>
                <div className="card-body exam-card-body">
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:10 }}>
                    <span className="badge badge-primary">{exam.grade}</span>
                    <span className={`badge ${diffBadge}`}>{exam.lesson_id ? 'Chuyên đề' : diffText}</span>
                  </div>
                  <h3 style={{ fontSize:'1rem', marginBottom:12, lineHeight:1.4 }}>{exam.title}</h3>
                  <div style={{ display:'flex', gap:16, color:'var(--text-muted)', fontSize:'.8rem', marginBottom:12 }}>
                    <span style={{ display:'flex', alignItems:'center', gap:4 }}><Clock size={14}/> {exam.time_limit_minutes || 45} phút</span>
                    <span style={{ display:'flex', alignItems:'center', gap:4 }}><List size={14}/> {qCount} câu</span>
                  </div>
                  <button className="btn btn-primary btn-sm exam-card-button" style={{ width:'100%', justifyContent:'center' }}>Làm bài ngay</button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
