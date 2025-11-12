# Foligo API

A comprehensive API for portfolio generation website and AI-powered Content Management System (CMS) built with Node.js, Express, Prisma, PostgreSQL, and Redis.

## Features

- **Authentication & Authorization**: JWT-based authentication with role-based access control
- **User Management**: Complete user profile management and project access control
- **Project Management**: Create, update, and manage portfolio projects
- **CMS Content Editing**: Block-based content management with multiple content types
- **AI Integration**: AI-powered content analysis, tagging, and summarization
- **Caching**: Redis-based caching for improved performance
- **API Documentation**: Comprehensive Swagger/OpenAPI documentation
- **Security**: Rate limiting, CORS, helmet security headers
- **Scalability**: Modular architecture with proper separation of concerns

## Technology Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: PostgreSQL with Prisma ORM
- **Cache**: Redis
- **Authentication**: JWT (JSON Web Tokens)
- **Documentation**: Swagger/OpenAPI
- **Validation**: Express Validator
- **Security**: Helmet, CORS, Rate Limiting

## Quick Start

### Prerequisites

- Node.js 18+
- PostgreSQL 13+
- Redis 6+
- npm or yarn

### Installation

1. **Clone and install dependencies**:
   ```bash
   cd api
   npm install
   ```

2. **Set up environment variables**:
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Set up the database**:
   ```bash
   # Generate Prisma client
   npm run db:generate
   
   # Run database migrations
   npm run db:migrate
   
   # (Optional) Seed the database
   npm run db:seed
   ```

4. **Start the development server**:
   ```bash
   npm run dev
   ```

The API will be available at `http://localhost:3000` with documentation at `http://localhost:3000/api-docs`.

### Using Docker

For a complete development environment with PostgreSQL and Redis:

```bash
# Start all services
docker-compose up -d

# Run database migrations
docker-compose exec api npm run db:migrate

# Seed the database (optional)
docker-compose exec api npm run db:seed
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user profile

### User Management
- `GET /api/users/{id}` - Get user public profile
- `PUT /api/users/me` - Update current user profile
- `GET /api/users/me/projects` - Get user's projects

### Project Management
- `POST /api/projects` - Create a new project
- `GET /api/projects` - Get all user's projects
- `GET /api/projects/{id}` - Get project details
- `PUT /api/projects/{id}` - Update project
- `DELETE /api/projects/{id}` - Delete project

### Project Access Control
- `POST /api/projects/{id}/members` - Add user to project
- `GET /api/projects/{id}/members` - Get project members
- `PUT /api/projects/{id}/members/{userId}` - Update user role
- `DELETE /api/projects/{id}/members/{userId}` - Remove user from project

### CMS Content Editing
- `POST /api/projects/{projectId}/content` - Create content block
- `GET /api/projects/{projectId}/content` - Get project content
- `GET /api/content/{id}` - Get specific content block
- `PUT /api/content/{id}` - Update content block
- `DELETE /api/content/{id}` - Delete content block
- `PUT /api/content/{id}/reorder` - Reorder content blocks

### AI Integration
- `POST /api/content/{id}/analyze` - Trigger AI analysis
- `GET /api/content/{id}/analysis` - Get AI analysis results
- `DELETE /api/content/{id}/analysis` - Delete AI analysis
- `POST /api/ai/batch-analyze` - Batch AI analysis

## Data Models

### User
- `id`: UUID (Primary Key)
- `email`: String (Unique)
- `password`: String (Hashed)
- `name`: String
- `createdAt`: DateTime
- `updatedAt`: DateTime

### Project
- `id`: UUID (Primary Key)
- `name`: String
- `description`: String (Optional)
- `ownerId`: UUID (Foreign Key to User)
- `createdAt`: DateTime
- `updatedAt`: DateTime

### ProjectAccess
- `id`: UUID (Primary Key)
- `userId`: UUID (Foreign Key to User)
- `projectId`: UUID (Foreign Key to Project)
- `role`: Enum (ADMIN, EDITOR, VIEWER)
- `createdAt`: DateTime
- `updatedAt`: DateTime

### Content
- `id`: UUID (Primary Key)
- `projectId`: UUID (Foreign Key to Project)
- `type`: Enum (TEXT, IMAGE, VIDEO, CODE, LINK, EMBED)
- `data`: JSON (Content-specific data)
- `order`: Integer (Display order)
- `createdAt`: DateTime
- `updatedAt`: DateTime

### AIAnalysis
- `id`: UUID (Primary Key)
- `contentId`: UUID (Foreign Key to Content)
- `tags`: String[] (AI-generated tags)
- `summary`: String (AI-generated summary)
- `altText`: String (AI-generated alt text)
- `createdAt`: DateTime
- `updatedAt`: DateTime

## Caching Strategy

The API uses Redis for caching frequently accessed data:

- **User profiles**: Cached for 1 hour
- **Project details**: Cached for 15 minutes
- **Project content**: Cached for 15 minutes
- **Project members**: Cached for 15 minutes

Cache invalidation occurs automatically when data is updated.

## Security Features

- **JWT Authentication**: Secure token-based authentication
- **Role-based Access Control**: Granular permissions system
- **Rate Limiting**: Prevents abuse and DoS attacks
- **Input Validation**: Comprehensive request validation
- **CORS**: Configurable cross-origin resource sharing
- **Helmet**: Security headers for protection
- **Password Hashing**: bcrypt for secure password storage

## Development

### Scripts

- `npm start` - Start production server
- `npm run dev` - Start development server with nodemon
- `npm run build` - Generate Prisma client
- `npm run db:migrate` - Run database migrations
- `npm run db:generate` - Generate Prisma client
- `npm run db:seed` - Seed database with sample data
- `npm test` - Run tests
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint issues

### Project Structure

```
api/
├── src/
│   ├── routes/           # API route handlers
│   ├── middleware/       # Express middleware
│   ├── services/         # External service connections
│   └── index.js         # Main application entry point
├── prisma/
│   └── schema.prisma    # Database schema
├── package.json
├── docker-compose.yml   # Development environment
├── Dockerfile          # Production container
└── README.md
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details
