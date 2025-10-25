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

  extractSubdomain(hostname) {
    const parts = hostname.split('.')
    // Check if it's a foligo.tech subdomain
    if (parts.length >= 3 && parts[parts.length - 2] === 'foligo' && parts[parts.length - 1] === 'tech') {
      return parts[0]
    }
    return null
  }
}

// Create a singleton instance
export const siteApi = new SiteApiService()
