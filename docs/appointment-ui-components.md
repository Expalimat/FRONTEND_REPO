# Appointment UI components

## Shared integration

- `src/services/appointmentService.js` centralizes appointment, slot, service, queue, and lifecycle requests.
- `src/services/api.js` supplies the configured base URL, bearer authentication, response normalization, and generic error handling.
- Existing `AppLayout`, `Sidebar`, `PageHeader`, `LoadingState`, `EmptyState`, and `StatusBadge` components are reused.

## Student UI

- `AppointmentsPage` provides service and slot selection, requirement/instruction review, confirmation, appointment history, cancellation, rescheduling, and server-provided queue information.
- `StudentDashboard` displays the next active appointment and an appointment quick action.

## Staff and public UI

- `AppointmentManagementPage` supports service/slot administration for administrators and scoped appointment queue operations for authorized staff.
- `AppointmentQueueDisplayPage` is a privacy-safe public display showing service name, current queue ticket, and aggregate waiting information only.

All state-changing controls are disabled during requests, and success or conflict responses trigger a server refresh. Status text accompanies badge colors for accessibility.
