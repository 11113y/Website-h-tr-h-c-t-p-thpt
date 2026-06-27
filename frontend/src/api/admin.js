import client from './client';

export const getDashboard = () => client.get('/admin/dashboard');
export const getReports = () => client.get('/admin/reports');
export const getAllAttempts = (params) => client.get('/admin/attempts', { params });
export const getAdminUsers = (params) => client.get('/admin/users', { params });
export const createUser = (data) => client.post('/admin/users', data);
export const updateUser = (id, data) => client.put(`/admin/users/${id}`, data);
export const deleteUser = (id) => client.delete(`/admin/users/${id}`);

// Subjects
export const createSubject = (data) => client.post('/admin/subjects', data);
export const updateSubject = (id, data) => client.put(`/admin/subjects/${id}`, data);
export const deleteSubject = (id) => client.delete(`/admin/subjects/${id}`);

// Chapters
export const createChapter = (data) => client.post('/admin/chapters', data);
export const updateChapter = (id, data) => client.put(`/admin/chapters/${id}`, data);
export const deleteChapter = (id) => client.delete(`/admin/chapters/${id}`);

// Lessons
export const createLesson = (data) => client.post('/admin/lessons', data);
export const updateLesson = (id, data) => client.put(`/admin/lessons/${id}`, data);
export const deleteLesson = (id) => client.delete(`/admin/lessons/${id}`);

// Study Materials
export const getStudyMaterials = (params) => client.get('/admin/study-materials', { params });
export const createStudyMaterial = (data) => client.post('/admin/study-materials', data);
export const updateStudyMaterial = (id, data) => client.put(`/admin/study-materials/${id}`, data);
export const deleteStudyMaterial = (id) => client.delete(`/admin/study-materials/${id}`);

// Questions
export const createQuestion = (data) => client.post('/admin/questions', data);
export const updateQuestion = (id, data) => client.put(`/admin/questions/${id}`, data);
export const deleteQuestion = (id) => client.delete(`/admin/questions/${id}`);
export const getChapterQuestions = (chapterId) => client.get(`/admin/chapters/${chapterId}/questions`);
export const getQuestions = (params) => client.get('/admin/questions', { params });

// Exams
export const getAdminExamDetail = (id) => client.get(`/admin/exams/${id}`);
export const createExam = (data) => client.post('/admin/exams', data);
export const updateExam = (id, data) => client.put(`/admin/exams/${id}`, data);
export const deleteExam = (id) => client.delete(`/admin/exams/${id}`);

// Documents
export const createDocument = (data) => client.post('/admin/documents', data);
export const deleteDocument = (id) => client.delete(`/admin/documents/${id}`);

// Articles
export const createArticle = (data) => client.post('/admin/articles', data);
export const updateArticle = (id, data) => client.put(`/admin/articles/${id}`, data);
export const deleteArticle = (id) => client.delete(`/admin/articles/${id}`);

export const uploadFile = (file) => {
  const formData = new FormData();
  formData.append('file', file);
  return client.post('/admin/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};

// Formulas
export const getFormulas = () => client.get('/admin/formulas');
export const createFormula = (data) => client.post('/admin/formulas', data);
export const updateFormula = (id, data) => client.put(`/admin/formulas/${id}`, data);
export const deleteFormula = (id) => client.delete(`/admin/formulas/${id}`);
export const approveFormula = (id) => client.post(`/admin/formulas/${id}/approve`);
export const rejectFormula = (id) => client.post(`/admin/formulas/${id}/reject`);

// Settings
export const getSettings = () => client.get('/admin/settings');
export const saveSettings = (data) => client.post('/admin/settings', data);



