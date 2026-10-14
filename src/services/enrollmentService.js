import api from './api';

export const isEnrollmentPaymentEligible = (enrollment) => {
  const status = enrollment?.status?.toLowerCase().replace(/[\s_-]/g, '');
  return status === 'approved' || status === 'preassessed';
};

export const isEnrollmentCompleted = (enrollment, payments = []) => {
  const status = enrollment?.status?.toLowerCase().replace(/[\s_-]/g, '');
  return ['enrolled', 'completed', 'confirmed'].includes(status) ||
    (isEnrollmentPaymentEligible(enrollment) && payments.some(
      (payment) =>
        payment.enrollmentId === enrollment?.id &&
        payment.status?.toLowerCase() === 'verified'
    ));
};

export const isEnrollmentAwaitingRegistrar = (enrollment) =>
  enrollment?.status?.toLowerCase().replace(/[\s_-]/g, '') === 'pending';

export const isEnrollmentActive = (enrollment) => {
  const status = enrollment?.status?.toLowerCase().replace(/[\s_-]/g, '');
  return ['pending', 'approved', 'preassessed'].includes(status);
};

export const enrollmentService = {
  getOfferings: async (term) => (await api.get('/offerings', { params: term ? { term } : {} })).data,

  getTerms: async () => (await api.get('/terms')).data,

  getCurrentTerm: async () => {
    const terms = (await api.get('/terms')).data;
    return terms.find((t) => t.isCurrent) || terms[0];
  },

  getEnrollments: async () => (await api.get('/enrollments')).data,

  getEnrollmentByStudent: async (studentNumber) =>
    (await api.get('/enrollments', { params: { studentNumber } })).data,

  // student, name, program etc. come from the logged-in account on the server
  submitEnrollment: async (enrollmentData) => (await api.post('/enrollments', enrollmentData)).data,

  updateEnrollmentStatus: async (enrollmentId, status, remarks) =>
    (await api.patch(`/enrollments/${enrollmentId}/status`, { status, remarks })).data,

  // Department subject offering management
  addSubjectOffering: async (offeringData) => (await api.post('/offerings', offeringData)).data,

  updateSubjectOffering: async (id, offeringData) => {
    await api.put(`/offerings/${id}`, offeringData);
    return true;
  }
};
