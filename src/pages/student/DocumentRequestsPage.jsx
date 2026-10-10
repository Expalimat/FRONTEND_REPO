import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { PageHeader } from '../../components/common/PageHeader';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Modal } from '../../components/feedback/Modal';
import { EmptyState } from '../../components/feedback/EmptyState';
import { LoadingState } from '../../components/feedback/LoadingState';
import { documentService } from '../../services/documentService';

export const DocumentRequestsPage = () => {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState([]);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [showTrackModal, setShowTrackModal] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState(null);

  // Form state
  const [documentType, setDocumentType] = useState('Certificate of Grades (COG)');
  const [purpose, setPurpose] = useState('Scholarship / Educational Assistance Application');
  const [details, setDetails] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const loadRequests = async () => {
    setLoading(true);
    try {
      const list = await documentService.getRequestsByStudent(currentUser?.studentNumber || '2026-00001');
      setRequests(list);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, [currentUser]);

  const handleSubmitRequest = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const created = await documentService.submitRequest(
        {
          documentType,
          purpose,
          details
        },
        currentUser
      );
      setSubmitting(false);
      setShowRequestModal(false);
      setDetails('');
      setSuccessMessage(`Your document request has been filed! Tracking Number: ${created.trackingNumber}`);
      loadRequests();
    } catch (err) {
      setSubmitting(false);
      alert('Failed to submit request.');
    }
  };

  const handleOpenTrack = (doc) => {
    setSelectedDoc(doc);
    setShowTrackModal(true);
  };

  if (loading) {
    return <LoadingState message="Loading document requests..." />;
  }

  return (
    <div>
      <PageHeader
        title="Online Document Requests"
        subtitle="Request official academic records and track document release status in real time."
        breadcrumbs={[
          { label: 'Dashboard', to: '/student/dashboard' },
          { label: 'Document Requests', to: '/student/documents' }
        ]}
        actions={
          <button className="btn btn-pnc-primary" onClick={() => setShowRequestModal(true)}>
            <i className="bi bi-plus-circle me-1"></i>Request New Document
          </button>
        }
      />

      {successMessage && (
        <div className="alert alert-success alert-dismissible fade show small" role="alert">
          <i className="bi bi-check-circle-fill me-2"></i>
          {successMessage}
          <button type="button" className="btn-close" onClick={() => setSuccessMessage('')}></button>
        </div>
      )}

      {/* Supported Documents Info Banner */}
      <div className="row g-3 mb-4">
        <div className="col-md-4">
          <div className="pnc-card h-100 p-3 mb-0 border-start border-4 border-primary">
            <div className="fw-bold text-dark mb-1">Transcript of Records (TOR)</div>
            <div className="small text-muted">Official record of complete academic coursework and earned units.</div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="pnc-card h-100 p-3 mb-0 border-start border-4 border-success">
            <div className="fw-bold text-dark mb-1">Certificate of Grades (COG)</div>
            <div className="small text-muted">Certified semester grade report for scholarships and employment.</div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="pnc-card h-100 p-3 mb-0 border-start border-4 border-warning">
            <div className="fw-bold text-dark mb-1">Good Moral Certificate</div>
            <div className="small text-muted">Issued by the University for transfer, internship, or board exam purposes.</div>
          </div>
        </div>
      </div>

      {/* Requests History Table */}
      <div className="pnc-card">
        <div className="pnc-card-header">
          <span>My Document Requests History</span>
        </div>
        <div className="pnc-card-body p-0">
          {requests.length === 0 ? (
            <EmptyState
              icon="bi-file-earmark-text"
              title="No Document Requests"
              message="You have not requested any official documents yet."
              action={
                <button className="btn btn-sm btn-pnc-primary" onClick={() => setShowRequestModal(true)}>
                  Request a Document
                </button>
              }
            />
          ) : (
            <div className="table-responsive">
              <table className="table table-hover table-pnc align-middle mb-0">
                <thead>
                  <tr>
                    <th>Tracking No.</th>
                    <th>Document Type</th>
                    <th>Purpose</th>
                    <th>Request Date</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {requests.map((doc) => (
                    <tr key={doc.id}>
                      <td>
                        <span className="badge bg-secondary font-monospace">{doc.trackingNumber}</span>
                      </td>
                      <td className="fw-bold text-dark">{doc.documentType}</td>
                      <td className="small text-muted">{doc.purpose}</td>
                      <td className="small text-muted">{doc.requestDate}</td>
                      <td><StatusBadge status={doc.status} /></td>
                      <td>
                        <div className="d-flex align-items-center gap-1">
                          <button
                            className="btn btn-sm btn-outline-primary"
                            onClick={() => handleOpenTrack(doc)}
                            title="Track Progress"
                          >
                            <i className="bi bi-eye me-1"></i>Track
                          </button>
                          {doc.status === 'Released' && (
                            <a
                              href="#"
                              onClick={(e) => {
                                e.preventDefault();
                                alert(`Downloading digital copy for ${doc.documentType} (${doc.trackingNumber})...`);
                              }}
                              className="btn btn-sm btn-success"
                              title="Download Digital Copy"
                            >
                              <i className="bi bi-download me-1"></i>Download
                            </a>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Request New Document Modal */}
      <Modal
        isOpen={showRequestModal}
        onClose={() => !submitting && setShowRequestModal(false)}
        title="Request Official Document"
        size="lg"
      >
        <form onSubmit={handleSubmitRequest}>
          <div className="mb-3">
            <label className="form-label small fw-semibold text-dark">
              Document Type <span className="text-danger">*</span>
            </label>
            <select
              className="form-select form-select-sm"
              value={documentType}
              onChange={(e) => setDocumentType(e.target.value)}
              required
            >
              <option>Transcript of Records (TOR)</option>
              <option>Certificate of Grades (COG)</option>
              <option>Good Moral Certificate</option>
            </select>
          </div>

          <div className="mb-3">
            <label className="form-label small fw-semibold text-dark">
              Purpose of Request <span className="text-danger">*</span>
            </label>
            <select
              className="form-select form-select-sm"
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              required
            >
              <option>Scholarship / Educational Assistance Application</option>
              <option>Employment / Job Application</option>
              <option>Internship / On-the-Job Training (OJT)</option>
              <option>Board Exam / PRC Licensure</option>
              <option>Transfer to Another Institution</option>
              <option>Personal Reference</option>
            </select>
          </div>

          <div className="mb-3">
            <label className="form-label small fw-semibold text-dark">
              Additional Details / Notes (Optional)
            </label>
            <textarea
              className="form-control form-control-sm"
              rows="3"
              placeholder="Specify any special instructions or requirements (e.g. addressed to specific organization)..."
              value={details}
              onChange={(e) => setDetails(e.target.value)}
            />
          </div>

          <div className="alert alert-warning small mb-3">
            <i className="bi bi-info-circle-fill me-1"></i>
            Standard processing time is 3-5 working days upon verification of student clearance and records.
          </div>

          <div className="d-flex justify-content-end gap-2 pt-3 border-top">
            <button
              type="button"
              className="btn btn-sm btn-light"
              onClick={() => setShowRequestModal(false)}
              disabled={submitting}
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-sm btn-pnc-primary" disabled={submitting}>
              {submitting ? 'Submitting...' : 'Submit Document Request'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Document Tracking Progress Modal */}
      {selectedDoc && (
        <Modal
          isOpen={showTrackModal}
          onClose={() => setShowTrackModal(false)}
          title={`Tracking: ${selectedDoc.trackingNumber}`}
          size="md"
        >
          <div className="p-2">
            <div className="d-flex justify-content-between align-items-center mb-3 pb-2 border-bottom">
              <div>
                <h6 className="fw-bold text-dark mb-0">{selectedDoc.documentType}</h6>
                <div className="small text-muted">Purpose: {selectedDoc.purpose}</div>
              </div>
              <StatusBadge status={selectedDoc.status} />
            </div>

            {/* Visual Timeline */}
            <div className="d-flex flex-column gap-3 mb-4">
              <div className="d-flex align-items-start gap-3">
                <div className="rounded-circle bg-success text-white p-2 d-flex align-items-center justify-content-center" style={{ width: '32px', height: '32px' }}>
                  <i className="bi bi-check2"></i>
                </div>
                <div>
                  <div className="fw-semibold small text-dark">Request Submitted</div>
                  <div className="small text-muted">{selectedDoc.requestDate}</div>
                </div>
              </div>

              <div className="d-flex align-items-start gap-3">
                <div
                  className={`rounded-circle p-2 d-flex align-items-center justify-content-center ${
                    selectedDoc.status === 'Processing' || selectedDoc.status === 'Released'
                      ? 'bg-success text-white'
                      : 'bg-light text-muted border'
                  }`}
                  style={{ width: '32px', height: '32px' }}
                >
                  <i className="bi bi-gear-fill"></i>
                </div>
                <div>
                  <div className="fw-semibold small text-dark">Registrar Processing & Verification</div>
                  <div className="small text-muted">
                    {selectedDoc.status === 'Processing' || selectedDoc.status === 'Released'
                      ? `Processed by ${selectedDoc.processedBy || 'Office of the Registrar'}`
                      : 'Awaiting review'}
                  </div>
                </div>
              </div>

              <div className="d-flex align-items-start gap-3">
                <div
                  className={`rounded-circle p-2 d-flex align-items-center justify-content-center ${
                    selectedDoc.status === 'Released'
                      ? 'bg-success text-white'
                      : selectedDoc.status === 'Rejected'
                      ? 'bg-danger text-white'
                      : 'bg-light text-muted border'
                  }`}
                  style={{ width: '32px', height: '32px' }}
                >
                  <i className={`bi ${selectedDoc.status === 'Released' ? 'bi-file-earmark-check-fill' : 'bi-hourglass'}`}></i>
                </div>
                <div>
                  <div className="fw-semibold small text-dark">
                    {selectedDoc.status === 'Released' ? 'Document Released' : selectedDoc.status === 'Rejected' ? 'Request Rejected' : 'Release'}
                  </div>
                  <div className="small text-muted">
                    {selectedDoc.status === 'Released'
                      ? `Released on ${selectedDoc.releaseDate}. Available for digital download or pickup at Registrar window.`
                      : selectedDoc.status === 'Rejected'
                      ? `Remarks: ${selectedDoc.remarks}`
                      : 'Expected upon completion'}
                  </div>
                </div>
              </div>
            </div>

            {selectedDoc.status === 'Released' && (
              <div className="bg-light p-3 rounded border text-center">
                <div className="fw-semibold small text-success mb-2">
                  <i className="bi bi-check-circle me-1"></i>Ready for Collection / Download
                </div>
                <button
                  className="btn btn-sm btn-success"
                  onClick={() => alert(`Downloading official document ${selectedDoc.trackingNumber}...`)}
                >
                  <i className="bi bi-download me-1"></i>Download Certified Copy (PDF)
                </button>
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
};
