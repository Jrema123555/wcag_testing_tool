# Accessibility Audit CLI

A Playwright-powered accessibility auditing tool that crawls websites, detects automated accessibility issues using axe-core, maps findings to WCAG-related metadata, generates developer-friendly reports, and supports CI/CD accessibility quality gates.

Automatically detects accessibility issues associated with WCAG criteria and identifies areas that may require manual accessibility review. **Automated scanning does not prove full WCAG conformance.**

## Why this project exists

Accessibility checks often happen late, vary between teams, require repetitive manual work, and are difficult to integrate into CI. This standalone developer tool makes automated checks repeatable during development and delivery. It scans a supplied website; its own tests use a controlled local fixture.

Automated testing complements manual accessibility evaluation. A passing quality gate only means the selected automated checks found no violations at the configured severity threshold on the pages successfully scanned.

## Features

- Playwright-powered same-origin crawling with configurable page limits and include/exclude filters.
- axe-core analysis targeting WCAG 2.0, 2.1, or 2.2, at A, AA, or AAA where axe has applicable rules.
- Findings grouped by rule, severity summaries, affected pages, and element-level remediation evidence.
- WCAG criterion and principle metadata derived from axe tags.
- Console summaries, portable HTML reports, and versioned JSON reports.
- Separate inconclusive results for manual review and separate page scan errors.
- CI quality gates with explicit exit codes and severity thresholds.
- Strict TypeScript, unit tests, real-browser integration tests, and GitHub Actions.

## Architecture

```text
src/
  cli/             # Argument validation and executable entry point
  scanner/         # Browser lifecycle, page deadlines, audit orchestration
  crawler/         # Queue, URL normalization, link extraction, crawl policy
  accessibility/   # axe runner, WCAG tags, aggregation, quality gate
  reporting/       # Console, JSON, static HTML, report files
  models/          # Scan options and versioned audit types
  utils/           # Error sanitization and lightweight logging
  index.ts         # Library exports
tests/
  fixtures/        # Tiny local HTTP server with deliberate defects
  unit/            # Policy, options, mapping, aggregation, reports, gates
  integration/     # Real Chromium scanner, crawler, compiled CLI, HTML report
examples/
  local-audit.mjs   # Reproducible local audit without an external website
.github/workflows/ci.yml
```

The CLI validates configuration and calls the scanner. The scanner owns Chromium and its isolated browser context. A sequential breadth-first crawler opens one page at a time, runs axe, discovers links, and records failures without abandoning other queued pages. Aggregation groups confirmed violations by axe rule ID. Reporters consume the same typed `AuditResult`, keeping presentation separate from scanning and gating.

## Installation

Requires Node.js **22.12 or later** and npm. Clone this repository, then:

```sh
npm ci
npx playwright install chromium
npm run build
```

On Linux CI, install Chromium's system dependencies with `npx playwright install --with-deps chromium`.

The package is prepared for publishing, but this repository does not assert ownership or publication of the npm name. After publishing under an available name, the intended usage is:

```sh
npx accessibility-audit https://example.com
```

Browser binaries are a separate prerequisite. For a local installed command, run `npm link` after building, then use `accessibility-audit`.

## Quick start

```sh
npm install
npx playwright install chromium
npm run build
npm run audit -- https://example.com
```

Audit one page, or crawl selected sections:

```sh
node dist/cli/index.js https://example.com --max-pages 1
npm run audit -- https://example.com --max-pages 25 --include /products --exclude /products/admin --fail-on serious
```

For a reproducible local example:

```sh
npm run build
node examples/local-audit.mjs
```

The example intentionally produces violations and exits with code 1. Open `accessibility-reports/report.html` afterward.

## CLI options

| Option                     | Default                   | Behavior                                                               |
| -------------------------- | ------------------------- | ---------------------------------------------------------------------- |
| `<url>`                    | Required                  | Absolute HTTP(S) URL; embedded credentials rejected                    |
| `--max-pages <number>`     | `20`                      | Maximum page attempts, including failures                              |
| `--standard <standard>`    | `wcag22`                  | `wcag2`, `wcag21`, or `wcag22`                                         |
| `--level <level>`          | `AA`                      | `A`, `AA`, or `AAA`; cumulative lower levels                           |
| `--output <directory>`     | `./accessibility-reports` | Creates directory; replaces selected report files                      |
| `--format <format>`        | `all`                     | `html`, `json`, or `all`; console always enabled                       |
| `--fail-on <severity>`     | `serious`                 | `critical`, `serious`, `moderate`, `minor`, or `none`                  |
| `--timeout <milliseconds>` | `30000`                   | Deadline for each page's navigation, axe analysis, and link extraction |
| `--headless <boolean>`     | `true`                    | Literal `true` or `false`                                              |
| `--include <path>`         | None                      | Repeatable allowed path prefix                                         |
| `--exclude <path>`         | None                      | Repeatable excluded path prefix; takes precedence                      |
| `--ignore-https-errors`    | Off                       | Explicitly allow invalid TLS certificates                              |
| `--verbose`                | Off                       | Diagnostic error stack output with URL sanitization                    |
| `-h, --help`               | —                         | Usage information                                                      |
| `-V, --version`            | —                         | Package version                                                        |

Path filters match segment boundaries: `/products` includes `/products` and `/products/42`, but not `/products-old`. They are literal, case-sensitive path prefixes, not globs or regular expressions. The start URL bypasses include filters to allow discovery, but does not bypass exclusions or safety filters. Numeric options must be positive integers no greater than 2147483647.

## Example report

Illustrative output; actual counts and severity come from axe:

```text
Accessibility Audit
Target: https://example.com/
Pages scanned: 4 (4 attempted)

Accessibility findings (unique rules)
critical   2
serious    5
moderate   1
minor      0
unknown    0
Total issues: 8 | Occurrences: 21 | Affected pages: 4

Top recurring issues:
1. Images must have alternative text
   Severity: critical | Pages: 3 | Occurrences: 7

Quality gate: FAILED (threshold: serious)
Exit code: 1
```

## Crawling behavior

- Only the original origin (scheme, host, and port) is eligible. Cross-origin navigation and every HTTP redirect hop in the scanned page's main frame are blocked before the destination request proceeds. Chromium's Fetch protocol provides this guard because ordinary Playwright routing only intercepts the first request in a redirect chain. Subresources, embedded frames, and website-initiated popups may still contact external origins; this is not a network sandbox.
- The crawler extracts rendered anchor URLs after analysis. It does not click controls, submit forms, log in, or explore interactive states.
- Relative links resolve against the browser's document base. Fragments are removed; URL parsing normalizes host casing and default ports. Root URLs normalize to `/`.
- Non-root trailing slashes, query parameters, repeated query keys, and query order are preserved because they can identify distinct content. Redirect destinations are tracked to avoid duplicate reported pages.
- Common asset extensions, PDFs, download-marked links, unsupported protocols, and common logout/signout routes or query actions are skipped. This is a heuristic, not a guarantee that a URL is side-effect-free.
- Attempts, including failed or duplicate-destination redirect attempts, consume the page budget. The pending queue is bounded by the remaining budget. Crawling stops when the queue empties or the limit is reached; it does not promise exhaustive site coverage.
- Each page waits for `DOMContentLoaded` and an attached body. There are no fixed sleeps or `networkidle` waits. Late hydration, lazy-loaded content, or pages requiring application-specific readiness can need a future custom readiness hook.
- Navigation failures, HTTP errors, non-HTML responses, crashes, and deadlines are recorded separately. Failed resources are counted without automatically failing a successful page analysis.
- TLS validation is enabled by default. Service workers and downloads are disabled in the scan context. The viewport is 1280 × 720, using Chromium with a fresh unauthenticated context per audit.

V1 does not process robots.txt, sitemaps, or rate-limit headers and scans sequentially without a configurable delay. Choose a suitable page limit and only scan websites you are authorized to test.

## WCAG and axe

The engine selects cumulative WCAG version and level tags. WCAG 2.2 AA includes applicable A and AA tags from 2.0, 2.1, and 2.2. Only rules implemented by the installed axe version can run; selecting a target does not mean every criterion is tested. Best-practice-only rules are excluded by this WCAG tag selection.

Criterion tags such as `wcag111` and `wcag2411` become `1.1.1` and `2.4.11`. The first criterion digit identifies Perceivable, Operable, Understandable, or Robust. Version/level tags are preserved at rule level, rather than guessing a separate level for each criterion. Unrecognized metadata is left unknown.

The JSON includes axe's engine version, runner, environment, options, confirmed violations, and incomplete results. See the [Playwright accessibility guide](https://playwright.dev/docs/accessibility-testing) and [Deque axe API documentation](https://www.deque.com/axe/core-documentation/api-documentation/) for the underlying APIs and tag semantics.

## Accessibility testing limitations

Automated tooling cannot identify every accessibility issue. Manual evaluation may still be needed for:

- Keyboard-only workflows and focus management.
- Screen-reader usability and logical reading order.
- Meaningful alternative text, content clarity, and cognitive usability.
- Complex interactions and usability with assistive technologies.

Only the rendered state of discovered pages is scanned. Authentication, mobile viewports, hidden UI states, and non-linked routes are not covered automatically. Axe's inconclusive results require manual review and do not count as confirmed violations. Even zero violations and zero incomplete results do not establish full WCAG conformance.

## Reports

Console output summarizes unique rule findings by severity, element occurrences, affected pages, inconclusive result counts, scan errors, and the gate. URL credentials and query values are removed from console diagnostics to reduce accidental exposure.

`report.json` uses `schemaVersion: "1.0"` and contains configuration, timestamps, duration, page attempts, successfully scanned pages, scan errors, grouped issues, node selectors, HTML snippets, failure summaries, and useful axe metadata. Severity counts count grouped rules; occurrences count affected nodes. Unknown impacts remain visible but have no ordered severity and do not independently fail the threshold. Each grouped rule uses the highest observed impact.

`report.html` is a standalone report with embedded CSS, severity cards, WCAG tags, remediation links, and expandable node details. It also includes manual-review evidence, page errors, and failed-resource counts. Untrusted text is escaped, links are restricted to HTTP(S), and a Content Security Policy disables scripts and external resources. No server or frontend framework is required.

Existing selected report files are overwritten. Use a different `--output` directory for each audit to retain history or avoid stale files from a previous format. Reports can contain sensitive URLs, HTML, and visible content. They are not anonymized; do not commit them or publish them without review. File permissions are restricted when supported by the operating system.

## CI/CD

This repository's CI uses local fixtures, never public websites. In a consumer project with this CLI installed as a development dependency and committed to its lockfile:

```yaml
steps:
  - uses: actions/checkout@v4
  - uses: actions/setup-node@v4
    with:
      node-version: 24
      cache: npm
  - run: npm ci
  - run: npx playwright install --with-deps chromium
  - run: npx accessibility-audit https://your-authorized-staging.example --fail-on serious
  - uses: actions/upload-artifact@v4
    if: always()
    with:
      name: accessibility-report
      path: accessibility-reports/
      retention-days: 7
```

Use your actual staging URL and arrange deployment readiness before auditing. V1 fails on all findings meeting the threshold; baseline comparisons and detection of only new issues are roadmap features. Limit artifact access according to report sensitivity.

## Exit codes

| Code | Meaning                                                                                                                            |
| ---- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `0`  | All attempted pages audited and severity gate passed; also help/version                                                            |
| `1`  | Audit completed, but confirmed findings meet or exceed the threshold                                                               |
| `2`  | Configuration or execution failure, including any failed page, no scanned pages, browser launch failure, or report-writing failure |

Severity order: **critical > serious > moderate > minor**. `--fail-on serious` fails for serious or critical findings. `--fail-on none` disables severity failure, but execution errors still return 2. Partial audits still write their available reports and are labeled **INCOMPLETE**, with code 2 taking precedence over severity failure.

## Development

```sh
npm run dev -- https://example.com --max-pages 1
npm run lint
npm run typecheck
npm run test:unit
npm run test:integration
npm test
npm run build
npm run format
npm run format:check
npm pack --dry-run
```

Full and integration test commands build the CLI first. Unit tests cover normalization, policy, options, WCAG tags, aggregation, unknown impacts, severity thresholds, report serialization, escaping, and log sanitization. Integration tests exercise real axe results on deliberate local defects, crawling, redirects, failure continuation, page limits, compiled CLI exit codes, report writes, and accessibility checks on the generated HTML report.

## Roadmap

**V2:** violation screenshots; authenticated scanning (`--storage-state`, cookies, headers, login scripts); custom readiness hooks; custom HTTP headers; scan history; baseline comparison and new-vs-existing findings; SARIF; JUnit; configurable concurrency; sitemap.xml support.

**V3:** web dashboard; scheduled scans; project history; team reports; Slack/Teams notifications; accessibility trends; pull-request annotations.

These are future plans, not current features. V1 has no database, accounts, hosting service, or AI features.

## Contributing

Read [CONTRIBUTING.md](CONTRIBUTING.md), keep changes focused, and add deterministic tests for behavioral changes. Follow the [Code of Conduct](CODE_OF_CONDUCT.md). Security reporting guidance is in [SECURITY.md](SECURITY.md).

## License

[MIT](LICENSE).
