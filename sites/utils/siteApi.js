// API service for site data
export class SiteApiService {
  constructor(baseUrl = 'https://api.foligo.tech') {
    this.baseUrl = baseUrl
  }

  async getSiteData(subdomain) {
    try {
      const response = await fetch(`${this.baseUrl}/api/site/${subdomain}`)
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Site not found')
        }
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      return await response.json()
    } catch (error) {
      console.error('Error fetching site data:', error)
      throw error
    }
  }

  async getContent(subdomain, slug) {
    try {
      const response = await fetch(`${this.baseUrl}/api/site/${subdomain}/content/${slug}`)
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Content not found')
        }
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      return await response.json()
    } catch (error) {
      console.error('Error fetching content:', error)
      throw error
    }
  }

  async getTemplatePreferences(siteId) {
    try {
      const response = await fetch(`${this.baseUrl}/api/site/${siteId}/template`)
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Template preferences not found')
        }
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      return await response.json()
    } catch (error) {
      console.error('Error fetching template preferences:', error)
      throw error
    }
  }

  async updateTemplatePreferences(siteId, preferences) {
    try {
      const response = await fetch(`${this.baseUrl}/api/site/${siteId}/template`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(preferences),
      })
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      return await response.json()
    } catch (error) {
      console.error('Error updating template preferences:', error)
      throw error
    }
  }

  async getAvailableTemplates() {
    try {
      const response = await fetch(`${this.baseUrl}/api/templates`)
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      return await response.json()
    } catch (error) {
      console.error('Error fetching available templates:', error)
      throw error
    }
  }

  async getTemplateDetails(templateId) {
    try {
      const response = await fetch(`${this.baseUrl}/api/templates/${templateId}`)
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Template not found')
        }
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      return await response.json()
    } catch (error) {
      console.error('Error fetching template details:', error)
      throw error
    }
  }

  async getRecommendedTemplates(content, preferences) {
    try {
      const response = await fetch(`${this.baseUrl}/api/templates/recommend`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content, preferences }),
      })
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      return await response.json()
    } catch (error) {
      console.error('Error getting template recommendations:', error)
      throw error
    }
  }

  extractSubdomain(hostname) {
    const parts = hostname.split('.')
    // Check if it's a foligo.tech subdomain
    if (parts.length >= 3 && parts[parts.length - 2] === 'foligo' && parts[parts.length - 1] === 'tech') {
      return parts[0]
    }
    return null
  }

  async generateTemplatePreview(templateId, content) {
    try {
      const response = await fetch(`${this.baseUrl}/api/templates/${templateId}/preview`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(content),
      })
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      return await response.json()
    } catch (error) {
      console.error('Error generating template preview:', error)
      throw error
    }
  }

  async updateSiteConfig(siteId, config) {
    try {
      const response = await fetch(`${this.baseUrl}/api/sites/${siteId}/config`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(config),
      })
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      return await response.json()
    } catch (error) {
      console.error('Error updating site configuration:', error)
      throw error
    }
  }
}

// Create a singleton instance
export const siteApi = new SiteApiService()
