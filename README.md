# ELMS - Employee Leave Management System

A comprehensive role-based Leave Management System with AI assistance, built with **Bun + Hono + SQLite + React + Gemini AI**.

## 🚀 Tech Stack

| Layer | Technology |
|-------|------------|
| Runtime | Bun |
| Backend | Hono |
| Database | SQLite |
| Frontend | React + Vite |
| AI | Google Gemini API |

## 📋 Features

### User Roles
- **Employee**: Apply leave, view history, chatbot assistant
- **Team Lead**: Approve team leaves, AI recommendations, apply own leave
- **Admin**: Manage employees, final approvals, system overview

### AI Features
- 🤖 **Smart Leave Assistant**: Chatbot for leave queries
- ✨ **AI Auto-fill**: Natural language to form data
- 📊 **AI Recommendations**: Approval suggestions with risk levels
- ⚠️ **Conflict Detection**: Overlapping leave warnings

## 🛠️ Setup

### Prerequisites
- [Bun](https://bun.sh) (already installed)
- [Gemini API Key](https://makersuite.google.com/app/apikey)

### 1. Backend Setup

```bash
cd backend

# Install dependencies
bun install

# Create environment file
copy .env.example .env
# Edit .env and add your GEMINI_API_KEY

# Initialize database (creates tables + seed data)
bun run db:init

# Start server
bun run dev
```

### 2. Frontend Setup

```bash
cd frontend

# Install dependencies
bun install

# Start dev server
bun run dev
```

### 3. Access the App

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:5000

## 🔐 Default Login Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@elms.com | admin123 |
| Team Lead | teamlead@elms.com | teamlead123 |
| Employee | employee@elms.com | employee123 |

## 📁 Project Structure

```
ELMS/
├── backend/
│   ├── src/
│   │   ├── config/         # Database, JWT config
│   │   ├── controllers/    # Route handlers
│   │   ├── middleware/     # Auth, RBAC
│   │   ├── services/       # Gemini AI service
│   │   └── routes/         # API routes
│   ├── index.ts            # Server entry
│   └── elms.db             # SQLite database
├── frontend/
│   ├── src/
│   │   ├── components/     # Reusable UI
│   │   ├── pages/          # Role-based pages
│   │   ├── context/        # Auth context
│   │   └── services/       # API calls
│   └── index.html
└── README.md
```

## 📡 API Endpoints

### Auth
- `POST /api/auth/login` - Login
- `POST /api/auth/change-password` - Change password

### Users
- `GET /api/users/profile` - Get own profile
- `PUT /api/users/profile` - Update profile
- `GET /api/users` - List all (Admin)
- `POST /api/users` - Create user (Admin)

### Leaves
- `POST /api/leaves` - Apply leave
- `GET /api/leaves/my` - Own leave history
- `GET /api/leaves/team` - Team leaves (TL)
- `GET /api/leaves/all` - All leaves (Admin)
- `PUT /api/leaves/:id/approve` - Approve
- `PUT /api/leaves/:id/reject` - Reject

### AI
- `POST /api/ai/chat` - Chatbot
- `POST /api/ai/autofill` - Parse leave text
- `GET /api/ai/recommend/:id` - Get recommendation
- `POST /api/ai/conflicts` - Detect conflicts

## 🔄 Leave Approval Flow

```
Employee Leave → Team Lead Approves → Admin Approves → Done
Team Lead Leave → Admin Approves → Done
```

## ⚠️ Environment Variables

### Backend (.env)
```env
PORT=5000
JWT_SECRET=your-secret-key
GEMINI_API_KEY=your-gemini-api-key
```

## 📄 License

MIT
