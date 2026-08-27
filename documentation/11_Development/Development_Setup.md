# Development Setup Guide

Follow these steps to run the DBC workspace locally.

## Prerequisites
*   Node.js (version 20 or newer).
*   PostgreSQL running locally or a connection string to a development database.

## Installation & Launch

1.  **Clone and install dependencies:**
    ```bash
    npm install
    ```

2.  **Prisma Setup:**
    Configure the connection string in your `.env` file, then run:
    ```bash
    npx prisma generate
    npx prisma db push
    npm run seed
    ```

3.  **Start Frontend Dev Server:**
    ```bash
    npm run dev
    ```

4.  **Start Backend API Dev Server:**
    In a separate terminal, launch the Express routing adaptor:
    ```bash
    npm run api-dev
    ```
