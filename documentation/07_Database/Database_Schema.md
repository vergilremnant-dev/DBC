# Database Schema Overview

DBC uses a PostgreSQL schema defined in `prisma/schema.prisma`.

## Core Entities Schema Reference

### 1. User
*   `id` (String, Primary Key, UUID)
*   `email` (String, Unique)
*   `password` (String, Hashed)
*   `role` (Enum: `CUSTOMER`, `PROVIDER`, `ADMIN`)
*   `status` (Enum: `ACTIVE`, `INACTIVE`, `SUSPENDED`)

### 2. Booking (Project Request)
*   `id` (String, Primary Key, UUID)
*   `customerId` (String, Foreign Key mapping to `CustomerProfile`)
*   `providerId` (String, Foreign Key mapping to `ProviderProfile`)
*   `bookingStatus` (Enum: `REQUESTED`, `ACCEPTED`, `REJECTED`, `IN_PROGRESS`, `COMPLETED`)
*   `estimatedBudget` (Float, nullable)

### 3. Requirement (Lead)
*   `id` (Int, Primary Key, Autoincrement)
*   `customerId` (String, Foreign Key mapping to `CustomerProfile`)
*   `title` (String)
*   `status` (Enum: `DRAFT`, `SUBMITTED`, `PUBLISHED`, `QUOTATION_ACCEPTED`, etc.)
