<template>
  <div>
    <!-- Hero Section -->
    <section class="section-padding">
      <Container>
        <Hero
          title="Hello, I'm Alex Chen"
          subtitle="Full Stack Developer"
          description="I create beautiful, functional web experiences that solve real problems. Currently building the next generation of digital products."
          :actions="heroActions"
          layout="left"
          height="lg"
          title-size="4xl"
        >
          <template #media>
            <img
              src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face"
              alt="Alex Chen - Full Stack Developer"
              class="w-64 h-64 rounded-full object-cover shadow-lg"
            />
          </template>
        </Hero>
      </Container>
    </section>

    <!-- About Preview -->
    <section class="section-padding bg-gray-50">
      <Container>
        <AboutSection
          title="About Me"
          :paragraphs="[
            'With over 5 years of experience in web development, I specialize in creating modern, scalable applications using cutting-edge technologies.',
            'My approach combines technical expertise with user-centered design to deliver solutions that not only look great but also perform exceptionally.'
          ]"
          layout="right"
          container-size="lg"
          :actions="aboutActions"
          :stats="[
            { number: '50+', label: 'Projects Completed' },
            { number: '5+', label: 'Years Experience' },
            { number: '100%', label: 'Client Satisfaction' }
          ]"
        >
          <template #image>
            <img
              src="https://images.unsplash.com/photo-1555949963-aa79dcee981c?w=600&h=400&fit=crop"
              alt="Modern workspace"
              class="w-full h-64 object-cover rounded-lg"
            />
          </template>
        </AboutSection>
      </Container>
    </section>

    <!-- Projects Preview -->
    <section class="section-padding">
      <Container>
        <div class="text-center mb-16">
          <Heading :size="'2xl'" :weight="'semibold'" class="mb-4">
            Featured Projects
          </Heading>
          <p class="text-gray-600 max-w-2xl mx-auto">
            A selection of recent work spanning web applications, mobile apps, and design systems.
          </p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          <ProjectCard
            v-for="project in featuredProjects"
            :key="project.title"
            :title="project.title"
            :description="project.description"
            :image="project.image"
            :tags="project.tags"
            :links="project.links"
          />
        </div>

        <div class="text-center">
          <Button variant="secondary" size="lg" to="/projects">
            View All Projects
          </Button>
        </div>
      </Container>
    </section>

    <!-- Contact CTA -->
    <section class="section-padding bg-gray-900 text-white">
      <Container>
        <div class="text-center max-w-2xl mx-auto">
          <Heading :size="'3xl'" :weight="'bold'" class="mb-6">
            Let's Work Together
          </Heading>
          <p class="text-gray-300 mb-8 text-lg">
            Ready to bring your ideas to life? I'm always open to discussing new opportunities and interesting projects.
          </p>
          <Button variant="primary" size="lg" to="/contact" class="bg-white text-gray-900 hover:bg-gray-100">
            Get In Touch
          </Button>
        </div>
      </Container>
    </section>
  </div>
</template>

<script setup lang="ts">
import { navigateTo } from 'nuxt/app'




const heroActions = [
  { label: 'View My Work', onClick: () => navigateTo('/projects') },
  { label: 'Get In Touch', onClick: () => navigateTo('/contact'), variant: 'outline' as const }
]

const aboutActions = [
  { label: 'Learn More', onClick: () => navigateTo('/about') }
]

const featuredProjects = [
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
  }
]

definePageMeta({
  layout: 'default'
})
</script>