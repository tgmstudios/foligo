// Composable for subdomain extraction
export const useSubdomain = () => {
  const extractSubdomain = () => {
    let host = ''
    
    if (process.client) {
      host = window.location.hostname
    } else if (process.server) {
      const headers = useRequestHeaders()
      host = headers.host || headers['x-forwarded-host'] || ''
    }
    
    if (!host) {
      return null
    }
    
    // Development fallback - if we're on localhost, use 'test' as subdomain
    if (host === 'localhost' || host === '127.0.0.1' || host.includes('localhost')) {
      return 'test'
    }
    
    const parts = host.split('.')
    // Check if it's a foligo.tech subdomain
    if (parts.length >= 3 && parts[parts.length - 2] === 'foligo' && parts[parts.length - 1] === 'tech') {
      return parts[0]
    }
    
    return null
  }

  return {
    extractSubdomain
  }
}
