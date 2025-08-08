# PustakDhaan - Book Donation Drive Management System 📚

PustakDhaan is a comprehensive full-stack web application designed to manage book donation drives for communities. The name "PustakDhaan" comes from Hindi, where "Pustak" means book and "Dhaan" means donation. This system facilitates organized book collection and distribution to government schools.

## Features

### 🎯 Core Features
- **Book Donation Drives**: Organized community-wide book collection campaigns
- **User Authentication**: Secure registration and login system with role-based access
- **School Management**: Add and manage government schools as beneficiaries
- **Book Allocation**: Distribute collected books to schools based on requirements
- **Badge System**: Recognition system for donors based on contribution levels
- **Age-Based Categorization**: Books categorized by age groups (2-4, 4-6, 6-8, 8-10 years)

### 👥 User Roles
- **Donors**: Contribute books to donation drives and track their donations
- **Administrators**: Oversee the entire system, create drives, manage schools, and allocate books

### 🏆 Badge System
- **Bronze Badge**: 10+ books donated
- **Silver Badge**: 50+ books donated
- **Gold Badge**: 100+ books donated

### 📚 Book Categories
- **Age-Based**: 2-4 years, 4-6 years, 6-8 years, 8-10 years
- **Non-Academic Focus**: Story books, picture books, activity books
- **Good Condition**: Only quality books accepted for donation

## Key System Features

### 🎯 Donation Drive Management
- **Organized Campaigns**: Structured book collection drives for communities
- **Location-Based**: Drives organized by gated communities and localities
- **Coordinator Assignment**: Dedicated coordinators for each drive
- **Real-time Tracking**: Monitor book collection progress by age category

### 🏫 School Integration
- **Government Schools**: Focus on supporting government and semi-government schools
- **Needs-Based Allocation**: Books distributed based on school requirements
- **Contact Management**: Maintain school contact information and student counts
- **Delivery Tracking**: Track book delivery status to schools

### 📊 Analytics & Reporting
- **Donation Analytics**: Track donations by user, drive, and time period
- **School Impact**: Monitor how many books each school receives
- **Badge Progression**: Visual representation of donor achievements
- **Drive Performance**: Measure success of individual donation drives

### 🔐 Security & Access Control
- **Role-Based Access**: Different permissions for donors, coordinators, and admins
- **JWT Authentication**: Secure token-based authentication
- **Data Privacy**: User information protected with proper validation
- **Admin Controls**: Comprehensive admin panel for system management

## Tech Stack

### Frontend
- **React 18** - Modern UI library
- **Vite** - Fast build tool
- **Tailwind CSS** - Utility-first CSS framework
- **React Router** - Client-side routing
- **Axios** - HTTP client

### Backend
- **Node.js** - JavaScript runtime
- **Express.js** - Web framework
- **MongoDB** - NoSQL database
- **Mongoose** - MongoDB object modeling
- **JWT** - Authentication tokens
- **bcryptjs** - Password hashing

## Getting Started

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (local or cloud)
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd pustakdhaan
   ```

2. **Install Backend Dependencies**
   ```bash
   cd server
   npm install
   ```

3. **Install Frontend Dependencies**
   ```bash
   cd ../client
   npm install
   ```

4. **Environment Setup**
   
   Create a `.env` file in the server directory:
   ```env
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/pustakdhaan
   JWT_SECRET=your_super_secret_jwt_key_here
   NODE_ENV=development
   ```

5. **Start the Application**
   
   **Backend Server:**
   ```bash
   cd server
   npm run dev
   ```
   
   **Frontend Development Server:**
   ```bash
   cd client
   npm run dev
   ```

6. **Access the Application**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:5000

## Project Structure

```
pustakdhaan/
├── client/                 # React frontend
│   ├── public/
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   │   └── Navbar.jsx  # Navigation component
│   │   ├── pages/          # Page components
│   │   │   ├── Home.jsx           # Landing page
│   │   │   ├── Login.jsx          # User login
│   │   │   ├── Register.jsx       # User registration
│   │   │   ├── Profile.jsx        # User profile
│   │   │   ├── DonationDrives.jsx # View donation drives
│   │   │   ├── DonateBooks.jsx    # Donate books to drives
│   │   │   ├── MyDonations.jsx    # View user's donations
│   │   │   ├── AdminDashboard.jsx # Admin management panel
│   │   │   ├── AddBook.jsx        # Add individual books
│   │   │   ├── Books.jsx          # Browse books
│   │   │   └── MyBooks.jsx        # Manage user's books
│   │   ├── App.jsx         # Main app component
│   │   └── main.jsx        # Entry point
│   ├── package.json
│   └── vite.config.js
├── server/                 # Express backend
│   ├── models/             # Database models
│   │   ├── User.js                # User model with roles and badges
│   │   ├── Book.js                # Book model with age categories
│   │   ├── BookDonationDrive.js   # Donation drive model
│   │   ├── Donation.js            # Donation record model
│   │   ├── School.js              # School model
│   │   └── BookAllocation.js      # Book allocation model
│   ├── routes/             # API routes
│   │   ├── auth.js                # Authentication routes
│   │   ├── books.js               # Book management routes
│   │   ├── donationRecords.js     # Donation tracking routes
│   │   ├── donationDrives.js      # Donation drive routes
│   │   ├── schools.js             # School management routes
│   │   └── allocations.js         # Book allocation routes
│   ├── seed.js             # Database seeding script
│   ├── cleanup.js          # Database cleanup script
│   ├── index.js            # Server entry point
│   └── package.json
└── README.md
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user profile
- `GET /api/auth/users` - Get all users (admin only)

### Donation Drives
- `GET /api/drives/active` - Get active donation drives
- `GET /api/drives/all` - Get all donation drives (admin only)
- `GET /api/drives/:id` - Get single donation drive details
- `POST /api/drives/create` - Create new donation drive (admin only)

### Donations
- `POST /api/donations/submit` - Submit donation to a drive
- `GET /api/donations/my` - Get user's donations
- `GET /api/donations/all` - Get all donations (admin only)
- `GET /api/donations/:id` - Get single donation details

### Schools
- `GET /api/schools/all` - Get all schools (admin only)
- `POST /api/schools/create` - Add new school (admin only)
- `GET /api/schools/:id` - Get single school details

### Book Allocations
- `POST /api/allocations/allocate` - Allocate books to school (admin only)
- `GET /api/allocations/all` - Get all allocations (admin only)
- `GET /api/allocations/by-drive/:driveId` - Get allocations by drive
- `GET /api/allocations/by-school/:schoolId` - Get allocations by school
- `PUT /api/allocations/:id/status` - Update allocation status

### Books (Legacy)
- `GET /api/books` - Get all available books
- `GET /api/books/:id` - Get single book
- `POST /api/books` - Add new book (authenticated)
- `PUT /api/books/:id` - Update book (authenticated)
- `DELETE /api/books/:id` - Delete book (authenticated)
- `GET /api/books/my/books` - Get user's books (authenticated)

## Usage

### For Donors
1. **Register and Login**: Create an account and log in
2. **Browse Donation Drives**: View active drives in your area
3. **Donate Books**: Select a drive and specify books by age category
4. **Track Donations**: Monitor your donation history and impact
5. **Earn Badges**: Achieve recognition through consistent donations

### For Administrators
1. **Create Drives**: Set up new donation drives with coordinators
2. **Manage Schools**: Add government schools as beneficiaries
3. **Allocate Books**: Distribute collected books to schools
4. **Monitor System**: Oversee all donations, drives, and allocations
5. **User Management**: Manage user roles and permissions

### Workflow
1. **Admin** creates a donation drive and assigns a coordinator
2. **Donors** contribute books to the drive by age category
3. **Admin** allocates collected books to government schools
4. **Schools** receive books based on their requirements
5. **System** tracks donations, awards badges, and maintains records

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## Development Scripts

### Backend
- `npm start` - Start production server
- `npm run dev` - Start development server with nodemon
- `npm run seed` - Seed database with sample data
- `npm run cleanup` - Clean up database collections
- `npm run reset` - Reset database (cleanup + seed)

### Frontend
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build

## Database Setup

### Initial Setup
1. **Install MongoDB**: Ensure MongoDB is installed and running
2. **Seed Database**: Run `npm run seed` in the server directory
3. **Test Data**: The seed script creates sample users, drives, and schools

### Sample Data
- **Admin User**: admin@pustakdhaan.com / password123
- **Donor User**: donor@example.com / password123

## Environment Variables

### Required Environment Variables
Create a `.env` file in the server directory:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/pustakdhaan
JWT_SECRET=your_super_secret_jwt_key_here_change_in_production
NODE_ENV=development
```

## License

This project is licensed under the ISC License.

## Support

For support, email support@pustakdhaan.com or join our community forum.

## Acknowledgments

- Thanks to all contributors who help make book sharing accessible
- Inspired by the community spirit of sharing knowledge and education
- Built with love for children's education and literacy
- Special recognition to volunteers who coordinate donation drives

---

**Happy Reading! 📖✨**

**Building a Better Future Through Books! 🌟**
