# Appointment frontend testing

## Commands

From `frontend/`:

```bash
npm run build
```

The current frontend project has no configured unit-test runner. Backend appointment integration tests are maintained in `backend/tests/Feature/AppointmentSchedulingTest.php`.

## Validation coverage

The backend feature suite covers service and slot access, booking and capacity conflicts, student record scoping, staff service assignment, check-in, queue actions, status transitions, and queue estimates. Frontend production compilation validates route imports, JSX syntax, and the appointment integration bundle.

## Manual smoke-test checklist

1. Log in as a Student and open `/student/appointments`.
2. Confirm active services and available slots load from the API.
3. Book a slot and verify the returned appointment reference and persisted status.
4. Cancel or reschedule an eligible appointment and confirm the list refreshes.
5. Check in an appointment as assigned Registrar staff and verify the queue refresh.
6. Call, start, complete, or mark no-show through the queue controls and verify conflicts refresh the data.
7. Open `/appointment-queue/display` and confirm it contains no student names, student numbers, or document details.
8. Test mobile-width layout and keyboard access for form labels, radios, buttons, and status messages.

## Actual validation result

`npm run build` completed successfully during implementation. Backend appointment tests completed successfully with 22 tests and 206 assertions. No frontend unit-test command is currently configured.
