import api from './api';

export const systemSettingsService = {
  getSettings: async () => (await api.get('/settings')).data,
  updateSettings: async (newSettings) => (await api.put('/settings', newSettings)).data
};
