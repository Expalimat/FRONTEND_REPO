import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { virtualQueueService } from '../../services/virtualQueueService';

const RETURN_PATHS = new Set(['/registrar/queue', '/department/queue', '/admin/queue']);

export const QueueDisplayPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [services, setServices] = useState([]);
  const [error, setError] = useState('');
  const [currentTime, setCurrentTime] = useState(() => new Date());

  const loadDisplay = useCallback(async () => {
    try {
      const display = await virtualQueueService.getPublicQueue();
      setServices(display.services || []);
      setError('');
    } catch (err) {
      setError(err.message || 'The queue display could not be updated.');
    }
  }, []);

  useEffect(() => {
    loadDisplay();
    const refreshId = window.setInterval(loadDisplay, 5000);
    const clockId = window.setInterval(() => setCurrentTime(new Date()), 1000);
    return () => {
      window.clearInterval(refreshId);
      window.clearInterval(clockId);
    };
  }, [loadDisplay]);

  const requestedReturnPath = searchParams.get('returnTo');
  const returnPath = RETURN_PATHS.has(requestedReturnPath) ? requestedReturnPath : '/';
  const formattedCurrentTime = new Intl.DateTimeFormat('en-PH', {
    dateStyle: 'full',
    timeStyle: 'medium',
    timeZone: 'Asia/Manila',
  }).format(currentTime);

  return (
    <main className="queue-display-page" aria-live="polite">
      <header className="queue-display-header">
        <button type="button" className="queue-display-back btn btn-outline-light" onClick={() => navigate(returnPath)}>
          <i className="bi bi-arrow-left me-2" aria-hidden="true"></i>Back
        </button>
        <div className="queue-display-brand">PnC-OESS</div>
        <h1>Virtual Queue</h1>
        <p>Please proceed when your ticket is called.</p>
        <time className="queue-display-clock" dateTime={currentTime.toISOString()}>{formattedCurrentTime} (Manila time)</time>
        <div className="queue-display-scope">Live virtual queue tickets for today.</div>
      </header>

      {error && <div className="alert alert-danger queue-display-error" role="alert">{error}</div>}
      <div className="queue-display-services">
        {services.length === 0 ? (
          <p className="text-center text-muted">There are no active queues right now.</p>
        ) : services.map((service) => (
          <section className="queue-display-service" key={service.serviceCode}>
            <div className="queue-display-service-name">{service.serviceName}</div>
            <div className="queue-display-service-code">{service.serviceCode}</div>
            <div className="queue-display-number">{service.nowServing || '—'}</div>
            <div className="queue-display-waiting">{service.waitingCount} people waiting</div>
          </section>
        ))}
      </div>
    </main>
  );
};
