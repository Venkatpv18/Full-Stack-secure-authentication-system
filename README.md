# Full Stack Secure Authentication System

A modern Full Stack Authentication System built using React.js, Node.js, Express.js, and MongoDB Atlas. This project provides secure user registration and 
login functionality using JWT authentication and password hashing.

--------------------------------------------------

## Features

- User Registration
- User Login Authentication
- Secure Password Hashing using bcryptjs
- JWT Token Authentication
- MongoDB Atlas Database Integration
- Responsive User Interface
- Frontend & Backend API Communication
- Logout Functionality
- Token Storage using localStorage

--------------------------------------------------

## Technologies Used

### Frontend
- React.js
- Tailwind CSS
- Axios
- Vite

### Backend
- Node.js
- Express.js

### Database
- MongoDB Atlas
- Mongoose

### Authentication & Security
- JWT (JSON Web Token)
- bcryptjs
- dotenv
- cors

--------------------------------------------------

## Project Structure

authentication-project

│

├── client

│   ├── src

│   │   ├── App.jsx

│   │   ├── main.jsx

│   │   └── index.css

│   │

│   ├── public

│   ├── package.json

│   ├── vite.config.js

│   └── ...

│

├── server

│   ├── models

│   │   └── User.js

│   │

│   ├── routes

│   │   └── authRoutes.js

│   │

│   ├── .env

│   ├── server.js

│   ├── package.json

    ├── README.md

    └── .gitignore

--------------------------------------------------

## Installation & Setup

### Clone Repository

git clone https://github.com/YOUR_USERNAME/Full-Stack-secure-authentication-system.git

--------------------------------------------------

## Frontend Setup

Open terminal inside the client folder:

cd client

npm install

npm run dev

Frontend runs on:

http://localhost:5173

--------------------------------------------------

## Backend Setup

Open terminal inside the server folder:

cd server

npm install

npm run dev

Backend runs on:

http://localhost:5000

--------------------------------------------------

## Environment Variables

Create a `.env` file inside the server folder and add:

MONGO_URI=your_mongodb_connection_string

JWT_SECRET=mysecretkey

--------------------------------------------------

## API Endpoints

### Register User

POST /api/auth/register

Request Body:

{
  "name": "Venkat",
  "email": "venkat@gmail.com",
  "password": "123456"
}

--------------------------------------------------

### Login User

POST /api/auth/login

Request Body:

{
  "email": "venkat@gmail.com",
  "password": "123456"
}

--------------------------------------------------

## Working Process

### Step 1
User enters registration details in the frontend form.

### Step 2
Frontend sends data to backend using Axios API requests.

### Step 3
Backend receives request using Express.js routes.

### Step 4
Password is encrypted using bcryptjs.

### Step 5
User data is securely stored in MongoDB Atlas.

### Step 6
User logs in using registered email and password.

### Step 7
Backend validates user credentials.

### Step 8
JWT token is generated after successful login.

### Step 9
Token is stored in browser localStorage.

### Step 10
User can logout successfully and token gets removed.

--------------------------------------------------

## Future Improvements

- Protected Routes
- Forgot Password Feature
- Email Verification
- User Dashboard
- Role-Based Authentication
- Profile Management

--------------------------------------------------

## Learning Outcomes

Through this project, I learned:

- Full Stack Development
- React State Management
- REST API Integration
- MongoDB Database Connection
- JWT Authentication
- Password Encryption
- Frontend & Backend Communication
- Git & GitHub Project Management
