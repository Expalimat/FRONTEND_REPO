import api from './api';

export const userService = {
  getUsers: async () => (await api.get('/users')).data,
  createUser: async (userData) => (await api.post('/users', userData)).data,
  updateUser: async (userId, updateData) => (await api.put(`/users/${userId}`, updateData)).data,
  toggleUserStatus: async (userId) => (await api.patch(`/users/${userId}/toggle-status`)).data
};
