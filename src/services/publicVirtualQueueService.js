import api from './api';

const payload = (response) => response.data?.data ?? response.data;

export const publicVirtualQueueService = {
  getGuestQueueServices: async () => payload(await api.get('/public/virtual-queue/services')),
  joinGuestQueue: async (data) => payload(await api.post('/public/virtual-queue/tickets', data)),
  retrieveGuestQueueTicket: async (data) => payload(await api.post('/public/virtual-queue/tickets/retrieve', data)),
  cancelGuestQueueTicket: async (data) => payload(await api.patch('/public/virtual-queue/tickets/cancel', data)),
};
