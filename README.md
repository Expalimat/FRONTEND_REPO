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

Students can join an enabled virtual queue, track their ticket and estimated
wait, and cancel while waiting from **Virtual Queue**. Incoming freshmen can
join only queues that an administrator explicitly enables for public guest
access. Guest ticket retrieval requires the private access code shown once at
ticket creation; the ticket number alone is insufficient. Registrar and
department staff can call, start, recall, complete, cancel, or mark queue
tickets as no-shows. Administrators can configure queue services, capacity,
and public guest access, and pause or resume intake. Queue order is first-in,
first-called; estimates are not guarantees. Open `/queue/display` on a public
waiting-room screen to show the current queue without student details.
