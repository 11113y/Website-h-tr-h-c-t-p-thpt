import React, { useEffect, useState } from 'react';
import { getDocuments, downloadDocument } from '../api/documents';
import { useAuth } from '../contexts/AuthContext';
import { FileText, Download, AlertCircle, Sparkles, Award } from 'lucide-react';
import { useDialog } from '../contexts/DialogContext';

export default function DocumentsPage() {
  const { isLoggedIn, user, refreshUser } = useAuth();
  const { alert, confirm } = useDialog();
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [processingId, setProcessingId] = useState(null);

  const fetchDocs = () => {
    setLoading(true);
    getDocuments()
      .then(res => setDocuments(res.data?.documents || res.data || []))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchDocs();
  }, []);

  const handleDownload = async (doc) => {
    if (!isLoggedIn) {
      alert('Vui lòng đăng nhập để tải tài liệu!');
      return;
    }

    if (doc.is_vip) {
      const confirmUnlock = await confirm(
        `Tài liệu "${doc.title}" là VIP và cần ${doc.points_required} điểm để tải. Bạn có muốn đổi điểm không?\n(Điểm hiện tại của bạn: ${user?.points || 0})`
      );
      if (!confirmUnlock) return;
    }

    setProcessingId(doc.id);
    setError('');

    try {
      const res = await downloadDocument(doc.id);
      if (res.data?.success && res.data?.file_url) {
        // Trigger actual download or open in new tab
        const link = document.createElement('a');
        link.href = res.data.file_url;
        link.target = '_blank';
        link.download = res.data.title || 'document';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        if (doc.is_vip) {
          alert('Mở khóa và tải tài liệu thành công!');
        }
        await refreshUser();
        // Reload documents list to update download counts
        getDocuments().then(r => setDocuments(r.data?.documents || r.data || []));
      }
    } catch (e) {
      setError(e.response?.data?.message || e.response?.data?.error || 'Có lỗi xảy ra khi tải tài liệu');
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="container" style={{ padding: '32px 16px', maxWidth: 900 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ marginBottom: 6 }}>Tài liệu Học tập</h1>
          <p style={{ color: 'var(--text-muted)' }}>Tải đề cương ôn tập, file đề thi PDF và tài liệu hướng dẫn giải nhanh</p>
        </div>
        {isLoggedIn && (
          <div style={{ background: 'var(--accent-light)', padding: '8px 16px', borderRadius: 'var(--radius)', display: 'flex', alignItems: 'center', gap: 8, border: '1px solid var(--accent)' }}>
            <Award size={18} color="var(--accent)" />
            <span>Điểm của bạn: <strong style={{ color: 'var(--accent)' }}>{user?.points || 0}</strong></span>
          </div>
        )}
      </div>

      {error && (
        <div className="alert alert-danger" style={{ marginBottom: 20 }}>
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="page-loading"><div className="spinner" /></div>
      ) : documents.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>
          <FileText size={48} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
          <p>Chưa có tài liệu học tập nào được tải lên</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {documents.map(doc => (
            <div key={doc.id} className="card" style={{ display: 'flex', alignItems: 'center', padding: '16px 20px', gap: 16 }}>
              <div style={{ width: 44, height: 44, borderRadius: 'var(--radius)', background: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <FileText size={24} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: 0 }}>{doc.title}</h3>
                  {doc.is_vip && (
                    <span className="badge badge-warning" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', fontSize: '0.75rem' }}>
                      <Sparkles size={10} /> VIP ({doc.points_required}đ)
                    </span>
                  )}
                </div>
                {doc.description && <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: '0 0 6px' }}>{doc.description}</p>}
                <div style={{ display: 'flex', gap: 16, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  {doc.grade && <span>Khối: {doc.grade}</span>}
                  {doc.download_count !== undefined && <span>Lượt tải: {doc.download_count}</span>}
                </div>
              </div>
              <div>
                <button
                  className={`btn ${doc.is_vip ? 'btn-accent' : 'btn-primary'} btn-sm`}
                  onClick={() => handleDownload(doc)}
                  disabled={processingId === doc.id}
                >
                  <Download size={16} style={{ marginRight: 4 }} />
                  {processingId === doc.id ? 'Đang tải...' : doc.is_vip ? 'Mở khóa & Tải' : 'Tải xuống'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
