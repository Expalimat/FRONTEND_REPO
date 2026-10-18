import api from './api';

export const gradeService = {
  getGrades: async (params) => (await api.get('/grades', { params })).data,

  getGradesByStudent: async (studentNumber, pagination) =>
    (await api.get('/grades', { params: { studentNumber, ...pagination } })).data,

  // Department encodes grades
  encodeGrade: async (gradeData) => (await api.post('/grades', gradeData)).data,

  // Registrar validates grades
  validateGrade: async (gradeId) => (await api.patch(`/grades/${gradeId}/validate`)).data
};
