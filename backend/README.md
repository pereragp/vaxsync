# VaxSync Backend API

A comprehensive Node.js/Express backend for the VaxSync vaccination tracking application.

## 🏗️ Architecture

- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT tokens
- **Validation**: Express-validator
- **Security**: Helmet, CORS, Rate limiting
- **Testing**: Jest + Supertest

## 📁 Project Structure

```
backend/
├── src/
│   ├── config/
│   │   └── database.ts          # MongoDB connection
│   ├── models/
│   │   ├── User.model.ts        # User schema & methods
│   │   ├── Vaccine.model.ts     # Vaccine records schema
│   │   └── Schedule.model.ts    # Appointments schema
│   ├── routes/
│   │   ├── auth.routes.ts       # Authentication endpoints
│   │   ├── user.routes.ts       # User management
│   │   ├── vaccine.routes.ts    # Vaccine records
│   │   ├── schedule.routes.ts   # Appointments
│   │   └── health.routes.ts     # Health monitoring
│   ├── middleware/
│   │   ├── error.middleware.ts  # Error handling
│   │   └── notFound.middleware.ts # 404 handler
│   └── index.ts                 # Main server file
├── package.json                  # Dependencies & scripts
├── tsconfig.json                # TypeScript config
├── env.example                  # Environment variables template
└── README.md                    # This file
```

## 🚀 Quick Start

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Environment Setup

```bash
# Copy environment template
cp env.example .env

# Edit .env with your configuration
nano .env
```

**Required Environment Variables:**
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/vaxsync
JWT_SECRET=your-super-secret-jwt-key-here
```

### 3. Database Setup

**Option A: Local MongoDB**
```bash
# Install MongoDB locally
# Start MongoDB service
mongod

# Or use Docker
docker run -d -p 27017:27017 --name mongodb mongo:latest
```

**Option B: MongoDB Atlas (Cloud)**
- Create account at [MongoDB Atlas](https://www.mongodb.com/atlas)
- Create cluster and get connection string
- Update `MONGODB_URI` in `.env`

### 4. Start Development Server

```bash
# Development mode with auto-reload
npm run dev

# Or build and run production
npm run build
npm start
```

## 📊 API Endpoints

### Authentication
- `POST /api/v1/auth/register` - User registration
- `POST /api/v1/auth/login` - User login
- `GET /api/v1/auth/me` - Get current user profile

### Users
- `GET /api/v1/users/:id` - Get user by ID

### Vaccines
- `GET /api/v1/vaccines` - Get user's vaccination records

### Schedule
- `GET /api/v1/schedule` - Get user's appointments

### Health
- `GET /api/v1/health` - API health status
- `GET /health` - Basic health check

## 🔧 Development

### Available Scripts

```bash
npm run dev          # Start development server with nodemon
npm run build        # Build TypeScript to JavaScript
npm start            # Start production server
npm test             # Run tests
npm run test:watch   # Run tests in watch mode
npm run lint         # Run ESLint
npm run lint:fix     # Fix ESLint issues
```

### Code Structure

- **Models**: Mongoose schemas with validation and virtuals
- **Routes**: Express route handlers with validation
- **Middleware**: Error handling, authentication, etc.
- **Config**: Database connection and environment setup

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run specific test file
npm test -- --testPathPattern=auth.test.ts
```

## 🔒 Security Features

- **Helmet**: Security headers
- **CORS**: Cross-origin resource sharing
- **Rate Limiting**: API request throttling
- **Input Validation**: Request data validation
- **JWT Authentication**: Secure token-based auth
- **Password Hashing**: bcrypt with salt rounds

## 📈 Performance Features

- **Compression**: Response compression
- **Database Indexing**: Optimized MongoDB queries
- **Virtual Fields**: Computed properties
- **Efficient Queries**: Lean queries for read operations

## 🚀 Deployment

### Production Build

```bash
# Build the application
npm run build

# Start production server
npm start
```

### Environment Variables for Production

```env
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/vaxsync
JWT_SECRET=your-production-jwt-secret
CORS_ORIGIN=https://yourdomain.com
```

### Docker Deployment

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 5000
CMD ["npm", "start"]
```

## 🔍 Monitoring & Logging

- **Morgan**: HTTP request logging
- **Error Logging**: Detailed error tracking
- **Health Checks**: System status monitoring
- **Performance Metrics**: Response time tracking

## 📚 API Documentation

### Request/Response Format

All API responses follow this structure:

```json
{
  "success": true,
  "message": "Operation successful",
  "data": {
    // Response data here
  }
}
```

### Error Response Format

```json
{
  "success": false,
  "message": "Error description",
  "errors": [
    // Validation errors (if any)
  ]
}
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Check the API documentation
- Review the error logs

## 🔄 Updates & Maintenance

- Keep dependencies updated
- Monitor MongoDB performance
- Review security best practices
- Update JWT secrets regularly
- Monitor API usage and performance 