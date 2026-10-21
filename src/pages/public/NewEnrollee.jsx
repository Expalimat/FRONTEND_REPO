import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { publicAppointmentService } from '../../services/publicAppointmentService';

const initialApplicant = { applicant_name: '', applicant_email: '', applicant_phone: '', applicant_number: '' };

export const NewEnrollee = () => {
  const [step, setStep] = useState(0);
  const [applicant, setApplicant] = useState(initialApplicant);
  const [services, setServices] = useState([]);
  const [serviceId, setServiceId] = useState('');
  const [date, setDate] = useState('');
  const [slots, setSlots] = useState([]);
  const [slot, setSlot] = useState(null);
  const [confirmation, setConfirmation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    setLoading(true);
    publicAppointmentService.getServices().then((result) => {
      if (active) setServices(result?.data ?? result ?? []);
    }).catch((err) => active && setError(err.message)).finally(() => active && setLoading(false));
    return () => { active = false; };
  }, []);

  const selectedService = useMemo(() => services.find((item) => String(item.id) === String(serviceId)), [services, serviceId]);
  const updateApplicant = (event) => setApplicant({ ...applicant, [event.target.name]: event.target.value });
  const continueFromApplicant = (event) => {
    event.preventDefault(); setError('');
    if (!applicant.applicant_name.trim() || !/^\S+@\S+\.\S+$/.test(applicant.applicant_email) || applicant.applicant_phone.trim().length < 7) {
      setError('Enter your full name, a valid email address, and a valid mobile number.'); return;
    }
    setStep(1);
  };
  const loadSlots = async () => {
    if (!serviceId || !date) return;
    setLoading(true); setError(''); setSlot(null);
    try { const result = await publicAppointmentService.getAvailability(serviceId, date); setSlots(result?.data ?? result ?? []); }
    catch (err) { setError(err.message); } finally { setLoading(false); }
  };
  const submit = async () => {
    if (!slot) return;
    setLoading(true); setError('');
    try {
      const result = await publicAppointmentService.createAppointment({ ...applicant, applicant_number: applicant.applicant_number || null, slot_id: slot.id ?? slot.slot_id });
      setConfirmation(result?.data ?? result); setStep(3);
    } catch (err) { setError(err.message); } finally { setLoading(false); }
  };

  if (step === 3 && confirmation) return <Confirmation confirmation={confirmation} />;
  return <div className="public-booking-page py-4 py-md-5"><div className="container" style={{ maxWidth: 850 }}>
    <Link to="/login" className="text-decoration-none text-muted"><i className="bi bi-arrow-left me-2" />Return to main login</Link>
    <div className="card border-0 shadow-sm mt-3"><div className="card-body p-4 p-md-5">
      <span className="login-kicker">Pamantasan ng Cabuyao</span><h1 className="h3 fw-bold mt-2">Incoming Freshman Enrollment Appointment</h1>
      <p className="text-muted">Schedule an enrollment appointment before you have a student account. Booking an appointment does not mean that you have been admitted or enrolled.</p>
      <div className="d-flex flex-wrap gap-2 small mb-4">{['Your details', 'Choose a schedule', 'Review'].map((label, index) => <span key={label} className={`badge ${step === index ? 'bg-success' : 'bg-light text-muted'}`}>{index + 1}. {label}</span>)}</div>
      {error && <div className="alert alert-danger" role="alert">{error}</div>}
      {step === 0 && <ApplicantInformation applicant={applicant} onChange={updateApplicant} onSubmit={continueFromApplicant} loading={loading} />}
      {step === 1 && <ScheduleSelection services={services} serviceId={serviceId} setServiceId={setServiceId} date={date} setDate={setDate} slots={slots} slot={slot} setSlot={setSlot} loadSlots={loadSlots} loading={loading} onBack={() => setStep(0)} onContinue={() => slot ? setStep(2) : setError('Choose an available time slot.')} />}
      {step === 2 && <Review applicant={applicant} service={selectedService} date={date} slot={slot} loading={loading} onBack={() => setStep(1)} onSubmit={submit} />}
    </div></div></div></div>;
};

const ApplicantInformation = ({ applicant, onChange, onSubmit, loading }) => <form onSubmit={onSubmit}><h2 className="h5">Applicant information</h2><p className="text-muted small">Use contact details you can access for appointment updates.</p>{[['applicant_name', 'Full legal name', true], ['applicant_email', 'Email address', true], ['applicant_phone', 'Mobile number', true], ['applicant_number', 'Applicant number (optional)', false]].map(([name, label, required]) => <div className="mb-3" key={name}><label className="form-label fw-semibold" htmlFor={name}>{label}{required && ' *'}</label><input id={name} name={name} type={name === 'applicant_email' ? 'email' : 'text'} className="form-control" value={applicant[name]} onChange={onChange} required={required} disabled={loading} /></div>)}<button className="btn login-submit px-4" disabled={loading}>Continue <i className="bi bi-arrow-right ms-2" /></button></form>;

const ScheduleSelection = ({ services, serviceId, setServiceId, date, setDate, slots, slot, setSlot, loadSlots, loading, onBack, onContinue }) => <div><h2 className="h5">Choose your schedule</h2><label className="form-label fw-semibold" htmlFor="public-service">Appointment service</label><select id="public-service" className="form-select mb-3" value={serviceId} onChange={(e) => { setServiceId(e.target.value); setSlot(null); }} disabled={loading}><option value="">Select a service</option>{services.map((service) => <option key={service.id} value={service.id}>{service.name}</option>)}</select>{serviceId && <><label className="form-label fw-semibold" htmlFor="public-date">Available date</label><div className="input-group mb-3"><input id="public-date" type="date" className="form-control" value={date} min={new Date().toISOString().slice(0, 10)} onChange={(e) => setDate(e.target.value)} disabled={loading} /><button className="btn btn-outline-success" type="button" onClick={loadSlots} disabled={!date || loading}>Check availability</button></div></>}{date && <div className="mb-3"><div className="form-label fw-semibold">Available time slots</div>{loading ? <div className="text-muted">Loading availability…</div> : slots.length ? <div className="d-grid gap-2">{slots.map((item) => <button type="button" key={item.slot_id ?? item.id} className={`btn text-start appointment-slot-option ${slot === item ? 'selected' : ''}`} disabled={item.available === false || item.available_capacity === 0} onClick={() => setSlot(item)}><strong>{item.start_time ?? item.startTime} – {item.end_time ?? item.endTime}</strong><span className="small text-muted d-block">{item.available_capacity ?? item.availableCapacity ?? item.available} slot(s) remaining</span></button>)}</div> : <div className="alert alert-light border">No available slots for this date.</div>}</div>}<div className="d-flex justify-content-between mt-4"><button className="btn btn-outline-secondary" onClick={onBack}>Back</button><button className="btn login-submit" onClick={onContinue} disabled={!slot}>Review appointment</button></div></div>;

const Review = ({ applicant, service, date, slot, loading, onBack, onSubmit }) => <div><h2 className="h5">Review appointment details</h2><dl className="row bg-light rounded p-3"><dt className="col-sm-4">Applicant</dt><dd className="col-sm-8">{applicant.applicant_name}<br /><span className="text-muted">{applicant.applicant_email} · {applicant.applicant_phone}</span></dd><dt className="col-sm-4">Service</dt><dd className="col-sm-8">{service?.name}</dd><dt className="col-sm-4">Date and time</dt><dd className="col-sm-8">{date}<br />{slot?.start_time ?? slot?.startTime} – {slot?.end_time ?? slot?.endTime}</dd></dl><div className="alert alert-warning small">Please verify your details before submitting. Availability is checked again by the server when you submit.</div><div className="d-flex justify-content-between"><button className="btn btn-outline-secondary" onClick={onBack}>Edit</button><button className="btn login-submit" onClick={onSubmit} disabled={loading}>{loading ? 'Submitting…' : 'Submit appointment'}</button></div></div>;

const Confirmation = ({ confirmation }) => <div className="public-booking-page py-5"><div className="container" style={{ maxWidth: 700 }}><div className="card border-0 shadow-sm"><div className="card-body p-4 p-md-5 text-center"><i className="bi bi-check-circle-fill text-success display-4" /><h1 className="h3 mt-3">Appointment request received</h1><p className="text-muted">Keep this booking reference for your records.</p><div className="alert alert-success"><strong className="fs-4">{confirmation.booking_reference ?? confirmation.bookingReference ?? confirmation.reference}</strong><div className="mt-2">{confirmation.service ?? confirmation.appointment?.serviceNameSnapshot}<br />{confirmation.appointment_date ?? confirmation.appointmentDate ?? confirmation.appointment?.appointmentDate} · {confirmation.start_time ?? confirmation.startTime ?? confirmation.appointment?.startTimeSnapshot} – {confirmation.end_time ?? confirmation.endTime ?? confirmation.appointment?.endTimeSnapshot}</div></div><p className="small text-muted">Status: {confirmation.status ?? confirmation.appointment?.status}. Booking an appointment does not automatically mean that you have been admitted or enrolled.</p><button className="btn btn-outline-success" onClick={() => window.print()}><i className="bi bi-printer me-2" />Print confirmation</button><div className="mt-3"><Link to="/login">Return to login</Link></div></div></div></div></div>;
