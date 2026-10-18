import api from './api';

export const clearanceService = {
  getClearances: async (params) => (await api.get('/clearances', { params })).data,

  getClearanceByStudent: async (studentNumber) => {
    const { data } = await api.get('/clearances', { params: { studentNumber } });
    return data[0] || null;
  },

  // officeType: 'Department' | 'Cashier' | 'Registrar' (server uses the staff member's own office)
  signClearance: async (clearanceId, officeType, status, remarks) =>
    (await api.patch(`/clearances/${clearanceId}/sign`, { officeType, status, remarks })).data
};
