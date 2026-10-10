import api from './api';

export const documentService = {
  getRequests: async () => (await api.get('/document-requests')).data,

  getRequestsByStudent: async (studentNumber) =>
    (await api.get('/document-requests', { params: { studentNumber } })).data,

  submitRequest: async (requestData) => (await api.post('/document-requests', requestData)).data,

  updateRequestStatus: async (requestId, status, remarks) =>
    (await api.patch(`/document-requests/${requestId}/status`, { status, remarks })).data
};
