import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { PageHeader } from '../../components/common/PageHeader';
import { StatusBadge } from '../../components/common/StatusBadge';
import { ConfirmationModal } from '../../components/feedback/ConfirmationModal';
import { LoadingState } from '../../components/feedback/LoadingState';
import { PaginationControls } from '../../components/tables/PaginationControls';
import { paymentService } from '../../services/paymentService';
import {
  enrollmentService,
  isEnrollmentCompleted,
  isEnrollmentActive,
  isEnrollmentPaymentEligible
} from '../../services/enrollmentService';
import { pageParams, readPage } from '../../services/api';

export const EnrollmentPage = () => {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [currentStep, setCurrentStep] = useState(1);
  const [terms, setTerms] = useState([]);
  const [selectedTerm, setSelectedTerm] = useState('');
  const [offerings, setOfferings] = useState([]);
  const [offeringsPagination, setOfferingsPagination] = useState({ currentPage: 1, lastPage: 1, perPage: 10, total: 0 });
  const [offeringsLoading, setOfferingsLoading] = useState(false);
  const [selectedSubjects, setSelectedSubjects] = useState([]);
  const [existingEnrollments, setExistingEnrollments] = useState([]);
  const [payments, setPayments] = useState([]);
  const [completedNotice, setCompletedNotice] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submittedEnrollment, setSubmittedEnrollment] = useState(null);
  const [conflictWarning, setConflictWarning] = useState('');
  const [refreshingStatus, setRefreshingStatus] = useState(false);
  const [statusRefreshError, setStatusRefreshError] = useState('');

  const loadOfferingsPage = async (page = 1, term = selectedTerm) => {
    setOfferingsLoading(true);
    try {
      const result = readPage(await enrollmentService.getOfferings(term, pageParams(page)));
      setOfferings(result.data);
      setOfferingsPagination(result);
    } finally {
      setOfferingsLoading(false);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const studentNumber = currentUser?.studentNumber || '2026-00001';
        const [termList, studentEnr, studentPayments] = await Promise.all([
          enrollmentService.getTerms(),
          enrollmentService.getEnrollmentByStudent(studentNumber),
          paymentService.getPaymentsByStudent(studentNumber)
        ]);
        setTerms(termList);
        setExistingEnrollments(studentEnr);
        setPayments(studentPayments);
        const currentTerm = termList.find((term) => term.isCurrent) || termList.find((term) => term.status === 'Open');
        const termName = currentTerm ? `${currentTerm.semester} ${currentTerm.academicYear}` : '2nd Semester 2025-2026';
        setSelectedTerm(termName);
        await loadOfferingsPage(1, termName);
        const activeEnrollment = studentEnr.find(
          (enrollment) =>
            enrollment.term === termName &&
            isEnrollmentActive(enrollment) &&
            !isEnrollmentCompleted(enrollment, studentPayments)
        );
        if (activeEnrollment) {
          setSubmittedEnrollment(activeEnrollment);
          setCurrentStep(5);
        } else {
          const lastCompletedEnrollment = studentEnr.find(
            (enrollment) => enrollment.term === termName && isEnrollmentCompleted(enrollment, studentPayments)
          );
          setCompletedNotice(lastCompletedEnrollment || null);
        }
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

  const enrolledSubjectCodes = new Set(
    existingEnrollments
      .filter((enrollment) => enrollment.term === selectedTerm && isEnrollmentCompleted(enrollment, payments))
      .flatMap((enrollment) => (enrollment.items || []).map((item) => item.subjectCode?.trim().toUpperCase()))
      .filter(Boolean)
  );

  const handleToggleSubject = (subject) => {
    setConflictWarning('');
    if (enrolledSubjectCodes.has(subject.subjectCode?.trim().toUpperCase())) {
      setConflictWarning(`${subject.subjectCode} is already enrolled for ${selectedTerm}.`);
      return;
    }

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
    const existingActiveEnrollment = existingEnrollments.find(
      (enrollment) =>
        enrollment.term === selectedTerm &&
        isEnrollmentActive(enrollment) &&
        !isEnrollmentCompleted(enrollment, payments)
    );
    if (existingActiveEnrollment) {
      setSubmittedEnrollment(existingActiveEnrollment);
      setCurrentStep(5);
      return;
    }

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
      setExistingEnrollments((current) => [newEnrollment, ...current]);
      setShowConfirmModal(false);
      setCurrentStep(5);
    } catch (err) {
      alert(err.message || 'Error submitting enrollment.');
    } finally {
      setSubmitting(false);
    }
  };

  const refreshSubmittedStatus = async () => {
    if (!submittedEnrollment) return;
    setRefreshingStatus(true);
    setStatusRefreshError('');
    try {
      const studentNumber = currentUser?.studentNumber || '2026-00001';
      const [studentEnrollments, studentPayments] = await Promise.all([
        enrollmentService.getEnrollmentByStudent(studentNumber),
        paymentService.getPaymentsByStudent(studentNumber)
      ]);
      const latestEnrollment = studentEnrollments.find((enrollment) => enrollment.id === submittedEnrollment.id);
      if (!latestEnrollment) {
        throw new Error('Could not find this enrollment application. Please try again.');
      }
      setSubmittedEnrollment(latestEnrollment);
      setExistingEnrollments((current) => current.map((enrollment) =>
        enrollment.id === latestEnrollment.id ? latestEnrollment : enrollment
      ));
      setPayments(studentPayments);
      if (isEnrollmentCompleted(latestEnrollment, studentPayments)) {
        setCompletedNotice(latestEnrollment);
        setSubmittedEnrollment(null);
        setSelectedSubjects([]);
        setCurrentStep(1);
      }
    } catch (err) {
      setStatusRefreshError(err.message || 'Could not refresh your enrollment status.');
    } finally {
      setRefreshingStatus(false);
    }
  };

  // If user completed enrollment successfully
  if (currentStep === 5 && submittedEnrollment) {
    const paymentEligible = isEnrollmentPaymentEligible(submittedEnrollment);
    const enrollmentStatus = submittedEnrollment.status || 'Pending';
    const reviewRejected = enrollmentStatus.toLowerCase() === 'rejected';
    const reviewPreAssessed = enrollmentStatus.toLowerCase().replace(/[\s_-]/g, '') === 'preassessed';
    const submittedPayment = payments.find((payment) => payment.enrollmentId === submittedEnrollment.id);
    const subjectStatus = reviewRejected
      ? 'Rejected'
      : !paymentEligible
        ? 'Awaiting Registrar Review'
        : submittedPayment?.status?.toLowerCase() === 'verified'
          ? 'Payment Verified'
          : submittedPayment
            ? 'Awaiting Cashier Verification'
            : 'Payment Required';

    return (
      <div>
        <PageHeader
          title="Enrollment Submitted Successfully"
          subtitle={
            paymentEligible
              ? reviewPreAssessed
                ? 'The Registrar has pre-assessed your enrollment. You may now submit your proof of payment.'
                : 'Your enrollment has been approved. You may now submit your proof of payment.'
                : reviewRejected
                  ? 'The Registrar did not approve this enrollment application. Review the remarks and contact the Registrar for next steps.'
                  : 'Your online enrollment application is awaiting Registrar review.'
          }
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
              <StatusBadge
                status={enrollmentStatus}
                customLabel={
                  paymentEligible
                    ? `Status: ${enrollmentStatus} - Ready for Payment`
                      : reviewRejected
                        ? `Status: ${enrollmentStatus}`
                        : `Status: ${enrollmentStatus} - Registrar Review`
                }
              />
            </div>
            <p className="text-muted mx-auto mb-4" style={{ maxWidth: '540px' }}>
              Thank you, <strong>{currentUser?.name}</strong>! Your subject selection for{' '}
              <strong>{submittedEnrollment.term}</strong> ({submittedEnrollment.totalUnits} units) has been recorded.
            </p>

            <div className="card bg-light border p-4 text-start mx-auto mb-4" style={{ maxWidth: '600px' }}>
              <h6 className="fw-bold text-dark mb-3">
                <i className="bi bi-info-circle-fill text-success me-2"></i>
                {paymentEligible ? 'Next Steps' : reviewRejected ? 'Registrar Review Result' : 'Waiting for Registrar Review'}
              </h6>
              <ol className="small text-muted mb-0 ps-3 d-flex flex-column gap-2">
                {paymentEligible ? (
                  <>
                    <li>Your academic prerequisites and curriculum standing have been reviewed.</li>
                    <li>
                      Submit your proof of payment through the <strong>Payments Module</strong> (Total Assessed: ₱{submittedEnrollment.fees.total.toLocaleString()}).
                    </li>
                    <li>Check your notifications for status updates and verification receipts.</li>
                  </>
                ) : reviewRejected ? (
                  <>
                    <li>The Registrar did not approve this enrollment after reviewing your academic prerequisites and curriculum standing.</li>
                    <li>{submittedEnrollment.remarks || 'Contact the Registrar to discuss the review result and next steps.'}</li>
                    <li>Payment proof submission remains unavailable for this application.</li>
                  </>
                ) : (
                  <>
                    <li>The University Registrar will review your academic prerequisites and curriculum standing before payment.</li>
                    <li>You can submit proof of payment in the Payments Module after your enrollment is approved or pre-assessed.</li>
                    <li>Check your notifications or refresh this page to see when the review is complete.</li>
                  </>
                )}
              </ol>
            </div>

            {statusRefreshError && (
              <div className="alert alert-danger small mx-auto mb-3" style={{ maxWidth: '600px' }} role="alert">
                {statusRefreshError}
              </div>
            )}

            <div className="d-flex justify-content-center gap-2">
              <Link to="/student/dashboard" className="btn btn-outline-secondary">
                <i className="bi bi-arrow-left me-1"></i>Back to Dashboard
              </Link>
              {paymentEligible ? (
                <>
                  <Link to="/student/payments" className="btn btn-pnc-primary">
                    <i className="bi bi-credit-card me-1"></i>Go to Payments
                  </Link>
                  <button
                    type="button"
                    className="btn btn-outline-primary"
                    onClick={refreshSubmittedStatus}
                    disabled={refreshingStatus}
                  >
                    <i className={`bi ${refreshingStatus ? 'bi-arrow-repeat' : 'bi-arrow-clockwise'} me-1`}></i>
                    {refreshingStatus ? 'Checking Status...' : 'Check Payment Status'}
                  </button>
                </>
              ) : (
                  reviewRejected ? (
                    <button
                      type="button"
                      className="btn btn-outline-primary"
                      onClick={() => {
                        setSubmittedEnrollment(null);
                        setCurrentStep(1);
                        setSelectedSubjects([]);
                        setConflictWarning('');
                      }}
                    >
                      <i className="bi bi-arrow-repeat me-1"></i>Start a New Enrollment
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="btn btn-outline-primary"
                      onClick={refreshSubmittedStatus}
                      disabled={refreshingStatus}
                    >
                      <i className={`bi ${refreshingStatus ? 'bi-arrow-repeat' : 'bi-arrow-clockwise'} me-1`}></i>
                      {refreshingStatus ? 'Checking Status...' : 'Check Review Status'}
                    </button>
                  )
                )}
            </div>
            {submittedEnrollment.items?.length > 0 && (
                <div className="table-responsive mx-auto mt-4 text-start" style={{ maxWidth: '760px' }}>
                  <table className="table table-sm table-bordered align-middle mb-0">
                    <thead className="table-light">
                      <tr>
                        <th>Selected Subject</th>
                        <th>Section</th>
                        <th>Application Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {submittedEnrollment.items.map((item, index) => (
                        <tr key={`${item.subjectCode}-${index}`}>
                          <td><strong>{item.subjectCode}</strong> — {item.subjectTitle}</td>
                          <td>{item.section}</td>
                          <td>
                            <span className={`badge ${subjectStatus === 'Rejected' ? 'bg-danger' : subjectStatus === 'Payment Verified' ? 'bg-success' : 'bg-warning text-dark'}`}>
                              {subjectStatus}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
            )}
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

      {completedNotice && (
        <div className="alert alert-success d-flex flex-wrap align-items-center justify-content-between gap-3" role="status">
          <div>
            <strong><i className="bi bi-check-circle-fill me-2"></i>Enrollment completed.</strong>
            {' '}Your verified enrollment is recorded. You may enroll in additional subjects, but completed subjects are unavailable for duplicate enrollment.
          </div>
          <Link to="/student/schedule" className="btn btn-sm btn-outline-success flex-shrink-0">
            <i className="bi bi-calendar3 me-1"></i>View Schedule
          </Link>
        </div>
      )}

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
                    className={`p-4 rounded-3 border ${selectedTerm === `${t.semester} ${t.academicYear}` ? 'border-success bg-success-subtle' : 'bg-white'} ${t.status !== 'Open' ? 'opacity-50' : ''}`}
                    onClick={() => t.status === 'Open' && setSelectedTerm(`${t.semester} ${t.academicYear}`)}
                    style={{ cursor: t.status === 'Open' ? 'pointer' : 'not-allowed' }}
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
              <button
                className="btn btn-pnc-primary"
                onClick={async () => {
                  try {
                    await loadOfferingsPage(1, selectedTerm);
                    setCurrentStep(2);
                  } catch (err) {
                    alert(err.message || 'Could not load subject offerings. Please try again.');
                  }
                }}
                disabled={!terms.some((term) => term.status === 'Open' && selectedTerm === `${term.semester} ${term.academicYear}`)}
              >
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
              {offeringsLoading ? (
                <LoadingState message="Loading subject offerings..." />
              ) : (
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
                      const isAlreadyEnrolled = enrolledSubjectCodes.has(offering.subjectCode?.trim().toUpperCase());
                      const isFull = offering.availableSlots <= 0;
                      const prerequisiteText = (offering.prerequisites || 'None').replace(/\s*\(Unsatisfied\)/i, '');

                      return (
                        <tr key={offering.id} className={isSelected ? 'table-success-subtle' : isAlreadyEnrolled ? 'table-light' : ''}>
                          <td>
                            <input
                              type="checkbox"
                              className="form-check-input"
                              checked={isSelected}
                              onChange={() => handleToggleSubject(offering)}
                              disabled={isAlreadyEnrolled || isFull}
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
                            {isAlreadyEnrolled ? (
                              <span className="badge bg-success-subtle text-success border border-success-subtle">Already Enrolled</span>
                            ) : isFull ? (
                              <StatusBadge status="Full" />
                            ) : (
                              <span className="small text-muted">{offering.availableSlots} / {offering.totalSlots} left</span>
                            )}
                          </td>
                          <td>
                            <span className="small text-muted">{prerequisiteText}</span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
            {!offeringsLoading && (
              <PaginationControls
                {...offeringsPagination}
                onPageChange={(page) => loadOfferingsPage(page).catch((err) => {
                  setConflictWarning(err.message || 'Could not load subject offerings. Please try again.');
                })}
              />
            )}

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
