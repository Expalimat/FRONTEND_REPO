import api from './api';

const responseData = (response) =>
  response.data?.success === true ? response.data.data : response.data;

export const virtualQueueService = {
  getServices: async () => responseData(await api.get('/services')),
  createService: async (data) => responseData(await api.post('/services', data)),
  updateService: async (id, data) => responseData(await api.put(`/services/${id}`, data)),
  deleteService: async (id) => responseData(await api.delete(`/services/${id}`)),
  setQueuePause: async (serviceId, queuePaused) =>
    responseData(await api.patch(`/staff/services/${serviceId}/queue-pause`, { queuePaused })),
  getStaffAssignments: async (serviceId) =>
    responseData(await api.get(`/staff/services/${serviceId}/staff`)),
  updateStaffAssignments: async (serviceId, userIds) =>
    responseData(await api.put(`/staff/services/${serviceId}/staff`, { userIds })),
  getVirtualQueueServices: async () => responseData(await api.get('/student/virtual-queue/services')),
  getMyVirtualQueueTickets: async () => responseData(await api.get('/student/virtual-queue/tickets')),
  joinVirtualQueue: async (serviceId) =>
    responseData(await api.post('/student/virtual-queue/tickets', { serviceId })),
  cancelVirtualQueueTicket: async (queueEntryId) =>
    responseData(await api.patch(`/student/virtual-queue/tickets/${queueEntryId}/cancel`)),
  getStaffQueue: async (params = {}) => responseData(await api.get('/staff/queue', { params })),
  getQueue: async (serviceId) => responseData(await api.get(`/queue/${serviceId}`)),
  getPublicQueue: async () => responseData(await api.get('/queue/display')),
  callQueueEntry: async (id) => responseData(await api.post(`/staff/queue/${id}/call`)),
  overrideQueueEntry: async (id, reason) =>
    responseData(await api.post(`/staff/queue/${id}/override`, { reason })),
  startQueueEntry: async (id) => responseData(await api.post(`/staff/queue/${id}/start`)),
  recallQueueEntry: async (id) => responseData(await api.post(`/staff/queue/${id}/recall`)),
  finishQueueEntry: async (id, status, reason = '') =>
    responseData(await api.post(`/staff/queue/${id}/${status === 'NO_SHOW' ? 'no-show' : 'complete'}`, { reason })),
  cancelQueueEntry: async (id, reason = '') =>
    responseData(await api.post(`/staff/queue/${id}/cancel`, { reason })),
};
