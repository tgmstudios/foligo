<template>
  <div class="p-6 max-w-7xl mx-auto">
    <div class="flex flex-wrap gap-4 items-center justify-between mb-8">
      <div>
        <p class="text-primary-400 text-xs tracking-widest uppercase mb-2">
          Your workspace
        </p>
        <h1 class="text-3xl font-semibold text-white">Sites</h1>
        <p class="text-gray-400 mt-2">
          Build your next idea. Bring your team along.
        </p>
      </div>
      <button class="btn btn-primary" @click="creating = !creating">
        + Create a site
      </button>
    </div>
    <p v-if="error" role="alert" class="text-red-400 mb-4">{{ error }}</p>
    <form
      v-if="creating"
      class="card p-6 mb-8 grid gap-4 max-w-xl"
      @submit.prevent="create"
    >
      <h2 class="text-white text-lg">Start with a name.</h2>
      <label class="text-sm text-gray-300"
        >Site name<input
          v-model="name"
          required
          maxlength="200"
          class="input mt-2 w-full"
          placeholder="My next big idea" /></label
      ><label class="text-sm text-gray-300"
        >Subdomain<input
          v-model="subdomain"
          required
          minlength="3"
          maxlength="50"
          pattern="[a-z0-9-]+"
          class="input mt-2 w-full"
          placeholder="my-next-idea"
        /><span class="block mt-1 text-gray-500"
          >{{ subdomain || "your-name" }}.foligo.org</span
        ></label
      >
      <div class="flex gap-3">
        <button class="btn btn-primary" :disabled="busy">
          {{ busy ? "Creating…" : "Create & open builder" }}</button
        ><button
          type="button"
          class="btn btn-outline"
          @click="creating = false"
        >
          Cancel
        </button>
      </div>
    </form>
    <label class="block mb-6 text-gray-400 text-sm"
      >Find a site<input
        v-model="search"
        class="input mt-2 max-w-md w-full block"
        placeholder="Search by name or subdomain"
        type="search"
    /></label>
    <p v-if="loading" class="text-gray-400">Loading your sites…</p>
    <div
      v-else-if="filtered.length"
      class="grid md:grid-cols-2 xl:grid-cols-3 gap-6"
    >
      <article
        v-for="site in filtered"
        :key="site.id"
        class="card overflow-hidden"
      >
        <div
          class="h-40 bg-gradient-to-br from-primary-900/60 to-gray-800 flex items-center justify-center border-b border-gray-700"
        >
          <div
            class="w-3/4 h-28 border border-gray-600 rounded-lg p-4 bg-gray-900/50"
          >
            <div class="flex gap-1 mb-4">
              <span
                v-for="i in 3"
                :key="i"
                class="w-1 h-1 rounded-full bg-gray-500"
              ></span>
            </div>
            <div class="h-2 w-2/3 bg-primary-400/70 rounded mb-2"></div>
            <div class="h-1 w-1/2 bg-gray-600 rounded mb-4"></div>
            <div class="h-4 w-12 bg-primary-500 rounded"></div>
          </div>
        </div>
        <div class="p-5">
          <div class="flex justify-between gap-3">
            <h2 class="font-semibold text-white">{{ site.name }}</h2>
            <span
              :class="site.isPublished ? 'text-green-400' : 'text-gray-500'"
              class="text-xs"
              >{{ site.isPublished ? "Published" : "Unpublished" }}</span
            >
          </div>
          <p class="text-gray-500 text-sm mt-1">
            {{
              site.subdomain
                ? `${site.subdomain}.foligo.org`
                : "No subdomain configured"
            }}
          </p>
          <div class="flex gap-3 mt-6">
            <router-link
              :to="`/site-builder/${site.id}`"
              class="btn btn-primary text-sm"
              >Open builder ↗</router-link
            ><router-link
              :to="`/portfolios/${site.id}`"
              class="btn btn-outline text-sm"
              >Settings & team</router-link
            >
          </div>
        </div>
      </article>
    </div>
    <div v-else class="card p-12 text-center text-gray-400">
      <h2 class="text-xl text-white mb-2">Your next chapter starts here.</h2>
      <p>
        {{
          search
            ? "No sites match your search."
            : "Create a site to start building. Sites shared with you appear here too."
        }}
      </p>
    </div>
  </div>
</template>
<script setup>
import { ref, computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import api from "@/services/api";
const router = useRouter(),
  sites = ref([]),
  loading = ref(true),
  error = ref(""),
  creating = ref(false),
  busy = ref(false),
  name = ref(""),
  subdomain = ref(""),
  search = ref("");
const filtered = computed(() =>
  sites.value.filter((s) =>
    `${s.name} ${s.subdomain}`
      .toLowerCase()
      .includes(search.value.toLowerCase()),
  ),
);
onMounted(async () => {
  try {
    const { data } = await api.get("/projects");
    sites.value = [...data.ownedProjects, ...data.memberProjects];
  } catch (e) {
    error.value = e.response?.data?.error || "Unable to load sites";
  } finally {
    loading.value = false;
  }
});
async function create() {
  busy.value = true;
  error.value = "";
  try {
    const { data } = await api.post("/projects", {
      name: name.value,
      subdomain: subdomain.value,
    });
    await router.push(`/site-builder/${data.id}`);
  } catch (e) {
    error.value =
      e.response?.data?.message ||
      e.response?.data?.error ||
      "Could not create site";
  } finally {
    busy.value = false;
  }
}
</script>
