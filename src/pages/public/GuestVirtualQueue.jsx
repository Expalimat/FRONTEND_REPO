import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { publicVirtualQueueService } from '../../services/publicVirtualQueueService';

const initialApplicant = { applicant_name: '', applicant_email: '', applicant_phone: '' };
const activeStatuses = ['WAITING', 'CALLED', 'SERVING'];

const formatManilaTime = (value) => value
  ? new Intl.DateTimeFormat('en-PH', {
      timeZone: 'Asia/Manila',
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(value))
  : '—';

export const GuestVirtualQueue = () => {
  const [services, setServices] = useState([]);
  const [serviceId, setServiceId] = useState('');
  const [applicant, setApplicant] = useState(initialApplicant);
  const [ticket, setTicket] = useState(null);
  const [accessToken, setAccessToken] = useState('');
  const [lookup, setLookup] = useState({ ticket_number: '', access_token: '' });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [connectionError, setConnectionError] = useState('');
  const [notice, setNotice] = useState('');
  const [lastUpdated, setLastUpdated] = useState(null);

  useEffect(() => {
    let active = true;
    publicVirtualQueueService.getGuestQueueServices()
      .then((items) => {
        if (!active) return;
        setServices(items);
        setServiceId(items[0]?.id ?? '');
      })
      .catch((err) => active && setError(err.message || 'Unable to load available public queues.'))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!ticket || !accessToken || !activeStatuses.includes(ticket.queueStatus)) return undefined;

    let active = true;
    let timeoutId;
    const poll = async () => {
      try {
        const result = await publicVirtualQueueService.retrieveGuestQueueTicket({
          ticket_number: ticket.queueTicket,
          access_token: accessToken,
        });
        if (active) {
          setTicket(result.ticket);
          setConnectionError('');
          setLastUpdated(new Date());
        }
      } catch {
        if (active) setConnectionError('Live update is temporarily unavailable. We will retry automatically.');
      } finally {
        if (active) timeoutId = window.setTimeout(poll, 8000);
      }
    };

    timeoutId = window.setTimeout(poll, 8000);
    return () => {
      active = false;
      window.clearTimeout(timeoutId);
    };
  }, [ticket?.queueTicket, ticket?.queueStatus, accessToken]);

  const joinQueue = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError('');
    setNotice('');
    try {
      const result = await publicVirtualQueueService.joinGuestQueue({
        service_id: serviceId,
        ...applicant,
      });
      setTicket(result.ticket);
      setAccessToken(result.accessToken);
      setLastUpdated(new Date());
      setNotice('Your ticket is ready. Save the private access code below so you can retrieve it later.');
    } catch (err) {
      setError(err.message || 'Unable to join this public queue.');
    } finally {
      setSubmitting(false);
    }
  };

  const retrieveTicket = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError('');
    setNotice('');
    try {
      const result = await publicVirtualQueueService.retrieveGuestQueueTicket(lookup);
      setTicket(result.ticket);
      setAccessToken(lookup.access_token);
      setLastUpdated(new Date());
      setNotice('Your ticket has been retrieved.');
    } catch (err) {
      setError(err.message || 'Unable to retrieve this ticket. Check the ticket number and access code.');
    } finally {
      setSubmitting(false);
    }
  };

  const cancelTicket = async () => {
    if (!window.confirm(`Cancel virtual queue ticket ${ticket.queueTicket}?`)) return;
    setSubmitting(true);
    setError('');
    try {
      const result = await publicVirtualQueueService.cancelGuestQueueTicket({
        ticket_number: ticket.queueTicket,
        access_token: accessToken,
      });
      setTicket(result.ticket);
      setLastUpdated(new Date());
      setNotice('Your ticket was cancelled.');
    } catch (err) {
      setError(err.message || 'Unable to cancel this ticket.');
    } finally {
      setSubmitting(false);
    }
  };

  const copyAccessCode = async () => {
    try {
      await navigator.clipboard.writeText(accessToken);
      setNotice('Private access code copied.');
    } catch {
      setError('Copy was unavailable. Select and copy the private access code manually.');
    }
  };

  const selectedService = services.find((service) => String(service.id) === String(serviceId));

  return (
    <main className="public-queue-page py-4 py-md-5">
      <div className="container" style={{ maxWidth: 850 }}>
        <div className="d-flex flex-wrap justify-content-between align-items-center gap-2">
          <Link to="/login" className="text-decoration-none text-muted">
            <i className="bi bi-arrow-left me-2" />Return to main login
          </Link>
        </div>
        <div className="card border-0 shadow-sm mt-3">
          <div className="card-body p-3 p-sm-4 p-md-5">
            <span className="login-kicker">Pamantasan ng Cabuyao</span>
            <h1 className="h3 fw-bold mt-2">Incoming Freshman Virtual Queue</h1>
            <p className="text-muted">
              Join only a service that an administrator has enabled for public queue access. A queue ticket does not mean
              that you have been admitted or enrolled.
            </p>

            {error && <div className="alert alert-danger" role="alert">{error}</div>}
            {notice && <div className="alert alert-success" role="status">{notice}</div>}
            {connectionError && <div className="alert alert-warning" role="status">{connectionError}</div>}

            {loading ? (
              <p className="text-muted mb-0">Loading public queues…</p>
            ) : (
              <>
                {ticket && (
                  <TicketCard
                    ticket={ticket}
                    accessToken={accessToken}
                    lastUpdated={lastUpdated}
                    onCopyAccessCode={copyAccessCode}
                    onCancel={cancelTicket}
                    busy={submitting}
                  />
                )}

                {!ticket && (
                  <>
                    {services.length > 0 ? (
                      <form onSubmit={joinQueue} className="border rounded-3 p-3 p-md-4 mb-4">
                        <h2 className="h5">Join a queue</h2>
                        <div className="mb-3">
                          <label className="form-label fw-semibold" htmlFor="guest-service">Available service</label>
                          <select
                            id="guest-service"
                            className="form-select"
                            value={serviceId}
                            onChange={(event) => setServiceId(event.target.value)}
                            required
                            disabled={submitting}
                          >
                            {services.map((service) => (
                              <option key={service.id} value={service.id}>
                                {service.name} {service.acceptingTickets ? '' : '(not accepting tickets)'}
                              </option>
                            ))}
                          </select>
                          {selectedService?.instructions && <div className="form-text">{selectedService.instructions}</div>}
                          {selectedService && (
                            <div className="small text-muted mt-2">
                              {selectedService.issuedCount}/{selectedService.queueCapacity} tickets issued today ·{' '}
                              {selectedService.remainingCount} remaining
                              {selectedService.queuePaused ? ' · Intake is paused' : ''}
                            </div>
                          )}
                        </div>
                        {[
                          ['applicant_name', 'Full legal name', 'text'],
                          ['applicant_email', 'Email address', 'email'],
                          ['applicant_phone', 'Mobile number', 'tel'],
                        ].map(([name, label, type]) => (
                          <div className="mb-3" key={name}>
                            <label className="form-label fw-semibold" htmlFor={`guest-${name}`}>{label}</label>
                            <input
                              id={`guest-${name}`}
                              name={name}
                              type={type}
                              className="form-control"
                              value={applicant[name]}
                              onChange={(event) => setApplicant((current) => ({ ...current, [name]: event.target.value }))}
                              maxLength={name === 'applicant_phone' ? 50 : 255}
                              required
                              disabled={submitting}
                            />
                          </div>
                        ))}
                        <button
                          className="btn login-submit"
                          type="submit"
                          disabled={submitting || !selectedService?.acceptingTickets}
                        >
                          {submitting ? 'Joining…' : 'Join queue'}
                        </button>
                      </form>
                    ) : (
                      <div className="alert alert-light border">
                        Incoming-freshman virtual queue access is not currently enabled. Please check back when an administrator opens a queue for public access.
                      </div>
                    )}

                    <RetrievalForm
                      lookup={lookup}
                      onChange={(event) => setLookup((current) => ({ ...current, [event.target.name]: event.target.value }))}
                      onSubmit={retrieveTicket}
                      busy={submitting}
                    />
                  </>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </main>
  );
};

const TicketCard = ({ ticket, accessToken, lastUpdated, onCopyAccessCode, onCancel, busy }) => {
  const isWaiting = ticket.queueStatus === 'WAITING';
  const statusStyle = {
    WAITING: 'text-bg-primary',
    CALLED: 'text-bg-warning',
    SERVING: 'text-bg-success',
    COMPLETED: 'text-bg-secondary',
    CANCELLED: 'text-bg-secondary',
    NO_SHOW: 'text-bg-danger',
  }[ticket.queueStatus] || 'text-bg-secondary';

  return (
    <section className="border rounded-3 p-3 p-md-4 mb-4" aria-label="Your virtual queue ticket">
      <div className="d-flex flex-wrap justify-content-between align-items-start gap-2">
        <div>
          <div className="small text-uppercase text-muted">Your ticket</div>
          <div className="display-6 fw-bold text-success text-break">{ticket.queueTicket}</div>
        </div>
        <span className={`badge fs-6 ${statusStyle}`}>{ticket.queueStatus?.replaceAll('_', ' ')}</span>
      </div>
      <dl className="row mt-3 mb-0">
        <dt className="col-5 col-sm-4">Service</dt><dd className="col-7 col-sm-8">{ticket.serviceName}</dd>
        <dt className="col-5 col-sm-4">Queue date</dt><dd className="col-7 col-sm-8">{ticket.queueDate}</dd>
        {isWaiting && <>
          <dt className="col-5 col-sm-4">People ahead</dt><dd className="col-7 col-sm-8">{ticket.eligiblePeopleAhead ?? 0}</dd>
          <dt className="col-5 col-sm-4">Queue position</dt><dd className="col-7 col-sm-8">{ticket.queuePosition ?? '—'}</dd>
          <dt className="col-5 col-sm-4">Estimated wait</dt>
          <dd className="col-7 col-sm-8">{ticket.estimatedWaitMinutes ?? '—'} min <span className="small text-muted">(estimate only)</span></dd>
        </>}
      </dl>
      {ticket.serviceInstructions && <div className="alert alert-light border small mt-3 mb-0">{ticket.serviceInstructions}</div>}
      {ticket.queuePaused && activeStatuses.includes(ticket.queueStatus) && (
        <div className="alert alert-warning small mt-3 mb-0">New ticket intake is paused. Your existing ticket remains active.</div>
      )}
      {ticket.queueStatus === 'CALLED' && (
        <div className="alert alert-warning fw-semibold mt-3 mb-0" role="alert">
          Your ticket has been called. Please proceed to the service counter.
        </div>
      )}
      {ticket.queueStatus === 'COMPLETED' && <div className="alert alert-success mt-3 mb-0">This ticket has been completed.</div>}
      {ticket.queueStatus === 'CANCELLED' && <div className="alert alert-secondary mt-3 mb-0">This ticket was cancelled.</div>}
      {ticket.queueStatus === 'NO_SHOW' && <div className="alert alert-secondary mt-3 mb-0">This ticket is closed as a no-show.</div>}

      {accessToken && (
        <div className="alert alert-info mt-3 mb-0">
          <div className="fw-semibold">Private ticket access code</div>
          <p className="small mb-2">Keep this code private. You need it with your ticket number to retrieve or cancel this ticket.</p>
          <code className="d-block text-break user-select-all">{accessToken}</code>
          <button type="button" className="btn btn-sm btn-outline-primary mt-2" onClick={onCopyAccessCode}>
            Copy access code
          </button>
        </div>
      )}

      {isWaiting && accessToken && (
        <button type="button" className="btn btn-outline-danger mt-3" onClick={onCancel} disabled={busy}>
          {busy ? 'Please wait…' : 'Cancel ticket'}
        </button>
      )}
      <div className="small text-muted mt-3">
        Last updated {lastUpdated ? formatManilaTime(lastUpdated) : formatManilaTime(ticket.updatedAt)} (Manila time).
        {ticket.waitEstimateIsEstimate && ` ${ticket.waitEstimateNote}`}
      </div>
    </section>
  );
};

const RetrievalForm = ({ lookup, onChange, onSubmit, busy }) => (
  <form onSubmit={onSubmit} className="border rounded-3 p-3 p-md-4">
    <h2 className="h5">Already have a ticket?</h2>
    <p className="small text-muted">Enter the ticket number and the private access code you saved when you joined.</p>
    <div className="mb-3">
      <label className="form-label fw-semibold" htmlFor="guest-ticket-number">Ticket number</label>
      <input
        id="guest-ticket-number"
        name="ticket_number"
        className="form-control"
        value={lookup.ticket_number}
        onChange={onChange}
        autoCapitalize="characters"
        maxLength={50}
        required
        disabled={busy}
      />
    </div>
    <div className="mb-3">
      <label className="form-label fw-semibold" htmlFor="guest-access-token">Private access code</label>
      <input
        id="guest-access-token"
        name="access_token"
        className="form-control font-monospace"
        value={lookup.access_token}
        onChange={onChange}
        autoComplete="off"
        maxLength={64}
        required
        disabled={busy}
      />
    </div>
    <button type="submit" className="btn btn-outline-success" disabled={busy}>
      {busy ? 'Checking…' : 'Retrieve ticket'}
    </button>
  </form>
);
