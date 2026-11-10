export function createCheckoutAttemptStore(createId = () => crypto.randomUUID()) {
  const attempts = new Map()
  return {
    get(planKey) {
      if (!attempts.has(planKey)) attempts.set(planKey, createId())
      return attempts.get(planKey)
    },
    clear(planKey) {
      attempts.delete(planKey)
    },
  }
}
