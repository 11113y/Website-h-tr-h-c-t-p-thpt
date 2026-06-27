import client from './client';

export const getExams = (params) => client.get('/exams', { params });
export const getExamDetail = (id) => client.get(`/exams/${id}`);
export const submitExam = (id, data) => client.post(`/exams/${id}/submit`, data);
export const getExplanations = (id) => client.get(`/exams/${id}/explanations`);
