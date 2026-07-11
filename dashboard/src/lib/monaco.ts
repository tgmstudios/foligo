/**
 * Shared Monaco setup — the single place that configures @monaco-editor/loader.
 *
 * @monaco-editor/loader keeps one process-wide singleton: whichever component
 * calls loader.init() first "wins" its config for the entire app session, and
 * every later loader.config() call from a different component is silently
 * ignored. So every component that uses Monaco must import it from here
 * instead of configuring the loader itself, or two components disagreeing on
 * CDN-vs-bundled config will race and one will lose.
 */
import * as monaco from 'monaco-editor'
import loader from '@monaco-editor/loader'
import EditorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker'

if (!(self as any).MonacoEnvironment) {
  (self as any).MonacoEnvironment = {
    getWorker() {
      return new EditorWorker()
    }
  }
}

// Use the bundled npm package instead of fetching Monaco's AMD loader and
// language plugins from a CDN at runtime.
loader.config({ monaco })

export { monaco, loader }
