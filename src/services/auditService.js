import api from './api';

// Audit entries are written by the server, the frontend only reads them
export const auditService = {
  getLogs: async (params) => (await api.get('/audit-logs', { params })).data
};
