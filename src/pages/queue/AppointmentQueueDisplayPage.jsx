import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { appointmentService } from '../../services/appointmentService';

const RETURN_PATHS = new Set(['/registrar/appointments', '/department/appointments', '/admin/appointments']);

export const AppointmentQueueDisplayPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [services, setServices] = useState([]);
  const [updatedAt, setUpdatedAt] = useState('');
  const [error, setError] = useState('');

  const loadDisplay = useCallback(async () => {
    try {
      const display = await appointmentService.getPublicQueue();
      setServices(display.services);
      setUpdatedAt(display.updatedAt);
      setError('');
    } catch (err) {
      setError(err.message || 'The queue display could not be updated.');
    }
  }, []);

  useEffect(() => {
    loadDisplay();
    const intervalId = window.setInterval(loadDisplay, 5000);
    return () => window.clearInterval(intervalId);
  }, [loadDisplay]);

  const requestedReturnPath = searchParams.get('returnTo');
  const returnPath = RETURN_PATHS.has(requestedReturnPath) ? requestedReturnPath : '/';

  return (
    <main className="appointment-display-page" aria-live="polite">
      <header className="appointment-display-header">
        <button
          type="button"
          className="appointment-display-back btn btn-outline-light"
          onClick={() => navigate(returnPath)}
        >
          <i className="bi bi-arrow-left me-2" aria-hidden="true"></i>
          Back
        </button>
        <div className="appointment-display-brand">PnC-OESS</div>
        <h1>Appointments &amp; Queue</h1>
        <p>Please proceed when your queue number is displayed.</p>
      </header>

      {error && <div className="alert alert-danger appointment-display-error" role="alert">{error}</div>}
      <div className="appointment-display-services">
        {services.map((service) => (
          <section className="appointment-display-service" key={service.serviceCode}>
            <div className="appointment-display-service-name">{service.serviceName}</div>
            <div className="appointment-display-number">{service.nowServing || '—'}</div>
            <div className="appointment-display-waiting">{service.waitingCount} eligible people waiting</div>
            {service.averageServiceDurationMinutes && (
              <div className="appointment-display-waiting small">Estimated waits are not guaranteed; average service is {service.averageServiceDurationMinutes} min.</div>
            )}
          </section>
        ))}
        {services.length === 0 && !error && <p>No appointment services are currently available.</p>}
      </div>
      <footer className="appointment-display-footer">
        <span>Display refreshes automatically</span>
        {updatedAt && <span>Updated {updatedAt}</span>}
      </footer>
    </main>
  );
};
