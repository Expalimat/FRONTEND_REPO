import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { PageHeader } from '../../components/common/PageHeader';
import { LoadingState } from '../../components/feedback/LoadingState';
import { useAuth } from '../../context/AuthContext';
import { appointmentService } from '../../services/appointmentService';

const manilaDate = () => new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Asia/Manila',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit'
}).format(new Date());

const formatTime = (time) => new Date(`2000-01-01T${time}:00+08:00`).toLocaleTimeString('en-PH', {
  hour: 'numeric',
  minute: '2-digit',
  timeZone: 'Asia/Manila'
});

const appointmentHasEnded = (appointment) =>
  new Date(`${appointment.appointmentDate}T${appointment.endTime}:00+08:00`).getTime() +
    Number(appointment.lateArrivalGraceMinutes || 0) * 60_000 <= Date.now();

const statusClass = {
  CONFIRMED: 'text-bg-success',
  WAITING: 'text-bg-info',
  SERVING: 'text-bg-primary',
  COMPLETED: 'text-bg-secondary',
  CANCELLED: 'text-bg-secondary',
  NO_SHOW: 'text-bg-danger',
  RESCHEDULED: 'text-bg-secondary'
};

export const AppointmentManagementPage = ({ dashboardPath = '/registrar/dashboard' }) => {
  const { currentUser } = useAuth();
  const isServiceAdministrator = currentUser?.role === 'Administrator';
  const [services, setServices] = useState([]);
  const [selectedServiceId, setSelectedServiceId] = useState('');
  const [slots, setSlots] = useState([]);
  const [capacityEdits, setCapacityEdits] = useState({});
  const [scheduleEdits, setScheduleEdits] = useState({});
  const [closures, setClosures] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [dateAppointments, setDateAppointments] = useState([]);
  const [slotDate, setSlotDate] = useState(manilaDate());
  const [slotStart, setSlotStart] = useState('');
  const [slotEnd, setSlotEnd] = useState('');
  const [capacity, setCapacity] = useState('10');
  const [serviceCode, setServiceCode] = useState('');
  const [serviceName, setServiceName] = useState('');
  const [serviceDescription, setServiceDescription] = useState('');
  const [serviceInstructions, setServiceInstructions] = useState('');
  const [serviceDocuments, setServiceDocuments] = useState('');
  const [serviceDuration, setServiceDuration] = useState('30');
  const [bookingWindow, setBookingWindow] = useState('30');
  const [cancellationCutoff, setCancellationCutoff] = useState('0');
  const [lateGrace, setLateGrace] = useState('0');
  const [earlyArrivalWindow, setEarlyArrivalWindow] = useState('30');
  const [editServiceName, setEditServiceName] = useState('');
  const [editServiceDescription, setEditServiceDescription] = useState('');
  const [editInstructions, setEditInstructions] = useState('');
  const [editDocuments, setEditDocuments] = useState('');
  const [editDuration, setEditDuration] = useState('30');
  const [editBookingWindow, setEditBookingWindow] = useState('30');
  const [editCancellationCutoff, setEditCancellationCutoff] = useState('0');
  const [editLateGrace, setEditLateGrace] = useState('0');
  const [editEarlyArrivalWindow, setEditEarlyArrivalWindow] = useState('30');
  const [editQueueEnabled, setEditQueueEnabled] = useState(false);
  const [editQueuePaused, setEditQueuePaused] = useState(false);
  const [editQueueCapacity, setEditQueueCapacity] = useState('50');
  const [closureReason, setClosureReason] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const selectedService = services.find((service) => service.id === selectedServiceId);
  const currentAppointment = appointments.find((appointment) => ['CALLED', 'SERVING'].includes(appointment.queueStatus));
  const waitingAppointments = useMemo(
    () => appointments.filter((appointment) => appointment.queueStatus === 'WAITING'),
    [appointments]
  );

  useEffect(() => {
    setEditServiceName(selectedService?.name || '');
    setEditServiceDescription(selectedService?.description || '');
    setEditInstructions(selectedService?.instructions || '');
    setEditDocuments((selectedService?.requiredDocuments || []).join('\n'));
    setEditDuration(String(selectedService?.serviceDurationMinutes || 30));
    setEditBookingWindow(String(selectedService?.bookingWindowDays || 30));
    setEditCancellationCutoff(String(selectedService?.cancellationCutoffMinutes || 0));
    setEditLateGrace(String(selectedService?.lateArrivalGraceMinutes || 0));
    setEditEarlyArrivalWindow(String(selectedService?.earlyArrivalWindowMinutes ?? 30));
    setEditQueueEnabled(Boolean(selectedService?.queueEnabled));
    setEditQueuePaused(Boolean(selectedService?.queuePaused));
    setEditQueueCapacity(String(selectedService?.queueCapacity || 50));
  }, [selectedServiceId, selectedService]);

  const loadServices = useCallback(async () => {
    const list = await appointmentService.getServices();
    setServices(list);
    setSelectedServiceId((current) => current || list.find((service) => service.isActive)?.id || list[0]?.id || '');
  }, []);

  const loadDateAppointments = useCallback(async () => {
    if (!slotDate) return [];
    return appointmentService.getAppointments({ date: slotDate });
  }, [slotDate]);

  const loadServiceData = useCallback(async () => {
    if (!selectedServiceId) {
      setSlots([]);
      setAppointments([]);
      setDateAppointments([]);
      return;
    }
    const [slotList, queue, closureList, bookingList] = await Promise.all([
      appointmentService.getServiceSlots(selectedServiceId, slotDate),
      appointmentService.getQueue(selectedServiceId),
      appointmentService.getClosures(selectedServiceId),
      loadDateAppointments()
    ]);
    setSlots(slotList);
    setCapacityEdits(Object.fromEntries(slotList.map((slot) => [slot.id, String(slot.capacity)])));
    setScheduleEdits(Object.fromEntries(slotList.map((slot) => [slot.id, {
      appointmentDate: slot.appointmentDate,
      startTime: slot.startTime,
      endTime: slot.endTime
    }])));
    setClosures(closureList);
    setAppointments(queue.appointments);
    setDateAppointments(bookingList);
  }, [selectedServiceId, slotDate, loadDateAppointments]);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([loadServices(), loadServiceData()]);
      setError('');
    } catch (err) {
      setError(err.message || 'Unable to refresh appointment management data.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [loadServices, loadServiceData]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      if (!selectedServiceId) return;
      Promise.all([
        appointmentService.getQueue(selectedServiceId),
        loadDateAppointments()
      ])
        .then(([queue, bookingList]) => {
          setAppointments(queue.appointments);
          setDateAppointments(bookingList);
        })
        .catch((err) => setError(err.message || 'Unable to refresh the service queue.'));
    }, 10000);
    return () => window.clearInterval(intervalId);
  }, [selectedServiceId, loadDateAppointments]);

  const runAction = async (action, successMessage) => {
    setSaving(true);
    setError('');
    setNotice('');
    try {
      await action();
      if (successMessage) setNotice(successMessage);
      await loadServiceData();
    } catch (err) {
      setError(err.message || 'Unable to complete this appointment action.');
      if (selectedServiceId) {
        try {
          const queue = await appointmentService.getQueue(selectedServiceId);
          setAppointments(queue.appointments);
        } catch (refreshError) {
          setError(refreshError.message || 'Unable to refresh the service queue.');
        }
      }
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateService = async (event) => {
    event.preventDefault();
    if (!selectedService) return;
    await runAction(async () => {
      const updated = await appointmentService.updateService(selectedService.id, {
        name: editServiceName.trim(),
        description: editServiceDescription.trim() || null,
        instructions: editInstructions.trim() || null,
        requiredDocuments: editDocuments.split(/\r?\n/).map((item) => item.trim()).filter(Boolean),
        serviceDurationMinutes: Number(editDuration),
        bookingWindowDays: Number(editBookingWindow),
        cancellationCutoffMinutes: Number(editCancellationCutoff),
        lateArrivalGraceMinutes: Number(editLateGrace),
        earlyArrivalWindowMinutes: Number(editEarlyArrivalWindow),
        queueEnabled: editQueueEnabled,
        queuePaused: editQueuePaused,
        queueCapacity: Number(editQueueCapacity)
      });
      setServices((list) => list.map((service) => service.id === updated.id ? updated : service));
    }, 'Appointment service updated.');
  };

  const handleCreateService = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      const service = await appointmentService.createService({
        code: serviceCode.trim().toUpperCase(),
        name: serviceName.trim(),
        description: serviceDescription.trim() || null,
        instructions: serviceInstructions.trim() || null,
        requiredDocuments: serviceDocuments.split(/\r?\n/).map((item) => item.trim()).filter(Boolean),
        serviceDurationMinutes: Number(serviceDuration),
        bookingWindowDays: Number(bookingWindow),
        cancellationCutoffMinutes: Number(cancellationCutoff),
        lateArrivalGraceMinutes: Number(lateGrace),
        earlyArrivalWindowMinutes: Number(earlyArrivalWindow)
      });
      setServices((existing) => [...existing, service].sort((a, b) => a.name.localeCompare(b.name)));
      setSelectedServiceId(service.id);
      setServiceCode('');
      setServiceName('');
      setServiceDescription('');
      setServiceInstructions('');
      setServiceDocuments('');
      setNotice('Appointment service created.');
    } catch (err) {
      setError(err.message || 'Unable to create the appointment service.');
    } finally {
      setSaving(false);
    }
  };

  const handleCreateSlot = async (event) => {
    event.preventDefault();
    if (!selectedServiceId) return;
    setSaving(true);
    setError('');
    try {
      await appointmentService.createSlot(selectedServiceId, {
        appointmentDate: slotDate,
        startTime: slotStart,
        endTime: slotEnd,
        capacity: Number(capacity)
      });
      setNotice('Appointment availability added.');
      await loadServiceData();
    } catch (err) {
      setError(err.message || 'Unable to add this appointment time.');
    } finally {
      setSaving(false);
    }
  };

  const toggleService = async () => {
    if (!selectedService) return;
    await runAction(
      async () => {
        const updated = await appointmentService.updateService(selectedService.id, {
          isActive: !selectedService.isActive
        });
        setServices((list) => list.map((service) => service.id === updated.id ? updated : service));
      },
      selectedService.isActive ? 'Service paused; existing appointments remain unchanged.' : 'Service is active for new bookings.'
    );
  };

  const toggleQueuePause = () => runAction(
    async () => {
      const updated = await appointmentService.setQueuePause(selectedService.id, !selectedService.queuePaused);
      setServices((list) => list.map((service) => service.id === updated.id ? updated : service));
    },
    selectedService.queuePaused ? 'Virtual queue intake resumed.' : 'Virtual queue intake paused; existing tickets remain available for processing.'
  );

  const toggleSlot = (slot) => runAction(
    () => appointmentService.updateSlot(slot.id, { status: slot.status === 'Open' ? 'Closed' : 'Open' }),
    `Appointment time ${slot.status === 'Open' ? 'closed' : 'reopened'}.`
  );

  const handleCloseDate = (event) => {
    event.preventDefault();
    if (!selectedServiceId) return;
    runAction(
      () => appointmentService.closeDate(selectedServiceId, { closedDate: slotDate, reason: closureReason.trim() || undefined }),
      `${slotDate} closed for new bookings.`
    ).then(() => setClosureReason(''));
  };

  const handleCheckIn = (appointment) => {
    const overrideReason = appointmentHasEnded(appointment)
      ? window.prompt('Late check-in requires an authorized staff override reason:')
      : undefined;
    if (appointmentHasEnded(appointment) && !overrideReason?.trim()) return;
    return runAction(
      () => appointmentService.checkIn(appointment.id, overrideReason ? { overrideReason: overrideReason.trim() } : {}),
      `${appointment.appointmentNumber} checked in.`
    );
  };

  const handleOverrideCall = (appointment) => {
    const reason = window.prompt('Reason for calling this appointment out of queue order:');
    if (!reason?.trim()) return;
    return runAction(
      () => appointment.walkIn
        ? appointmentService.overrideQueueEntry(appointment.queueEntryId, reason.trim())
        : appointmentService.overrideCall(selectedServiceId, { appointmentId: appointment.id, reason: reason.trim() }),
      `${appointment.queueTicket} called by staff override.`
    );
  };

  const handleStaffCancel = (appointment) => {
    const reason = window.prompt(`Reason for cancelling ${appointment.appointmentNumber}:`);
    if (!reason?.trim()) return;
    return runAction(
      () => appointment.walkIn
        ? appointmentService.cancelQueueEntry(appointment.queueEntryId, reason.trim())
        : appointmentService.cancel(appointment.id, reason.trim()),
      `${appointment.appointmentNumber} cancelled.`
    );
  };

  const finishAppointment = (appointment, status) => {
    const reason = status === 'NO_SHOW' ? window.prompt(`Reason for marking ${appointment.appointmentNumber} no-show (optional):`) || '' : '';
    return runAction(
      () => appointment.walkIn
        ? appointmentService.finishQueueEntry(appointment.queueEntryId, status, reason)
        : appointmentService.finish(appointment.id, status, reason),
      `${appointment.appointmentNumber} marked ${status.toLowerCase().replace('_', ' ')}.`
    );
  };

  if (loading) return <LoadingState message="Loading appointment management..." />;

  return (
    <div>
      <PageHeader
        title="Appointments & Queue"
        subtitle="Manage Registrar services and capacity, check in students, and call the in-person queue."
        breadcrumbs={[
          { label: 'Dashboard', to: dashboardPath },
          { label: 'Appointments & Queue', to: '/registrar/appointments' }
        ]}
        actions={
          <a className="btn btn-outline-success btn-sm" href="/appointment-queue/display?returnTo=%2Fregistrar%2Fappointments" target="_blank" rel="noreferrer">
            <i className="bi bi-display me-2"></i>Waiting-room display
          </a>
        }
      />

      {error && <div className="alert alert-danger" role="alert">{error}</div>}
      {notice && (
        <div className="alert alert-success alert-dismissible" role="status">
          {notice}
          <button type="button" className="btn-close" onClick={() => setNotice('')} aria-label="Close"></button>
        </div>
      )}

      <div className="row g-4 mb-4">
        <div className="col-xl-5">
          <section className="pnc-card h-100 mb-0">
            <div className="pnc-card-header"><span>Appointment services</span></div>
            <div className="pnc-card-body">
              <label className="form-label fw-semibold" htmlFor="managedService">Selected service</label>
              <div className="d-flex gap-2">
                <select
                  id="managedService"
                  className="form-select"
                  value={selectedServiceId}
                  onChange={(event) => setSelectedServiceId(event.target.value)}
                >
                  {services.map((service) => (
                    <option value={service.id} key={service.id}>
                      {service.code} · {service.name}
                      {service.publicBookable ? ' · Public booking' : ''}
                      {service.isActive ? '' : ' (paused)'}
                    </option>
                  ))}
                </select>
                {selectedService && isServiceAdministrator && (
                  <button type="button" className={`btn ${selectedService.isActive ? 'btn-outline-danger' : 'btn-outline-success'} text-nowrap`} onClick={toggleService} disabled={saving}>
                    {selectedService.isActive ? 'Pause service' : 'Activate service'}
                  </button>
                )}
                {selectedService && (
                  <button type="button" className={`btn ${selectedService.queuePaused ? 'btn-outline-success' : 'btn-outline-warning'} text-nowrap`} onClick={toggleQueuePause} disabled={saving}>
                    {selectedService.queuePaused ? 'Resume intake' : 'Pause intake'}
                  </button>
                )}
              </div>
              <p className="form-text mb-0 mt-2">
                Time slots are specific to the selected service. Incoming-freshman bookings use
                Freshman Enrollment Appointment, not CTC / Document Claiming.
              </p>

              {selectedService && isServiceAdministrator && (
                <form className="mt-3" onSubmit={handleUpdateService}>
                  <label className="form-label small fw-semibold" htmlFor="editServiceName">Edit service details</label>
                  <input id="editServiceName" className="form-control mb-2" value={editServiceName} onChange={(event) => setEditServiceName(event.target.value)} maxLength="255" required disabled={saving} />
                  <textarea className="form-control mb-2" aria-label="Service description" placeholder="Description" rows="2" maxLength="2000" value={editServiceDescription} onChange={(event) => setEditServiceDescription(event.target.value)} disabled={saving} />
                  <textarea className="form-control mb-2" aria-label="Service instructions" placeholder="Student instructions" rows="2" maxLength="4000" value={editInstructions} onChange={(event) => setEditInstructions(event.target.value)} disabled={saving} />
                  <textarea className="form-control mb-2" aria-label="Required documents" placeholder="Required documents or prerequisites (one per line)" rows="2" value={editDocuments} onChange={(event) => setEditDocuments(event.target.value)} disabled={saving} />
                  <div className="row g-2">
                    <div className="col-6">
                      <label className="form-label small" htmlFor="editDuration">Estimated duration (minutes)</label>
                      <input id="editDuration" type="number" min="1" max="1440" className="form-control" value={editDuration} onChange={(event) => setEditDuration(event.target.value)} required disabled={saving} />
                    </div>
                    <div className="col-6">
                      <label className="form-label small" htmlFor="editBookingWindow">Booking window (days)</label>
                      <input id="editBookingWindow" type="number" min="1" max="365" className="form-control" value={editBookingWindow} onChange={(event) => setEditBookingWindow(event.target.value)} required disabled={saving} />
                    </div>
                    <div className="col-6">
                      <label className="form-label small" htmlFor="editCancellationCutoff">Cancellation cutoff (minutes)</label>
                      <input id="editCancellationCutoff" type="number" min="0" max="10080" className="form-control" value={editCancellationCutoff} onChange={(event) => setEditCancellationCutoff(event.target.value)} required disabled={saving} />
                    </div>
                    <div className="col-6">
                      <label className="form-label small" htmlFor="editLateGrace">Late-arrival grace (minutes)</label>
                      <input id="editLateGrace" type="number" min="0" max="240" className="form-control" value={editLateGrace} onChange={(event) => setEditLateGrace(event.target.value)} required disabled={saving} />
                    </div>
                    <div className="col-6">
                      <label className="form-label small" htmlFor="editEarlyArrival">Early check-in window (minutes)</label>
                      <input id="editEarlyArrival" type="number" min="0" max="1440" className="form-control" value={editEarlyArrivalWindow} onChange={(event) => setEditEarlyArrivalWindow(event.target.value)} required disabled={saving} />
                    </div>
                    <div className="col-12">
                      <label className="form-label small" htmlFor="editQueueCapacity">Daily virtual queue capacity</label>
                      <input id="editQueueCapacity" type="number" min="1" max="500" className="form-control" value={editQueueCapacity} onChange={(event) => setEditQueueCapacity(event.target.value)} required disabled={saving} />
                    </div>
                    <div className="col-12">
                      <div className="form-check">
                        <input id="editQueueEnabled" type="checkbox" className="form-check-input" checked={editQueueEnabled} onChange={(event) => setEditQueueEnabled(event.target.checked)} disabled={saving || selectedService.code === 'FRESHMAN-ENROLLMENT'} />
                        <label className="form-check-label small" htmlFor="editQueueEnabled">Allow students to join this virtual queue without an appointment{selectedService.code === 'FRESHMAN-ENROLLMENT' ? ' (freshman enrollment stays appointment-only)' : ''}</label>
                      </div>
                      <div className="form-check">
                        <input id="editQueuePaused" type="checkbox" className="form-check-input" checked={editQueuePaused} onChange={(event) => setEditQueuePaused(event.target.checked)} disabled={saving} />
                        <label className="form-check-label small" htmlFor="editQueuePaused">Pause new queue intake (existing tickets can still be processed)</label>
                      </div>
                    </div>
                  </div>
                  <button className="btn btn-sm btn-outline-primary mt-2" type="submit" disabled={saving}>Save service</button>
                </form>
              )}

              {isServiceAdministrator && <>
              <hr />
              <div className="fw-semibold mb-2">Add an appointment service</div>
              <form onSubmit={handleCreateService}>
                <div className="row g-2">
                  <div className="col-sm-4">
                    <label className="form-label small" htmlFor="serviceCode">Service code</label>
                    <input id="serviceCode" className="form-control" value={serviceCode} onChange={(event) => setServiceCode(event.target.value)} maxLength="30" placeholder="e.g. REG" required disabled={saving} />
                  </div>
                  <div className="col-sm-8">
                    <label className="form-label small" htmlFor="serviceName">Service name</label>
                    <input id="serviceName" className="form-control" value={serviceName} onChange={(event) => setServiceName(event.target.value)} maxLength="255" required disabled={saving} />
                  </div>
                  <div className="col-12">
                    <label className="form-label small" htmlFor="serviceDescription">Description</label>
                    <textarea id="serviceDescription" className="form-control" rows="2" value={serviceDescription} onChange={(event) => setServiceDescription(event.target.value)} maxLength="2000" disabled={saving} />
                  </div>
                  <div className="col-12">
                    <label className="form-label small" htmlFor="serviceInstructions">Student instructions</label>
                    <textarea id="serviceInstructions" className="form-control" rows="2" value={serviceInstructions} onChange={(event) => setServiceInstructions(event.target.value)} maxLength="4000" disabled={saving} />
                  </div>
                  <div className="col-12">
                    <label className="form-label small" htmlFor="serviceDocuments">Required documents or prerequisites (one per line)</label>
                    <textarea id="serviceDocuments" className="form-control" rows="2" value={serviceDocuments} onChange={(event) => setServiceDocuments(event.target.value)} maxLength="4000" disabled={saving} />
                  </div>
                  <div className="col-6">
                    <label className="form-label small" htmlFor="serviceDuration">Estimated duration (minutes)</label>
                    <input id="serviceDuration" type="number" min="1" max="1440" className="form-control" value={serviceDuration} onChange={(event) => setServiceDuration(event.target.value)} required disabled={saving} />
                  </div>
                  <div className="col-6">
                    <label className="form-label small" htmlFor="bookingWindow">Booking window (days)</label>
                    <input id="bookingWindow" type="number" min="1" max="365" className="form-control" value={bookingWindow} onChange={(event) => setBookingWindow(event.target.value)} required disabled={saving} />
                  </div>
                  <div className="col-6">
                    <label className="form-label small" htmlFor="cancellationCutoff">Cancellation cutoff (minutes)</label>
                    <input id="cancellationCutoff" type="number" min="0" max="10080" className="form-control" value={cancellationCutoff} onChange={(event) => setCancellationCutoff(event.target.value)} required disabled={saving} />
                  </div>
                  <div className="col-6">
                    <label className="form-label small" htmlFor="lateGrace">Late-arrival grace (minutes)</label>
                    <input id="lateGrace" type="number" min="0" max="240" className="form-control" value={lateGrace} onChange={(event) => setLateGrace(event.target.value)} required disabled={saving} />
                  </div>
                  <div className="col-6">
                    <label className="form-label small" htmlFor="earlyArrival">Early check-in window (minutes)</label>
                    <input id="earlyArrival" type="number" min="0" max="1440" className="form-control" value={earlyArrivalWindow} onChange={(event) => setEarlyArrivalWindow(event.target.value)} required disabled={saving} />
                  </div>
                </div>
                <button className="btn btn-sm btn-pnc-primary mt-3" type="submit" disabled={saving}>Add service</button>
              </form>
              </>}
            </div>
          </section>
        </div>

        <div className="col-xl-7">
          <section className="pnc-card h-100 mb-0">
            <div className="pnc-card-header"><span>Set appointment capacity</span></div>
            <div className="pnc-card-body">
              {!selectedService ? (
                <p className="text-muted mb-0">Add or select a service to manage appointment times.</p>
              ) : (
                <>
                  {isServiceAdministrator && <form className="row g-2 align-items-end" onSubmit={handleCreateSlot}>
                    <div className="col-sm-6 col-lg-4">
                      <label className="form-label small" htmlFor="slotDate">Date</label>
                      <input id="slotDate" type="date" className="form-control" min={manilaDate()} value={slotDate} onChange={(event) => setSlotDate(event.target.value)} required />
                    </div>
                    <div className="col-6 col-lg-2">
                      <label className="form-label small" htmlFor="slotStart">Start</label>
                      <input id="slotStart" type="time" className="form-control" value={slotStart} onChange={(event) => setSlotStart(event.target.value)} required />
                    </div>
                    <div className="col-6 col-lg-2">
                      <label className="form-label small" htmlFor="slotEnd">End</label>
                      <input id="slotEnd" type="time" className="form-control" value={slotEnd} onChange={(event) => setSlotEnd(event.target.value)} required />
                    </div>
                    <div className="col-6 col-lg-2">
                      <label className="form-label small" htmlFor="slotCapacity">Capacity</label>
                      <input id="slotCapacity" type="number" className="form-control" min="1" max="500" value={capacity} onChange={(event) => setCapacity(event.target.value)} required />
                    </div>
                    <div className="col-sm-6 col-lg-2 d-grid">
                      <button className="btn btn-pnc-primary" type="submit" disabled={saving}>Add time</button>
                    </div>
                  </form>}

                  <div className="mt-3">
                    <label className="form-label small fw-semibold" htmlFor="slotListDate">Show availability for</label>
                    <input id="slotListDate" type="date" className="form-control form-control-sm appointment-date-filter" value={slotDate} onChange={(event) => setSlotDate(event.target.value)} />
                  </div>
                  {isServiceAdministrator && <form className="row g-2 align-items-end mt-2" onSubmit={handleCloseDate}>
                    <div className="col-md-4">
                      <label className="form-label small" htmlFor="closureReason">Close this date for new bookings</label>
                      <input id="closureReason" className="form-control form-control-sm" value={closureReason} onChange={(event) => setClosureReason(event.target.value)} maxLength="1000" placeholder="Reason (optional)" />
                    </div>
                    <div className="col-md-4">
                      <button className="btn btn-sm btn-outline-danger" type="submit" disabled={saving}>Close {slotDate}</button>
                    </div>
                    {closures.length > 0 && (
                      <div className="col-12 small">
                        <span className="fw-semibold">Closed dates: </span>
                        {closures.map((closure) => (
                          <span className="badge text-bg-secondary me-2" key={closure.id}>
                            {closure.closedDate}{closure.reason ? ` · ${closure.reason}` : ''}
                            <button
                              className="btn btn-sm text-white p-0 ms-2"
                              type="button"
                              aria-label={`Reopen ${closure.closedDate}`}
                              onClick={() => runAction(
                                () => appointmentService.reopenDate(selectedServiceId, closure.id),
                                `${closure.closedDate} reopened for eligible slots.`
                              )}
                              disabled={saving}
                            >×</button>
                          </span>
                        ))}
                      </div>
                    )}
                  </form>}
                  {slots.length === 0 ? (
                    <div className="small text-muted mt-3">No appointment times set for this date.</div>
                  ) : (
                    <div className="table-responsive mt-3">
                      <table className="table table-sm align-middle mb-0">
                        <thead><tr><th>Schedule</th><th>Capacity</th><th>Status</th><th></th></tr></thead>
                        <tbody>
                          {slots.map((slot) => (
                            <tr key={slot.id}>
                              <td>
                                <form
                                  className="d-flex flex-wrap align-items-center gap-1"
                                  onSubmit={(event) => {
                                    event.preventDefault();
                                    runAction(
                                      () => appointmentService.updateSlot(slot.id, scheduleEdits[slot.id]),
                                      'Appointment schedule updated.'
                                    );
                                  }}
                                >
                                  <input
                                    className="form-control form-control-sm"
                                    style={{ minWidth: '130px', maxWidth: '155px' }}
                                    type="date"
                                    min={manilaDate()}
                                    aria-label="Appointment date"
                                    value={scheduleEdits[slot.id]?.appointmentDate || slot.appointmentDate}
                                    onChange={(event) => setScheduleEdits((current) => ({
                                      ...current,
                                      [slot.id]: { ...current[slot.id], appointmentDate: event.target.value }
                                    }))}
                                    disabled={saving || !isServiceAdministrator}
                                  />
                                  <input
                                    className="form-control form-control-sm"
                                    style={{ maxWidth: '115px' }}
                                    type="time"
                                    aria-label="Start time"
                                    value={scheduleEdits[slot.id]?.startTime || slot.startTime}
                                    onChange={(event) => setScheduleEdits((current) => ({
                                      ...current,
                                      [slot.id]: { ...current[slot.id], startTime: event.target.value }
                                    }))}
                                    disabled={saving || !isServiceAdministrator}
                                  />
                                  <input
                                    className="form-control form-control-sm"
                                    style={{ maxWidth: '115px' }}
                                    type="time"
                                    aria-label="End time"
                                    value={scheduleEdits[slot.id]?.endTime || slot.endTime}
                                    onChange={(event) => setScheduleEdits((current) => ({
                                      ...current,
                                      [slot.id]: { ...current[slot.id], endTime: event.target.value }
                                    }))}
                                    disabled={saving || !isServiceAdministrator}
                                  />
                                  {isServiceAdministrator && <button
                                    className="btn btn-sm btn-outline-primary"
                                    type="submit"
                                    disabled={saving || (
                                      scheduleEdits[slot.id]?.appointmentDate === slot.appointmentDate &&
                                      scheduleEdits[slot.id]?.startTime === slot.startTime &&
                                      scheduleEdits[slot.id]?.endTime === slot.endTime
                                    )}
                                  >Save schedule</button>}
                                </form>
                              </td>
                              <td>
                                <form
                                  className="d-flex align-items-center gap-1"
                                  onSubmit={(event) => {
                                    event.preventDefault();
                                    runAction(
                                      () => appointmentService.updateSlot(slot.id, { capacity: Number(capacityEdits[slot.id]) }),
                                      'Appointment capacity updated.'
                                    );
                                  }}
                                >
                                  <span className="small text-muted">{slot.currentBookingCount} /</span>
                                  <input
                                    className="form-control form-control-sm appointment-capacity-input"
                                    type="number"
                                    min={Math.max(1, slot.booked)}
                                    max="500"
                                    aria-label={`Capacity for ${formatTime(slot.startTime)} appointment`}
                                    value={capacityEdits[slot.id] ?? slot.capacity}
                                    onChange={(event) => setCapacityEdits((current) => ({ ...current, [slot.id]: event.target.value }))}
                                    disabled={saving || !isServiceAdministrator}
                                  />
                                  {isServiceAdministrator && <button className="btn btn-sm btn-outline-primary" type="submit" disabled={saving || Number(capacityEdits[slot.id]) === slot.capacity}>Save</button>}
                                </form>
                              </td>
                              <td>
                                <span className={`badge ${slot.status === 'Open' ? 'text-bg-success' : 'text-bg-secondary'}`}>{slot.status}</span>
                                {slot.dateClosed && <span className="badge text-bg-danger ms-1">Date closed</span>}
                              </td>
                              <td className="text-end">{isServiceAdministrator && <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => toggleSlot(slot)} disabled={saving}>{slot.status === 'Open' ? 'Close' : 'Reopen'}</button>}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </>
              )}
            </div>
          </section>
        </div>
      </div>

      {slotDate && (
        <section className="pnc-card mb-4">
          <div className="pnc-card-header d-flex flex-wrap justify-content-between align-items-center gap-2">
            <span>
              <i className="bi bi-calendar-check text-success me-2"></i>
              Bookings for {slotDate}
            </span>
            <div className="d-flex align-items-center gap-2">
              <span className="badge text-bg-primary">{dateAppointments.length} booked</span>
              <button type="button" className="btn btn-sm btn-outline-secondary" onClick={refresh} disabled={!selectedServiceId || refreshing}>
                <i className={`bi ${refreshing ? 'bi-arrow-repeat' : 'bi-arrow-clockwise'} me-1`}></i>
                {refreshing ? 'Refreshing…' : 'Refresh'}
              </button>
            </div>
          </div>
          <div className="pnc-card-body">
            {dateAppointments.length === 0 ? (
              <p className="text-muted text-center mb-0">No appointments have been booked for this date.</p>
            ) : (
              <div className="table-responsive">
                <table className="table table-hover table-pnc align-middle mb-0">
                  <thead>
                    <tr><th>Reference</th><th>Student / applicant</th><th>Service</th><th>Time</th><th>Queue ticket</th><th>Status</th></tr>
                  </thead>
                  <tbody>
                    {dateAppointments.map((appointment) => (
                      <tr key={appointment.id}>
                        <td className="fw-semibold">{appointment.appointmentNumber}</td>
                        <td>
                          {appointment.studentName}
                          <div className="small text-muted">{appointment.studentNumber || 'Guest applicant'}</div>
                        </td>
                        <td>{appointment.serviceName}</td>
                        <td>{formatTime(appointment.startTime)}–{formatTime(appointment.endTime)}</td>
                        <td>{appointment.queueTicket || 'Assigned at check-in'}</td>
                        <td>
                          <span className={`badge ${statusClass[appointment.status] || 'text-bg-secondary'}`}>
                            {appointment.status.replaceAll('_', ' ')}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <p className="form-text mb-0 mt-2">
              This list includes bookings across services and refreshes automatically. Queue actions remain in the service-specific section below.
            </p>
          </div>
        </section>
      )}

      <section className="pnc-card">
        <div className="pnc-card-header d-flex flex-wrap justify-content-between align-items-center gap-2">
          <span><i className="bi bi-person-lines-fill text-success me-2"></i>Today's appointments and queue</span>
        </div>
        <div className="pnc-card-body">
          {!selectedService ? (
            <p className="text-muted mb-0">Select an appointment service to view today's queue.</p>
          ) : (
            <>
              <div className="appointment-queue-now mb-3">
                <div>
                  <div className="small text-muted">Now serving</div>
                  <div className="appointment-queue-current">{currentAppointment?.queueTicket || '—'}</div>
                  {currentAppointment && <div>{currentAppointment.studentName} · {currentAppointment.appointmentNumber}</div>}
                </div>
                <div className="text-end">
                  <div className="fw-semibold">{waitingAppointments.length} waiting</div>
                  <button type="button" className="btn btn-pnc-primary mt-2" onClick={() => runAction(() => appointmentService.callNext(selectedServiceId), 'Next student called.')} disabled={saving || Boolean(currentAppointment) || waitingAppointments.length === 0}>
                    <i className="bi bi-megaphone me-2"></i>Call next
                  </button>
                </div>
              </div>

              {appointments.length === 0 ? (
                <p className="text-muted text-center py-4 mb-0">No appointments are scheduled for today.</p>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover table-pnc align-middle mb-0">
                    <thead><tr><th>Appointment</th><th>Student</th><th>Time</th><th>Queue</th><th>Status</th><th>Actions</th></tr></thead>
                    <tbody>
                      {appointments.map((appointment) => (
                        <tr key={appointment.id}>
                          <td className="fw-semibold">{appointment.appointmentNumber}{appointment.documentTrackingNumber && <div className="small text-muted">{appointment.documentTrackingNumber}</div>}</td>
                          <td>{appointment.studentName}<div className="small text-muted">{appointment.studentNumber}</div></td>
                          <td>{appointment.walkIn ? 'Virtual walk-in' : `${formatTime(appointment.startTime)}–${formatTime(appointment.endTime)}`}</td>
                          <td>{appointment.queueTicket || '—'}</td>
                          <td><span className={`badge ${statusClass[appointment.status] || 'text-bg-secondary'}`}>{appointment.status.replaceAll('_', ' ')}</span></td>
                          <td>
                            <div className="d-flex flex-wrap gap-1">
                              {appointment.status === 'CONFIRMED' && (
                                <>
                                  <button type="button" className="btn btn-sm btn-outline-primary" onClick={() => handleCheckIn(appointment)} disabled={saving}>Check in</button>
                                  <button type="button" className="btn btn-sm btn-outline-danger" onClick={() => handleStaffCancel(appointment)} disabled={saving}>Cancel</button>
                                  {!appointment.walkIn && appointmentHasEnded(appointment) && <button type="button" className="btn btn-sm btn-outline-danger" onClick={() => finishAppointment(appointment, 'NO_SHOW')} disabled={saving}>No-show</button>}
                                </>
                              )}
                              {appointment.status === 'WAITING' && appointment.queueStatus === 'WAITING' && (
                                <>
                                  <button type="button" className="btn btn-sm btn-outline-primary" onClick={() => handleOverrideCall(appointment)} disabled={saving}>Call with override</button>
                                  <button type="button" className="btn btn-sm btn-outline-danger" onClick={() => handleStaffCancel(appointment)} disabled={saving}>Cancel</button>
                                  {(appointment.walkIn || appointmentHasEnded(appointment)) && <button type="button" className="btn btn-sm btn-outline-danger" onClick={() => finishAppointment(appointment, 'NO_SHOW')} disabled={saving}>No-show</button>}
                                </>
                              )}
                              {appointment.status === 'WAITING' && appointment.queueStatus === 'CALLED' && (
                                <>
                                  <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => runAction(() => appointment.walkIn ? appointmentService.recallQueueEntry(appointment.queueEntryId) : appointmentService.recall(appointment.id), `${appointment.queueTicket} recalled.`)} disabled={saving}>Recall</button>
                                  <button type="button" className="btn btn-sm btn-success" onClick={() => runAction(() => appointment.walkIn ? appointmentService.startQueueEntry(appointment.queueEntryId) : appointmentService.start(appointment.id), `${appointment.appointmentNumber} service started.`)} disabled={saving}>Start service</button>
                                  {(appointment.walkIn || appointmentHasEnded(appointment)) && <button type="button" className="btn btn-sm btn-outline-danger" onClick={() => finishAppointment(appointment, 'NO_SHOW')} disabled={saving}>No-show</button>}
                                </>
                              )}
                              {appointment.status === 'SERVING' && (
                                <button type="button" className="btn btn-sm btn-success" onClick={() => finishAppointment(appointment, 'COMPLETED')} disabled={saving}>Complete</button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </div>
      </section>
      <p className="small text-muted mt-3 mb-0">Queue order is first-checked-in, first-served within each service and Manila operating date. Staff overrides require a reason and are audited. Late student check-in is unavailable after the configured grace period; authorized staff can override with a reason. No-show is available after the scheduled slot ends.</p>
    </div>
  );
};
