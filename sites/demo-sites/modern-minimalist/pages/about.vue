<template>
  <div>
    <!-- Page Header -->
    <section class="section-padding bg-gray-50">
      <Container>
        <Breadcrumb :items="breadcrumbItems" class="mb-8" />
        <div class="text-center">
          <Heading :size="'3xl'" :weight="'bold'" class="mb-4">
            About Me
          </Heading>
          <p class="text-gray-600 max-w-2xl mx-auto text-lg">
            Get to know the person behind the code and the passion that drives my work.
          </p>
        </div>
      </Container>
    </section>

    <!-- About Content -->
    <section class="section-padding">
      <Container>
        <AboutSection
          title="My Journey"
          :paragraphs="[
            'My journey into web development began 5 years ago when I discovered the transformative power of technology to solve real-world problems. What started as curiosity quickly became a passion for creating digital experiences that matter.',
            'I believe great software is built at the intersection of technical excellence, user-centered design, and business value. My approach combines clean, maintainable code with intuitive user interfaces that delight users.',
            'When I\'m not coding, you\'ll find me exploring new technologies, contributing to open source projects, or sharing knowledge with the developer community through blog posts and mentoring.'
          ]"
          layout="left"
          container-size="lg"
          :stats="[
            { number: '5+', label: 'Years of Experience' },
            { number: '50+', label: 'Projects Delivered' },
            { number: '10+', label: 'Happy Clients' },
            { number: '100%', label: 'Commitment' }
          ]"
        >
          <template #image>
            <img
              src="https://images.unsplash.com/photo-1555949963-aa79dcee981c?w=600&h=800&fit=crop"
              alt="Alex Chen working"
              class="w-full h-96 object-cover rounded-lg shadow-lg"
            />
          </template>
        </AboutSection>
      </Container>
    </section>

    <!-- Skills Section -->
    <section class="section-padding bg-gray-50">
      <Container>
        <div class="mb-16">
          <Heading :size="'2xl'" :weight="'semibold'" class="text-center mb-4">
            Skills & Expertise
          </Heading>
          <p class="text-gray-600 text-center max-w-2xl mx-auto">
            A comprehensive toolkit built through years of hands-on experience and continuous learning.
          </p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <Card variant="elevated" class="p-6">
            <Heading :size="'lg'" :weight="'semibold'" class="mb-4">
              Frontend Development
            </Heading>
            <ul class="space-y-2 text-sm text-gray-600">
              <li>• React & Vue.js</li>
              <li>• TypeScript & JavaScript</li>
              <li>• HTML5 & CSS3</li>
              <li>• Tailwind CSS & Sass</li>
            </ul>
          </Card>

          <Card variant="elevated" class="p-6">
            <Heading :size="'lg'" :weight="'semibold'" class="mb-4">
              Backend Development
            </Heading>
            <ul class="space-y-2 text-sm text-gray-600">
              <li>• Node.js & Express</li>
              <li>• Python & Django</li>
              <li>• RESTful APIs</li>
              <li>• Database Design</li>
            </ul>
          </Card>

          <Card variant="elevated" class="p-6">
            <Heading :size="'lg'" :weight="'semibold'" class="mb-4">
              Tools & Technologies
            </Heading>
            <ul class="space-y-2 text-sm text-gray-600">
              <li>• Git & Version Control</li>
              <li>• Docker & Deployment</li>
              <li>• AWS & Cloud Services</li>
              <li>• CI/CD Pipelines</li>
            </ul>
          </Card>
        </div>
      </Container>
    </section>

    <!-- Call to Action -->
    <section class="section-padding">
      <Container>
        <Card variant="filled" class="p-12 text-center bg-gray-900 text-white">
          <Heading :size="'2xl'" :weight="'bold'" class="mb-4">
            Ready to Collaborate?
          </Heading>
          <p class="text-gray-300 mb-8 max-w-2xl mx-auto">
            I'm always excited to work on interesting projects and connect with like-minded people.
            Let's discuss how we can bring your ideas to life.
          </p>
          <Button variant="primary" size="lg" to="/contact" class="bg-white text-gray-900 hover:bg-gray-100">
            Start a Conversation
          </Button>
        </Card>
      </Container>
    </section>
  </div>
</template>

<script setup lang="ts">




const breadcrumbItems = [
  { label: 'Home', path: '/' },
  { label: 'About', path: '/about' }
]

definePageMeta({
  layout: 'default'
})
</script>