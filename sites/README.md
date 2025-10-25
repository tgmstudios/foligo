# Foligo Sites - Dynamic Static Site Generator

A comprehensive static site generator that dynamically fetches site data from the Foligo API and renders customizable layouts based on site configuration.

## Features

- **Dynamic Subdomain Handling**: Automatically extracts subdomain from hostname and fetches site data
- **Multiple Layout Options**: Supports grid, list, masonry, wide, minimal, and standard layouts
- **Dynamic Styling**: Applies custom colors and themes from site configuration
- **Content Management**: Handles different content types (projects, blogs, experiences)
- **Markdown Rendering**: Built-in markdown renderer for content
- **Archive Pages**: Dedicated pages for different content types
- **Error Handling**: Comprehensive error pages and loading states
- **SEO Optimized**: Dynamic meta tags and structured content
- **Responsive Design**: Mobile-first approach with Tailwind CSS

## Architecture

### Core Components

- **`[...slug].vue`**: Main catch-all route that handles all subdomains and routes
- **`SiteNotFound.vue`**: Error page for missing or unpublished sites
- **API Service**: `utils/siteApi.js` - Handles all API communication
- **Markdown Renderer**: `utils/markdownRenderer.js` - Renders markdown content

### Layout Components

#### Home Page Layouts
- **`GridLayout.vue`**: Grid-based layout for home pages
- **`ListLayout.vue`**: List-based layout for archive pages
- **`MasonryLayout.vue`**: Masonry layout for visual content
- **`DefaultLayout.vue`**: Default fallback layout

#### Single Content Layouts
- **`StandardLayout.vue`**: Standard single content layout
- **`WideLayout.vue`**: Wide single content layout
- **`MinimalLayout.vue`**: Minimal single content layout

#### Archive Pages
- **`ProjectsArchive.vue`**: Projects listing page
- **`BlogArchive.vue`**: Blog posts listing page

### API Integration

The site loader integrates with the Foligo API:

#### Site Data Endpoint
```
GET /api/site/{subdomain}
```

Returns:
```json
{
  "project": {
    "id": "uuid",
    "name": "Site Name",
    "description": "Site Description",
    "subdomain": "subdomain",
    "isPublished": true
  },
  "siteConfig": {
    "siteName": "Site Name",
    "siteDescription": "Site Description",
    "primaryColor": "#3B82F6",
    "secondaryColor": "#1E40AF",
    "accentColor": "#F59E0B",
    "backgroundColor": "#FFFFFF",
    "textColor": "#1F2937",
    "indexLayout": "grid",
    "archiveLayout": "list",
    "singleLayout": "standard",
    "metaTitle": "Meta Title",
    "metaDescription": "Meta Description",
    "favicon": "favicon-url"
  },
  "content": {
    "projects": [...],
    "blogs": [...],
    "experiences": [...],
    "other": [...]
  }
}
```

#### Content Endpoint
```
GET /api/site/{subdomain}/content/{slug}
```

Returns individual content items with full markdown content and metadata.

### Layout Selection Logic

The layout is determined by:

1. **Route Path**:
   - `/` → Home page layouts (grid/list/masonry)
   - `/projects` → ProjectsArchive
   - `/blog` → BlogArchive
   - `/blog/{slug}` → Single content layouts
   - `/project/{slug}` → Single content layouts
   - `/experience/{slug}` → Single content layouts

2. **Site Configuration**:
   - `indexLayout`: Controls home page layout
   - `singleLayout`: Controls single content page layout
   - `archiveLayout`: Controls archive page layout

3. **Available Layouts**:
   - **Home**: Grid, List, Masonry, Default
   - **Single**: Standard, Wide, Minimal
   - **Archive**: ProjectsArchive, BlogArchive

### Content Types

The system supports multiple content types:

- **PROJECT**: Portfolio projects and case studies
- **BLOG**: Blog posts and articles
- **EXPERIENCE**: Work experience and achievements
- **OTHER**: Custom content types

### Styling System

#### Dynamic CSS Variables
```css
:root {
  --primary-color: #3B82F6;
  --secondary-color: #1E40AF;
  --accent-color: #F59E0B;
  --background-color: #FFFFFF;
  --text-color: #1F2937;
}
```

#### Tailwind Integration
- Full Tailwind CSS support
- Custom utility classes
- Responsive design patterns
- Component-based styling

### Error Handling

#### Site Not Found
- Displays when subdomain doesn't exist
- Shows when site is not published
- Includes debug information in development
- Provides navigation back to Foligo

#### Content Not Found
- Handles missing content gracefully
- Shows appropriate error messages
- Maintains site navigation

#### Loading States
- Spinner animation during data fetching
- Graceful fallbacks for slow connections

### SEO Features

#### Dynamic Meta Tags
- Page titles from site configuration
- Meta descriptions from content
- Theme color from site config
- Favicon support

#### Structured Content
- Semantic HTML structure
- Proper heading hierarchy
- Accessible navigation
- Open Graph ready

## Usage

### Environment Variables

- `API_BASE_URL`: Base URL for the API (defaults to `https://api.foligo.tech`)

### Site Configuration

Each site can configure:

#### Colors
- Primary, secondary, accent colors
- Background and text colors
- Dynamic theming throughout the site

#### Layouts
- Index page layout (grid/list/masonry)
- Archive page layout (grid/list/masonry)
- Single content layout (standard/wide/minimal)

#### SEO
- Meta title and description
- Favicon URL
- Theme color

#### Content
- Projects, blogs, experiences
- Custom content types
- Markdown content support

## Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Deployment

The application is designed to run on port 80 and handle all subdomain requests. It uses Nuxt.js with SSR enabled for optimal performance and SEO.

### DNS Configuration
Configure DNS to point `*.foligo.tech` to this application.

### Site Creation
1. Create sites through the dashboard with subdomains
2. Add content through the dashboard
3. Configure colors, layouts, and SEO settings
4. Publish the site

## File Structure

```
sites/
├── app.vue                    # Root app component
├── assets/css/main.css        # Global styles
├── components/                # Layout components
│   ├── SiteNotFound.vue      # Error page
│   ├── GridLayout.vue        # Grid home layout
│   ├── ListLayout.vue        # List home layout
│   ├── MasonryLayout.vue     # Masonry home layout
│   ├── DefaultLayout.vue     # Default layout
│   ├── StandardLayout.vue    # Standard single layout
│   ├── WideLayout.vue        # Wide single layout
│   ├── MinimalLayout.vue     # Minimal single layout
│   ├── ProjectsArchive.vue   # Projects archive
│   └── BlogArchive.vue       # Blog archive
├── pages/
│   └── [...slug].vue         # Main catch-all route
├── utils/
│   ├── siteApi.js           # API service
│   └── markdownRenderer.js  # Markdown renderer
├── nuxt.config.ts           # Nuxt configuration
└── package.json             # Dependencies
```

## API Endpoints

### Site Data
- **URL**: `/api/site/{subdomain}`
- **Method**: GET
- **Description**: Fetches site configuration and content
- **Response**: Site data with project info, config, and content

### Content Data
- **URL**: `/api/site/{subdomain}/content/{slug}`
- **Method**: GET
- **Description**: Fetches individual content items
- **Response**: Full content with markdown and metadata

## Styling

The application uses a combination of:

- **Tailwind CSS**: Utility-first CSS framework
- **CSS Custom Properties**: Dynamic theming variables
- **Component Styles**: Scoped component styling
- **Responsive Design**: Mobile-first approach

## Performance

- **SSR**: Server-side rendering for SEO and performance
- **Code Splitting**: Automatic code splitting by route
- **Image Optimization**: Built-in image optimization
- **Caching**: API response caching
- **Minification**: Production build optimization

## Security

- **CORS**: Proper cross-origin resource sharing
- **XSS Protection**: Content sanitization
- **CSRF Protection**: Built-in CSRF protection
- **Content Security Policy**: CSP headers

This implementation provides a robust, scalable, and maintainable static site generator that dynamically adapts to different site configurations and content types.