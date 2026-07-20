# Foligo - AI-Powered Portfolio Generation Platform

**Your Conversational Portfolio Assistant**

Foligo is a comprehensive AI-powered platform that generates polished portfolio content from simple verbal descriptions. Go from idea to a live portfolio piece in minutes, just by talking. The platform consists of multiple interconnected services working together to provide a seamless portfolio creation experience.

## 🚀 Overview

Foligo transforms how professionals create portfolio content through cutting-edge AI integration. Users can:

- **Create portfolio content through AI-powered text conversations**
- **Generate content using natural voice interactions**
- **Build tailored resumes with AI-powered job matching**
- **Get job application assistance with intelligent resume chatbot**
- **Manage multiple projects with an intuitive dashboard**
- **Publish sites with custom subdomains**
- **Access content on iOS devices**
- **Track and auto-fill job applications with the GoApply browser extension**

## 🏗️ Architecture

Foligo is built as a microservices architecture with the following components:

```
foligo/
├── api/              # Node.js/Express REST API backend
├── dashboard/        # Vue.js dashboard (admin interface)
├── sites/           # Nuxt.js static site generator (public sites)
├── app/             # Swift/SwiftUI iOS application
├── extension/       # GoApply browser extension (Manifest V3)
└── api/ai/          # AI integration documentation
```

## 📦 Components

### 1. **API** (`/api`)

**Backend REST API service** - Node.js + Express + PostgreSQL + Prisma + Redis

- **Authentication & Authorization**: JWT-based auth with role-based access control
- **User Management**: Complete user profile management
- **Project Management**: Create, update, and manage portfolio projects
- **Content Management**: Block-based CMS with multiple content types
- **AI Integration**: Gemini AI for content generation and analysis
- **Voice Integration**: ElevenLabs webhook for voice-to-content generation
- **Caching**: Redis-based caching for performance
- **Security**: Rate limiting, CORS, Helmet security headers

**Tech Stack**: Node.js, Express, Prisma ORM, PostgreSQL, Redis, JWT, Multer

### 2. **Dashboard** (`/dashboard`)

**Admin Dashboard** - Vue.js 3 + TypeScript + Tailwind CSS

- **Project Management**: Create and manage portfolio projects
- **Content Editor**: Rich text editor with Quill for content creation
- **AI Assistant**: Interactive AI chatbot for content generation
- **Voice Assistant**: ElevenLabs voice-to-content integration
- **Resume Generator**: AI-powered resume creation with job matching
- **Job Assistant**: Conversational chatbot for resume optimization and job applications
- **User Interface**: Modern, responsive design with Tailwind CSS
- **Analytics**: Project performance metrics and charts
- **Authentication**: JWT-based session management

**Tech Stack**: Vue.js 3, TypeScript, Vite, Pinia, Vue Router, Tailwind CSS, Quill, Chart.js

### 3. **Sites** (`/sites`)

**Static Site Generator** - Nuxt.js with SSR

- **Dynamic Subdomain Handling**: Automatically fetches site data by subdomain
- **Multiple Layouts**: Grid, list, masonry layouts for different styles
- **Dynamic Styling**: Custom colors and themes from site configuration
- **Content Rendering**: Markdown support for rich content
- **Archive Pages**: Dedicated pages for projects, blogs, experiences
- **SEO Optimized**: Dynamic meta tags and structured content
- **Responsive Design**: Mobile-first with Tailwind CSS

**Tech Stack**: Nuxt.js, Vue.js, Tailwind CSS, SSR

### 4. **iOS App** (`/app`)

**Mobile Application** - Swift + SwiftUI

- **Native iOS Experience**: Full native SwiftUI implementation
- **Project Browsing**: View and manage projects on mobile
- **Authentication**: Secure token-based authentication
- **Splash Screen**: Elegant onboarding experience
- **Project Dashboard**: Native interface for managing portfolios

**Tech Stack**: Swift, SwiftUI, iOS SDK

### 5. **Browser Extension** (`/extension`)

**GoApply by Foligo** - Chrome Manifest V3 extension for one-click job applications

- **Session-Scoped Side Panel**: Browser agent runs in an isolated tab-group session, not tied to a single page
- **Page Automation**: Accessibility-tree page reads, semantic form fill, trusted CDP mouse/keyboard input, and batched sequential actions
- **One-Click Applications**: Auto-fills job application forms using portfolio and GoApply profile data
- **AI Cover Letters**: Generates tailored cover letters during the application flow
- **Kanban Tracking**: Syncs applied jobs back to the GoApply kanban board in the dashboard

**Tech Stack**: Manifest V3, Chrome Debugger/Scripting/Side Panel APIs

## 🤖 AI Features

### Gemini AI Integration

Foligo integrates with Google's Gemini AI for intelligent content generation:

- **Content Generation**: AI-powered blog posts, project descriptions, and experience entries
- **Interactive Chat**: Conversational AI assistant for content refinement
- **Clarifying Questions**: AI generates contextual questions based on content type
- **Content Analysis**: Automatic tagging, summarization, and SEO optimization
- **Multi-type Support**: Blog posts, project descriptions, and work experiences
- **Full Portfolio Control**: The AI Content Creator can search, create, edit, tag, and (with confirmation) delete posts, resumes, cover letters, and GoApply job applications, and navigate the dashboard on the user's behalf
- **Current-Page Awareness**: The assistant knows what page/content the user is currently viewing and can act on it directly

### Voice Integration

ElevenLabs voice agent integration for hands-free content creation:

- **Voice-to-Content**: Convert voice conversations into portfolio content
- **Natural Language**: Speak naturally about your projects or experiences
- **Real-time Processing**: Instant content generation from voice input
- **Conversational Interface**: AI agent conducts structured interviews
- **Multi-format Output**: Generate various content types from voice input

### Resume Generation & Job Assistant

AI-powered resume creation and job application support:

- **Resume Generator**: Create tailored resumes from portfolio content
- **Job Matching**: AI analyzes job descriptions and matches relevant experience
- **Resume Chatbot**: Interactive assistant for resume optimization and job application guidance
- **Resume Templates**: Multiple layout styles (single column, two column, compact, academic)
- **Content Extraction**: Parse existing resumes (PDF, DOC, DOCX) for analysis
- **Portfolio Integration**: Automatically pull relevant projects and experiences
- **Resume History**: Save and manage multiple resume drafts

### GoApply

Job search tracking and application automation, in the dashboard and via the browser extension:

- **Kanban Board**: Track applications through customizable status columns
- **Job Tracker & List**: Log job postings with linked resumes/cover letters
- **Saved Answers**: Reuse answers to common application questions
- **Cover Letter Studio**: Generate and edit AI cover letters per job
- **One-Click Apply**: The browser extension auto-fills application forms on job sites and syncs results back to the kanban board

## 🚦 Quick Start

### Prerequisites

- **Node.js** 18+ (for API, Dashboard, Sites)
- **PostgreSQL** 13+ (database)
- **Redis** 6+ (caching)
- **npm** or **yarn** (package manager)
- **Xcode** 14+ (for iOS development)
- **Swift** 5.7+ (for iOS app)

### API Setup

```bash
cd api

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your configuration:
# - DATABASE_URL
# - REDIS_URL
# - JWT_SECRET
# - GEMINI_API_KEY
# - ELEVENLABS_API_KEY

# Generate Prisma client
npm run db:generate

# Run migrations
npm run db:migrate

# Seed database (optional)
npm run db:seed

# Start development server
npm run dev
```

The API will be available at `http://localhost:3000` with Swagger docs at `http://localhost:3000/api-docs`.

### Dashboard Setup

```bash
cd dashboard

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your API URL:
# - VITE_API_URL=http://localhost:3000/api

# Start development server
npm run dev
```

The dashboard will be available at `http://localhost:5173`.

### Sites Setup

```bash
cd sites

# Install dependencies
npm install

# Configure environment (optional)
# - API_BASE_URL=https://api.foligo.tech

# Start development server
npm run dev

# Build for production
npm run build
```

Sites will be available at `http://localhost:3000` (or configured port).

### iOS App Setup

```bash
cd app

# Open project in Xcode
open foligo.xcodeproj

# Configure API endpoint in code (if needed)
# Update FoligoAPI.baseURL in ContentView.swift

# Build and run in Xcode
# Select target device/simulator
# Press Cmd+R to build and run
```

### Browser Extension Setup

```bash
cd extension

# Load unpacked in Chrome:
# 1. Open chrome://extensions
# 2. Enable "Developer mode"
# 3. Click "Load unpacked" and select the extension/ directory
# 4. Open the extension's options page and point it at your API URL
```

## 🐳 Docker Support

The API includes Docker Compose configuration for easy development:

```bash
cd api

# Start all services (PostgreSQL, Redis, API)
docker-compose up -d

# Run migrations
docker-compose exec api npm run db:migrate

# Seed database (optional)
docker-compose exec api npm run db:seed

# View logs
docker-compose logs -f api

# Stop all services
docker-compose down
```

## 🔑 Environment Variables

### API

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/foligo"

# Redis
REDIS_URL="redis://localhost:6379"

# JWT
JWT_SECRET="your-secret-key-here"
JWT_EXPIRES_IN="7d"

# Server
PORT=3000
NODE_ENV=development

# CORS
ADDITIONAL_CORS_ORIGINS=""
# Comma-separated list for extra private-route origins. Public endpoints
# (site, voice webhook, public content, media files) already allow all origins.

# AI Services
GEMINI_API_KEY="your-gemini-api-key"
ELEVENLABS_API_KEY="your-elevenlabs-api-key"
ELEVENLABS_AGENT_ID="agent_1301k8emq0nzfwmbyta7254adhpv"

# File Upload
MAX_FILE_SIZE=52428800
UPLOAD_DIR="./uploads"

# MinIO (Media Storage)
MINIO_ENDPOINT=localhost
MINIO_PORT=9000
MINIO_USE_SSL=false
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_BUCKET_NAME=foligo
MINIO_PUBLIC_URL=http://localhost:9000/foligo

# API URL (for generating proxied media URLs)
API_URL=http://localhost:3000
```

### Dashboard

```env
VITE_API_URL=http://localhost:3000/api
VITE_APP_NAME=Foligo Dashboard
VITE_APP_VERSION=1.0.0
```

### Sites

```env
API_BASE_URL=https://api.foligo.tech
```

## 📚 API Endpoints

### Authentication

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user

### Projects

- `GET /api/projects` - List user projects
- `POST /api/projects` - Create project
- `GET /api/projects/:id` - Get project details
- `PUT /api/projects/:id` - Update project
- `DELETE /api/projects/:id` - Delete project

### Content

- `GET /api/projects/:id/content` - List project content
- `POST /api/projects/:id/content` - Create content
- `PUT /api/content/:id` - Update content
- `DELETE /api/content/:id` - Delete content

### AI Integration

- `POST /api/ai/generate-content` - Generate content with AI
- `POST /api/ai/chat` - Chat with AI assistant
- `POST /api/ai/clarifying-questions` - Get AI questions
- `POST /api/ai/voice-webhook` - ElevenLabs voice webhook
- `POST /api/ai/resume-chatbot` - Resume chatbot session
- `POST /api/ai/resume/tailor` - Generate tailored resume content

### Sites

- `GET /api/site/:subdomain` - Get site data
- `GET /api/site/:subdomain/content/:slug` - Get content item

## 🎨 Features

### Content Creation Workflows

#### Text-Based AI Assistant

1. User clicks "Use AI Assistant" in dashboard
2. AI generates clarifying questions based on content type
3. User answers questions to provide context
4. AI chatbot opens for interactive refinement
5. User chats to refine the content
6. AI generates final content
7. User reviews and publishes

#### Voice-Based AI Assistant

1. User selects "Voice Mode"
2. ElevenLabs conversation interface opens
3. AI conducts structured interview (3 questions + final check)
4. User speaks naturally about project/experience
5. AI summarizes conversation
6. Content is automatically generated via webhook
7. Content appears in dashboard for review

### Supported Content Types

- **BLOG**: Blog posts and articles with markdown support
- **PROJECT**: Project descriptions and case studies
- **EXPERIENCE**: Work experience and achievements
- **SKILL**: Skills and proficiencies with categorization

### Resume Generation Workflows

#### AI Resume Generator

1. User provides job description or selects target role
2. AI analyzes job requirements and matches portfolio content
3. User selects relevant projects and experiences
4. AI generates tailored resume with appropriate sections
5. User reviews and edits in visual resume editor
6. Export resume in multiple formats (PDF, DOCX)

#### Job Application Assistant

1. User uploads existing resume or starts fresh
2. User provides job posting or description
3. AI chatbot analyzes resume and job requirements
4. Interactive conversation to optimize resume content
5. AI suggests improvements and highlights gaps
6. Generate optimized resume draft for review

## 🔒 Security

- **JWT Authentication**: Secure token-based authentication
- **Role-based Access Control**: Granular permissions system
- **Rate Limiting**: Prevents abuse and DoS attacks
- **Input Validation**: Comprehensive request validation
- **CORS**: Configurable cross-origin resource sharing
- **Helmet**: Security headers for protection
- **Password Hashing**: bcrypt for secure storage

## 📖 Documentation

- [AI Integration Guide](/api/ai/AI_INTEGRATION.md)
- [Voice Integration Guide](/api/ai/voice-integration.md)
- [ElevenLabs Configuration](/api/ai/ELEVENLABS_TOOL_CONFIG.md)
- [API README](/api/README.md)
- [Dashboard README](/dashboard/README.md)
- [Sites README](/sites/README.md)

## 🛠️ Development

### Project Structure

```
foligo/
├── api/
│   ├── src/
│   │   ├── routes/          # API route handlers
│   │   ├── middleware/      # Express middleware
│   │   ├── services/        # External services
│   │   └── index.js        # Application entry
│   ├── prisma/
│   │   └── schema.prisma    # Database schema
│   └── docker-compose.yml
├── dashboard/
│   ├── src/
│   │   ├── components/     # Vue components
│   │   ├── views/          # Page views
│   │   ├── stores/         # Pinia stores
│   │   ├── services/       # API services
│   │   └── router/         # Vue Router
│   └── vite.config.ts
├── sites/
│   ├── pages/              # Nuxt pages
│   ├── components/         # Layout components
│   ├── utils/              # Utilities
│   └── nuxt.config.ts
├── app/
│   ├── foligo/             # Swift source files
│   └── foligo.xcodeproj    # Xcode project
└── extension/
    ├── core/               # Agent controller, CDP, tracker, filler, API client
    ├── background.js       # Service worker
    └── side-panel.js       # Side panel UI logic
```

### Available Scripts

#### API

```bash
npm run dev          # Start development server
npm run build        # Generate Prisma client
npm run db:migrate   # Run migrations
npm run db:seed      # Seed database
npm test             # Run tests
npm run lint         # Lint code
```

#### Dashboard

```bash
npm run dev          # Start dev server
npm run build        # Build for production
npm run preview      # Preview build
npm run lint          # Lint code
npm run format       # Format code
```

#### Sites

```bash
npm run dev          # Start dev server
npm run build        # Build for production
npm run preview      # Preview build
```

## 🚢 Deployment

### API Deployment

The API is configured to run on port 80 in production:

```bash
npm run build
PORT=80 npm start
```

Or using Docker:

```bash
docker build -t foligo-api .
docker run -p 80:80 foligo-api
```

### Dashboard Deployment

Build for production:

```bash
npm run build
# Deploy dist/ folder to static hosting
```

### Sites Deployment

Build for production:

```bash
npm run build
# Deploy .output/ folder to your hosting platform
```

### DNS Configuration

For sites with custom subdomains, configure DNS:

- Point `*.foligo.tech` to the sites application
- Point `api.foligo.tech` to the API server

## 📱 iOS App

### Building for iOS

1. Open `app/foligo.xcodeproj` in Xcode
2. Select target device or simulator
3. Configure signing certificates
4. Build and run (Cmd+R)

### Features

- Native SwiftUI interface
- JWT authentication
- Project browsing
- Onboarding flow
- Splash screen

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

## 👥 Team

Built by the Foligo Team

## 🎯 Status

**Active Development** - Currently in beta

---

**Version**: 1.0.0  
**Last Updated**: 2026

For more information, visit [Foligo Documentation](https://api.foligo.tech/api-docs)
