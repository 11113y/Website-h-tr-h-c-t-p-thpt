import client from './client';

export const getSubjects = () => client.get('/subjects');
export const getChapters = (subjectId) => client.get(`/subjects/${subjectId}/chapters`);
export const getLessons = (chapterId) => client.get(`/chapters/${chapterId}/lessons`);
export const getLessonDetail = (lessonId) => client.get(`/lessons/${lessonId}`);
export const unlockLesson = (lessonId) => client.post(`/lessons/${lessonId}/unlock`);
export const completeLesson = (lessonId) => client.post(`/lessons/${lessonId}/complete`);

export const getStudyMaterials = (lessonId) => client.get(`/lessons/${lessonId}/study-materials`);
export const getStudyMaterialDetail = (materialId) => client.get(`/study-materials/${materialId}`);
export const unlockStudyMaterial = (materialId) => client.post(`/study-materials/${materialId}/unlock`);
export const completeStudyMaterial = (materialId) => client.post(`/study-materials/${materialId}/complete`);
export const getGlobalStats = () => client.get('/subjects/stats/global');
