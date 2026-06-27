import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getArticles } from '../api/articles';
import { BookOpen, Calendar, User, ArrowRight } from 'lucide-react';

export default function ArticlesPage() {
  const navigate = useNavigate();
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getArticles()
      .then(res => setArticles(res.data?.articles || res.data || []))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="container" style={{ padding: '32px 16px' }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ marginBottom: 6 }}>Tin tức & Chia sẻ</h1>
        <p style={{ color: 'var(--text-muted)' }}>Phương pháp học toán, đề thi và các tin tức giáo dục nổi bật</p>
      </div>

      {loading ? (
        <div className="page-loading"><div className="spinner" /></div>
      ) : articles.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>
          <BookOpen size={48} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
          <p>Chưa có bài viết nào</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 320px), 1fr))', gap: 20 }}>
          {articles.map(art => (
            <div key={art.id} className="card" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
              {art.thumbnail && (
                <div style={{ aspectRatio: '16/9', overflow: 'hidden', background: '#f1f5f9' }}>
                  <img src={art.thumbnail} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt={art.title} />
                </div>
              )}
              <div className="card-body" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                <h3 style={{ fontSize: '1.1rem', marginBottom: 10, lineHeight: 1.4, color: 'var(--text)' }}>{art.title}</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: 16, lineClamp: 3, WebkitLineClamp: 3, display: '-webkit-box', WebkitBoxOrient: 'vertical', overflow: 'hidden', flex: 1 }}>
                  {art.summary || art.description || (art.content ? art.content.replace(/<[^>]*>/g, '') : '')}
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, color: 'var(--text-light)', fontSize: '0.75rem', marginBottom: 14 }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Calendar size={12} /> {new Date(art.createdAt).toLocaleDateString('vi-VN')}</span>
                  {art.authorName && <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><User size={12} /> {art.authorName}</span>}
                </div>
                <button className="btn btn-outline btn-sm" style={{ width: '100%', justifyContent: 'center' }} onClick={() => navigate(`/articles/${art.id}`)}>
                  Đọc tiếp <ArrowRight size={14} style={{ marginLeft: 4 }} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
