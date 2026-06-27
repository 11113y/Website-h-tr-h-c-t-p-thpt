import client from './client';

export const getArticles = (params) => client.get('/articles', { params });
export const getArticleDetail = (id) => client.get(`/articles/${id}`);
