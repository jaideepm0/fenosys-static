# Data Analysis Agent — Static Landing Page

This directory contains a lightweight, deploy-ready landing page that mirrors the primary messaging of the Data Analysis Agent. It is self-contained and suitable for GitHub Pages or any static host.

## Quick start

```bash
python3 -m http.server --directory static 5173
```

Navigate to `http://localhost:5173` to preview the site.

## Deploying to GitHub Pages

1. Create a new repository on GitHub (e.g. `data-analysis-agent-static`).
2. Copy the contents of this `static/` directory into the repository root.
3. Commit and push the files:
   ```bash
   git add .
   git commit -m "Add Data Analysis Agent landing page"
   git push origin main
   ```
4. In the GitHub repository settings, enable **Pages** and select the `main` branch (root).

The site will be live at `https://<username>.github.io/<repository>/` after the build completes.
