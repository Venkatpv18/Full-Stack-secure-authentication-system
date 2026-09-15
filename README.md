# Full-Stack Secure Authentication & RBAC System

A modern, production-grade Full-Stack Authentication and Role-Based Access Control (RBAC) System built using React.js, Node.js, Express.js, and MongoDB Atlas. Featuring Dual JWT Tokens (Access + Refresh), Password Reset flow, Express Security Hardening, User Profile Management, and an interactive Admin Dashboard.

---

## 🌟 Key Features

### 🔒 Authentication & Security
- **Dual JWT Token Architecture:** Short-lived Access Tokens (15 min) + Refresh Tokens (7 days) with automated silent token rotation.
- **Password Security & Complexity:** Password hashing via `bcryptjs` (10 salt rounds) and strong complexity rules (minimum 8 characters, 1 uppercase, 1 lowercase, 1 number, 1 special character).
- **Password Reset Flow:** Cryptographically secure reset tokens generated via `crypto.randomBytes(32)` hashed with SHA256 and 10-minute expiration (`/api/auth/forgot-password` & `/api/auth/reset-password`).
- **Express Hardening:** `helmet` security headers, dynamic CORS origin matching, and `express-rate-limit` brute-force protection (100 requests / 15 min).

### 🛡️ Role-Based Access Control (RBAC)
- **USER Role:** Manage own profile, edit name & email, change password, and view account details.
- **ADMIN Role:** Access the Admin Dashboard, view real-time system metrics (Total Users, Active, Deactivated, Admins), search registered users, toggle user status (`active`/`deactivated`), and delete accounts.

### 🎨 User Interface & UX
- **Developer Dark Theme:** Clean slate/navy dark design with distinct card surfaces, crisp borders, and zero AI clutter.
- **Show / Hide Password Eye Toggle:** Interactive SVG eye icons inside password inputs.
- **Live Password Strength Meter:** Real-time color-coded progress bar (**Weak** / **Medium** / **Strong**).
- **Floating Toast Notifications:** Slide-in alert system with auto-dismiss and manual close options.
- **Responsive Layout:** Optimized for Desktop, Tablet, and Mobile screens.

---

## 🛠️ Technology Stack

### Frontend
- **Framework:** React 19 + Vite 8
- **Styling:** Tailwind CSS 3
- **HTTP Client:** Axios (with automatic 401 token refresh interceptor)

### Backend
- **Runtime:** Node.js & Express.js 5
- **Database:** MongoDB Atlas + Mongoose 8
- **Security:** `jsonwebtoken`, `bcryptjs`, `helmet`, `express-rate-limit`, `cookie-parser`, `dotenv`

---

## 📁 Project Structure

```text
authentication-project/
├── .gitignore                     # Root Git ignore rules
├── README.md                      # Project documentation
├── client/                        # React + Vite Frontend
│   ├── .env.example               # Client environment template
│   ├── vercel.json                # Vercel SPA routing rewrite rules
│   ├── package.json               # Client dependencies & scripts
│   ├── vite.config.js             # Vite build configuration
│   └── src/
│       ├── main.jsx               # React DOM root
│       ├── App.jsx                # Main container (Auth forms, Profile, Admin Dashboard)
│       ├── index.css              # Tailwind imports
│       └── services/
│           └── api.js             # Axios instance with Bearer token interceptor
└── server/                        # Express Node.js Backend API
    ├── .env.example               # Server environment template
    ├── .gitignore                 # Server Git ignore rules
    ├── package.json               # Server dependencies & scripts
    ├── server.js                  # Express app entry point & CORS/Helmet middleware
    ├── models/
    │   └── User.js                # Mongoose Schema (Name, Email, Password, Role, Status, Tokens)
    ├── middleware/
    │   └── authMiddleware.js      # JWT authentication (`protect`) & RBAC (`authorizeRole`)
    └── routes/
        ├── authRoutes.js          # Authentication routes (register, login, refresh, logout, reset)
        ├── userRoutes.js          # User profile management routes (/api/users/me)
        └── adminRoutes.js         # Admin metrics & user management routes (/api/admin/*)
```

---

## ⚙️ Installation & Setup

### 1. Clone Repository
```bash
git clone https://github.com/Venkatpv18/Full-Stack-secure-authentication-system.git
cd Full-Stack-secure-authentication-system
```

### 2. Backend Setup
```bash
cd server
npm install
```

Create a `.env` file in `server/`:
```env
PORT=5000
MONGO_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/authDB?retryWrites=true&w=majority
JWT_ACCESS_SECRET=your_super_secret_access_key_here
JWT_REFRESH_SECRET=your_super_secret_refresh_key_here
FRONTEND_URL=http://localhost:5173
```

Start the backend server:
```bash
node server.js
```
*(Backend runs on `http://localhost:5000`)*

### 3. Frontend Setup
Open a second terminal window:
```bash
cd client
npm install
```

Create a `.env` file in `client/`:
```env
VITE_API_URL=http://localhost:5000
```

Start the frontend development server:
```bash
npm run dev
```
*(Frontend runs on `http://localhost:5173`)*

---

## 🚀 API Endpoints Documentation

### Authentication Routes (`/api/auth`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Public | Register new user account |
| `POST` | `/api/auth/login` | Public | Authenticate user & receive Access/Refresh tokens |
| `POST` | `/api/auth/refresh` | Public | Issue new Access Token using valid Refresh Token |
| `POST` | `/api/auth/logout` | Public/Private | Revoke refresh token & clear session |
| `POST` | `/api/auth/forgot-password` | Public | Request password reset token |
| `POST` | `/api/auth/reset-password` | Public | Reset password using valid reset token |

### User Routes (`/api/users`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/users/me` | Private | Fetch logged-in user profile |
| `PUT` | `/api/users/me` | Private | Update profile name & email |
| `PUT` | `/api/users/me/password` | Private | Change password with current password verification |

### Admin Routes (`/api/admin`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/admin/stats` | Admin | Get total users, active count, deactivated count, admin count |
| `GET` | `/api/admin/users` | Admin | Fetch list of all registered users |
| `PATCH` | `/api/admin/users/:id/status` | Admin | Toggle user account status (`active` / `deactivated`) |
| `DELETE` | `/api/admin/users/:id` | Admin | Delete a user account |

---

## 🌐 Production Deployment

### Backend (Render)
- **Root Directory:** `server`
- **Build Command:** `npm install`
- **Start Command:** `node server.js`
- **Environment Variables:** `MONGO_URI`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `FRONTEND_URL`

### Frontend (Vercel)
- **Root Directory:** `client`
- **Framework Preset:** `Vite`
- **Build Command:** `npm run build`
- **Output Directory:** `dist`
- **Environment Variables:** `VITE_API_URL`
