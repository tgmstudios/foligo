<template>
  <div>
    <!-- Page Header -->
    <section class="section-padding bg-gray-50">
      <Container>
        <Breadcrumb :items="breadcrumbItems" class="mb-8" />
        <div class="text-center">
          <Heading :size="'3xl'" :weight="'bold'" class="mb-4">
            My Projects
          </Heading>
          <p class="text-gray-600 max-w-2xl mx-auto text-lg">
            A curated collection of projects that showcase my skills, creativity, and problem-solving approach.
          </p>
        </div>
      </Container>
    </section>

    <!-- Projects Grid -->
    <section class="section-padding">
      <Container>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <ProjectCard
            v-for="project in projects"
            :key="project.title"
            :title="project.title"
            :description="project.description"
            :image="project.image"
            :tags="project.tags"
            :links="project.links"
          />
        </div>
      </Container>
    </section>

    <!-- Project Categories -->
    <section class="section-padding bg-gray-50">
      <Container>
        <div class="text-center mb-12">
          <Heading :size="'2xl'" :weight="'semibold'" class="mb-4">
            Project Categories
          </Heading>
          <p class="text-gray-600">
            Explore projects by technology stack and industry focus.
          </p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
          <Card variant="elevated" class="p-6 text-center hover:shadow-lg transition-shadow">
            <div class="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg class="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"></path>
              </svg>
            </div>
            <Heading :size="'lg'" :weight="'semibold'" class="mb-2">
              Web Applications
            </Heading>
            <p class="text-gray-600 text-sm">
              Full-stack web applications built with modern frameworks and scalable architecture.
            </p>
          </Card>

          <Card variant="elevated" class="p-6 text-center hover:shadow-lg transition-shadow">
            <div class="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg class="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"></path>
              </svg>
            </div>
            <Heading :size="'lg'" :weight="'semibold'" class="mb-2">
              Mobile Apps
            </Heading>
            <p class="text-gray-600 text-sm">
              Cross-platform mobile applications with native-like performance and user experience.
            </p>
          </Card>

          <Card variant="elevated" class="p-6 text-center hover:shadow-lg transition-shadow">
            <div class="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg class="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM21 5a2 2 0 00-2-2h-4a2 2 0 00-2 2v6a2 2 0 002 2h4a2 2 0 002-2V5z"></path>
              </svg>
            </div>
            <Heading :size="'lg'" :weight="'semibold'" class="mb-2">
              Design Systems
            </Heading>
            <p class="text-gray-600 text-sm">
              Comprehensive design systems and component libraries for consistent user experiences.
            </p>
          </Card>
        </div>
      </Container>
    </section>
  </div>
</template>

<script setup lang="ts">




const breadcrumbItems = [
  { label: 'Home', path: '/' },
  { label: 'Projects', path: '/projects' }
]

const projects = [
  {
    title: 'E-Commerce Platform',
    description: 'A modern e-commerce solution with real-time inventory management and seamless checkout experience.',
    image: 'https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=400&h=300&fit=crop',
    tags: ['React', 'Node.js', 'MongoDB'],
    links: [
      { label: 'View Live', url: '#', external: true },
      { label: 'View Code', url: '#', external: true }
    ]
  },
  {
    title: 'Task Management App',
    description: 'Collaborative project management tool with real-time updates and team productivity features.',
    image: 'https://images.unsplash.com/photo-1611224923853-80b023f02d71?w=400&h=300&fit=crop',
    tags: ['Vue.js', 'Firebase', 'Tailwind'],
    links: [
      { label: 'View Live', url: '#', external: true },
      { label: 'View Code', url: '#', external: true }
    ]
  },
  {
    title: 'Portfolio Website',
    description: 'Minimalist portfolio design with smooth animations and responsive layout.',
    image: 'https://images.unsplash.com/photo-1467232004584-a241de8bcf5d?w=400&h=300&fit=crop',
    tags: ['Nuxt.js', 'CSS', 'GSAP'],
    links: [
      { label: 'View Live', url: '#', external: true },
      { label: 'View Code', url: '#', external: true }
    ]
  },
  {
    title: 'Weather Dashboard',
    description: 'Real-time weather application with location-based forecasts and interactive maps.',
    image: 'https://images.unsplash.com/photo-1504608524841-42fe6f032b4b?w=400&h=300&fit=crop',
    tags: ['JavaScript', 'OpenWeather API', 'Chart.js'],
    links: [
      { label: 'View Live', url: '#', external: true },
      { label: 'View Code', url: '#', external: true }
    ]
  },
  {
    title: 'Social Media Analytics',
    description: 'Comprehensive analytics dashboard for social media performance tracking and insights.',
    image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&h=300&fit=crop',
    tags: ['React', 'D3.js', 'Express'],
    links: [
      { label: 'View Live', url: '#', external: true },
      { label: 'View Code', url: '#', external: true }
    ]
  },
  {
    title: 'Learning Management System',
    description: 'Online education platform with course management, progress tracking, and interactive content.',
    image: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=400&h=300&fit=crop',
    tags: ['Vue.js', 'Laravel', 'MySQL'],
    links: [
      { label: 'View Live', url: '#', external: true },
      { label: 'View Code', url: '#', external: true }
    ]
  }
]

definePageMeta({
  layout: 'default'
})
</script>