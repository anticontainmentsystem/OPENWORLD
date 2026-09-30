<script lang="ts">
	/**
	 * Shows GitHub-rendered README HTML inside a sandboxed frame with no scripts and
	 * no access to OpenWorld, so repo content can never run code on the site.
	 */
	let { html, base }: { html: string; base: string } = $props();
	const doc = $derived(`<!doctype html><html><head><meta charset="utf-8"><base href="${base.replace(/"/g, '')}" target="_blank">
<style>
body{margin:0;padding:16px;background:#141412;color:#e8e6e0;font:15px/1.6 system-ui,-apple-system,'Segoe UI',sans-serif}
a{color:#c4885c}img{max-width:100%}pre,code{font-family:ui-monospace,Consolas,monospace;font-size:.88em}
pre{background:#0c0c0a;padding:12px;overflow:auto;border-radius:3px}table{border-collapse:collapse}td,th{border:1px solid #2a2a24;padding:4px 8px}
h1,h2{border-bottom:1px solid #2a2a24;padding-bottom:.3em}.anchor,.octicon{display:none}
</style></head><body>${html}</body></html>`);
</script>

<iframe title="README" srcdoc={doc} sandbox="allow-popups allow-popups-to-escape-sandbox" referrerpolicy="no-referrer"></iframe>

<style>
	iframe { width: 100%; height: 70vh; border: 1px solid var(--border); border-radius: var(--radius); background: var(--surface); }
</style>
