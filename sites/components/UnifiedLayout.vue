<template>
  <div class="min-h-screen" :style="siteStyles">
    <!-- Header -->
    <CommonHeader 
      :site-name="siteData?.siteConfig?.siteName || siteData?.project?.name || 'Portfolio'"
      :site-description="siteData?.siteConfig?.siteDescription || ''"
    />

    <!-- Main Content -->
    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <!-- Single Post View -->
      <div v-if="isSinglePost && contentData" class="max-w-4xl mx-auto">
        <article class="prose prose-lg max-w-none">
          <header class="mb-10">
            <h1 class="text-5xl font-bold mb-6 leading-tight" :style="{ color: siteData.siteConfig.textColor }">
              {{ contentData.title || 'Untitled' }}
            </h1>
            <div class="flex items-center gap-4 text-sm mb-6" :style="{ color: siteData.siteConfig.textColor + '80' }">
              <span>{{ contentData.createdAt ? new Date(contentData.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'No date' }}</span>
              <span class="w-1 h-1 rounded-full" :style="{ backgroundColor: siteData.siteConfig.textColor + '40' }"></span>
              <span class="capitalize px-3 py-1 rounded-full text-xs font-medium" 
                    :style="{ 
                      backgroundColor: siteData.siteConfig.primaryColor + '15',
                      color: siteData.siteConfig.primaryColor 
                    }">
                {{ contentData.contentType?.toLowerCase() || 'post' }}
              </span>
            </div>
            <p v-if="contentData.excerpt" class="text-xl leading-relaxed mb-8" :style="{ color: siteData.siteConfig.textColor + 'CC' }">
              {{ cleanExcerpt }}
            </p>
          </header>

          <!-- Featured Image -->
          <div v-if="contentData.featuredImage" class="mb-10 rounded-xl overflow-hidden shadow-xl">
            <img 
              :src="contentData.featuredImage" 
              :alt="contentData.title"
              class="w-full h-auto object-cover"
            />
          </div>

          <!-- Content Body -->
          <div class="content-body" v-html="renderedContent"></div>
        </article>

        <!-- Navigation -->
        <div class="mt-16 pt-8 border-t" :style="{ borderColor: siteData.siteConfig.textColor + '15' }">
          <div class="flex justify-between items-center">
            <NuxtLink 
              :to="getArchiveLink(contentData.contentType)"
              class="group inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all duration-200"
              :style="{
                borderColor: siteData.siteConfig.textColor + '20',
                color: siteData.siteConfig.textColor + 'CC',
                backgroundColor: 'transparent'
              }"
              @mouseover="(e) => { e.target.style.backgroundColor = siteData.siteConfig.textColor + '08'; e.target.style.color = siteData.siteConfig.textColor }"
              @mouseleave="(e) => { e.target.style.backgroundColor = 'transparent'; e.target.style.color = siteData.siteConfig.textColor + 'CC' }"
            >
              <svg class="w-4 h-4 transition-transform group-hover:-translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>
              </svg>
              Back to {{ getArchiveName(contentData.contentType) }}
            </NuxtLink>
            <NuxtLink 
              to="/"
              class="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium text-white transition-all duration-200 hover:opacity-90"
              :style="{ backgroundColor: siteData.siteConfig.primaryColor }"
            >
              Home
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
              </svg>
            </NuxtLink>
          </div>
        </div>
      </div>

      <!-- Archive Page View -->
      <div v-else-if="isArchivePage" class="max-w-6xl mx-auto">
        <div class="text-center mb-16">
          <h1 class="text-5xl font-bold mb-4 leading-tight" :style="{ color: siteData.siteConfig.textColor }">
            {{ archiveTitle }}
          </h1>
          <p class="text-xl max-w-2xl mx-auto leading-relaxed" :style="{ color: siteData.siteConfig.textColor + 'CC' }">
            {{ archiveDescription }}
          </p>
        </div>

        <!-- Archive Content Grid -->
        <div v-if="archiveItems.length" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <NuxtLink
            v-for="item in archiveItems" 
            :key="item.id"
            :to="`/${getContentTypeSlug(item.contentType)}/${item.slug}`"
            class="group content-card rounded-xl overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:shadow-xl"
            :style="{
              backgroundColor: siteData.siteConfig.backgroundColor,
              border: `1px solid ${siteData.siteConfig.textColor}15`,
              boxShadow: `0 1px 3px ${siteData.siteConfig.textColor}08`
            }"
          >
            <!-- Featured Image or Placeholder -->
            <div class="relative h-48 overflow-hidden" :style="{ backgroundColor: siteData.siteConfig.textColor + '08' }">
              <img 
                v-if="item.featuredImage" 
                :src="item.featuredImage" 
                :alt="item.title"
                class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              />
              <div v-else class="w-full h-full flex items-center justify-center">
                <div class="text-center">
                  <div class="w-16 h-16 mx-auto mb-3 rounded-full flex items-center justify-center"
                       :style="{ backgroundColor: siteData.siteConfig.primaryColor + '20' }">
                    <svg class="w-8 h-8" :style="{ color: siteData.siteConfig.primaryColor }" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path>
                    </svg>
                  </div>
                </div>
              </div>
            </div>
            
            <!-- Card Content -->
            <div class="p-6">
              <div class="flex items-center gap-2 mb-3">
                <span class="text-xs font-medium uppercase tracking-wide px-2 py-1 rounded"
                      :style="{ 
                        backgroundColor: siteData.siteConfig.primaryColor + '15',
                        color: siteData.siteConfig.primaryColor 
                      }">
                  {{ item.contentType?.toLowerCase() || 'post' }}
                </span>
                <span class="text-xs" :style="{ color: siteData.siteConfig.textColor + '60' }">
                  {{ new Date(item.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) }}
                </span>
              </div>
              
              <h3 class="text-xl font-bold mb-3 leading-tight group-hover:underline" :style="{ color: siteData.siteConfig.textColor }">
                {{ item.title }}
              </h3>
              
              <p v-if="item.excerpt" class="text-sm leading-relaxed line-clamp-3 mb-4" :style="{ color: siteData.siteConfig.textColor + 'CC' }">
                {{ item.excerpt }}
              </p>
              
              <div class="flex items-center gap-2 text-sm font-medium" :style="{ color: siteData.siteConfig.primaryColor }">
                <span>Read more</span>
                <svg class="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
                </svg>
              </div>
            </div>
          </NuxtLink>
        </div>

        <!-- Empty State -->
        <div v-else class="text-center py-20">
          <div class="w-24 h-24 mx-auto mb-6 rounded-full flex items-center justify-center" 
               :style="{ backgroundColor: siteData.siteConfig.textColor + '08' }">
            <svg class="w-12 h-12" :style="{ color: siteData.siteConfig.textColor + '40' }" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path>
            </svg>
          </div>
          <h3 class="text-2xl font-semibold mb-3" :style="{ color: siteData.siteConfig.textColor }">
            No {{ archiveTitle }} Yet
          </h3>
          <p class="text-lg mb-8 max-w-md mx-auto" :style="{ color: siteData.siteConfig.textColor + 'CC' }">
            {{ archiveTitle }} will appear here when they're published.
          </p>
          <NuxtLink 
            to="/"
            class="inline-flex items-center gap-2 px-6 py-3 rounded-lg text-base font-medium transition-all duration-200"
            :style="{
              borderColor: siteData.siteConfig.textColor + '20',
              color: siteData.siteConfig.textColor,
              backgroundColor: siteData.siteConfig.textColor + '05'
            }"
            @mouseover="(e) => e.target.style.backgroundColor = siteData.siteConfig.textColor + '10'"
            @mouseleave="(e) => e.target.style.backgroundColor = siteData.siteConfig.textColor + '05'"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>
            </svg>
            Back to Home
          </NuxtLink>
        </div>
      </div>

      <!-- Home Page View -->
      <div v-else>
        <!-- Hero Section -->
        <div class="text-center mb-20">
          <!-- Profile Image -->
          <div v-if="siteData?.siteConfig?.profileImage && showProfileImage" class="mb-8">
            <img 
              :src="siteData.siteConfig.profileImage" 
              :alt="siteData?.siteConfig?.profileName || 'Profile'"
              class="w-40 h-40 mx-auto rounded-full object-cover border-4 shadow-2xl"
              :style="{ borderColor: siteData.siteConfig.primaryColor + '30' }"
              @error="handleImageError"
              @load="handleImageLoad"
            />
          </div>
          <div v-else-if="siteData?.siteConfig?.profileName" class="mb-8">
            <div class="w-40 h-40 mx-auto rounded-full flex items-center justify-center border-4 shadow-2xl"
                 :style="{
                   backgroundColor: siteData.siteConfig.textColor + '08',
                   borderColor: siteData.siteConfig.primaryColor + '30'
                 }">
              <svg class="w-20 h-20" :style="{ color: siteData.siteConfig.textColor + '50' }" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
              </svg>
            </div>
          </div>
          <h1 class="text-6xl font-bold mb-6 leading-tight" :style="{ color: siteData.siteConfig.textColor }">
            {{ siteData?.siteConfig?.profileName || siteData?.siteConfig?.siteName || siteData?.project?.name }}
          </h1>
          <p v-if="siteData?.siteConfig?.profileBio || siteData?.project?.description" 
             class="text-2xl max-w-3xl mx-auto leading-relaxed" 
             :style="{ color: siteData.siteConfig.textColor + 'CC' }">
            {{ siteData?.siteConfig?.profileBio || siteData?.project?.description }}
          </p>
        </div>

        <!-- Content Previews -->
        <div v-if="hasContent" class="space-y-20">
          <!-- Featured Projects -->
          <section v-if="siteData?.content?.projects?.length">
            <div class="flex items-center justify-between mb-8">
              <div>
                <h2 class="text-4xl font-bold mb-2" :style="{ color: siteData.siteConfig.textColor }">
                  Projects
                </h2>
                <p class="text-lg" :style="{ color: siteData.siteConfig.textColor + 'CC' }">
                  Explore my latest work
                </p>
              </div>
              <NuxtLink 
                to="/projects"
                class="hidden md:flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200"
                :style="{
                  color: siteData.siteConfig.primaryColor,
                  backgroundColor: siteData.siteConfig.primaryColor + '10'
                }"
                @mouseover="(e) => e.target.style.backgroundColor = siteData.siteConfig.primaryColor + '20'"
                @mouseleave="(e) => e.target.style.backgroundColor = siteData.siteConfig.primaryColor + '10'"
              >
                View all
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
                </svg>
              </NuxtLink>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <NuxtLink
                v-for="project in siteData.content.projects.slice(0, 6)" 
                :key="project.id"
                :to="`/project/${project.slug}`"
                class="group content-card rounded-xl overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:shadow-xl"
                :style="{
                  backgroundColor: siteData.siteConfig.backgroundColor,
                  border: `1px solid ${siteData.siteConfig.textColor}15`,
                  boxShadow: `0 1px 3px ${siteData.siteConfig.textColor}08`
                }"
              >
                <div class="relative h-48 overflow-hidden" :style="{ backgroundColor: siteData.siteConfig.textColor + '08' }">
                  <img 
                    v-if="project.featuredImage" 
                    :src="project.featuredImage" 
                    :alt="project.title"
                    class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  <div v-else class="w-full h-full flex items-center justify-center">
                    <div class="w-16 h-16 rounded-full flex items-center justify-center"
                         :style="{ backgroundColor: siteData.siteConfig.primaryColor + '20' }">
                      <svg class="w-8 h-8" :style="{ color: siteData.siteConfig.primaryColor }" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path>
                      </svg>
                    </div>
                  </div>
                </div>
                <div class="p-6">
                  <h3 class="text-xl font-bold mb-2 leading-tight group-hover:underline" :style="{ color: siteData.siteConfig.textColor }">
                    {{ project.title }}
                  </h3>
                  <p v-if="project.excerpt" class="text-sm leading-relaxed line-clamp-2 mb-4" :style="{ color: siteData.siteConfig.textColor + 'CC' }">
                    {{ project.excerpt }}
                  </p>
                  <div class="flex items-center gap-2 text-sm font-medium" :style="{ color: siteData.siteConfig.primaryColor }">
                    <span>View project</span>
                    <svg class="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
                    </svg>
                  </div>
                </div>
              </NuxtLink>
            </div>
            <div class="mt-6 text-center md:hidden">
              <NuxtLink 
                to="/projects"
                class="inline-flex items-center gap-2 px-6 py-3 rounded-lg text-base font-medium transition-all duration-200"
                :style="{
                  color: siteData.siteConfig.primaryColor,
                  backgroundColor: siteData.siteConfig.primaryColor + '10'
                }"
                @mouseover="(e) => e.target.style.backgroundColor = siteData.siteConfig.primaryColor + '20'"
                @mouseleave="(e) => e.target.style.backgroundColor = siteData.siteConfig.primaryColor + '10'"
              >
                View all projects
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
                </svg>
              </NuxtLink>
            </div>
          </section>

          <!-- Recent Blog Posts -->
          <section v-if="siteData?.content?.blogs?.length">
            <div class="flex items-center justify-between mb-8">
              <div>
                <h2 class="text-4xl font-bold mb-2" :style="{ color: siteData.siteConfig.textColor }">
                  Blog
                </h2>
                <p class="text-lg" :style="{ color: siteData.siteConfig.textColor + 'CC' }">
                  Latest thoughts and insights
                </p>
              </div>
              <NuxtLink 
                to="/blog"
                class="hidden md:flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200"
                :style="{
                  color: siteData.siteConfig.secondaryColor,
                  backgroundColor: siteData.siteConfig.secondaryColor + '10'
                }"
                @mouseover="(e) => e.target.style.backgroundColor = siteData.siteConfig.secondaryColor + '20'"
                @mouseleave="(e) => e.target.style.backgroundColor = siteData.siteConfig.secondaryColor + '10'"
              >
                View all
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
                </svg>
              </NuxtLink>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <NuxtLink
                v-for="blog in siteData.content.blogs.slice(0, 6)" 
                :key="blog.id"
                :to="`/blog/${blog.slug}`"
                class="group content-card rounded-xl overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:shadow-xl"
                :style="{
                  backgroundColor: siteData.siteConfig.backgroundColor,
                  border: `1px solid ${siteData.siteConfig.textColor}15`,
                  boxShadow: `0 1px 3px ${siteData.siteConfig.textColor}08`
                }"
              >
                <div class="relative h-48 overflow-hidden" :style="{ backgroundColor: siteData.siteConfig.textColor + '08' }">
                  <img 
                    v-if="blog.featuredImage" 
                    :src="blog.featuredImage" 
                    :alt="blog.title"
                    class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  <div v-else class="w-full h-full flex items-center justify-center">
                    <div class="w-16 h-16 rounded-full flex items-center justify-center"
                         :style="{ backgroundColor: siteData.siteConfig.secondaryColor + '20' }">
                      <svg class="w-8 h-8" :style="{ color: siteData.siteConfig.secondaryColor }" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                      </svg>
                    </div>
                  </div>
                </div>
                <div class="p-6">
                  <div class="flex items-center gap-2 mb-3">
                    <span class="text-xs" :style="{ color: siteData.siteConfig.textColor + '60' }">
                      {{ new Date(blog.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) }}
                    </span>
                  </div>
                  <h3 class="text-xl font-bold mb-2 leading-tight group-hover:underline" :style="{ color: siteData.siteConfig.textColor }">
                    {{ blog.title }}
                  </h3>
                  <p v-if="blog.excerpt" class="text-sm leading-relaxed line-clamp-2 mb-4" :style="{ color: siteData.siteConfig.textColor + 'CC' }">
                    {{ blog.excerpt }}
                  </p>
                  <div class="flex items-center gap-2 text-sm font-medium" :style="{ color: siteData.siteConfig.secondaryColor }">
                    <span>Read more</span>
                    <svg class="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
                    </svg>
                  </div>
                </div>
              </NuxtLink>
            </div>
            <div class="mt-6 text-center md:hidden">
              <NuxtLink 
                to="/blog"
                class="inline-flex items-center gap-2 px-6 py-3 rounded-lg text-base font-medium transition-all duration-200"
                :style="{
                  color: siteData.siteConfig.secondaryColor,
                  backgroundColor: siteData.siteConfig.secondaryColor + '10'
                }"
                @mouseover="(e) => e.target.style.backgroundColor = siteData.siteConfig.secondaryColor + '20'"
                @mouseleave="(e) => e.target.style.backgroundColor = siteData.siteConfig.secondaryColor + '10'"
              >
                View all posts
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
                </svg>
              </NuxtLink>
            </div>
          </section>

          <!-- Experiences -->
          <section v-if="siteData?.content?.experiences?.length">
            <div class="flex items-center justify-between mb-8">
              <div>
                <h2 class="text-4xl font-bold mb-2" :style="{ color: siteData.siteConfig.textColor }">
                  Experience
                </h2>
                <p class="text-lg" :style="{ color: siteData.siteConfig.textColor + 'CC' }">
                  Professional journey and achievements
                </p>
              </div>
              <NuxtLink 
                to="/experiences"
                class="hidden md:flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200"
                :style="{
                  color: siteData.siteConfig.accentColor,
                  backgroundColor: siteData.siteConfig.accentColor + '10'
                }"
                @mouseover="(e) => e.target.style.backgroundColor = siteData.siteConfig.accentColor + '20'"
                @mouseleave="(e) => e.target.style.backgroundColor = siteData.siteConfig.accentColor + '10'"
              >
                View all
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
                </svg>
              </NuxtLink>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <NuxtLink
                v-for="experience in siteData.content.experiences.slice(0, 6)" 
                :key="experience.id"
                :to="`/experience/${experience.slug}`"
                class="group content-card rounded-xl overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:shadow-xl"
                :style="{
                  backgroundColor: siteData.siteConfig.backgroundColor,
                  border: `1px solid ${siteData.siteConfig.textColor}15`,
                  boxShadow: `0 1px 3px ${siteData.siteConfig.textColor}08`
                }"
              >
                <div class="relative h-48 overflow-hidden" :style="{ backgroundColor: siteData.siteConfig.textColor + '08' }">
                  <img 
                    v-if="experience.featuredImage" 
                    :src="experience.featuredImage" 
                    :alt="experience.title"
                    class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  <div v-else class="w-full h-full flex items-center justify-center">
                    <div class="w-16 h-16 rounded-full flex items-center justify-center"
                         :style="{ backgroundColor: siteData.siteConfig.accentColor + '20' }">
                      <svg class="w-8 h-8" :style="{ color: siteData.siteConfig.accentColor }" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6a2 2 0 01-2 2H6a2 2 0 01-2-2V8a2 2 0 012-2V6"></path>
                      </svg>
                    </div>
                  </div>
                </div>
                <div class="p-6">
                  <h3 class="text-xl font-bold mb-2 leading-tight group-hover:underline" :style="{ color: siteData.siteConfig.textColor }">
                    {{ experience.title }}
                  </h3>
                  <p v-if="experience.excerpt" class="text-sm leading-relaxed line-clamp-2 mb-4" :style="{ color: siteData.siteConfig.textColor + 'CC' }">
                    {{ experience.excerpt }}
                  </p>
                  <div class="flex items-center gap-2 text-sm font-medium" :style="{ color: siteData.siteConfig.accentColor }">
                    <span>Learn more</span>
                    <svg class="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
                    </svg>
                  </div>
                </div>
              </NuxtLink>
            </div>
            <div class="mt-6 text-center md:hidden">
              <NuxtLink 
                to="/experiences"
                class="inline-flex items-center gap-2 px-6 py-3 rounded-lg text-base font-medium transition-all duration-200"
                :style="{
                  color: siteData.siteConfig.accentColor,
                  backgroundColor: siteData.siteConfig.accentColor + '10'
                }"
                @mouseover="(e) => e.target.style.backgroundColor = siteData.siteConfig.accentColor + '20'"
                @mouseleave="(e) => e.target.style.backgroundColor = siteData.siteConfig.accentColor + '10'"
              >
                View all experiences
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
                </svg>
              </NuxtLink>
            </div>
          </section>
        </div>

        <!-- Empty State -->
        <div v-else class="text-center py-20">
          <div class="w-24 h-24 mx-auto mb-6 rounded-full flex items-center justify-center border" 
               :style="{
                 backgroundColor: siteData.siteConfig.textColor + '08',
                 borderColor: siteData.siteConfig.textColor + '15'
               }">
            <svg class="w-12 h-12" :style="{ color: siteData.siteConfig.textColor + '40' }" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path>
            </svg>
          </div>
          <h3 class="text-2xl font-semibold mb-3" :style="{ color: siteData.siteConfig.textColor }">
            No Content Yet
          </h3>
          <p class="text-lg mb-8 max-w-md mx-auto" :style="{ color: siteData.siteConfig.textColor + 'CC' }">
            This site is ready to showcase your projects, blog posts, and experiences.
          </p>
        </div>
      </div>
    </main>

    <!-- Footer -->
    <footer class="border-t mt-20" :style="{ borderColor: siteData.siteConfig.textColor + '15' }">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div class="text-center">
          <p class="text-base" :style="{ color: siteData.siteConfig.textColor + 'CC' }">
            © {{ new Date().getFullYear() }} {{ siteData?.siteConfig?.siteName || siteData?.project?.name }}. 
            Powered by <a href="https://foligo.tech" :style="{ color: siteData.siteConfig.primaryColor }" class="hover:underline font-medium">Foligo</a>.
          </p>
        </div>
      </div>
    </footer>
  </div>
</template>

<script setup>
import { computed, ref, onMounted, watch, nextTick } from 'vue'
import { renderMarkdown } from '~/utils/markdownRenderer'
import mermaid from 'mermaid'

const props = defineProps({
  siteData: {
    type: Object,
    required: true
  },
  contentData: {
    type: Object,
    default: null
  },
  route: {
    type: Object,
    required: true
  }
})

// Image loading states
const showProfileImage = ref(true)

const handleImageError = (event) => {
  console.error('Failed to load profile image:', event.target.src)
  showProfileImage.value = false
}

const handleImageLoad = () => {
  showProfileImage.value = true
}

// Determine page type
const isSinglePost = computed(() => {
  return !!props.contentData
})

const isArchivePage = computed(() => {
  const slug = props.route.params.slug
  if (!slug || slug.length === 0) return false
  
  const firstSegment = slug[0]
  const archiveKeywords = ['projects', 'blog', 'experiences', 'contact', 'about']
  
  // If it's an archive keyword and there's only one segment, it's an archive page
  // If there are multiple segments, it might be a single post (e.g., /blog/my-post)
  return archiveKeywords.includes(firstSegment) && slug.length === 1
})

// Archive page data
const archiveType = computed(() => {
  if (!isArchivePage.value) return null
  const slug = props.route.params.slug
  return slug[0]
})

const archiveItems = computed(() => {
  if (!isArchivePage.value || !props.siteData?.content) return []
  
  switch (archiveType.value) {
    case 'projects':
      return props.siteData.content.projects || []
    case 'blog':
      return props.siteData.content.blogs || []
    case 'experiences':
      return props.siteData.content.experiences || []
    default:
      return []
  }
})

const archiveTitle = computed(() => {
  switch (archiveType.value) {
    case 'projects':
      return 'Projects'
    case 'blog':
      return 'Blog'
    case 'experiences':
      return 'Experiences'
    default:
      return 'Archive'
  }
})

const archiveDescription = computed(() => {
  switch (archiveType.value) {
    case 'projects':
      return 'Explore my portfolio of projects and creative work'
    case 'blog':
      return 'Thoughts, insights, and stories from my journey'
    case 'experiences':
      return 'Learn about my professional journey and experiences'
    default:
      return ''
  }
})

// Content helpers
const getContentTypeSlug = (contentType) => {
  const mapping = {
    'PROJECT': 'project',
    'BLOG': 'blog',
    'EXPERIENCE': 'experience'
  }
  return mapping[contentType] || 'post'
}

const getContentTypeName = (contentType) => {
  const mapping = {
    'PROJECT': 'Project',
    'BLOG': 'Post',
    'EXPERIENCE': 'Experience'
  }
  return mapping[contentType] || 'Item'
}

const getArchiveLink = (contentType) => {
  const mapping = {
    'PROJECT': '/projects',
    'BLOG': '/blog',
    'EXPERIENCE': '/experiences'
  }
  return mapping[contentType] || '/'
}

const getArchiveName = (contentType) => {
  const mapping = {
    'PROJECT': 'Projects',
    'BLOG': 'Blog',
    'EXPERIENCE': 'Experiences'
  }
  return mapping[contentType] || 'Archive'
}

// Dynamic styles based on site config
const siteStyles = computed(() => {
  if (!props.siteData?.siteConfig) return {}
  
  const config = props.siteData.siteConfig
  return {
    '--primary-color': config.primaryColor,
    '--secondary-color': config.secondaryColor,
    '--accent-color': config.accentColor,
    '--background-color': config.backgroundColor,
    '--text-color': config.textColor,
    backgroundColor: config.backgroundColor,
    color: config.textColor
  }
})

// Clean excerpt from markdown
const cleanExcerpt = computed(() => {
  if (!props.contentData?.excerpt) return ''
  return props.contentData.excerpt
    .replace(/^#+\s+/gim, '') // Remove headers
    .replace(/\*\*(.*?)\*\*/gim, '$1') // Remove bold
    .replace(/\*(.*?)\*/gim, '$1') // Remove italic
    .replace(/\[([^\]]+)\]\([^)]+\)/gim, '$1') // Remove links
    .replace(/`([^`]+)`/gim, '$1') // Remove inline code
    .trim()
})

// Render markdown content
const renderedContent = computed(() => {
  if (!props.contentData?.content) return ''
  return renderMarkdown(props.contentData.content)
})

const hasContent = computed(() => {
  const content = props.siteData?.content
  return content?.projects?.length || content?.blogs?.length || content?.experiences?.length || content?.other?.length
})

// Initialize mermaid with dark theme (same as MarkdownEditor.vue)
onMounted(() => {
  if (process.client) {
    mermaid.initialize({
      startOnLoad: false,
      theme: 'dark',
      securityLevel: 'loose',
      flowchart: {
        useMaxWidth: true,
        htmlLabels: true
      },
      themeVariables: {
        primaryColor: '#3b82f6',
        primaryTextColor: '#f3f4f6',
        primaryBorderColor: '#60a5fa',
        lineColor: '#9ca3af',
        secondaryColor: '#1f2937',
        tertiaryColor: '#111827',
        background: '#1f2937',
        mainBkgColor: '#1f2937',
        secondBkgColor: '#111827',
        textColor: '#f3f4f6',
        border1: '#374151',
        border2: '#4b5563',
        arrowheadColor: '#60a5fa',
        clusterBkg: '#111827',
        clusterBorder: '#374151',
        defaultLinkColor: '#60a5fa',
        titleColor: '#ffffff',
        edgeLabelBackground: '#1f2937',
        actorBorder: '#374151',
        actorBkg: '#1f2937',
        actorTextColor: '#f3f4f6',
        actorLineColor: '#9ca3af',
        signalColor: '#f3f4f6',
        signalTextColor: '#f3f4f6',
        labelBoxBkgColor: '#111827',
        labelBoxBorderColor: '#374151',
        labelTextColor: '#f3f4f6',
        loopTextColor: '#f3f4f6',
        noteBorderColor: '#374151',
        noteBkgColor: '#111827',
        noteTextColor: '#f3f4f6',
        activationBorderColor: '#60a5fa',
        activationBkgColor: '#1e40af',
        sequenceNumberColor: '#ffffff',
        sectionBkgColor: '#111827',
        altBkgColor: '#1f2937',
        sectionBkgColor2: '#111827',
        excludeBkgColor: '#374151',
        taskBorderColor: '#374151',
        taskBkgColor: '#1f2937',
        taskTextLightColor: '#f3f4f6',
        taskTextColor: '#f3f4f6',
        taskTextDarkColor: '#ffffff',
        taskTextOutsideColor: '#9ca3af',
        taskTextClickableColor: '#60a5fa',
        activeTaskBorderColor: '#60a5fa',
        activeTaskBkgColor: '#1e40af',
        gridColor: '#374151',
        doneTaskBkgColor: '#065f46',
        doneTaskBorderColor: '#10b981',
        critBorderColor: '#ef4444',
        critBkgColor: '#7f1d1d'
      }
    })
    
    // Render mermaid diagrams after content is rendered
    nextTick(() => {
      renderMermaidDiagrams()
    })
  }
})

// Watch for content changes and re-render mermaid
watch([renderedContent, () => props.contentData], () => {
  if (process.client) {
    nextTick(() => {
      // Remove processed flags to allow re-rendering (but keep error flags)
      const mermaidElements = document.querySelectorAll('.mermaid[data-processed]:not([data-error])')
      mermaidElements.forEach((el) => {
        el.removeAttribute('data-processed')
      })
      renderMermaidDiagrams()
    })
  }
}, { deep: true, flush: 'post' })

// Function to render mermaid diagrams (same approach as MarkdownEditor.vue)
const renderMermaidDiagrams = async () => {
  if (!process.client) return
  
  // Wait for DOM to be ready
  await new Promise(resolve => setTimeout(resolve, 50))
  
  const mermaidElements = document.querySelectorAll('.mermaid:not([data-processed]):not([data-error])')
  
  if (mermaidElements.length === 0) return
  
  try {
    // Process each mermaid element
    for (const el of Array.from(mermaidElements)) {
      // Skip elements that already have error or rendered content
      if (el.querySelector('svg') || el.querySelector('div[style*="color: #ef4444"]')) {
        el.setAttribute('data-processed', 'true')
        continue
      }
      
      // Get the mermaid code from the element
      const code = el.textContent?.trim() || ''
      
      if (!code) {
        console.warn('Empty mermaid code found, skipping')
        el.setAttribute('data-processed', 'true')
        continue
      }
      
      // Skip if the code looks like HTML (error message being re-rendered)
      if (code.includes('<div') || code.includes('Mermaid Error:')) {
        console.warn('Skipping element with error HTML content')
        el.setAttribute('data-error', 'true')
        el.setAttribute('data-processed', 'true')
        continue
      }
      
      // Store the original code in a data attribute for potential retries
      el.setAttribute('data-mermaid-code', code)
      
      // Mark as being processed
      el.setAttribute('data-processed', 'true')
      
      // Generate unique ID for this diagram
      const id = `mermaid-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      
      try {
        // Use mermaid.render() API (v10+)
        if (typeof mermaid.render === 'function') {
          const { svg } = await mermaid.render(id, code)
          el.innerHTML = svg
          el.classList.add('mermaid-rendered')
        } else if (typeof mermaid.run === 'function') {
          // Fallback to mermaid.run() API
          el.id = id
          await mermaid.run({ nodes: [el] })
        } else {
          throw new Error('Mermaid API not available')
        }
      } catch (renderError) {
        console.error('Error rendering mermaid diagram:', renderError)
        // Mark as error to prevent re-rendering
        el.setAttribute('data-error', 'true')
        // Show error message in the element
        el.innerHTML = `<div style="color: #ef4444; padding: 8px; background: #7f1d1d; border-radius: 4px; font-family: monospace; font-size: 12px;">
          <strong>Mermaid Error:</strong> ${renderError instanceof Error ? renderError.message : 'Failed to render diagram'}<br>
          <small>Code: ${code.substring(0, 100)}${code.length > 100 ? '...' : ''}</small>
        </div>`
      }
    }
  } catch (error) {
    console.error('Mermaid rendering error:', error)
  }
}
</script>

<style scoped>
.prose {
  color: inherit;
}

.prose h1,
.prose h2,
.prose h3,
.prose h4,
.prose h5,
.prose h6 {
  color: inherit;
  margin-top: 2rem;
  margin-bottom: 1rem;
  font-weight: 600;
}

.prose h1 {
  font-size: 2.25rem;
  line-height: 2.5rem;
}

.prose h2 {
  font-size: 1.875rem;
  line-height: 2.25rem;
}

.prose h3 {
  font-size: 1.5rem;
  line-height: 2rem;
}

.content-body {
  line-height: 1.8;
  font-size: 1.125rem;
  color: #e5e7eb !important; /* gray-200 for dark mode */
}

.content-body > * {
  margin-bottom: 1.5rem;
  color: inherit;
}

.content-body h1,
.content-body h2,
.content-body h3,
.content-body h4,
.content-body h5,
.content-body h6 {
  margin-top: 2.5rem;
  margin-bottom: 1rem;
  font-weight: 700;
  line-height: 1.3;
  color: #ffffff !important; /* white for headings in dark mode */
}

.content-body h1 {
  font-size: 2.5rem;
}

.content-body h2 {
  font-size: 2rem;
}

.content-body h3 {
  font-size: 1.5rem;
}

.content-body p {
  margin-bottom: 1.5rem;
  color: #e5e7eb !important; /* gray-200 */
}

.content-body a {
  text-decoration: underline;
  text-underline-offset: 3px;
  font-weight: 500;
  color: #60a5fa !important; /* blue-400 for dark mode */
}

.content-body a:hover {
  color: #93c5fd !important; /* blue-300 */
  opacity: 0.9;
}

.content-body ul,
.content-body ol {
  margin-bottom: 1.5rem;
  padding-left: 1.75rem;
  color: #e5e7eb !important;
}

.content-body li {
  margin-bottom: 0.75rem;
  color: #e5e7eb !important;
}

.content-body strong {
  font-weight: 600;
  color: #ffffff !important;
}

.content-body em {
  font-style: italic;
  color: #d1d5db !important; /* gray-300 */
}

.content-body blockquote {
  border-left: 4px solid #3b82f6; /* blue-500 */
  padding-left: 1.5rem;
  margin: 2rem 0;
  font-style: italic;
  background-color: rgba(17, 24, 39, 0.5); /* gray-900 with opacity */
  padding: 1rem 1.5rem;
  border-radius: 0.5rem;
  color: #d1d5db !important; /* gray-300 */
}

.content-body code {
  background-color: #111827 !important; /* gray-900 */
  color: #60a5fa !important; /* blue-400 */
  padding: 0.2rem 0.5rem;
  border-radius: 0.375rem;
  font-size: 0.9em;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', 'Consolas', 'source-code-pro', monospace;
  border: 1px solid #374151; /* gray-700 */
}

.content-body pre {
  background-color: #111827 !important; /* gray-900 */
  border: 1px solid #374151 !important; /* gray-700 */
  padding: 1.25rem;
  border-radius: 0.5rem;
  overflow-x: auto;
  margin: 2rem 0;
}

.content-body pre code {
  background-color: transparent !important;
  color: #f3f4f6 !important; /* gray-100 */
  padding: 0;
  font-size: 0.875rem;
  line-height: 1.7;
  border: none;
}

.content-body img {
  max-width: 100%;
  height: auto;
  border-radius: 0.75rem;
  margin: 2rem 0;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.3);
}

.content-body table {
  width: 100%;
  border-collapse: collapse;
  margin: 2rem 0;
}

.content-body th,
.content-body td {
  border: 1px solid #374151 !important; /* gray-700 */
  padding: 0.75rem;
  text-align: left;
  color: #e5e7eb !important;
}

.content-body th {
  font-weight: 600;
  background-color: #111827 !important; /* gray-900 */
  color: #ffffff !important;
}

/* Content card styling */
.content-card {
  display: block;
  text-decoration: none;
}

.content-card:hover {
  text-decoration: none;
}

/* Line clamp utility */
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.line-clamp-3 {
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* Mermaid diagram styling - Dark Mode */
.content-body .mermaid {
  margin: 2.5rem 0;
  text-align: center;
  background-color: #111827 !important; /* gray-900 */
  padding: 1.5rem;
  border-radius: 0.75rem;
  border: 1px solid #374151; /* gray-700 */
  overflow-x: auto;
}

.content-body .mermaid svg {
  max-width: 100%;
  height: auto;
  background-color: #111827 !important;
}

/* Ensure mermaid diagrams are visible in dark mode */
.content-body .mermaid :deep(svg) {
  background-color: #111827 !important;
}

.content-body .mermaid :deep(.node rect),
.content-body .mermaid :deep(.node circle),
.content-body .mermaid :deep(.node ellipse),
.content-body .mermaid :deep(.node polygon) {
  fill: #1f2937 !important; /* gray-800 */
  stroke: #60a5fa !important; /* blue-400 */
}

.content-body .mermaid :deep(.nodeLabel) {
  color: #f3f4f6 !important; /* gray-100 */
}

.content-body .mermaid :deep(.edgeLabel) {
  background-color: #1f2937 !important;
  color: #f3f4f6 !important;
}

.content-body .mermaid :deep(.edgePath .path) {
  stroke: #60a5fa !important;
}

.content-body .mermaid :deep(.arrowheadPath) {
  fill: #60a5fa !important;
}

.content-body .mermaid :deep(.cluster rect) {
  fill: #111827 !important;
  stroke: #374151 !important;
}

.content-body .mermaid :deep(.cluster-label text) {
  fill: #ffffff !important;
}
</style>
