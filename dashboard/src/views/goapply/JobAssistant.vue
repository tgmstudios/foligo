<template>
  <div class="p-6 h-[calc(100vh-3rem)] flex gap-6 overflow-hidden">
    <!-- Main Content -->
    <div class="flex-1 flex flex-col min-w-0 overflow-hidden">
    <!-- Setup Stage (before chat starts) -->
    <transition name="fade-slide" mode="out-in">
      <div v-if="!chatStarted && !isStarting" key="setup" class="max-w-4xl mx-auto">
        <div class="card p-8">
          <!-- Animated Header -->
          <div class="text-center mb-8">
            <div class="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-primary-500 to-primary-700 rounded-2xl mb-4 transform transition-transform hover:scale-105">
              <svg class="w-10 h-10 text-white animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <h2 class="text-2xl font-bold text-white mb-2">Job Application Assistant</h2>
            <p class="text-gray-400">Upload your resume and paste a job posting to get personalized advice</p>
          </div>

          <!-- Resume Upload Card -->
          <div class="mb-6">
            <label class="block text-sm font-medium text-gray-300 mb-3">
              <span class="flex items-center space-x-2">
                <span>Upload Your Resume</span>
                <span v-if="resumeFile" class="text-green-400 text-xs">✓ Uploaded</span>
              </span>
            </label>
            <transition name="scale">
              <label
                v-if="!resumeFile"
                :class="[
                  'border-2 border-dashed rounded-xl p-8 transition-all duration-300 cursor-pointer group block',
                  isDragging
                    ? 'border-primary-500 bg-primary-500/10'
                    : 'border-gray-600 hover:border-primary-500 hover:bg-primary-500/5'
                ]"
                @drop="handleDrop"
                @dragover.prevent="handleDragOver"
                @dragenter.prevent="handleDragEnter"
                @dragleave="handleDragLeave"
              >
                <input
                  type="file"
                  ref="resumeInput"
                  @change="handleResumeUpload"
                  accept=".pdf,.doc,.docx,.txt"
                  class="hidden"
                />
                <div class="text-center">
                  <div class="inline-flex items-center justify-center w-16 h-16 bg-gray-700 rounded-full mb-4 group-hover:bg-primary-600 transition-colors">
                    <svg class="w-8 h-8 text-gray-400 group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                  </div>
                  <p class="text-white font-medium mb-1 group-hover:text-primary-400 transition-colors">
                    Click to upload or drag and drop
                  </p>
                  <p class="text-sm text-gray-400">PDF, DOC, DOCX, or TXT (max 10MB)</p>
                </div>
              </label>
              <div
                v-else
                class="border-2 border-green-500/50 bg-green-500/10 rounded-xl p-4 flex items-center justify-between animate-in"
              >
                <div class="flex items-center space-x-3">
                  <div class="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
                    <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <p class="text-white font-medium">{{ resumeFile.name }}</p>
                    <p class="text-sm text-gray-400">{{ formatFileSize(resumeFile.size) }}</p>
                  </div>
                </div>
                <button
                  @click="clearResume"
                  class="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
                  title="Remove resume"
                >
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </transition>
          </div>

          <!-- Job Posting Input -->
          <div class="mb-8">
            <label class="block text-sm font-medium text-gray-300 mb-3">
              Job Posting (optional)
            </label>
            <textarea
              v-model="jobPosting"
              placeholder="Paste the job posting or job description here to get tailored resume advice..."
              rows="6"
              class="w-full px-4 py-3 border border-gray-600 rounded-xl bg-gray-800 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none transition-all"
              :class="{ 'ring-2 ring-primary-500/50': jobPosting.length > 0 }"
            ></textarea>
            <p v-if="jobPosting.length > 0" class="mt-2 text-xs text-gray-400">
              {{ jobPosting.length }} characters
            </p>
          </div>

          <!-- Start Chat Button -->
          <div class="flex justify-center">
            <button
              @click="startChat"
              :disabled="!canStartChat || isStarting"
              class="px-8 py-4 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-xl font-medium hover:from-primary-700 hover:to-primary-800 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transform transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-primary-500/50 disabled:hover:scale-100 shadow-lg shadow-primary-500/25 relative overflow-hidden group"
            >
              <span class="relative z-10 flex items-center space-x-2">
                <span v-if="!isStarting">Start Chat</span>
                <span v-else>Starting...</span>
                <svg v-if="!isStarting" class="w-5 h-5 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
                <svg v-else class="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </span>
              <!-- Animated background effect -->
              <span v-if="isStarting" class="absolute inset-0 bg-gradient-to-r from-primary-500 via-primary-600 to-primary-700 animate-shimmer"></span>
            </button>
          </div>
        </div>
      </div>

      <!-- Loading Stage (between setup and chat) -->
      <div v-else-if="isStarting" key="loading" class="flex items-center justify-center min-h-[60vh] animate-fade-in">
        <div class="text-center w-full max-w-4xl px-6">
          <!-- Animated Scene -->
          <div class="relative mb-8 h-64 flex items-center justify-center overflow-hidden">
            <!-- Portfolio Gathering Character -->
            <div class="absolute left-8 top-1/2 -translate-y-1/2 z-10">
              <svg width="100" height="100" viewBox="0 0 100 100" class="animate-float">
                <!-- Person -->
                <g class="person">
                  <!-- Head -->
                  <circle cx="60" cy="30" r="15" fill="#60a5fa" class="animate-blink">
                    <!-- Eyes -->
                    <circle cx="55" cy="28" r="2" fill="#1e293b" class="animate-blink-eye" />
                    <circle cx="65" cy="28" r="2" fill="#1e293b" class="animate-blink-eye" />
                    <!-- Smile -->
                    <path d="M 50 32 Q 60 36 70 32" stroke="#1e293b" stroke-width="2" fill="none" />
                  </circle>
                  
                  <!-- Body -->
                  <rect x="50" y="45" width="20" height="30" rx="5" fill="#3b82f6" />
                  
                  <!-- Arms (gathering) -->
                  <g class="animate-gather">
                    <!-- Left arm reaching -->
                    <ellipse cx="45" cy="55" rx="8" ry="15" fill="#3b82f6" transform="rotate(-30 45 55)" />
                    <!-- Right arm reaching -->
                    <ellipse cx="75" cy="55" rx="8" ry="15" fill="#3b82f6" transform="rotate(30 75 55)" />
                  </g>
                  
                  <!-- Legs -->
                  <rect x="52" y="75" width="6" height="20" rx="3" fill="#2563eb" />
                  <rect x="62" y="75" width="6" height="20" rx="3" fill="#2563eb" />
                </g>
                
                <!-- Portfolio items floating -->
                <g class="animate-float-delayed">
                  <!-- Document 1 -->
                  <rect x="20" y="40" width="12" height="16" rx="2" fill="#10b981" opacity="0.8">
                    <animateTransform attributeName="transform" type="translate" values="0,0; 0,-5; 0,0" dur="2s" repeatCount="indefinite" />
                  </rect>
                  <line x1="22" y1="44" x2="30" y2="44" stroke="#ffffff" stroke-width="1" />
                  <line x1="22" y1="48" x2="28" y2="48" stroke="#ffffff" stroke-width="1" />
                  
                  <!-- Document 2 -->
                  <rect x="88" y="50" width="12" height="16" rx="2" fill="#8b5cf6" opacity="0.8">
                    <animateTransform attributeName="transform" type="translate" values="0,0; 0,-5; 0,0" dur="2.5s" repeatCount="indefinite" />
                  </rect>
                  <line x1="90" y1="54" x2="98" y2="54" stroke="#ffffff" stroke-width="1" />
                  <line x1="90" y1="58" x2="96" y2="58" stroke="#ffffff" stroke-width="1" />
                </g>
              </svg>
            </div>
            
            <!-- Transfer Arrow -->
            <div class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-0">
              <svg width="120" height="60" viewBox="0 0 120 60" class="animate-pulse">
                <path d="M 10 20 L 70 20" stroke="#60a5fa" stroke-width="3" fill="none" marker-end="url(#arrowhead)" />
                <defs>
                  <marker id="arrowhead" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
                    <polygon points="0 0, 10 3, 0 6" fill="#60a5fa" />
                  </marker>
                </defs>
                <!-- Data packets -->
                <circle cx="20" cy="20" r="4" fill="#10b981" opacity="0.6">
                  <animate attributeName="cx" from="20" to="60" dur="1.5s" repeatCount="indefinite" />
                </circle>
                <circle cx="20" cy="20" r="4" fill="#8b5cf6" opacity="0.6">
                  <animate attributeName="cx" from="20" to="60" dur="1.5s" begin="0.5s" repeatCount="indefinite" />
                </circle>
              </svg>
            </div>
            
            <!-- Robot Character -->
            <div class="absolute right-8 top-1/2 -translate-y-1/2 z-10">
              <svg width="120" height="120" viewBox="0 0 120 120" class="animate-float">
                <!-- Robot Body -->
                <g class="robot">
                  <!-- Head -->
                  <rect x="40" y="15" width="40" height="35" rx="4" fill="#4b5563" stroke="#60a5fa" stroke-width="2">
                    <animate attributeName="fill" values="#4b5563;#3b82f6;#4b5563" dur="3s" repeatCount="indefinite" />
                  </rect>
                  
                  <!-- Antenna -->
                  <circle cx="60" cy="10" r="2.5" fill="#60a5fa">
                    <animate attributeName="opacity" values="1;0.3;1" dur="1s" repeatCount="indefinite" />
                  </circle>
                  <line x1="60" y1="10" x2="60" y2="15" stroke="#60a5fa" stroke-width="2" />
                  
                  <!-- Eyes (scanning) -->
                  <g class="animate-scan">
                    <circle cx="52" cy="30" r="4" fill="#60a5fa">
                      <animate attributeName="r" values="4;6;4" dur="2s" repeatCount="indefinite" />
                      <animate attributeName="opacity" values="1;0.5;1" dur="2s" repeatCount="indefinite" />
                    </circle>
                    <circle cx="68" cy="30" r="4" fill="#60a5fa">
                      <animate attributeName="r" values="4;6;4" dur="2s" begin="0.2s" repeatCount="indefinite" />
                      <animate attributeName="opacity" values="1;0.5;1" dur="2s" begin="0.2s" repeatCount="indefinite" />
                    </circle>
                  </g>
                  
                  <!-- Mouth (speaker) -->
                  <rect x="54" y="42" width="12" height="3" rx="1.5" fill="#60a5fa" opacity="0.6">
                    <animate attributeName="opacity" values="0.6;1;0.6" dur="1.5s" repeatCount="indefinite" />
                  </rect>
                  
                  <!-- Body -->
                  <rect x="35" y="50" width="50" height="45" rx="4" fill="#374151" stroke="#60a5fa" stroke-width="2" />
                  
                  <!-- Chest panel -->
                  <rect x="45" y="58" width="30" height="18" rx="2" fill="#1f2937">
                    <!-- Scanning lines -->
                    <line x1="45" y1="63" x2="75" y2="63" stroke="#10b981" stroke-width="1" opacity="0.5">
                      <animate attributeName="y1" from="63" to="73" dur="2s" repeatCount="indefinite" />
                      <animate attributeName="y2" from="63" to="73" dur="2s" repeatCount="indefinite" />
                    </line>
                  </rect>
                  
                  <!-- Arms (reading) -->
                  <g class="animate-read">
                    <!-- Left arm holding resume -->
                    <ellipse cx="30" cy="65" rx="10" ry="7" fill="#374151" transform="rotate(-45 30 65)" />
                    <rect x="18" y="52" width="18" height="24" rx="2" fill="#fbbf24" opacity="0.9">
                      <animateTransform attributeName="transform" type="rotate" values="-10 27 64; 5 27 64; -10 27 64" dur="3s" repeatCount="indefinite" />
                    </rect>
                    <!-- Resume lines -->
                    <line x1="20" y1="56" x2="32" y2="56" stroke="#1e293b" stroke-width="1" />
                    <line x1="20" y1="60" x2="30" y2="60" stroke="#1e293b" stroke-width="1" />
                    <line x1="20" y1="64" x2="28" y2="64" stroke="#1e293b" stroke-width="1" />
                    
                    <!-- Right arm holding job posting -->
                    <ellipse cx="90" cy="65" rx="10" ry="7" fill="#374151" transform="rotate(45 90 65)" />
                    <rect x="84" y="52" width="18" height="24" rx="2" fill="#8b5cf6" opacity="0.9">
                      <animateTransform attributeName="transform" type="rotate" values="10 93 64; -5 93 64; 10 93 64" dur="3s" begin="1.5s" repeatCount="indefinite" />
                    </rect>
                    <!-- Job posting lines -->
                    <line x1="86" y1="56" x2="98" y2="56" stroke="#ffffff" stroke-width="1" />
                    <line x1="86" y1="60" x2="96" y2="60" stroke="#ffffff" stroke-width="1" />
                    <line x1="86" y1="64" x2="94" y2="64" stroke="#ffffff" stroke-width="1" />
                  </g>
                  
                  <!-- Legs -->
                  <rect x="40" y="95" width="10" height="18" rx="2" fill="#1f2937" />
                  <rect x="70" y="95" width="10" height="18" rx="2" fill="#1f2937" />
                  
                  <!-- Wheels -->
                  <circle cx="45" cy="113" r="4" fill="#4b5563" />
                  <circle cx="75" cy="113" r="4" fill="#4b5563" />
                </g>
                
                <!-- Thought bubbles -->
                <g class="animate-think" opacity="0.7">
                  <circle cx="95" cy="25" r="6" fill="#60a5fa" opacity="0.3">
                    <animate attributeName="r" values="6;8;6" dur="2s" repeatCount="indefinite" />
                  </circle>
                  <circle cx="103" cy="15" r="4" fill="#60a5fa" opacity="0.3">
                    <animate attributeName="r" values="4;6;4" dur="2s" begin="0.3s" repeatCount="indefinite" />
                  </circle>
                </g>
              </svg>
            </div>
          </div>
          
          <!-- Status Text -->
          <div class="space-y-2">
            <h3 class="text-2xl font-semibold text-white mb-2 animate-pulse">Analyzing your portfolio...</h3>
            <p class="text-gray-400 text-lg">Gathering your projects, experiences, and skills</p>
            <div class="mt-4 flex justify-center space-x-2">
              <div class="w-2 h-2 bg-primary-500 rounded-full animate-bounce" style="animation-delay: 0s"></div>
              <div class="w-2 h-2 bg-primary-500 rounded-full animate-bounce" style="animation-delay: 0.2s"></div>
              <div class="w-2 h-2 bg-primary-500 rounded-full animate-bounce" style="animation-delay: 0.4s"></div>
            </div>
          </div>
        </div>
      </div>

      <!-- Chat Stage (after chat starts) -->
      <div v-else key="chat" class="flex flex-col flex-1 animate-fade-in min-h-0">
        <div class="card flex-1 flex flex-col overflow-hidden min-h-0">
          <!-- Chat Header with Copy Button -->
          <div class="px-4 py-2 border-b border-gray-700 bg-gray-800/30 flex-shrink-0 flex items-center justify-between">
            <button
              @click="showJobPosting = !showJobPosting"
              class="flex items-center space-x-2 text-xs text-gray-400 hover:text-gray-300 transition-colors group"
            >
              <svg
                class="w-4 h-4 transform transition-transform duration-300"
                :class="{ 'rotate-180': showJobPosting }"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
              </svg>
              <span>{{ showJobPosting ? 'Hide' : 'Show' }} Job Posting</span>
            </button>
            <button
              @click="copyChat"
              class="flex items-center space-x-2 text-xs text-gray-400 hover:text-gray-300 transition-colors px-2 py-1 rounded hover:bg-gray-700/50"
              title="Copy entire chat as markdown"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              <span>Copy Chat</span>
            </button>
          </div>

          <!-- Resume Draft Created Banner -->
          <div
            v-if="lastCreatedResume"
            class="px-4 py-2 border-b border-primary-700 bg-primary-900/40 flex-shrink-0 flex items-center justify-between text-xs text-primary-100"
          >
            <div class="flex flex-col pr-3">
              <span class="font-semibold">Resume draft created</span>
              <span class="text-primary-100/80">
                Open it in the Resume Generator to tweak and export, or copy a direct link to this chat.
              </span>
            </div>
            <div class="flex items-center space-x-2 flex-shrink-0">
              <button
                @click="openCreatedResumeInGenerator"
                class="px-3 py-1 bg-primary-500 hover:bg-primary-400 text-white rounded-md text-xs font-medium transition-colors"
              >
                Open in generator
              </button>
              <button
                @click="copyChatLink"
                class="px-3 py-1 border border-primary-500/60 text-primary-100 rounded-md text-xs hover:bg-primary-500/10 transition-colors"
              >
                Copy chat link
              </button>
            </div>
          </div>
          
          <!-- Job Posting Content (collapsible) -->
          <transition name="slide-down">
            <div v-if="showJobPosting" class="border-b border-gray-700 bg-gray-800/50 flex-shrink-0">
              <div class="px-4 pb-4 pt-2">
                <textarea
                  v-model="jobPosting"
                  placeholder="Paste the job posting or job description here..."
                  rows="3"
                  class="w-full px-4 py-2 border border-gray-600 rounded-lg bg-gray-800 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none text-sm transition-all"
                ></textarea>
              </div>
            </div>
          </transition>

          <!-- Chat Messages -->
          <div class="flex-1 overflow-y-auto p-6 space-y-4">
            <transition-group name="message" tag="div" class="max-w-full">
              <div
                v-for="(message, index) in messages"
                :key="message.id"
                :class="[
                  'flex items-start space-x-3 animate-in',
                  message.role === 'user' ? 'flex-row-reverse space-x-reverse' : '',
                  index > 0 && messages[index - 1].role !== message.role ? 'mt-6' : ''
                ]"
              >
                <div :class="[
                  'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-transform hover:scale-110',
                  message.role === 'user' ? 'bg-primary-600' : 'bg-gray-700'
                ]">
                  <svg v-if="message.role === 'assistant'" class="w-5 h-5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                  <svg v-else class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <div :class="[
                  'rounded-xl px-4 py-3 shadow-lg transition-all group relative overflow-hidden',
                  message.role === 'user' 
                    ? 'bg-primary-600 text-white max-w-2xl' 
                    : 'bg-gray-800 text-white border border-gray-700 w-full max-w-full'
                ]">
                  <!-- Copy button for individual message -->
                  <button
                    @click.stop="copyMessage(message)"
                    class="absolute top-2 right-2 p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity bg-gray-700/80 hover:bg-gray-600 text-gray-300 hover:text-white z-10"
                    :class="message.role === 'user' ? 'bg-primary-700/80 hover:bg-primary-800' : ''"
                    title="Copy message"
                  >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </button>
                  
                  <!-- User messages: plain text -->
                  <p v-if="message.role === 'user'" class="text-sm whitespace-pre-wrap leading-relaxed pr-8">{{ message.content }}</p>
                  <!-- Assistant messages: rendered markdown -->
                  <div 
                    v-else
                    :data-message-id="message.id"
                    class="text-sm leading-relaxed markdown-content pr-8"
                    v-html="renderMarkdown(message.content)"
                  ></div>
                </div>
              </div>
            </transition-group>

            <!-- Typing Indicator -->
            <transition name="fade">
              <div v-if="isTyping" class="flex items-start space-x-3">
                <div class="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center flex-shrink-0">
                  <svg class="w-5 h-5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <div class="rounded-xl px-4 py-3 bg-gray-800 border border-gray-700">
                  <div class="flex space-x-1.5">
                    <div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 0s"></div>
                    <div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 0.2s"></div>
                    <div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 0.4s"></div>
                  </div>
                </div>
              </div>
            </transition>
          </div>

          <!-- Input Area (only shown when chat is active) -->
          <div class="border-t border-gray-700 p-4 bg-gray-800/50">
            <div class="w-full max-w-full">
              <div class="flex items-end space-x-3">
                <textarea
                  ref="messageTextarea"
                  v-model="currentMessage"
                  @keydown.enter.exact.prevent="sendMessage"
                  @keydown.enter.ctrl.exact="handleCtrlEnter"
                  @keydown.enter.meta.exact="handleCtrlEnter"
                  @input="adjustTextareaHeight"
                  :disabled="isTyping"
                  placeholder="Type your message... (Enter to send, Ctrl+Enter for new line)"
                  rows="1"
                  class="flex-1 px-4 py-3 border border-gray-600 rounded-xl bg-gray-800 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:opacity-50 resize-none overflow-y-auto min-h-[48px] max-h-[200px] transition-all leading-relaxed"
                ></textarea>
                <button
                  @click="sendMessage"
                  :disabled="isTyping || !currentMessage.trim()"
                  class="px-6 py-3 bg-primary-600 text-white rounded-xl font-medium hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-gray-800 disabled:opacity-50 disabled:cursor-not-allowed h-[48px] transform transition-all duration-200 hover:scale-105 disabled:hover:scale-100"
                >
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </transition>
    </div>

    <!-- Right Sidebar for Past Chats -->
    <div class="w-80 flex-shrink-0 bg-gray-900 border border-gray-700 rounded-lg flex flex-col overflow-hidden" style="max-height: calc(100vh - 4.5rem);">
      <!-- Sidebar Header -->
      <div class="p-4 border-b border-gray-700 flex items-center justify-between">
        <h3 class="text-lg font-semibold text-white">Past Chats</h3>
      </div>

      <!-- Chat Sessions List -->
      <div class="flex-1 overflow-y-auto overflow-x-hidden p-4 space-y-2 min-h-0">
        <button
          @click="startNewChat"
          class="w-full px-4 py-3 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors flex items-center justify-center space-x-2"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
          <span>New Chat</span>
        </button>

        <div v-if="loadingSessions" class="text-center py-8">
          <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
          <p class="mt-2 text-gray-400 text-sm">Loading chats...</p>
        </div>

        <div v-else-if="pastSessions.length === 0" class="text-center py-8">
          <p class="text-gray-400 text-sm">No past chats</p>
        </div>

        <div
          v-for="session in pastSessions"
          :key="session.id"
          @click="resumeChat(session.id)"
          :class="[
            'p-3 rounded-lg cursor-pointer transition-all border',
            currentSessionId === session.id
              ? 'bg-primary-600/20 border-primary-500 text-white'
              : 'bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-750 hover:border-gray-600'
          ]"
        >
          <div class="flex items-start justify-between mb-2">
            <h4 class="font-medium text-sm truncate flex-1">{{ session.title }}</h4>
            <button
              @click.stop="deleteSession(session.id)"
              class="ml-2 p-1 text-gray-500 hover:text-red-400 hover:bg-gray-700 rounded transition-colors"
              title="Delete chat"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
          <div class="flex items-center justify-between text-xs text-gray-400">
            <span>{{ session.messageCount }} messages</span>
            <span>{{ formatDate(session.updatedAt) }}</span>
          </div>
          <div v-if="session.resumeFileName" class="mt-2 text-xs text-gray-500 truncate flex items-center space-x-1">
            <svg class="w-3 h-3 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span>{{ session.resumeFileName }}</span>
          </div>
          <div v-if="session.hasJobPosting" class="mt-1 text-xs text-gray-500 flex items-center space-x-1">
            <svg class="w-3 h-3 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M6 7V5a3 3 0 013-3h6a3 3 0 013 3v2M6 7h12M6 7v10a2 2 0 002 2h8a2 2 0 002-2V7" />
            </svg>
            <span>Job posting</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, onMounted, watch, onUpdated } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useToast } from 'vue-toastification'
import { marked } from 'marked'
import { aiApi } from '@/services/api'

const toast = useToast()
const route = useRoute()
const router = useRouter()

const messages = ref<Array<{ id: string; role: 'user' | 'assistant'; content: string }>>([])
const currentMessage = ref('')
const isTyping = ref(false)
const isStarting = ref(false)
const chatStarted = ref(false)
const resumeFile = ref<File | null>(null)
const jobPosting = ref('')
const showJobPosting = ref(false)
const messageTextarea = ref<HTMLTextAreaElement | null>(null)
const resumeInput = ref<HTMLInputElement | null>(null)
const isDragging = ref(false)
const pastSessions = ref<Array<{
  id: string
  title: string
  messageCount: number
  resumeFileName?: string
  hasJobPosting: boolean
  updatedAt: string
}>>([])
const loadingSessions = ref(false)
const currentSessionId = ref<string | null>(null)
const lastCreatedResume = ref<{
  resumeId: string
  generatorRoute: { path: string; query?: Record<string, any> }
} | null>(null)

const canStartChat = computed(() => {
  return resumeFile.value || jobPosting.value.trim().length > 0
})

const formatFileSize = (bytes: number) => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
}

const handleResumeUpload = (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (file) {
    validateAndSetFile(file)
  }
}

const handleDragOver = (event: DragEvent) => {
  event.preventDefault()
  isDragging.value = true
}

const handleDragEnter = (event: DragEvent) => {
  event.preventDefault()
  isDragging.value = true
}

const handleDragLeave = (event: DragEvent) => {
  event.preventDefault()
  // Check if we're actually leaving the drop zone (not just moving to a child element)
  const relatedTarget = event.relatedTarget as HTMLElement
  const currentTarget = event.currentTarget as HTMLElement
  
  if (!currentTarget.contains(relatedTarget)) {
    isDragging.value = false
  }
}

const handleDrop = (event: DragEvent) => {
  event.preventDefault()
  isDragging.value = false

  const files = event.dataTransfer?.files
  if (files && files.length > 0) {
    const file = files[0]
    validateAndSetFile(file)
  }
}

const validateAndSetFile = (file: File) => {
  // Validate file type
  const allowedTypes = [
    'application/pdf',
    'text/plain',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]
  
  const allowedExtensions = ['.pdf', '.doc', '.docx', '.txt']
  const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase()

  if (!allowedTypes.includes(file.type) && !allowedExtensions.includes(fileExtension)) {
    toast.error('Invalid file type. Please upload PDF, DOC, DOCX, or TXT files.')
    return
  }

  // Validate file size (10MB)
  const maxSize = 10 * 1024 * 1024 // 10MB in bytes
  if (file.size > maxSize) {
    toast.error('File size exceeds 10MB limit.')
    return
  }

  resumeFile.value = file
  toast.success(`Resume "${file.name}" uploaded successfully`)
}

const clearResume = () => {
  resumeFile.value = null
  if (resumeInput.value) {
    resumeInput.value.value = ''
  }
}

const startChat = async () => {
  if (!canStartChat.value) return

  isStarting.value = true
  currentSessionId.value = null // Start new session
  lastCreatedResume.value = null

  try {
    const formData = new FormData()
    if (resumeFile.value) {
      formData.append('resume', resumeFile.value)
    }
    if (jobPosting.value.trim()) {
      formData.append('jobPosting', jobPosting.value.trim())
    }
    formData.append('chatHistory', JSON.stringify([]))

    const response = await aiApi.post('/ai/resume-chatbot/session', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      timeout: 120000
    })

    if (response.data.message) {
      // Small delay to show loading animation
      await new Promise(resolve => setTimeout(resolve, 500))
      
      chatStarted.value = true
      messages.value = [{
        id: Date.now().toString(),
        role: 'assistant',
        content: response.data.message
      }]
      
      // Save session ID if returned
      if (response.data.sessionId) {
        currentSessionId.value = response.data.sessionId
        // Update URL to deep-link to this chat
        router.replace({
          name: 'resume-chatbot-session',
          params: { sessionId: response.data.sessionId }
        })
      } else {
        // No session yet, keep base route
        router.replace({ name: 'resume-chatbot' })
      }
      
      // Setup code block buttons
      setupCodeBlockButtons()
      
      // Reload sessions list
      await loadPastSessions()
    }

    // Scroll to bottom and focus input
    await nextTick()
    const chatContainer = document.querySelector('.overflow-y-auto')
    if (chatContainer) {
      chatContainer.scrollTop = chatContainer.scrollHeight
    }
    if (messageTextarea.value) {
      messageTextarea.value.focus()
    }
  } catch (error: any) {
    console.error('Failed to start chat:', error)
    toast.error(error.response?.data?.message || 'Failed to start chat. Please try again.')
  } finally {
    isStarting.value = false
  }
}

const sendMessage = async () => {
  if (!currentMessage.value.trim() || isTyping.value) return

  const userMessage = {
    id: Date.now().toString(),
    role: 'user' as const,
    content: currentMessage.value.trim()
  }

  messages.value.push(userMessage)
  currentMessage.value = ''

  // Reset textarea height
  if (messageTextarea.value) {
    messageTextarea.value.style.height = 'auto'
  }

  isTyping.value = true

  try {
    const chatHistory = messages.value.map(m => ({
      role: m.role,
      content: m.content
    }))

    const formData = new FormData()
    if (resumeFile.value) {
      formData.append('resume', resumeFile.value)
    }
    if (jobPosting.value.trim()) {
      formData.append('jobPosting', jobPosting.value.trim())
    }
    formData.append('chatHistory', JSON.stringify(chatHistory))
    if (currentSessionId.value) {
      formData.append('sessionId', currentSessionId.value)
    }

    const response = await aiApi.post('/ai/resume-chatbot/session', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      timeout: 120000
    })

    if (response.data.message) {
      messages.value.push({
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.data.message
      })
    }

    // Update session ID if returned
    if (response.data.sessionId) {
      const newSessionId = response.data.sessionId as string
      const changed = currentSessionId.value !== newSessionId
      currentSessionId.value = newSessionId
      // If this is a new or different session, sync URL so refresh returns here
      if (changed || route.params.sessionId !== newSessionId) {
        router.replace({
          name: 'resume-chatbot-session',
          params: { sessionId: newSessionId }
        })
      }
    }

    // If a resume draft was created via toolcall, remember it so we can link to the generator
    if (response.data.createdResumeId) {
      lastCreatedResume.value = {
        resumeId: response.data.createdResumeId,
        generatorRoute: {
          path: '/resume-generator',
          query: { resumeId: response.data.createdResumeId }
        }
      }
      toast.success('Resume draft created. You can open it in the Resume Generator to edit and export.')
    }

    // Setup code block buttons for new message
    setupCodeBlockButtons()

    // Reload sessions list to update last modified time
    await loadPastSessions()

    // Scroll to bottom
    await nextTick()
    const chatContainer = document.querySelector('.overflow-y-auto')
    if (chatContainer) {
      chatContainer.scrollTop = chatContainer.scrollHeight
    }
    if (messageTextarea.value) {
      messageTextarea.value.focus()
    }
  } catch (error: any) {
    console.error('Failed to send message:', error)
    toast.error(error.response?.data?.message || 'Failed to send message')
  } finally {
    isTyping.value = false
  }
}

const adjustTextareaHeight = () => {
  nextTick(() => {
    if (messageTextarea.value) {
      messageTextarea.value.style.height = 'auto'
      const scrollHeight = messageTextarea.value.scrollHeight
      const minHeight = 48
      const maxHeight = 200
      const newHeight = Math.max(minHeight, Math.min(scrollHeight, maxHeight))
      messageTextarea.value.style.height = `${newHeight}px`
      
      // Scroll to bottom if content exceeds max height
      if (scrollHeight > maxHeight) {
        messageTextarea.value.scrollTop = messageTextarea.value.scrollHeight
      }
    }
  })
}

const handleCtrlEnter = (event: KeyboardEvent) => {
  // Allow default behavior (new line) and adjust height
  event.preventDefault()
  if (messageTextarea.value) {
    const textarea = messageTextarea.value
    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const text = currentMessage.value
    currentMessage.value = text.substring(0, start) + '\n' + text.substring(end)
    // Set cursor position after the newline
    nextTick(() => {
      if (messageTextarea.value) {
        messageTextarea.value.selectionStart = messageTextarea.value.selectionEnd = start + 1
        adjustTextareaHeight()
      }
    })
  }
}

// Configure marked for markdown rendering
marked.setOptions({
  breaks: true,
  gfm: true
})

// Render markdown content
const renderMarkdown = (content: string) => {
  if (!content || !content.trim()) return ''
  
  try {
    const html = marked(content) as string
    // Add data attribute to code blocks so we can add copy buttons
    return html.replace(/<pre[^>]*>/g, '<pre data-code-block="true">')
  } catch (error) {
    console.error('Markdown rendering error:', error)
    return content // Fallback to plain text
  }
}

// Setup copy buttons for code blocks
const setupCodeBlockButtons = () => {
  nextTick(() => {
    const markdownContainers = document.querySelectorAll('.markdown-content[data-message-id]')
    markdownContainers.forEach((container) => {
      const codeBlocks = container.querySelectorAll('pre[data-code-block="true"]')
      codeBlocks.forEach((pre) => {
        // Skip if button already exists
        if (pre.querySelector('.code-copy-button')) return
        
        const button = document.createElement('button')
        button.className = 'code-copy-button absolute top-2 right-2 p-1.5 rounded-lg opacity-0 transition-opacity bg-gray-700/90 hover:bg-gray-600 text-gray-300 hover:text-white z-20'
        button.innerHTML = `
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        `
        button.title = 'Copy code'
        
        // Make pre element relative and add group class for hover
        if (!(pre as HTMLElement).classList.contains('code-block-group')) {
          (pre as HTMLElement).classList.add('code-block-group', 'relative')
        }
        
        button.addEventListener('click', async (e) => {
          e.stopPropagation()
          e.preventDefault()
          const code = pre.querySelector('code')?.textContent || pre.textContent || ''
          try {
            await navigator.clipboard.writeText(code)
            toast.success('Code copied to clipboard')
            
            // Visual feedback
            button.innerHTML = `
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
            `
            setTimeout(() => {
              button.innerHTML = `
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              `
            }, 2000)
          } catch (error) {
            // Fallback
            const textArea = document.createElement('textarea')
            textArea.value = code
            textArea.style.position = 'fixed'
            textArea.style.opacity = '0'
            document.body.appendChild(textArea)
            textArea.select()
            try {
              document.execCommand('copy')
              toast.success('Code copied to clipboard')
            } catch (err) {
              toast.error('Failed to copy code')
            }
            document.body.removeChild(textArea)
          }
        })
        
        pre.appendChild(button)
      })
    })
  })
}

// Watch for new messages and setup code block buttons
watch(() => messages.value.length, () => {
  setupCodeBlockButtons()
}, { flush: 'post' })

// Also setup on component updates
onUpdated(() => {
  setupCodeBlockButtons()
})

// Load past chat sessions
const loadPastSessions = async () => {
  loadingSessions.value = true
  try {
    const response = await aiApi.get('/ai/resume-chatbot/sessions')
    pastSessions.value = response.data.sessions || []
  } catch (error: any) {
    console.error('Failed to load past sessions:', error)
    toast.error('Failed to load past chats')
  } finally {
    loadingSessions.value = false
  }
}

// Resume a past chat
const resumeChat = async (sessionId: string) => {
  try {
    // If route doesn't already reflect this session, update it
    if (route.params.sessionId !== sessionId) {
      router.push({
        name: 'resume-chatbot-session',
        params: { sessionId }
      })
    }

    const response = await aiApi.get(`/ai/resume-chatbot/sessions/${sessionId}`)
    const session = response.data

    // Load session data
    currentSessionId.value = session.id
    messages.value = (session.chatHistory || []).map((msg: any, index: number) => ({
      id: `${session.id}-${index}`,
      role: msg.role,
      content: msg.content
    }))
    
    if (session.jobPosting) {
      jobPosting.value = session.jobPosting
    }

    // Note: We can't restore the resume file, but the text is stored
    // The user would need to re-upload if they want to modify it

    chatStarted.value = true

    // Setup code block buttons for loaded messages
    await nextTick()
    setupCodeBlockButtons()

    // Scroll to bottom
    const chatContainer = document.querySelector('.overflow-y-auto')
    if (chatContainer) {
      chatContainer.scrollTop = chatContainer.scrollHeight
    }
    if (messageTextarea.value) {
      messageTextarea.value.focus()
    }
  } catch (error: any) {
    console.error('Failed to resume chat:', error)
    toast.error(error.response?.data?.message || 'Failed to resume chat')
  }
}

// Start a new chat
const startNewChat = () => {
  currentSessionId.value = null
  messages.value = []
  chatStarted.value = false
  resumeFile.value = null
  jobPosting.value = ''
  showJobPosting.value = false
  lastCreatedResume.value = null
  
  if (resumeInput.value) {
    resumeInput.value.value = ''
  }

   // Reset URL back to base resume chatbot route
  router.replace({ name: 'resume-chatbot' })
}

// Delete a chat session
const deleteSession = async (sessionId: string) => {
  if (!confirm('Are you sure you want to delete this chat?')) {
    return
  }

  try {
    await aiApi.delete(`/ai/resume-chatbot/sessions/${sessionId}`)
    toast.success('Chat deleted')
    
    // If deleted session is current, start new chat
    if (currentSessionId.value === sessionId) {
      startNewChat()
    }
    
    // Reload sessions list
    await loadPastSessions()
  } catch (error: any) {
    console.error('Failed to delete session:', error)
    toast.error(error.response?.data?.message || 'Failed to delete chat')
  }
}

// Format date for display
const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  
  return date.toLocaleDateString()
}

// Copy individual message to clipboard
const copyMessage = async (message: { role: string; content: string }) => {
  try {
    const textToCopy = message.content
    await navigator.clipboard.writeText(textToCopy)
    toast.success('Message copied to clipboard')
  } catch (error) {
    // Fallback for older browsers
    const textArea = document.createElement('textarea')
    textArea.value = message.content
    textArea.style.position = 'fixed'
    textArea.style.opacity = '0'
    document.body.appendChild(textArea)
    textArea.select()
    try {
      document.execCommand('copy')
      toast.success('Message copied to clipboard')
    } catch (err) {
      toast.error('Failed to copy message')
    }
    document.body.removeChild(textArea)
  }
}

// Copy entire chat as markdown to clipboard
const copyChat = async () => {
  if (messages.value.length === 0) {
    toast.info('No messages to copy')
    return
  }

  try {
    // Format chat as markdown
    let markdown = '# Resume Assistant Chat\n\n'
    
    if (jobPosting.value) {
      markdown += `## Job Posting\n\n${jobPosting.value}\n\n---\n\n`
    }
    
    markdown += '## Conversation\n\n'
    
    messages.value.forEach((message) => {
      const role = message.role === 'user' ? '**You**' : '**Assistant**'
      markdown += `${role}:\n\n${message.content}\n\n---\n\n`
    })
    
    await navigator.clipboard.writeText(markdown)
    toast.success('Chat copied to clipboard as markdown')
  } catch (error) {
    // Fallback for older browsers
    let markdown = '# Resume Assistant Chat\n\n'
    
    if (jobPosting.value) {
      markdown += `## Job Posting\n\n${jobPosting.value}\n\n---\n\n`
    }
    
    markdown += '## Conversation\n\n'
    
    messages.value.forEach((message) => {
      const role = message.role === 'user' ? '**You**' : '**Assistant**'
      markdown += `${role}:\n\n${message.content}\n\n---\n\n`
    })
    
    const textArea = document.createElement('textarea')
    textArea.value = markdown
    textArea.style.position = 'fixed'
    textArea.style.opacity = '0'
    document.body.appendChild(textArea)
    textArea.select()
    try {
      document.execCommand('copy')
      toast.success('Chat copied to clipboard as markdown')
    } catch (err) {
      toast.error('Failed to copy chat')
    }
    document.body.removeChild(textArea)
  }
}

// Load sessions on mount
onMounted(async () => {
  await loadPastSessions()

  // If we were opened with a specific sessionId in the route, auto-load that chat
  const sessionIdFromRoute = route.params.sessionId as string | undefined
  if (sessionIdFromRoute) {
    await resumeChat(sessionIdFromRoute)
  }
})

// Navigation helpers for resume drafts / chat links
const openCreatedResumeInGenerator = () => {
  if (!lastCreatedResume.value) return
  router.push(lastCreatedResume.value.generatorRoute)
}

const copyChatLink = async () => {
  if (!currentSessionId.value) {
    toast.info('No active chat to link to yet')
    return
  }
  const linkPath = `/resume-chatbot/${currentSessionId.value}`
  try {
    await navigator.clipboard.writeText(linkPath)
    toast.success('Chat link copied to clipboard')
  } catch {
    toast.error('Failed to copy chat link')
  }
}
</script>

<style scoped>
/* Fade and slide transitions */
.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.fade-slide-enter-from {
  opacity: 0;
  transform: translateY(20px);
}

.fade-slide-leave-to {
  opacity: 0;
  transform: translateY(-20px);
}

/* Scale transition */
.scale-enter-active,
.scale-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.scale-enter-from,
.scale-leave-to {
  opacity: 0;
  transform: scale(0.95);
}

/* Slide down transition */
.slide-down-enter-active,
.slide-down-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
}

.slide-down-enter-from,
.slide-down-leave-to {
  max-height: 0;
  opacity: 0;
}

.slide-down-enter-to,
.slide-down-leave-from {
  max-height: 200px;
  opacity: 1;
}

/* Message transitions */
.message-enter-active {
  transition: all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.message-enter-from {
  opacity: 0;
  transform: translateY(20px) scale(0.9);
}

.message-move {
  transition: transform 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}

.message-leave-active {
  transition: all 0.3s ease;
}

.message-leave-to {
  opacity: 0;
  transform: scale(0.9);
}

/* Fade transition */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* Fade in animation */
@keyframes fade-in {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-fade-in {
  animation: fade-in 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}

/* Animate in */
@keyframes animate-in {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-in {
  animation: animate-in 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

/* Markdown content styling */
.markdown-content {
  color: #e5e7eb;
  overflow-wrap: break-word;
  word-wrap: break-word;
  word-break: break-word;
  max-width: 100%;
  overflow-x: hidden;
  user-select: text;
  -webkit-user-select: text;
  -moz-user-select: text;
  -ms-user-select: text;
}

.markdown-content :deep(h1),
.markdown-content :deep(h2),
.markdown-content :deep(h3),
.markdown-content :deep(h4),
.markdown-content :deep(h5),
.markdown-content :deep(h6) {
  color: #ffffff;
  font-weight: 600;
  margin-top: 1em;
  margin-bottom: 0.5em;
}

.markdown-content :deep(h1) {
  font-size: 1.5em;
}

.markdown-content :deep(h2) {
  font-size: 1.25em;
}

.markdown-content :deep(h3) {
  font-size: 1.125em;
}

.markdown-content :deep(p) {
  margin-bottom: 0.75em;
  color: #e5e7eb;
  line-height: 1.6;
  user-select: text;
  -webkit-user-select: text;
}

.markdown-content :deep(strong) {
  color: #ffffff;
  font-weight: 600;
}

.markdown-content :deep(em) {
  font-style: italic;
}

.markdown-content :deep(ul),
.markdown-content :deep(ol) {
  margin-bottom: 0.75em;
  padding-left: 1.5em;
  color: #e5e7eb;
}

.markdown-content :deep(li) {
  margin-bottom: 0.25em;
  color: #e5e7eb;
}

.markdown-content :deep(code) {
  background-color: #374151;
  color: #93c5fd;
  padding: 0.125rem 0.375rem;
  border-radius: 0.25rem;
  font-size: 0.875em;
  font-family: 'JetBrains Mono', 'Courier New', monospace;
  overflow-wrap: break-word;
  word-wrap: break-word;
  word-break: break-all;
  white-space: pre-wrap;
}

.markdown-content :deep(pre) {
  background-color: #111827;
  color: #f3f4f6;
  padding: 1rem;
  padding-top: 2.5rem;
  border-radius: 0.5rem;
  overflow-x: auto;
  overflow-y: hidden;
  margin-bottom: 0.75em;
  max-width: 100%;
  white-space: pre;
  word-wrap: normal;
  word-break: normal;
  position: relative;
  user-select: text;
  -webkit-user-select: text;
  -moz-user-select: text;
  -ms-user-select: text;
  cursor: text;
}

.markdown-content :deep(pre.code-block-group) {
  position: relative;
}

.markdown-content :deep(pre.code-block-group:hover .code-copy-button) {
  opacity: 1;
}

.markdown-content :deep(.code-copy-button) {
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
}

/* For very long code lines, allow horizontal scroll but keep it contained */
.markdown-content :deep(pre code) {
  display: block;
  overflow-x: auto;
  white-space: pre;
  word-wrap: normal;
  word-break: normal;
  max-width: 100%;
  user-select: text;
  -webkit-user-select: text;
  -moz-user-select: text;
  -ms-user-select: text;
}

.markdown-content :deep(pre code) {
  background-color: transparent;
  color: inherit;
  padding: 0;
}

.markdown-content :deep(a) {
  color: #60a5fa;
  text-decoration: none;
  word-break: break-all;
  overflow-wrap: break-word;
}

.markdown-content :deep(a:hover) {
  text-decoration: underline;
}

.markdown-content :deep(blockquote) {
  border-left: 4px solid #4b5563;
  padding-left: 1rem;
  margin-left: 0;
  color: #9ca3af;
  font-style: italic;
}

.markdown-content :deep(table) {
  width: 100%;
  max-width: 100%;
  border-collapse: collapse;
  margin-bottom: 0.75em;
  table-layout: fixed;
  overflow-wrap: break-word;
}

.markdown-content :deep(th),
.markdown-content :deep(td) {
  border: 1px solid #4b5563;
  padding: 0.5rem;
  text-align: left;
  word-wrap: break-word;
  overflow-wrap: break-word;
  max-width: 0;
}

.markdown-content :deep(th) {
  background-color: #374151;
  font-weight: 600;
  color: #ffffff;
}

.markdown-content :deep(hr) {
  border: none;
  border-top: 1px solid #4b5563;
  margin: 1em 0;
}

/* Shimmer animation for loading button */
@keyframes shimmer {
  0% {
    background-position: -1000px 0;
  }
  100% {
    background-position: 1000px 0;
  }
}

.animate-shimmer {
  background-size: 1000px 100%;
  animation: shimmer 2s infinite linear;
  background-image: linear-gradient(
    to right,
    transparent 0%,
    rgba(255, 255, 255, 0.1) 50%,
    transparent 100%
  );
}

/* Loading screen animations */
@keyframes float {
  0%, 100% {
    transform: translateY(0px);
  }
  50% {
    transform: translateY(-10px);
  }
}

.animate-float {
  animation: float 3s ease-in-out infinite;
}

.animate-float-delayed {
  animation: float 3s ease-in-out infinite;
  animation-delay: 1s;
}

@keyframes gather {
  0%, 100% {
    transform: translateX(0) translateY(0);
  }
  25% {
    transform: translateX(-5px) translateY(-3px);
  }
  75% {
    transform: translateX(5px) translateY(-3px);
  }
}

.animate-gather {
  animation: gather 2s ease-in-out infinite;
}

@keyframes blink {
  0%, 90%, 100% {
    opacity: 1;
  }
  95% {
    opacity: 0.3;
  }
}

.animate-blink {
  animation: blink 3s ease-in-out infinite;
}

@keyframes blink-eye {
  0%, 90%, 100% {
    opacity: 1;
  }
  95% {
    opacity: 0;
  }
}

.animate-blink-eye {
  animation: blink-eye 3s ease-in-out infinite;
}

@keyframes scan {
  0%, 100% {
    transform: translateX(0);
  }
  50% {
    transform: translateX(5px);
  }
}

.animate-scan {
  animation: scan 2s ease-in-out infinite;
}

@keyframes read {
  0%, 100% {
    transform: translateY(0) rotate(0deg);
  }
  50% {
    transform: translateY(-3px) rotate(2deg);
  }
}

.animate-read {
  animation: read 3s ease-in-out infinite;
}

@keyframes think {
  0%, 100% {
    opacity: 0.3;
    transform: scale(1);
  }
  50% {
    opacity: 0.6;
    transform: scale(1.1);
  }
}

.animate-think {
  animation: think 2s ease-in-out infinite;
}
</style>
