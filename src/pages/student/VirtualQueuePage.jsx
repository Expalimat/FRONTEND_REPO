import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { PageHeader } from '../../components/common/PageHeader';
import { LoadingState } from '../../components/feedback/LoadingState';
import { virtualQueueService } from '../../services/virtualQueueService';

const activeStatuses = ['WAITING', 'CALLED', 'SERVING'];

const manilaTime = (value) => value
  ? new Intl.DateTimeFormat('en-PH', {
      timeZone: 'Asia/Manila',
      hour: 'numeric',
      minute: '2-digit',
      second: '2-digit',
    }).format(new Date(value))
  : '';

export const VirtualQueuePage = () => {
  const [services, setServices] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState('');
  const [cancelling, setCancelling] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [updatedAt, setUpdatedAt] = useState(null);

  const refresh = useCallback(async () => {
    try {
      const [serviceList, ticketList] = await Promise.all([
        virtualQueueService.getVirtualQueueServices(),
        virtualQueueService.getMyVirtualQueueTickets(),
      ]);
      setServices(serviceList);
      setTickets(ticketList);
      setUpdatedAt(new Date());
      setError('');
    } catch (err) {
      setError(err.message || 'Unable to load virtual queue information.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
    const intervalId = window.setInterval(refresh, 10000);
    return () => window.clearInterval(intervalId);
  }, [refresh]);

  const activeTicket = tickets.find((ticket) => activeStatuses.includes(ticket.queueStatus || ticket.status));

  const joinQueue = async (service) => {
    setJoining(service.id);
    setError('');
    setNotice('');
    try {
      const ticket = await virtualQueueService.joinVirtualQueue(service.id);
      setNotice(`Your ticket ${ticket.queueTicket} is ready.`);
      await refresh();
    } catch (err) {
      setError(err.message || 'Unable to join this virtual queue.');
    } finally {
      setJoining('');
    }
  };

  const cancelTicket = async () => {
    if (!activeTicket || !window.confirm(`Cancel virtual queue ticket ${activeTicket.queueTicket}?`)) return;
    setCancelling(activeTicket.queueEntryId);
    setError('');
    setNotice('');
    try {
      await virtualQueueService.cancelVirtualQueueTicket(activeTicket.queueEntryId);
      setNotice(`Ticket ${activeTicket.queueTicket} was cancelled.`);
      await refresh();
    } catch (err) {
      setError(err.message || 'Unable to cancel this ticket.');
    } finally {
      setCancelling('');
    }
  };

  if (loading) return <LoadingState message="Loading virtual queue..." />;

  return (
    <div>
      <PageHeader
        title="Virtual Queue"
        subtitle="Join an available student service queue and follow your ticket status here."
        breadcrumbs={[
          { label: 'Dashboard', to: '/student/dashboard' },
          { label: 'Virtual Queue', to: '/student/queue' },
        ]}
      />

      {error && <div className="alert alert-danger" role="alert">{error}</div>}
      {notice && <div className="alert alert-success" role="status">{notice}</div>}

      {activeTicket && (
        <section className="pnc-card mb-4">
          <div className="pnc-card-header d-flex justify-content-between align-items-center">
            <span><i className="bi bi-ticket-perforated me-2 text-success"></i>Your active ticket</span>
            <span className="badge text-bg-info">{(activeTicket.queueStatus || activeTicket.status)?.replaceAll('_', ' ')}</span>
          </div>
          <div className="pnc-card-body">
            <div className="row g-3">
              <div className="col-sm-6"><div className="small text-muted">Ticket</div><strong className="fs-4">{activeTicket.queueTicket}</strong></div>
              <div className="col-sm-6"><div className="small text-muted">Service</div><strong>{activeTicket.serviceName}</strong></div>
              {activeTicket.queueStatus === 'WAITING' && (
                <div className="col-12">
                  <div>Position {activeTicket.queuePosition ?? '—'} · {activeTicket.eligiblePeopleAhead ?? 0} people ahead</div>
                  <div className="small text-muted">Estimated wait: {activeTicket.estimatedWaitMinutes ?? 0} minutes (estimate only)</div>
                </div>
              )}
              {activeTicket.queueStatus === 'CALLED' && (
                <div className="col-12"><div className="alert alert-warning mb-0">Your ticket has been called. Please proceed to the service counter.</div></div>
              )}
              {activeTicket.serviceInstructions && <div className="col-12">{activeTicket.serviceInstructions}</div>}
              {activeTicket.queueStatus === 'WAITING' && (
                <div className="col-12">
                  <button type="button" className="btn btn-outline-danger" onClick={cancelTicket} disabled={Boolean(cancelling)}>
                    {cancelling ? 'Cancelling…' : 'Cancel ticket'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      <section className="pnc-card">
        <div className="pnc-card-header"><span><i className="bi bi-people me-2 text-success"></i>Available queues</span></div>
        <div className="pnc-card-body">
          {services.length === 0 ? (
            <p className="text-muted mb-0">There are no queues accepting student tickets right now. Please check back later.</p>
          ) : (
            <div className="row g-3">
              {services.map((service) => (
                <div className="col-md-6" key={service.id}>
                  <article className="border rounded p-3 h-100">
                    <div className="d-flex justify-content-between gap-2">
                      <h2 className="h6 mb-0">{service.name}</h2>
                      <span className={`badge ${service.acceptingTickets ? 'text-bg-success' : 'text-bg-secondary'}`}>
                        {service.queuePaused ? 'Paused' : service.acceptingTickets ? 'Open' : 'Full'}
                      </span>
                    </div>
                    {service.description && <p className="small text-muted mt-2 mb-1">{service.description}</p>}
                    {service.instructions && <p className="small mt-2 mb-1">{service.instructions}</p>}
                    <p className="small text-muted mt-2 mb-0">
                      {service.issuedCount}/{service.queueCapacity} tickets issued today · {service.remainingCount} remaining
                    </p>
                    <button
                      type="button"
                      className="btn btn-sm btn-pnc-primary mt-3"
                      onClick={() => joinQueue(service)}
                      disabled={!service.acceptingTickets || Boolean(activeTicket) || Boolean(joining)}
                    >
                      {joining === service.id ? 'Joining…' : 'Join queue'}
                    </button>
                  </article>
                </div>
              ))}
            </div>
          )}
          {updatedAt && <p className="small text-muted mt-3 mb-0">Updated {manilaTime(updatedAt)} (Manila time). This page refreshes every 10 seconds.</p>}
          <Link className="btn btn-link px-0 mt-2" to="/queue/display">View live queue display</Link>
        </div>
      </section>
    </div>
  );
};
