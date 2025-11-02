# Shrishay Foundation Backend API

A robust backend API for managing events and blogs with media support, built with Express.js and MongoDB.

## Features

- **Authentication & Authorization**: JWT-based authentication with refresh tokens
- **Events Management**: Full CRUD operations for events with media galleries
- **Blog Management**: Complete blog system with categories and media support
- **Media Management**: Upload and manage images/videos with automatic optimization
- **Role-Based Access Control**: Admin and editor roles with different permissions
- **Soft Delete**: Recoverable deletion for all content
- **API Validation**: Request validation using Joi schemas
- **Security**: Helmet, CORS, rate limiting, and MongoDB sanitization

## Tech Stack

- **Runtime**: Node.js (v18+)
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (access + refresh tokens)
- **File Upload**: Multer
- **Image Processing**: Sharp
- **Validation**: Joi
- **Security**: Helmet, CORS, express-rate-limit

## Installation

### Prerequisites

- Node.js 18+ installed
- MongoDB running locally or MongoDB Atlas connection
- npm or yarn package manager

### Setup Steps

1. **Clone and navigate to backend directory**
   ```bash
   cd backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   ```bash
   cp .env.example .env
   ```
   Edit `.env` file with your configuration:
   - MongoDB connection string
   - JWT secrets
   - Admin credentials
   - Frontend URL for CORS

4. **Create upload directories**
   ```bash
   mkdir -p uploads/images uploads/videos
   ```

5. **Seed admin user**
   ```bash
   npm run seed
   ```
   Default credentials:
   - Email: admin@shrishay.org
   - Password: Admin@123456

6. **Start development server**
   ```bash
   npm run dev
   ```
   Server will run on http://localhost:5000

## API Documentation

### Base URL
```
http://localhost:5000/api/v1
```

### Authentication Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/auth/login` | Login with email/password | No |
| POST | `/auth/refresh-token` | Refresh access token | No |
| POST | `/auth/logout` | Logout user | No |
| GET | `/auth/me` | Get current user | Yes |
| PATCH | `/auth/me` | Update profile | Yes |
| PATCH | `/auth/change-password` | Change password | Yes |
| POST | `/auth/register` | Register new admin | Admin |

### Events Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/events` | Get all events | Optional |
| GET | `/events/:id` | Get event by ID | Optional |
| GET | `/events/slug/:slug` | Get event by slug | No |
| POST | `/events` | Create event | Admin |
| PATCH | `/events/:id` | Update event | Admin |
| DELETE | `/events/:id` | Delete event | Admin |
| POST | `/events/:id/restore` | Restore deleted event | Admin |

### Blogs Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/blogs` | Get all blogs | Optional |
| GET | `/blogs/:id` | Get blog by ID | Optional |
| GET | `/blogs/slug/:slug` | Get blog by slug | No |
| GET | `/blogs/categories` | Get all categories | No |
| POST | `/blogs` | Create blog | Admin |
| PATCH | `/blogs/:id` | Update blog | Admin |
| DELETE | `/blogs/:id` | Delete blog | Admin |
| POST | `/blogs/:id/restore` | Restore deleted blog | Admin |

### Media Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/media/upload` | Upload files | Admin |
| GET | `/media` | Get all media | Admin |
| GET | `/media/:id` | Get media by ID | Admin |
| PATCH | `/media/:id` | Update media metadata | Admin |
| DELETE | `/media/:id` | Delete media | Admin |
| DELETE | `/media/bulk/unused` | Delete unused media | Admin |

## Request Examples

### Login
```json
POST /api/v1/auth/login
{
  "email": "admin@shrishay.org",
  "password": "Admin@123456"
}
```

### Create Event
```json
POST /api/v1/events
Authorization: Bearer <token>
{
  "title": "Charity Fundraiser",
  "description": "Annual charity event",
  "time": "8:00 am - 12:30 pm",
  "location": "London Park, England",
  "datetime": "2024-08-15T08:00:00Z",
  "type": "featured",
  "status": "published",
  "heroImage": "media_id",
  "gallery": ["media_id_1", "media_id_2"],
  "tags": ["charity", "fundraiser"]
}
```

### Upload Media
```
POST /api/v1/media/upload
Authorization: Bearer <token>
Content-Type: multipart/form-data
files: [image1.jpg, image2.png]
```

## Query Parameters

### Pagination
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10)

### Filtering
- `status`: draft, published, archived
- `type`: featured, normal (events)
- `category`: Category name (blogs)
- `featured`: true/false (blogs)
- `search`: Search in title, description, content
- `tags`: Comma-separated tags
- `from/to`: Date range (events)

### Sorting
- `sort`: Field to sort by (prefix with - for descending)
  - Events: `-datetime`, `title`, `-views`
  - Blogs: `-publishedAt`, `title`, `-views`

## Error Handling

All errors follow this format:
```json
{
  "status": "error",
  "message": "Error description",
  "errors": [
    {
      "field": "email",
      "message": "Invalid email format"
    }
  ]
}
```

## Security Features

- **JWT Authentication**: Short-lived access tokens (15min) with refresh tokens (7days)
- **Password Hashing**: Bcrypt with salt rounds
- **Rate Limiting**: 100 requests per 15 minutes per IP
- **CORS**: Configured for frontend origin
- **Helmet**: Security headers
- **MongoDB Sanitization**: Prevents NoSQL injection
- **File Upload Validation**: Type and size restrictions
- **Input Validation**: Joi schemas for all endpoints

## Development

### Project Structure
```
backend/
├── src/
│   ├── config/         # Configuration files
│   ├── controllers/    # Route controllers
│   ├── middleware/     # Custom middleware
│   ├── models/         # Mongoose models
│   ├── routes/         # API routes
│   ├── validators/     # Joi validation schemas
│   ├── scripts/        # Utility scripts
│   ├── app.js          # Express app setup
│   └── server.js       # Server entry point
├── uploads/            # Uploaded files
├── .env.example        # Environment variables template
├── package.json        # Dependencies
└── README.md           # Documentation
```

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| NODE_ENV | Environment (development/production) | development |
| PORT | Server port | 5000 |
| MONGODB_URI | MongoDB connection string | mongodb://localhost:27017/shrishay-foundation |
| JWT_SECRET | JWT signing secret | - |
| JWT_REFRESH_SECRET | Refresh token secret | - |
| JWT_EXPIRE | Access token expiry | 15m |
| JWT_REFRESH_EXPIRE | Refresh token expiry | 7d |
| ADMIN_EMAIL | Initial admin email | admin@shrishay.org |
| ADMIN_PASSWORD | Initial admin password | Admin@123456 |
| FRONTEND_URL | Frontend URL for CORS | http://localhost:3000 |
| MAX_FILE_SIZE | Max upload size in bytes | 10485760 (10MB) |

## Docker Support

### Build and run with Docker
```bash
docker build -t shrishay-backend .
docker run -p 5000:5000 --env-file .env shrishay-backend
```

### Docker Compose (with MongoDB)
```bash
docker-compose up
```

## Production Deployment

1. Set `NODE_ENV=production`
2. Use strong JWT secrets
3. Configure MongoDB Atlas or production database
4. Set up reverse proxy (Nginx/Apache)
5. Enable HTTPS
6. Configure proper CORS origins
7. Set up monitoring and logging
8. Regular database backups

## License

MIT

## Support

For issues or questions, contact the development team.
