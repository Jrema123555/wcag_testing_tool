# Contributing

Use Node.js 22.12+ and npm. Run `npm ci` and `npx playwright install chromium` before developing.

Discuss substantial product changes in an issue before implementation. Keep pull requests focused, describe the user-visible behavior, and include relevant validation. Tests must use controlled local fixtures and must not depend on a public website.

Before opening a pull request, run:

```sh
npm run format
npm run lint
npm run typecheck
npm test
npm run build
```

Use strict types, small modules, and explicit failures. Preserve raw axe evidence rather than inventing findings or conformance claims. Update README options and schema documentation when changing public behavior. Do not commit reports, credentials, browser state, or sensitive page fixtures.

Contributions are provided under the repository's MIT license. Follow CODE_OF_CONDUCT.md.
