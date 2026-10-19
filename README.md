# PnC-OESS Frontend

This folder is a separate copy of the updated React frontend. It does not include
the Laravel backend or a demo/mock API. Login and application data require the
backend API to be running.

## Run locally

1. Install Node.js if it is not already installed.
2. Open a terminal in this folder.
3. Install the frontend dependencies:

   ```powershell
   npm install
   ```

4. Copy `.env.example` to `.env.local` if the backend API is not at its default
   URL. Set `VITE_API_URL` there to the backend API URL, for example:

   ```dotenv
   VITE_API_URL=http://localhost:8000/api
   ```

5. Start Vite:

   ```powershell
   npm run dev
   ```

6. Open the URL Vite prints, usually `http://localhost:5173`.

The Laravel backend must be started separately. Its local URL is normally
`http://127.0.0.1:8000`.

Long record tables and notification, document, subject-offering, payment, and
grade lists load their data one page at a time from the API. Table searches and
filters are applied on the server for paginated results.

Students can view services and prerequisites, book available times, view their
own references and queue estimates, check in on the appointment date, cancel
eligible bookings, and reschedule by selecting a new time from **Appointments**.
Registrar staff can configure service rules and capacity, close slots or dates,
and manage check-in, queue calls, service start/completion, no-shows, and
reasoned overrides from **Appointments & Queue**. Queue order starts
first-checked-in, first-served; estimates are not guarantees. Open
`/appointment-queue/display` on a public waiting-room screen to show queue
numbers without student details.
