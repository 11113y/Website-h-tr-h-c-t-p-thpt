import React, { useState, useEffect } from 'react';
import axios from '../api/client';
import { 
  ArrowRight, 
  Download, 
  Clock, 
  ArrowLeft, 
  Calendar, 
  Paperclip, 
  ExternalLink, 
  Search, 
  BookOpen, 
  Sparkles,
  Award,
  ChevronRight,
  FolderOpen
} from 'lucide-react';
import { renderMathText } from './QuizPage';

// Math preprocessing
export function preprocessMath(mathStr) {
  if (!mathStr) return '';
  mathStr = mathStr.replace(/\\begin\{cases\}\s*([\s\S]*?)\s*\\end\{cases\}/g, (match, body) => {
    const eqs = body.split(/\\\\/).map(eq => eq.trim());
    return `{&` + eqs.join('&') + '.';
  });
  mathStr = mathStr.replace(/\\text\{([^\}]+)\}/g, '$1');
  return mathStr
    .replace(/\\ge\b/g, '≥')
    .replace(/\\le\b/g, '≤')
    .replace(/\\neq\b/g, '≠')
    .replace(/\\pm\b/g, '±')
    .replace(/\\mathbb\{R\}/g, 'ℝ')
    .replace(/\\dots\b/g, '…')
    .replace(/\\cdot\b/g, '·')
    .replace(/\\times\b/g, '×')
    .replace(/\\implies\b/g, '⇒')
    .replace(/\\iff\b/g, '⇔')
    .replace(/\\notin\b/g, '∉')
    .replace(/\\in\b/g, '∈')
    .replace(/\\infty\b/g, '∞')
    .replace(/\\approx\b/g, '≈')
    .replace(/\\theta\b/g, 'θ')
    .replace(/\\alpha\b/g, 'α')
    .replace(/\\beta\b/g, 'β')
    .replace(/\\Delta\b/g, 'Δ')
    .replace(/\\pi\b/g, 'π')
    .replace(/\\Phi\b/g, 'Φ')
    .replace(/\\phi\b/g, 'φ')
    .replace(/\\to\b/g, '→')
    .replace(/\\forall\b/g, '∀')
    .replace(/\\exists\b/g, '∃')
    .replace(/\\cup\b/g, '∪')
    .replace(/\\cap\b/g, '∩')
    .replace(/\\subset\b/g, '⊂')
    .replace(/\\int\b/g, '∫')
    .replace(/\\sum\b/g, '∑')
    .replace(/\\prod\b/g, '∏')
    .replace(/\\,/g, ' ');
}

// Math element renderer
function parseInlineElements(text, lineIdx = 0) {
  if (!text) return '';
  const blockParts = text.split('$$');
  const elements = [];
  
  blockParts.forEach((blockPart, bIdx) => {
    if (bIdx % 2 !== 0) {
      const processedMath = preprocessMath(blockPart);
      elements.push(
        <div key={`bm-${lineIdx}-${bIdx}`} className="blog-math-block">
          {renderMathText(processedMath)}
        </div>
      );
    } else {
      const inlineParts = blockPart.split('$');
      inlineParts.forEach((part, iIdx) => {
        if (iIdx % 2 !== 0) {
          const processedMath = preprocessMath(part);
          elements.push(
            <span key={`im-${lineIdx}-${bIdx}-${iIdx}`} className="blog-math-inline">
              {renderMathText(processedMath)}
            </span>
          );
        } else {
          const boldParts = part.split('**');
          boldParts.forEach((boldPart, boldIdx) => {
            if (boldIdx % 2 !== 0) {
              elements.push(<strong key={`b-${lineIdx}-${bIdx}-${iIdx}-${boldIdx}`} style={{ fontWeight: 800, color: '#0f172a' }}>{boldPart}</strong>);
            } else {
              const italicParts = boldPart.split('*');
              italicParts.forEach((italicPart, italicIdx) => {
                if (italicIdx % 2 !== 0) {
                  elements.push(<em key={`em-${lineIdx}-${bIdx}-${iIdx}-${boldIdx}-${italicIdx}`} style={{ fontStyle: 'italic' }}>{italicPart}</em>);
                } else {
                  const brParts = italicPart.split(/<br\s*\/?>/gi);
                  brParts.forEach((brPart, brIdx) => {
                    if (brIdx > 0) {
                      elements.push(<br key={`br-${lineIdx}-${bIdx}-${iIdx}-${boldIdx}-${italicIdx}-${brIdx}`} />);
                    }
                    if (brPart) {
                      elements.push(brPart);
                    }
                  });
                }
              });
            }
          });
        }
      });
    }
  });
  
  return elements;
}

// Markdown parser
function renderMarkdownAndMath(content) {
  if (!content) return null;
  const lines = content.split('\n');
  const renderedBlocks = [];
  let listItems = [];
  let inList = false;

  const flushList = (key) => {
    if (listItems.length > 0) {
      renderedBlocks.push(
        <ul key={`ul-${key}`} className="blog-content-list">
          {listItems}
        </ul>
      );
      listItems = [];
      inList = false;
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const trimmedLine = rawLine.trim();
    const lineKey = `${i}`;

    if (trimmedLine.startsWith('* ') || trimmedLine.startsWith('- ')) {
      inList = true;
      const bulletContent = rawLine.substring(rawLine.indexOf(' ') + 1);
      listItems.push(
        <li key={`li-${lineKey}`} className="blog-content-list-item">
          {parseInlineElements(bulletContent, `li-c-${lineKey}`)}
        </li>
      );
      continue;
    } else {
      flushList(lineKey);
    }

    if (trimmedLine.startsWith('#')) {
      const headerMatch = trimmedLine.match(/^(#{1,6})\s+(.*)$/);
      if (headerMatch) {
        const level = headerMatch[1].length;
        const headerText = headerMatch[2];
        const parsedHeader = parseInlineElements(headerText, `h-${lineKey}`);
        if (level === 1) {
          renderedBlocks.push(<h1 key={`h1-${lineKey}`} className="blog-content-h1">{parsedHeader}</h1>);
        } else if (level === 2) {
          renderedBlocks.push(<h2 key={`h2-${lineKey}`} className="blog-content-h2">{parsedHeader}</h2>);
        } else if (level === 3) {
          renderedBlocks.push(<h3 key={`h3-${lineKey}`} className="blog-content-h3">{parsedHeader}</h3>);
        } else {
          renderedBlocks.push(<h4 key={`h4-${lineKey}`} className="blog-content-h4">{parsedHeader}</h4>);
        }
        continue;
      }
    }

    if (trimmedLine.startsWith('>')) {
      const quoteContent = trimmedLine.substring(1).trim();
      renderedBlocks.push(
        <blockquote key={`bq-${lineKey}`} className="blog-content-blockquote">
          {parseInlineElements(quoteContent, `bq-c-${lineKey}`)}
        </blockquote>
      );
      continue;
    }

    if (trimmedLine === '---' || trimmedLine === '***') {
      renderedBlocks.push(<hr key={`hr-${lineKey}`} className="blog-content-hr" />);
      continue;
    }

    if (trimmedLine === '') continue;

    let paraLines = [rawLine];
    let nextIdx = i + 1;
    while (nextIdx < lines.length) {
      const nextTrim = lines[nextIdx].trim();
      if (nextTrim === '' || nextTrim.startsWith('#') || nextTrim.startsWith('* ') || nextTrim.startsWith('- ') || nextTrim.startsWith('>') || nextTrim === '---') {
        break;
      }
      paraLines.push(lines[nextIdx]);
      nextIdx++;
    }
    i = nextIdx - 1;

    const paraText = paraLines.join('\n');
    renderedBlocks.push(
      <p key={`p-${lineKey}`} className="blog-content-p">
        {parseInlineElements(paraText, `p-c-${lineKey}`)}
      </p>
    );
  }

  flushList('final');
  return renderedBlocks;
}

export default function BlogPage({ isLoggedIn, currentUser, userPoints, setUserPoints, setPrefilledEmail, navigateTo }) {
  const [articles, setArticles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('all');
  const [selectedArticleId, setSelectedArticleId] = useState(null);
  const [detailedArticle, setDetailedArticle] = useState(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [emailInput, setEmailInput] = useState('');
  const [downloading, setDownloading] = useState({});

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const [articlesRes, docsRes] = await Promise.all([
          axios.get('/articles'),
          axios.get('/documents')
        ]);
        
        let combined = [];
        if (articlesRes.data && articlesRes.data.success) {
          const arts = (articlesRes.data.articles || []).map(a => ({
            ...a,
            type: 'NORMAL',
            categoryName: 'Bài viết & Bí quyết',
            createdAt: a.created_at || a.createdAt,
            vipPoints: 0,
            downloads: 0
          }));
          combined = [...combined, ...arts];
        }
        if (docsRes.data && docsRes.data.success) {
          const docs = (docsRes.data.documents || []).map(d => ({
            ...d,
            type: 'DOWNLOAD',
            categoryName: 'Tài liệu ôn tập',
            createdAt: d.created_at || d.createdAt,
            vipPoints: d.is_vip ? d.points_required : 0,
            downloads: d.download_count || 0,
            fileUrl: d.file_url
          }));
          combined = [...combined, ...docs];
        }
        
        combined.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setArticles(combined);
      } catch (error) {
        console.error('Error fetching blog data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  useEffect(() => {
    if (!selectedArticleId) {
      setDetailedArticle(null);
      return;
    }
    const item = articles.find(a => a.id === selectedArticleId);
    if (!item) return;

    if (item.type === 'DOWNLOAD') {
      setDetailedArticle({
        ...item,
        categoryName: 'Tài liệu ôn tập'
      });
      setIsLoadingDetail(false);
    } else {
      const loadArticleDetail = async () => {
        setIsLoadingDetail(true);
        try {
          const res = await axios.get(`/articles/${selectedArticleId}`);
          if (res.data && res.data.success) {
            setDetailedArticle({
              ...res.data.article,
              type: 'NORMAL',
              categoryName: 'Bài viết & Bí quyết',
              createdAt: res.data.article.created_at
            });
          }
        } catch (error) {
          console.error('Error fetching article detail:', error);
          alert('Không thể tải nội dung bài viết.');
          setSelectedArticleId(null);
        } finally {
          setIsLoadingDetail(false);
        }
      };
      loadArticleDetail();
    }
  }, [selectedArticleId, articles]);

  const handleDownload = async (docId) => {
    if (!isLoggedIn) {
      alert('Vui lòng đăng nhập để tải tài liệu.');
      return;
    }
    const doc = articles.find(a => a.id === docId);
    if (!doc) return;

    if (doc.vipPoints > 0) {
      const confirmUnlock = window.confirm(
        `Tài liệu "${doc.title}" là VIP và cần ${doc.vipPoints} điểm tích lũy để tải. Bạn có muốn sử dụng điểm không?\n(Số điểm hiện tại của bạn: ${userPoints || 0})`
      );
      if (!confirmUnlock) return;
    }

    setDownloading(prev => ({ ...prev, [docId]: true }));
    try {
      const res = await axios.post(`/documents/${docId}/download`);
      if (res.data && res.data.file_url) {
        const link = document.createElement('a');
        link.href = res.data.file_url;
        link.target = '_blank';
        link.download = res.data.title || 'document';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        if (res.data.remaining_points !== undefined && setUserPoints) {
          setUserPoints(res.data.remaining_points);
        }
        
        setArticles(prev => prev.map(a => a.id === docId ? { ...a, downloads: (a.downloads || 0) + 1 } : a));
        if (detailedArticle && detailedArticle.id === docId) {
          setDetailedArticle(prev => ({ ...prev, downloads: (prev.downloads || 0) + 1 }));
        }
      } else {
        alert('Không tìm thấy tệp tài liệu để tải về.');
      }
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Có lỗi xảy ra khi tải tài liệu.');
    } finally {
      setDownloading(prev => ({ ...prev, [docId]: false }));
    }
  };

  const handleRegisterRedirect = (e) => {
    e.preventDefault();
    if (emailInput.trim() && setPrefilledEmail && navigateTo) {
      setPrefilledEmail(emailInput.trim());
      navigateTo('register');
    }
  };

  const filteredArticles = articles.filter(article => {
    const matchesCategory = activeCategory === 'all' || 
      (activeCategory === 'NORMAL' && article.type === 'NORMAL') ||
      (activeCategory === 'DOWNLOAD' && article.type === 'DOWNLOAD') ||
      (activeCategory === 'VIP' && article.vipPoints > 0);

    const matchesSearch = searchQuery.trim() === '' || 
      article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (article.description && article.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (article.summary && article.summary.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesCategory && matchesSearch;
  });

  const featuredArticle = articles.length > 0 ? articles[0] : null;

  return (
    <div className="blog-page-container">
      {/* Scope CSS variables to ensure zero leakage and full specificity */}
      <style>{`
        .blog-page-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 40px 20px;
          font-family: 'Nunito', system-ui, sans-serif;
          color: #1e293b;
        }

        /* ===== HERO BANNER ===== */
        .blog-hero {
          position: relative;
          border-radius: 24px;
          overflow: hidden;
          background: linear-gradient(135deg, #1e1b4b 0%, #312e81 100%);
          padding: 60px 48px;
          margin-bottom: 48px;
          box-shadow: 0 20px 40px rgba(30, 27, 75, 0.2);
          text-align: left;
        }
        .blog-hero-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 14px;
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.15);
          border-radius: 99px;
          font-size: 11px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: #e0e7ff;
          margin-bottom: 20px;
        }
        .blog-hero h1 {
          font-size: 40px;
          font-weight: 900;
          color: #ffffff !important;
          margin: 0 0 16px 0 !important;
          line-height: 1.2;
          letter-spacing: -0.02em;
        }
        .blog-hero p {
          font-size: 16px;
          font-weight: 500;
          color: #c7d2fe !important;
          margin: 0 0 32px 0 !important;
          max-width: 600px;
          line-height: 1.6;
        }
        .blog-search-wrapper {
          position: relative;
          max-width: 500px;
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.15);
          border-radius: 16px;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
        }
        .blog-search-wrapper:focus-within {
          background: #ffffff;
          border-color: #ffffff;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
        }
        .blog-search-icon {
          position: absolute;
          left: 16px;
          color: #a5b4fc;
          transition: color 0.3s ease;
        }
        .blog-search-wrapper:focus-within .blog-search-icon {
          color: #4f46e5;
        }
        .blog-search-input {
          width: 100%;
          padding: 16px 16px 16px 48px;
          background: transparent;
          border: none;
          outline: none;
          color: #ffffff;
          font-size: 14px;
          font-weight: 600;
          transition: all 0.3s ease;
        }
        .blog-search-wrapper:focus-within .blog-search-input {
          color: #0f172a;
        }
        .blog-search-input::placeholder {
          color: #a5b4fc;
          opacity: 0.8;
        }
        .blog-search-wrapper:focus-within .blog-search-input::placeholder {
          color: #94a3b8;
        }

        /* ===== CATEGORY FILTER BAR ===== */
        .blog-filter-section {
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-bottom: 2px solid #f1f5f9;
          padding-bottom: 16px;
          margin-bottom: 32px;
          gap: 16px;
          flex-wrap: wrap;
        }
        .blog-tabs {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
        }
        .blog-tab-btn {
          padding: 10px 22px;
          border-radius: 99px;
          font-size: 13px;
          font-weight: 800;
          border: 1px solid #e2e8f0;
          background: #ffffff;
          color: #475569;
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
          cursor: pointer;
        }
        .blog-tab-btn:hover {
          background: #f8fafc;
          color: #0f172a;
          border-color: #cbd5e1;
        }
        .blog-tab-btn.active {
          background: #1e1b4b;
          color: #ffffff;
          border-color: #1e1b4b;
          box-shadow: 0 4px 12px rgba(30, 27, 75, 0.15);
        }
        .blog-count-info {
          font-size: 13px;
          font-weight: 700;
          color: #94a3b8;
        }
        .blog-count-info strong {
          color: #475569;
        }

        /* ===== FEATURED BIG CARD ===== */
        .blog-featured-card {
          display: grid;
          grid-template-columns: 1fr;
          border: 1px solid #e2e8f0;
          background: #ffffff;
          border-radius: 24px;
          overflow: hidden;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.02);
          margin-bottom: 40px;
          transition: all 0.3s ease;
          cursor: pointer;
          text-align: left;
        }
        @media(min-width: 768px) {
          .blog-featured-card {
            grid-template-columns: 1.1fr 0.9fr;
          }
        }
        .blog-featured-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 15px 35px rgba(30, 27, 75, 0.08);
          border-color: #cbd5e1;
        }
        .blog-featured-image-container {
          position: relative;
          background: #f8fafc;
          min-height: 250px;
          overflow: hidden;
        }
        .blog-featured-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.6s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .blog-featured-card:hover .blog-featured-image {
          transform: scale(1.03);
        }
        .blog-featured-badge {
          position: absolute;
          top: 20px;
          left: 20px;
          background: #ffffff;
          border: 1px solid #e2e8f0;
          padding: 6px 14px;
          border-radius: 99px;
          font-size: 10px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: #4f46e5;
          box-shadow: 0 4px 10px rgba(0, 0, 0, 0.05);
        }
        .blog-featured-content {
          padding: 40px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          gap: 20px;
        }
        .blog-featured-meta {
          font-size: 11px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: #6366f1;
        }
        .blog-featured-content h2 {
          font-size: 26px;
          font-weight: 900;
          color: #0f172a !important;
          line-height: 1.3;
          margin: 0 !important;
        }
        .blog-featured-content p {
          font-size: 14px;
          color: #64748b !important;
          line-height: 1.6;
          font-weight: 500;
          margin: 0 !important;
        }
        .blog-featured-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-top: 1px solid #f1f5f9;
          padding-top: 20px;
        }
        .blog-meta-date {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 13px;
          font-weight: 700;
          color: #94a3b8;
        }
        .blog-read-more-link {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 13px;
          font-weight: 800;
          color: #4f46e5;
          transition: transform 0.2s ease;
        }
        .blog-featured-card:hover .blog-read-more-link {
          transform: translateX(4px);
        }

        /* ===== CARDS GRID ===== */
        .blog-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(min(100%, 320px), 1fr));
          gap: 30px;
          margin-bottom: 56px;
        }
        .blog-card {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 20px;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          cursor: pointer;
          text-align: left;
        }
        .blog-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 30px rgba(30, 27, 75, 0.08);
          border-color: #cbd5e1;
        }
        .blog-card-image-wrapper {
          height: 190px;
          position: relative;
          background: #f8fafc;
          overflow: hidden;
        }
        .blog-card-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.5s ease;
        }
        .blog-card:hover .blog-card-img {
          transform: scale(1.04);
        }
        .blog-card-category {
          position: absolute;
          top: 16px;
          left: 16px;
          background: rgba(255, 255, 255, 0.95);
          border: 1px solid #f1f5f9;
          padding: 4px 10px;
          border-radius: 99px;
          font-size: 9px;
          font-weight: 850;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: #475569;
        }
        .blog-card-vip {
          position: absolute;
          top: 16px;
          right: 16px;
          background: #f59e0b;
          color: #ffffff;
          padding: 4px 10px;
          border-radius: 99px;
          font-size: 9px;
          font-weight: 900;
          box-shadow: 0 4px 8px rgba(245, 158, 11, 0.3);
        }
        .blog-card-body {
          padding: 24px;
          display: flex;
          flex-direction: column;
          gap: 12px;
          flex: 1;
        }
        .blog-card-body h3 {
          font-size: 17px;
          font-weight: 800;
          color: #0f172a !important;
          line-height: 1.4;
          margin: 0 !important;
          transition: color 0.2s ease;
        }
        .blog-card:hover .blog-card-body h3 {
          color: #4f46e5 !important;
        }
        .blog-card-body p {
          font-size: 13px;
          font-weight: 600;
          color: #64748b !important;
          line-height: 1.6;
          margin: 0 !important;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .blog-card-footer {
          padding: 16px 24px 24px 24px;
          border-top: 1px solid #f8fafc;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .blog-card:hover .blog-card-footer span {
          transform: translateX(3px);
        }

        /* ===== DETAIL PAGE ===== */
        .blog-detail {
          max-width: 850px;
          margin: 0 auto;
          text-align: left;
        }
        .blog-back-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 10px 24px;
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 99px;
          font-size: 13px;
          font-weight: 800;
          color: #475569;
          cursor: pointer;
          transition: all 0.2s ease;
          box-shadow: 0 2px 5px rgba(0,0,0,0.02);
          margin-bottom: 32px;
        }
        .blog-back-btn:hover {
          background: #f8fafc;
          color: #0f172a;
          border-color: #cbd5e1;
        }
        .blog-detail-card {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 28px;
          padding: 48px;
          box-shadow: 0 4px 25px rgba(0, 0, 0, 0.02);
        }
        @media(max-width: 768px) {
          .blog-detail-card {
            padding: 24px;
          }
        }
        .blog-detail-header-meta {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
          margin-bottom: 24px;
        }
        .blog-detail-card h1 {
          font-size: 34px;
          font-weight: 900;
          color: #0f172a !important;
          line-height: 1.25;
          margin: 0 0 20px 0 !important;
        }
        .blog-detail-description {
          font-size: 16px;
          font-weight: 600;
          color: #475569 !important;
          border-left: 4px solid #4f46e5;
          padding-left: 20px;
          margin: 0 0 32px 0 !important;
          line-height: 1.6;
          font-style: italic;
        }
        .blog-download-box {
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
          border: 1px solid #e2e8f0;
          padding: 24px;
          border-radius: 16px;
          margin-bottom: 36px;
          gap: 16px;
          flex-wrap: wrap;
        }
        .blog-download-info h4 {
          font-size: 14px;
          font-weight: 800;
          color: #0f172a !important;
          margin: 0 0 4px 0 !important;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .blog-download-info p {
          font-size: 12px;
          color: #64748b !important;
          margin: 0 !important;
          font-weight: 600;
        }
        .blog-download-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 12px 28px;
          background: #4f46e5;
          color: #ffffff;
          border: none;
          border-radius: 12px;
          font-size: 13px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          cursor: pointer;
          transition: all 0.2s ease;
          box-shadow: 0 4px 12px rgba(79, 70, 229, 0.2);
        }
        .blog-download-btn:hover {
          background: #4338ca;
          box-shadow: 0 6px 16px rgba(79, 70, 229, 0.3);
        }

        /* ===== MARKDOWN ARTICLE CONTENT ===== */
        .blog-detail-content {
          border-top: 1px solid #f1f5f9;
          padding-top: 36px;
        }
        .blog-content-p {
          font-size: 15px;
          font-weight: 600;
          color: #334155 !important;
          line-height: 1.75;
          margin: 18px 0 !important;
        }
        .blog-content-h1 {
          font-size: 24px;
          font-weight: 850;
          color: #0f172a !important;
          margin: 36px 0 16px 0 !important;
          border-bottom: 1px solid #f1f5f9;
          padding-bottom: 8px;
        }
        .blog-content-h2 {
          font-size: 20px;
          font-weight: 800;
          color: #1e293b !important;
          margin: 32px 0 12px 0 !important;
        }
        .blog-content-h3 {
          font-size: 17px;
          font-weight: 800;
          color: #4f46e5 !important;
          margin: 24px 0 8px 0 !important;
        }
        .blog-content-blockquote {
          border-left: 4px solid #4f46e5;
          padding: 16px 24px;
          background: #f8fafc;
          border-radius: 0 16px 16px 0;
          font-style: italic;
          color: #475569 !important;
          margin: 24px 0 !important;
          font-weight: 600;
        }
        .blog-content-list {
          list-style-type: disc;
          padding-left: 24px;
          margin: 16px 0;
        }
        .blog-content-list-item {
          font-size: 15px;
          font-weight: 600;
          color: #334155;
          line-height: 1.7;
          margin-bottom: 8px;
        }
        .blog-math-inline {
          font-family: 'Cambria', 'Georgia', serif;
          color: #4f46e5;
          font-weight: 700;
          margin: 0 2px;
        }
        .blog-math-block {
          font-family: 'Cambria', 'Georgia', serif;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          padding: 16px;
          border-radius: 12px;
          margin: 24px 0;
          text-align: center;
          overflow-x: auto;
        }

        /* ===== NEWSLETTER BOX ===== */
        .blog-newsletter {
          background: linear-gradient(135deg, #eef2ff 0%, #faf5ff 100%);
          border: 1px solid #e0e7ff;
          border-radius: 28px;
          padding: 48px;
          text-align: center;
          position: relative;
          overflow: hidden;
          margin-top: 56px;
        }
        .blog-newsletter h3 {
          font-size: 24px;
          font-weight: 900;
          color: #0f172a !important;
          margin: 0 0 8px 0 !important;
        }
        .blog-newsletter p {
          font-size: 14px;
          color: #64748b !important;
          font-weight: 600;
          margin: 0 0 28px 0 !important;
          max-width: 420px;
          margin-left: auto;
          margin-right: auto;
        }
        .blog-newsletter-form {
          display: flex;
          gap: 10px;
          max-width: 450px;
          margin: 0 auto;
        }
        @media(max-width: 480px) {
          .blog-newsletter-form {
            flex-direction: column;
          }
        }
        .blog-newsletter-input {
          flex: 1;
          padding: 14px 20px;
          border-radius: 12px;
          border: 1px solid #cbd5e1;
          outline: none;
          font-size: 14px;
          font-weight: 600;
          background: #ffffff;
        }
        .blog-newsletter-input:focus {
          border-color: #4f46e5;
        }
        .blog-newsletter-btn {
          padding: 14px 28px;
          background: #4f46e5;
          color: #ffffff;
          font-weight: 800;
          border: none;
          border-radius: 12px;
          font-size: 13px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          cursor: pointer;
          transition: background 0.2s ease;
        }
        .blog-newsletter-btn:hover {
          background: #4338ca;
        }

        /* ===== LOADING SCREEN ===== */
        .blog-loading {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 80px 0;
          gap: 16px;
        }
        .blog-spinner {
          width: 40px;
          height: 40px;
          border: 4px solid #e0e7ff;
          border-top-color: #4f46e5;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>

      {selectedArticleId && (isLoadingDetail || detailedArticle) ? (
        /* ===== DETAIL SCREEN ===== */
        <div className="blog-detail">
          <button onClick={() => setSelectedArticleId(null)} className="blog-back-btn">
            <ArrowLeft size={16} /> Quay lại danh mục học liệu
          </button>

          {isLoadingDetail ? (
            <div className="blog-loading">
              <div className="blog-spinner"></div>
              <p style={{ fontWeight: 700, color: '#64748b' }}>Đang tải nội dung học liệu...</p>
            </div>
          ) : (
            <div className="blog-detail-card">
              <div className="blog-detail-header-meta">
                <span style={{
                  padding: '5px 12px',
                  background: '#f0fdf4',
                  border: '1px solid #bbf7d0',
                  borderRadius: '99px',
                  fontSize: '11px',
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  color: '#166534'
                }}>
                  {detailedArticle.categoryName}
                </span>

                {detailedArticle.vipPoints > 0 ? (
                  <span style={{
                    padding: '5px 12px',
                    background: '#fffbeb',
                    border: '1px solid #fef3c7',
                    borderRadius: '99px',
                    fontSize: '11px',
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    color: '#b45309'
                  }}>
                    🧀 VIP · {detailedArticle.vipPoints} Điểm
                  </span>
                ) : (
                  <span style={{
                    padding: '5px 12px',
                    background: '#f0fdf4',
                    border: '1px solid #dcfce7',
                    borderRadius: '99px',
                    fontSize: '11px',
                    fontWeight: 800,
                    color: '#15803d'
                  }}>
                    Tài liệu miễn phí
                  </span>
                )}

                <div className="blog-meta-date" style={{ marginLeft: 'auto' }}>
                  <Calendar size={14} /> {new Date(detailedArticle.createdAt).toLocaleDateString('vi-VN')}
                </div>
              </div>

              <h1>{detailedArticle.title}</h1>

              {detailedArticle.description && (
                <p className="blog-detail-description">
                  {detailedArticle.description}
                </p>
              )}

              {detailedArticle.type === 'DOWNLOAD' && (
                <div className="blog-download-box">
                  <div className="blog-download-info">
                    <h4>
                      <Paperclip size={16} style={{ color: '#4f46e5' }} /> Tệp đính kèm học liệu
                    </h4>
                    <p>
                      Nhấp nút bên cạnh để tiến hành tải tệp tài liệu hỗ trợ ôn thi.
                    </p>
                  </div>

                  <button 
                    onClick={() => handleDownload(detailedArticle.id)}
                    disabled={downloading[detailedArticle.id]}
                    className="blog-download-btn"
                  >
                    <Download size={14} /> {downloading[detailedArticle.id] ? 'Đang tải...' : 'Tải tài liệu ngay'} <ExternalLink size={12} />
                  </button>
                </div>
              )}

              <div className="blog-detail-content">
                {detailedArticle.content ? (
                  renderMarkdownAndMath(detailedArticle.content)
                ) : (
                  <div style={{ textAlign: 'center', color: '#94a3b8', padding: '40px 0', fontWeight: 700 }}>
                    Học liệu này chỉ đính kèm file tải về. Vui lòng bấm vào nút "Tải tài liệu ngay" phía trên.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* ===== DIRECTORY LIST SCREEN ===== */
        <>
          {/* Hero Banner */}
          <div className="blog-hero">
            <div className="blog-hero-badge">
              <Sparkles size={12} /> Góc học tập & Tài nguyên
            </div>
            <h1>Bí quyết & Học liệu Toán chuyên sâu</h1>
            <p>
              Tổng hợp các phương pháp giải toán đột phá, tài liệu chuyên đề và đề thi chính thức được biên soạn bởi đội ngũ TD Math.
            </p>

            <div className="blog-search-wrapper">
              <Search className="blog-search-icon" size={18} />
              <input
                type="text"
                placeholder="Tìm kiếm tài liệu, bí quyết học tập..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="blog-search-input"
              />
            </div>
          </div>

          {/* Filters */}
          <div className="blog-filter-section">
            <div className="blog-tabs">
              {[
                { id: 'all', label: 'Tất cả học liệu' },
                { id: 'NORMAL', label: 'Bài viết & Bí quyết' },
                { id: 'DOWNLOAD', label: 'Tài liệu ôn tập' },
                { id: 'VIP', label: 'Tài liệu VIP 🧀' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveCategory(tab.id)}
                  className={`blog-tab-btn ${activeCategory === tab.id ? 'active' : ''}`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="blog-count-info">
              Hiển thị <strong>{filteredArticles.length}</strong> học liệu
            </div>
          </div>

          {/* Featured Post */}
          {featuredArticle && activeCategory === 'all' && searchQuery === '' && (
            <div className="blog-featured-card" onClick={() => setSelectedArticleId(featuredArticle.id)}>
              <div className="blog-featured-image-container">
                {featuredArticle.thumbnail ? (
                  <img 
                    src={featuredArticle.thumbnail} 
                    alt={featuredArticle.title} 
                    className="blog-featured-image" 
                  />
                ) : (
                  <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyItems: 'center', justifyContent: 'center', background: '#f1f5f9' }}>
                    <FolderOpen size={48} style={{ color: '#cbd5e1' }} />
                  </div>
                )}
                <div className="blog-featured-badge">⭐ Bài viết tiêu điểm</div>
              </div>

              <div className="blog-featured-content">
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div className="blog-featured-meta">{featuredArticle.categoryName}</div>
                  <h2>{featuredArticle.title}</h2>
                  <p>
                    {featuredArticle.description || featuredArticle.summary || 'Khám phá các bí quyết giải toán và phương pháp tự học toán đột phá cùng TD Math.'}
                  </p>
                </div>

                <div className="blog-featured-footer">
                  <div className="blog-meta-date">
                    <Calendar size={14} /> {new Date(featuredArticle.createdAt).toLocaleDateString('vi-VN')}
                  </div>
                  <span className="blog-read-more-link">
                    Đọc bài viết <ChevronRight size={16} />
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Grid of articles */}
          {isLoading ? (
            <div className="blog-loading" style={{ background: '#ffffff', borderRadius: '24px', border: '1px solid #e2e8f0' }}>
              <div className="blog-spinner"></div>
              <p style={{ fontWeight: 700, color: '#64748b' }}>Đang tải danh sách học liệu...</p>
            </div>
          ) : (
            <div className="blog-grid">
              {filteredArticles.slice(activeCategory === 'all' && searchQuery === '' ? 1 : 0).map(article => {
                const isVip = article.vipPoints > 0;
                
                return (
                  <div 
                    key={article.id} 
                    className="blog-card"
                    onClick={() => setSelectedArticleId(article.id)}
                  >
                    <div className="blog-card-image-wrapper">
                      {article.thumbnail ? (
                        <img 
                          src={article.thumbnail} 
                          alt={article.title} 
                          className="blog-card-img" 
                        />
                      ) : (
                        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc', color: '#cbd5e1' }}>
                          <BookOpen size={36} />
                        </div>
                      )}
                      <span className="blog-card-category">{article.categoryName}</span>
                      {isVip && <span className="blog-card-vip">🧀 VIP</span>}
                    </div>

                    <div className="blog-card-body">
                      <h3>{article.title}</h3>
                      <p>
                        {article.description || article.summary || 'Bấm xem chi tiết học liệu.'}
                      </p>
                    </div>

                    <div className="blog-card-footer">
                      <div className="blog-meta-date">
                        <Calendar size={13} /> {new Date(article.createdAt).toLocaleDateString('vi-VN')}
                      </div>
                      <span className="blog-read-more-link">
                        Chi tiết <ChevronRight size={14} />
                      </span>
                    </div>
                  </div>
                );
              })}

              {filteredArticles.length === 0 && (
                <div style={{ gridColumn: '1 / -1', background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '24px', padding: '60px 20px', textAlign: 'center', color: '#94a3b8', fontWeight: 700 }}>
                  Không tìm thấy bài viết hoặc tài liệu nào phù hợp.
                </div>
              )}
            </div>
          )}

          {/* Newsletter section */}
          {!isLoggedIn && (
            <div className="blog-newsletter">
              <div className="relative z-10">
                <h3>Nhận tài liệu miễn phí hàng tuần</h3>
                <p>
                  Đăng ký email để nhận trọn bộ công thức ôn thi môn toán và nhận thông báo sớm nhất khi có tài liệu VIP mới.
                </p>

                <form onSubmit={handleRegisterRedirect} className="blog-newsletter-form">
                  <input
                    type="email"
                    placeholder="Email nhận tài liệu..."
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    required
                    className="blog-newsletter-input"
                  />
                  <button type="submit" className="blog-newsletter-btn">
                    Đăng ký
                  </button>
                </form>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
