let sequence = 0;
let queue = Promise.resolve();
let engine;
const copyConfig = (value) =>
  Array.isArray(value)
    ? value.map(copyConfig)
    : value && typeof value === "object"
      ? Object.fromEntries(
          Object.entries(value).map(([k, v]) => [k, copyConfig(v)]),
        )
      : value;
export function renderSiteDiagram(source) {
  const task = async () => {
    engine ||= import("mermaid").then((m) => m.default);
    const mermaid = await engine;
    const previous = copyConfig(mermaid.mermaidAPI.getConfig());
    const id = `site-mermaid-${++sequence}`;
    try {
      mermaid.initialize({
        startOnLoad: false,
        securityLevel: "strict",
        suppressErrorRendering: true,
        theme: "neutral",
        flowchart: { htmlLabels: false },
        maxTextSize: 50000,
        maxEdges: 500,
      });
      return await mermaid.render(id, source);
    } finally {
      document.getElementById(id)?.remove();
      document.getElementById(`d${id}`)?.remove();
      mermaid.initialize(previous);
    }
  };
  const result = queue.then(task, task);
  queue = result.catch(() => {});
  return result;
}
