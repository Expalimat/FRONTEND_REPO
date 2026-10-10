import api from './api';

export const studentService = {
  getStudentByNumber: async (studentNumber) => (await api.get(`/students/${studentNumber}`)).data,
  getAllStudents: async () => (await api.get('/students')).data
};
