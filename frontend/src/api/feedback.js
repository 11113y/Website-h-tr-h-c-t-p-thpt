import client from './client';

export const createFeedback = (data) => client.post('/feedbacks', data);
export const getFeedbacks = (params) => client.get('/feedbacks', { params });
export const getFeedbackDetail = (id) => client.get(`/feedbacks/${id}`);
export const updateFeedback = (id, data) => client.put(`/feedbacks/${id}`, data);
