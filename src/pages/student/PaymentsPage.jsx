import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { PageHeader } from '../../components/common/PageHeader';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Modal } from '../../components/feedback/Modal';
import { EmptyState } from '../../components/feedback/EmptyState';
import { LoadingState } from '../../components/feedback/LoadingState';
import { PaginationControls } from '../../components/tables/PaginationControls';
import { paymentService } from '../../services/paymentService';
import {
  enrollmentService,
  isEnrollmentAwaitingRegistrar,
  isEnrollmentCompleted,
  isEnrollmentPaymentEligible
} from '../../services/enrollmentService';
import { pageParams, readPage } from '../../services/api';

export const PaymentsPage = () => {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [payments, setPayments] = useState([]);
  const [paymentPagination, setPaymentPagination] = useState({ currentPage: 1, lastPage: 1, perPage: 10, total: 0 });
  const [verifiedEnrollmentIds, setVerifiedEnrollmentIds] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [showUploadModal, setShowUploadModal] = useState(false);

  // Upload Form State
  const [enrollmentId, setEnrollmentId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Landbank of the Philippines (LBP)');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [amount, setAmount] = useState('6650.00');
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileError, setFileError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [successMessage, setSuccessMessage] = useState('');
  const paymentEligibleEnrollments = enrollments.filter(
    (enrollment) => isEnrollmentPaymentEligible(enrollment) &&
      !isEnrollmentCompleted(enrollment) &&
      !verifiedEnrollmentIds.includes(enrollment.id)
  );
  const waitingRegistrarEnrollments = enrollments.filter(isEnrollmentAwaitingRegistrar);

  const loadData = async () => {
    setLoading(true);
    try {
      const studentNo = currentUser?.studentNumber || '2026-00001';
      const [paymentPage, enrList] = await Promise.all([
        paymentService.getPaymentsByStudent(studentNo, pageParams(1)),
        enrollmentService.getEnrollmentByStudent(studentNo)
      ]);
      const page = readPage(paymentPage);
      setPayments(page.data);
      setPaymentPagination(page);
      setVerifiedEnrollmentIds(paymentPage.verifiedEnrollmentIds || []);
      setEnrollments(enrList);
      const eligibleEnrollment =
        enrList.find((enrollment) => enrollment.id === enrollmentId && isEnrollmentPaymentEligible(enrollment)) ||
        enrList.find(isEnrollmentPaymentEligible);
      if (eligibleEnrollment) {
        setEnrollmentId(eligibleEnrollment.id);
        setAmount(eligibleEnrollment.fees?.total?.toString() || '6650.00');
      } else {
        setEnrollmentId('');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [currentUser]);

  const loadPaymentPage = async (page = 1) => {
    setLoading(true);
    try {
      const studentNo = currentUser?.studentNumber || '2026-00001';
      const paymentPage = await paymentService.getPaymentsByStudent(studentNo, pageParams(page));
      const result = readPage(paymentPage);
      setPayments(result.data);
      setPaymentPagination(result);
      setVerifiedEnrollmentIds(paymentPage.verifiedEnrollmentIds || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    setFileError('');
    const file = e.target.files[0];
    if (!file) return;

    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      setFileError('Invalid file type. Only JPG, PNG, and PDF files are accepted.');
      return;
    }

    // Max 5MB
    if (file.size > 5 * 1024 * 1024) {
      setFileError('File size exceeds the 5MB limit. Please upload a smaller file.');
      return;
    }

    setSelectedFile(file);
  };

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!paymentEligibleEnrollments.some((enrollment) => enrollment.id === enrollmentId)) {
      setFileError('Payment proof can only be submitted after the Registrar approves or pre-assesses your enrollment.');
      return;
    }
    if (!referenceNumber.trim()) {
      setFileError('Please provide the transaction reference number.');
      return;
    }
    if (!/^[A-Za-z0-9\- ]+$/.test(referenceNumber.trim())) {
      setFileError('Reference number can only contain letters, numbers, spaces, and dashes.');
      return;
    }
    if (!selectedFile) {
      setFileError('Please attach your deposit slip or proof of payment.');
      return;
    }

    setUploading(true);
    setUploadProgress(25);

    try {
      setUploadProgress(60);
      await paymentService.submitPaymentProof(
        {
          enrollmentId,
          paymentMethod,
          referenceNumber,
          amount,
          proofFileName: selectedFile.name.replace(/[^\w\-. ()]/g, '_'),
          proofFileSize: `${(selectedFile.size / (1024 * 1024)).toFixed(2)} MB`
        },
        currentUser
      );

      setUploadProgress(100);
      setShowUploadModal(false);
      setSelectedFile(null);
      setReferenceNumber('');
      setSuccessMessage('Payment proof submitted successfully! The Cashier office will verify your transaction.');
      await loadData();
    } catch (err) {
      setFileError(err.message || 'Failed to upload payment proof. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return <LoadingState message="Loading payment transactions..." />;
  }

  return (
    <div>
      <PageHeader
        title="Student Payments & Assessment"
        subtitle="Submit payment slips and track official cashier verification status."
        breadcrumbs={[
          { label: 'Dashboard', to: '/student/dashboard' },
          { label: 'Payments', to: '/student/payments' }
        ]}
        actions={
          paymentEligibleEnrollments.length > 0 && (
            <button className="btn btn-pnc-primary" onClick={() => setShowUploadModal(true)}>
              <i className="bi bi-cloud-arrow-up me-1"></i>Upload Payment Proof
            </button>
          )
        }
      />

      {successMessage && (
        <div className="alert alert-success alert-dismissible fade show small" role="alert">
          <i className="bi bi-check-circle-fill me-2"></i>
          {successMessage}
          <button type="button" className="btn-close" onClick={() => setSuccessMessage('')}></button>
        </div>
      )}

      {paymentEligibleEnrollments.length > 0 && waitingRegistrarEnrollments.length > 0 && (
        <div className="alert alert-info small" role="status">
          <i className="bi bi-hourglass-split me-2"></i>
          {waitingRegistrarEnrollments.length === 1
            ? 'Another enrollment application is still waiting for Registrar review. Payment remains unavailable for that application.'
            : `${waitingRegistrarEnrollments.length} enrollment applications are waiting for Registrar review. Payment remains unavailable for those applications.`}
        </div>
      )}

      {paymentEligibleEnrollments.length === 0 ? (
        <div className="alert alert-info d-flex justify-content-between align-items-center gap-3" role="status">
          <div>
            <i className="bi bi-hourglass-split me-2"></i>
            {waitingRegistrarEnrollments.length > 0
              ? 'Your enrollment is waiting for the Registrar to review your academic prerequisites and curriculum standing. Payment submission will unlock after approval or pre-assessment.'
              : 'Payment submission is locked until the Registrar reviews your academic prerequisites and curriculum standing and approves or pre-assesses your enrollment.'}
          </div>
          <button type="button" className="btn btn-sm btn-outline-primary flex-shrink-0" onClick={loadData}>
            <i className="bi bi-arrow-clockwise me-1"></i>Refresh Status
          </button>
        </div>
      ) : (
        <>
          {/* Bank & Payment Instructions Notice */}
          <div className="pnc-card mb-4 bg-light border-success">
            <div className="pnc-card-body">
              <h6 className="fw-bold text-dark mb-2">
                <i className="bi bi-bank2 text-success me-2"></i>Official University Payment Channels
              </h6>
              <div className="row g-3 small text-muted">
                <div className="col-md-4">
                  <strong>Landbank of the Philippines (LBP)</strong>
                  <div>Account Name: Pamantasan ng Cabuyao</div>
                  <div>Account No: <strong>1422-1002-39</strong></div>
                </div>
                <div className="col-md-4">
                  <strong>GCash Official Merchant</strong>
                  <div>Merchant: Pamantasan ng Cabuyao</div>
                  <div>Account: <strong>0917-888-PNC1</strong></div>
                </div>
                <div className="col-md-4">
                  <strong>On-Campus Cashier</strong>
                  <div>Administration Bldg., Ground Floor</div>
                  <div>Mon - Fri, 8:00 AM - 4:00 PM</div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Payments History List */}
      <div className="pnc-card">
        <div className="pnc-card-header">
          <span>Payment Transactions & Slips</span>
        </div>
        <div className="pnc-card-body p-0">
          {payments.length === 0 ? (
            <EmptyState
              icon="bi-credit-card"
              title="No Payment Records"
              message="You have not submitted any payment slips yet."
              action={
                paymentEligibleEnrollments.length > 0 && (
                  <button className="btn btn-sm btn-pnc-primary" onClick={() => setShowUploadModal(true)}>
                    Upload First Payment Slip
                  </button>
                )
              }
            />
          ) : (
            <div className="table-responsive">
              <table className="table table-hover table-pnc align-middle mb-0">
                <thead>
                  <tr>
                    <th>Payment ID</th>
                    <th>Enrollment Ref</th>
                    <th>Amount</th>
                    <th>Method & Ref No</th>
                    <th>Date Submitted</th>
                    <th>Status</th>
                    <th>Verification Details</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((p) => (
                    <tr key={p.id}>
                      <td className="fw-bold font-monospace text-dark">{p.id}</td>
                      <td><span className="badge bg-light text-dark border">{p.enrollmentId}</span></td>
                      <td className="fw-bold text-success">₱{p.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                      <td>
                        <div className="fw-semibold text-dark small">{p.paymentMethod}</div>
                        <div className="small text-muted font-monospace">{p.referenceNumber}</div>
                      </td>
                      <td className="small text-muted">{p.paymentDate}</td>
                      <td><StatusBadge status={p.status} /></td>
                      <td>
                        {p.status === 'Verified' ? (
                          <div className="small text-success">
                            <div><i className="bi bi-check-circle me-1"></i>{p.verifiedBy}</div>
                            <div className="text-muted" style={{ fontSize: '0.72rem' }}>{p.verifiedDate}</div>
                            {p.remarks && <div className="text-muted fst-italic">{p.remarks}</div>}
                          </div>
                        ) : p.status === 'Rejected' ? (
                          <div className="small text-danger">
                            <div><i className="bi bi-x-circle me-1"></i>Rejected by Cashier</div>
                            <div className="fst-italic">Reason: {p.remarks || 'Receipt illegible'}</div>
                          </div>
                        ) : (
                          <span className="small text-muted">
                            <i className="bi bi-hourglass-split me-1 text-warning"></i>Awaiting Cashier Review
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {payments.length > 0 && (
            <div className="px-3 pb-3">
              <PaginationControls {...paymentPagination} onPageChange={loadPaymentPage} />
            </div>
          )}
        </div>
      </div>

      {/* Upload Payment Modal */}
      {paymentEligibleEnrollments.length > 0 && <Modal
        isOpen={showUploadModal}
        onClose={() => !uploading && setShowUploadModal(false)}
        title="Upload Proof of Payment"
        size="lg"
      >
        <form onSubmit={handleUploadSubmit}>
          {fileError && (
            <div className="alert alert-danger small py-2 px-3 mb-3" role="alert">
              <i className="bi bi-exclamation-triangle-fill me-2"></i>
              {fileError}
            </div>
          )}

          <div className="row g-3 mb-3">
            <div className="col-md-6">
              <label className="form-label small fw-semibold text-dark">Enrollment Reference</label>
              <select
                className="form-select form-select-sm"
                value={enrollmentId}
                onChange={(e) => {
                  const selectedEnrollment = paymentEligibleEnrollments.find(
                    (enrollment) => enrollment.id === e.target.value
                  );
                  setEnrollmentId(e.target.value);
                  setAmount(selectedEnrollment?.fees?.total?.toString() || '6650.00');
                }}
                required
              >
                {paymentEligibleEnrollments.map((enr) => (
                  <option key={enr.id} value={enr.id}>
                    {enr.id} - {enr.term} (₱{enr.fees?.total?.toLocaleString()})
                  </option>
                ))}
              </select>
            </div>

            <div className="col-md-6">
              <label className="form-label small fw-semibold text-dark">Payment Amount (₱)</label>
              <input
                type="number"
                step="0.01"
                className="form-control form-control-sm"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="row g-3 mb-3">
            <div className="col-md-6">
              <label className="form-label small fw-semibold text-dark">Payment Channel / Method</label>
              <select
                className="form-select form-select-sm"
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
              >
                <option>Landbank of the Philippines (LBP)</option>
                <option>GCash e-Wallet</option>
                <option>Bank of the Philippine Islands (BPI)</option>
                <option>On-Campus Over-the-Counter Cashier</option>
              </select>
            </div>

            <div className="col-md-6">
              <label className="form-label small fw-semibold text-dark">
                Transaction / Reference Number <span className="text-danger">*</span>
              </label>
              <input
                type="text"
                className="form-control form-control-sm"
                placeholder="e.g. LBP-9823194 or GCASH-839201"
                value={referenceNumber}
                onChange={(e) => setReferenceNumber(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="mb-3">
            <label className="form-label small fw-semibold text-dark">
              Attach Receipt / Deposit Slip (JPG, PNG, PDF max 5MB) <span className="text-danger">*</span>
            </label>
            <input
              type="file"
              className="form-control form-control-sm"
              accept=".jpg,.jpeg,.png,.pdf"
              onChange={handleFileChange}
              required
              disabled={uploading}
            />
            {selectedFile && (
              <div className="small text-muted mt-1">
                Selected file: <strong>{selectedFile.name}</strong> ({(selectedFile.size / 1024).toFixed(1)} KB)
              </div>
            )}
          </div>

          {uploading && (
            <div className="mb-3">
              <div className="d-flex justify-content-between small text-muted mb-1">
                <span>Uploading and hashing receipt...</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="progress" style={{ height: '8px' }}>
                <div
                  className="progress-bar bg-success progress-bar-striped progress-bar-animated"
                  role="progressbar"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
            </div>
          )}

          <div className="d-flex justify-content-end gap-2 pt-3 border-top">
            <button
              type="button"
              className="btn btn-sm btn-light"
              onClick={() => setShowUploadModal(false)}
              disabled={uploading}
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-sm btn-pnc-primary" disabled={uploading}>
              {uploading ? 'Processing...' : 'Submit Payment Proof'}
            </button>
          </div>
        </form>
      </Modal>}
    </div>
  );
};
