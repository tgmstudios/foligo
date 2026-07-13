(async () => {
  const statusEl = document.getElementById('status');
  const params = new URLSearchParams(location.search);
  const kind = params.get('kind') === 'coverLetter' ? 'coverLetter' : 'resume';
  const label = kind === 'resume' ? 'resume' : 'cover letter';

  try {
    const profile = await Filler.loadProfile();
    const file = await Filler.loadDocumentFile(kind, profile);
    if (!file) {
      statusEl.textContent = `No default ${label} found in Foligo. Set one as default in Resume Studio, then try again.`;
      return;
    }
    document.title = file.name;
    const blobUrl = URL.createObjectURL(file);
    const iframe = document.createElement('iframe');
    iframe.src = blobUrl;
    document.body.innerHTML = '';
    document.body.appendChild(iframe);
  } catch (e) {
    statusEl.textContent = `Preview failed: ${e.message}`;
  }
})();
