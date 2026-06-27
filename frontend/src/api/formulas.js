import client from './client';

// Public endpoints (no auth required)
export const getPublicFormulas = () => client.get('/formulas');
export const submitFormula = (data) => client.post('/formulas', data);
