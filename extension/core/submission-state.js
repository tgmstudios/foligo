/**
 * SubmissionState — a short-lived handoff from the user clicking a final
 * application button to a same-tab confirmation page.
 *
 * A content script is replaced during a full-page confirmation navigation.
 * This tiny serializable marker lets the new script promote the pre-existing
 * Foligo card only after it independently observes a success state.
 */
const SubmissionState = (() => {
  const RECOVERY_WINDOW_MS = 15 * 60 * 1000;

  function clean(value) {
    return typeof value === 'string' ? value.trim() : value;
  }

  function create(jobInfo = {}, submittedAt = Date.now()) {
    return {
      jobInfo: {
        canonicalUrl: clean(jobInfo.canonicalUrl),
        company: clean(jobInfo.company),
        jobTitle: clean(jobInfo.jobTitle || jobInfo.position),
        identityKey: clean(jobInfo.identityKey),
      },
      submittedAt,
    };
  }

  function isRecoverable(pending, now = Date.now()) {
    return Boolean(
      pending
      && pending.jobInfo
      && Number.isFinite(pending.submittedAt)
      && now >= pending.submittedAt
      && now - pending.submittedAt <= RECOVERY_WINDOW_MS,
    );
  }

  function shouldPromote(pending, confirmationVisible, now = Date.now()) {
    return Boolean(confirmationVisible && isRecoverable(pending, now));
  }

  return { RECOVERY_WINDOW_MS, create, isRecoverable, shouldPromote };
})();
