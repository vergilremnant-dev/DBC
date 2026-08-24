# DesignBuildConnect (DBC) Tech Stack

This document outlines the software architecture, programming languages, libraries, databases, and third-party integrations powering the DesignBuildConnect (DBC) application.

---

## 1. Frontend Architecture

| Category | Technology | Version | Description |
| :--- | :--- | :--- | :--- |
| **UI Library** | [React](https://react.dev/) | `^19.2.6` | Component-driven user interface construction. |
| **State Management** | [Redux Toolkit](https://redux-toolkit.js.org/) | `^2.12.0` | Global client store, async actions, and state selectors. |
| **Routing** | [React Router DOM](https://reactrouter.com/) | `^7.16.0` | Client-side view transitions and route guards. |
| **Styling** | [Tailwind CSS](https://tailwindcss.com/) | `^4.3.0` | Utility-first layout designing with `@tailwindcss/vite`. |
| **API Client** | [Axios](https://axios-http.com/) | `^1.17.0` | Promised-based HTTP request orchestration. |

---

## 2. Backend & Server Architecture

| Category | Technology | Version | Description |
| :--- | :--- | :--- | :--- |
| **Runtime Environment** | [Node.js](https://nodejs.org/) | `>=20` | Server-side JavaScript execution engine. |
| **API Framework** | [Express](https://expressjs.com/) | `^5.2.1` | REST endpoint routing and request pipeline control. |
| **Serverless Engine** | [Vercel Node](https://vercel.com/docs/concepts/functions/serverless-functions) | `^5.9.3` | Deploying APIs as serverless runtime functions. |
| **Authentication** | [JSON Web Tokens (JWT)](https://jwt.io/) | `^9.0.2` | Secure session integrity and identity signing. |
| **Security** | [BcryptJS](https://www.npmjs.com/package/bcryptjs) | `^2.4.3` | Cryptographic password hashing. |

---

## 3. Database Layer

| Category | Technology | Version | Description |
| :--- | :--- | :--- | :--- |
| **Database** | [PostgreSQL](https://www.postgresql.org/) | `v15+` | Relational database schema engine. |
| **ORM / Client** | [Prisma](https://www.prisma.io/) | `^6.0.0` | Object-Relational Mapping (ORM) and type-safe DB client generation. |

---

## 4. Third-Party Integrations

| Integration | Technology | Version | Description |
| :--- | :--- | :--- | :--- |
| **Payments** | [Razorpay SDK](https://razorpay.com/) | `^2.9.8` | Premium subscription passes and milestone payment gateways. |

---

## 5. Build, Linting, & Testing Tools

| Category | Technology | Version | Description |
| :--- | :--- | :--- | :--- |
| **Build Compiler** | [Vite](https://vite.dev/) | `^8.0.12` | Frontend module bundling. |
| **Language** | [TypeScript](https://www.typescriptlang.org/) | `~5.6.2` | Strong static typing. |
| **Test Runner** | [Vitest](https://vitest.dev/) | `^4.1.10` | Running frontend/backend unit and integration assertions. |
| **Linter** | [ESLint](https://eslint.org/) | `^10.3.0` | Syntax quality checkers. |
