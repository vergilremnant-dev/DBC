# Authentication Flow

DBC utilizes a JWT (JSON Web Token) authentication architecture.

## How Auth Works
1.  **Login:** Customer submits credentials to `/api/auth/login`.
2.  **Tokens Issued:** On verification, Express issues a short-lived Access Token (passed in JSON response) and a long-lived Refresh Token.
3.  **Token Refresh:** The frontend Axios client catches expired token responses and calls `/api/auth/refresh` to retrieve a new access token.
4.  **Supabase Auth Integration:** *Planned — not currently implemented.* Currently, auth is handled by the Express/database layer.
