<template>
  <main class="marketing-shell">
    <a class="skip-link" href="#main-content">Skip to content</a>

    <header class="masthead">
      <div class="masthead-row">
        <NuxtLink class="brand" to="/" aria-label="Foligo home">
          <svg class="brand-mark" viewBox="0 0 100 100" width="26" height="26" role="img" aria-labelledby="markTitleHeader">
            <title id="markTitleHeader">Foligo mark: a wave smoothing into a straight line</title>
            <defs>
              <linearGradient id="gradHeader" x1="0%" y1="50%" x2="100%" y2="50%">
                <stop offset="0%" stop-color="#6366F1" />
                <stop offset="100%" stop-color="#8B5CF6" />
              </linearGradient>
            </defs>
            <path d="M10 50 C 20 25, 30 25, 40 50 S 50 75, 60 50 C 65 40, 75 45, 90 45" stroke="url(#gradHeader)" stroke-width="10" stroke-linecap="round" stroke-linejoin="round" fill="none" />
          </svg>
          <span>foligo</span>
        </NuxtLink>
        <p class="masthead-tag">Vol. I — portfolios, written by talking</p>
        <nav class="desktop-nav" aria-label="Main navigation">
          <a href="#studio"><em>01</em> Studio</a>
          <a href="#applications"><em>02</em> GoApply</a>
          <a href="#mobile"><em>03</em> Mobile</a>
        </nav>
        <div class="header-actions">
          <NuxtLink class="text-link" to="/login">Log in</NuxtLink>
          <NuxtLink class="button button-small" to="/signup">Start writing <span aria-hidden="true">→</span></NuxtLink>
        </div>
        <button class="menu-button" type="button" :aria-expanded="menuOpen" aria-controls="mobile-nav" @click="menuOpen = !menuOpen">
          <span class="sr-only">{{ menuOpen ? 'Close' : 'Open' }} navigation</span><span aria-hidden="true">{{ menuOpen ? '×' : '☰' }}</span>
        </button>
      </div>
      <nav v-if="menuOpen" id="mobile-nav" class="mobile-nav" aria-label="Mobile navigation">
        <a href="#studio" @click="menuOpen = false">01 · Studio</a>
        <a href="#applications" @click="menuOpen = false">02 · GoApply</a>
        <a href="#mobile" @click="menuOpen = false">03 · Mobile</a>
        <NuxtLink to="/login" @click="menuOpen = false">Log in</NuxtLink>
        <NuxtLink to="/signup" @click="menuOpen = false">Start writing</NuxtLink>
      </nav>
    </header>

    <section id="main-content" class="hero" aria-labelledby="hero-title">
      <div class="hero-grid">
        <div class="hero-lead">
          <p class="kicker">No. 01 — Draft</p>
          <h1 id="hero-title">Your work<br /><em>already has</em><br />a shape.</h1>
          <p class="hero-dek">Foligo starts with a conversation, typed or spoken, about what you've made. It turns that into a portfolio you edit in a real studio, publish under your own name, and reuse for every application that follows.</p>
          <div class="hero-actions">
            <NuxtLink class="button" to="/signup">Start talking <span aria-hidden="true">→</span></NuxtLink>
            <a class="button button-ghost" href="#studio">Read how it works <span aria-hidden="true">↓</span></a>
          </div>
        </div>
        <nav class="contents" aria-label="Page contents">
          <p class="contents-label">In this issue</p>
          <ol>
            <li><a href="#studio"><span class="contents-index">01</span><span class="contents-title">Studio<small>Talk it out, shape it in the editor</small></span></a></li>
            <li><a href="#publish"><span class="contents-index">02</span><span class="contents-title">Publish<small>Give the work an address</small></span></a></li>
            <li><a href="#applications"><span class="contents-index">03</span><span class="contents-title">GoApply<small>Turn projects into applications</small></span></a></li>
            <li><a href="#mobile"><span class="contents-index">04</span><span class="contents-title">Mobile<small>Carry the work with you</small></span></a></li>
          </ol>
        </nav>
      </div>
      <svg class="hero-mark" viewBox="0 0 100 100" width="120" height="120" aria-hidden="true" focusable="false">
        <defs>
          <linearGradient id="gradHero" x1="0%" y1="50%" x2="100%" y2="50%">
            <stop offset="0%" stop-color="#6366F1" />
            <stop offset="100%" stop-color="#8B5CF6" />
          </linearGradient>
        </defs>
        <path class="hero-mark-path" d="M10 50 C 20 25, 30 25, 40 50 S 50 75, 60 50 C 65 40, 75 45, 90 45" stroke="url(#gradHero)" stroke-width="7" stroke-linecap="round" stroke-linejoin="round" fill="none" />
      </svg>
    </section>

    <div class="divider" aria-hidden="true">
      <svg viewBox="0 0 400 40" preserveAspectRatio="none">
        <defs>
          <linearGradient id="gradDiv1" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stop-color="#6366F1" />
            <stop offset="35%" stop-color="#8B5CF6" />
            <stop offset="100%" stop-color="#8B5CF6" stop-opacity=".25" />
          </linearGradient>
        </defs>
        <path d="M0 20 C8 6,16 6,24 20 S40 34,48 20 C54 12,60 20,70 20 L400 20" stroke="url(#gradDiv1)" stroke-width="2" fill="none" />
      </svg>
    </div>

    <section id="studio" class="chapter chapter-dark" aria-labelledby="studio-title">
      <div class="chapter-head">
        <p class="kicker">Chapter 01</p>
        <h2 id="studio-title">Say it before you write it.</h2>
      </div>
      <div class="chapter-body">
        <div class="chapter-copy">
          <p>Most portfolio builders start with a blank page. Foligo starts with a conversation: type or talk through a project the way you'd explain it to a colleague — what you built, what changed, and why it mattered.</p>
          <blockquote class="pull-quote">"What did you actually ship?" is a better prompt than a blank text field.</blockquote>
          <p>That conversation becomes structured draft content — a case study, a role, a piece of writing — landing in the content studio, a focused editor for arranging and rewriting before anything goes public.</p>
          <dl class="footnotes">
            <div><dt>Conversational creation</dt><dd>Describe a project in your own words; Foligo drafts the structure for you.</dd></div>
            <div><dt>Voice mode</dt><dd>Talk instead of type — the same drafting happens starting from speech.</dd></div>
            <div><dt>Content studio</dt><dd>Edit, reorder, and polish drafts alongside the rest of your portfolio.</dd></div>
          </dl>
        </div>
        <div class="studio-mockup" aria-hidden="true">
          <div class="mockup-bar">
            <span class="mockup-label">Foligo Studio</span>
            <span class="status-pill">Draft <span aria-hidden="true">→</span> Published</span>
          </div>
          <div class="mockup-body">
            <ul class="mockup-rail">
              <li class="active">Case Studies</li>
              <li>Experience</li>
              <li>Writing</li>
              <li>Settings</li>
            </ul>
            <div class="mockup-doc">
              <p class="mockup-meta">PROJECT 03 — LAST EDITED 4M AGO</p>
              <h3>Community tools, rebuilt for scale</h3>
              <p>Led the redesign of our community tooling from research through launch, cutting moderator response time and giving members a clearer path to get help.</p>
              <div class="mockup-tags"><span>Research</span><span>Product design</span><span>0→1</span></div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section id="publish" class="chapter chapter-light" aria-labelledby="publish-title">
      <div class="chapter-head">
        <p class="kicker">Chapter 02</p>
        <h2 id="publish-title">Give the work an address.</h2>
      </div>
      <div class="chapter-body chapter-body-reverse">
        <div class="publish-mockup" aria-hidden="true">
          <div class="url-bar"><span>https://</span><strong>alexmorgan</strong><span>.foligo.org</span></div>
          <ul class="publish-list">
            <li><span class="publish-index">01</span><span>Community tools, rebuilt for scale</span></li>
            <li><span class="publish-index">02</span><span>Research-to-release: a workflow retrospective</span></li>
            <li><span class="publish-index">03</span><span>Notes on writing for internal tools</span></li>
          </ul>
        </div>
        <div class="chapter-copy">
          <p>When a draft is ready, publish it to a portfolio site on your own subdomain — <code>yourname.foligo.org</code> — with a theme you choose, not a template everyone else is using too.</p>
          <p>It's a living document. Add a project, revise a case study, or take something down, and your public site updates without a rebuild or a deploy.</p>
        </div>
      </div>
    </section>

    <div class="divider" aria-hidden="true">
      <svg viewBox="0 0 400 40" preserveAspectRatio="none">
        <defs>
          <linearGradient id="gradDiv2" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stop-color="#8B5CF6" stop-opacity=".25" />
            <stop offset="65%" stop-color="#8B5CF6" />
            <stop offset="100%" stop-color="#6366F1" />
          </linearGradient>
        </defs>
        <path d="M0 20 L330 20 C340 20,346 12,352 20 S368 34,376 20 C382 12,390 20,400 20" stroke="url(#gradDiv2)" stroke-width="2" fill="none" />
      </svg>
    </div>

    <section id="applications" class="chapter chapter-dark" aria-labelledby="applications-title">
      <div class="chapter-head">
        <p class="kicker">Chapter 03</p>
        <h2 id="applications-title">The portfolio doesn't stop at publish.</h2>
      </div>
      <div class="chapter-body">
        <div class="chapter-copy">
          <p>The same material you wrote for your portfolio becomes source content for tailored resumes and cover letters. GoApply, Foligo's companion tool, keeps track of where each one goes.</p>
          <blockquote class="pull-quote">One body of work, reused instead of rewritten for every role.</blockquote>
          <p>A browser extension — the GoApply agent — can act on job listings you're already looking at, drafting an application from your existing projects without starting over in a blank cover letter.</p>
          <NuxtLink class="inline-link" to="/signup">Start an application workflow <span aria-hidden="true">→</span></NuxtLink>
        </div>
        <div class="applications-mockup" aria-hidden="true">
          <div class="resume-sheet">
            <p class="mockup-meta">TAILORED RESUME</p>
            <h3>Alex Morgan</h3>
            <p class="resume-role">Product designer building thoughtful systems and clear experiences.</p>
            <div class="resume-block"><b>Selected work</b><span>Community tools, rebuilt for scale</span><span>Research-to-release workflow</span></div>
          </div>
          <div class="kanban">
            <div class="kanban-top"><span>GoApply</span></div>
            <div class="kanban-columns">
              <div><small>Saved</small><p>Product designer, Platform team</p></div>
              <div><small>Applied</small><p class="accent-card">Design systems lead<br /><i>Resume linked</i></p></div>
              <div><small>Interview</small><p class="accent-card-2">Experience designer</p></div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section id="mobile" class="chapter chapter-light" aria-labelledby="mobile-title">
      <div class="chapter-head">
        <p class="kicker">Chapter 04</p>
        <h2 id="mobile-title">Carry the work with you.</h2>
      </div>
      <div class="chapter-body chapter-body-reverse">
        <div class="phone" aria-hidden="true">
          <div class="phone-notch"></div>
          <div class="phone-screen">
            <p class="mockup-meta">FOLIGO / IOS</p>
            <h3>Today's work</h3>
            <div class="phone-project"><span>01</span><strong>Community tools</strong><i>In progress</i></div>
            <div class="phone-project"><span>02</span><strong>Résumé — Platform role</strong><i>Ready to review</i></div>
          </div>
        </div>
        <div class="chapter-copy">
          <p>Browse your projects, review a drafted case study, or check on an application from the Foligo iOS app — the same account and the same work, wherever you left it.</p>
          <p>Between the app and the browser extension, the portfolio is something you keep up with in the in-between moments, not a project you sit down to maintain.</p>
        </div>
      </div>
    </section>

    <section class="epilogue" aria-labelledby="epilogue-title">
      <p class="kicker">Epilogue</p>
      <h2 id="epilogue-title">Start with what you already know.</h2>
      <p>You don't need a finished portfolio to begin. You need one project you can talk about.</p>
      <NuxtLink class="button" to="/signup">Start with Foligo <span aria-hidden="true">→</span></NuxtLink>
    </section>

    <footer>
      <div class="footer-brand">
        <NuxtLink class="brand" to="/">
          <svg class="brand-mark" viewBox="0 0 100 100" width="22" height="22" role="img" aria-labelledby="markTitleFooter">
            <title id="markTitleFooter">Foligo mark: a wave smoothing into a straight line</title>
            <defs>
              <linearGradient id="gradFooter" x1="0%" y1="50%" x2="100%" y2="50%">
                <stop offset="0%" stop-color="#6366F1" />
                <stop offset="100%" stop-color="#8B5CF6" />
              </linearGradient>
            </defs>
            <path d="M10 50 C 20 25, 30 25, 40 50 S 50 75, 60 50 C 65 40, 75 45, 90 45" stroke="url(#gradFooter)" stroke-width="10" stroke-linecap="round" stroke-linejoin="round" fill="none" />
          </svg>
          <span>foligo</span>
        </NuxtLink>
        <p>Portfolio creation and job workflows, connected.</p>
      </div>
      <p class="colophon">No invented metrics or testimonials on this page — just what Foligo does.</p>
      <NuxtLink to="/login">Log in</NuxtLink>
    </footer>
  </main>
</template>

<script setup>
import { ref } from 'vue'
const menuOpen = ref(false)
useHead({
  title: 'Foligo — Make the work do the talking',
  meta: [
    { name: 'description', content: 'Foligo helps you create a portfolio through conversation or voice, then carry your work into resumes, cover letters, and GoApply workflows.' },
    { name: 'theme-color', content: '#15141d' },
    { property: 'og:title', content: 'Foligo — Make the work do the talking' },
    { property: 'og:description', content: 'Portfolio creation and job workflows, connected.' }
  ]
})
</script>

<style scoped>
.marketing-shell {
  --ink: #15141d;
  --ink-soft: #221f2c;
  --paper: #f6f2ea;
  --paper-dim: #ece5d6;
  --rule-on-paper: rgba(21, 20, 29, 0.14);
  --rule-on-ink: rgba(246, 242, 234, 0.16);
  --muted-on-paper: #55525f;
  --muted-on-ink: #b9b4c4;
  --indigo-text: #4338ca;
  --violet-text: #c4b5fd;
  --indigo: #6366f1;
  --violet: #8b5cf6;
  --font-display: ui-serif, Georgia, Cambria, "Times New Roman", Times, serif;
  --font-body: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  --font-mono: ui-monospace, SFMono-Regular, Menlo, Consolas, "Liberation Mono", monospace;
  background: var(--paper);
  color: var(--ink);
  font-family: var(--font-body);
  overflow-x: hidden;
}
.marketing-shell * { box-sizing: border-box; }
.sr-only { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
.skip-link { position: absolute; left: 1rem; top: -4rem; background: var(--ink); color: var(--paper); padding: .7rem 1.1rem; z-index: 20; text-decoration: none; font-family: var(--font-mono); font-size: .85rem; }
.skip-link:focus { top: 1rem; }

a:focus-visible, button:focus-visible, [tabindex]:focus-visible {
  outline: 2px solid var(--indigo);
  outline-offset: 3px;
  border-radius: 2px;
}

/* ---------- header ---------- */
.masthead { max-width: 1280px; margin: 0 auto; padding: 0 24px; border-bottom: 1px solid var(--rule-on-paper); }
.masthead-row { min-height: 76px; display: flex; align-items: center; gap: 28px; }
.brand { display: inline-flex; align-items: center; gap: 8px; color: var(--ink); font-family: var(--font-display); font-size: 1.3rem; font-weight: 700; text-decoration: none; white-space: nowrap; }
.masthead-tag { font-family: var(--font-mono); font-size: .72rem; letter-spacing: .04em; color: var(--muted-on-paper); white-space: nowrap; display: none; }
.desktop-nav { display: flex; gap: 22px; margin-left: auto; }
.desktop-nav a { color: var(--muted-on-paper); font-size: .9rem; text-decoration: none; transition: color .15s; }
.desktop-nav a em { font-style: normal; font-family: var(--font-mono); color: var(--indigo-text); margin-right: 4px; }
.desktop-nav a:hover { color: var(--ink); }
.header-actions { display: flex; align-items: center; gap: 18px; }
.text-link { color: var(--muted-on-paper); font-size: .88rem; text-decoration: none; }
.text-link:hover { color: var(--ink); }
.button { display: inline-flex; align-items: center; justify-content: center; gap: 9px; min-height: 46px; padding: 0 20px; background: var(--ink); color: var(--paper); text-decoration: none; font-weight: 600; font-size: .92rem; border: 1px solid var(--ink); border-radius: 2px; transition: background-color .15s, color .15s, border-color .15s; }
.button:hover { background: var(--indigo-text); border-color: var(--indigo-text); color: #fff; }
.button-small { min-height: 40px; padding: 0 15px; font-size: .85rem; }
.button-ghost { background: transparent; color: var(--ink); border-color: var(--rule-on-paper); }
.button-ghost:hover { background: rgba(21, 20, 29, 0.06); border-color: var(--ink); color: var(--ink); }
.menu-button { display: none; margin-left: auto; width: 42px; height: 42px; border: 1px solid var(--rule-on-paper); background: none; color: var(--ink); font-size: 1.3rem; }
.mobile-nav { display: none; }

/* ---------- hero ---------- */
.hero { max-width: 1280px; margin: 0 auto; padding: 64px 24px 80px; position: relative; }
.hero-grid { display: grid; grid-template-columns: 1.15fr 0.7fr; gap: 56px; align-items: start; }
.kicker { font-family: var(--font-mono); font-size: .72rem; letter-spacing: .08em; text-transform: uppercase; color: var(--indigo-text); margin: 0 0 14px; }
.hero-lead h1 { font-family: var(--font-display); font-size: clamp(2.6rem, 5.2vw, 4.4rem); line-height: 1.04; font-weight: 600; margin: 0 0 22px; letter-spacing: -.01em; }
.hero-lead h1 em { font-style: italic; color: var(--indigo-text); }
.hero-dek { max-width: 46ch; font-size: 1.1rem; line-height: 1.6; color: var(--muted-on-paper); margin: 0 0 30px; }
.hero-actions { display: flex; gap: 14px; flex-wrap: wrap; }
.contents { margin-top: 8px; border-top: 1px solid var(--rule-on-paper); padding-top: 18px; }
.contents-label { font-family: var(--font-mono); font-size: .72rem; letter-spacing: .08em; text-transform: uppercase; color: var(--muted-on-paper); margin: 0 0 12px; }
.contents ol { list-style: none; margin: 0; padding: 0; }
.contents li + li { border-top: 1px solid var(--rule-on-paper); }
.contents a { display: flex; gap: 14px; align-items: baseline; padding: 14px 0; text-decoration: none; color: var(--ink); }
.contents-index { font-family: var(--font-mono); color: var(--indigo-text); font-size: .85rem; flex-shrink: 0; }
.contents-title { font-weight: 600; }
.contents-title small { display: block; font-weight: 400; font-family: var(--font-body); color: var(--muted-on-paper); font-size: .82rem; margin-top: 3px; }
.contents a:hover .contents-title, .contents a:focus-visible .contents-title { text-decoration: underline; text-decoration-color: var(--violet); text-underline-offset: 4px; }
.hero-mark { display: block; margin: 56px auto 0; opacity: .9; }
.hero-mark-path { stroke-dasharray: 220; stroke-dashoffset: 0; }

/* ---------- dividers ---------- */
.divider { max-width: 1280px; margin: 0 auto; padding: 0 24px; }
.divider svg { display: block; width: 100%; height: 24px; }

/* ---------- chapters ---------- */
.chapter { padding: 84px 24px; }
.chapter-dark { background: var(--ink); color: var(--paper); }
.chapter-light { background: var(--paper); color: var(--ink); }
.chapter-dark .kicker, .chapter-dark p, .chapter-dark dt { color: inherit; }
.chapter-dark .muted, .chapter-dark p { color: var(--muted-on-ink); }
.chapter-dark .kicker { color: var(--violet-text); }
.chapter-head { max-width: 1280px; margin: 0 auto; padding-bottom: 40px; border-bottom: 1px solid var(--rule-on-paper); }
.chapter-dark .chapter-head { border-bottom-color: var(--rule-on-ink); }
.chapter-head h2 { font-family: var(--font-display); font-size: clamp(1.9rem, 3.4vw, 2.7rem); font-weight: 600; margin: 0; max-width: 18ch; }
.chapter-body { max-width: 1280px; margin: 0 auto; padding-top: 48px; display: grid; grid-template-columns: 1.1fr 0.9fr; gap: 60px; align-items: start; }
.chapter-body-reverse { grid-template-columns: 0.9fr 1.1fr; }
.chapter-body-reverse .publish-mockup, .chapter-body-reverse .phone { order: -1; }
.chapter-copy p { font-size: 1.05rem; line-height: 1.7; margin: 0 0 20px; max-width: 56ch; }
.chapter-dark .chapter-copy p { color: var(--muted-on-ink); }
.chapter-copy code { font-family: var(--font-mono); background: var(--rule-on-paper); padding: .1em .35em; border-radius: 2px; font-size: .92em; }
.chapter-dark .chapter-copy code { background: var(--rule-on-ink); color: var(--violet-text); }
.pull-quote { font-family: var(--font-display); font-style: italic; font-size: 1.35rem; line-height: 1.5; margin: 28px 0; padding-left: 22px; border-left: 3px solid var(--violet); max-width: 40ch; }
.footnotes { margin: 32px 0 0; display: grid; gap: 18px; border-top: 1px solid var(--rule-on-paper); padding-top: 24px; }
.chapter-dark .footnotes { border-top-color: var(--rule-on-ink); }
.footnotes dt { font-family: var(--font-mono); font-size: .8rem; letter-spacing: .03em; text-transform: uppercase; color: var(--indigo-text); margin-bottom: 4px; }
.chapter-dark .footnotes dt { color: var(--violet-text); }
.footnotes dd { margin: 0; font-size: .95rem; color: var(--muted-on-paper); max-width: 48ch; }
.chapter-dark .footnotes dd { color: var(--muted-on-ink); }
.inline-link { display: inline-flex; gap: 8px; color: inherit; font-weight: 600; text-decoration: underline; text-decoration-color: var(--violet); text-underline-offset: 4px; }

/* ---------- studio mockup ---------- */
.studio-mockup { border: 1px solid var(--rule-on-ink); border-radius: 4px; overflow: hidden; background: var(--ink-soft); }
.mockup-bar { display: flex; align-items: center; justify-content: space-between; padding: 12px 16px; border-bottom: 1px solid var(--rule-on-ink); }
.mockup-label { font-family: var(--font-mono); font-size: .8rem; color: var(--muted-on-ink); }
.status-pill { font-family: var(--font-mono); font-size: .72rem; padding: 4px 10px; border: 1px solid var(--violet); color: var(--violet-text); border-radius: 20px; }
.mockup-body { display: grid; grid-template-columns: 130px 1fr; }
.mockup-rail { list-style: none; margin: 0; padding: 16px 0; border-right: 1px solid var(--rule-on-ink); }
.mockup-rail li { padding: 9px 16px; font-size: .85rem; color: var(--muted-on-ink); }
.mockup-rail li.active { color: var(--paper); border-left: 2px solid var(--violet); background: rgba(139, 92, 246, 0.1); }
.mockup-doc { padding: 22px; }
.mockup-meta { font-family: var(--font-mono); font-size: .7rem; letter-spacing: .04em; color: var(--muted-on-ink); margin: 0 0 10px; }
.mockup-doc h3 { font-family: var(--font-display); font-size: 1.4rem; margin: 0 0 12px; }
.mockup-doc p { color: var(--muted-on-ink); font-size: .92rem; line-height: 1.6; margin: 0 0 16px; max-width: 42ch; }
.mockup-tags { display: flex; gap: 8px; flex-wrap: wrap; }
.mockup-tags span { font-size: .76rem; border: 1px solid var(--rule-on-ink); border-radius: 20px; padding: 4px 10px; color: var(--muted-on-ink); }

/* ---------- publish mockup ---------- */
.publish-mockup { border: 1px solid var(--rule-on-paper); border-radius: 4px; overflow: hidden; background: #fff; }
.url-bar { display: flex; align-items: center; gap: 2px; padding: 12px 16px; border-bottom: 1px solid var(--rule-on-paper); font-family: var(--font-mono); font-size: .82rem; color: var(--muted-on-paper); }
.url-bar strong { color: var(--indigo-text); font-weight: 700; }
.publish-list { list-style: none; margin: 0; padding: 8px 0; }
.publish-list li { display: flex; gap: 14px; padding: 14px 20px; border-top: 1px solid var(--rule-on-paper); font-size: .95rem; }
.publish-list li:first-child { border-top: none; }
.publish-index { font-family: var(--font-mono); color: var(--indigo-text); font-size: .82rem; }

/* ---------- applications mockup ---------- */
.applications-mockup { display: grid; gap: 18px; }
.resume-sheet { background: var(--ink-soft); border: 1px solid var(--rule-on-ink); border-radius: 4px; padding: 22px; }
.resume-sheet h3 { font-family: var(--font-display); font-size: 1.3rem; margin: 6px 0 8px; }
.resume-role { font-size: .88rem; color: var(--muted-on-ink); margin: 0 0 16px; }
.resume-block { display: flex; flex-direction: column; gap: 6px; padding-top: 14px; border-top: 1px solid var(--rule-on-ink); }
.resume-block b { font-family: var(--font-mono); font-size: .72rem; letter-spacing: .04em; color: var(--violet-text); }
.resume-block span { font-size: .88rem; color: var(--muted-on-ink); }
.kanban { background: var(--ink-soft); border: 1px solid var(--rule-on-ink); border-radius: 4px; padding: 18px; }
.kanban-top { font-family: var(--font-mono); font-size: .8rem; color: var(--muted-on-ink); margin-bottom: 14px; }
.kanban-columns { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
.kanban-columns small { display: block; font-family: var(--font-mono); font-size: .68rem; letter-spacing: .04em; color: var(--muted-on-ink); margin-bottom: 8px; }
.kanban-columns p { font-size: .82rem; background: rgba(246, 242, 234, 0.06); border: 1px solid var(--rule-on-ink); border-radius: 3px; padding: 10px; margin: 0; line-height: 1.4; }
.accent-card { border-color: var(--indigo) !important; }
.accent-card i { color: var(--violet-text); font-style: normal; font-size: .74rem; }
.accent-card-2 { border-color: var(--violet) !important; }

/* ---------- phone ---------- */
.phone { width: 240px; border: 8px solid var(--ink); border-radius: 30px; background: var(--ink); position: relative; margin: 0 auto; }
.phone-notch { width: 70px; height: 16px; background: var(--ink); border-radius: 0 0 10px 10px; margin: 0 auto; }
.phone-screen { background: var(--paper); border-radius: 20px; padding: 20px 16px; min-height: 300px; }
.phone-screen h3 { font-family: var(--font-display); font-size: 1.15rem; margin: 4px 0 16px; }
.phone-project { border-top: 1px solid var(--rule-on-paper); padding: 12px 0; display: grid; grid-template-columns: 20px 1fr; gap: 4px 10px; }
.phone-project span { font-family: var(--font-mono); font-size: .72rem; color: var(--indigo-text); }
.phone-project strong { font-size: .9rem; }
.phone-project i { grid-column: 2; font-style: normal; font-size: .76rem; color: var(--muted-on-paper); }

/* ---------- epilogue ---------- */
.epilogue { max-width: 720px; margin: 0 auto; padding: 100px 24px; text-align: left; border-top: 1px solid var(--rule-on-paper); }
.epilogue h2 { font-family: var(--font-display); font-size: clamp(2rem, 4vw, 2.9rem); font-weight: 600; margin: 0 0 18px; }
.epilogue p { font-size: 1.05rem; color: var(--muted-on-paper); margin: 0 0 30px; max-width: 48ch; }

/* ---------- footer ---------- */
footer { max-width: 1280px; margin: 0 auto; padding: 40px 24px 56px; border-top: 1px solid var(--rule-on-paper); display: flex; flex-wrap: wrap; gap: 16px 32px; align-items: center; }
.footer-brand { display: flex; flex-direction: column; gap: 6px; }
.footer-brand p { margin: 0; font-size: .85rem; color: var(--muted-on-paper); }
.colophon { margin: 0 auto 0 0; font-family: var(--font-mono); font-size: .78rem; color: var(--muted-on-paper); }
footer > a { color: var(--muted-on-paper); font-size: .88rem; text-decoration: none; }
footer > a:hover { color: var(--ink); }

/* ---------- motion ---------- */
@media (prefers-reduced-motion: no-preference) {
  .hero-mark-path { stroke-dasharray: 220; stroke-dashoffset: 220; animation: draw-mark 1.4s ease forwards .2s; }
  .contents a { transition: transform .15s; }
  .contents a:hover, .contents a:focus-visible { transform: translateX(4px); }
}
@keyframes draw-mark { to { stroke-dashoffset: 0; } }

/* ---------- responsive ---------- */
@media (max-width: 900px) {
  .hero-grid, .chapter-body, .chapter-body-reverse { grid-template-columns: 1fr; }
  .chapter-body-reverse .publish-mockup, .chapter-body-reverse .phone { order: 0; }
  .masthead-tag { display: none; }
  .kanban-columns { grid-template-columns: 1fr; }
}
@media (max-width: 720px) {
  .desktop-nav, .header-actions { display: none; }
  .menu-button { display: block; }
  .mobile-nav { display: flex; flex-direction: column; gap: 4px; padding: 12px 0 20px; }
  .mobile-nav a, .mobile-nav :deep(a) { color: var(--ink); text-decoration: none; padding: 10px 4px; border-top: 1px solid var(--rule-on-paper); font-size: .95rem; }
  .mockup-body { grid-template-columns: 1fr; }
  .mockup-rail { display: none; }
}
@media (max-width: 480px) {
  .hero-actions { flex-direction: column; align-items: stretch; }
  .phone { width: 100%; max-width: 280px; }
}
</style>
