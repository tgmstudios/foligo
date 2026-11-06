<template>
  <div class="lp" :class="{ 'motion-ready': motionReady }" id="top">
    <a class="skip-link" href="#main">Skip to content</a>

    <!-- Header -->
    <header class="site-header" :class="{ 'is-scrolled': scrolled || menuOpen }">
      <div class="nav-inner">
        <a class="wordmark" href="#top" aria-label="Foligo home">
          <img :src="logo" alt="" width="30" height="30" />
          <span>Foligo</span>
        </a>
        <nav class="desktop-nav" aria-label="Main navigation">
          <a v-for="n in navigation" :key="n[1]" :href="`#${n[1]}`">{{ n[0] }}</a>
        </nav>
        <div class="nav-actions">
          <NuxtLink class="sign-in" to="/login">Sign in</NuxtLink>
          <NuxtLink class="button button-primary button-small" to="/signup">
            Open Foligo <ArrowUpRightIcon class="ico-sm" aria-hidden="true" />
          </NuxtLink>
        </div>
        <button
          class="menu-toggle"
          type="button"
          :aria-label="menuOpen ? 'Close navigation' : 'Open navigation'"
          :aria-expanded="menuOpen"
          aria-controls="mobile-navigation"
          @click="menuOpen = !menuOpen"
        >
          <XMarkIcon v-if="menuOpen" class="ico-md" />
          <Bars3Icon v-else class="ico-md" />
        </button>
      </div>
      <nav v-if="menuOpen" id="mobile-navigation" class="mobile-nav" aria-label="Mobile navigation">
        <a v-for="n in navigation" :key="n[1]" :href="`#${n[1]}`" @click="menuOpen = false">{{ n[0] }}</a>
        <NuxtLink to="/login">Sign in</NuxtLink>
        <NuxtLink class="button button-primary" to="/signup">
          Open Foligo <ArrowUpRightIcon class="ico-sm" aria-hidden="true" />
        </NuxtLink>
      </nav>
    </header>

    <main id="main">
      <!-- Hero: homepage -->
      <section class="hero" aria-labelledby="hero-title">
        <div class="hero-glow" aria-hidden="true"><span></span><span></span><span></span></div>
        <div class="container hero-copy">
          <p class="eyebrow hero-in" style="--d: 0">Your conversational portfolio assistant</p>
          <h1 id="hero-title" class="hero-in" style="--d: 1">
            Talk about your work,<br />
            <em>get the portfolio.</em>
          </h1>
          <p class="hero-lede hero-in" style="--d: 2">
            Foligo listens while you describe a project, asks the questions a good editor would,
            then drafts the case study, the resume and the live site. Built for anyone whose best
            work never made it onto the page.
          </p>
          <div class="hero-actions hero-in" style="--d: 3">
            <NuxtLink class="button button-primary" to="/signup">
              Start your portfolio <ArrowUpRightIcon class="ico-sm" aria-hidden="true" />
            </NuxtLink>
            <a class="button button-ghost" href="#service">
              See how it works <ArrowDownIcon class="ico-sm" aria-hidden="true" />
            </a>
          </div>
          <ul class="serves hero-in" style="--d: 4" aria-label="Who Foligo is for">
            <li>Designers &amp; developers</li>
            <li>Freelancers &amp; consultants</li>
            <li>Students &amp; career changers</li>
            <li>Anyone job hunting</li>
          </ul>
        </div>

        <div ref="screensEl" class="screens">
          <figure class="station station-home" style="--s: 0">
            <div class="station-float">
              <div class="phone">
                <img
                  class="phone-demo-image"
                  :src="phoneHome"
                  alt="Illustrative Foligo dashboard with recent projects and a Start talking action"
                  width="660"
                  height="1434"
                  decoding="async"
                />
              </div>
            </div>
            <figcaption>
              <strong>Start with what you remember</strong>
              <span>Type it or just start talking.</span>
            </figcaption>
          </figure>

          <figure class="station station-voice" style="--s: 1">
            <div class="station-float">
              <div class="phone">
                <img
                  class="phone-demo-image"
                  :src="phoneVoice"
                  alt="Illustrative Foligo voice interview with a live waveform and a follow-up question"
                  width="660"
                  height="1434"
                  decoding="async"
                />
              </div>
            </div>
            <figcaption>
              <strong>Talk it through</strong>
              <span>A live voice conversation.</span>
            </figcaption>
          </figure>

          <figure class="station station-draft" style="--s: 2">
            <div class="station-float">
              <div class="phone">
                <img
                  class="phone-demo-image"
                  :src="phoneDraft"
                  alt="Illustrative Foligo content studio with a checkout case study and publishing action"
                  width="660"
                  height="1434"
                  decoding="async"
                />
              </div>
            </div>
            <figcaption>
              <strong>Your first draft, ready</strong>
              <span>Edit it, then publish.</span>
            </figcaption>
          </figure>
        </div>
      </section>

      <!-- The problem -->
      <section class="statement" aria-label="The problem">
        <div ref="statementEl" class="container statement-inner" :style="{ '--count': words.length }">
          <p class="eyebrow">The problem</p>
          <p class="statement-text">
            <span
              v-for="(w, i) in words"
              :key="i"
              :class="{ 'statement-em': emphasis.has(w) }"
              :style="{ '--w': i }"
            >{{ w + ' ' }}</span>
          </p>
          <p class="statement-follow">
            Jordan has shipped twelve projects. His portfolio shows three. He can explain every one
            in five minutes over coffee. Foligo turns that conversation into the page.
          </p>
          <p class="statement-note">Jordan is a fictional example.</p>
        </div>
      </section>

      <!-- Service: pinned walkthrough -->
      <section id="service" class="story" aria-labelledby="story-title">
        <div class="container story-head reveal">
          <p class="eyebrow">Our service</p>
          <h2 id="story-title">From a conversation<br />to <em>a live portfolio.</em></h2>
          <p class="story-sub">
            Foligo is a writing service for your work. You bring the stories. We handle the
            interview, the drafting, the layout and the publishing.
          </p>
        </div>

        <div ref="gridEl" class="container story-grid">
          <div class="story-stage-wrap">
            <div ref="stageEl" class="story-stage" :data-step="active">
              <div class="stage-bar">
                <span class="stage-dots" aria-hidden="true"><i></i><i></i><i></i></span>
                <span class="stage-tabs" role="tablist" aria-label="Service steps">
                  <button
                    v-for="(s, i) in steps"
                    :key="s.key"
                    type="button"
                    role="tab"
                    :aria-selected="i === active"
                    :class="{ 'is-active': i === active }"
                    @click="goStep(i)"
                  >{{ s.name }}</button>
                </span>
              </div>

              <div class="stage-body" aria-hidden="true">
                <!-- Talk -->
                <div :key="`talk-${runs[0]}`" class="scene" :class="{ 'is-active': active === 0 }">
                  <div class="scene-capture">
                    <div class="capture-orb">
                      <span class="orb-glow"></span>
                      <span class="orb-wave"><i v-for="n in 15" :key="n" :style="{ '--b': n }"></i></span>
                      <p>Interviewing Jordan Lee <small><span class="rec-dot"></span> 02:14</small></p>
                    </div>
                    <div class="capture-transcript">
                      <span class="gap-chip">Gap found · results</span>
                      <p class="line-ai">You described the redesign. What changed in the numbers afterwards?</p>
                      <p class="line-person">Drop-off fell by a third, and support tickets about payment halved.</p>
                      <div class="draft-card">
                        <span class="draft-badge">Draft · needs review</span>
                        <h5>Checkout redesign</h5>
                        <ol>
                          <li>Five screens collapsed into one</li>
                          <li>Six-week A/B test, drop-off down 33%</li>
                          <li>Payment support tickets cut in half</li>
                        </ol>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Shape -->
                <div class="scene" :class="{ 'is-active': active === 1 }">
                  <div class="scene-ask" :class="{ 'is-done': typedDone }">
                    <div class="ask-question">
                      <span class="avatar avatar-jordan">JL</span>
                      <p>Write up the checkout redesign.</p>
                    </div>
                    <div class="ask-answer">
                      <span class="ask-mark"><img :src="logo" alt="" width="22" height="22" /></span>
                      <p>
                        <template v-for="(seg, i) in typedSegments" :key="i">
                          <sup v-if="seg.cite" class="cite">{{ seg.cite }}</sup>
                          <template v-else>{{ seg.text }}</template>
                        </template>
                        <span v-if="!typedDone" class="caret"></span>
                      </p>
                    </div>
                    <div class="ask-sources">
                      <div class="ask-source">
                        <b>1</b>
                        <div>
                          <span><MicrophoneIcon class="ico-xs" /> Conversation · 02:14</span>
                          <q>We A/B tested a single-page flow for six weeks.</q>
                        </div>
                      </div>
                      <div class="ask-source">
                        <b>2</b>
                        <div>
                          <span><MicrophoneIcon class="ico-xs" /> Conversation · 03:40</span>
                          <q>Drop-off fell by a third.</q>
                        </div>
                      </div>
                      <p class="ask-verified">
                        <ShieldCheckIcon class="ico-xs" /> Every figure comes from what you said
                      </p>
                    </div>
                  </div>
                </div>

                <!-- Match -->
                <div :key="`match-${runs[2]}`" class="scene" :class="{ 'is-active': active === 2 }">
                  <div class="scene-connect">
                    <div class="scene-head">
                      <h4>Senior Product Designer</h4>
                      <div class="providers"><span><i class="live-dot"></i> Job posting</span></div>
                    </div>
                    <ul class="source-list">
                      <li v-for="(m, i) in matches" :key="m.title" :style="{ '--r': i }">
                        <span class="source-icon"><DocumentTextIcon class="ico-sm" /></span>
                        <span class="source-name">{{ m.title }}<small>{{ m.meta }}</small></span>
                        <span class="source-owner" title="Owner: Jordan Lee">JL</span>
                        <span class="source-status">
                          <i class="source-bar"><b></b></i>
                          <span class="source-done" :class="{ low: m.low }">{{ m.score }} match</span>
                        </span>
                      </li>
                    </ul>
                    <p class="scene-foot">Resume and cover letter drafted from your top 3 projects</p>
                  </div>
                </div>

                <!-- Publish -->
                <div class="scene" :class="{ 'is-active': active === 3 }">
                  <div class="scene-transfer">
                    <svg
                      :key="animateMap ? runs[3] : 'static'"
                      class="map-svg"
                      :class="{ 'is-running': animateMap, 'is-settled': settledMap }"
                      viewBox="0 0 560 360"
                      aria-hidden="true"
                    >
                      <path class="map-review" d="M 280 336 C 280 300 280 300 280 270" />
                      <g v-for="(item, i) in mapItems" :key="`e-${item}`" :style="{ '--m': i }">
                        <path
                          class="edge edge-from"
                          :d="`M ${LEFT.x + 30} ${LEFT.y} C ${LEFT.x + 70} ${LEFT.y}, ${FROM_X - 70} ${itemY(i)}, ${FROM_X - 56} ${itemY(i)}`"
                        />
                        <path
                          class="edge edge-to"
                          pathLength="1"
                          :d="`M ${TO_X + 56} ${itemY(i)} C ${TO_X + 70} ${itemY(i)}, ${RIGHT.x - 70} ${RIGHT.y}, ${RIGHT.x - 30} ${RIGHT.y}`"
                        />
                      </g>
                      <g class="node node-left">
                        <circle :cx="LEFT.x" :cy="LEFT.y" r="30" />
                        <text :x="LEFT.x" :y="LEFT.y + 5" class="node-initials">JL</text>
                        <text :x="LEFT.x" :y="LEFT.y + 52" class="node-name">Jordan Lee</text>
                        <text :x="LEFT.x" :y="LEFT.y + 68" class="node-meta">PRIVATE DRAFTS</text>
                      </g>
                      <g class="node node-right">
                        <circle :cx="RIGHT.x" :cy="RIGHT.y" r="30" />
                        <text :x="RIGHT.x" :y="RIGHT.y + 4" class="node-initials node-initials-mid">LIVE</text>
                        <text :x="RIGHT.x" :y="RIGHT.y + 52" class="node-name">Live site</text>
                        <text :x="RIGHT.x" :y="RIGHT.y + 68" class="node-meta">PUBLIC</text>
                      </g>
                      <g class="node node-review">
                        <circle cx="280" cy="336" r="14" />
                        <text x="280" y="340" class="node-initials node-initials-small">OK</text>
                        <text x="302" y="334" class="node-meta node-meta-left">YOU REVIEW</text>
                        <text x="302" y="348" class="node-meta node-meta-left">PUBLISH WHEN READY</text>
                      </g>
                      <g
                        v-for="(item, i) in mapItems"
                        :key="item"
                        class="map-item"
                        :transform="`translate(${settledMap ? TO_X : FROM_X} ${itemY(i)})`"
                        :style="{ '--m': i }"
                      >
                        <rect x="-56" y="-13" width="112" height="26" rx="13" />
                        <text y="4">{{ item }}</text>
                        <animateMotion
                          v-if="animateMap"
                          :begin="`${0.5 + i * 0.32}s`"
                          dur="1.1s"
                          fill="freeze"
                          calcMode="spline"
                          keyTimes="0;1"
                          keySplines="0.65 0 0.35 1"
                          :path="`M 0 0 C ${(TO_X - FROM_X) * 0.3} ${-(34 + (i % 2) * 18)}, ${(TO_X - FROM_X) * 0.7} ${-(34 + (i % 2) * 18)}, ${TO_X - FROM_X} 0`"
                        />
                      </g>
                    </svg>
                    <div class="transfer-bar">
                      <span><b>5 items</b> · published to jordan.foligo.org</span>
                      <span class="transfer-button"><CheckIcon class="ico-xs" /> Published</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="story-rail" aria-hidden="true"><span></span></div>

          <ol class="story-steps">
            <li
              v-for="(s, i) in steps"
              :key="s.key"
              :ref="(el) => (stepEls[i] = el as HTMLElement)"
              :class="{ 'is-active': i === active }"
            >
              <div class="step-inner">
                <span class="step-node"><component :is="s.icon" class="ico-md" aria-hidden="true" /></span>
                <p class="step-label">{{ String(i + 1).padStart(2, '0') }} · {{ s.name }}</p>
                <h3>{{ s.title }}</h3>
                <p class="step-text">{{ s.text }}</p>
                <p class="step-meta"><span v-for="t in s.meta" :key="t">{{ t }}</span></p>
              </div>
            </li>
          </ol>
        </div>
      </section>

      <!-- Product -->
      <section id="product" class="why" aria-labelledby="why-title">
        <div class="container">
          <div class="section-head reveal">
            <p class="eyebrow">The product</p>
            <h2 id="why-title">One workspace for your<br /><em>whole story.</em></h2>
          </div>
          <div ref="bentoEl" class="bento">
            <article class="card card-wide reveal">
              <div class="card-copy">
                <h3>AI drafts. You publish.</h3>
                <p>
                  Conversations become editable drafts. Nothing reaches your site until you review it
                  and press publish.
                </p>
              </div>
              <div class="flow-pills" aria-hidden="true">
                <span>Draft</span><i></i><span>In review</span><i></i><span>Published</span>
              </div>
            </article>

            <article class="card reveal" style="--d: 1">
              <div class="card-visual quote-visual" aria-hidden="true">
                <span class="quote-mark">&ldquo;</span>
                <p><mark>Cut checkout drop-off by 33%</mark> with a single-page flow.</p>
              </div>
              <h3>Your words, quoted.</h3>
              <p>
                Drafts keep the numbers, names and phrasing from your conversation, so they stay
                specific instead of generic.
              </p>
            </article>

            <article class="card reveal" style="--d: 2">
              <div class="card-visual review-visual" aria-hidden="true">
                <div><span>Portfolio site</span><i style="--w: 86%"></i></div>
                <div><span>Resume</span><i style="--w: 58%"></i></div>
                <div><span>Cover letter</span><i class="due" style="--w: 14%"></i></div>
              </div>
              <h3>One story, every format.</h3>
              <p>The same project notes feed your site, your resume and your cover letters. Write them once.</p>
            </article>

            <article class="card card-wide card-ink reveal">
              <div class="card-copy">
                <h3>Your content stays yours.</h3>
                <p>
                  Export or delete anything at any time. You choose what is public, and drafts stay
                  private until you say so.
                </p>
              </div>
              <div class="consent-visual" aria-hidden="true">
                <ShieldCheckIcon class="ico-md" />
                <div>
                  <span><CheckIcon class="ico-xs" /> Checkout redesign</span>
                  <span><CheckIcon class="ico-xs" /> About me</span>
                  <span class="off">Salary expectations (private)</span>
                </div>
              </div>
            </article>
          </div>

          <div class="also reveal">
            <div>
              <p class="mono-tag">Editor Studio</p>
              <p>A full-page editor for resumes and cover letters, with AI suggestions you accept or reject.</p>
            </div>
            <div>
              <p class="mono-tag">GoApply extension</p>
              <p>Tracks the jobs you apply to and fills application forms from your profile.</p>
            </div>
            <div>
              <p class="mono-tag">iOS app</p>
              <p>Capture a project by voice the moment you finish it, then polish it later.</p>
            </div>
          </div>
        </div>
      </section>

      <!-- Personal connection -->
      <section id="story" class="belief" aria-labelledby="belief-title">
        <div class="container belief-grid">
          <div class="reveal">
            <p class="eyebrow">Why I built this</p>
            <h2 id="belief-title">I kept forgetting<br />what I’d <em>built.</em></h2>
          </div>
          <div class="belief-copy reveal" style="--d: 1">
            <p>
              I made Foligo because I constantly forgot about the things I had built. The projects,
              the results, the small wins in between. Almost none of it made it onto a page.
            </p>
            <p>
              It started to hurt when I was applying to jobs. I would sit down to write a resume and
              come up empty on work I was proud of. I knew I had done more than I could remember.
            </p>
            <p>
              Foligo is the tool I wanted then. Talk about what you did while it is fresh, and let
              it keep the record for you.
            </p>
            <ul class="beliefs">
              <li><b>Capture it while it’s fresh.</b> Memory fades faster than you expect.</li>
              <li><b>Talking is easier than writing.</b> So that is where it starts.</li>
              <li><b>You decide what goes public.</b> The AI drafts. You publish.</li>
            </ul>
          </div>
        </div>
      </section>

      <!-- Contact -->
      <section id="contact" class="pricing" aria-labelledby="contact-title">
        <div class="container pricing-grid">
          <div class="pricing-intro reveal">
            <p class="eyebrow">Contact</p>
            <h2 id="contact-title">Say hello, or<br /><em>join early access.</em></h2>
            <p class="contact-line">
              Questions, feedback or interest? Write to
              <a :href="`mailto:${CONTACT_EMAIL}`">{{ CONTACT_EMAIL }}</a>
              or use the form.
            </p>
            <div class="faq">
              <details v-for="f in faqs" :key="f[0]" class="faq-item">
                <summary>{{ f[0] }} <PlusIcon class="ico-sm" aria-hidden="true" /></summary>
                <p>{{ f[1] }}</p>
              </details>
            </div>
          </div>

          <form class="price-card reveal" style="--d: 1" @submit.prevent="submitContact">
            <p class="price-label">Early access · free</p>
            <p class="form-title">Tell us what you are working on.</p>
            <div class="field">
              <label for="c-name">Name</label>
              <input id="c-name" v-model.trim="form.name" required autocomplete="name" />
            </div>
            <div class="field">
              <label for="c-email">Email</label>
              <input id="c-email" v-model.trim="form.email" type="email" required autocomplete="email" />
            </div>
            <div class="field">
              <label for="c-topic">I’m interested in</label>
              <select id="c-topic" v-model="form.topic">
                <option>Joining early access</option>
                <option>Asking a question</option>
                <option>Sharing feedback</option>
              </select>
            </div>
            <div class="field">
              <label for="c-msg">Message</label>
              <textarea id="c-msg" v-model.trim="form.message" rows="4"></textarea>
            </div>
            <button class="button button-primary button-block" type="submit">
              Send message <ArrowUpRightIcon class="ico-sm" aria-hidden="true" />
            </button>
            <p class="price-fine" role="status">
              {{ sent ? 'Your email app should open with the message ready to send.' : 'Sending opens your email app with this message addressed to ' + CONTACT_EMAIL + '.' }}
            </p>
          </form>
        </div>
      </section>

      <!-- Final CTA -->
      <section ref="finalEl" class="final reveal-draw" aria-labelledby="final-title">
        <svg class="final-threads" viewBox="0 0 1200 520" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
          <template v-for="(color, i) in finalThreads" :key="color">
            <path class="final-line" pathLength="1" :stroke="color" :style="{ '--i': i }" :d="threadPath(i)" />
            <path class="final-pulse" pathLength="1" :stroke="color" :style="{ '--i': i }" :d="threadPath(i)" />
          </template>
        </svg>
        <div class="container final-inner reveal">
          <span class="final-knot"><img :src="logo" alt="" width="64" height="64" /></span>
          <h2 id="final-title">Your best work deserves<br /><em>a place to live.</em></h2>
          <p>Start with one project and one conversation.</p>
          <NuxtLink class="button button-light" to="/signup">
            Open Foligo <ArrowUpRightIcon class="ico-sm" aria-hidden="true" />
          </NuxtLink>
        </div>
      </section>
    </main>

    <footer class="site-footer">
      <div class="container footer-inner">
        <a class="wordmark" href="#top" aria-label="Foligo home">
          <img :src="logo" alt="" width="30" height="30" />
          <span>Foligo</span>
        </a>
        <nav aria-label="Footer navigation">
          <a v-for="n in navigation" :key="n[1]" :href="`#${n[1]}`">{{ n[0] }}</a>
          <NuxtLink to="/login">Sign in <ArrowUpRightIcon class="ico-xs" aria-hidden="true" /></NuxtLink>
        </nav>
        <p>&copy; {{ year }} Foligo</p>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import {
  ArrowDownIcon,
  ArrowUpRightIcon,
  Bars3Icon,
  CheckIcon,
  DocumentTextIcon,
  GlobeAltIcon,
  MicrophoneIcon,
  PlusIcon,
  ShieldCheckIcon,
  SparklesIcon,
  XMarkIcon
} from '@heroicons/vue/24/outline'
const logo = '/squiggle.svg'
import phoneHome from '~/assets/landing/phone-home-v2.webp'
import phoneVoice from '~/assets/landing/phone-voice-v2.webp'
import phoneDraft from '~/assets/landing/phone-draft-v2.webp'

useHead({
  title: 'Foligo — Make the work do the talking',
  meta: [
    { name: 'description', content: 'Foligo helps you create a portfolio through conversation or voice, then carry your work into resumes, cover letters, and GoApply workflows.' },
    { property: 'og:title', content: 'Foligo — Make the work do the talking' },
    { property: 'og:description', content: 'Portfolio creation and job workflows, connected.' }
  ],
  link: [
    { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
    { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
    { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Geist:wght@300..700&family=Geist+Mono:wght@400;500&family=Newsreader:ital,opsz,wght@0,6..72,300..500;1,6..72,300..500&display=swap' }
  ]
})

const year = new Date().getFullYear()
const navigation = [
  ['Service', 'service'],
  ['Product', 'product'],
  ['Our story', 'story'],
  ['Contact', 'contact']
] as const

const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

// ---- Header ----
const scrolled = ref(false)
const menuOpen = ref(false)

// ---- Contact (no endpoint yet: hand off to the visitor's email client) ----
const CONTACT_EMAIL = 'hello@foligo.org'
const form = reactive({ name: '', email: '', topic: 'Joining early access', message: '' })
const sent = ref(false)

function submitContact() {
  const body = `${form.message}\n\n${form.name} <${form.email}>`
  window.location.href =
    `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(`Foligo: ${form.topic}`)}&body=${encodeURIComponent(body)}`
  sent.value = true
}

const faqs = [
  ['Can I try Foligo today?', 'Yes. Create an account and build your first project for free while we are in early access.'],
  ['Do I have to talk out loud?', 'No. You can type to the assistant instead, or mix voice and text.'],
  ['Does AI publish changes automatically?', 'No. Generated content starts as a private draft. You review it and publish it yourself, and later edits stay in draft until you publish again.'],
  ['Can I use my own domain?', 'Every site gets a foligo.org subdomain. Custom domains are planned.']
] as const

// ---- The problem: words light up with scroll progress ----
const statement =
  'Every portfolio is out of date. The project you shipped last spring is not on it. Neither is the result you were proud of. Then a recruiter asks Jordan for his link, and he says he will send it tomorrow.'
const words = statement.split(' ')
const emphasis = new Set(['Jordan'])

// ---- Service walkthrough ----
const steps = [
  {
    key: 'talk', name: 'Talk', icon: MicrophoneIcon,
    title: 'Describe it like you would to a friend.',
    text: 'Tell the assistant about a project by voice or text. It asks the follow-up questions a good editor would, and notices what is missing from your story.',
    meta: ['Voice', 'Chat', 'iOS app']
  },
  {
    key: 'shape', name: 'Shape', icon: DocumentTextIcon,
    title: 'Get a draft worth editing.',
    text: 'Foligo drafts case studies, posts and experience entries in your voice, and every figure points back to what you said. Refine them in a full-page studio.',
    meta: ['Case studies', 'Blog posts', 'Editor Studio']
  },
  {
    key: 'match', name: 'Match', icon: SparklesIcon,
    title: 'Aim it at the job you want.',
    text: 'Paste a posting and Foligo ranks your projects against it, then tailors a resume and cover letter. GoApply tracks each application and fills the forms.',
    meta: ['Resume', 'Cover letter', 'GoApply']
  },
  {
    key: 'publish', name: 'Publish', icon: GlobeAltIcon,
    title: 'Go live on your own subdomain.',
    text: 'Review your drafts, press publish, and your portfolio is at yourname.foligo.org. Add the next project later by talking to Foligo again.',
    meta: ['Subdomain', 'Always editable']
  }
] as const

const matches = [
  { title: 'Checkout redesign', meta: 'Case study · Growth', score: '94%', low: false },
  { title: 'Design system rollout', meta: 'Case study · Systems', score: '71%', low: false },
  { title: 'Onboarding survey', meta: 'Blog post · Research', score: '52%', low: true },
  { title: 'Icon set', meta: 'Project · Visual', score: '28%', low: true }
]

// Publish scene geometry
const LEFT = { x: 92, y: 178 }
const RIGHT = { x: 468, y: 178 }
const FROM_X = 196
const TO_X = 364
const itemY = (i: number) => 86 + i * 46
const mapItems = ['Checkout redesign', 'About me', 'Resume', 'Case study', 'Blog post']

const active = ref(0)
const runs = ref([0, 0, 0, 0])
const stepEls = ref<HTMLElement[]>([])
const gridEl = ref<HTMLElement | null>(null)
const stageEl = ref<HTMLElement | null>(null)
const statementEl = ref<HTMLElement | null>(null)
const screensEl = ref<HTMLElement | null>(null)
const bentoEl = ref<HTMLElement | null>(null)
const finalEl = ref<HTMLElement | null>(null)

const reduced = ref(false)
const settledMap = computed(() => active.value === 3 && reduced.value)
const animateMap = computed(() => active.value === 3 && !reduced.value)

function goStep(i: number) {
  stepEls.value[i]?.scrollIntoView({ block: 'center', behavior: prefersReducedMotion() ? 'auto' : 'smooth' })
}

watch(active, (a) => {
  runs.value = runs.value.map((v, i) => (i === a ? v + 1 : v))
})

// Shape scene: the answer types out with citations while that step is active
const answer: (string | number)[] = [
  'Checkout was losing one in three shoppers at the payment step. Jordan collapsed five screens into one and tested it for six weeks',
  1,
  ', cutting drop-off by 33%',
  2,
  '.'
]
const answerLength = answer.reduce<number>((t, p) => t + (typeof p === 'string' ? p.length : 1), 0)
const typed = ref(0)
let typeTimer = 0
watch(active, (a) => {
  window.clearInterval(typeTimer)
  if (a !== 1) {
    typed.value = 0
    return
  }
  if (prefersReducedMotion()) {
    typed.value = answerLength
    return
  }
  typed.value = 0
  typeTimer = window.setInterval(() => {
    typed.value = Math.min(answerLength, typed.value + 2)
    if (typed.value >= answerLength) window.clearInterval(typeTimer)
  }, 24)
})
const typedDone = computed(() => typed.value >= answerLength)
const typedSegments = computed(() => {
  let remaining = typed.value
  const out: { text?: string; cite?: number }[] = []
  for (const part of answer) {
    if (remaining <= 0) break
    if (typeof part === 'number') {
      remaining -= 1
      out.push({ cite: part })
    } else {
      out.push({ text: part.slice(0, remaining) })
      remaining -= part.length
    }
  }
  return out
})

// ---- Final CTA threads ----
const finalThreads = ['#5a52e0', '#a99ae6', '#e4defb', '#8fd7d1', '#f4b796']
function threadPath(i: number) {
  const o = (i - 2) * 46
  const a = 260 + o * 3.2
  const b = 260 + o * 0.35
  const c = 260 + o * 0.2
  const d = 260 - o * 3.2
  return `M -40 ${a} C 300 ${a}, 420 ${b}, 600 ${c} S 900 ${d}, 1240 ${d}`
}

// ---- Motion plumbing ----
const motionReady = ref(false)
const cleanups: (() => void)[] = []

/** Writes how far an element has travelled through the viewport into --progress (0 to 1). */
function trackProgress(el: HTMLElement | null, from = 0.85, to = 0.45) {
  if (!el) return
  if (prefersReducedMotion()) {
    el.style.setProperty('--progress', '1')
    return
  }
  let frame = 0
  let near = true
  const update = () => {
    frame = 0
    const r = el.getBoundingClientRect()
    const vh = window.innerHeight
    const dist = r.height + vh * (from - to)
    const v = Math.min(1, Math.max(0, (vh * from - r.top) / Math.max(1, dist)))
    el.style.setProperty('--progress', v.toFixed(4))
  }
  const schedule = () => {
    if (near && !frame) frame = requestAnimationFrame(update)
  }
  const io = new IntersectionObserver(([e]) => {
    near = !!e?.isIntersecting
    schedule()
  }, { rootMargin: '25% 0px' })
  io.observe(el)
  update()
  window.addEventListener('scroll', schedule, { passive: true })
  window.addEventListener('resize', schedule)
  cleanups.push(() => {
    io.disconnect()
    window.removeEventListener('scroll', schedule)
    window.removeEventListener('resize', schedule)
    if (frame) cancelAnimationFrame(frame)
  })
}

/** Pauses CSS and SMIL animation inside an element while it is off screen or the tab is hidden. */
function pauseOffscreen(el: HTMLElement | null) {
  if (!el) return
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)')
  let visible = true
  const apply = () => {
    const run = visible && !document.hidden && !reduce.matches
    el.classList.toggle('is-paused', !run)
    el.querySelectorAll('svg').forEach((svg) => (run ? svg.unpauseAnimations?.() : svg.pauseAnimations?.()))
  }
  const io = new IntersectionObserver(([e]) => {
    visible = !!e?.isIntersecting
    apply()
  }, { rootMargin: '10% 0px' })
  io.observe(el)
  document.addEventListener('visibilitychange', apply)
  apply()
  cleanups.push(() => {
    io.disconnect()
    document.removeEventListener('visibilitychange', apply)
  })
}

onMounted(() => {
  reduced.value = prefersReducedMotion()
  const root = document.documentElement
  const prev = { behavior: root.style.scrollBehavior, padding: root.style.scrollPaddingTop }
  root.style.scrollBehavior = 'smooth'
  root.style.scrollPaddingTop = '88px'
  cleanups.push(() => {
    root.style.scrollBehavior = prev.behavior
    root.style.scrollPaddingTop = prev.padding
  })

  // Header + pinned walkthrough
  let frame = 0
  const update = () => {
    frame = 0
    scrolled.value = window.scrollY > 8
    const line = window.innerHeight * 0.6
    let next = 0
    stepEls.value.forEach((item, i) => {
      if (item && item.getBoundingClientRect().top < line) next = i
    })
    if (next !== active.value) active.value = next
    const g = gridEl.value
    if (g) {
      const r = g.getBoundingClientRect()
      g.style.setProperty('--progress', Math.min(1, Math.max(0, (line - r.top) / Math.max(1, r.height))).toFixed(4))
    }
  }
  const schedule = () => {
    if (!frame) frame = requestAnimationFrame(update)
  }
  update()
  window.addEventListener('scroll', schedule, { passive: true })
  window.addEventListener('resize', schedule)
  const onKey = (e: KeyboardEvent) => {
    if (e.key === 'Escape') menuOpen.value = false
  }
  const onResize = () => {
    if (window.innerWidth > 900) menuOpen.value = false
  }
  window.addEventListener('keydown', onKey)
  window.addEventListener('resize', onResize)
  cleanups.push(() => {
    window.removeEventListener('scroll', schedule)
    window.removeEventListener('resize', schedule)
    window.removeEventListener('keydown', onKey)
    window.removeEventListener('resize', onResize)
    if (frame) cancelAnimationFrame(frame)
    window.clearInterval(typeTimer)
  })

  trackProgress(statementEl.value, 0.9, 0.55)
  pauseOffscreen(screensEl.value)
  pauseOffscreen(stageEl.value)
  pauseOffscreen(bentoEl.value)
  pauseOffscreen(finalEl.value)

  // Reveal on scroll
  if (!prefersReducedMotion() && 'IntersectionObserver' in window) {
    const io = new IntersectionObserver(
      (entries) =>
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible')
            io.unobserve(entry.target)
          }
        }),
      { threshold: 0.12, rootMargin: '0px 0px -6% 0px' }
    )
    motionReady.value = true
    document.querySelectorAll('.lp .reveal, .lp .reveal-draw').forEach((el) => io.observe(el))
    cleanups.push(() => io.disconnect())
  }
})

onBeforeUnmount(() => cleanups.splice(0).forEach((fn) => fn()))
</script>

<style scoped>
/* Foligo landing. Structure and motion follow the OrgFlow landing: dotted paper hero, serif
   headlines with a gradient italic, pinned walkthrough, bento grid, thread-drawn closing panel.
   Palette comes from the Foligo mark (indigo to violet) with teal and apricot support. Light only. */
.lp {
  --paper: #f8f7f4;
  --paper-2: #f1efea;
  --surface: #ffffff;
  --ink: #1c2234;
  --ink-2: #394258;
  --muted: #667085;
  --faint: #98a0ae;
  --line: #e4e2dc;
  --line-soft: #eeece7;
  --indigo: #5a52e0;
  --indigo-deep: #4338b8;
  --lavender: #a99ae6;
  --teal: #4faaa5;
  --teal-deep: #2b7672;
  --apricot: #f2aa88;
  --apricot-deep: #b8613a;
  --pale-indigo: #ecebfc;
  --pale-teal: #e3f3f1;
  --pale-apricot: #fdeee6;
  --thread: linear-gradient(90deg, #5a52e0, #a99ae6 55%, #f2aa88);
  --serif: 'Newsreader', 'Iowan Old Style', Georgia, serif;
  --sans: 'Geist', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  --mono: 'Geist Mono', ui-monospace, SFMono-Regular, Menlo, monospace;
  --ease-out: cubic-bezier(0.16, 1, 0.3, 1);
  --ease-spring: cubic-bezier(0.34, 1.45, 0.64, 1);
  --shadow-1: 0 1px 2px rgb(28 34 52 / 0.05), 0 0 0 1px rgb(28 34 52 / 0.05);
  --shadow-2: 0 1px 2px rgb(28 34 52 / 0.04), 0 8px 24px -8px rgb(28 34 52 / 0.14), 0 0 0 1px rgb(28 34 52 / 0.05);
  --shadow-3: 0 2px 4px rgb(28 34 52 / 0.04), 0 24px 60px -18px rgb(28 34 52 / 0.28), 0 0 0 1px rgb(28 34 52 / 0.06);

  color: var(--ink);
  background: var(--paper);
  font-family: var(--sans);
  font-size: 16px;
  font-synthesis: none;
  -webkit-font-smoothing: antialiased;
  min-width: 320px;
  min-height: 100vh;
  overflow-x: clip;
}
.lp *, .lp *::before, .lp *::after { box-sizing: border-box; }
.lp :where(h1, h2, h3, h4, h5, p, ul, ol, figure) { margin: 0; }
.lp :where(ul, ol) { padding: 0; list-style: none; }
.lp :where(a) { color: inherit; text-decoration: none; }
.lp :where(button) { font: inherit; color: inherit; cursor: pointer; }
.lp :focus-visible { outline: 2px solid var(--indigo); outline-offset: 4px; border-radius: 6px; }
.lp ::selection { color: #fff; background: var(--indigo); }
.lp :where(h1, h2) { font-family: var(--serif); font-weight: 400; letter-spacing: -0.025em; text-wrap: balance; }
.lp :where(h1, h2) em {
  font-style: italic;
  background: linear-gradient(100deg, var(--indigo) 10%, #8b6ff0 55%, #e0865f 100%);
  -webkit-background-clip: text; background-clip: text; color: transparent;
  /* italic glyphs overhang the text box; pad the painted area so the gradient does not clip them */
  padding: 0.04em 0.12em 0.16em; margin: -0.04em -0.12em -0.16em;
}
.lp h2 { font-size: clamp(38px, 4.6vw, 64px); line-height: 1.04; }
.lp h3 { font-size: 19px; font-weight: 600; letter-spacing: -0.015em; line-height: 1.3; }
.container { width: 100%; max-width: 1240px; margin-inline: auto; padding-inline: max(40px, env(safe-area-inset-left, 0px)); }
.eyebrow { display: inline-flex; align-items: center; gap: 10px; color: var(--indigo); font-family: var(--mono); font-size: 12px; font-weight: 500; letter-spacing: 0.16em; text-transform: uppercase; }
.eyebrow::before { content: ''; width: 26px; height: 2px; border-radius: 2px; background: var(--thread); }
.mono-tag { font-family: var(--mono); font-size: 11.5px; font-weight: 500; letter-spacing: 0.12em; text-transform: uppercase; color: var(--muted); }
.ico-xs { width: 13px; height: 13px; stroke-width: 2.2; flex: none; }
.ico-sm { width: 17px; height: 17px; stroke-width: 1.8; flex: none; }
.ico-md { width: 22px; height: 22px; flex: none; }

.skip-link { position: fixed; top: 12px; left: 12px; z-index: 100; padding: 10px 14px; border-radius: 10px; background: var(--ink); color: #fff; transform: translateY(-160%); }
.skip-link:focus { transform: none; }

/* Buttons */
.button { display: inline-flex; align-items: center; justify-content: center; gap: 10px; min-height: 50px; padding: 0 22px; border: 1px solid transparent; border-radius: 999px; font-size: 15px; font-weight: 560; white-space: nowrap; transition: transform 200ms var(--ease-out), box-shadow 200ms ease, background 200ms ease; }
.button svg { transition: transform 200ms var(--ease-out); }
.button:hover svg { transform: translate(2px, -2px); }
.button:active { transform: scale(0.97); }
.button-primary { color: #fff; background: var(--indigo); box-shadow: inset 0 1px 0 rgb(255 255 255 / 0.22), 0 1px 2px rgb(40 30 120 / 0.25), 0 10px 24px -10px rgb(90 82 224 / 0.7); }
.button-primary:hover { background: var(--indigo-deep); box-shadow: inset 0 1px 0 rgb(255 255 255 / 0.22), 0 1px 2px rgb(40 30 120 / 0.25), 0 14px 32px -10px rgb(90 82 224 / 0.8); }
.button-ghost { color: var(--ink); background: rgb(255 255 255 / 0.7); border-color: var(--line); -webkit-backdrop-filter: blur(10px); backdrop-filter: blur(10px); }
.button-ghost:hover { background: #fff; }
.button-ghost:hover svg { transform: translateY(2px); }
.button-light { color: var(--ink); background: #fff; box-shadow: 0 10px 30px -10px rgb(0 0 0 / 0.5); }
.button-small { min-height: 40px; padding: 0 16px; font-size: 14px; }
.button-block { width: 100%; }

/* Header */
.site-header { position: fixed; inset: 0 0 auto; z-index: 50; padding-top: env(safe-area-inset-top, 0px); transition: background 240ms ease, box-shadow 240ms ease; }
.site-header.is-scrolled { background: rgb(248 247 244 / 0.78); -webkit-backdrop-filter: blur(18px) saturate(1.6); backdrop-filter: blur(18px) saturate(1.6); box-shadow: 0 1px 0 rgb(28 34 52 / 0.07); }
.nav-inner { display: flex; align-items: center; gap: 32px; max-width: 1240px; height: 72px; margin-inline: auto; padding-inline: max(40px, env(safe-area-inset-left, 0px)); }
.wordmark { display: inline-flex; align-items: center; gap: 10px; font-size: 19px; font-weight: 650; letter-spacing: -0.03em; }
.wordmark img { transition: transform 600ms var(--ease-spring); }
.wordmark:hover img { transform: rotate(-20deg) scale(1.06); }
.desktop-nav { display: flex; gap: 28px; margin-left: 12px; color: var(--ink-2); font-size: 14.5px; }
.desktop-nav a { position: relative; }
.desktop-nav a::after { content: ''; position: absolute; left: 0; right: 0; bottom: -5px; height: 1.5px; border-radius: 2px; background: var(--thread); transform: scaleX(0); transform-origin: left; transition: transform 260ms var(--ease-out); }
.desktop-nav a:hover::after { transform: scaleX(1); }
.nav-actions { display: flex; align-items: center; gap: 18px; margin-left: auto; font-size: 14.5px; }
.sign-in { color: var(--ink-2); }
.sign-in:hover { color: var(--ink); }
.menu-toggle { display: none; margin-left: auto; padding: 8px; border: 0; border-radius: 10px; background: none; }
.mobile-nav { display: grid; gap: 4px; padding: 8px 20px 20px; font-size: 17px; }
.mobile-nav > a:not(.button) { padding: 12px 0; border-bottom: 1px solid var(--line); }
.mobile-nav .button { margin-top: 12px; }

/* Hero */
.hero { position: relative; padding-top: 150px; overflow: hidden; isolation: isolate; background: radial-gradient(circle, rgb(28 34 52 / 0.1) 1px, transparent 1.4px) 0 0 / 24px 24px, var(--paper); }
.hero::after { content: ''; position: absolute; inset: auto 0 0; z-index: -1; height: 30%; background: linear-gradient(transparent, var(--paper)); }
.hero-glow { position: absolute; inset: 0; z-index: -1; pointer-events: none; }
.hero-glow span { position: absolute; border-radius: 50%; filter: blur(70px); opacity: 0.55; animation: drift 22s ease-in-out infinite alternate; }
.hero-glow span:nth-child(1) { top: -8%; left: 8%; width: 46vw; height: 46vw; background: radial-gradient(closest-side, #d6ece8, transparent); }
.hero-glow span:nth-child(2) { top: 2%; right: 4%; width: 40vw; height: 40vw; background: radial-gradient(closest-side, #dcd8fa, transparent); animation-duration: 27s; animation-direction: alternate-reverse; }
.hero-glow span:nth-child(3) { top: 40%; left: 36%; width: 34vw; height: 34vw; background: radial-gradient(closest-side, #fbdccd, transparent); animation-duration: 31s; }
@keyframes drift {
  0% { transform: translate3d(0, 0, 0) scale(1); }
  50% { transform: translate3d(6vw, 4vh, 0) scale(1.12); }
  100% { transform: translate3d(-4vw, 7vh, 0) scale(0.94); }
}
.hero-copy { display: flex; flex-direction: column; align-items: center; text-align: center; }
.hero h1 { margin-top: 22px; font-size: clamp(48px, 7.4vw, 104px); line-height: 0.98; letter-spacing: -0.035em; }
.hero-lede { max-width: 640px; margin-top: 26px; color: var(--ink-2); font-size: clamp(17px, 1.5vw, 20px); line-height: 1.55; text-wrap: pretty; }
.hero-actions { display: flex; flex-wrap: wrap; justify-content: center; gap: 12px; margin-top: 34px; }
.serves { display: flex; flex-wrap: wrap; justify-content: center; gap: 8px; margin-top: 30px; }
.serves li { padding: 6px 12px; border: 1px solid var(--line); border-radius: 999px; background: rgb(255 255 255 / 0.7); color: var(--muted); font-family: var(--mono); font-size: 11.5px; letter-spacing: 0.04em; }
.hero-in { animation: rise 900ms var(--ease-out) backwards; animation-delay: calc(var(--d, 0) * 110ms + 80ms); }
@keyframes rise { from { opacity: 0; transform: translateY(24px); filter: blur(6px); } }

/* Hero product shots */
.screens { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); align-items: start; gap: 32px; max-width: 1080px; margin: 72px auto 0; padding: 0 40px 40px; }
.station { display: flex; flex-direction: column; align-items: center; margin-top: 72px; text-align: center; animation: station-in 1.1s var(--ease-spring) backwards; animation-delay: calc(500ms + var(--s) * 160ms); }
.station-voice { margin-top: 0; }
@keyframes station-in { from { opacity: 0; transform: translateY(60px); } }
.station-float { width: 100%; max-width: 290px; animation: float 7s ease-in-out infinite; animation-delay: calc(var(--s) * -2.3s); }
@keyframes float { 50% { transform: translateY(-10px); } }
.phone { container-type: inline-size; padding: 8px; border-radius: 46px; background: linear-gradient(145deg, #3a4050, #151824); box-shadow: inset 0 0 0 1.5px rgb(255 255 255 / 0.12), 0 50px 80px -30px rgb(28 34 52 / 0.5), 0 14px 28px -14px rgb(28 34 52 / 0.3); }
.station figcaption { margin-top: 22px; }
.station figcaption strong { display: block; font-size: 16px; font-weight: 600; letter-spacing: -0.01em; }
.station figcaption span { display: block; margin-top: 3px; color: var(--muted); font-size: 14px; }

/* Generated product concepts share the existing responsive phone frames. */
.phone-demo-image { display: block; width: 100%; height: auto; aspect-ratio: 660 / 1434; border-radius: 38px; background: #111827; }


/* Shared bits used by scenes */
.orb-glow { position: absolute; width: 84px; height: 84px; border-radius: 50%; background: conic-gradient(from 0deg, #4faaa5, #a99ae6, #f2aa88, #4faaa5); filter: blur(14px); opacity: 0.65; animation: spin 9s linear infinite, breathe 3.2s ease-in-out infinite; }
@keyframes spin { to { rotate: 360deg; } }
@keyframes breathe { 50% { scale: 1.14; } }
.orb-wave { position: relative; display: flex; align-items: center; gap: 3px; height: 40px; }
.orb-wave i { width: 3px; height: 100%; border-radius: 3px; background: #fff; box-shadow: 0 0 6px rgb(255 255 255 / 0.7); transform: scaleY(0.25); animation: wave 1.1s ease-in-out infinite; animation-delay: calc(var(--b) * -97ms); }
.orb-wave i:nth-child(3n) { animation-duration: 1.4s; }
.orb-wave i:nth-child(4n + 1) { animation-duration: 0.9s; }
@keyframes wave { 50% { transform: scaleY(1); } }
.rec-dot { display: inline-block; width: 7px; height: 7px; border-radius: 50%; background: #e0533d; box-shadow: 0 0 0 3px rgb(224 83 61 / 0.18); animation: blink 1.4s ease-in-out infinite; }
@keyframes blink { 50% { opacity: 0.35; } }
.cite { display: inline-grid; place-items: center; min-width: 13px; height: 13px; margin-left: 1px; border-radius: 4px; color: var(--indigo-deep); background: var(--pale-indigo); font-size: 8px; font-weight: 700; vertical-align: 3px; }
.avatar { display: inline-grid; flex-shrink: 0; place-items: center; width: 34px; height: 34px; border-radius: 50%; color: #fff; font-size: 11px; font-weight: 650; }
.avatar-jordan { background: linear-gradient(140deg, #f2aa88, #c96f47); }
.is-paused, .is-paused * { animation-play-state: paused !important; }

/* Reveal on scroll */
.motion-ready .reveal { opacity: 0; transform: translateY(32px); transition: opacity 800ms ease, transform 1000ms var(--ease-out); transition-delay: calc(var(--d, 0) * 110ms); }
.motion-ready .reveal.is-visible { opacity: 1; transform: none; }

/* Problem statement: words light up as it scrolls through */
.statement { padding: 150px 0 120px; }
.statement-inner { max-width: 1040px; }
.statement-text { margin-top: 26px; font-family: var(--serif); font-size: clamp(30px, 3.6vw, 50px); line-height: 1.18; letter-spacing: -0.02em; }
.statement-text span { opacity: calc(0.16 + 0.84 * clamp(0, var(--progress, 1) * (var(--count) + 6) - var(--w), 1)); transition: opacity 120ms linear; }
.statement-em { font-style: italic; color: var(--indigo); }
.statement-follow { max-width: 640px; margin-top: 36px; color: var(--ink-2); font-size: 19px; line-height: 1.55; }
.statement-note { margin-top: 16px; color: var(--faint); font-family: var(--mono); font-size: 11.5px; letter-spacing: 0.04em; }

/* Service: pinned product window with scrolling steps */
.story { padding: 60px 0 140px; }
.story-head { max-width: 900px; margin-bottom: 72px; }
.story-head h2 { margin-top: 20px; }
.story-sub { max-width: 600px; margin-top: 22px; color: var(--ink-2); font-size: 18px; line-height: 1.55; }
.story-grid { --progress: 0; display: grid; grid-template-columns: minmax(0, 1.25fr) 2px minmax(0, 0.8fr); gap: 56px; }
.story-stage-wrap { position: relative; }
.story-stage { position: sticky; top: 110px; overflow: hidden; border-radius: 22px; background: rgb(255 255 255 / 0.82); -webkit-backdrop-filter: blur(20px); backdrop-filter: blur(20px); box-shadow: var(--shadow-3); }
.story-stage::before { content: ''; position: absolute; inset: 0 0 auto; height: 2px; background: var(--thread); }
.stage-bar { display: flex; align-items: center; gap: 18px; padding: 14px 18px; border-bottom: 1px solid var(--line-soft); }
.stage-dots { display: flex; gap: 6px; }
.stage-dots i { width: 10px; height: 10px; border-radius: 50%; background: var(--line); }
.stage-tabs { display: flex; gap: 4px; padding: 3px; border-radius: 999px; background: var(--paper-2); font-size: 12.5px; font-weight: 560; }
.stage-tabs button { padding: 5px 12px; border: 0; border-radius: 999px; background: transparent; color: var(--muted); transition: background 300ms ease, color 300ms ease, box-shadow 300ms ease; }
.stage-tabs button.is-active { color: var(--ink); background: #fff; box-shadow: var(--shadow-1); }
.stage-body { position: relative; height: 470px; }
.scene { position: absolute; inset: 0; padding: 26px 28px; opacity: 0; visibility: hidden; transform: translateY(14px) scale(0.985); transition: opacity 450ms ease, transform 650ms var(--ease-out), visibility 0s 450ms; }
.scene.is-active { opacity: 1; visibility: visible; transform: none; transition: opacity 450ms ease 120ms, transform 650ms var(--ease-out) 120ms; }
.scene.is-active .source-list li, .scene.is-active .capture-transcript > * { animation: rise 700ms var(--ease-out) backwards; }

/* Match */
.scene-head { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 16px; }
.scene-head h4 { margin: 0; font-family: var(--serif); font-size: 24px; font-weight: 400; }
.providers { display: flex; gap: 8px; font-size: 12.5px; font-weight: 560; }
.providers span { display: inline-flex; align-items: center; gap: 7px; padding: 5px 11px; border-radius: 999px; background: var(--pale-teal); color: var(--teal-deep); white-space: nowrap; }
.live-dot { width: 7px; height: 7px; border-radius: 50%; background: var(--teal); box-shadow: 0 0 0 0 rgb(79 170 165 / 0.5); animation: ping 2s ease-out infinite; }
@keyframes ping { 70%, 100% { box-shadow: 0 0 0 7px rgb(79 170 165 / 0); } }
.source-list { display: grid; gap: 8px; }
.scene.is-active .source-list li { animation-delay: calc(var(--r) * 90ms + 150ms); }
.source-list li { display: grid; grid-template-columns: auto minmax(0, 1fr) auto 118px; align-items: center; gap: 12px; padding: 10px 12px; border-radius: 14px; background: #fff; box-shadow: var(--shadow-1); }
.source-icon { display: grid; place-items: center; width: 32px; height: 32px; border-radius: 10px; color: var(--indigo-deep); background: var(--pale-indigo); }
.source-name { display: flex; flex-direction: column; min-width: 0; font-size: 14px; font-weight: 560; }
.source-name small { color: var(--muted); font-family: var(--mono); font-size: 11px; font-weight: 400; }
.source-owner { display: grid; place-items: center; width: 26px; height: 26px; border-radius: 50%; color: #fff; background: linear-gradient(140deg, #f2aa88, #c96f47); font-size: 9.5px; font-weight: 650; }
.source-status { position: relative; display: flex; align-items: center; height: 22px; }
.source-bar { width: 100%; height: 5px; overflow: hidden; border-radius: 5px; background: var(--line-soft); }
.source-bar b { display: block; width: 100%; height: 100%; border-radius: 5px; background: var(--thread); }
.source-done { position: absolute; inset: 0; display: inline-flex; align-items: center; justify-content: flex-end; color: var(--teal-deep); font-size: 12px; font-weight: 600; white-space: nowrap; }
.source-done.low { color: var(--apricot-deep); }
.scene.is-active .source-bar b { animation: fill 1.1s var(--ease-out) backwards; animation-delay: calc(var(--r) * 260ms + 450ms); }
.scene.is-active .source-bar { animation: fade-out 300ms ease forwards; animation-delay: calc(var(--r) * 260ms + 1.6s); }
.scene.is-active .source-done { animation: fade 400ms ease backwards; animation-delay: calc(var(--r) * 260ms + 1.7s); }
@keyframes fill { from { width: 0; } }
@keyframes fade { from { opacity: 0; } }
@keyframes fade-out { to { opacity: 0; } }
.scene-foot { margin-top: 16px; color: var(--muted); font-family: var(--mono); font-size: 11.5px; }

/* Talk */
.scene-capture { display: grid; grid-template-columns: 170px minmax(0, 1fr); gap: 26px; height: 100%; }
.capture-orb { position: relative; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 18px; border-radius: 18px; background: linear-gradient(180deg, #f5f3fd, #eef7f6); }
.capture-orb .orb-glow { top: 18%; width: 120px; height: 120px; }
.capture-orb .orb-wave { height: 54px; margin-top: -96px; }
.capture-orb p { position: absolute; bottom: 18px; display: flex; flex-direction: column; align-items: center; gap: 5px; font-size: 13px; font-weight: 560; text-align: center; }
.capture-orb small { display: inline-flex; align-items: center; gap: 6px; color: var(--muted); font-family: var(--mono); font-size: 11px; }
.capture-transcript { display: flex; flex-direction: column; gap: 12px; font-size: 14px; line-height: 1.5; }
.scene.is-active .capture-transcript > :nth-child(2) { animation-delay: 350ms; }
.scene.is-active .capture-transcript > :nth-child(3) { animation-delay: 1s; }
.scene.is-active .capture-transcript > :nth-child(4) { animation-delay: 1.8s; }
.gap-chip { align-self: flex-start; padding: 4px 10px; border-radius: 999px; color: var(--apricot-deep); background: var(--pale-apricot); font-family: var(--mono); font-size: 11px; }
.line-ai, .line-person { max-width: 92%; padding: 10px 14px; border-radius: 16px; }
.line-ai { background: #fff; box-shadow: var(--shadow-1); }
.line-person { align-self: flex-end; color: #fff; background: var(--indigo); }
.draft-card { padding: 14px 16px; border: 1px dashed var(--lavender); border-radius: 16px; background: rgb(236 235 252 / 0.5); }
.draft-badge { color: var(--indigo-deep); font-family: var(--mono); font-size: 10.5px; letter-spacing: 0.08em; text-transform: uppercase; }
.draft-card h5 { margin: 4px 0 6px; font-family: var(--serif); font-size: 19px; font-weight: 500; }
.draft-card ol { padding-left: 18px; list-style: decimal; color: var(--ink-2); font-size: 13px; }

/* Shape */
.scene-ask { display: flex; flex-direction: column; gap: 16px; }
.ask-question { display: flex; align-items: center; align-self: flex-end; gap: 10px; }
.ask-question p { padding: 10px 15px; border-radius: 16px; color: #fff; background: var(--indigo); font-size: 14.5px; }
.ask-answer { display: flex; gap: 12px; min-height: 72px; }
.ask-mark { display: grid; flex-shrink: 0; place-items: center; width: 34px; height: 34px; border-radius: 50%; background: #fff; box-shadow: var(--shadow-1); }
.ask-answer p { font-family: var(--serif); font-size: 21px; line-height: 1.4; }
.ask-answer .cite { min-width: 16px; height: 16px; font-family: var(--sans); font-size: 10px; vertical-align: 6px; }
.caret { display: inline-block; width: 2px; height: 1.05em; margin-left: 2px; background: var(--indigo); vertical-align: -0.15em; animation: blink 900ms steps(2) infinite; }
.ask-sources { display: grid; gap: 8px; opacity: 0; transform: translateY(10px); transition: opacity 500ms ease, transform 700ms var(--ease-out); }
.scene-ask.is-done .ask-sources { opacity: 1; transform: none; }
.ask-source { display: flex; gap: 12px; padding: 12px 14px; border-radius: 14px; background: #fff; box-shadow: var(--shadow-1); }
.ask-source b { display: grid; flex-shrink: 0; place-items: center; width: 20px; height: 20px; border-radius: 6px; color: var(--indigo-deep); background: var(--pale-indigo); font-size: 11px; }
.ask-source span { display: flex; align-items: center; gap: 6px; color: var(--muted); font-size: 12px; }
.ask-source q { display: block; margin-top: 4px; font-size: 14px; }
.ask-source q::before, .ask-source q::after { color: var(--faint); }
.ask-verified { display: inline-flex; align-items: center; gap: 6px; color: var(--teal-deep); font-size: 13px; font-weight: 600; }

/* Publish */
.scene-transfer { display: flex; flex-direction: column; height: 100%; }
.map-svg { flex: 1; width: 100%; min-height: 0; overflow: visible; }
.map-svg .edge { fill: none; stroke-width: 2; stroke-linecap: round; }
.map-svg .edge-from { stroke: #f2c3ad; }
.map-svg .edge-to { stroke: #4faaa5; stroke-dasharray: 1; stroke-dashoffset: 1; }
.map-svg.is-running .edge-from { animation: fade-out 600ms ease forwards; animation-delay: calc(0.6s + var(--m) * 0.32s); }
.map-svg.is-running .edge-to { animation: undraw 700ms var(--ease-out) forwards; animation-delay: calc(1.3s + var(--m) * 0.32s); }
.map-svg.is-settled .edge-from { opacity: 0; }
.map-svg.is-settled .edge-to { stroke-dashoffset: 0; }
@keyframes undraw { to { stroke-dashoffset: 0; } }
.map-review { fill: none; stroke: var(--lavender); stroke-width: 2; stroke-dasharray: 4 5; }
.node circle { stroke: #fff; stroke-width: 4; }
.node-left circle { fill: #e08d66; }
.node-right circle { fill: var(--teal-deep); }
.node-review circle { fill: var(--indigo); stroke-width: 3; }
.map-svg.is-running .node-right circle { animation: receive 900ms var(--ease-spring) backwards; animation-delay: 2.6s; transform-box: fill-box; transform-origin: center; }
@keyframes receive { 40% { transform: scale(1.18); } }
.node-initials { fill: #fff; font: 650 15px var(--sans); text-anchor: middle; }
.node-initials-mid { font-size: 10px; letter-spacing: 0.06em; }
.node-initials-small { font-size: 9px; }
.node-name { fill: var(--ink); font: 600 14px var(--sans); text-anchor: middle; }
.node-meta { fill: var(--muted); font: 500 9.5px var(--mono); letter-spacing: 0.1em; text-anchor: middle; }
.node-meta-left { text-anchor: start; }
.map-item rect { fill: #fff; stroke: rgb(28 34 52 / 0.08); filter: drop-shadow(0 3px 6px rgb(28 34 52 / 0.12)); }
.map-item text { fill: var(--ink); font: 560 11px var(--sans); text-anchor: middle; }
.transfer-bar { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding-top: 14px; border-top: 1px solid var(--line-soft); color: var(--muted); font-size: 13px; }
.transfer-bar b { color: var(--ink); }
.transfer-button { display: inline-flex; align-items: center; gap: 6px; padding: 8px 14px; border-radius: 999px; color: #fff; background: var(--teal-deep); font-weight: 600; }

/* Rail and steps */
.story-rail { position: relative; border-radius: 2px; background: var(--line); }
.story-rail span { position: absolute; inset: 0 0 auto; height: calc(var(--progress, 0) * 100%); border-radius: 2px; background: linear-gradient(180deg, var(--teal), var(--lavender), var(--indigo)); }
.story-steps { display: grid; }
.story-steps li { display: flex; align-items: center; min-height: 78vh; }
.story-steps li:first-child { min-height: 50vh; align-items: flex-start; }
.step-inner { opacity: 0.32; transform: translateX(10px); transition: opacity 500ms ease, transform 700ms var(--ease-out); }
.story-steps li.is-active .step-inner { opacity: 1; transform: none; }
.step-node { display: grid; place-items: center; width: 40px; height: 40px; margin-bottom: 18px; border-radius: 13px; color: var(--indigo); background: #fff; box-shadow: var(--shadow-1); transition: background 400ms ease, color 400ms ease, box-shadow 400ms ease; }
.story-steps li.is-active .step-node { color: #fff; background: var(--indigo); box-shadow: 0 10px 24px -8px rgb(90 82 224 / 0.7); }
.step-label { color: var(--muted); font-family: var(--mono); font-size: 12px; letter-spacing: 0.12em; text-transform: uppercase; }
.story-steps h3 { margin-top: 10px; font-family: var(--serif); font-size: clamp(28px, 2.6vw, 38px); font-weight: 400; letter-spacing: -0.02em; line-height: 1.1; text-wrap: balance; }
.step-text { margin-top: 14px; color: var(--ink-2); font-size: 16.5px; line-height: 1.6; }
.step-meta { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 18px; }
.step-meta span { padding: 4px 10px; border: 1px solid var(--line); border-radius: 999px; color: var(--muted); font-family: var(--mono); font-size: 11px; }

/* Product: bento */
.why { padding: 120px 0; }
.section-head h2 { margin-top: 20px; }
.bento { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 18px; margin-top: 64px; }
.card { position: relative; display: flex; flex-direction: column; gap: 10px; padding: 28px; overflow: hidden; border-radius: 24px; background: #fff; box-shadow: var(--shadow-2); transition: transform 400ms var(--ease-out), box-shadow 400ms ease, opacity 800ms ease; }
.card:hover { transform: translateY(-4px); box-shadow: var(--shadow-3); }
.motion-ready .card.reveal.is-visible:hover { transform: translateY(-4px); }
.card p { color: var(--muted); font-size: 15px; line-height: 1.55; }
.card-wide { grid-column: span 2; flex-direction: row; align-items: center; justify-content: space-between; gap: 32px; }
.card-copy { display: grid; gap: 10px; max-width: 380px; }
.card h3 { font-family: var(--serif); font-size: 27px; font-weight: 400; letter-spacing: -0.02em; }
.flow-pills { display: flex; align-items: center; gap: 6px; }
.flow-pills span { padding: 8px 14px; border-radius: 999px; background: var(--paper-2); color: var(--muted); font-size: 13px; font-weight: 560; white-space: nowrap; animation: pill-step 6s ease-in-out infinite; }
.flow-pills span:nth-of-type(2) { animation-delay: 2s; }
.flow-pills span:nth-of-type(3) { animation-delay: 4s; }
@keyframes pill-step {
  0%, 8% { color: var(--muted); background: var(--paper-2); box-shadow: none; }
  14%, 30% { color: #fff; background: var(--indigo); box-shadow: 0 8px 20px -8px rgb(90 82 224 / 0.8); }
  38%, 100% { color: var(--muted); background: var(--paper-2); box-shadow: none; }
}
.flow-pills i { width: 22px; height: 2px; border-radius: 2px; background: var(--thread); }
.card-visual { margin-bottom: 14px; }
.quote-visual { display: flex; gap: 10px; padding: 16px; border-radius: 16px; background: var(--paper); color: var(--indigo); }
.quote-mark { font-family: var(--serif); font-size: 34px; line-height: 0.8; }
.quote-visual p { color: var(--ink); font-family: var(--serif); font-size: 19px; line-height: 1.35; }
.quote-visual mark { color: inherit; background: linear-gradient(transparent 58%, #d5cff7 58%) no-repeat; background-size: 0 100%; animation: highlight 5s var(--ease-out) infinite; }
@keyframes highlight { 0%, 10% { background-size: 0 100%; } 35%, 85% { background-size: 100% 100%; } 100% { background-size: 0 100%; } }
.review-visual { display: grid; gap: 12px; padding: 16px; border-radius: 16px; background: var(--paper); }
.review-visual div { display: grid; gap: 6px; font-size: 13px; font-weight: 560; }
.review-visual i { position: relative; height: 6px; border-radius: 6px; background: var(--line); }
.review-visual i::after { content: ''; position: absolute; inset: 0 auto 0 0; width: var(--w); border-radius: 6px; background: var(--teal); animation: fill 1.6s var(--ease-out) backwards; }
.review-visual i.due::after { background: var(--apricot); animation: fill 1.6s var(--ease-out) backwards, blink 1.6s ease-in-out 1.6s infinite; }
.card-ink { color: #fff; background: radial-gradient(120% 140% at 100% 0%, rgb(110 90 230 / 0.45), transparent 55%), radial-gradient(90% 120% at 0% 100%, rgb(79 170 165 / 0.35), transparent 55%), #1a2030; }
.card-ink p { color: rgb(255 255 255 / 0.7); }
.consent-visual { display: flex; align-items: flex-start; gap: 14px; color: #8fd7d1; }
.consent-visual div { display: grid; gap: 8px; }
.consent-visual span { display: inline-flex; align-items: center; gap: 8px; padding: 8px 12px; border-radius: 12px; color: #fff; background: rgb(255 255 255 / 0.08); font-size: 13px; white-space: nowrap; }
.consent-visual span svg { color: #8fd7d1; }
.consent-visual span.off { color: rgb(255 255 255 / 0.45); text-decoration: line-through; }
.also { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 40px; margin-top: 56px; padding-top: 36px; border-top: 1px solid var(--line); }
.also p:not(.mono-tag) { max-width: 320px; margin-top: 10px; color: var(--ink-2); font-size: 15.5px; line-height: 1.55; }

/* Personal connection */
.belief { padding: 120px 0; background: var(--paper-2); }
.belief-grid { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: 64px; align-items: start; }
.belief h2 { margin-top: 20px; }
.belief-copy { display: grid; gap: 20px; color: var(--ink-2); font-size: 19px; line-height: 1.6; }
.beliefs { border-top: 1px solid var(--line); margin-top: 8px; font-size: 16px; }
.beliefs li { padding: 16px 0; border-bottom: 1px solid var(--line); }
.beliefs b { display: block; margin-bottom: 2px; color: var(--ink); font-family: var(--serif); font-size: 21px; font-weight: 500; letter-spacing: -0.01em; }

/* Contact */
.pricing { padding: 120px 0; }
.pricing-grid { display: grid; grid-template-columns: minmax(0, 1.15fr) minmax(0, 0.85fr); gap: 64px; align-items: start; }
.pricing-intro h2 { margin-top: 20px; }
.contact-line { max-width: 520px; margin-top: 24px; color: var(--ink-2); font-size: 18px; line-height: 1.55; }
.contact-line a { color: var(--indigo); font-weight: 560; text-decoration: underline; text-underline-offset: 3px; }
.faq { margin-top: 44px; border-top: 1px solid var(--line); }
.faq-item { border-bottom: 1px solid var(--line); }
.faq-item summary { display: flex; align-items: center; justify-content: space-between; gap: 16px; padding: 20px 0; font-size: 17px; font-weight: 560; list-style: none; cursor: pointer; }
.faq-item summary::-webkit-details-marker { display: none; }
.faq-item summary svg { color: var(--indigo); transition: transform 300ms var(--ease-out); }
.faq-item[open] summary svg { transform: rotate(45deg); }
.faq-item p { padding-bottom: 20px; color: var(--muted); line-height: 1.6; animation: rise 500ms var(--ease-out); }
.price-card { position: sticky; top: 110px; display: grid; gap: 16px; padding: 34px; border-radius: 28px; background: linear-gradient(#fff, #fff) padding-box, linear-gradient(140deg, var(--teal), var(--lavender), var(--apricot)) border-box; border: 1.5px solid transparent; box-shadow: var(--shadow-3); }
.price-label { color: var(--indigo); font-family: var(--mono); font-size: 12px; letter-spacing: 0.12em; text-transform: uppercase; }
.form-title { font-family: var(--serif); font-size: 34px; line-height: 1.08; letter-spacing: -0.02em; }
.field { display: grid; gap: 6px; }
.field label { color: var(--ink-2); font-size: 13.5px; font-weight: 560; }
.field input, .field select, .field textarea { width: 100%; padding: 12px 14px; border: 1px solid var(--line); border-radius: 12px; background: var(--paper); color: var(--ink); font: inherit; font-size: 15px; resize: vertical; }
.field input:focus, .field select:focus, .field textarea:focus { outline: 2px solid var(--indigo); outline-offset: 1px; background: #fff; }
.price-fine { min-height: 1.5em; color: var(--faint); font-size: 12.5px; line-height: 1.5; text-align: center; }

/* Final CTA */
.final { position: relative; margin: 40px 24px 0; padding: 140px 0; overflow: hidden; border-radius: 36px; color: #fff; background: radial-gradient(80% 90% at 50% 120%, rgb(110 90 230 / 0.55), transparent 60%), #151a2a; isolation: isolate; }
.final-threads { position: absolute; inset: 0; z-index: -1; width: 100%; height: 100%; }
.final-line, .final-pulse { fill: none; stroke-width: 3; stroke-linecap: round; }
.final-line { opacity: 0.22; stroke-dasharray: 1; stroke-dashoffset: 1; }
.final.is-visible .final-line { stroke-dashoffset: 0; transition: stroke-dashoffset 2.2s var(--ease-out); transition-delay: calc(var(--i) * 120ms); }
.final-pulse { stroke-width: 4; stroke-dasharray: 0.08 0.92; stroke-dashoffset: 1; filter: drop-shadow(0 0 6px currentColor); opacity: 0; }
.final.is-visible .final-pulse { opacity: 1; animation: pulse-run 5s linear infinite; animation-delay: calc(1.6s + var(--i) * -0.9s); }
@keyframes pulse-run { to { stroke-dashoffset: -1; } }
.final-inner { display: flex; flex-direction: column; align-items: center; text-align: center; }
.final-knot { display: grid; place-items: center; width: 96px; height: 96px; margin-bottom: 28px; border-radius: 30px; background: rgb(255 255 255 / 0.08); box-shadow: inset 0 0 0 1px rgb(255 255 255 / 0.12); animation: float 6s ease-in-out infinite; }
.final h2 { font-size: clamp(42px, 5.6vw, 80px); }
.lp .final h2 em { background: linear-gradient(100deg, #c6b6f3, #8fd7d1); -webkit-background-clip: text; background-clip: text; }
.final p { margin: 20px 0 32px; color: rgb(255 255 255 / 0.72); font-size: 18px; }

/* Footer */
.site-footer { padding: 48px 0 56px; }
.footer-inner { display: flex; flex-wrap: wrap; align-items: center; gap: 20px 40px; }
.footer-inner nav { display: flex; flex-wrap: wrap; gap: 24px; color: var(--muted); font-size: 14px; }
.footer-inner nav a { display: inline-flex; align-items: center; gap: 3px; }
.footer-inner nav a:hover { color: var(--ink); }
.footer-inner > p { margin-left: auto; color: var(--faint); font-family: var(--mono); font-size: 12px; }

/* Smaller screens */
@media (max-width: 1080px) {
  .story-grid { gap: 36px; }
  .scene-capture { grid-template-columns: 1fr; }
  .capture-orb { display: none; }
}
@media (max-width: 900px) {
  .container, .nav-inner { padding-inline: max(20px, env(safe-area-inset-left, 0px)); }
  .desktop-nav, .nav-actions { display: none; }
  .menu-toggle { display: block; }
  .site-header:has(.mobile-nav) { background: var(--paper); }
  .hero { padding-top: 120px; }
  .story-grid { grid-template-columns: 1fr; }
  .story-rail { display: none; }
  .story-stage { top: 76px; }
  .stage-body { height: 420px; }
  .scene { padding: 18px; }
  .story-steps li, .story-steps li:first-child { min-height: 0; padding: 28px 0; }
  .step-inner { opacity: 1; transform: none; }
  .bento, .pricing-grid, .belief-grid { grid-template-columns: 1fr; }
  .belief-grid { gap: 36px; }
  .card-wide { grid-column: auto; flex-direction: column; align-items: flex-start; }
  .price-card { position: static; }
  .also { grid-template-columns: 1fr; gap: 28px; }
  .final { margin-inline: 12px; padding: 96px 0; border-radius: 28px; }
  .statement { padding: 110px 0 90px; }
}
@media (max-width: 760px) {
  .screens { grid-template-columns: 1fr; max-width: 320px; padding-inline: 20px; }
  .station { margin-top: 0; }
  .station-home, .station-draft { display: none; }
  .source-list li { grid-template-columns: auto minmax(0, 1fr) 96px; }
  .source-owner { display: none; }
  .flow-pills { flex-wrap: wrap; }
  .consent-visual span { white-space: normal; }
  .footer-inner > p { margin-left: 0; width: 100%; }
}

@media (prefers-reduced-motion: reduce) {
  .lp *, .lp *::before, .lp *::after {
    animation-duration: 1ms !important;
    animation-delay: 0ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 1ms !important;
    transition-delay: 0ms !important;
    scroll-behavior: auto !important;
  }
}
</style>
