<template>
  <div
    v-if="show"
    class="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
    @click.self="$emit('close')"
  >
    <div class="bg-gray-800 rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
      <div class="flex justify-between items-center mb-4">
        <h2 class="text-2xl font-bold text-white">Template Placeholders</h2>
        <button
          @click="$emit('close')"
          class="text-gray-400 hover:text-white transition-colors"
        >
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      <div class="space-y-4 text-gray-300">
        <div>
          <h3 class="text-lg font-semibold text-white mb-2">Basic Placeholders</h3>
          <div class="space-y-2">
            <div>
              <code class="text-primary-400 bg-gray-900 px-2 py-1 rounded">&#123;&#123;summary&#125;&#125;</code>
              <p class="text-sm mt-1">Replaced with the AI-generated professional summary tailored to the job description.</p>
            </div>
          </div>
        </div>
        <div>
          <h3 class="text-lg font-semibold text-white mb-2">Section Loops</h3>
          <div class="space-y-3">
            <div>
              <code class="text-primary-400 bg-gray-900 px-2 py-1 rounded">&#123;&#123;#education&#125;&#125;...&#123;&#123;/education&#125;&#125;</code>
              <p class="text-sm mt-1">Loops through education entries. Use: <code class="text-primary-400">&#123;&#123;institution&#125;&#125;</code>, <code class="text-primary-400">&#123;&#123;degree&#125;&#125;</code>, <code class="text-primary-400">&#123;&#123;details&#125;&#125;</code>, <code class="text-primary-400">&#123;&#123;date&#125;&#125;</code></p>
            </div>
            <div>
              <code class="text-primary-400 bg-gray-900 px-2 py-1 rounded">&#123;&#123;#experience&#125;&#125;...&#123;&#123;/experience&#125;&#125;</code>
              <p class="text-sm mt-1">Loops through companies. Use: <code class="text-primary-400">&#123;&#123;company&#125;&#125;</code>, <code class="text-primary-400">&#123;&#123;location&#125;&#125;</code>, <code class="text-primary-400">&#123;&#123;description&#125;&#125;</code></p>
              <p class="text-sm mt-1 ml-4">Nested: <code class="text-primary-400">&#123;&#123;#roles&#125;&#125;...&#123;&#123;/roles&#125;&#125;</code> with <code class="text-primary-400">&#123;&#123;title&#125;&#125;</code>, <code class="text-primary-400">&#123;&#123;dateRange&#125;&#125;</code></p>
              <p class="text-sm mt-1 ml-4">Nested bullets: <code class="text-primary-400">&#123;&#123;#bullets&#125;&#125;• &#123;&#123;.&#125;&#125;&#123;&#123;/bullets&#125;&#125;</code></p>
            </div>
            <div>
              <code class="text-primary-400 bg-gray-900 px-2 py-1 rounded">&#123;&#123;#projects&#125;&#125;...&#123;&#123;/projects&#125;&#125;</code>
              <p class="text-sm mt-1">Loops through projects. Use: <code class="text-primary-400">&#123;&#123;title&#125;&#125;</code></p>
              <p class="text-sm mt-1 ml-4">Nested bullets: <code class="text-primary-400">&#123;&#123;#bullets&#125;&#125;• &#123;&#123;.&#125;&#125;&#123;&#123;/bullets&#125;&#125;</code></p>
            </div>
            <div>
              <code class="text-primary-400 bg-gray-900 px-2 py-1 rounded">&#123;&#123;#proficiencies&#125;&#125;...&#123;&#123;/proficiencies&#125;&#125;</code>
              <p class="text-sm mt-1">Loops through proficiency categories. Use: <code class="text-primary-400">&#123;&#123;category&#125;&#125;</code> (category name)</p>
              <p class="text-sm mt-1 ml-4">Nested: <code class="text-primary-400">&#123;&#123;#skills&#125;&#125;• &#123;&#123;.&#125;&#125;&#123;&#123;/skills&#125;&#125;</code> (skills in category)</p>
            </div>
            <div>
              <code class="text-primary-400 bg-gray-900 px-2 py-1 rounded">&#123;&#123;#honors&#125;&#125;...&#123;&#123;/honors&#125;&#125;</code>
              <p class="text-sm mt-1">Loops through honors. Use: <code class="text-primary-400">&#123;&#123;.&#125;&#125;</code> (the honor text)</p>
            </div>
          </div>
        </div>
        <div class="bg-red-500/10 border border-red-500/50 p-4 rounded-lg mt-4">
          <h4 class="text-red-400 font-semibold mb-2 flex items-center">
            <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            Common Mistakes
          </h4>
          <ul class="text-sm text-gray-300 space-y-1 list-disc list-inside">
            <li><strong>Missing closing braces:</strong> Use <code class="text-primary-400">&#123;&#123;/section&#125;&#125;</code> not <code class="text-red-400">&#123;&#123;/section&#125;</code></li>
            <li><strong>Mismatched tags:</strong> Every <code class="text-primary-400">&#123;&#123;#section&#125;&#125;</code> must have a matching <code class="text-primary-400">&#123;&#123;/section&#125;&#125;</code></li>
            <li><strong>Nested loops:</strong> Close inner loops before outer loops</li>
          </ul>
        </div>
        <div class="bg-gray-900/50 p-4 rounded-lg">
          <h4 class="text-white font-semibold mb-2">Example Template:</h4>
          <pre class="text-sm text-gray-300 whitespace-pre-wrap">Executive Summary
&#123;&#123;summary&#125;&#125;

Education
&#123;&#123;#education&#125;&#125;
&#123;&#123;institution&#125;&#125;	&#123;&#123;date&#125;&#125;
&#123;&#123;degree&#125;&#125; | &#123;&#123;details&#125;&#125;
&#123;&#123;/education&#125;&#125;

Professional Experience
&#123;&#123;#experience&#125;&#125;
&#123;&#123;company&#125;&#125;, &#123;&#123;location&#125;&#125;	&#123;&#123;dateRange&#125;&#125;
&#123;&#123;description&#125;&#125;
&#123;&#123;#roles&#125;&#125;
&#123;&#123;title&#125;&#125;	&#123;&#123;dateRange&#125;&#125;
&#123;&#123;#bullets&#125;&#125;
• &#123;&#123;.&#125;&#125;
&#123;&#123;/bullets&#125;&#125;
&#123;&#123;/roles&#125;&#125;
&#123;&#123;/experience&#125;&#125;

Technical Projects
&#123;&#123;#projects&#125;&#125;
&#123;&#123;title&#125;&#125;
&#123;&#123;#bullets&#125;&#125;
• &#123;&#123;.&#125;&#125;
&#123;&#123;/bullets&#125;&#125;
&#123;&#123;/projects&#125;&#125;

Technical Proficiencies
&#123;&#123;#proficiencies&#125;&#125;
&#123;&#123;category&#125;&#125;:
&#123;&#123;#skills&#125;&#125;
• &#123;&#123;.&#125;&#125;
&#123;&#123;/skills&#125;&#125;
&#123;&#123;/proficiencies&#125;&#125;

Honors & Leadership
&#123;&#123;#honors&#125;&#125;
• &#123;&#123;.&#125;&#125;
&#123;&#123;/honors&#125;&#125;</pre>
        </div>
        <div class="bg-amber-500/10 border border-amber-500/50 p-4 rounded-lg mt-4">
          <h4 class="text-amber-400 font-semibold mb-2 flex items-center">
            <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            Important: Placeholder Formatting
          </h4>
          <p class="text-sm text-gray-300">
            Placeholders must be <strong>plain text without formatting</strong>. If you apply bold, italic, or other formatting to placeholders in Word, they will be split and cause errors. 
            To fix: Select the placeholder text and press <code class="bg-gray-800 px-1 rounded">Ctrl+Space</code> (Windows) or <code class="bg-gray-800 px-1 rounded">Cmd+Space</code> (Mac) to clear formatting, or use Format > Clear Formatting.
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  show: boolean
}>()

defineEmits<{
  close: []
}>()
</script>

