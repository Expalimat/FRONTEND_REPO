# Appointment frontend integration

## Implemented pages

- `/student/appointments`: students browse active services, view available slots, book, cancel, reschedule, check appointment history, and see backend-provided queue metrics.
- `/registrar/appointments`: assigned Registrar staff manage service queues and appointments; Administrators also manage services, slots, closures, and service activation.
- `/admin/appointments`: administrator appointment and queue management using the shared page.
- `/appointment-queue/display`: public queue display without student names, numbers, or document details.
- Student dashboard: shows the next active appointment and a link to appointment management.

## API integration

The shared `appointmentService` uses the existing Axios client and the documented routes under `/api` including `/services`, `/appointment-services`, `/appointment-slots`, `/appointments`, `/appointment-queue/{serviceId}`, `/staff/queue`, service/slot administration routes, and queue lifecycle routes. Responses are unwrapped from the backend success envelope by the existing service helper.

The backend remains authoritative for authentication, authorization, capacity, status transitions, queue positions, and waiting-time estimates. The frontend does not calculate queue positions or waiting times.

## Authentication and configuration

Requests use the existing `pnc_token` bearer token and Axios interceptor. The API base URL is `VITE_API_URL`, defaulting to `http://localhost:8000/api` for local development. No appointment-specific secret or credential is exposed to the browser.

## Loading, errors, and updates

Pages display loading, empty, success, validation, authorization, conflict, and network-error states through the existing UI patterns. Staff queue data polls every 10 seconds and the public display polls every 5 seconds; both also provide manual refresh controls. Consequential operations are disabled while saving and refresh data from the server after success.

## Known limitations

- No QR check-in is shown because the backend contract does not provide a secure QR token or endpoint.
- No WebSocket/SSE infrastructure is documented; polling is used.
- The backend service scope is the authorization boundary for assigned staff. Department/office ownership is not exposed as a separate appointment field.
- The current project is JavaScript, so TypeScript interfaces were not introduced.
