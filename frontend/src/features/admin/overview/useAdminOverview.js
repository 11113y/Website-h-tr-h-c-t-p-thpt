/**
 * useAdminOverview.js — ViewModel Hook
 * Manages dashboard overview stats and chart data.
 */
import { useState } from 'react';
import axios from 'axios';

export function useAdminOverview() {
  const [stats,   setStats]   = useState(null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');
  const [rangeLabel, setRangeLabel] = useState('7 ngày qua');

  const fetchDashboard = async () => {
    setLoading(true); setError('');
    try {
      const res = await axios.get('/api/admin/dashboard');
      if (res.data?.success) setStats(res.data.stats);
      else setError('Không thể tải số liệu thống kê tổng quan.');
    } catch (err) {
      console.error(err);
      setError('Đã xảy ra lỗi khi tải số liệu thống kê tổng quan.');
    } finally { setLoading(false); }
  };

  // Derived chart data
  const rangeKey = rangeLabel === '7 ngày qua' ? '7days' : rangeLabel === '30 ngày qua' ? '30days' : 'month';
  const growthData = stats?.userGrowth?.[rangeKey] || [];
  const counts     = growthData.map((d) => d.count);
  const maxCount   = counts.length > 0 ? Math.max(...counts, 1) : 1;
  const minCount   = counts.length > 0 ? Math.min(...counts, 0) : 0;
  const diff       = maxCount - minCount || 1;

  const chartPoints = growthData.map((d, i) => {
    const x = growthData.length > 1 ? 20 + (i / (growthData.length - 1)) * 460 : 250;
    const y = 160 - ((d.count - minCount) / diff) * 120;
    return { x, y, label: d.label, count: d.count };
  });

  const linePath  = chartPoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const areaPath  = chartPoints.length > 0
    ? `${linePath} L ${chartPoints[chartPoints.length - 1].x} 180 L ${chartPoints[0].x} 180 Z`
    : '';

  // MOET Score distribution donut
  const moetDist  = stats?.moetDistribution || { kem: 0, yeu: 0, trungBinh: 0, kha: 0, gioi: 0 };
  const totalAttempts = Object.values(moetDist).reduce((a, b) => a + b, 0);

  const rawSegments = [
    { key: 'gioi',      label: 'Giỏi',       color: '#006b58', count: moetDist.gioi },
    { key: 'kha',       label: 'Khá',        color: '#2563eb', count: moetDist.kha },
    { key: 'trungBinh', label: 'Trung bình', color: '#d97706', count: moetDist.trungBinh },
    { key: 'yeu',       label: 'Yếu',        color: '#ea580c', count: moetDist.yeu },
    { key: 'kem',       label: 'Kém',        color: '#dc2626', count: moetDist.kem },
  ];

  let moetSegments = [];
  let moetPassRate = 0;

  if (totalAttempts > 0) {
    const passAttempts = (moetDist.gioi || 0) + (moetDist.kha || 0) + (moetDist.trungBinh || 0);
    moetPassRate = Math.round((passAttempts / totalAttempts) * 100);

    let calculatedSegments = rawSegments.map(seg => ({
      ...seg,
      percent: Math.round((seg.count / totalAttempts) * 100)
    }));

    const sum = calculatedSegments.reduce((s, seg) => s + seg.percent, 0);
    if (sum !== 100 && sum > 0) {
      const nonZeroSeg = calculatedSegments.find(seg => seg.count > 0);
      if (nonZeroSeg) {
        nonZeroSeg.percent += (100 - sum);
      }
    }

    let cumulativePercent = 0;
    moetSegments = calculatedSegments.map(seg => {
      const arc = Math.round((seg.percent / 100) * 377);
      const rotation = -90 + (cumulativePercent * 3.6);
      cumulativePercent += seg.percent;
      return { ...seg, arc, rotation };
    });
  } else {
    moetSegments = rawSegments.map(seg => ({ ...seg, percent: 0, arc: 0, rotation: -90 }));
  }

  return {
    stats, loading, error, rangeLabel, setRangeLabel,
    chartPoints, linePath, areaPath,
    moetSegments, moetPassRate, totalAttempts,
    fetchDashboard,
  };
}
