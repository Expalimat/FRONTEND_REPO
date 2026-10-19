# Appointment integration discrepancy report

Audit date: 2026-10-19

## Scope and evidence

Compared the implemented frontend API calls in `src/services/appointmentService.js`, appointment pages, routing, and Axios client against `backend/routes/api.php`, `AppointmentController`, `AppointmentServiceController`, migrations, feature tests, and `backend/docs/appointments-api.md`.

## Verified contract matches

- Appointment service, slot, booking, appointment detail/list, cancellation, rescheduling, queue, lifecycle, closure, and public display URLs all exist in the backend.
- Frontend methods use the backend's documented HTTP methods and camelCase request fields, including compatibility aliases such as `slotId` and `serviceId`.
- The existing Axios client attaches the authenticated bearer token and redirects on non-login `401` responses. The API base URL uses `VITE_API_URL` with the documented local fallback.
- Success-envelope unwrapping matches the appointment response middleware. Validation and conflict messages are surfaced through the existing error interceptor.
- Status values used by the frontend match the backend appointment and queue status values.
- Backend authorization remains authoritative: students are scoped to their own appointments and operational staff to assigned services.
- Queue positions and waiting estimates are returned by the backend; the frontend does not derive authoritative queue values.

## Discrepancies and fixes

### 1. Conflict and failed mutation refreshes

**Finding:** Student cancellation, rescheduling, and booking conflict handlers displayed an error but did not consistently reload the authoritative appointment/slot state. Staff queue action failures likewise left the screen stale after a `409` conflict.

**Root cause:** UI error handlers stopped after setting an error message, even though the backend remained authoritative and another user or staff member could have changed the record.

**Fix:** Refresh appointments and available slots after failed booking/cancel/reschedule operations, and refresh the selected staff queue after failed staff actions. The error remains visible while the refreshed server state replaces stale UI state.

## Remaining limitations

- No frontend unit-test runner is configured; backend feature tests and the production build are the available automated checks.
- Browser end-to-end actions requiring known student/staff credentials cannot be fully automated in this environment. The shared browser page was inspected for the rendered student appointment workflow.
- The API exposes both modern staff queue routes and compatibility appointment-queue routes; the existing staff page intentionally uses the compatibility queue endpoint because it returns the combined queue payload required by that page.
