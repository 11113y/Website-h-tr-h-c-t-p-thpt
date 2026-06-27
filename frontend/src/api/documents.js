import client from './client';

export const getDocuments = (params) => client.get('/documents', { params });
export const downloadDocument = (id) => client.post(`/documents/${id}/download`);
