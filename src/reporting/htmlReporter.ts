import type { AuditResult, NodeFinding } from '../models/auditResult.js';
export function escapeHtml(value: string): string {
  return value.replace(
    /[&<>"']/g,
    (char) =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[
        char
      ]!,
  );
}
function link(url: string, label: string): string {
  try {
    if (!['https:', 'http:'].includes(new URL(url).protocol))
      return escapeHtml(label);
    return `<a href="${escapeHtml(url)}" rel="noreferrer">${escapeHtml(label)}</a>`;
  } catch {
    return escapeHtml(label);
  }
}
function nodesHtml(nodes: NodeFinding[]): string {
  return nodes
    .map(
      (node) =>
        `<li><p>${link(node.pageUrl, node.pageUrl)}</p><p><strong>Selector:</strong> <code>${escapeHtml(JSON.stringify(node.target))}</code></p><pre><code>${escapeHtml(node.html)}</code></pre><p>${escapeHtml(node.failureSummary ?? 'Review the rule guidance and this element manually.')}</p></li>`,
    )
    .join('');
}
export function htmlReport(result: AuditResult): string {
  const e = escapeHtml;
  const s = result.summary;
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; base-uri 'none'; form-action 'none'">
<title>Accessibility Audit Report</title><style>
:root{color-scheme:light;--ink:#182c3d;--muted:#495d6c;--line:#c7d6df;--accent:#00645e}*{box-sizing:border-box}body{margin:0;background:#f1f5f7;color:var(--ink);font:16px/1.6 system-ui,sans-serif}main,header,footer{max-width:1120px;margin:auto;padding:32px 24px}header{padding-top:48px}h1{font-size:clamp(2rem,5vw,3rem);line-height:1.15;margin:12px 0}h2{line-height:1.3}a{color:#005c83;text-underline-offset:3px;overflow-wrap:anywhere}a:focus-visible,summary:focus-visible{outline:3px solid #8a3f00;outline-offset:4px}.eyebrow{text-transform:uppercase;letter-spacing:.15em;font-weight:750;color:var(--accent)}.muted{color:var(--muted)}.notice{border-left:4px solid var(--accent);padding:12px 20px;background:#e1efec}.cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:16px}.card,article,.panel{background:white;border:1px solid var(--line);border-radius:10px;padding:24px;margin-bottom:20px}.number{display:block;font-size:2rem;font-weight:750}.badge{display:inline-block;border-radius:4px;padding:3px 10px;background:#e8edf1;font-weight:700}.critical,.serious,.failed{background:#ffe7e6;color:#88221b}.moderate,.incomplete{background:#fff0d3;color:#754900}.passed{background:#dff2e6;color:#175330}dt{font-weight:700}dd{margin:0 0 12px;overflow-wrap:anywhere}pre{white-space:pre-wrap;overflow-wrap:anywhere;padding:16px;background:#edf2f5;border-radius:6px}code{overflow-wrap:anywhere}summary{cursor:pointer;font-weight:700;padding:12px 0}li{margin-bottom:12px}.nodes{padding-left:24px}.nodes>li{border-top:1px solid var(--line);padding-top:12px}table{border-collapse:collapse;width:100%}th,td{text-align:left;border-bottom:1px solid var(--line);padding:10px;overflow-wrap:anywhere}.table-wrap{overflow:auto}footer{color:var(--muted);font-size:.9rem}@media print{body{background:white}article{break-inside:avoid}details>*{display:block}header,main,footer{padding:12px}}
</style></head><body><header><span class="eyebrow">Accessibility Audit CLI · v${e(result.metadata.version)}</span><h1>Accessibility Audit Report</h1><p>${link(result.targetUrl, result.targetUrl)}</p><p class="muted">${e(result.startTime)} · ${Math.round(result.durationMs / 1000)} seconds · ${e(result.options.standard)} / ${e(result.options.level)}</p><p class="notice">${e(result.metadata.disclaimer)}</p></header>
<main><section aria-labelledby="summary"><h2 id="summary">Audit summary</h2><div class="cards"><div class="card"><span class="number">${result.pagesScanned}</span>Pages scanned / ${result.pagesAttempted} attempted</div><div class="card"><span class="number">${s.totalIssues}</span>Unique rule findings</div><div class="card"><span class="number">${s.totalOccurrences}</span>Element occurrences</div><div class="card"><span class="number">${s.affectedPages}</span>Affected pages</div></div><div class="panel"><p>Quality gate: <strong class="badge ${s.qualityGate}">${s.qualityGate.toUpperCase()}</strong> · Threshold: ${e(result.options.failOn)}</p><p>${Object.entries(
    s.severity,
  )
    .map(
      ([impact, count]) =>
        `<span class="badge ${impact}">${impact}: ${count}</span>`,
    )
    .join(
      ' ',
    )}</p><p>Severity counts represent unique rules. ${s.manualReviewRules} page/rule results require manual review. A passed gate does not establish conformance.</p></div></section>
<section aria-labelledby="findings"><h2 id="findings">Accessibility findings</h2>${result.issues.length ? result.issues.map((issue, index) => `<article><span class="badge ${issue.impact}">${e(issue.impact)}</span><h3>${index + 1}. ${e(issue.title)}</h3><p>${e(issue.description)}</p><dl><dt>Rule</dt><dd><code>${e(issue.ruleId)}</code></dd><dt>Scope</dt><dd>${issue.occurrenceCount} occurrences across ${issue.affectedPages.length} pages</dd><dt>WCAG criteria / principles</dt><dd>${e(issue.wcagCriteria.map((criterion) => `${criterion.criterion} (${criterion.principle})`).join(', ') || 'Unknown')}</dd><dt>WCAG version and level tags</dt><dd>${e(issue.conformanceTags.join(', ') || 'Unknown')}</dd><dt>All axe tags</dt><dd>${e(issue.tags.join(', '))}</dd></dl><p>${link(issue.helpUrl, 'Remediation guidance')}</p><details><summary>Affected pages (${issue.affectedPages.length})</summary><ul>${issue.affectedPages.map((url) => `<li>${link(url, url)}</li>`).join('')}</ul></details><details><summary>Inspect affected elements (${issue.nodes.length})</summary><ol class="nodes">${nodesHtml(issue.nodes)}</ol></details></article>`).join('') : '<p>No automated violations were found on the successfully scanned pages.</p>'}</section>
<section aria-labelledby="review"><h2 id="review">Manual review results</h2><p>These axe results were inconclusive and are excluded from violation counts and the severity gate.</p>${result.pages.flatMap((page) => page.incomplete.map((rule) => `<article><h3>${e(rule.help)}</h3><p>${link(page.url, page.url)} · <code>${e(rule.id)}</code></p><p>${e(rule.description)}</p><p>${link(rule.helpUrl, 'Review guidance')}</p><details><summary>Review ${rule.nodes.length} elements</summary><ol class="nodes">${nodesHtml(rule.nodes.map((node) => ({ pageUrl: page.url, target: node.target, html: node.html, failureSummary: node.failureSummary ?? null })))}</ol></details></article>`)).join('') || '<p>No inconclusive axe results.</p>'}</section>
<section aria-labelledby="errors"><h2 id="errors">Scan errors (${result.scanErrors.length})</h2>${result.scanErrors.length ? `<ul>${result.scanErrors.map((error) => `<li>${link(error.url, error.url)}: ${e(error.message)}</li>`).join('')}</ul>` : '<p>No page scan errors.</p>'}</section>
<section aria-labelledby="pages"><h2 id="pages">Scanned pages</h2><div class="table-wrap"><table><caption>Successful page scans and failed network resources</caption><thead><tr><th scope="col">Page</th><th scope="col">Rule findings</th><th scope="col">Failed resources</th></tr></thead><tbody>${result.pages.map((page) => `<tr><td>${link(page.url, page.title || page.url)}</td><td>${page.violations.length}</td><td>${page.failedResourceCount}</td></tr>`).join('')}</tbody></table></div></section></main><footer>Report schema ${result.schemaVersion}. Reports may contain sensitive URLs and page HTML. Share with care.</footer></body></html>`;
}
