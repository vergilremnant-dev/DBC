# Security Checklist

A checklist for security boundaries in DBC.

- [x] JWT signature verification key configured in backend variables.
- [x] Password hashing using Bcrypt (minimum 10 salt rounds).
- [x] Express route ownership checks implemented on bookings detail API.
- [ ] Row-Level Security (RLS) configured in PostgreSQL database (*Planned*).
- [ ] CSP (Content Security Policy) headers configured in Vercel settings.
