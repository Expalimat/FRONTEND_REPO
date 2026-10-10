import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { PageHeader } from '../../components/common/PageHeader';
import { StatusBadge } from '../../components/common/StatusBadge';
import { ConfirmationModal } from '../../components/feedback/ConfirmationModal';
import { LoadingState } from '../../components/feedback/LoadingState';
import { enrollmentService } from '../../services/enrollmentService';

export const EnrollmentPage = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [currentStep, setCurrentStep] = useState(1);
  const [terms, setTerms] = useState([]);
  const [selectedTerm, setSelectedTerm] = useState('2nd Semester 2025-2026');
  const [offerings, setOfferings] = useState([]);
  const [selectedSubjects, setSelectedSubjects] = useState([]);
  const [existingEnrollments, setExistingEnrollments] = useState([]);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submittedEnrollment, setSubmittedEnrollment] = useState(null);
  const [conflictWarning, setConflictWarning] = useState('');

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [termList, subjectList, studentEnr] = await Promise.all([
          enrollmentService.getTerms(),
          enrollmentService.getOfferings(),
          enrollmentService.getEnrollmentByStudent(currentUser?.studentNumber || '2026-00001')
        ]);
        setTerms(termList);
        setOfferings(subjectList);
        setExistingEnrollments(studentEnr);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [currentUser]);

  if (loading) {
    return <LoadingState message="Loading enrollment modules and subject offerings..." />;
  }

  const handleToggleSubject = (subject) => {
    setConflictWarning('');
    const exists = selectedSubjects.some((s) => s.id === subject.id);
    if (exists) {
      setSelectedSubjects(selectedSubjects.filter((s) => s.id !== subject.id));
      return;
    }

    // Check if another section of the same subject code is already added
    const sameCode = selectedSubjects.find((s) => s.subjectCode === subject.subjectCode);
    if (sameCode) {
      setConflictWarning(`You already selected section ${sameCode.section} for ${subject.subjectCode}.`);
      return;
    }

    // Prerequisite check
    if (subject.isPrerequisiteSatisfied === false) {
      setConflictWarning(`Cannot select ${subject.subjectCode}: Prerequisite not satisfied (${subject.prerequisites}).`);
      return;
    }

    // Slot check
    if (subject.availableSlots <= 0) {
      setConflictWarning(`Cannot select ${subject.subjectCode}: Section ${subject.section} is already full.`);
      return;
    }

    setSelectedSubjects([...selectedSubjects, subject]);
  };

  const totalUnits = selectedSubjects.reduce((sum, item) => sum + item.units, 0);
  const tuitionFee = totalUnits * 200;
  const miscFee = 1250;
  const labFee = selectedSubjects.length > 2 ? 1500 : 800;
  const totalFee = tuitionFee + miscFee + labFee;

  const handleFinalSubmit = async () => {
    setSubmitting(true);
    try {
      const newEnrollment = await enrollmentService.submitEnrollment(
        {
          term: selectedTerm,
          totalUnits,
          items: selectedSubjects.map((s) => ({
            subjectCode: s.subjectCode,
            subjectTitle: s.subjectTitle,
            units: s.units,
            section: s.section,
            schedule: s.schedule,
            room: s.room
          })),
          fees: {
            tuition: tuitionFee,
            miscellaneous: miscFee,
            laboratory: labFee,
            total: totalFee
          }
        },
        currentUser
      );
      setSubmittedEnrollment(newEnrollment);
      setShowConfirmModal(false);
      setCurrentStep(5);
    } catch (err) {
      alert(err.message || 'Error submitting enrollment.');
    } finally {
      setSubmitting(false);
    }
  };

  // If user completed enrollment successfully
  if (currentStep === 5 && submittedEnrollment) {
    return (
      <div>
        <PageHeader
          title="Enrollment Submitted Successfully"
          subtitle="Your online enrollment application is now awaiting Registrar approval."
          breadcrumbs={[
            { label: 'Dashboard', to: '/student/dashboard' },
            { label: 'Enrollment', to: '/student/enrollment' }
          ]}
        />
        <div className="pnc-card border-success">
          <div className="pnc-card-body text-center py-5">
            <div
              className="d-inline-flex align-items-center justify-content-center bg-success text-white rounded-circle mb-3"
              style={{ width: '80px', height: '80px', fontSize: '2.5rem' }}
            >
              <i className="bi bi-check-lg"></i>
            </div>
            <h3 className="fw-bold text-dark mb-2">Enrollment Reference: {submittedEnrollment.id}</h3>
            <div className="mb-3">
              <StatusBadge status="Pending" customLabel="Status: Pending Registrar Approval" />
            </div>
            <p className="text-muted mx-auto mb-4" style={{ maxWidth: '540px' }}>
              Thank you, <strong>{currentUser?.name}</strong>! Your subject selection for{' '}
              <strong>{submittedEnrollment.term}</strong> ({submittedEnrollment.totalUnits} units) has been recorded.
            </p>

            <div className="card bg-light border p-4 text-start mx-auto mb-4" style={{ maxWidth: '600px' }}>
              <h6 className="fw-bold text-dark mb-3">
                <i className="bi bi-info-circle-fill text-success me-2"></i>Next Steps & Payment Instructions
              </h6>
              <ol className="small text-muted mb-0 ps-3 d-flex flex-column gap-2">
                <li>The University Registrar will review your academic prerequisites and curriculum standing.</li>
                <li>
                  Once approved or pre-assessed, proceed to the <strong>Payments Module</strong> to submit proof of payment (Total Assessed: ₱{submittedEnrollment.fees.total.toLocaleString()}).
                </li>
                <li>Check your notifications for status updates and verification receipts.</li>
              </ol>
            </div>

            <div className="d-flex justify-content-center gap-2">
              <Link to="/student/dashboard" className="btn btn-outline-secondary">
                <i className="bi bi-arrow-left me-1"></i>Back to Dashboard
              </Link>
              <Link to="/student/payments" className="btn btn-pnc-primary">
                <i className="bi bi-credit-card me-1"></i>Go to Payments
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Online Enrollment Portal"
        subtitle="Complete the step-by-step registration to enroll in your official subject offerings."
        breadcrumbs={[
          { label: 'Dashboard', to: '/student/dashboard' },
          { label: 'Enrollment', to: '/student/enrollment' }
        ]}
      />

      {/* Step Indicator */}
      <div className="stepper-nav my-3 px-2 px-md-5">
        <div className={`stepper-step ${currentStep === 1 ? 'active' : currentStep > 1 ? 'completed' : ''}`}>
          <div className="stepper-circle">1</div>
          <div className="stepper-label">Term</div>
        </div>
        <div className={`stepper-step ${currentStep === 2 ? 'active' : currentStep > 2 ? 'completed' : ''}`}>
          <div className="stepper-circle">2</div>
          <div className="stepper-label">Subjects</div>
        </div>
        <div className={`stepper-step ${currentStep === 3 ? 'active' : currentStep > 3 ? 'completed' : ''}`}>
          <div className="stepper-circle">3</div>
          <div className="stepper-label">Summary</div>
        </div>
        <div className={`stepper-step ${currentStep === 4 ? 'active' : currentStep > 4 ? 'completed' : ''}`}>
          <div className="stepper-circle">4</div>
          <div className="stepper-label">Fees</div>
        </div>
      </div>

      {/* Step 1: Select Term */}
      {currentStep === 1 && (
        <div className="pnc-card">
          <div className="pnc-card-header">
            <span>Step 1: Select Academic Term</span>
          </div>
          <div className="pnc-card-body">
            <p className="text-muted small mb-4">
              Please select the target academic term for your enrollment.
            </p>
            <div className="row g-3 mb-4">
              {terms.map((t) => (
                <div key={t.id} className="col-md-6">
                  <div
                    className={`p-4 rounded-3 border cursor-pointer ${selectedTerm.includes(t.semester) ? 'border-success bg-success-subtle' : 'bg-white'}`}
                    onClick={() => setSelectedTerm(`${t.semester} ${t.academicYear}`)}
                    style={{ cursor: 'pointer' }}
                  >
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <h6 className="fw-bold text-dark mb-0">
                        {t.semester} &bull; A.Y. {t.academicYear}
                      </h6>
                      <StatusBadge status={t.status} />
                    </div>
                    <p className="small text-muted mb-0">
                      {t.isCurrent ? 'Current active enrollment semester' : 'Past academic term'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <div className="d-flex justify-content-end">
              <button className="btn btn-pnc-primary" onClick={() => setCurrentStep(2)}>
                Proceed to Subject Selection <i className="bi bi-arrow-right ms-1"></i>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Step 2: Select Subjects */}
      {currentStep === 2 && (
        <div className="pnc-card">
          <div className="pnc-card-header">
            <div className="d-flex align-items-center gap-2">
              <span>Step 2: Select Available Subject Offerings</span>
              <span className="badge bg-success">{selectedSubjects.length} selected ({totalUnits} units)</span>
            </div>
          </div>
          <div className="pnc-card-body">
            {conflictWarning && (
              <div className="alert alert-warning alert-dismissible fade show small" role="alert">
                <i className="bi bi-exclamation-triangle-fill me-2"></i>
                {conflictWarning}
                <button type="button" className="btn-close" onClick={() => setConflictWarning('')}></button>
              </div>
            )}

            <div className="table-responsive">
              <table className="table table-hover table-pnc align-middle">
                <thead>
                  <tr>
                    <th style={{ width: '40px' }}>Select</th>
                    <th>Subject Code & Title</th>
                    <th>Units</th>
                    <th>Section</th>
                    <th>Schedule & Room</th>
                    <th>Slots</th>
                    <th>Prerequisite</th>
                  </tr>
                </thead>
                <tbody>
                  {offerings.map((offering) => {
                    const isSelected = selectedSubjects.some((s) => s.id === offering.id);
                    const isFull = offering.availableSlots <= 0;
                    const isPrereqInvalid = offering.isPrerequisiteSatisfied === false;

                    return (
                      <tr key={offering.id} className={isSelected ? 'table-success-subtle' : ''}>
                        <td>
                          <input
                            type="checkbox"
                            className="form-check-input"
                            checked={isSelected}
                            onChange={() => handleToggleSubject(offering)}
                            disabled={isFull || isPrereqInvalid}
                          />
                        </td>
                        <td>
                          <div className="fw-bold text-dark">{offering.subjectCode}</div>
                          <div className="small text-muted">{offering.subjectTitle}</div>
                        </td>
                        <td><span className="fw-semibold">{offering.units}</span></td>
                        <td><span className="badge bg-light text-dark border">{offering.section}</span></td>
                        <td>
                          <div className="small text-dark">{offering.schedule}</div>
                          <div className="small text-muted">{offering.room}</div>
                        </td>
                        <td>
                          {isFull ? (
                            <StatusBadge status="Full" />
                          ) : (
                            <span className="small text-muted">{offering.availableSlots} / {offering.totalSlots} left</span>
                          )}
                        </td>
                        <td>
                          {isPrereqInvalid ? (
                            <span className="badge bg-danger-subtle text-danger border border-danger-subtle" title={offering.prerequisites}>
                              <i className="bi bi-x-circle me-1"></i>Prereq Not Met
                            </span>
                          ) : (
                            <span className="small text-muted">{offering.prerequisites || 'None'}</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="d-flex justify-content-between mt-4">
              <button className="btn btn-outline-secondary" onClick={() => setCurrentStep(1)}>
                <i className="bi bi-arrow-left me-1"></i>Previous
              </button>
              <button
                className="btn btn-pnc-primary"
                onClick={() => {
                  if (selectedSubjects.length === 0) {
                    setConflictWarning('Please select at least one subject before proceeding.');
                    return;
                  }
                  setCurrentStep(3);
                }}
              >
                Review Summary <i className="bi bi-arrow-right ms-1"></i>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Step 3: Enrollment Summary */}
      {currentStep === 3 && (
        <div className="pnc-card">
          <div className="pnc-card-header">
            <span>Step 3: Review Enrollment Summary</span>
          </div>
          <div className="pnc-card-body">
            <div className="alert alert-info small mb-4">
              <i className="bi bi-info-circle me-2"></i>
              Please verify your selected subjects and schedules before moving to fee assessment.
            </div>

            <div className="table-responsive mb-4">
              <table className="table table-bordered table-pnc align-middle">
                <thead>
                  <tr>
                    <th>Subject Code</th>
                    <th>Subject Title</th>
                    <th>Section</th>
                    <th>Schedule</th>
                    <th>Room</th>
                    <th>Units</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedSubjects.map((s) => (
                    <tr key={s.id}>
                      <td className="fw-bold">{s.subjectCode}</td>
                      <td>{s.subjectTitle}</td>
                      <td><span className="badge bg-light text-dark border">{s.section}</span></td>
                      <td>{s.schedule}</td>
                      <td>{s.room}</td>
                      <td className="fw-bold text-center">{s.units}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="table-light">
                    <td colSpan="5" className="text-end fw-bold">Total Academic Units:</td>
                    <td className="text-center fw-bold text-success fs-6">{totalUnits}</td>
                  </tr>
                </tfoot>
              </table>
            </div>

            <div className="d-flex justify-content-between">
              <button className="btn btn-outline-secondary" onClick={() => setCurrentStep(2)}>
                <i className="bi bi-arrow-left me-1"></i>Change Subjects
              </button>
              <button className="btn btn-pnc-primary" onClick={() => setCurrentStep(4)}>
                Proceed to Fee Assessment <i className="bi bi-arrow-right ms-1"></i>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Step 4: Fee Summary */}
      {currentStep === 4 && (
        <div className="pnc-card">
          <div className="pnc-card-header">
            <span>Step 4: Fee Assessment & Breakdown</span>
          </div>
          <div className="pnc-card-body">
            <div className="row justify-content-center">
              <div className="col-lg-8">
                <div className="card border p-4 bg-light mb-4">
                  <h6 className="fw-bold text-dark border-bottom pb-2 mb-3">Estimated Tuition & School Fees</h6>
                  <div className="d-flex justify-content-between py-2 border-bottom">
                    <span className="text-muted">Tuition Fee ({totalUnits} units @ ₱200/unit)</span>
                    <span className="fw-semibold">₱{tuitionFee.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="d-flex justify-content-between py-2 border-bottom">
                    <span className="text-muted">Miscellaneous & Registration Fees</span>
                    <span className="fw-semibold">₱{miscFee.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="d-flex justify-content-between py-2 border-bottom">
                    <span className="text-muted">Laboratory & Technology Fee</span>
                    <span className="fw-semibold">₱{labFee.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="d-flex justify-content-between pt-3 fs-5 fw-bold text-success">
                    <span>Total Estimated Assessment</span>
                    <span>₱{totalFee.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="small text-muted mt-2" style={{ fontSize: '0.75rem' }}>
                    * Note: Sample assessed rate for demonstration purposes.
                  </div>
                </div>

                <div className="d-flex justify-content-between">
                  <button className="btn btn-outline-secondary" onClick={() => setCurrentStep(3)}>
                    <i className="bi bi-arrow-left me-1"></i>Previous Step
                  </button>
                  <button className="btn btn-success px-4 fw-semibold" onClick={() => setShowConfirmModal(true)}>
                    <i className="bi bi-send-check me-1"></i>Submit Enrollment Application
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Submit Confirmation Modal */}
      <ConfirmationModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={handleFinalSubmit}
        title="Confirm Enrollment Submission"
        message={`Are you sure you want to submit this enrollment for ${totalUnits} units in ${selectedTerm}? Once submitted, it will be forwarded to the Registrar for review.`}
        confirmText="Yes, Submit Enrollment"
        variant="primary"
        loading={submitting}
      />
    </div>
  );
};
