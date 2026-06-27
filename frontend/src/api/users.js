import client from './client';

export const getStats = () => client.get('/users/stats');
export const getAnalytics = () => client.get('/users/analytics');
export const getLeaderboard = (params) => client.get('/users/leaderboard', { params });
export const getHistory = (params) => client.get('/users/history', { params });
export const updateProfile = (data) => client.put('/users/profile', data);
export const changePassword = (data) => client.put('/users/change-password', data);
export const restoreStreak = () => client.post('/users/restore-streak');
