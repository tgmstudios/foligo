# Enhanced Public Endpoints - Full JSON Structure

## Summary of Changes

The public endpoints now return complete information including **tags**, **skills**, and **content links** with full details.

---

## 1. Tags Structure

Tags are returned as an array on each content item:

```json
{
  "tags": [
    {
      "id": "990e8400-e29b-41d4-a716-446655440000",
      "name": "API Integration",
      "category": "Technology"
    },
    {
      "id": "aa0e8400-e29b-41d4-a716-446655440001",
      "name": "First Place Winner",
      "category": "Achievement"
    },
    {
      "id": "bb0e8400-e29b-41d4-a716-446655440002",
      "name": "Hackathon",
      "category": "Event Type"
    },
    {
      "id": "cc0e8400-e29b-41d4-a716-446655440003",
      "name": "Mobile Development",
      "category": "Development"
    },
    {
      "id": "dd0e8400-e29b-41d4-a716-446655440004",
      "name": "AI/ML",
      "category": "Technology"
    },
    {
      "id": "ee0e8400-e29b-41d4-a716-446655440005",
      "name": "UI/UX Design",
      "category": "Design"
    }
  ]
}
```

**Available on:** All content types (PROJECT, BLOG, EXPERIENCE, SKILL)

---

## 2. Skills Structure

Skills are returned as `linkedSkills` array on each content item:

```json
{
  "linkedSkills": [
    {
      "id": "ff0e8400-e29b-41d4-a716-446655440000",
      "name": "Node.js",
      "category": "Backend"
    },
    {
      "id": "110e8400-e29b-41d4-a716-446655440001",
      "name": "Oracle Cloud Infrastructure",
      "category": "Cloud"
    },
    {
      "id": "220e8400-e29b-41d4-a716-446655440002",
      "name": "Rancher",
      "category": "DevOps"
    },
    {
      "id": "330e8400-e29b-41d4-a716-446655440003",
      "name": "Kubernetes",
      "category": "DevOps"
    },
    {
      "id": "440e8400-e29b-41d4-a716-446655440004",
      "name": "Express.js",
      "category": "Frameworks"
    },
    {
      "id": "550e8400-e29b-41d4-a716-446655440005",
      "name": "SwiftUI",
      "category": "Mobile"
    },
    {
      "id": "660e8400-e29b-41d4-a716-446655440006",
      "name": "OpenAI API",
      "category": "APIs"
    },
    {
      "id": "770e8400-e29b-41d4-a716-446655440007",
      "name": "GitHub",
      "category": "Tools"
    }
  ]
}
```

**Available on:** All content types (PROJECT, BLOG, EXPERIENCE, SKILL)

**Note:** For EXPERIENCE content, skills can also appear nested within `roles[].skills[]`.

---

## 3. Content Links Structure

Content links are returned in two places:

### A. On Individual Content Items (`contentLinks` array)

```json
{
  "contentLinks": [
    {
      "id": "880e8400-e29b-41d4-a716-446655440000",
      "sourceId": "660e8400-e29b-41d4-a716-446655440001",
      "targetId": "990e8400-e29b-41d4-a716-446655440002",
      "sourceType": "content",
      "targetType": "content",
      "linkType": "related",
      "createdAt": "2024-01-20T10:00:00Z",
      "updatedAt": "2024-01-20T10:00:00Z",
      "linkedContent": {
        "id": "990e8400-e29b-41d4-a716-446655440002",
        "title": "Campus Calendar: AI-Powered University Event Hub",
        "slug": "campus-calendar-ai-powered-university-event-hub",
        "excerpt": "An AI-powered event management system for universities",
        "contentType": "PROJECT"
      }
    },
    {
      "id": "aa0e8400-e29b-41d4-a716-446655440001",
      "sourceId": "660e8400-e29b-41d4-a716-446655440001",
      "targetId": "bb0e8400-e29b-41d4-a716-446655440003",
      "sourceType": "content",
      "targetType": "content",
      "linkType": "related",
      "createdAt": "2024-01-21T10:00:00Z",
      "updatedAt": "2024-01-21T10:00:00Z",
      "linkedContent": {
        "id": "bb0e8400-e29b-41d4-a716-446655440003",
        "title": "EyeCook: AI-Powered AR Cooking Assistant",
        "slug": "eyecook-ai-powered-ar-cooking-assistant",
        "excerpt": "An AR cooking assistant powered by AI",
        "contentType": "PROJECT"
      }
    },
    {
      "id": "cc0e8400-e29b-41d4-a716-446655440002",
      "sourceId": "660e8400-e29b-41d4-a716-446655440001",
      "targetId": "dd0e8400-e29b-41d4-a716-446655440004",
      "sourceType": "content",
      "targetType": "content",
      "linkType": "prerequisite",
      "createdAt": "2024-01-22T10:00:00Z",
      "updatedAt": "2024-01-22T10:00:00Z",
      "linkedContent": {
        "id": "dd0e8400-e29b-41d4-a716-446655440004",
        "title": "Nittany AI Machine Learning Bootcamp",
        "slug": "nittany-ai-machine-learning-bootcamp",
        "excerpt": "Intensive machine learning training program",
        "contentType": "EXPERIENCE"
      }
    }
  ]
}
```

### B. In Site Data Response (root level `contentLinks` array)

The same structure is available at the root level of `/api/site/{subdomain}` response, containing all links for all content.

**Link Types:**
- `"related"` - Related content
- `"prerequisite"` - Prerequisite content
- `"parent"` - Parent content
- `"child"` - Child content
- `"linked"` - General link

**Available on:** All content types (PROJECT, BLOG, EXPERIENCE, SKILL)

---

## Complete Example: Full Content Item Response

Here's a complete example of a PROJECT content item with all fields:

```json
{
  "id": "660e8400-e29b-41d4-a716-446655440001",
  "projectId": "550e8400-e29b-41d4-a716-446655440000",
  "type": "PROJECT",
  "contentType": "PROJECT",
  "title": "My Awesome Project",
  "slug": "my-awesome-project",
  "excerpt": "A full-stack e-commerce solution built with React and Node.js",
  "content": "# My Awesome Project\n\nFull markdown content here...",
  "metadata": {},
  "order": 0,
  "status": "PUBLISHED",
  "isPublished": true,
  "startDate": "2023-06-01T00:00:00Z",
  "endDate": "2023-12-31T00:00:00Z",
  "isOngoing": false,
  "featuredImage": "https://example.com/project-image.jpg",
  "projectLinks": {
    "github": "https://github.com/user/project",
    "devpost": "https://devpost.com/software/project",
    "other": ["https://example.com/demo"]
  },
  "contributors": ["John Doe", "Jane Smith"],
  "tags": [
    {
      "id": "990e8400-e29b-41d4-a716-446655440000",
      "name": "API Integration",
      "category": "Technology"
    },
    {
      "id": "aa0e8400-e29b-41d4-a716-446655440001",
      "name": "Hackathon",
      "category": "Event Type"
    }
  ],
  "linkedSkills": [
    {
      "id": "ff0e8400-e29b-41d4-a716-446655440000",
      "name": "Node.js",
      "category": "Backend"
    },
    {
      "id": "110e8400-e29b-41d4-a716-446655440001",
      "name": "React",
      "category": "Frameworks"
    }
  ],
  "roles": [],
  "contentLinks": [
    {
      "id": "880e8400-e29b-41d4-a716-446655440000",
      "sourceId": "660e8400-e29b-41d4-a716-446655440001",
      "targetId": "990e8400-e29b-41d4-a716-446655440002",
      "sourceType": "content",
      "targetType": "content",
      "linkType": "related",
      "createdAt": "2024-01-20T10:00:00Z",
      "updatedAt": "2024-01-20T10:00:00Z",
      "linkedContent": {
        "id": "990e8400-e29b-41d4-a716-446655440002",
        "title": "Related Project",
        "slug": "related-project",
        "excerpt": "A related project description",
        "contentType": "PROJECT"
      }
    }
  ],
  "createdAt": "2024-01-15T10:00:00Z",
  "updatedAt": "2024-01-20T15:30:00Z"
}
```

---

## Usage Examples

### Get all tags from a site:
```javascript
const response = await fetch(`/api/site/my-portfolio`);
const data = await response.json();

const allTags = new Map();
[...data.content.projects, ...data.content.blogs, ...data.content.experiences]
  .forEach(item => {
    item.tags?.forEach(tag => allTags.set(tag.id, tag));
  });

const uniqueTags = Array.from(allTags.values());
```

### Get all skills from a site:
```javascript
const response = await fetch(`/api/site/my-portfolio`);
const data = await response.json();

const allSkills = new Map();
[...data.content.projects, ...data.content.blogs, ...data.content.experiences]
  .forEach(item => {
    item.linkedSkills?.forEach(skill => allSkills.set(skill.id, skill));
  });

const uniqueSkills = Array.from(allSkills.values());
```

### Get related content for a specific item:
```javascript
const response = await fetch(`/api/site/my-portfolio/content/my-project`);
const data = await response.json();

const relatedContent = data.contentLinks
  .filter(link => link.linkType === 'related')
  .map(link => link.linkedContent);
```

---

## Endpoints

- **GET** `/api/site/{subdomain}` - Returns all content with tags, skills, and links
- **GET** `/api/site/{subdomain}/content/{slug}` - Returns individual content with full details

Both endpoints are public (no authentication required) and only return published content.

