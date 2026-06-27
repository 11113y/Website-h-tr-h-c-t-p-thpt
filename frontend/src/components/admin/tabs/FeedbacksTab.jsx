import React, { useEffect, useState } from 'react';
import { MessageSquare, RefreshCw, Save } from 'lucide-react';
import { getFeedbacks, updateFeedback } from '../../../api/feedback';
import { useDialog } from '../../../contexts/DialogContext';

const STATUS_LABELS = {
  pending: 'Chờ xử lý',
  reviewed: 'Đã xem',
  resolved: 'Đã phản hồi',
};

export default function FeedbacksTab() {
  const { alert } = useDialog();
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [savingId, setSavingId] = useState(null);
  const [drafts, setDrafts] = useState({});

  const loadFeedbacks = async () => {
    setLoading(true);
    try {
      const res = await getFeedbacks(filter ? { status: filter } : undefined);
      const items = res.data?.feedbacks || [];
      setFeedbacks(items);
      setDrafts(Object.fromEntries(items.map(item => [
        item.id,
        {
          status: item.status || 'pending',
          admin_notes: item.admin_notes || '',
        }
      ])));
    } catch (err) {
      console.error(err);
      alert('Không thể tải danh sách góp ý.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFeedbacks();
  }, [filter]);

  const saveFeedback = async (id) => {
    setSavingId(id);
    try {
      await updateFeedback(id, drafts[id]);
      alert('Đã cập nhật phản hồi!');
      loadFeedbacks();
    } catch (err) {
      console.error(err);
      alert('Không thể cập nhật phản hồi.');
    } finally {
      setSavingId(null);
    }
  };

  if (loading) {
    return <div className="page-loading" style={{ padding: '60px 0' }}><div className="spinner" /></div>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <MessageSquare size={22} color="var(--primary)" />
          <div>
            <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 900, color: '#1e293b' }}>Góp ý & phản hồi</h3>
            <p style={{ margin: '2px 0 0', color: 'var(--text-muted)', fontSize: '0.85rem' }}>Xem góp ý học sinh gửi và phản hồi lại cho từng mục.</p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <select className="form-control" style={{ width: 160 }} value={filter} onChange={e => setFilter(e.target.value)}>
            <option value="">Tất cả</option>
            <option value="pending">Chờ xử lý</option>
            <option value="reviewed">Đã xem</option>
            <option value="resolved">Đã phản hồi</option>
          </select>
          <button className="btn btn-ghost btn-sm" onClick={loadFeedbacks}>
            <RefreshCw size={15} /> Tải lại
          </button>
        </div>
      </div>

      {feedbacks.length === 0 ? (
        <div className="card" style={{ padding: 36, textAlign: 'center', color: 'var(--text-muted)' }}>
          Chưa có góp ý nào.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {feedbacks.map(item => {
            const draft = drafts[item.id] || { status: item.status || 'pending', admin_notes: item.admin_notes || '' };
            return (
              <div key={item.id} className="card" style={{ padding: 18 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, marginBottom: 10 }}>
                  <div>
                    <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 900, color: '#1e293b' }}>{item.title || 'Góp ý từ học sinh'}</h4>
                    <div style={{ marginTop: 4, color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                      {new Date(item.created_at).toLocaleString('vi-VN')} · {item.feedback_type || 'general'}
                    </div>
                  </div>
                  <span className="badge badge-primary">{STATUS_LABELS[item.status] || item.status}</span>
                </div>

                <p style={{ color: 'var(--text)', lineHeight: 1.6, margin: '0 0 14px' }}>{item.content}</p>

                <div style={{ display: 'grid', gridTemplateColumns: '180px 1fr auto', gap: 12, alignItems: 'start' }}>
                  <select
                    className="form-control"
                    value={draft.status}
                    onChange={e => setDrafts(prev => ({ ...prev, [item.id]: { ...draft, status: e.target.value } }))}
                  >
                    <option value="pending">Chờ xử lý</option>
                    <option value="reviewed">Đã xem</option>
                    <option value="resolved">Đã phản hồi</option>
                  </select>
                  <textarea
                    className="form-control"
                    rows={2}
                    placeholder="Nhập phản hồi cho học sinh..."
                    value={draft.admin_notes}
                    onChange={e => setDrafts(prev => ({ ...prev, [item.id]: { ...draft, admin_notes: e.target.value } }))}
                  />
                  <button className="btn btn-primary btn-sm" onClick={() => saveFeedback(item.id)} disabled={savingId === item.id}>
                    <Save size={15} /> {savingId === item.id ? 'Đang lưu' : 'Lưu'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
