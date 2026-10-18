import api from './api';

export const documentService = {
  getRequests: async (params) => (await api.get('/document-requests', { params })).data,

  getRequestsByStudent: async (studentNumber, pagination) =>
    (await api.get('/document-requests', { params: { studentNumber, ...pagination } })).data,

  submitRequest: async (requestData) => (await api.post('/document-requests', requestData)).data,

  updateRequestStatus: async (requestId, status, remarks) =>
    (await api.patch(`/document-requests/${requestId}/status`, { status, remarks })).data
};
