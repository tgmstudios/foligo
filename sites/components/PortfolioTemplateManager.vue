import { defineComponent, h, computed } from 'vue';
import templateSelector from '../services/templateSelector';

// Import all templates
import GuglieriTemplate from './portfolio-templates/GuglieriTemplate.vue';
// Import other templates as they are created...

export default defineComponent({
  name: 'PortfolioTemplateManager',
  
  props: {
    siteData: {
      type: Object,
      required: true,
    },
    contentData: {
      type: Object,
      required: true,
    },
    preferences: {
      type: Object,
      default: () => ({}),
    },
  },

  setup(props) {
    // Map template IDs to components
    const templateComponents = {
      guglieri: GuglieriTemplate,
      // Add other templates as they are created...
    };

    // Select the appropriate template based on preferences and content
    const selectedTemplate = computed(() => {
      const template = templateSelector.selectTemplate(props.preferences, props.contentData);
      return templateComponents[template.id];
    });

    // Render the selected template
    return () => {
      const Template = selectedTemplate.value;
      
      if (!Template) {
        console.warn('No suitable template found, falling back to default');
        return h('div', { class: 'error-message' }, 'Template not found');
      }

      return h(Template, {
        siteData: props.siteData,
        contentData: props.contentData,
      });
    };
  },
});