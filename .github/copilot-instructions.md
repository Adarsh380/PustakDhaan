<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

# PustakDhaan - Book Donation Drive Application

## Project Overview
PustakDhaan is a full-stack web application for managing book donations. It connects book donors with recipients, facilitating the sharing of books within communities.

## Tech Stack
- **Frontend**: React 18, Vite, Tailwind CSS, React Router
- **Backend**: Node.js, Express.js, MongoDB, JWT Authentication
- **Database**: MongoDB with Mongoose ODM

## Project Structure
```
pustakdhaan/
├── client/          # React frontend
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   └── ...
├── server/          # Express backend
│   ├── models/
│   ├── routes/
│   └── ...
└── .github/
```

## Key Features
1. **User Authentication**: Register/Login with JWT tokens
2. **Book Management**: Add, edit, delete books for donation
3. **Donation Requests**: Request books and manage donation status
4. **User Roles**: Donor, Recipient, Admin roles
5. **Search & Filter**: Find books by title, author, genre, condition

## Development Guidelines
- Use functional components with React hooks
- Follow REST API conventions for backend routes
- Implement proper error handling and validation
- Use Tailwind CSS for consistent styling
- Maintain clean code structure and comments

## API Endpoints
- `/api/auth/*` - Authentication routes
- `/api/books/*` - Book management routes
- `/api/donations/*` - Donation management routes

## Environment Variables
- `MONGODB_URI` - MongoDB connection string
- `JWT_SECRET` - Secret key for JWT tokens
- `PORT` - Server port (default: 5000)

When working with this codebase, prioritize security, user experience, and code maintainability.
