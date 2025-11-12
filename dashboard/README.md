# Foligo Dashboard

A modern Vue.js management dashboard for the Foligo portfolio generation platform and AI-powered CMS.

## Features

- **Modern Vue.js 3** with TypeScript and Composition API
- **Responsive Design** with Tailwind CSS
- **Authentication & Authorization** with JWT tokens
- **Project Management** with drag-and-drop content editing
- **AI Integration** for content analysis and optimization
- **Real-time Updates** with WebSocket support
- **Analytics Dashboard** with Chart.js visualizations
- **User Administration** with role-based access control
- **File Upload** with image optimization
- **Onboarding Flow** for new users

## Technology Stack

- **Frontend**: Vue.js 3, TypeScript, Vite
- **Styling**: Tailwind CSS, Headless UI
- **State Management**: Pinia
- **Routing**: Vue Router
- **HTTP Client**: Axios
- **Charts**: Chart.js, Vue Chart.js
- **Icons**: Heroicons
- **Notifications**: Vue Toastification
- **Date Handling**: date-fns
- **Utilities**: Lodash, VueUse

## Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn
- Foligo API running on port 80

### Installation

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Set up environment variables**:
   ```bash
   cp .env.example .env
   # Edit .env with your API configuration
   ```

3. **Start development server**:
   ```bash
   npm run dev
   ```

The dashboard will be available at `http://localhost:3001`.

## Project Structure

```
src/
├── components/          # Reusable Vue components
├── layouts/            # Layout components
├── views/              # Page components
├── stores/             # Pinia stores
├── services/           # API services
├── router/             # Vue Router configuration
├── utils/              # Utility functions
├── assets/             # Static assets
└── main.ts            # Application entry point
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run type-check` - Run TypeScript type checking
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier

## Features Overview

### Authentication
- JWT-based authentication
- Role-based access control
- Secure token storage
- Auto-logout on token expiry

### Project Management
- Create and manage portfolio projects
- Drag-and-drop content organization
- Real-time collaboration
- Version history

### Content Management
- Rich text editor with Quill
- Image upload and optimization
- Code syntax highlighting
- Embed support for various platforms

### AI Integration
- Automatic content analysis
- Image tagging and alt-text generation
- Text summarization
- SEO optimization suggestions

### Analytics
- Project performance metrics
- Content engagement tracking
- User activity monitoring
- Export capabilities

## API Integration

The dashboard connects to the Foligo API running on port 80. Make sure the API is running before starting the dashboard.

### Environment Configuration

```env
VITE_API_URL=http://localhost:80/api
VITE_APP_NAME=Foligo Dashboard
VITE_APP_VERSION=1.0.0
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details
