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

Administrative and student list views request records a page at a time from
the API. Search and status/role filters are sent to the backend with each page
request; endpoints also retain their full-list response when called without
pagination parameters.
