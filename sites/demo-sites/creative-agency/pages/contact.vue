<template>
  <div>
    <!-- Page Header -->
    <section class="section-padding bg-gray-50">
      <Container>
        <Breadcrumb :items="breadcrumbItems" class="mb-8" />
        <div class="text-center">
          <Heading :size="'3xl'" :weight="'bold'" class="mb-4">
            Get In Touch
          </Heading>
          <p class="text-gray-600 max-w-2xl mx-auto text-lg">
            Ready to start your next project? I'd love to hear from you.
            Let's discuss how we can bring your ideas to life.
          </p>
        </div>
      </Container>
    </section>

    <!-- Contact Section -->
    <section class="section-padding">
      <Container>
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <!-- Contact Info -->
          <div>
            <Heading :size="'2xl'" :weight="'semibold'" class="mb-8">
              Let's Connect
            </Heading>

            <div class="space-y-6">
              <div class="flex items-start space-x-4">
                <div class="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
                  </svg>
                </div>
                <div>
                  <h3 class="font-semibold">Email</h3>
                  <p class="text-gray-600">alex.chen@example.com</p>
                </div>
              </div>

              <div class="flex items-start space-x-4">
                <div class="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg class="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path>
                  </svg>
                </div>
                <div>
                  <h3 class="font-semibold">Phone</h3>
                  <p class="text-gray-600">+1 (555) 123-4567</p>
                </div>
              </div>

              <div class="flex items-start space-x-4">
                <div class="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg class="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
                  </svg>
                </div>
                <div>
                  <h3 class="font-semibold">Location</h3>
                  <p class="text-gray-600">San Francisco, CA</p>
                </div>
              </div>
            </div>

            <div class="mt-8">
              <Heading :size="'lg'" :weight="'semibold'" class="mb-4">
                Follow Me
              </Heading>
              <div class="flex space-x-4">
                <a href="#" class="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors">
                  <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/>
                  </svg>
                </a>
                <a href="#" class="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors">
                  <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 6.627 5.374 12 12 12s12-5.373 12-12c0-6.627-5.374-12-12-12zm-2 16h-2v-6h2v6zm-1-6.891c-.607 0-1.1-.496-1.1-1.109 0-.612.492-1.109 1.1-1.109s1.1.497 1.1 1.109c0 .613-.493 1.109-1.1 1.109zm8 6.891h-1.998v-2.861c0-1.881-2.002-1.722-2.002 0v2.861h-2v-6h2v1.093c.872-1.616 4-1.736 4 1.548v3.359z"/>
                  </svg>
                </a>
                <a href="#" class="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors">
                  <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 6.627 5.374 12 12 12s12-5.373 12-12c0-6.627-5.374-12-12-12zm4.11 7.613c-1.015-.042-1.747-.298-1.968-.423-.224-.129-.423-.595-.2-1.917.181-.974.56-2.652.518-3.855-.008-.226-.076-.472-.268-.688-.188-.209-.518-.553-.917-.438-.396.113-.683.566-.517.879.163.311.652.516.883.516.332 0 .535-.208.535-.208s-.218.509-.218 1.424c0 .718.164 1.565.164 1.565s-.218 1.032-.71 1.774c-.493.742-1.03 1.39-1.03 1.39s-.287.226-.462.338c-.174.112-.404.226-.606.226-.202 0-.43-.114-.606-.226-.175-.112-.462-.338-.462-.338s-.536-.648-1.03-1.39c-.492-.742-.71-1.774-.71-1.774s.164-.847.164-1.565c0-.915-.218-1.424-.218-1.424s.203.308.535.516c.165.098.331.226.331.226.224.129.404.595.2 1.917-.056 1.203-.434 2.881-.616 3.855-.228 1.322-.029 1.788.195 1.917.227.129.959.385 1.974.423.993.038 1.947.042 2.906 0 1.015-.042 1.747-.298 1.968-.423.224-.129.423-.595.2-1.917-.181-.974-.56-2.652-.518-3.855.008-.226.076-.472.268-.688.188-.209.518-.553.917-.438.396.113.683.566.517.879-.163.311-.652.516-.883.516-.332 0-.535-.208-.535-.208s.218.509.218 1.424c0 .718-.164 1.565-.164 1.565s.218 1.032.71 1.774c.493.742 1.03 1.39 1.03 1.39s.287.226.462.338c.174.112.404.226.606.226.202 0 .43-.114.606-.226.175-.112.462-.338.462-.338s.536-.648 1.03-1.39c.492-.742.71-1.774.71-1.774s-.164-.847-.164-1.565c0-.915.218-1.424.218-1.424s-.203.308-.535.516c-.165.098-.331.226-.331.226-.224.129-.404.595-.2 1.917.056 1.203.434 2.881.616 3.855.228 1.322.029 1.788-.195 1.917-.227.129-.959.385-1.974.423-.96.042-1.914.038-2.906 0z"/>
                  </svg>
                </a>
              </div>
            </div>
          </div>

          <!-- Contact Form -->
          <div>
            <ContactForm
              title="Send a Message"
              :show-subject="false"
              @submit="handleFormSubmit"
            />
          </div>
        </div>
      </Container>
    </section>
  </div>
</template>

<script setup lang="ts">



const breadcrumbItems = [
  { label: 'Home', path: '/' },
  { label: 'Contact', path: '/contact' }
]

const handleFormSubmit = (data: any) => {
  console.log('Form submitted:', data)
  // Handle form submission here
}

definePageMeta({
  layout: 'default'
})
</script>