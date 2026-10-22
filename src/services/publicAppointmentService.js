import api from './api';

const payload = (response) => response.data?.data ?? response.data;

export const publicAppointmentService = {
  getServices: async () => payload(await api.get('/public/appointments/services')),
  getAvailability: async (serviceId, date) =>
      payload(await api.get('/public/appointments/availability', { params: { service_id: serviceId, date_from: date, date_to: date } })),
    createAppointment: async (data) => payload(await api.post('/public/appointments/book', data)),
    getGuestQueueServices: async () => payload(await api.get('/public/virtual-queue/services')),
    joinGuestQueue: async (data) => payload(await api.post('/public/virtual-queue/tickets', data)),
    retrieveGuestQueueTicket: async (data) => payload(await api.post('/public/virtual-queue/tickets/retrieve', data)),
    cancelGuestQueueTicket: async (data) => payload(await api.patch('/public/virtual-queue/tickets/cancel', data)),
};
