import api from './api';

const responseData = (response) =>
  response.data?.success === true ? response.data.data : response.data;

export const appointmentService = {
  getServices: async () => responseData(await api.get('/appointment-services')),
  createService: async (data) => responseData(await api.post('/appointment-services', data)),
  updateService: async (id, data) => responseData(await api.put(`/appointment-services/${id}`, data)),
  getClosures: async (serviceId) => responseData(await api.get(`/appointment-services/${serviceId}/closures`)),
  closeDate: async (serviceId, data) =>
    responseData(await api.post(`/appointment-services/${serviceId}/closures`, data)),
  reopenDate: async (serviceId, closureId) =>
    responseData(await api.delete(`/appointment-services/${serviceId}/closures/${closureId}`)),
  getAvailableSlots: async (params = {}) => responseData(await api.get('/appointment-slots', { params })),
  getServiceSlots: async (serviceId, date) =>
    responseData(await api.get(`/appointment-services/${serviceId}/slots`, { params: { date } })),
  createSlot: async (serviceId, data) =>
    responseData(await api.post(`/appointment-services/${serviceId}/slots`, data)),
  updateSlot: async (slotId, data) => responseData(await api.patch(`/appointment-slots/${slotId}`, data)),
  getAppointments: async (params = {}) => responseData(await api.get('/appointments', { params })),
  book: async (data) => responseData(await api.post('/appointments', data)),
  cancel: async (id, reason) =>
    responseData(await api.patch(`/appointments/${id}/cancel`, reason ? { reason } : {})),
  getQueue: async (serviceId) => responseData(await api.get(`/appointment-queue/${serviceId}`)),
  checkIn: async (id, data = {}) => responseData(await api.patch(`/appointments/${id}/check-in`, data)),
  reschedule: async (id, data) => responseData(await api.patch(`/appointments/${id}/reschedule`, data)),
  callNext: async (serviceId) => responseData(await api.post(`/appointment-queue/${serviceId}/call-next`)),
  overrideCall: async (serviceId, data) =>
    responseData(await api.post(`/appointment-queue/${serviceId}/override-call`, data)),
  start: async (id) => responseData(await api.patch(`/appointments/${id}/start`)),
  recall: async (id) => responseData(await api.patch(`/appointments/${id}/recall`)),
  finish: async (id, status, staffNotes = '') =>
    responseData(await api.patch(`/appointments/${id}/finish`, { status, reason: staffNotes })),
  getAppointment: async (id) => responseData(await api.get(`/appointments/${id}`)),
  getHistory: async (id) => responseData(await api.get(`/appointments/${id}/history`)),
  getPublicQueue: async () => responseData(await api.get('/appointment-queue/display'))
};
