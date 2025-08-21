# Brochure Warehouse — Starter Project

This project is a starter full-stack web application to manage brochures in a storage room with cabinets.
It supports suppliers, recipients, user management, brochures (with photo), inventory tracking and transactions (in/out).

Structure
- backend/ — Express API (SQLite)
- frontend/ — React minimal UI

Quick start (requires Node.js 16+)

1. Backend
   cd backend
   npm install
   npm run init-db    # creates SQLite DB and tables
   npm run dev        # starts server on http://localhost:4000

2. Frontend
   cd frontend
   npm install
   npm start          # starts React app on http://localhost:3000

API
- POST /api/auth/register
- POST /api/auth/login
- CRUD /api/suppliers
- CRUD /api/recipients
- CRUD /api/cabinets
- CRUD /api/brochures (multipart: image uploads)
- POST /api/transactions (type: "in" | "out")

Images uploaded are served from /uploads.

Notes
- This is a starter scaffold — add validation, roles, tests, pagination, more UI pages, advanced queries as needed.
- Passwords hashed with bcrypt, auth implemented with JWT (secret in .env).
