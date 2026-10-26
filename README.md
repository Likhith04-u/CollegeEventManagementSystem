# College Event Management System

A full-stack college event portal built with React, Vite, Node.js, Express and MongoDB.

## Features
- Student sign-up and login with hashed passwords and JWT authentication
- Browse, search and filter workshops, seminars, FDPs and technical events
- Event detail cards with seat availability
- Online event registration and registration history
- Admin dashboard to create, edit and delete events
- Admin participant list and registration status management
- Responsive interface

## Requirements
- Node.js 20+ recommended
- MongoDB Community Server running locally
- VS Code (optional)

## Setup on Windows PowerShell
Open a terminal in this folder:

```powershell
npm install
cd backend
npm install
Copy-Item .env.example .env
```

Edit `backend/.env` if needed. The default MongoDB URI uses local MongoDB.

Open a second terminal at the project root and run the frontend:

```powershell
npm run dev
```

In another terminal, run the backend:

```powershell
cd backend
npm run dev
```

Frontend: http://localhost:5173
Backend health check: http://localhost:5000/

## Create an administrator account
After setting up `backend/.env`, from the backend folder run:

```powershell
npm run seed:admin
```

Default admin email is `admin@college.com`. Set `ADMIN_PASSWORD` in `backend/.env` to a strong password before running the seed command. The example value is only a placeholder and should be changed.

## Notes
- This project intentionally does not include `node_modules`; run `npm install` in the root and backend folders.
- Never commit `.env` or share production secrets.
- This is an academic starter project. Review and harden security before public deployment.
