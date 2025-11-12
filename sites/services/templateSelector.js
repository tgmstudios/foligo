const TEMPLATE_STYLES = {
  ELEGANT: 'elegant',
  STUDIO: 'studio',
  CREATIVE: 'creative',
  MINIMALIST: 'minimalist',
  DESIGNER: 'designer',
  UX_PRODUCT: 'ux_product',
  PLAYFUL: 'playful',
  STRAIGHTFORWARD: 'straightforward',
  TIMELESS: 'timeless',
  BOLD: 'bold',
  UI_UX: 'ui_ux',
  ILLUSTRATOR: 'illustrator'
};

const TEMPLATE_CONFIGS = {
  guglieri: {
    id: 'guglieri',
    name: 'Elegant Personal Portfolio',
    style: TEMPLATE_STYLES.ELEGANT,
    features: ['fixed-header', 'social-icons', 'work-grid', 'serif-fonts'],
    bestFor: ['personal-brand', 'creative-director', 'design-lead'],
    contentPriority: ['biography', 'projects', 'social'],
  },
  analogue: {
    id: 'analogue',
    name: 'Studio Branding Portfolio',
    style: TEMPLATE_STYLES.STUDIO,
    features: ['fixed-nav', 'case-studies', 'pricing', 'services-grid'],
    bestFor: ['agency', 'studio', 'team'],
    contentPriority: ['services', 'case-studies', 'pricing'],
  },
  wells: {
    id: 'wells',
    name: 'Creative Project Gallery',
    style: TEMPLATE_STYLES.CREATIVE,
    features: ['full-screen-banner', 'project-grid', 'hover-effects'],
    bestFor: ['photographer', 'artist', 'creative-director'],
    contentPriority: ['projects', 'visuals', 'about'],
  },
  martinez: {
    id: 'martinez',
    name: 'Minimalist Designer Portfolio',
    style: TEMPLATE_STYLES.MINIMALIST,
    features: ['minimal-design', 'full-bleed-gallery', 'marquee'],
    bestFor: ['designer', 'photographer', 'minimalist'],
    contentPriority: ['projects', 'contact'],
  },
  vsk: {
    id: 'vsk',
    name: 'Designer Portfolio with Philosophy',
    style: TEMPLATE_STYLES.DESIGNER,
    features: ['philosophy-blocks', 'brand-showcase', 'testimonials'],
    bestFor: ['brand-designer', 'art-director', 'strategist'],
    contentPriority: ['philosophy', 'work', 'testimonials'],
  },
  hsieh: {
    id: 'hsieh',
    name: 'UX/Product Case Study Portfolio',
    style: TEMPLATE_STYLES.UX_PRODUCT,
    features: ['case-studies', 'project-cards', 'writing-section'],
    bestFor: ['ux-designer', 'product-designer', 'researcher'],
    contentPriority: ['case-studies', 'process', 'writing'],
  },
  lu: {
    id: 'lu',
    name: 'Playful Interaction Portfolio',
    style: TEMPLATE_STYLES.PLAYFUL,
    features: ['animated-text', 'playful-interactions', 'colorful'],
    bestFor: ['interaction-designer', 'motion-designer', 'creative-developer'],
    contentPriority: ['interactions', 'projects', 'personality'],
  },
  lund: {
    id: 'lund',
    name: 'Straightforward Minimal Portfolio',
    style: TEMPLATE_STYLES.STRAIGHTFORWARD,
    features: ['minimal', 'statement-focused', 'clean'],
    bestFor: ['consultant', 'strategist', 'minimalist'],
    contentPriority: ['statement', 'contact'],
  },
  camp: {
    id: 'camp',
    name: 'Timeless Product Designer Portfolio',
    style: TEMPLATE_STYLES.TIMELESS,
    features: ['project-cards', 'modal-details', 'numbered-navigation'],
    bestFor: ['product-designer', 'ux-designer', 'digital-designer'],
    contentPriority: ['projects', 'approach', 'booking'],
  },
  crazy: {
    id: 'crazy',
    name: 'Bold Award-Winning Portfolio',
    style: TEMPLATE_STYLES.BOLD,
    features: ['bold-typography', 'awards-showcase', 'service-grid'],
    bestFor: ['agency', 'award-winner', 'creative-studio'],
    contentPriority: ['awards', 'services', 'booking'],
  },
  mejias: {
    id: 'mejias',
    name: 'UI/UX Specialist Portfolio',
    style: TEMPLATE_STYLES.UI_UX,
    features: ['case-studies', 'awards-banner', 'booking-system'],
    bestFor: ['ui-designer', 'ux-designer', 'specialist'],
    contentPriority: ['case-studies', 'recognition', 'booking'],
  },
  hanlan: {
    id: 'hanlan',
    name: 'Illustrator\'s Vibrant Portfolio',
    style: TEMPLATE_STYLES.ILLUSTRATOR,
    features: ['animated-gifs', 'project-grid', 'archive'],
    bestFor: ['illustrator', 'animator', 'artist'],
    contentPriority: ['illustrations', 'animations', 'archive'],
  },
};

class TemplateSelector {
  constructor() {
    this.templates = TEMPLATE_CONFIGS;
  }

  /**
   * Select the best template based on user preferences and content
   * @param {Object} preferences User preferences and requirements
   * @param {Object} content Available content and assets
   * @returns {Object} Selected template configuration
   */
  selectTemplate(preferences = {}, content = {}) {
    const {
      style,
      role,
      features = [],
      contentTypes = [],
      priority = []
    } = preferences;

    // Score each template based on matching criteria
    const scores = Object.values(this.templates).map(template => {
      let score = 0;

      // Match style
      if (style && template.style === style) {
        score += 3;
      }

      // Match role
      if (role && template.bestFor.includes(role)) {
        score += 2;
      }

      // Match features
      const matchingFeatures = features.filter(f => template.features.includes(f));
      score += matchingFeatures.length;

      // Match content priority
      const matchingPriorities = priority.filter(p => 
        template.contentPriority.includes(p)
      );
      score += matchingPriorities.length * 2;

      // Check content type compatibility
      const hasRequiredContent = template.contentPriority.every(required =>
        contentTypes.includes(required)
      );
      if (hasRequiredContent) {
        score += 2;
      }

      return {
        template,
        score
      };
    });

    // Sort by score and return the best match
    scores.sort((a, b) => b.score - a.score);
    return scores[0].template;
  }

  /**
   * Get template configuration by ID
   * @param {string} templateId Template identifier
   * @returns {Object} Template configuration
   */
  getTemplateById(templateId) {
    return this.templates[templateId];
  }

  /**
   * Get all available templates
   * @returns {Array} List of all template configurations
   */
  getAllTemplates() {
    return Object.values(this.templates);
  }

  /**
   * Get templates filtered by criteria
   * @param {Object} filters Filtering criteria
   * @returns {Array} Filtered list of templates
   */
  getTemplatesByFilter(filters = {}) {
    return Object.values(this.templates).filter(template => {
      for (const [key, value] of Object.entries(filters)) {
        if (Array.isArray(template[key])) {
          if (!template[key].includes(value)) {
            return false;
          }
        } else if (template[key] !== value) {
          return false;
        }
      }
      return true;
    });
  }
}

module.exports = new TemplateSelector();