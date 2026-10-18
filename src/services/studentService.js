import api from './api';

export const studentService = {
  getStudentByNumber: async (studentNumber) => (await api.get(`/students/${studentNumber}`)).data,
  getAllStudents: async (params) => (await api.get('/students', { params })).data
};
