# Conversational Analytics Landing Page

This directory contains a lightweight, deploy-ready landing page that showcases an immersive analytics workspace experience. It is self-contained, Tailwind-powered (via CDN), and suitable for GitHub Pages or any static host.

## Quick start

```bash
python3 -m http.server --directory static 5173
```

Navigate to `http://localhost:5173` to preview the site.

## Structure

- `index.html` — shell with navigation, dynamic outlet, Tailwind CDN setup, and gradient backdrop.
- `assets/app.js` — hash-based router that fetches HTML partials.
- `pages/` — page fragments rendered into the outlet (`home`, `capabilities`, `workflow`, `insights`, `faq`).
- `assets/logo.svg` — light-orange emblem used across the layout.

## Deploying to GitHub Pages

1. Create a new repository on GitHub (e.g. `data-analysis-agent-static`).
2. Copy the contents of this `static/` directory into the repository root.
3. Commit and push the files:
   ```bash
   git add .
   git commit -m "Add immersive analytics landing page"
   git push origin main
   ```
4. In the GitHub repository settings, enable **Pages** and select the `main` branch (root).

The site will be live at `https://<username>.github.io/<repository>/` after the build completes.

## Optional: resilient local server

Browsers occasionally close connections mid-response, which shows up as `BrokenPipeError` when using the bare `http.server` module. Run the bundled helper to suppress those noisy logs:

```bash
python static/serve.py --host 127.0.0.1 --port 5173
```

It serves the same files while gracefully ignoring broken-pipe events.
