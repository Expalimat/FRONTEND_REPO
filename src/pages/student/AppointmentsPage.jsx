import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { EmptyState } from '../../components/feedback/EmptyState';
import { LoadingState } from '../../components/feedback/LoadingState';
import { PageHeader } from '../../components/common/PageHeader';
import { appointmentService } from '../../services/appointmentService';
import { documentService } from '../../services/documentService';

const formatAppointmentDate = (date, startTime, endTime) =>
  `${new Date(`${date}T${startTime}:00+08:00`).toLocaleDateString('en-PH', {
    timeZone: 'Asia/Manila',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })}, ${startTime}–${endTime}`;

const statusClass = {
  PENDING: 'text-bg-warning',
  CONFIRMED: 'text-bg-success',
  CHECKED_IN: 'text-bg-info',
  WAITING: 'text-bg-info',
  SERVING: 'text-bg-primary',
  COMPLETED: 'text-bg-secondary',
  CANCELLED: 'text-bg-secondary',
  NO_SHOW: 'text-bg-danger',
  RESCHEDULED: 'text-bg-secondary'
};

const activeStatuses = ['CONFIRMED', 'CHECKED_IN', 'WAITING', 'SERVING'];

export const AppointmentsPage = () => {
  const { currentUser } = useAuth();
  const [services, setServices] = useState([]);
  const [slots, setSlots] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [queueServices, setQueueServices] = useState([]);
  const [queueTickets, setQueueTickets] = useState([]);
  const [queueUpdatedAt, setQueueUpdatedAt] = useState(null);
  const [queueConnectionError, setQueueConnectionError] = useState('');
  const [documents, setDocuments] = useState([]);
  const [serviceId, setServiceId] = useState('');
  const [slotId, setSlotId] = useState('');
  const [documentRequestId, setDocumentRequestId] = useState('');
  const [purpose, setPurpose] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [joiningServiceId, setJoiningServiceId] = useState('');
  const [cancellingTicketId, setCancellingTicketId] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const loadAppointments = useCallback(async () => {
    try {
      setAppointments(await appointmentService.getAppointments());
    } catch (err) {
      setError(err.message || 'Unable to load your appointments.');
    }
  }, []);

  const loadVirtualQueue = useCallback(async () => {
    try {
      const [serviceList, tickets] = await Promise.all([
        appointmentService.getVirtualQueueServices(),
        appointmentService.getMyVirtualQueueTickets()
      ]);
      setQueueServices(serviceList);
      setQueueTickets(tickets);
      setQueueUpdatedAt(new Date());
      setQueueConnectionError('');
    } catch (err) {
      setQueueConnectionError(err.message || 'Unable to refresh your virtual queue ticket. Retrying automatically.');
    }
  }, []);

  useEffect(() => {
    if (loading) return undefined;
    let active = true;
    let timeoutId;
    const refresh = async () => {
      await Promise.all([loadAppointments(), loadVirtualQueue()]);
      if (active) timeoutId = window.setTimeout(refresh, 10000);
    };
    timeoutId = window.setTimeout(refresh, 10000);
    return () => {
      active = false;
      window.clearTimeout(timeoutId);
    };
  }, [loadAppointments, loadVirtualQueue, loading]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const [serviceList, appointmentList, documentList, virtualQueueServices, virtualQueueTickets] = await Promise.all([
          appointmentService.getServices(),
          appointmentService.getAppointments(),
          documentService.getRequestsByStudent(currentUser?.studentNumber, {}),
          appointmentService.getVirtualQueueServices(),
          appointmentService.getMyVirtualQueueTickets()
        ]);
        setServices(serviceList);
        setAppointments(appointmentList);
        setQueueServices(virtualQueueServices);
        setQueueTickets(virtualQueueTickets);
        setDocuments(documentList.filter((doc) => doc.status !== 'Rejected'));
        setServiceId((current) => current || serviceList[0]?.id || '');
      } catch (err) {
        setError(err.message || 'Unable to load appointment information.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [currentUser]);

  useEffect(() => {
    if (!serviceId) {
      setSlots([]);
      return;
    }
    let active = true;
    setSlotId('');
    appointmentService.getAvailableSlots({ serviceId })
      .then((availableSlots) => {
        if (active) setSlots(availableSlots);
      })
      .catch((err) => {
        if (active) setError(err.message || 'Unable to load available appointment times.');
      });
    return () => { active = false; };
  }, [serviceId]);

  const selectedService = services.find((service) => service.id === serviceId);
  const selectedSlot = slots.find((slot) => slot.id === slotId);
  const activeQueueTicket = queueTickets[0];
  const upcomingAppointments = useMemo(
    () => appointments.filter((appointment) => activeStatuses.includes(appointment.status)),
    [appointments]
  );
  const historyAppointments = useMemo(
    () => appointments.filter((appointment) => !activeStatuses.includes(appointment.status)),
    [appointments]
  );

  const handleBook = async (event) => {
    event.preventDefault();
    if (!slotId) {
      setError('Select an available appointment time.');
      return;
    }
    setSubmitting(true);
    setError('');
    setNotice('');
    try {
      const created = await appointmentService.book({
        slotId,
        purpose: purpose.trim() || undefined,
        documentRequestId: documentRequestId || undefined
      });
      setNotice(`Appointment ${created.appointmentNumber} is confirmed.`);
      setPurpose('');
      setDocumentRequestId('');
      setSlotId('');
      await Promise.all([loadAppointments(), appointmentService.getAvailableSlots({ serviceId }).then(setSlots)]);
    } catch (err) {
      setError(err.message || 'Unable to book this appointment.');
      await Promise.all([
        loadAppointments(),
        appointmentService.getAvailableSlots({ serviceId }).then(setSlots).catch(() => {})
      ]);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = async (appointment) => {
    if (!window.confirm(`Cancel appointment ${appointment.appointmentNumber}?`)) return;
    setError('');
    try {
      await appointmentService.cancel(appointment.id);
      setNotice(`Appointment ${appointment.appointmentNumber} was cancelled.`);
      await loadAppointments();
    } catch (err) {
      setError(err.message || 'Unable to cancel this appointment.');
      await loadAppointments();
    }
  };

  const handleJoinQueue = async (virtualQueueService) => {
    setJoiningServiceId(virtualQueueService.id);
    setError('');
    setNotice('');
    try {
      const ticket = await appointmentService.joinVirtualQueue(virtualQueueService.id);
      setQueueTickets([ticket]);
      setNotice(`You joined the ${virtualQueueService.name} queue. Your ticket is ${ticket.queueTicket}.`);
      await loadVirtualQueue();
    } catch (err) {
      setError(err.message || 'Unable to join this virtual queue.');
      await loadVirtualQueue();
    } finally {
      setJoiningServiceId('');
    }
  };

  const handleCancelQueueTicket = async (ticket) => {
    if (!window.confirm(`Cancel virtual queue ticket ${ticket.queueTicket}?`)) return;
    setCancellingTicketId(ticket.queueEntryId);
    setError('');
    try {
      await appointmentService.cancelVirtualQueueTicket(ticket.queueEntryId);
      setNotice(`Virtual queue ticket ${ticket.queueTicket} was cancelled.`);
      await loadVirtualQueue();
    } catch (err) {
      setError(err.message || 'Unable to cancel your virtual queue ticket.');
      await loadVirtualQueue();
    } finally {
      setCancellingTicketId('');
    }
  };

  const handleReschedule = async (appointment) => {
    if (!selectedSlot || selectedSlot.id === appointment.slotId) return;
    if (!window.confirm(`Reschedule ${appointment.appointmentNumber} to ${formatAppointmentDate(selectedSlot.appointmentDate, selectedSlot.startTime, selectedSlot.endTime)}?`)) return;
    setSubmitting(true);
    setError('');
    try {
      const result = await appointmentService.reschedule(appointment.id, { slotId: selectedSlot.id });
      setNotice(`Appointment rescheduled. New reference: ${result.appointment.appointmentNumber}.`);
      setSlotId('');
      await Promise.all([loadAppointments(), appointmentService.getAvailableSlots({ serviceId }).then(setSlots)]);
    } catch (err) {
      setError(err.message || 'Unable to reschedule this appointment.');
      await Promise.all([
        loadAppointments(),
        appointmentService.getAvailableSlots({ serviceId }).then(setSlots).catch(() => {})
      ]);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingState message="Loading appointments..." />;

  return (
    <div>
      <PageHeader
        title="Appointments"
        subtitle="Choose an available time for CTC document claiming or another Registrar service."
        breadcrumbs={[
          { label: 'Dashboard', to: '/student/dashboard' },
          { label: 'Appointments', to: '/student/appointments' }
        ]}
      />

      {error && <div className="alert alert-danger" role="alert">{error}</div>}
      {queueConnectionError && <div className="alert alert-warning" role="status">{queueConnectionError}</div>}
      {notice && (
        <div className="alert alert-success alert-dismissible" role="status">
          {notice}
          <button type="button" className="btn-close" onClick={() => setNotice('')} aria-label="Close"></button>
        </div>
      )}

      <section className="pnc-card mb-4">
        <div className="pnc-card-header">
          <span><i className="bi bi-people me-2 text-success"></i>Join a virtual queue</span>
        </div>
        <div className="pnc-card-body">
          {queueTickets.length > 0 && (
            <div className="alert alert-info" role="status">
              <div className="fw-semibold">Your active ticket: {activeQueueTicket.queueTicket}</div>
              <div>{activeQueueTicket.serviceName} · {activeQueueTicket.queueStatus?.replaceAll('_', ' ')}</div>
              {activeQueueTicket.queueStatus === 'CALLED' && (
                <div className="alert alert-warning mt-2 mb-0" role="alert">
                  Your ticket has been called. Please proceed to the service counter.
                </div>
              )}
              {activeQueueTicket.queueStatus === 'WAITING' && (
                <div className="small mt-1">
                  Position {activeQueueTicket.queuePosition ?? '—'} · {activeQueueTicket.eligiblePeopleAhead ?? 0} people ahead · estimated wait {activeQueueTicket.estimatedWaitMinutes ?? 0} min (estimate only)
                </div>
              )}
              {queueServices.find((service) => service.id === activeQueueTicket.serviceId)?.instructions && (
                <div className="small mt-1">{queueServices.find((service) => service.id === activeQueueTicket.serviceId).instructions}</div>
              )}
              {activeQueueTicket.queuePaused && (
                <div className="small text-warning-emphasis mt-1">New ticket intake is paused; your current ticket remains active.</div>
              )}
              {activeQueueTicket.queueStatus === 'WAITING' && (
                <button
                  type="button"
                  className="btn btn-sm btn-outline-danger mt-2"
                  onClick={() => handleCancelQueueTicket(activeQueueTicket)}
                  disabled={cancellingTicketId === activeQueueTicket.queueEntryId}
                >
                  {cancellingTicketId === activeQueueTicket.queueEntryId ? 'Cancelling…' : 'Cancel ticket'}
                </button>
              )}
              {queueUpdatedAt && (
                <div className="small text-muted mt-2">
                  Last updated {new Intl.DateTimeFormat('en-PH', {
                    timeZone: 'Asia/Manila',
                    hour: 'numeric',
                    minute: '2-digit',
                    second: '2-digit'
                  }).format(queueUpdatedAt)} (Manila time)
                </div>
              )}
            </div>
          )}
          {queueServices.length === 0 ? (
            <p className="text-muted mb-0">Direct virtual queue tickets are not enabled for a service right now.</p>
          ) : (
            <div className="row g-3">
              {queueServices.map((queueService) => (
                <div className="col-md-6" key={queueService.id}>
                  <div className="border rounded p-3 h-100">
                    <div className="d-flex justify-content-between gap-2">
                      <div className="fw-semibold">{queueService.name}</div>
                      <span className={`badge ${queueService.acceptingTickets ? 'text-bg-success' : 'text-bg-secondary'}`}>
                        {queueService.queuePaused ? 'Paused' : queueService.acceptingTickets ? 'Open' : 'Full'}
                      </span>
                    </div>
                    <div className="small text-muted mt-1">
                      {queueService.issuedCount}/{queueService.queueCapacity} tickets issued today · {queueService.remainingCount} remaining
                    </div>
                    {queueService.instructions && <p className="small mt-2 mb-2">{queueService.instructions}</p>}
                    <button
                      type="button"
                      className="btn btn-sm btn-pnc-primary mt-2"
                      onClick={() => handleJoinQueue(queueService)}
                      disabled={!queueService.acceptingTickets || Boolean(activeQueueTicket) || Boolean(joiningServiceId)}
                    >
                      {joiningServiceId === queueService.id ? 'Joining…' : 'Join queue'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
          <p className="form-text mb-0 mt-3">
            A virtual queue ticket does not reserve an appointment time. Keep this page open or return to see live status and wait estimates.
          </p>
        </div>
      </section>

      <section className="pnc-card mb-4">
        <div className="pnc-card-header">
          <span><i className="bi bi-calendar2-plus me-2 text-success"></i>Book an appointment</span>
        </div>
        <div className="pnc-card-body">
          {services.length === 0 ? (
            <p className="text-muted mb-0">Online appointments are not currently available.</p>
          ) : (
            <form onSubmit={handleBook}>
              <div className="row g-3">
                <div className="col-md-6">
                  <label className="form-label fw-semibold" htmlFor="appointmentService">Service</label>
                  <select
                    id="appointmentService"
                    className="form-select"
                    value={serviceId}
                    onChange={(event) => setServiceId(event.target.value)}
                    disabled={submitting}
                  >
                    {services.map((service) => (
                      <option value={service.id} key={service.id}>{service.name}</option>
                    ))}
                  </select>
                  {selectedService?.description && <div className="form-text">{selectedService.description}</div>}
                  {selectedService?.instructions && (
                    <div className="alert alert-light border small mt-2 mb-0">{selectedService.instructions}</div>
                  )}
                  {selectedService?.requiredDocuments?.length > 0 && (
                    <div className="small text-muted mt-2">
                      <strong>Bring:</strong> {selectedService.requiredDocuments.join(', ')}
                    </div>
                  )}
                  {selectedService?.serviceDurationMinutes && (
                    <div className="small text-muted mt-1">Estimated service duration: about {selectedService.serviceDurationMinutes} minutes.</div>
                  )}
                </div>

                <div className="col-md-6">
                  <label className="form-label fw-semibold" htmlFor="documentRequest">Related document request (optional)</label>
                  <select
                    id="documentRequest"
                    className="form-select"
                    value={documentRequestId}
                    onChange={(event) => setDocumentRequestId(event.target.value)}
                    disabled={submitting}
                  >
                    <option value="">No document request linked</option>
                    {documents.map((doc) => (
                      <option value={doc.id} key={doc.id}>
                        {doc.trackingNumber} · {doc.documentType} ({doc.status})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="col-12">
                  <label className="form-label fw-semibold" htmlFor="appointmentPurpose">Purpose or notes (optional)</label>
                  <textarea
                    id="appointmentPurpose"
                    className="form-control"
                    rows="2"
                    maxLength="2000"
                    value={purpose}
                    onChange={(event) => setPurpose(event.target.value)}
                    placeholder="Add details to help the Registrar prepare for your visit."
                    disabled={submitting}
                  />
                </div>
              </div>

              <div className="mt-4">
                <div className="fw-semibold mb-2">Available appointment times</div>
                {slots.length === 0 ? (
                  <div className="alert alert-light border mb-0">There are no available times for this service right now.</div>
                ) : (
                  <div className="row g-2">
                    {slots.map((slot) => (
                      <div className="col-sm-6 col-xl-4" key={slot.id}>
                        <label className={`appointment-slot-option ${slotId === slot.id ? 'selected' : ''}`}>
                          <input
                            className="form-check-input mt-1"
                            type="radio"
                            name="appointmentSlot"
                            value={slot.id}
                            checked={slotId === slot.id}
                            onChange={() => setSlotId(slot.id)}
                            disabled={submitting || slot.available === 0}
                          />
                          <span>
                            <span className="d-block fw-semibold">{formatAppointmentDate(slot.appointmentDate, slot.startTime, slot.endTime)}</span>
                            <span className="small text-muted">{slot.available} of {slot.capacity} places available</span>
                          </span>
                        </label>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="d-flex flex-wrap align-items-center gap-3 mt-4">
                <button className="btn btn-pnc-primary" type="submit" disabled={submitting || !selectedSlot || selectedSlot.available === 0}>
                  {submitting ? 'Booking…' : 'Confirm appointment'}
                </button>
                <span className="small text-muted">Your appointment is confirmed immediately when a place is available.</span>
              </div>
            </form>
          )}
        </div>
      </section>

      <AppointmentList
        title="Upcoming appointments"
        appointments={upcomingAppointments}
        emptyTitle="No upcoming appointments"
        emptyMessage="Book an available time above to schedule your visit."
        onCancel={handleCancel}
        onReschedule={handleReschedule}
        selectedSlot={selectedSlot}
        submitting={submitting}
      />
      <AppointmentList
        title="Appointment history"
        appointments={historyAppointments}
        emptyTitle="No appointment history"
        emptyMessage="Completed and cancelled appointments will appear here."
      />
    </div>
  );
};

const AppointmentList = ({ title, appointments, emptyTitle, emptyMessage, onCancel, onReschedule, selectedSlot, submitting }) => (
  <section className="pnc-card mb-4">
    <div className="pnc-card-header"><span>{title}</span></div>
    <div className="pnc-card-body p-0">
      {appointments.length === 0 ? (
        <EmptyState icon="bi-calendar2-week" title={emptyTitle} message={emptyMessage} />
      ) : (
        <div className="table-responsive">
          <table className="table table-hover table-pnc align-middle mb-0">
            <thead><tr><th>Appointment</th><th>Service</th><th>Date &amp; time</th><th>Queue ticket</th><th>Status</th><th></th></tr></thead>
            <tbody>
              {appointments.map((appointment) => (
                <tr key={appointment.id}>
                  <td className="fw-semibold">{appointment.appointmentNumber}</td>
                  <td>
                    {appointment.serviceName}
                    {appointment.documentTrackingNumber && <div className="small text-muted">{appointment.documentTrackingNumber}</div>}
                    {appointment.purpose && <div className="small text-muted">{appointment.purpose}</div>}
                  </td>
                  <td>{formatAppointmentDate(appointment.appointmentDate, appointment.startTime, appointment.endTime)}</td>
                  <td>{appointment.queueTicket || '—'}</td>
                  <td><span className={`badge ${statusClass[appointment.status] || 'text-bg-secondary'}`}>{appointment.status}</span></td>
                  <td>
                    <div className="d-flex flex-wrap gap-1">
                      {appointment.status === 'CONFIRMED' && onCancel && (
                        <>
                          <button type="button" className="btn btn-sm btn-outline-danger" onClick={() => onCancel(appointment)} disabled={submitting}>Cancel</button>
                          {onReschedule && selectedSlot && selectedSlot.id !== appointment.slotId && selectedSlot.serviceId === appointment.serviceId && (
                            <button type="button" className="btn btn-sm btn-outline-primary" onClick={() => onReschedule(appointment)} disabled={submitting}>Reschedule to selected time</button>
                          )}
                        </>
                      )}
                      {appointment.queuePosition && (
                        <span className="small text-muted align-self-center">
                                                Position {appointment.queuePosition} · estimated wait {appointment.estimatedWaitMinutes} min (estimate only)
                        </span>
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
  </section>
);
