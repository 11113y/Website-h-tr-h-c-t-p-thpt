/**
 * useAdminReports.js — ViewModel Hook
 * Manages report statistics state and API fetching.
 */
import { useState } from 'react';
import axios from 'axios';

export function useAdminReports({ showAlert }) {
  const [reports,  setReports]  = useState(null);
  const [loading,  setLoading]  = useState(false);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/admin/reports');
      if (res.data?.success) {
        setReports(res.data.reports);
      } else {
        showAlert('Không thể tải dữ liệu báo cáo.', 'Lỗi', 'error');
      }
    } catch (err) {
      console.error(err);
      showAlert('Đã xảy ra lỗi khi tải dữ liệu báo cáo thống kê.', 'Lỗi', 'error');
    } finally {
      setLoading(false);
    }
  };

  return { reports, loading, fetchReports };
}
