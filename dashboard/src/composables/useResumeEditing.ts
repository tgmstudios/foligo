import { ref } from 'vue'

export type ResumeData = {
  summary: string
  education: Array<{
    institution: string
    degree: string
    details: string
    date: string
    enabled: boolean
  }>
  experience: Array<{
    company: string
    location: string
    description: string
    roles: Array<{
      title: string
      dateRange: string
      bullets: string[]
      enabled: boolean
    }>
    enabled: boolean
  }>
  projects: Array<{
    title: string
    bullets: string[]
    enabled: boolean
  }>
  proficiencies: Array<{
    category: string
    skills: string[]
    enabled: boolean
  }>
  honors: string[]
}

export function useResumeEditing() {
  const editedResumeData = ref<ResumeData>({
    summary: '',
    education: [],
    experience: [],
    projects: [],
    proficiencies: [],
    honors: []
  })

  // Education helpers
  const addEducation = () => {
    editedResumeData.value.education.push({
      institution: '',
      degree: '',
      details: '',
      date: '',
      enabled: true
    })
  }

  const removeEducation = (index: number) => {
    editedResumeData.value.education.splice(index, 1)
  }

  // Experience helpers
  const addExperience = () => {
    editedResumeData.value.experience.push({
      company: '',
      location: '',
      description: '',
      roles: [],
      enabled: true
    })
  }

  const removeExperience = (index: number) => {
    editedResumeData.value.experience.splice(index, 1)
  }

  const addRole = (expIndex: number) => {
    if (!editedResumeData.value.experience[expIndex].roles) {
      editedResumeData.value.experience[expIndex].roles = []
    }
    editedResumeData.value.experience[expIndex].roles.push({
      title: '',
      dateRange: '',
      bullets: [],
      enabled: true
    })
  }

  const removeRole = (expIndex: number, roleIndex: number) => {
    editedResumeData.value.experience[expIndex].roles.splice(roleIndex, 1)
  }

  const addBullet = (expIndex: number, roleIndex: number) => {
    if (!editedResumeData.value.experience[expIndex].roles[roleIndex].bullets) {
      editedResumeData.value.experience[expIndex].roles[roleIndex].bullets = []
    }
    editedResumeData.value.experience[expIndex].roles[roleIndex].bullets.push('')
  }

  const removeBullet = (expIndex: number, roleIndex: number, bulletIndex: number) => {
    editedResumeData.value.experience[expIndex].roles[roleIndex].bullets.splice(bulletIndex, 1)
  }

  // Project helpers
  const addProject = () => {
    editedResumeData.value.projects.push({
      title: '',
      bullets: [],
      enabled: true
    })
  }

  const removeProject = (index: number) => {
    editedResumeData.value.projects.splice(index, 1)
  }

  const addProjectBullet = (index: number) => {
    if (!editedResumeData.value.projects[index].bullets) {
      editedResumeData.value.projects[index].bullets = []
    }
    editedResumeData.value.projects[index].bullets.push('')
  }

  const removeProjectBullet = (index: number, bulletIndex: number) => {
    editedResumeData.value.projects[index].bullets.splice(bulletIndex, 1)
  }

  // Proficiencies helpers
  const addProficiencyCategory = () => {
    editedResumeData.value.proficiencies.push({
      category: 'New Category',
      skills: [],
      enabled: true
    })
  }

  const removeProficiencyCategory = (index: number) => {
    editedResumeData.value.proficiencies.splice(index, 1)
  }

  const addSkill = (profIndex: number) => {
    if (!editedResumeData.value.proficiencies[profIndex].skills) {
      editedResumeData.value.proficiencies[profIndex].skills = []
    }
    editedResumeData.value.proficiencies[profIndex].skills.push('')
  }

  const removeSkill = (profIndex: number, skillIndex: number) => {
    editedResumeData.value.proficiencies[profIndex].skills.splice(skillIndex, 1)
  }

  // Honors helpers
  const addHonor = () => {
    editedResumeData.value.honors.push('')
  }

  const removeHonor = (index: number) => {
    editedResumeData.value.honors.splice(index, 1)
  }

  const prepareRenderData = () => {
    return {
      summary: editedResumeData.value.summary,
      education: editedResumeData.value.education.filter(e => e.enabled).map(e => ({
        institution: e.institution,
        degree: e.degree,
        details: e.details,
        date: e.date
      })),
      experience: editedResumeData.value.experience.filter(e => e.enabled).map(exp => ({
        company: exp.company,
        location: exp.location,
        description: exp.description,
        roles: exp.roles.filter(r => r.enabled).map(role => ({
          title: role.title,
          dateRange: role.dateRange,
          bullets: role.bullets
        }))
      })),
      projects: editedResumeData.value.projects.filter(p => p.enabled).map(p => ({
        title: p.title,
        bullets: p.bullets
      })),
      proficiencies: editedResumeData.value.proficiencies.filter(p => p.enabled).map(p => ({
        category: p.category,
        skills: p.skills
      })),
      honors: editedResumeData.value.honors
    }
  }

  return {
    editedResumeData,
    addEducation,
    removeEducation,
    addExperience,
    removeExperience,
    addRole,
    removeRole,
    addBullet,
    removeBullet,
    addProject,
    removeProject,
    addProjectBullet,
    removeProjectBullet,
    addProficiencyCategory,
    removeProficiencyCategory,
    addSkill,
    removeSkill,
    addHonor,
    removeHonor,
    prepareRenderData
  }
}


