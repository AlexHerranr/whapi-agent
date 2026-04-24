# Security Policy

## Reporting a Vulnerability

If you discover a security vulnerability in `whapi-agent`, please report it privately by email:

**administrador@tealquilamos.com**

Please do not report security vulnerabilities through public GitHub issues, discussions, or pull requests.

Include in your report:

- A clear description of the issue and its impact
- Steps to reproduce, if possible
- The affected version or commit SHA
- Any relevant logs or proof-of-concept code

You can expect an acknowledgement within 72 hours and a status update within 7 days. Critical issues will be prioritized.

## Supported Versions

Only the latest minor version receives security updates during the `0.x` phase. Once `1.0` ships, the two latest minor versions will be supported.

## Scope

Reports are welcome for, but not limited to:

- Webhook signature bypass
- State store injection (SQL/NoSQL)
- Tool-calling argument injection leading to arbitrary code execution
- LLM prompt injection resulting in privilege escalation
- Secret leakage through logs or error responses

Out of scope:

- Issues in third-party dependencies (report upstream)
- Rate-limit bypass on the user side (this is a self-hosted library)
