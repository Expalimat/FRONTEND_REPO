import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { appointmentService } from '../../services/appointmentService';

const RETURN_PATHS = new Set(['/registrar/appointments', '/department/appointments', '/admin/appointments']);

export const AppointmentQueueDisplayPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [services, setServices] = useState([]);
  const [lastFetchedAt, setLastFetchedAt] = useState(null);
  const [error, setError] = useState('');
  const [currentTime, setCurrentTime] = useState(() => new Date());

  const loadDisplay = useCallback(async () => {
    try {
      const display = await appointmentService.getPublicQueue();
      setServices(display.services);
      setLastFetchedAt(new Date());
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

  useEffect(() => {
    const intervalId = window.setInterval(() => setCurrentTime(new Date()), 1000);
    return () => window.clearInterval(intervalId);
  }, []);

  const requestedReturnPath = searchParams.get('returnTo');
  const returnPath = RETURN_PATHS.has(requestedReturnPath) ? requestedReturnPath : '/';
  const formattedCurrentTime = new Intl.DateTimeFormat('en-PH', {
    dateStyle: 'full',
    timeStyle: 'medium',
    timeZone: 'Asia/Manila'
  }).format(currentTime);
  const formattedLastFetchedAt = lastFetchedAt && new Intl.DateTimeFormat('en-PH', {
    timeStyle: 'medium',
    timeZone: 'Asia/Manila'
  }).format(lastFetchedAt);
  const groupedServices = services.reduce((groups, service) => {
    const key = service.serviceName.trim().toLowerCase();
    groups.set(key, [...(groups.get(key) || []), service]);
    return groups;
  }, new Map());
  const displayServices = [...groupedServices.values()].flatMap((group) => {
    const activeQueues = group.filter((service) =>
      service.nowServing || service.waitingCount > 0 || service.upcomingBookedSlots?.length > 0
    );
    if (activeQueues.length > 0) return activeQueues;

    return [group.slice().sort((a, b) => a.serviceCode.localeCompare(b.serviceCode))[0]];
  });

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
        <time className="appointment-display-clock" dateTime={currentTime.toISOString()}>
          {formattedCurrentTime} (Manila time)
        </time>
        <div className="appointment-display-scope">
          Today's live queue - Only appointments checked in for today appear here.
          Future bookings are available in Appointment Management.
        </div>
      </header>

      {error && <div className="alert alert-danger appointment-display-error" role="alert">{error}</div>}
      <div className="appointment-display-services">
        {displayServices.map((service) => (
          <section className="appointment-display-service" key={service.serviceCode}>
            <div className="appointment-display-service-name">{service.serviceName}</div>
            <div className="appointment-display-service-code">{service.serviceCode}</div>
            <div className="appointment-display-number">{service.nowServing || '—'}</div>
            <div className="appointment-display-waiting">{service.waitingCount} eligible people waiting</div>
            {service.upcomingBookedSlots?.length > 0 && (
              <div className="appointment-display-booking-capacity">
                <div>Upcoming booked slots</div>
                {service.upcomingBookedSlots.map((slot) => (
                  <div className="appointment-display-booking-slot" key={`${slot.appointmentDate}-${slot.startTime}`}>
                    {new Intl.DateTimeFormat('en-PH', {
                      dateStyle: 'medium',
                      timeZone: 'Asia/Manila'
                    }).format(new Date(`${slot.appointmentDate}T00:00:00+08:00`))}
                    {' at '}
                    {new Intl.DateTimeFormat('en-PH', {
                      timeStyle: 'short',
                      timeZone: 'Asia/Manila'
                    }).format(new Date(`${slot.appointmentDate}T${slot.startTime}:00+08:00`))}
                    {' · '}
                    {slot.bookedCount}/{slot.capacity} booked
                    {' · '}
                    {slot.remainingCount} remaining
                  </div>
                ))}
              </div>
            )}
            {service.averageServiceDurationMinutes && (
              <div className="appointment-display-waiting small">Estimated waits are not guaranteed; average service is {service.averageServiceDurationMinutes} min.</div>
            )}
          </section>
        ))}
        {displayServices.length === 0 && !error && <p>No appointment services are currently available.</p>}
      </div>
      <footer className="appointment-display-footer">
        <span>Live queue refreshes automatically every 5 seconds.</span>
        {formattedLastFetchedAt && <span>Last successful update {formattedLastFetchedAt} (Manila time).</span>}
      </footer>
    </main>
  );
};
