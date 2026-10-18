import api from './api';

export const paymentService = {
  getPayments: async (params) => (await api.get('/payments', { params })).data,

  getPaymentsByStudent: async (studentNumber, pagination) =>
    (await api.get('/payments', { params: { studentNumber, ...pagination } })).data,

  submitPaymentProof: async (paymentData) => (await api.post('/payments', paymentData)).data,

  verifyPayment: async (paymentId, status, remarks) =>
    (await api.patch(`/payments/${paymentId}/verify`, { status, remarks })).data
};
