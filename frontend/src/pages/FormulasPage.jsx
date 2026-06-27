import React, { useEffect, useState, useCallback } from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';
import { getPublicFormulas, submitFormula } from '../api/formulas';
import { useAuth } from '../contexts/AuthContext';
import { Search, X, Clock, CheckCircle, BookOpen, Star } from 'lucide-react';

// --- LaTeX renderer using KaTeX npm package ---
function LatexDisplay({ latex, block = false }) {
  const ref = React.useRef(null);

  useEffect(() => {
    if (!latex || !ref.current) return;
    try {
      katex.render(latex, ref.current, {
        throwOnError: false,
        displayMode: block,
        output: 'html',
      });
    } catch {
      if (ref.current) ref.current.textContent = latex;
    }
  }, [latex, block]);

  if (!latex) return null;
  return <span ref={ref} />;
}

const CATEGORIES = [
  { value: 'all', label: 'Tất cả' },
  { value: 'dai-so', label: 'Đại số' },
  { value: 'hinh-hoc', label: 'Hình học' },
  { value: 'giai-tich', label: 'Giải tích' },
  { value: 'to-hop', label: 'Tổ hợp - XS' },
  { value: 'luong-giac', label: 'Lượng giác' },
  { value: 'khac', label: 'Khác' },
];

function timeAgo(dateStr) {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins} phút trước`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} giờ trước`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days} ngày trước`;
  return new Date(dateStr).toLocaleDateString('vi-VN');
}

function FormulaCard({ formula }) {
  const initials = (formula.creator_username || '?')[0].toUpperCase();
  return (
    <div style={{
      background: '#fff',
      borderRadius: 16,
      border: '1px solid #e2e8f0',
      padding: '20px 22px',
      display: 'flex',
      flexDirection: 'column',
      gap: 12,
      transition: 'box-shadow 0.2s, transform 0.2s',
      cursor: 'default',
    }}
      onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 8px 24px rgba(99,102,241,0.12)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow = ''; e.currentTarget.style.transform = ''; }}
    >
      {/* Title */}
      <div style={{ fontWeight: 800, fontSize: '1rem', color: '#1e293b', lineHeight: 1.4 }}>
        {formula.title}
      </div>

      {/* Formula display */}
      {formula.latex && (
        <div style={{
          background: 'linear-gradient(135deg, #f8faff 0%, #f0f4ff 100%)',
          border: '1px solid #c7d2fe',
          borderRadius: 12,
          padding: '16px 20px',
          textAlign: 'center',
          minHeight: 56,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '1.1rem',
          overflowX: 'auto',
        }}>
          <LatexDisplay latex={formula.latex} block={true} />
        </div>
      )}

      {/* Image fallback */}
      {!formula.latex && formula.image_url && (
        <div style={{ borderRadius: 10, overflow: 'hidden', border: '1px solid #e2e8f0' }}>
          <img src={formula.image_url} alt={formula.title} style={{ width: '100%', maxHeight: 160, objectFit: 'contain', background: '#f8faff' }} />
        </div>
      )}

      {/* Description */}
      {formula.description && (
        <p style={{ fontSize: '0.875rem', color: '#475569', margin: 0, lineHeight: 1.6 }}>
          {formula.description}
        </p>
      )}

      {/* Footer */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 4, paddingTop: 12, borderTop: '1px solid #f1f5f9' }}>
        <div style={{
          width: 28, height: 28, borderRadius: '50%',
          background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
          color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 12, fontWeight: 800, flexShrink: 0,
        }}>{initials}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#334155', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {formula.creator_username || 'Ẩn danh'}
          </div>
          <div style={{ fontSize: '0.72rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 4 }}>
            <Clock size={10} /> {timeAgo(formula.created_at)}
          </div>
        </div>
        <span style={{
          fontSize: '0.7rem', fontWeight: 700, padding: '3px 8px', borderRadius: 20,
          background: '#dcfce7', color: '#16a34a',
        }}>
          <CheckCircle size={10} style={{ marginRight: 3 }} />Đã duyệt
        </span>
      </div>
    </div>
  );
}

function SubmitModal({ onClose, onSubmit }) {
  const [form, setForm] = useState({ title: '', latex: '', description: '' });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    setSubmitting(true);
    try {
      await onSubmit(form);
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, backdropFilter: 'blur(4px)', padding: 16 }}>
      <div style={{ background: '#fff', borderRadius: 20, width: '100%', maxWidth: 560, padding: 32, boxShadow: '0 24px 48px rgba(0,0,0,0.2)', maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 900, color: '#1e293b' }}>Đóng góp công thức để nhận 100 điểm khi được duyệt</h2>
            <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: 6 }}>
              Công thức sẽ được admin xem xét trước khi hiển thị
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: '#d97706', fontWeight: 800 }}>
                <Star size={14} fill="#facc15" color="#eab308" /> +100 điểm khi được duyệt
              </span>
            </p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', padding: 4 }}><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div>
            <label style={{ display: 'block', fontWeight: 700, fontSize: '0.875rem', color: '#374151', marginBottom: 6 }}>
              Tên công thức <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <input
              className="form-control"
              required
              placeholder="Ví dụ: Công thức nghiệm phương trình bậc 2"
              value={form.title}
              onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontWeight: 700, fontSize: '0.875rem', color: '#374151', marginBottom: 6 }}>
              Công thức LaTeX
            </label>
            <input
              className="form-control"
              placeholder="Ví dụ: x = \frac{-b \pm \sqrt{b^2 - 4ac}}{2a}"
              value={form.latex}
              onChange={e => setForm(p => ({ ...p, latex: e.target.value }))}
              style={{ fontFamily: 'monospace' }}
            />
            {form.latex && (
              <div style={{ marginTop: 8, padding: '12px 16px', background: '#f8faff', border: '1px solid #c7d2fe', borderRadius: 10, textAlign: 'center', fontSize: '1.05rem' }}>
                <LatexDisplay latex={form.latex} block={true} />
              </div>
            )}
            <p style={{ margin: '6px 0 0', fontSize: '0.78rem', color: '#94a3b8' }}>
              💡 Nhập LaTeX để hiển thị đẹp. Ví dụ: <code style={{ background: '#f1f5f9', padding: '1px 4px', borderRadius: 4 }}>{'\\frac{a}{b}'}</code>
            </p>
          </div>

          <div>
            <label style={{ display: 'block', fontWeight: 700, fontSize: '0.875rem', color: '#374151', marginBottom: 6 }}>
              Mô tả / Ghi chú
            </label>
            <textarea
              className="form-control"
              rows={3}
              placeholder="Giải thích ý nghĩa, điều kiện áp dụng của công thức..."
              value={form.description}
              onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
              style={{ resize: 'vertical' }}
            />
          </div>

          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', paddingTop: 8 }}>
            <button type="button" onClick={onClose} className="btn btn-secondary">Hủy</button>
            <button type="submit" className="btn btn-primary" disabled={submitting} style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', border: 'none' }}>
              {submitting ? 'Đang gửi...' : '🚀 Gửi đóng góp'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function FormulasPage() {
  const { isLoggedIn, refreshUser } = useAuth();
  const [formulas, setFormulas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const loadFormulas = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getPublicFormulas();
      setFormulas(res.data?.formulas || []);
    } catch (err) {
      console.error('Error loading formulas:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadFormulas(); }, [loadFormulas]);

  const handleSubmit = async (form) => {
    await submitFormula(form);
    await refreshUser();
    showToast('Gửi thành công! Công thức đang chờ admin duyệt. Bạn sẽ nhận +100 điểm sau khi được duyệt.');
  };

  const filtered = formulas.filter(f =>
    !search || f.title?.toLowerCase().includes(search.toLowerCase()) ||
    f.description?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc' }}>
      {/* Hero Banner */}
      <div style={{
        background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 50%, #6366f1 100%)',
        padding: '56px 20px 48px',
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Decorative blobs */}
        <div style={{ position: 'absolute', top: -40, right: -40, width: 200, height: 200, borderRadius: '50%', background: 'rgba(255,255,255,0.06)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: -60, left: -60, width: 280, height: 280, borderRadius: '50%', background: 'rgba(255,255,255,0.04)', pointerEvents: 'none' }} />

        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ fontSize: 52, marginBottom: 12, lineHeight: 1 }}>📐</div>
          <h1 style={{ color: '#fff', fontSize: 'clamp(1.75rem, 4vw, 2.5rem)', fontWeight: 900, margin: '0 0 12px', letterSpacing: '-0.5px' }}>
            Kho Công Thức Toán
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '1rem', margin: '0 auto 28px', maxWidth: 520 }}>
            Tổng hợp các công thức toán học được cộng đồng đóng góp và kiểm duyệt
          </p>

          {/* Search */}
          <div style={{ display: 'flex', maxWidth: 500, margin: '0 auto 24px', background: '#fff', borderRadius: 50, overflow: 'hidden', boxShadow: '0 4px 24px rgba(0,0,0,0.15)' }}>
            <div style={{ padding: '0 16px', display: 'flex', alignItems: 'center', color: '#94a3b8' }}>
              <Search size={18} />
            </div>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Tìm công thức..."
              style={{ flex: 1, border: 'none', outline: 'none', fontSize: '0.95rem', padding: '14px 0', background: 'transparent', color: '#1e293b' }}
            />
            {search && (
              <button onClick={() => setSearch('')} style={{ padding: '0 16px', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}>
                <X size={16} />
              </button>
            )}
          </div>

          {/* Stats & CTA */}
          <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
            <div style={{ background: 'rgba(255,255,255,0.15)', borderRadius: 20, padding: '8px 18px', color: '#fff', fontSize: '0.875rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
              <BookOpen size={15} /> {formulas.length} công thức
            </div>
            {isLoggedIn ? (
              <button
                onClick={() => setShowModal(true)}
                style={{ background: '#fff', color: '#6366f1', border: 'none', borderRadius: 20, padding: '8px 20px', fontWeight: 800, fontSize: '0.875rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, boxShadow: '0 2px 12px rgba(0,0,0,0.1)', transition: 'transform 0.15s' }}
                onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.03)'}
                onMouseLeave={e => e.currentTarget.style.transform = ''}
              >
                <Star size={16} fill="#facc15" color="#eab308" /> Đóng góp công thức để nhận 100 điểm khi được duyệt
              </button>
            ) : (
              <a href="/login" style={{ background: '#fff', color: '#6366f1', borderRadius: 20, padding: '8px 20px', fontWeight: 800, fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
                Đăng nhập để đóng góp
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 20px' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '80px 0' }}>
            <div className="spinner" style={{ margin: '0 auto 16px' }} />
            <p style={{ color: '#64748b' }}>Đang tải công thức...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 20px' }}>
            <div style={{ fontSize: 56, marginBottom: 16 }}>{search ? '🔍' : '📭'}</div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#1e293b', margin: '0 0 8px' }}>
              {search ? 'Không tìm thấy công thức phù hợp' : 'Chưa có công thức nào'}
            </h3>
            <p style={{ color: '#64748b', margin: '0 0 24px' }}>
              {search ? `Thử tìm kiếm với từ khóa khác` : 'Hãy là người đầu tiên đóng góp!'}
            </p>
            {search && (
              <button onClick={() => setSearch('')} className="btn btn-primary" style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', border: 'none' }}>
                Xóa bộ lọc
              </button>
            )}
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <p style={{ color: '#64748b', fontSize: '0.9rem', margin: 0 }}>
                Hiển thị <strong style={{ color: '#1e293b' }}>{filtered.length}</strong> công thức
                {search && <> cho "<strong style={{ color: '#6366f1' }}>{search}</strong>"</>}
              </p>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 320px), 1fr))',
              gap: 20,
            }}>
              {filtered.map(f => (
                <FormulaCard key={f.id} formula={f} />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Submit Modal */}
      {showModal && (
        <SubmitModal
          onClose={() => setShowModal(false)}
          onSubmit={handleSubmit}
        />
      )}

      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: 24, right: 24, zIndex: 10000,
          background: toast.type === 'success' ? '#16a34a' : '#dc2626',
          color: '#fff', padding: '14px 20px', borderRadius: 14,
          fontWeight: 700, fontSize: '0.9rem', boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
          animation: 'slideUp 0.2s ease',
          maxWidth: 340,
        }}>
          {toast.msg}
        </div>
      )}
    </div>
  );
}
