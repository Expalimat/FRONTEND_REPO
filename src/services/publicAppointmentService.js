import api from './api';

const payload = (response) => response.data?.data ?? response.data;

export const publicAppointmentService = {
  getServices: async () => payload(await api.get('/public/appointments/services')),
  getAvailability: async (serviceId, date) =>
      payload(await api.get('/public/appointments/availability', { params: { service_id: serviceId, date_from: date, date_to: date } })),
    createAppointment: async (data) => payload(await api.post('/public/appointments/book', data)),
};
