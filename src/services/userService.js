import api from './api';

export const userService = {
  getUsers: async (params) => (await api.get('/users', { params })).data,
  createUser: async (userData) => (await api.post('/users', userData)).data,
  updateUser: async (userId, updateData) => (await api.put(`/users/${userId}`, updateData)).data,
  toggleUserStatus: async (userId) => (await api.patch(`/users/${userId}/toggle-status`)).data
};
