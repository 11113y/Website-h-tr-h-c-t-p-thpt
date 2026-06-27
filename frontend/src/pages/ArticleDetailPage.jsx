import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getArticleDetail } from '../api/articles';
import { ChevronLeft, Calendar, User } from 'lucide-react';

export default function ArticleDetailPage() {
  const { articleId } = useParams();
  const navigate = useNavigate();
  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getArticleDetail(articleId)
      .then(res => setArticle(res.data?.article || res.data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, [articleId]);

  if (loading) return <div className="page-loading"><div className="spinner" /></div>;
  if (!article) return <div className="container" style={{ padding: '40px 0', textAlign: 'center' }}>Không tìm thấy bài viết</div>;

  return (
    <div className="container" style={{ maxWidth: 800, padding: '32px 16px' }}>
      <button className="btn btn-ghost btn-sm" style={{ marginBottom: 20 }} onClick={() => navigate(-1)}>
        <ChevronLeft size={16} /> Quay lại
      </button>

      <article className="card">
        {article.thumbnail && (
          <div style={{ maxHeight: 400, overflow: 'hidden', background: '#f1f5f9' }}>
            <img src={article.thumbnail} style={{ width: '100%', height: 'auto', objectFit: 'cover' }} alt={article.title} />
          </div>
        )}
        <div className="card-body">
          <h1 style={{ fontSize: '1.8rem', marginBottom: 12, lineHeight: 1.3 }}>{article.title}</h1>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, color: 'var(--text-muted)', fontSize: '0.85rem', paddingBottom: 16, borderBottom: '1px solid var(--border)', marginBottom: 20 }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Calendar size={14} /> {new Date(article.createdAt).toLocaleDateString('vi-VN')}</span>
            {article.authorName && <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><User size={14} /> {article.authorName}</span>}
          </div>

          <div 
            style={{ lineHeight: 1.8, fontSize: '1.05rem', color: 'var(--text)' }} 
            className="article-content"
            dangerouslySetInnerHTML={{ __html: article.content }} 
          />
        </div>
      </article>
    </div>
  );
}
