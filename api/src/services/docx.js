const PizZip = require('pizzip');
const Docxtemplater = require('docxtemplater');
const fs = require('fs').promises;
const path = require('path');

class DocxService {
  constructor() {
    // Directory to store uploaded templates
    this.templatesDir = path.join(__dirname, '../../templates');
    this._ensureTemplatesDir();
  }

  async _ensureTemplatesDir() {
    try {
      await fs.mkdir(this.templatesDir, { recursive: true });
    } catch (error) {
      console.error('Error creating templates directory:', error);
    }
  }

  /**
   * Save an uploaded template file
   * @param {Buffer} fileBuffer - The template file buffer
   * @param {string} filename - Original filename
   * @returns {Promise<string>} Path to saved template
   */
  async saveTemplate(fileBuffer, filename) {
    const templateId = `template_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    const fileExtension = path.extname(filename) || '.docx';
    const templatePath = path.join(this.templatesDir, `${templateId}${fileExtension}`);
    
    await fs.writeFile(templatePath, fileBuffer);
    return templatePath;
  }

  /**
   * Load a template file
   * @param {string} templatePath - Path to the template file
   * @returns {Promise<Buffer>} Template file buffer
   */
  async loadTemplate(templatePath) {
    try {
      return await fs.readFile(templatePath);
    } catch (error) {
      throw new Error(`Template not found: ${templatePath}`);
    }
  }

  /**
   * Strip basic markdown formatting markers while keeping text
   * This avoids corrupting DOCX XML while removing visible **, *, __, _, ~~.
   * @param {string} markdown
   * @returns {string}
   */
  _stripMarkdownFormatting(markdown) {
    if (!markdown || typeof markdown !== 'string') return markdown;

    // Strikethrough ~~text~~ -> text
    let result = markdown.replace(/~~([^~]+)~~/g, '$1');
    // Bold **text** or __text__ -> text
    result = result.replace(/\*\*([^*]+)\*\*/g, '$1');
    result = result.replace(/__([^_]+)__/g, '$1');
    // Italic *text* or _text_ -> text
    result = result.replace(/\*([^*]+)\*/g, '$1');
    result = result.replace(/_([^_]+)_/g, '$1');

    return result;
  }

  /**
   * Escape XML special characters
   * @param {string} text - Text to escape
   * @returns {string} Escaped text
   */
  _escapeXML(text) {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }

  /**
   * Process data recursively to detect markdown strings
   * Here we just strip markdown markers to keep DOCX XML safe
   * @param {any} data - Data to process
   * @returns {any} Processed data
   */
  _processDataForMarkdown(data) {
    if (typeof data === 'string') {
      if (
        data.includes('**') ||
        data.includes('__') ||
        data.includes('*') ||
        data.includes('_') ||
        data.includes('~~')
      ) {
        return this._stripMarkdownFormatting(data);
      }
      return data;
    } else if (Array.isArray(data)) {
      return data.map(item => this._processDataForMarkdown(item));
    } else if (data && typeof data === 'object') {
      const processed = {};
      for (const key in data) {
        processed[key] = this._processDataForMarkdown(data[key]);
      }
      return processed;
    }
    return data;
  }

  /**
   * Render a DOCX template with data
   * @param {Buffer} templateBuffer - The template file buffer
   * @param {Object} data - Data to populate the template
   * @returns {Promise<Buffer>} Rendered DOCX buffer
   */
  async renderTemplate(templateBuffer, data) {
    try {
      const zip = new PizZip(templateBuffer);
      const doc = new Docxtemplater(zip, {
        paragraphLoop: true,
        linebreaks: true,
        delimiters: {
          start: '{{',
          end: '}}'
        }
      });

      // Process data to strip markdown markers safely
      const processedData = this._processDataForMarkdown(data);
      doc.setData(processedData);
      doc.render();

      const buffer = doc.getZip().generate({ type: 'nodebuffer' });
      return buffer;
    } catch (error) {
      if (error.properties && error.properties.errors instanceof Array) {
        // Check for split tag errors
        const splitTagErrors = error.properties.errors.filter(e => 
          e.id === 'duplicate_open_tag' || e.id === 'duplicate_close_tag'
        );
        
        if (splitTagErrors.length > 0) {
          throw new Error(
            'Template error: Placeholders appear to be split across Word formatting. ' +
            'This happens when placeholders are formatted in Word (bold, italic, etc.). ' +
            'Please ensure placeholders like {{summary}} and {{#projects}} are plain text without any formatting. ' +
            'Try selecting the placeholder text and clearing all formatting (Ctrl+Space or Format > Clear Formatting).'
          );
        }
        
        // Check for unclosed tag errors
        const unclosedTagErrors = error.properties.errors.filter(e => 
          e.id === 'unclosed_tag' || e.id === 'unclosed_loop'
        );
        
        if (unclosedTagErrors.length > 0) {
          const unclosedTag = unclosedTagErrors[0].xtag || unclosedTagErrors[0].context || '';
          throw new Error(
            `Template error: Unclosed tag detected. ` +
            `Found: "${unclosedTag}". ` +
            `All placeholders must have matching opening and closing tags. ` +
            `Opening tags use {{#section}} and closing tags use {{/section}}. ` +
            `Make sure every {{#...}} has a corresponding {{/...}} with the same name. ` +
            `Check that closing tags have both closing braces: {{/section}} not {{/section}`
          );
        }
        
        const errorMessages = error.properties.errors
          .map(e => `${e.name}: ${e.message}`)
          .join(', ');
        throw new Error(`Template rendering error: ${errorMessages}`);
      }
      throw new Error(`Failed to render template: ${error.message}`);
    }
  }

  /**
   * Delete a template file
   * @param {string} templatePath - Path to the template file
   */
  async deleteTemplate(templatePath) {
    try {
      await fs.unlink(templatePath);
    } catch (error) {
      // Ignore if file doesn't exist
      if (error.code !== 'ENOENT') {
        throw error;
      }
    }
  }
}

module.exports = new DocxService();

