# Security policy

Only scan websites you are authorized to test. The CLI runs website JavaScript in Chromium and makes network requests from your machine. Use a maintained browser and a disposable environment when testing untrusted sites. Avoid environments with sensitive network access. Same-origin crawling restricts top-level destinations; it is not a network sandbox for page scripts, resources, or iframes.

V1 provides no server-side proxy, remote scanning service, or authentication configuration. It rejects credentials embedded in target URLs. Console URL queries are redacted, but secrets in paths or arbitrary site content cannot be identified reliably. Do not put credentials or tokens in a scan URL.

Reports retain complete page URLs and relevant HTML and may contain personal information or secrets visible in the page. Keep reports private, review them before sharing, and restrict CI artifact access. Generated HTML escapes page content, limits link protocols, and disables scripts and external resource loading through CSP.

GET requests and page scripts can have side effects. Logout filtering and download avoidance are heuristics. Respect rate limits and prefer staging environments. Invalid TLS certificates are rejected unless the user explicitly opts out.

Security fixes target the latest released version. To report a vulnerability, use GitHub's private vulnerability reporting feature if enabled, or contact a maintainer privately using their published profile contact. Do not include exploit details or sensitive reports in public issues. Coordinate disclosure after a fix is available.
