Deployment notes

This repo is configured to deploy the built frontend to GitHub Pages (branch `gh-pages`) via the workflow `.github/workflows/pages-deploy.yml` which runs on push to `main`.

How it works:
- Workflow installs dependencies, runs `npm run build` (Vite), and publishes the `dist` folder to `gh-pages` branch using peaceiris/actions-gh-pages.

To trigger deployment locally:
1. Make sure `main` branch is up to date and pushed.
2. Run: git checkout main && git pull
3. Make a small commit and push: git commit --allow-empty -m "chore: trigger pages deploy" && git push origin main

Notes:
- If your site should be served from a subpath, adjust `vite.config.ts` `base` setting accordingly.
- The workflow uses the default `GITHUB_TOKEN` so no extra secrets are required.
