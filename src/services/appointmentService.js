import api from './api';

const responseData = (response) =>
  response.data?.success === true ? response.data.data : response.data;

export const appointmentService = {
  getServices: async () => responseData(await api.get('/appointment-services')),
  createService: async (data) => responseData(await api.post('/appointment-services', data)),
  updateService: async (id, data) => responseData(await api.put(`/appointment-services/${id}`, data)),
  setQueuePause: async (serviceId, queuePaused) =>
    responseData(await api.patch(`/staff/appointment-services/${serviceId}/queue-pause`, { queuePaused })),
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
  getVirtualQueueServices: async () => responseData(await api.get('/student/virtual-queue/services')),
  getMyVirtualQueueTickets: async () => responseData(await api.get('/student/virtual-queue/tickets')),
  joinVirtualQueue: async (serviceId) =>
    responseData(await api.post('/student/virtual-queue/tickets', { serviceId })),
  cancelVirtualQueueTicket: async (queueEntryId) =>
    responseData(await api.patch(`/student/virtual-queue/tickets/${queueEntryId}/cancel`)),
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
  callQueueEntry: async (id) => responseData(await api.post(`/staff/queue/${id}/call`)),
  overrideQueueEntry: async (id, reason) =>
    responseData(await api.post(`/staff/queue/${id}/override`, { reason })),
  startQueueEntry: async (id) => responseData(await api.post(`/staff/queue/${id}/start`)),
  recallQueueEntry: async (id) => responseData(await api.post(`/staff/queue/${id}/recall`)),
  finishQueueEntry: async (id, status, reason = '') =>
    responseData(await api.post(`/staff/queue/${id}/${status === 'NO_SHOW' ? 'no-show' : 'complete'}`, { reason })),
  cancelQueueEntry: async (id, reason = '') =>
    responseData(await api.post(`/staff/queue/${id}/cancel`, { reason })),
  getAppointment: async (id) => responseData(await api.get(`/appointments/${id}`)),
  getHistory: async (id) => responseData(await api.get(`/appointments/${id}/history`)),
  getPublicQueue: async () => responseData(await api.get('/appointment-queue/display'))
};
