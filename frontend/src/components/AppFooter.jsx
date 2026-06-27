import React from 'react';
import { NavLink } from 'react-router-dom';

export default function AppFooter() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          <div>
            <div className="footer-brand">📐 TD Math</div>
            <p className="footer-desc">Nền tảng học toán tương tác hàng đầu Việt Nam. Học tập theo lộ trình, luyện đề thi, chinh phục mọi kỳ thi.</p>
          </div>
          <div>
            <div className="footer-heading">Học tập</div>
            <div className="footer-links">
              <NavLink to="/learn">Lộ trình học</NavLink>
              <NavLink to="/exams">Kho đề thi</NavLink>
              <NavLink to="/documents">Tài liệu</NavLink>
              <NavLink to="/articles">Bài viết</NavLink>
            </div>
          </div>
          <div>
            <div className="footer-heading">Cộng đồng</div>
            <div className="footer-links">
              <NavLink to="/leaderboard">Bảng xếp hạng</NavLink>
              <NavLink to="/feedback">Đóng góp ý kiến</NavLink>
            </div>
          </div>
          <div>
            <div className="footer-heading">Tài khoản</div>
            <div className="footer-links">
              <NavLink to="/login">Đăng nhập</NavLink>
              <NavLink to="/register">Đăng ký</NavLink>
              <NavLink to="/profile">Hồ sơ</NavLink>
              <NavLink to="/saved-questions">Câu hỏi đã lưu</NavLink>
              <NavLink to="/collections">Bộ sưu tập</NavLink>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <span>© 2025 TD Math. Mọi quyền được bảo lưu.</span>
          <span>Made with ❤️ for Vietnamese students</span>
        </div>
      </div>
    </footer>
  );
}
