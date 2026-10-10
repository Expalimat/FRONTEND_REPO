import api from './api';

export const gradeService = {
  getGrades: async () => (await api.get('/grades')).data,

  getGradesByStudent: async (studentNumber) =>
    (await api.get('/grades', { params: { studentNumber } })).data,

  // Department encodes grades
  encodeGrade: async (gradeData) => (await api.post('/grades', gradeData)).data,

  // Registrar validates grades
  validateGrade: async (gradeId) => (await api.patch(`/grades/${gradeId}/validate`)).data
};
