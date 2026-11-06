// Pure onboarding orchestration, kept free of Vue/Pinia imports so it can be
// unit-tested with `node --test`. The view injects the real stores.
//
// Guarantees:
//  - the first project is created at most once (its returned id is reused across
//    Back/Next and retries; later edits update that same project)
//  - each site step (subdomain, site config, publish) runs at most once
//    successfully; a retry resumes at the first failed step
//  - onboarding is only marked complete after every requested step succeeded

export interface OnboardingProjectInput {
  name: string
  description: string
}

export interface OnboardingSiteInput {
  wantsSite: boolean
  subdomain: string
  siteName: string
  primaryColor: string
  secondaryColor: string
}

export interface OnboardingDeps {
  createProject(data: { name: string; description?: string }): Promise<{ id: string }>
  updateProject(id: string, data: { name?: string; description?: string; subdomain?: string }): Promise<unknown>
  updateSiteConfig(id: string, data: { siteName?: string; primaryColor?: string; secondaryColor?: string }): Promise<unknown>
  publishProject(id: string, isPublished: boolean): Promise<unknown>
  completeOnboarding(): Promise<unknown>
}

export type OnboardingStage = 'project' | 'subdomain' | 'siteConfig' | 'publish' | 'complete'

export class OnboardingStepError extends Error {
  stage: OnboardingStage
  constructor(stage: OnboardingStage, message: string) {
    super(message)
    this.name = 'OnboardingStepError'
    this.stage = stage
  }
}

const STAGE_FALLBACK: Record<OnboardingStage, string> = {
  project: 'We could not create your project. Please try again.',
  subdomain: 'We could not reserve that subdomain. Choose another one or try again.',
  siteConfig: 'We could not save your site settings. Please try again.',
  publish: 'We could not publish your site. Please try again.',
  complete: 'We could not finish setting up your account. Please try again.'
}

export function errorMessage(error: any, stage: OnboardingStage): string {
  const server = error?.response?.data?.message
  if (typeof server === 'string' && server.trim()) return server
  return STAGE_FALLBACK[stage]
}

export const SUBDOMAIN_RE = /^[a-z0-9-]{3,50}$/

export function createOnboardingFlow(deps: OnboardingDeps) {
  let projectId: string | null = null
  let savedProject: OnboardingProjectInput | null = null
  let siteSteps = { subdomain: false, siteConfig: false, publish: false }
  let lastSubdomain: string | null = null
  let savedConfig: { siteName: string; primaryColor: string; secondaryColor: string } | null = null
  let creating: Promise<string> | null = null

  async function run<T>(stage: OnboardingStage, fn: () => Promise<T>): Promise<T> {
    try {
      return await fn()
    } catch (error) {
      throw new OnboardingStepError(stage, errorMessage(error, stage))
    }
  }

  /** Create the project once; later calls update it only if the form changed. */
  async function ensureProject(input: OnboardingProjectInput): Promise<string> {
    if (creating) return creating
    if (projectId) {
      if (savedProject && (savedProject.name !== input.name || savedProject.description !== input.description)) {
        const id = projectId
        await run('project', () => deps.updateProject(id, { name: input.name, description: input.description }))
        savedProject = { ...input }
      }
      return projectId
    }
    creating = run('project', async () => {
      const created = await deps.createProject({ name: input.name, description: input.description })
      if (!created || !created.id) throw new Error('Project was created without an id')
      projectId = created.id
      savedProject = { ...input }
      return created.id
    }).finally(() => {
      creating = null
    })
    return creating
  }

  /** Runs remaining site steps then marks onboarding complete. Throws OnboardingStepError. */
  async function finish(project: OnboardingProjectInput, site: OnboardingSiteInput): Promise<string> {
    const id = await ensureProject(project)

    if (site.wantsSite) {
      const subdomain = site.subdomain.trim()
      if (!SUBDOMAIN_RE.test(subdomain)) {
        throw new OnboardingStepError('subdomain', 'Subdomain must be 3-50 characters: lowercase letters, numbers, and hyphens only.')
      }
      if (lastSubdomain !== null && lastSubdomain !== subdomain) {
        // subdomain changed after a partial run: redo everything from the subdomain on
        siteSteps = { subdomain: false, siteConfig: false, publish: false }
        savedConfig = null
      }
      const config = { siteName: site.siteName, primaryColor: site.primaryColor, secondaryColor: site.secondaryColor }
      if (
        siteSteps.siteConfig &&
        (!savedConfig ||
          savedConfig.siteName !== config.siteName ||
          savedConfig.primaryColor !== config.primaryColor ||
          savedConfig.secondaryColor !== config.secondaryColor)
      ) {
        // site settings edited after a partial run: re-save them and re-publish
        siteSteps.siteConfig = false
        siteSteps.publish = false
      }
      if (!siteSteps.subdomain) {
        await run('subdomain', () => deps.updateProject(id, { subdomain }))
        siteSteps.subdomain = true
        lastSubdomain = subdomain
      }
      if (!siteSteps.siteConfig) {
        await run('siteConfig', () => deps.updateSiteConfig(id, { ...config }))
        savedConfig = { ...config }
        siteSteps.siteConfig = true
      }
      if (!siteSteps.publish) {
        await run('publish', () => deps.publishProject(id, true))
        siteSteps.publish = true
      }
    }

    await run('complete', () => deps.completeOnboarding())
    return id
  }

  return {
    ensureProject,
    finish,
    get projectId() {
      return projectId
    }
  }
}
