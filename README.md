# PF Office Queue Management System (PF-QMS)

An Employees' Provident Fund Organisation (EPFO) digital Queue Management System built with React (Vite), Node.js, Express, TypeScript, and Prisma ORM.

## Project Structure

```
PF-office-QMS/
├── backend/          # Node.js + Express + Prisma API server
│   ├── prisma/       # Database schema & migrations
│   ├── src/          # API routes, controllers, and services
│   └── seed.ts       # Initial seed data script
└── frontend/         # React + Vite frontend application
    ├── public/       # Static assets & logos
    └── src/          # React views, components, and utilities
```

## Getting Started

### 1. Environment Setup

Copy `.env.example` to `.env` in the `backend` folder:
```bash
cp backend/.env.example backend/.env
```

Update your database configuration inside `backend/.env` if needed:
```env
DATABASE_URL="mysql://root:@localhost:3306/pf_qms"
PORT=5000
JWT_SECRET="your-secret-key"
```

### 2. Install Dependencies

**Backend:**
```bash
cd backend
npm install
```

**Frontend:**
```bash
cd frontend
npm install
```

### 3. Database Migration & Seeding

Run Prisma migrations and seed default credentials:
```bash
cd backend
npx prisma db push
npx tsx seed.ts
```

### 4. Running Locally

**Backend Server:**
```bash
cd backend
npx nodemon
```

**Frontend App:**
```bash
cd frontend
npm run dev
```

## Default Credentials

- **Super Admin**: `superadmin` / `admin123`
- **City Admin**: `admin` / `admin123`
- **Reception**: `reception` / `reception123`
- **Counter**: `counter1` / `counter123`
