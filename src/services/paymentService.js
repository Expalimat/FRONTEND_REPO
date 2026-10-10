import api from './api';

export const paymentService = {
  getPayments: async () => (await api.get('/payments')).data,

  getPaymentsByStudent: async (studentNumber) =>
    (await api.get('/payments', { params: { studentNumber } })).data,

  submitPaymentProof: async (paymentData) => (await api.post('/payments', paymentData)).data,

  verifyPayment: async (paymentId, status, remarks) =>
    (await api.patch(`/payments/${paymentId}/verify`, { status, remarks })).data
};
