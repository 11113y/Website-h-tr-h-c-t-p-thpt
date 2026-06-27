import React from 'react';

export default function UsersTab({
  activeTab,
  usersList,
  userTotal,
  userSearch,
  setUserSearch,
  userPage,
  setUserPage,
  setEditingUser,
  handleDelete
}) {
  const targetRole = activeTab === 'students' ? 'student' : 'admin';
  const userTotalPages = Math.ceil(userTotal / 20);
  const paginatedUsers = usersList;

  const getPageNumbers = (current, total) => {
    const delta = 1; // Show current and 1 page before/after
    const range = [];
    const rangeWithDots = [];
    let l;

    for (let i = 1; i <= total; i++) {
      if (i === 1 || i === total || (i >= current - delta && i <= current + delta)) {
        range.push(i);
      }
    }

    for (let i of range) {
      if (l) {
        if (i - l === 2) {
          rangeWithDots.push(l + 1);
        } else if (i - l > 2) {
          rangeWithDots.push('...');
        }
      }
      rangeWithDots.push(i);
      l = i;
    }

    return rangeWithDots;
  };

  const pages = getPageNumbers(userPage, userTotalPages);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Search box */}
      <div style={{ display: 'flex', gap: 12 }}>
        <input 
          type="text" 
          placeholder={activeTab === 'students' ? "Tìm kiếm học sinh theo họ tên hoặc email..." : "Tìm kiếm admin theo họ tên hoặc email..."}
          className="form-control" 
          style={{ maxWidth: 400 }}
          value={userSearch}
          onChange={e => { setUserSearch(e.target.value); setUserPage(1); }}
        />
      </div>

      <div className="card" style={{ borderRadius: 16, overflow: 'hidden' }}>
        <div className="table-wrapper" style={{ margin: 0 }}>
          <table className="table">
            <thead>
              <tr>
                <th>Họ tên</th>
                <th>Email</th>
                <th>Vai trò</th>
                {activeTab === 'students' && <th>Điểm tích lũy</th>}
                {activeTab === 'students' && <th>Chuỗi ngày học</th>}
                <th>Ngày tham gia</th>
                <th style={{ textAlign: 'right' }}>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {paginatedUsers.length === 0 ? (
                <tr>
                  <td colSpan={activeTab === 'students' ? 7 : 5} style={{ textAlign: 'center', padding: 24, color: 'var(--text-muted)' }}>
                    Không có thành viên nào
                  </td>
                </tr>
              ) : paginatedUsers.map(u => (
                <tr key={u.id}>
                  <td style={{ fontWeight: 700 }}>{u.username}</td>
                  <td>{u.email}</td>
                  <td>
                    <span 
                      className="badge" 
                      style={{ 
                        background: u.role?.toLowerCase() === 'admin' ? '#fee2e2' : '#e0f2fe',
                        color: u.role?.toLowerCase() === 'admin' ? '#991b1b' : '#0369a1',
                        fontWeight: 700
                      }}
                    >
                      {u.role?.toUpperCase()}
                    </span>
                  </td>
                  {activeTab === 'students' && <td><span style={{ fontWeight: 700, color: 'var(--primary)' }}>{u.points || 0}</span></td>}
                  {activeTab === 'students' && <td><span style={{ fontWeight: 700, color: '#f97316' }}>🔥 {u.streak_count || 0}</span></td>}
                  <td style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{new Date(u.created_at).toLocaleDateString('vi-VN')}</td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                      <button 
                        className="btn btn-ghost btn-sm"
                        onClick={() => setEditingUser({ ...u, password: '' })}
                        style={{ color: '#2563eb', padding: '4px 8px', fontSize: '0.8rem', fontWeight: 700 }}
                      >
                        Sửa
                      </button>
                      <button 
                        className="btn btn-ghost btn-sm"
                        onClick={() => handleDelete('user', u.id)}
                        style={{ color: '#dc2626', padding: '4px 8px', fontSize: '0.8rem', fontWeight: 700 }}
                      >
                        Xóa
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {userTotalPages > 1 && (
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            padding: '16px 24px', 
            borderTop: '1px solid #e2e8f0', 
            background: '#f8fafc',
            flexWrap: 'wrap',
            gap: 12
          }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#64748b' }}>
              Hiển thị {paginatedUsers.length} trên {userTotal} thành viên
            </span>

            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              {/* Prev page button */}
              <button 
                onClick={() => setUserPage(p => Math.max(1, p - 1))}
                disabled={userPage === 1}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  border: '1px solid #e2e8f0',
                  background: '#fff',
                  color: userPage === 1 ? '#cbd5e1' : '#475569',
                  cursor: userPage === 1 ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s ease',
                  fontWeight: 700
                }}
              >
                &lt;
              </button>

              {pages.map((p, idx) => {
                if (p === '...') {
                  return (
                    <span key={`dots-${idx}`} style={{ width: 32, textAlign: 'center', color: '#94a3b8', fontWeight: 600 }}>
                      ...
                    </span>
                  );
                }

                const isActive = p === userPage;
                return (
                  <button
                    key={p}
                    onClick={() => setUserPage(p)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: 32,
                      height: 32,
                      borderRadius: 8,
                      border: isActive ? 'none' : '1px solid #e2e8f0',
                      background: isActive ? 'var(--primary)' : '#fff',
                      color: isActive ? '#fff' : '#475569',
                      cursor: 'pointer',
                      fontWeight: 700,
                      fontSize: '0.9rem',
                      transition: 'all 0.2s ease',
                      boxShadow: isActive ? '0 2px 4px rgba(0,0,0,0.1)' : 'none'
                    }}
                    onMouseEnter={e => {
                      if (!isActive) {
                        e.currentTarget.style.backgroundColor = '#f1f5f9';
                        e.currentTarget.style.borderColor = '#cbd5e1';
                      }
                    }}
                    onMouseLeave={e => {
                      if (!isActive) {
                        e.currentTarget.style.backgroundColor = '#fff';
                        e.currentTarget.style.borderColor = '#e2e8f0';
                      }
                    }}
                  >
                    {p}
                  </button>
                );
              })}

              {/* Next page button */}
              <button 
                onClick={() => setUserPage(p => Math.min(userTotalPages, p + 1))}
                disabled={userPage === userTotalPages}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  border: '1px solid #e2e8f0',
                  background: '#fff',
                  color: userPage === userTotalPages ? '#cbd5e1' : '#475569',
                  cursor: userPage === userTotalPages ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s ease',
                  fontWeight: 700
                }}
              >
                &gt;
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
