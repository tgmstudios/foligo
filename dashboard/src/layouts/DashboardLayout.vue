<template>
  <div class="min-h-screen bg-gray-900">
    <!-- Sidebar -->
    <div class="fixed inset-y-0 left-0 z-50 w-64 bg-gray-800 shadow-lg transform transition-transform duration-300 ease-in-out"
         :class="sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'">
      <div class="flex items-center justify-between h-16 px-6 border-b border-gray-700">
        <router-link to="/" class="flex items-center hover:opacity-80 transition-opacity">
          <div class="flex-shrink-0">
            <img :src="squiggleLogo" alt="Foligo" class="h-8 w-auto" />
          </div>
          <div class="ml-3">
            <h1 class="text-xl font-bold text-white">Foligo</h1>
          </div>
        </router-link>
        <button
          @click="sidebarOpen = false"
          class="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-300 hover:bg-gray-700"
        >
          <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      
      <nav class="mt-6 px-3">
        <!-- Settings Navigation -->
        <div v-if="isSettingsRoute" class="space-y-1">
          <button
            @click="router.push('/')"
            class="w-full text-left sidebar-item sidebar-item-inactive mb-4"
          >
            <svg class="mr-3 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Dashboard
          </button>
          <router-link
            to="/settings"
            class="sidebar-item"
            :class="$route.path === '/settings' ? 'sidebar-item-active' : 'sidebar-item-inactive'"
          >
            <svg class="mr-3 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            User Settings
          </router-link>
          <router-link
            v-if="authStore.user?.isAdmin"
            to="/settings/site"
            class="sidebar-item"
            :class="$route.path === '/settings/site' ? 'sidebar-item-active' : 'sidebar-item-inactive'"
          >
            <svg class="mr-3 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Site-wide Settings
          </router-link>
          
          <!-- Admin Section Divider -->
          <div v-if="authStore.user?.isAdmin" class="my-4 border-t border-gray-700"></div>
          
          <!-- Admin Links -->
          <router-link
            v-if="authStore.user?.isAdmin"
            to="/admin"
            class="sidebar-item"
            :class="($route.path === '/admin' || ($route.path.startsWith('/admin/') && !$route.path.startsWith('/admin/sso'))) ? 'sidebar-item-active' : 'sidebar-item-inactive'"
          >
            <svg class="mr-3 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            Admin Dashboard
          </router-link>
          <router-link
            v-if="authStore.user?.isAdmin"
            to="/admin/sso"
            class="sidebar-item"
            :class="$route.path.startsWith('/admin/sso') ? 'sidebar-item-active' : 'sidebar-item-inactive'"
          >
            <svg class="mr-3 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            SSO Providers
          </router-link>
        </div>

        <!-- Regular Navigation -->
        <div v-else class="space-y-1">
          <template v-for="item in navigation" :key="item.name">
            <!-- Divider -->
            <div v-if="item.name === 'divider'" class="my-4 border-t border-gray-700"></div>
            <!-- Navigation Item -->
            <router-link
              v-else
              :to="item.href"
              class="sidebar-item"
              :class="$route.name === item.routeName ? 'sidebar-item-active' : 'sidebar-item-inactive'"
            >
              <!-- Dashboard Icon -->
              <svg v-if="item.icon === 'DashboardIcon'" class="mr-3 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              <!-- Blogs Icon -->
              <svg v-else-if="item.icon === 'ContentIcon' && item.name === 'Blogs'" class="mr-3 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <!-- Experience Icon -->
              <svg v-else-if="item.icon === 'ContentIcon' && item.name === 'Experience'" class="mr-3 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <!-- Projects Icon -->
              <svg v-else-if="item.icon === 'ProjectsIcon' && item.name === 'Projects'" class="mr-3 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              <!-- Portfolios Icon -->
              <svg v-else-if="item.icon === 'ProjectsIcon' && item.name === 'Portfolios'" class="mr-3 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
              <!-- Analytics Icon -->
              <svg v-else-if="item.icon === 'AnalyticsIcon'" class="mr-3 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <!-- Media Library Icon -->
              <svg v-else-if="item.icon === 'MediaIcon'" class="mr-3 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <!-- Resume Icon -->
              <svg v-else-if="item.icon === 'ResumeIcon'" class="mr-3 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <!-- Admin Icon -->
              <svg v-else-if="item.icon === 'AdminIcon'" class="mr-3 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <!-- Default Icon (fallback) -->
              <svg v-else class="mr-3 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
              </svg>
              {{ item.name }}
            </router-link>
          </template>
        </div>
        
        <!-- AI Assistants Section -->
        <div v-if="!isSettingsRoute" class="mt-8 pt-6 border-t border-gray-700">
          <div class="px-3 mb-3">
            <h3 class="text-xs font-semibold text-gray-400 uppercase tracking-wider">AI Assistants</h3>
          </div>
          <div class="space-y-1">
            <router-link
              to="/resume-chatbot"
              class="sidebar-item"
              :class="$route.name === 'resume-chatbot' ? 'sidebar-item-active' : 'sidebar-item-inactive'"
            >
              <svg class="mr-3 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span>Resume Assistant</span>
            </router-link>
          </div>
        </div>

        <!-- Content Creation Section -->
        <div v-if="!isSettingsRoute" class="mt-8 pt-6 border-t border-gray-700">
          <div class="px-3 mb-3">
            <h3 class="text-xs font-semibold text-gray-400 uppercase tracking-wider">Create Content</h3>
          </div>
          <div class="space-y-1">
            <router-link
              to="/portfolios"
              class="sidebar-item"
              :class="$route.name === 'portfolios' ? 'sidebar-item-active' : 'sidebar-item-inactive'"
            >
              <svg class="mr-3 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
              </svg>
              <span>New Portfolio</span>
            </router-link>
            <router-link
              to="/content/new/blog"
              class="sidebar-item"
              :class="$route.name === 'create-content' && $route.params.type === 'blog' ? 'sidebar-item-active' : 'sidebar-item-inactive'"
            >
              <svg class="mr-3 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              <span>New Blog Post</span>
            </router-link>
            <router-link
              to="/content/new/experience"
              class="sidebar-item"
              :class="$route.name === 'create-content' && $route.params.type === 'experience' ? 'sidebar-item-active' : 'sidebar-item-inactive'"
            >
              <svg class="mr-3 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <span>New Experience</span>
            </router-link>
            <router-link
              to="/content/new/skill"
              class="sidebar-item"
              :class="$route.name === 'create-content' && $route.params.type === 'skill' ? 'sidebar-item-active' : 'sidebar-item-inactive'"
            >
              <svg class="mr-3 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <span>New Skill</span>
            </router-link>
          </div>
        </div>
      </nav>
      
      <!-- User Profile -->
      <div class="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-700">
        <div class="flex items-center">
          <div class="flex-shrink-0">
            <div class="h-8 w-8 bg-primary-600 rounded-full flex items-center justify-center">
              <span class="text-white text-sm font-medium">{{ authStore.userInitials }}</span>
            </div>
          </div>
          <div class="ml-3 flex-1 min-w-0">
            <p class="text-sm font-medium text-white truncate">{{ authStore.user?.name }}</p>
            <p class="text-xs text-gray-400 truncate">{{ authStore.user?.email }}</p>
            <p v-if="authStore.user?.isAdmin" class="text-xs text-red-400 font-medium">Admin</p>
          </div>
          <div class="ml-2">
            <button
              @click="showUserMenu = !showUserMenu"
              class="p-1 rounded-md text-gray-400 hover:text-gray-300 hover:bg-gray-700"
            >
              <svg class="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
              </svg>
            </button>
          </div>
        </div>
        
        <!-- User Menu Dropdown -->
        <div v-if="showUserMenu" class="absolute bottom-16 left-4 right-4 bg-gray-700 rounded-md shadow-lg border border-gray-600 py-1 z-50">
          <router-link
            v-if="authStore.user?.isAdmin"
            to="/admin"
            @click="showUserMenu = false"
            class="block px-4 py-2 text-sm text-gray-200 hover:bg-gray-600"
          >
            Admin Dashboard
          </router-link>
          <router-link
            to="/settings"
            @click="showUserMenu = false"
            class="block px-4 py-2 text-sm text-gray-200 hover:bg-gray-600"
          >
            User Settings
          </router-link>
          <div v-if="authStore.user?.isAdmin" class="border-t border-gray-600 my-1"></div>
          <button
            @click="handleLogout"
            class="block w-full text-left px-4 py-2 text-sm text-gray-200 hover:bg-gray-600"
          >
            Sign out
          </button>
        </div>
      </div>
    </div>
    
      <!-- Mobile sidebar overlay -->
    <div
      v-if="sidebarOpen"
      @click="sidebarOpen = false"
      class="fixed inset-0 z-40 bg-black bg-opacity-75 lg:hidden"
    ></div>
    
    <!-- Main content -->
    <div class="lg:pl-64">
      <!-- Top bar -->
      <div class="sticky top-0 z-40 bg-gray-800 shadow-sm border-b border-gray-700">
        <div class="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
          <div class="flex items-center">
            <button
              @click="sidebarOpen = true"
              class="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-300 hover:bg-gray-700"
            >
              <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <h2 class="ml-2 text-lg font-semibold text-white">{{ pageTitle }}</h2>
          </div>
          
          <!-- Portfolio Selector -->
          <div class="flex items-center space-x-4">
            <div class="flex items-center space-x-2">
              <label class="text-sm font-medium text-gray-300">Portfolio:</label>
              <select
                v-model="selectedProjectId"
                @change="onProjectChange"
                class="px-3 py-1.5 text-sm border border-gray-600 rounded-md focus:ring-primary-500 focus:border-primary-500 bg-gray-700 text-white"
              >
                <option value="">All Portfolios</option>
                <option
                  v-for="project in projects"
                  :key="project.id"
                  :value="project.id"
                >
                  {{ project.name }}
                </option>
              </select>
            </div>
          </div>
          
          <div class="flex items-center space-x-4">
            <!-- AI Content Creator -->
            <button 
              @click="handleCreateContent"
              :disabled="!selectedProjectId"
              class="p-2 rounded-md text-gray-400 hover:text-gray-300 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed relative"
              title="Create content with AI"
            >
              <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </button>
            
            <!-- Search -->
            <div class="hidden md:block">
              <div class="relative">
                <input
                  v-model="searchQuery"
                  type="text"
                  placeholder="Search projects and posts..."
                  @input="handleSearch"
                  class="w-64 pl-10 pr-4 py-2 border border-gray-600 rounded-md focus:ring-primary-500 focus:border-primary-500 bg-gray-700 text-white"
                />
                <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg class="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <div v-if="searchResults.length > 0" class="absolute z-50 right-0 mt-2 w-96 bg-gray-800 rounded-md shadow-lg border border-gray-600 max-h-96 overflow-y-auto">
                  <div class="py-2">
                    <div v-for="result in searchResults" :key="result.id" class="px-4 py-2 hover:bg-gray-700 cursor-pointer" @click="navigateToResult(result)">
                      <div class="flex items-start">
                        <div class="flex-shrink-0">
                          <div :class="`h-8 w-8 ${result.type === 'project' ? 'bg-blue-100' : 'bg-green-100'} rounded-lg flex items-center justify-center`">
                            <svg :class="`h-5 w-5 ${result.type === 'project' ? 'text-blue-600' : 'text-green-600'}`" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path v-if="result.type === 'project'" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                              <path v-else stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                          </div>
                        </div>
                        <div class="ml-3 flex-1 min-w-0">
                          <p class="text-sm font-medium text-white truncate">{{ result.title }}</p>
                          <p class="text-xs text-gray-400 truncate">{{ result.subtitle }}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Page content -->
      <main class="flex-1">
        <router-view />
      </main>
    </div>

    <!-- AI Content Creator Modal -->
    <AIContentCreatorModal
      ref="aiModalRef"
      mode="create"
      :project-id="selectedProjectId"
      @content-generated="handleContentGenerated"
      @content-created="handleContentCreated"
      :key="`ai-modal-${selectedProjectId}`"
    />
  </div>
</template>

<script setup lang="ts">
import squiggleLogo from '@/assets/logos/squiggle.svg'
import { ref, computed, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useProjectStore } from '@/stores/projects'
import { formatContentType } from '@/utils'
import AIContentCreatorModal from '@/components/AIContentCreatorModal.vue'
import api from '@/services/api'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const projectStore = useProjectStore()

const sidebarOpen = ref(false)
const showUserMenu = ref(false)
const selectedProjectId = ref('')
const searchQuery = ref('')
const searchResults = ref<Array<{id: string, type: string, title: string, subtitle: string, route: string}>>([])

const navigation = computed(() => {
  const items = [
    {
      name: 'Dashboard',
      href: '/',
      routeName: 'dashboard',
      icon: 'DashboardIcon'
    },
    {
      name: 'Blogs',
      href: '/blogs',
      routeName: 'blogs',
      icon: 'ContentIcon'
    },
    {
      name: 'Projects',
      href: '/projects',
      routeName: 'projects-content',
      icon: 'ProjectsIcon'
    },
    {
      name: 'Experience',
      href: '/experience',
      routeName: 'experience',
      icon: 'ContentIcon'
    },
    {
      name: 'Portfolios',
      href: '/portfolios',
      routeName: 'portfolios',
      icon: 'ProjectsIcon'
    },
    {
      name: 'Analytics',
      href: '/analytics',
      routeName: 'analytics',
      icon: 'AnalyticsIcon'
    },
    {
      name: 'Media Library',
      href: '/media',
      routeName: 'media-library',
      icon: 'MediaIcon'
    }
  ]

  return items
})

const projects = computed(() => projectStore.projects)

const selectedProject = computed(() => {
  if (!selectedProjectId.value) return null
  return projectStore.projects.find(p => p.id === selectedProjectId.value)
})

const isSettingsRoute = computed(() => {
  return route.path.startsWith('/settings') || route.path.startsWith('/admin')
})

const onProjectChange = () => {
  // Store the selected project ID globally for easy access
  ;(window as any).selectedProjectId = selectedProjectId.value
  
  // Emit event for child components to listen to
  window.dispatchEvent(new CustomEvent('project-changed', { 
    detail: { projectId: selectedProjectId.value, project: selectedProject.value }
  }))
}

const pageTitle = computed(() => {
  const routeNames: Record<string, string> = {
    dashboard: 'Dashboard',
    projects: 'Projects',
    'project-detail': 'Project Details',
    'content-editor': 'Content Editor',
    analytics: 'Analytics',
    users: 'Users',
    settings: 'User Settings',
    'site-settings': 'Site-wide Settings',
    'admin-dashboard': 'Admin Dashboard',
    'admin-users': 'User Management',
    'admin-projects': 'Portfolio Management',
    'admin-content': 'Content Management',
    'admin-sso': 'SSO Providers',
    'resume-chatbot': 'Resume & Job Application Assistant'
  }
  return routeNames[route.name as string] || 'Dashboard'
})

const handleLogout = async () => {
  await authStore.logout()
  router.push('/login')
}

const aiModalRef = ref<InstanceType<typeof AIContentCreatorModal> | null>(null)

const handleCreateContent = () => {
  if (!selectedProjectId.value) {
    alert('Please select a project first')
    return
  }
  
  // Open AI content creation modal
  if (aiModalRef.value) {
    aiModalRef.value.open()
  }
}

// Handler for new /ai/create endpoint - content is already created
const handleContentCreated = async (data: { id: string; content: any }) => {
  console.log('[DashboardLayout] Content created by AI:', data.id)
  
  if (!selectedProjectId.value) {
    console.error('No project selected')
    return
  }
  
  try {
    // Refresh project data to ensure the new content appears in lists
    console.log('[DashboardLayout] Refreshing project data...')
    await projectStore.fetchProject(selectedProjectId.value)
    
    // Small delay to ensure reactivity has propagated
    await new Promise(resolve => setTimeout(resolve, 100))
    
    // Navigate to the content editor
    const editorUrl = `/portfolios/${selectedProjectId.value}/content/${data.id}/edit`
    console.log('[DashboardLayout] Navigating to:', editorUrl)
    await router.push(editorUrl)
    
    console.log('[DashboardLayout] Navigation complete')
  } catch (error) {
    console.error('[DashboardLayout] Failed to navigate to content:', error)
  }
}

// Legacy handler for old content-generated event (kept for backwards compatibility)
const handleContentGenerated = async (data: { content: string; title?: string; excerpt?: string; metadata: any; skills?: any[]; tags?: any[] }) => {
  if (!selectedProjectId.value) return
  
  // Navigate to content editor or create a new content item
  try {
    const contentType = data.metadata.contentType || 'BLOG'
    
    // Extract excerpt from content if not provided
    const excerpt = data.excerpt || data.content.substring(0, 200).replace(/\n/g, ' ').trim() + '...'
    
    const contentData: any = {
      contentType,
      title: data.title || 'AI Generated Content',
      excerpt: excerpt,
      content: data.content,
      status: 'DRAFT' as const
    }
    
    // Add type-specific fields from metadata
    if (contentType === 'PROJECT') {
      if (data.metadata.startDate) {
        const startDate = new Date(data.metadata.startDate)
        contentData.startDate = isNaN(startDate.getTime()) ? null : startDate.toISOString()
      }
      if (data.metadata.endDate) {
        const endDate = new Date(data.metadata.endDate)
        contentData.endDate = isNaN(endDate.getTime()) ? null : endDate.toISOString()
      }
      if (data.metadata.isOngoing !== undefined) contentData.isOngoing = data.metadata.isOngoing
      if (data.metadata.projectLinks) contentData.projectLinks = data.metadata.projectLinks
      if (data.metadata.contributors) contentData.contributors = data.metadata.contributors
      if (data.metadata.featuredImage) contentData.featuredImage = data.metadata.featuredImage
    }
    
    if (contentType === 'EXPERIENCE') {
      if (data.metadata.experienceCategory) contentData.experienceCategory = data.metadata.experienceCategory
      if (data.metadata.startDate) {
        const startDate = new Date(data.metadata.startDate)
        contentData.startDate = isNaN(startDate.getTime()) ? null : startDate.toISOString()
      }
      if (data.metadata.endDate) {
        const endDate = new Date(data.metadata.endDate)
        contentData.endDate = isNaN(endDate.getTime()) ? null : endDate.toISOString()
      }
      if (data.metadata.isOngoing !== undefined) contentData.isOngoing = data.metadata.isOngoing
      if (data.metadata.location) contentData.location = data.metadata.location
      if (data.metadata.locationType) contentData.locationType = data.metadata.locationType
    }
    
    if (contentType === 'SKILL') {
      if (data.metadata.categoryTag) contentData.metadata = { categoryTag: data.metadata.categoryTag }
    }
    
    const newContent = await projectStore.createContent(selectedProjectId.value, contentData)
    
    // Link skills if provided
    if (data.skills && Array.isArray(data.skills) && data.skills.length > 0) {
      try {
        const skillIds = data.skills.map(skill => skill.id)
        await api.post(`/projects/${selectedProjectId.value}/content/${newContent.id}/skills`, {
          skillIds: skillIds
        })
      } catch (error) {
        console.error('Failed to link skills:', error)
        // Continue even if skill linking fails - user can add them manually
      }
    }
    
    // Link tags if provided
    if (data.tags && Array.isArray(data.tags) && data.tags.length > 0) {
      try {
        const tagIds = data.tags.map(tag => tag.id)
        await api.post(`/projects/${selectedProjectId.value}/content/${newContent.id}/tags`, {
          tagIds: tagIds
        })
      } catch (error) {
        console.error('Failed to link tags:', error)
        // Continue even if tag linking fails - user can add them manually
      }
    }
    
    // Create roles if this is an experience with roles in metadata
    if (contentType === 'EXPERIENCE' && data.metadata.roles && Array.isArray(data.metadata.roles) && data.metadata.roles.length > 0) {
      try {
        // Get all skills to match by name
        const allSkills = await api.get('/skills')
        const skillsMap = new Map()
        allSkills.data.forEach((skill: any) => {
          const key = skill.name.toLowerCase()
          if (!skillsMap.has(key)) {
            skillsMap.set(key, skill)
          }
        })
        
        // Create each role
        for (const roleData of data.metadata.roles) {
          const skillIds: string[] = []
          
          // Match skills by name
          if (roleData.skills && Array.isArray(roleData.skills)) {
            for (const skillName of roleData.skills) {
              const skill = skillsMap.get(skillName.toLowerCase())
              if (skill) {
                skillIds.push(skill.id)
              }
            }
          }
          
          await api.post(`/projects/${selectedProjectId.value}/content/${newContent.id}/roles`, {
            title: roleData.title,
            description: roleData.description || null,
            startDate: roleData.startDate,
            endDate: roleData.endDate || null,
            isCurrent: roleData.isCurrent || false,
            skillIds: skillIds
          })
        }
      } catch (error) {
        console.error('Failed to create roles:', error)
        // Continue even if role creation fails - user can add them manually
      }
    }
    
    // Navigate to the content editor
    router.push(`/portfolios/${selectedProjectId.value}/content/${newContent.id}/edit`)
  } catch (error) {
    console.error('Failed to create content:', error)
    alert('Failed to create content. Please try again.')
  }
}

const handleSearch = () => {
  if (!searchQuery.value || searchQuery.value.length < 2) {
    searchResults.value = []
    return
  }

  const query = searchQuery.value.toLowerCase()
  const results: Array<{id: string, type: string, title: string, subtitle: string, route: string}> = []

  // Search projects
  projectStore.projects.forEach(project => {
    if (project.name.toLowerCase().includes(query) || 
        (project.description && project.description.toLowerCase().includes(query))) {
      results.push({
        id: project.id,
        type: 'project',
        title: project.name,
        subtitle: project.description || 'No description',
        route: `/projects/${project.id}`
      })
    }
  })

  // Search content/posts
  projectStore.projects.forEach(project => {
    if (project.content) {
      project.content.forEach(content => {
        if (content.title.toLowerCase().includes(query) ||
            content.excerpt?.toLowerCase().includes(query) ||
            content.content.toLowerCase().includes(query)) {
          results.push({
            id: content.id,
            type: 'post',
            title: content.title,
            subtitle: `${formatContentType(content.type)} in ${project.name}`,
            route: `/portfolios/${project.id}/content/${content.id}/edit`
          })
        }
      })
    }
  })

  searchResults.value = results.slice(0, 10) // Limit to 10 results
}

const navigateToResult = (result: {id: string, type: string, title: string, subtitle: string, route: string}) => {
  router.push(result.route)
  searchQuery.value = ''
  searchResults.value = []
}

// Close search results when clicking outside
const handleClickOutside = (event: MouseEvent) => {
  const target = event.target as HTMLElement
  if (!target.closest('.search-container')) {
    searchResults.value = []
  }
}

// Close sidebar on route change (mobile)
watch(route, () => {
  sidebarOpen.value = false
})

watch(searchQuery, () => {
  if (!searchQuery.value) {
    searchResults.value = []
  }
})

// Load projects on mount and setup click handler
onMounted(() => {
  document.addEventListener('click', handleClickOutside)
  
  projectStore.fetchProjects().then(() => {
    // Auto-select first project if none is selected
    if (!selectedProjectId.value && projectStore.projects.length > 0) {
      selectedProjectId.value = projectStore.projects[0].id
      onProjectChange()
    }
  })
})
</script>
