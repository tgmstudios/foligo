# API Documentation: Post Types & Content Retrieval

Complete guide for integrating with the Content API to retrieve all post types.

## Table of Contents

1. [Overview](#overview)
2. [Base URL](#base-url)
3. [Authentication](#authentication)
4. [Post Types](#post-types)
5. [Public Endpoints](#public-endpoints)
6. [Authenticated Endpoints](#authenticated-endpoints)
7. [Response Formats](#response-formats)
8. [Sample Responses](#sample-responses)
9. [Error Handling](#error-handling)
10. [Integration Examples](#integration-examples)

---

## Overview

The API provides endpoints to retrieve different types of content (posts) from projects. Content types include:
- **PROJECT**: Portfolio projects and case studies
- **BLOG**: Blog posts and articles
- **EXPERIENCE**: Work experience, education, and certifications
- **SKILL**: Skills and technologies

---

## Base URL

```
https://your-api-domain.com/api
```

For local development:
```
http://localhost:3000/api
```

---

## Authentication

### Public Endpoints (No Authentication Required)
- `/api/site/{subdomain}` - Get site data and all published content
- `/api/site/{subdomain}/content/{slug}` - Get individual content by slug
- `/api/projects/{projectId}/content` - Get all content for a project

### Authenticated Endpoints (Bearer Token Required)
- `/api/content/{id}` - Get specific content with full details
- `/api/admin/content` - Admin content management

**Authentication Header:**
```
Authorization: Bearer {your-jwt-token}
```

---

## Post Types

### 1. PROJECT
Portfolio projects showcasing work, case studies, and technical projects.

**Specific Fields:**
- `startDate` (DateTime, optional)
- `endDate` (DateTime, optional)
- `isOngoing` (Boolean, default: false)
- `featuredImage` (String, optional) - URL to featured image
- `projectLinks` (JSON, optional) - Object with:
  - `github` (String, optional)
  - `devpost` (String, optional)
  - `other` (Array of Strings, optional)
- `contributors` (Array of Strings, optional)

### 2. BLOG
Blog posts and articles.

**Specific Fields:**
- Standard content fields only
- Uses markdown for content

### 3. EXPERIENCE
Work experience, education, and certifications.

**Specific Fields:**
- `experienceCategory` (Enum: JOB, EDUCATION, CERTIFICATION)
- `location` (String, optional)
- `locationType` (Enum: REMOTE, HYBRID, ONSITE, optional)
- `startDate` (DateTime, optional)
- `endDate` (DateTime, optional)
- `isOngoing` (Boolean, default: false)
- `roles` (Array of ExperienceRole, optional) - Multiple roles within an experience

### 4. SKILL
Skills and technologies.

**Specific Fields:**
- Standard content fields
- Can be linked to projects and experiences

---

## Public Endpoints

### 1. Get Site Data (All Content by Type)

Retrieve all published content for a site, grouped by type.

**Endpoint:**
```
GET /api/site/{subdomain}
```

**Parameters:**
- `subdomain` (path, required) - The subdomain of the site (e.g., "my-portfolio")

**Response:**
Returns site configuration and all published content grouped by type.

**Example Request:**
```bash
curl https://your-api-domain.com/api/site/my-portfolio
```

**Example Response:**
```json
{
  "project": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "My Portfolio",
    "description": "Personal portfolio website",
    "subdomain": "my-portfolio",
    "isPublished": true
  },
  "siteConfig": {
    "siteName": "My Portfolio",
    "siteDescription": "Personal portfolio website",
    "profileName": "John Doe",
    "profileBio": "Full-stack developer",
    "profileImage": "https://example.com/profile.jpg",
    "primaryColor": "#3B82F6",
    "secondaryColor": "#1E40AF",
    "accentColor": "#F59E0B",
    "backgroundColor": "#FFFFFF",
    "textColor": "#1F2937",
    "indexLayout": "grid",
    "archiveLayout": "list",
    "singleLayout": "standard",
    "metaTitle": "My Portfolio",
    "metaDescription": "Personal portfolio",
    "favicon": "https://example.com/favicon.ico",
    "socialLinks": {
      "github": "https://github.com/johndoe",
      "linkedin": "https://linkedin.com/in/johndoe",
      "twitter": "https://twitter.com/johndoe"
    }
  },
  "content": {
    "projects": [
      {
        "id": "660e8400-e29b-41d4-a716-446655440001",
        "title": "E-Commerce Platform",
        "slug": "e-commerce-platform",
        "excerpt": "A full-stack e-commerce solution built with React and Node.js",
        "contentType": "PROJECT",
        "content": "# E-Commerce Platform\n\nFull markdown content here...",
        "metadata": {},
        "isPublished": true,
        "createdAt": "2024-01-15T10:00:00Z",
        "updatedAt": "2024-01-20T15:30:00Z"
      }
    ],
    "blogs": [
      {
        "id": "770e8400-e29b-41d4-a716-446655440002",
        "title": "Getting Started with React",
        "slug": "getting-started-with-react",
        "excerpt": "A beginner's guide to React development",
        "contentType": "BLOG",
        "content": "# Getting Started with React\n\nBlog content...",
        "metadata": {},
        "isPublished": true,
        "createdAt": "2024-02-01T09:00:00Z",
        "updatedAt": "2024-02-01T09:00:00Z"
      }
    ],
    "experiences": [
      {
        "id": "880e8400-e29b-41d4-a716-446655440003",
        "title": "Senior Software Engineer",
        "slug": "senior-software-engineer",
        "excerpt": "Led development of multiple web applications",
        "contentType": "EXPERIENCE",
        "content": "# Senior Software Engineer\n\nExperience details...",
        "metadata": {},
        "isPublished": true,
        "createdAt": "2024-01-10T08:00:00Z",
        "updatedAt": "2024-01-10T08:00:00Z"
      }
    ],
    "other": []
  }
}
```

---

### 2. Get Individual Content by Slug

Retrieve a single published content item by its slug.

**Endpoint:**
```
GET /api/site/{subdomain}/content/{slug}
```

**Parameters:**
- `subdomain` (path, required) - The subdomain of the site
- `slug` (path, required) - The slug of the content

**Example Request:**
```bash
curl https://your-api-domain.com/api/site/my-portfolio/content/e-commerce-platform
```

**Example Response:**
```json
{
  "id": "660e8400-e29b-41d4-a716-446655440001",
  "projectId": "550e8400-e29b-41d4-a716-446655440000",
  "type": "PROJECT",
  "contentType": "PROJECT",
  "title": "E-Commerce Platform",
  "slug": "e-commerce-platform",
  "excerpt": "A full-stack e-commerce solution built with React and Node.js",
  "content": "# E-Commerce Platform\n\nFull markdown content here...",
  "metadata": {},
  "order": 0,
  "status": "PUBLISHED",
  "startDate": "2023-06-01T00:00:00Z",
  "endDate": "2023-12-31T00:00:00Z",
  "isOngoing": false,
  "featuredImage": "https://example.com/project-image.jpg",
  "projectLinks": {
    "github": "https://github.com/johndoe/ecommerce",
    "devpost": "https://devpost.com/software/ecommerce-platform",
    "other": ["https://example.com/demo"]
  },
  "contributors": ["John Doe", "Jane Smith"],
  "createdAt": "2024-01-15T10:00:00Z",
  "updatedAt": "2024-01-20T15:30:00Z"
}
```

---

### 3. Get All Content for a Project

Retrieve all content (published and unpublished) for a specific project by project ID.

**Endpoint:**
```
GET /api/projects/{projectId}/content
```

**Parameters:**
- `projectId` (path, required) - The UUID of the project

**Note:** This endpoint returns ALL content regardless of status. Use the site endpoint for published content only.

**Example Request:**
```bash
curl https://your-api-domain.com/api/projects/550e8400-e29b-41d4-a716-446655440000/content
```

**Example Response:**
```json
[
  {
    "id": "660e8400-e29b-41d4-a716-446655440001",
    "projectId": "550e8400-e29b-41d4-a716-446655440000",
    "type": "PROJECT",
    "contentType": "PROJECT",
    "title": "E-Commerce Platform",
    "slug": "e-commerce-platform",
    "excerpt": "A full-stack e-commerce solution",
    "content": "# E-Commerce Platform\n\nContent...",
    "metadata": {},
    "order": 0,
    "status": "PUBLISHED",
    "createdAt": "2024-01-15T10:00:00Z",
    "updatedAt": "2024-01-20T15:30:00Z"
  }
]
```

---

## Authenticated Endpoints

### 1. Get Content by ID (Full Details)

Retrieve a single content item with all relationships and details.

**Endpoint:**
```
GET /api/content/{id}
```

**Headers:**
```
Authorization: Bearer {your-jwt-token}
```

**Parameters:**
- `id` (path, required) - The UUID of the content

**Example Request:**
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  https://your-api-domain.com/api/content/660e8400-e29b-41d4-a716-446655440001
```

**Example Response:**
```json
{
  "id": "660e8400-e29b-41d4-a716-446655440001",
  "projectId": "550e8400-e29b-41d4-a716-446655440000",
  "type": "PROJECT",
  "contentType": "PROJECT",
  "title": "E-Commerce Platform",
  "slug": "e-commerce-platform",
  "excerpt": "A full-stack e-commerce solution built with React and Node.js",
  "content": "# E-Commerce Platform\n\nFull markdown content here...",
  "metadata": {},
  "order": 0,
  "status": "PUBLISHED",
  "revisionOf": null,
  "revisionNumber": null,
  "revisedAt": null,
  "startDate": "2023-06-01T00:00:00Z",
  "endDate": "2023-12-31T00:00:00Z",
  "isOngoing": false,
  "featuredImage": "https://example.com/project-image.jpg",
  "projectLinks": {
    "github": "https://github.com/johndoe/ecommerce",
    "devpost": "https://devpost.com/software/ecommerce-platform",
    "other": ["https://example.com/demo"]
  },
  "contributors": ["John Doe", "Jane Smith"],
  "createdAt": "2024-01-15T10:00:00Z",
  "updatedAt": "2024-01-20T15:30:00Z",
  "project": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "My Portfolio",
    "description": "Personal portfolio website",
    "owner": {
      "id": "440e8400-e29b-41d4-a716-446655440000",
      "name": "John Doe",
      "email": "john@example.com"
    },
    "members": []
  },
  "tags": [
    {
      "id": "990e8400-e29b-41d4-a716-446655440000",
      "name": "React",
      "category": "Frameworks"
    },
    {
      "id": "aa0e8400-e29b-41d4-a716-446655440001",
      "name": "Node.js",
      "category": "Backend"
    }
  ],
  "meta": [
    {
      "id": "bb0e8400-e29b-41d4-a716-446655440000",
      "key": "seo_keywords",
      "value": "ecommerce, react, nodejs",
      "contentType": "string"
    }
  ],
  "blocks": [
    {
      "id": "cc0e8400-e29b-41d4-a716-446655440000",
      "type": "IMAGE",
      "content": "{\"url\":\"https://example.com/image.jpg\",\"alt\":\"Screenshot\"}",
      "order": 0,
      "createdAt": "2024-01-15T10:00:00Z",
      "updatedAt": "2024-01-15T10:00:00Z"
    }
  ],
  "roles": [],
  "linkedSkills": [
    {
      "id": "dd0e8400-e29b-41d4-a716-446655440000",
      "name": "JavaScript",
      "category": "Programming Languages"
    },
    {
      "id": "ee0e8400-e29b-41d4-a716-446655440001",
      "name": "TypeScript",
      "category": "Programming Languages"
    }
  ]
}
```

---

### 2. Admin: Get All Content (with Filtering)

Retrieve all content across all projects with filtering and pagination (Admin only).

**Endpoint:**
```
GET /api/admin/content
```

**Headers:**
```
Authorization: Bearer {your-admin-jwt-token}
```

**Query Parameters:**
- `page` (integer, optional, default: 1) - Page number
- `limit` (integer, optional, default: 50, max: 100) - Items per page
- `search` (string, optional) - Search in title, excerpt, and slug
- `contentType` (enum, optional) - Filter by type: `PROJECT`, `BLOG`, `EXPERIENCE`, `SKILL`
- `status` (enum, optional) - Filter by status: `DRAFT`, `PUBLISHED`, `HIDDEN`, `REVISION`

**Example Request:**
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  "https://your-api-domain.com/api/admin/content?page=1&limit=20&contentType=PROJECT&status=PUBLISHED"
```

**Example Response:**
```json
{
  "content": [
    {
      "id": "660e8400-e29b-41d4-a716-446655440001",
      "projectId": "550e8400-e29b-41d4-a716-446655440000",
      "type": "PROJECT",
      "contentType": "PROJECT",
      "title": "E-Commerce Platform",
      "slug": "e-commerce-platform",
      "excerpt": "A full-stack e-commerce solution",
      "content": "# E-Commerce Platform\n\nContent...",
      "metadata": {},
      "order": 0,
      "status": "PUBLISHED",
      "createdAt": "2024-01-15T10:00:00Z",
      "updatedAt": "2024-01-20T15:30:00Z",
      "project": {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "name": "My Portfolio",
        "subdomain": "my-portfolio"
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "pages": 3
  }
}
```

---

## Response Formats

### Content Status Values
- `DRAFT` - Content is not published
- `PUBLISHED` - Content is live and visible
- `HIDDEN` - Content is published but hidden from public view
- `REVISION` - Content is a revision of another content item

### Content Type Values
- `PROJECT` - Portfolio project
- `BLOG` - Blog post
- `EXPERIENCE` - Work experience, education, or certification
- `SKILL` - Skill or technology

### Experience Category Values
- `JOB` - Employment position
- `EDUCATION` - Educational experience
- `CERTIFICATION` - Professional certification

### Location Type Values
- `REMOTE` - Remote work
- `HYBRID` - Hybrid work arrangement
- `ONSITE` - On-site work

### Content Block Types
- `TEXT` - Text block
- `IMAGE` - Image block
- `VIDEO` - Video block
- `CODE` - Code block
- `LINK` - Link block
- `EMBED` - Embedded content
- `GALLERY` - Image gallery
- `QUOTE` - Quote block
- `CUSTOM` - Custom block type

---

## Sample Responses

### PROJECT Type Response

```json
{
  "id": "660e8400-e29b-41d4-a716-446655440001",
  "projectId": "550e8400-e29b-41d4-a716-446655440000",
  "type": "PROJECT",
  "contentType": "PROJECT",
  "title": "E-Commerce Platform",
  "slug": "e-commerce-platform",
  "excerpt": "A full-stack e-commerce solution built with React and Node.js",
  "content": "# E-Commerce Platform\n\n## Overview\n\nThis project is a complete e-commerce solution...",
  "metadata": {},
  "order": 0,
  "status": "PUBLISHED",
  "startDate": "2023-06-01T00:00:00Z",
  "endDate": "2023-12-31T00:00:00Z",
  "isOngoing": false,
  "featuredImage": "https://example.com/project-image.jpg",
  "projectLinks": {
    "github": "https://github.com/johndoe/ecommerce",
    "devpost": "https://devpost.com/software/ecommerce-platform",
    "other": ["https://example.com/demo", "https://example.com/live"]
  },
  "contributors": ["John Doe", "Jane Smith"],
  "createdAt": "2024-01-15T10:00:00Z",
  "updatedAt": "2024-01-20T15:30:00Z",
  "tags": [
    {
      "id": "990e8400-e29b-41d4-a716-446655440000",
      "name": "React",
      "category": "Frameworks"
    }
  ],
  "linkedSkills": [
    {
      "id": "dd0e8400-e29b-41d4-a716-446655440000",
      "name": "JavaScript",
      "category": "Programming Languages"
    }
  ]
}
```

---

### BLOG Type Response

```json
{
  "id": "770e8400-e29b-41d4-a716-446655440002",
  "projectId": "550e8400-e29b-41d4-a716-446655440000",
  "type": "BLOG",
  "contentType": "BLOG",
  "title": "Getting Started with React",
  "slug": "getting-started-with-react",
  "excerpt": "A beginner's guide to React development",
  "content": "# Getting Started with React\n\n## Introduction\n\nReact is a powerful JavaScript library...",
  "metadata": {},
  "order": 0,
  "status": "PUBLISHED",
  "createdAt": "2024-02-01T09:00:00Z",
  "updatedAt": "2024-02-01T09:00:00Z",
  "tags": [
    {
      "id": "990e8400-e29b-41d4-a716-446655440000",
      "name": "React",
      "category": "Frameworks"
    },
    {
      "id": "ff0e8400-e29b-41d4-a716-446655440000",
      "name": "Tutorial",
      "category": "Content Type"
    }
  ]
}
```

---

### EXPERIENCE Type Response

```json
{
  "id": "880e8400-e29b-41d4-a716-446655440003",
  "projectId": "550e8400-e29b-41d4-a716-446655440000",
  "type": "EXPERIENCE",
  "contentType": "EXPERIENCE",
  "title": "Senior Software Engineer",
  "slug": "senior-software-engineer",
  "excerpt": "Led development of multiple web applications",
  "content": "# Senior Software Engineer\n\n## Company: Tech Corp\n\nLed a team of developers...",
  "metadata": {},
  "order": 0,
  "status": "PUBLISHED",
  "experienceCategory": "JOB",
  "location": "San Francisco, CA",
  "locationType": "HYBRID",
  "startDate": "2022-01-01T00:00:00Z",
  "endDate": null,
  "isOngoing": true,
  "createdAt": "2024-01-10T08:00:00Z",
  "updatedAt": "2024-01-10T08:00:00Z",
  "roles": [
    {
      "id": "110e8400-e29b-41d4-a716-446655440000",
      "title": "Senior Software Engineer",
      "description": "Led development of core features",
      "startDate": "2022-01-01T00:00:00Z",
      "endDate": null,
      "isCurrent": true,
      "skills": [
        {
          "id": "dd0e8400-e29b-41d4-a716-446655440000",
          "name": "JavaScript",
          "category": "Programming Languages"
        }
      ]
    }
  ],
  "linkedSkills": [
    {
      "id": "dd0e8400-e29b-41d4-a716-446655440000",
      "name": "JavaScript",
      "category": "Programming Languages"
    },
    {
      "id": "ee0e8400-e29b-41d4-a716-446655440001",
      "name": "TypeScript",
      "category": "Programming Languages"
    }
  ]
}
```

---

### SKILL Type Response

```json
{
  "id": "990e8400-e29b-41d4-a716-446655440004",
  "projectId": "550e8400-e29b-41d4-a716-446655440000",
  "type": "SKILL",
  "contentType": "SKILL",
  "title": "React",
  "slug": "react",
  "excerpt": "JavaScript library for building user interfaces",
  "content": "# React\n\nReact is a declarative, efficient, and flexible JavaScript library...",
  "metadata": {},
  "order": 0,
  "status": "PUBLISHED",
  "createdAt": "2024-01-05T10:00:00Z",
  "updatedAt": "2024-01-05T10:00:00Z",
  "linkedSkills": []
}
```

---

## Error Handling

### Error Response Format

```json
{
  "error": "Error Type",
  "message": "Human-readable error message",
  "details": [] // Optional: Array of validation errors
}
```

### Common Error Codes

- `400` - Bad Request (validation errors)
- `401` - Unauthorized (missing or invalid token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found (resource doesn't exist)
- `500` - Internal Server Error

### Example Error Responses

**404 Not Found:**
```json
{
  "error": "Site not found"
}
```

**403 Forbidden:**
```json
{
  "error": "Access Denied",
  "message": "You do not have access to this content"
}
```

**400 Validation Error:**
```json
{
  "error": "Validation Error",
  "message": "Invalid query parameters",
  "details": [
    {
      "field": "contentType",
      "message": "contentType must be one of: PROJECT, BLOG, EXPERIENCE, SKILL"
    }
  ]
}
```

---

## Integration Examples

### JavaScript/TypeScript (Fetch API)

```javascript
// Get all content for a site
async function getSiteContent(subdomain) {
  const response = await fetch(`https://your-api-domain.com/api/site/${subdomain}`);
  const data = await response.json();
  
  return {
    projects: data.content.projects,
    blogs: data.content.blogs,
    experiences: data.content.experiences
  };
}

// Get individual content by slug
async function getContentBySlug(subdomain, slug) {
  const response = await fetch(
    `https://your-api-domain.com/api/site/${subdomain}/content/${slug}`
  );
  
  if (!response.ok) {
    throw new Error(`Failed to fetch content: ${response.statusText}`);
  }
  
  return await response.json();
}

// Get all projects
async function getAllProjects(subdomain) {
  const data = await getSiteContent(subdomain);
  return data.projects;
}

// Get all blog posts
async function getAllBlogs(subdomain) {
  const data = await getSiteContent(subdomain);
  return data.blogs;
}

// Get all experiences
async function getAllExperiences(subdomain) {
  const data = await getSiteContent(subdomain);
  return data.experiences;
}

// Usage
(async () => {
  try {
    const projects = await getAllProjects('my-portfolio');
    console.log('Projects:', projects);
    
    const blogPost = await getContentBySlug('my-portfolio', 'getting-started-with-react');
    console.log('Blog Post:', blogPost);
  } catch (error) {
    console.error('Error:', error);
  }
})();
```

---

### JavaScript/TypeScript (Axios)

```javascript
import axios from 'axios';

const api = axios.create({
  baseURL: 'https://your-api-domain.com/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add auth token for authenticated requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Get site content
export const getSiteContent = async (subdomain) => {
  const { data } = await api.get(`/site/${subdomain}`);
  return data;
};

// Get content by slug
export const getContentBySlug = async (subdomain, slug) => {
  const { data } = await api.get(`/site/${subdomain}/content/${slug}`);
  return data;
};

// Get content by ID (authenticated)
export const getContentById = async (id) => {
  const { data } = await api.get(`/content/${id}`);
  return data;
};

// Get all content with filtering (admin)
export const getAllContent = async (filters = {}) => {
  const { data } = await api.get('/admin/content', { params: filters });
  return data;
};
```

---

### Python (Requests)

```python
import requests
from typing import Optional, Dict, List

class ContentAPI:
    def __init__(self, base_url: str, token: Optional[str] = None):
        self.base_url = base_url.rstrip('/')
        self.token = token
        self.headers = {
            'Content-Type': 'application/json'
        }
        if token:
            self.headers['Authorization'] = f'Bearer {token}'
    
    def get_site_content(self, subdomain: str) -> Dict:
        """Get all content for a site grouped by type."""
        response = requests.get(
            f'{self.base_url}/api/site/{subdomain}',
            headers=self.headers
        )
        response.raise_for_status()
        return response.json()
    
    def get_content_by_slug(self, subdomain: str, slug: str) -> Dict:
        """Get individual content by slug."""
        response = requests.get(
            f'{self.base_url}/api/site/{subdomain}/content/{slug}',
            headers=self.headers
        )
        response.raise_for_status()
        return response.json()
    
    def get_content_by_id(self, content_id: str) -> Dict:
        """Get content by ID (requires authentication)."""
        response = requests.get(
            f'{self.base_url}/api/content/{content_id}',
            headers=self.headers
        )
        response.raise_for_status()
        return response.json()
    
    def get_all_projects(self, subdomain: str) -> List[Dict]:
        """Get all projects for a site."""
        data = self.get_site_content(subdomain)
        return data['content']['projects']
    
    def get_all_blogs(self, subdomain: str) -> List[Dict]:
        """Get all blog posts for a site."""
        data = self.get_site_content(subdomain)
        return data['content']['blogs']
    
    def get_all_experiences(self, subdomain: str) -> List[Dict]:
        """Get all experiences for a site."""
        data = self.get_site_content(subdomain)
        return data['content']['experiences']

# Usage
api = ContentAPI('https://your-api-domain.com')

# Get all projects
projects = api.get_all_projects('my-portfolio')
print(f'Found {len(projects)} projects')

# Get specific blog post
blog = api.get_content_by_slug('my-portfolio', 'getting-started-with-react')
print(f'Blog: {blog["title"]}')
```

---

### React Hook Example

```typescript
import { useState, useEffect } from 'react';

interface Content {
  id: string;
  title: string;
  slug: string;
  excerpt?: string;
  contentType: 'PROJECT' | 'BLOG' | 'EXPERIENCE' | 'SKILL';
  content: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

interface SiteContent {
  projects: Content[];
  blogs: Content[];
  experiences: Content[];
  other: Content[];
}

export function useSiteContent(subdomain: string) {
  const [content, setContent] = useState<SiteContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function fetchContent() {
      try {
        setLoading(true);
        const response = await fetch(
          `https://your-api-domain.com/api/site/${subdomain}`
        );
        
        if (!response.ok) {
          throw new Error(`Failed to fetch: ${response.statusText}`);
        }
        
        const data = await response.json();
        setContent(data.content);
        setError(null);
      } catch (err) {
        setError(err as Error);
        setContent(null);
      } finally {
        setLoading(false);
      }
    }

    if (subdomain) {
      fetchContent();
    }
  }, [subdomain]);

  return { content, loading, error };
}

// Usage in component
function ProjectsList({ subdomain }: { subdomain: string }) {
  const { content, loading, error } = useSiteContent(subdomain);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;
  if (!content) return null;

  return (
    <div>
      <h2>Projects</h2>
      {content.projects.map((project) => (
        <div key={project.id}>
          <h3>{project.title}</h3>
          <p>{project.excerpt}</p>
        </div>
      ))}
    </div>
  );
}
```

---

## Summary

### Quick Reference

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/site/{subdomain}` | GET | No | Get all published content grouped by type |
| `/api/site/{subdomain}/content/{slug}` | GET | No | Get individual content by slug |
| `/api/projects/{projectId}/content` | GET | No | Get all content for a project |
| `/api/content/{id}` | GET | Yes | Get content by ID with full details |
| `/api/admin/content` | GET | Yes | Get all content with filtering (admin) |

### Content Types
- **PROJECT**: Portfolio projects with dates, links, contributors
- **BLOG**: Blog posts with markdown content
- **EXPERIENCE**: Work/education with roles, location, dates
- **SKILL**: Skills and technologies

### Key Fields
- All types: `id`, `title`, `slug`, `excerpt`, `content`, `status`, `createdAt`, `updatedAt`
- PROJECT: `startDate`, `endDate`, `featuredImage`, `projectLinks`, `contributors`
- EXPERIENCE: `experienceCategory`, `location`, `locationType`, `roles`

---

**Last Updated:** 2024-01-20

For questions or issues, please refer to the main API documentation or contact support.

