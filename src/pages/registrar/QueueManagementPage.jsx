import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { PageHeader } from '../../components/common/PageHeader';
import { LoadingState } from '../../components/feedback/LoadingState';
import { useAuth } from '../../context/AuthContext';
import { readPage } from '../../services/api';
import { userService } from '../../services/userService';
import { virtualQueueService } from '../../services/virtualQueueService';

const emptyService = {
  code: '',
  name: '',
  description: '',
  instructions: '',
  publicBookable: false,
  queueEnabled: true,
  queueCapacity: 50,
};

const getQueueEntries = (result) => result?.tickets ?? result?.entries ?? result?.queue ?? [];

export const QueueManagementPage = ({ dashboardPath = '/registrar/dashboard' }) => {
  const { currentUser } = useAuth();
  const isAdministrator = currentUser?.role === 'Administrator';
  const [services, setServices] = useState([]);
  const [selectedServiceId, setSelectedServiceId] = useState('');
  const [entries, setEntries] = useState([]);
  const [eligibleStaff, setEligibleStaff] = useState([]);
  const [assignedStaffIds, setAssignedStaffIds] = useState([]);
  const [savingAssignments, setSavingAssignments] = useState(false);
  const [serviceForm, setServiceForm] = useState(emptyService);
  const [editingService, setEditingService] = useState(false);
  const [creatingService, setCreatingService] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const selectedService = services.find((service) => String(service.id) === String(selectedServiceId));

  const loadServices = useCallback(async () => {
    const list = await virtualQueueService.getServices();
    setServices(list);
    setSelectedServiceId((current) => current && list.some((service) => String(service.id) === String(current))
      ? current
      : list.find((service) => service.isActive)?.id || list[0]?.id || '');
  }, []);

  const loadQueue = useCallback(async (serviceId = selectedServiceId) => {
    if (!serviceId) {
      setEntries([]);
      return;
    }
    const result = await virtualQueueService.getQueue(serviceId);
    setEntries(getQueueEntries(result));
  }, [selectedServiceId]);

  const refresh = useCallback(async () => {
    try {
      await loadServices();
      setError('');
    } catch (err) {
      setError(err.message || 'Unable to load queue services.');
    } finally {
      setLoading(false);
    }
  }, [loadServices]);

  useEffect(() => { refresh(); }, [refresh]);

  useEffect(() => {
    if (!selectedServiceId) return undefined;
    let active = true;
    const updateQueue = async () => {
      try {
        const result = await virtualQueueService.getQueue(selectedServiceId);
        if (active) setEntries(getQueueEntries(result));
      } catch (err) {
        if (active) setError(err.message || 'Unable to refresh the queue.');
      }
    };
    updateQueue();
    const intervalId = window.setInterval(updateQueue, 8000);
    return () => {
      active = false;
      window.clearInterval(intervalId);
    };
  }, [selectedServiceId]);

  useEffect(() => {
    if (!selectedService || creatingService) return;
    setServiceForm({
      code: selectedService.code || '',
      name: selectedService.name || '',
      description: selectedService.description || '',
      instructions: selectedService.instructions || '',
      publicBookable: Boolean(selectedService.publicBookable),
      queueEnabled: Boolean(selectedService.queueEnabled),
      queueCapacity: Number(selectedService.queueCapacity || 50),
    });
    setEditingService(false);
  }, [selectedServiceId, selectedService, creatingService]);

  useEffect(() => {
    if (!isAdministrator || !selectedServiceId || creatingService) {
      setEligibleStaff([]);
      setAssignedStaffIds([]);
      return;
    }
    let active = true;
    Promise.all([
      virtualQueueService.getStaffAssignments(selectedServiceId),
      userService.getUsers({ page: 1, per_page: 100 }),
    ]).then(([assigned, userPage]) => {
      if (!active) return;
      setAssignedStaffIds(assigned.map((user) => user.id));
      setEligibleStaff(readPage(userPage).data.filter((user) =>
        user.status === 'Active' && ['Registrar', 'Department Staff'].includes(user.role)
      ));
    }).catch((err) => {
      if (active) setError(err.message || 'Unable to load service staff assignments.');
    });
    return () => { active = false; };
  }, [isAdministrator, selectedServiceId, creatingService]);

  const runQueueAction = async (entry, action) => {
    setSaving(true);
    setError('');
    setNotice('');
    try {
      if (action === 'call') await virtualQueueService.callQueueEntry(entry.queueEntryId || entry.id);
      if (action === 'start') await virtualQueueService.startQueueEntry(entry.queueEntryId || entry.id);
      if (action === 'recall') await virtualQueueService.recallQueueEntry(entry.queueEntryId || entry.id);
      if (action === 'complete') await virtualQueueService.finishQueueEntry(entry.queueEntryId || entry.id, 'COMPLETED');
      if (action === 'no-show') await virtualQueueService.finishQueueEntry(entry.queueEntryId || entry.id, 'NO_SHOW');
      if (action === 'cancel') await virtualQueueService.cancelQueueEntry(entry.queueEntryId || entry.id);
      if (action === 'override') {
        const reason = window.prompt('Enter a reason for calling this ticket out of order:');
        if (!reason?.trim()) return;
        await virtualQueueService.overrideQueueEntry(entry.queueEntryId || entry.id, reason.trim());
      }
      setNotice(`Queue ticket ${entry.queueTicket} updated.`);
      await loadQueue();
    } catch (err) {
      setError(err.message || 'Unable to update the queue ticket.');
    } finally {
      setSaving(false);
    }
  };

  const saveService = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    setNotice('');
    try {
      const data = {
        ...serviceForm,
        queueCapacity: Number(serviceForm.queueCapacity),
      };
      if (selectedService && editingService && !creatingService) {
        await virtualQueueService.updateService(selectedService.id, data);
        setNotice('Queue service settings saved.');
      } else {
        await virtualQueueService.createService(data);
        setNotice('Queue service created.');
      }
      setEditingService(false);
      setCreatingService(false);
      await loadServices();
    } catch (err) {
      setError(err.message || 'Unable to save queue service settings.');
    } finally {
      setSaving(false);
    }
  };

  const deleteService = async () => {
    if (!selectedService) return;
    if (!window.confirm(`Delete "${selectedService.name}"? This cannot be undone.`)) return;
    setSaving(true);
    setError('');
    setNotice('');
    try {
      await virtualQueueService.deleteService(selectedService.id);
      setNotice('Queue service deleted.');
      setSelectedServiceId('');
      await loadServices();
    } catch (err) {
      setError(err.message || 'Unable to delete queue service.');
    } finally {
      setSaving(false);
    }
  };

  const togglePause = async () => {
    if (!selectedService) return;
    setSaving(true);
    setError('');
    try {
      await virtualQueueService.setQueuePause(selectedService.id, !selectedService.queuePaused);
      setNotice(selectedService.queuePaused ? 'Queue intake resumed.' : 'Queue intake paused.');
      await loadServices();
    } catch (err) {
      setError(err.message || 'Unable to update queue intake.');
    } finally {
      setSaving(false);
    }
  };

  const saveAssignments = async () => {
    if (!selectedServiceId) return;
    setSavingAssignments(true);
    setError('');
    setNotice('');
    try {
      const assigned = await virtualQueueService.updateStaffAssignments(selectedServiceId, assignedStaffIds);
      setAssignedStaffIds(assigned.map((user) => user.id));
      setNotice('Queue service staff assignments saved.');
    } catch (err) {
      setError(err.message || 'Unable to save service staff assignments.');
    } finally {
      setSavingAssignments(false);
    }
  };

  if (loading) return <LoadingState message="Loading virtual queue management..." />;

  const waitingEntries = entries.filter((entry) => entry.status === 'WAITING' || entry.queueStatus === 'WAITING');
  const activeEntries = entries.filter((entry) => ['CALLED', 'SERVING'].includes(entry.status || entry.queueStatus));

  return (
    <div>
      <PageHeader
        title="Virtual Queue Management"
        subtitle="Monitor student and incoming-freshman tickets and operate service queues."
        breadcrumbs={[
          { label: 'Dashboard', to: dashboardPath },
          { label: 'Virtual Queue', to: `/${currentUser?.role === 'Administrator' ? 'admin' : currentUser?.role === 'Department Staff' ? 'department' : 'registrar'}/queue` },
        ]}
        actions={(
          <div className="d-flex gap-2">
            {isAdministrator && <button type="button" className="btn btn-outline-secondary" onClick={() => { setSelectedServiceId(''); setServiceForm(emptyService); setCreatingService(true); setEditingService(true); }}>New service</button>}
            <Link to={`/queue/display?returnTo=${encodeURIComponent(`/${currentUser?.role === 'Administrator' ? 'admin' : currentUser?.role === 'Department Staff' ? 'department' : 'registrar'}/queue`)}`} className="btn btn-outline-primary">Open live display</Link>
          </div>
        )}
      />

      {error && <div className="alert alert-danger" role="alert">{error}</div>}
      {notice && <div className="alert alert-success" role="status">{notice}</div>}

      <section className="pnc-card mb-4">
        <div className="pnc-card-header d-flex flex-wrap justify-content-between align-items-center gap-2">
          <span><i className="bi bi-people me-2 text-success"></i>Queue service</span>
          <div className="d-flex gap-2">
            <select
              className="form-select"
              aria-label="Select queue service"
              value={selectedServiceId}
              onChange={(event) => setSelectedServiceId(event.target.value)}
            >
              <option value="">Select a service</option>
              {services.map((service) => <option key={service.id} value={service.id}>{service.name}</option>)}
            </select>
            {selectedService && (
              <button type="button" className={`btn ${selectedService.queuePaused ? 'btn-success' : 'btn-outline-warning'} text-nowrap`} onClick={togglePause} disabled={saving}>
                {selectedService.queuePaused ? 'Resume intake' : 'Pause intake'}
              </button>
            )}
          </div>
        </div>
        <div className="pnc-card-body">
          {!selectedService ? (
            <p className="text-muted mb-0">No queue services are available. An administrator can create one below.</p>
          ) : (
            <>
              <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
                <div>
                  <h2 className="h5 mb-1">{selectedService.name}</h2>
                  <div className="small text-muted">
                    {selectedService.queueEnabled ? 'Queue enabled' : 'Queue disabled'}
                    {' · '}
                    {selectedService.publicBookable ? 'Public guest access enabled' : 'Student access only'}
                    {' · '}
                    {selectedService.queueCapacity} tickets per day
                  </div>
                </div>
                {isAdministrator && (
                  <>
                    <button type="button" className="btn btn-outline-primary" onClick={() => { setCreatingService(false); setEditingService((current) => !current); }}>
                      {editingService && !creatingService ? 'Cancel edit' : 'Edit service'}
                    </button>
                    <button type="button" className="btn btn-outline-secondary" onClick={() => { setSelectedServiceId(''); setServiceForm(emptyService); setCreatingService(true); setEditingService(true); }}>
                      New service
                    </button>
                    <button type="button" className="btn btn-outline-danger" onClick={deleteService} disabled={saving}>Delete service</button>
                  </>
                )}
              </div>

              {isAdministrator && editingService && !creatingService && (
                <form className="border rounded p-3 mb-4" onSubmit={saveService}>
                  <div className="row g-3">
                    <div className="col-md-4">
                      <label className="form-label" htmlFor="queue-code">Service code</label>
                      <input id="queue-code" className="form-control" value={serviceForm.code} disabled required />
                    </div>
                    <div className="col-md-8">
                      <label className="form-label" htmlFor="queue-name">Service name</label>
                      <input id="queue-name" className="form-control" value={serviceForm.name} onChange={(event) => setServiceForm((form) => ({ ...form, name: event.target.value }))} required />
                    </div>
                    <div className="col-12">
                      <label className="form-label" htmlFor="queue-description">Description</label>
                      <textarea id="queue-description" className="form-control" rows="2" value={serviceForm.description} onChange={(event) => setServiceForm((form) => ({ ...form, description: event.target.value }))} />
                    </div>
                    <div className="col-12">
                      <label className="form-label" htmlFor="queue-instructions">Instructions</label>
                      <textarea id="queue-instructions" className="form-control" rows="2" value={serviceForm.instructions} onChange={(event) => setServiceForm((form) => ({ ...form, instructions: event.target.value }))} />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label" htmlFor="queue-capacity">Daily ticket capacity</label>
                      <input id="queue-capacity" className="form-control" type="number" min="1" max="10000" value={serviceForm.queueCapacity} onChange={(event) => setServiceForm((form) => ({ ...form, queueCapacity: event.target.value }))} required />
                    </div>
                    <div className="col-md-8 d-flex flex-column justify-content-center gap-2">
                      <label className="form-check">
                        <input className="form-check-input" type="checkbox" checked={serviceForm.queueEnabled} onChange={(event) => setServiceForm((form) => ({ ...form, queueEnabled: event.target.checked }))} />
                        <span className="form-check-label">Enable virtual queue tickets</span>
                      </label>
                      <label className="form-check">
                        <input className="form-check-input" type="checkbox" checked={serviceForm.publicBookable} onChange={(event) => setServiceForm((form) => ({ ...form, publicBookable: event.target.checked }))} />
                        <span className="form-check-label">Allow incoming freshmen / public guests to join this queue</span>
                      </label>
                    </div>
                    <div className="col-12">
                      <button className="btn btn-pnc-primary" type="submit" disabled={saving}>{saving ? 'Saving…' : 'Save service settings'}</button>
                    </div>
                  </div>
                </form>
              )}

              {isAdministrator && (
                <div className="border rounded p-3 mb-4">
                  <div className="fw-semibold mb-2">Staff assigned to this queue</div>
                  {eligibleStaff.length === 0 ? (
                    <p className="small text-muted mb-0">No active Registrar or Department Staff accounts are available to assign.</p>
                  ) : (
                    <div className="row g-2">
                      {eligibleStaff.map((staff) => (
                        <div className="col-md-6" key={staff.id}>
                          <label className="form-check">
                            <input
                              className="form-check-input"
                              type="checkbox"
                              checked={assignedStaffIds.includes(staff.id)}
                              onChange={(event) => setAssignedStaffIds((current) => event.target.checked
                                ? [...current, staff.id]
                                : current.filter((id) => id !== staff.id))}
                            />
                            <span className="form-check-label">{staff.name} <span className="text-muted">({staff.role})</span></span>
                          </label>
                        </div>
                      ))}
                    </div>
                  )}
                  <button type="button" className="btn btn-sm btn-outline-primary mt-3" onClick={saveAssignments} disabled={savingAssignments}>
                    {savingAssignments ? 'Saving…' : 'Save staff assignments'}
                  </button>
                </div>
              )}

              <h3 className="h6">Currently serving</h3>
              {activeEntries.length === 0 ? <p className="text-muted">No active tickets are being served.</p> : (
                <div className="table-responsive mb-4">
                  <table className="table table-pnc align-middle">
                    <thead><tr><th>Ticket</th><th>Name</th><th>Status</th><th>Action</th></tr></thead>
                    <tbody>{activeEntries.map((entry) => (
                      <tr key={entry.queueEntryId || entry.id}>
                        <td className="fw-semibold">{entry.queueTicket}</td>
                        <td>{entry.studentName || 'Student'}</td>
                        <td>{entry.status || entry.queueStatus}</td>
                        <td className="d-flex gap-2">
                          {entry.status === 'CALLED' && <button className="btn btn-sm btn-primary" onClick={() => runQueueAction(entry, 'start')} disabled={saving}>Start</button>}
                          {entry.status === 'CALLED' && <button className="btn btn-sm btn-outline-secondary" onClick={() => runQueueAction(entry, 'recall')} disabled={saving}>Recall</button>}
                          {entry.status === 'SERVING' && <button className="btn btn-sm btn-success" onClick={() => runQueueAction(entry, 'complete')} disabled={saving}>Complete</button>}
                          <button className="btn btn-sm btn-outline-danger" onClick={() => runQueueAction(entry, 'no-show')} disabled={saving}>No-show</button>
                        </td>
                      </tr>
                    ))}</tbody>
                  </table>
                </div>
              )}

              <h3 className="h6">Waiting tickets <span className="badge text-bg-secondary">{waitingEntries.length}</span></h3>
              {waitingEntries.length === 0 ? <p className="text-muted">There are no waiting tickets.</p> : (
                <div className="table-responsive">
                  <table className="table table-pnc align-middle">
                    <thead><tr><th>Ticket</th><th>Name</th><th>Type</th><th>Position</th><th>Actions</th></tr></thead>
                    <tbody>{waitingEntries.map((entry) => (
                      <tr key={entry.queueEntryId || entry.id}>
                        <td className="fw-semibold">{entry.queueTicket}</td>
                        <td>{entry.studentName || 'Student'}</td>
                        <td>{entry.isGuest ? 'Incoming freshman / guest' : 'Student'}</td>
                        <td>{entry.queuePosition ?? '—'}</td>
                        <td className="d-flex gap-2">
                          <button className="btn btn-sm btn-pnc-primary" onClick={() => runQueueAction(entry, 'call')} disabled={saving}>Call</button>
                          <button className="btn btn-sm btn-outline-warning" onClick={() => runQueueAction(entry, 'override')} disabled={saving}>Override</button>
                          <button className="btn btn-sm btn-outline-danger" onClick={() => runQueueAction(entry, 'cancel')} disabled={saving}>Cancel</button>
                          <button className="btn btn-sm btn-outline-secondary" onClick={() => runQueueAction(entry, 'no-show')} disabled={saving}>No-show</button>
                        </td>
                      </tr>
                    ))}</tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </div>
      </section>

      {isAdministrator && creatingService && (
        <section className="pnc-card">
          <div className="pnc-card-header"><span><i className="bi bi-sliders me-2 text-success"></i>Create queue service</span></div>
          <div className="pnc-card-body">
            <form onSubmit={saveService}>
              <div className="row g-3">
                <div className="col-md-3"><label className="form-label" htmlFor="new-queue-code">Service code</label><input id="new-queue-code" className="form-control" value={serviceForm.code} onChange={(event) => setServiceForm((form) => ({ ...form, code: event.target.value.toUpperCase() }))} required /></div>
                <div className="col-md-9"><label className="form-label" htmlFor="new-queue-name">Service name</label><input id="new-queue-name" className="form-control" value={serviceForm.name} onChange={(event) => setServiceForm((form) => ({ ...form, name: event.target.value }))} required /></div>
                <div className="col-md-6"><label className="form-label" htmlFor="new-queue-description">Description</label><textarea id="new-queue-description" className="form-control" value={serviceForm.description} onChange={(event) => setServiceForm((form) => ({ ...form, description: event.target.value }))} /></div>
                <div className="col-md-6"><label className="form-label" htmlFor="new-queue-instructions">Instructions</label><textarea id="new-queue-instructions" className="form-control" value={serviceForm.instructions} onChange={(event) => setServiceForm((form) => ({ ...form, instructions: event.target.value }))} /></div>
                <div className="col-md-3"><label className="form-label" htmlFor="new-queue-capacity">Daily ticket capacity</label><input id="new-queue-capacity" className="form-control" type="number" min="1" max="10000" value={serviceForm.queueCapacity} onChange={(event) => setServiceForm((form) => ({ ...form, queueCapacity: event.target.value }))} required /></div>
                <div className="col-md-9 d-flex flex-column justify-content-center gap-2">
                  <label className="form-check"><input className="form-check-input" type="checkbox" checked={serviceForm.queueEnabled} onChange={(event) => setServiceForm((form) => ({ ...form, queueEnabled: event.target.checked }))} /><span className="form-check-label">Enable virtual queue</span></label>
                  <label className="form-check"><input className="form-check-input" type="checkbox" checked={serviceForm.publicBookable} onChange={(event) => setServiceForm((form) => ({ ...form, publicBookable: event.target.checked }))} /><span className="form-check-label">Allow incoming freshmen / public guests</span></label>
                </div>
                <div className="col-12"><button className="btn btn-pnc-primary" type="submit" disabled={saving}>{saving ? 'Creating…' : 'Create service'}</button></div>
              </div>
            </form>
          </div>
        </section>
      )}
    </div>
  );
};
