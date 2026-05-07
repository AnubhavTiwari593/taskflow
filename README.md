# TaskFlow - Project Management Application

A modern project management and task tracking application built with React, FastAPI, MongoDB, and Tailwind CSS.

## Project Structure

```
taskflow/
├── frontend/                 # React application
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── api/
│   │   │   └── client.js     # API client with axios
│   │   ├── components/
│   │   │   ├── Layout.jsx    # Main layout component
│   │   │   └── ProtectedRoute.jsx
│   │   ├── contexts/
│   │   │   └── AuthContext.jsx
│   │   ├── pages/
│   │   │   ├── Login.jsx
│   │   │   ├── Register.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Projects.jsx
│   │   │   ├── ProjectDetail.jsx
│   │   │   └── TeamMembers.jsx
│   │   ├── App.js
│   │   ├── App.css
│   │   ├── index.js
│   │   └── index.css
│   ├── package.json
│   ├── tailwind.config.js
│   ├── craco.config.js
│   ├── jsconfig.json
│   ├── .env
│   └── postcss.config.js
│
└── backend/                  # FastAPI backend
    ├── server.py            # Main API server
    ├── requirements.txt     # Python dependencies
    ├── .env                 # Environment variables
    └── README.md
```

## Features

### Frontend
- **Authentication**: Login and registration with JWT tokens
- **Dashboard**: Overview of tasks, projects, and team statistics
- **Projects**: Create, manage, and delete projects with team members
- **Tasks**: Create tasks with status (Todo, In Progress, Done), priority levels, due dates, and labels
- **Comments**: Add comments to tasks for team collaboration
- **Team Management**: Admins can manage team members and roles
- **Responsive Design**: Built with Tailwind CSS for a modern, responsive UI

### Backend
- **Authentication**: JWT-based authentication with bcrypt password hashing
- **User Management**: Create users, manage roles (admin/member)
- **Projects**: Full CRUD operations for projects
- **Tasks**: Task management with status, priority, assignees, and labels
- **Comments**: Comments on tasks for collaboration
- **Dashboard API**: Aggregated statistics and recent activity

## Setup & Installation

### Prerequisites
- Node.js 16+ and npm/yarn
- Python 3.8+
- MongoDB (local or cloud)

### Backend Setup

1. **Install Python dependencies**
```bash
cd backend
pip install -r requirements.txt
```

2. **Configure environment variables**
Create a `.env` file in the `backend` directory:
```env
MONGO_URL=mongodb://localhost:27017
DB_NAME=taskflow
JWT_SECRET=your-secret-key-change-me
CORS_ORIGINS=http://localhost:3000,http://localhost:3001
```

3. **Start the backend server**
```bash
uvicorn server:app --reload
```
The API will be available at `http://localhost:8000`

### Frontend Setup

1. **Install dependencies**
```bash
cd frontend
npm install
# or
yarn install
```

2. **Configure environment variables**
Create a `.env` file in the `frontend` directory:
```env
REACT_APP_BACKEND_URL=http://localhost:8000
```

3. **Start the development server**
```bash
npm start
# or
yarn start
```
The app will be available at `http://localhost:3000`

## Running the Application

### Development

**Terminal 1 - Backend:**
```bash
cd backend
uvicorn server:app --reload
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm start
```

### Production Build

**Frontend:**
```bash
cd frontend
npm run build
```

## API Documentation

### Authentication Endpoints
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user
- `GET /api/auth/me` - Get current user

### User Endpoints
- `GET /api/users` - Get all users
- `PATCH /api/users/{user_id}/role` - Update user role (admin only)
- `DELETE /api/users/{user_id}` - Delete user (admin only)

### Project Endpoints
- `GET /api/projects` - Get user's projects
- `POST /api/projects` - Create new project
- `GET /api/projects/{project_id}` - Get project details
- `PUT /api/projects/{project_id}` - Update project
- `DELETE /api/projects/{project_id}` - Delete project

### Task Endpoints
- `GET /api/projects/{project_id}/tasks` - Get project tasks
- `POST /api/projects/{project_id}/tasks` - Create task
- `PUT /api/tasks/{task_id}` - Update task
- `DELETE /api/tasks/{task_id}` - Delete task

### Comment Endpoints
- `GET /api/tasks/{task_id}/comments` - Get task comments
- `POST /api/tasks/{task_id}/comments` - Add comment
- `DELETE /api/comments/{comment_id}` - Delete comment

### Dashboard Endpoint
- `GET /api/dashboard` - Get dashboard data (stats, recent tasks, overdue tasks)

## Technology Stack

### Frontend
- **React 19** - UI library
- **React Router 7** - Routing
- **Axios** - HTTP client
- **Tailwind CSS** - Styling
- **Lucide React** - Icons
- **date-fns** - Date utilities

### Backend
- **FastAPI** - Web framework
- **Motor** - Async MongoDB driver
- **PyJWT** - JWT authentication
- **Bcrypt** - Password hashing
- **Pydantic** - Data validation

### Database
- **MongoDB** - NoSQL database

## Default Credentials

After the first registration:
- First user registered becomes an **admin**
- Subsequent registrations are **members**

For testing, you can create an admin account with:
- Email: `admin@taskflow.com`
- Password: `Admin@12345`

## User Roles

- **Admin**: Can manage all projects, tasks, users, and view team members
- **Member**: Can access projects they own or are assigned to

## Troubleshooting

### MongoDB Connection Issues
- Ensure MongoDB is running: `mongod`
- Check `MONGO_URL` in `.env` is correct

### Frontend Won't Connect to Backend
- Verify `REACT_APP_BACKEND_URL` in frontend `.env`
- Ensure backend server is running on specified port
- Check CORS settings in backend `.env`

### Port Already in Use
- Backend: Change port in startup command `uvicorn server:app --port 8001`
- Frontend: Set port in environment or use `PORT=3001 npm start`

## License

MIT
