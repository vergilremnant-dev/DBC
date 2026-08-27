# Frontend Architecture

DBC is built as a single-page web app (SPA) using React 19.

## Key Frontend Libraries
*   **React 19:** Utilizes standard functional components and hooks.
*   **Redux Toolkit & React-Redux:** Manages global auth state thunks, tokens, and local cache.
*   **React Router v7:** Client routing, parameterized endpoints, and navigation interceptors.
*   **Tailwind CSS v4:** Configuration loaded as dynamic CSS layers in `index.css`.
*   **Axios:** Configuration layer handles bearer token injections and catches auth refresh cycles.
