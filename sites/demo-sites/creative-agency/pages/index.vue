<template>
  <div>
    <!-- Hero Section -->
    <section class="section-padding">
      <Container>
        <Hero
          title="Welcome to Studio Creative"
          subtitle="Where Ideas Become Reality"
          description="We craft extraordinary digital experiences that captivate audiences and drive results. From innovative web applications to stunning brand identities, we bring your vision to life."
          :actions="heroActions"
          layout="left"
          height="lg"
          title-size="4xl"
          variant="gradient"
        >
          <template #media>
            <div class="relative">
              <img
                src="https://images.unsplash.com/photo-1558655146-9f40138edfeb?w=600&h=600&fit=crop"
                alt="Creative studio workspace"
                class="w-80 h-80 rounded-2xl object-cover shadow-2xl transform rotate-3 hover:rotate-0 transition-transform duration-500"
              />
              <div class="absolute -bottom-4 -right-4 w-24 h-24 bg-gradient-to-br from-pink-400 to-purple-600 rounded-full opacity-80 animate-pulse"></div>
            </div>
          </template>
        </Hero>
      </Container>
    </section>

    <!-- About Preview -->
    <section class="section-padding bg-gray-50">
      <Container>
        <AboutSection
          title="Our Creative Process"
          :paragraphs="[
            'At Studio Creative, we believe in the power of collaboration and innovation. Our team of designers, developers, and strategists work together to create digital experiences that not only meet your goals but exceed your expectations.',
            'We combine cutting-edge technology with artistic vision to deliver solutions that are as beautiful as they are functional. Every project is approached with creativity, attention to detail, and a commitment to excellence.'
          ]"
          layout="right"
          container-size="lg"
          variant="alternate"
          :actions="aboutActions"
          :stats="[
            { number: '200+', label: 'Projects Delivered' },
            { number: '50+', label: 'Happy Clients' },
            { number: '24/7', label: 'Support Available' },
            { number: '98%', label: 'Success Rate' }
          ]"
        >
          <template #image>
            <div class="relative">
              <img
                src="https://images.unsplash.com/photo-1552664730-d307ca884978?w=600&h=400&fit=crop"
                alt="Creative team collaboration"
                class="w-full h-64 object-cover rounded-lg shadow-lg"
              />
              <div class="absolute inset-0 bg-gradient-to-r from-purple-600/20 to-pink-600/20 rounded-lg"></div>
            </div>
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