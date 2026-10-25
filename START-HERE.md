# Upload to GitHub

## 1. Extract the ZIP

Unzip `ER-Reference-GitHub.zip`. Open the extracted folder.
Upload the files and folders INSIDE it, not the ZIP itself or an extra outer folder.

At the top of your repository you should see `dist`, `scripts`, `README.md`, and the `check*.cjs` files.
Keep `dist` as a folder: `dist/index.html` is the website homepage.

## 2. Create a GitHub repository

1. Sign in at https://github.com/new.
2. Name the repository, for example `er-vet-reference`.
3. Choose your preferred repository visibility. A public repository exposes the code.
4. Create the repository. You do not need another README; one is included.
5. Select **uploading an existing file**, or **Add file > Upload files**.
6. Drag the extracted contents into the upload area, preserving the folder structure.
7. Commit with a message such as `Initial ER Reference website`.

GitHub accepts folders through drag-and-drop. If your file browser hides dot-prefixed folders, show hidden files or use GitHub Desktop so the included `.github` test workflow and `.githooks` are uploaded too. The website itself lives in `dist`.

This package has fewer than 100 files. The original spreadsheet is not needed for hosting: the implemented calculations and references are included.

## 3. Connect to Cloudflare Pages

GitHub stores the code; uploading it does not itself create the Cloudflare website.
Create a Cloudflare Pages project using Git integration and select this repository.

| Setting | Value |
| --- | --- |
| Framework preset | None |
| Production branch | main (or the branch you uploaded) |
| Root directory | Leave blank / repository root |
| Build command | `node scripts/check-all.cjs` |
| Build output directory | `dist` |
| Environment variables | None required |

The build command runs checks; no framework build or npm install is needed. Node.js and Python 3 must be available in the build environment. Fix failing checks before deploying rather than bypassing them.

Cloudflare provides a public `pages.dev` address. Future Git pushes can trigger new deployments. Visitors do not need GitHub or Cloudflare accounts to open a public site.

For manual Cloudflare Direct Upload instead, upload only the CONTENTS of `dist`, with `index.html` at the upload root. Direct Upload is a separate project choice from Git integration.

## Updating and reviewing

- `dist/`: complete website and downloadable print PDF.
- `check*.cjs`: calculation and interface regression tests.
- `scripts/check-all.cjs`: runs the full check suite.
- `scripts/`: optional generation tools and adapters. The supplied `dist` is ready to host; do not blindly regenerate it.
- `.github/workflows/checks.yml`: automatic GitHub checks on pushes/pull requests; no publishing credentials required.
- `AUDIT.md`: historical review notes. Review current source/tests for later changes.

Run locally: `python3 -m http.server 8000 --directory dist`, then open http://localhost:8000.
Run all checks from the project root: `node scripts/check-all.cjs`.
In a Git checkout, install the pre-push check using `node scripts/install-check-hook.cjs`.

Tests verify implemented arithmetic and wiring. Clinical review and browser/print checks remain separate.

## Official instructions

- GitHub uploads: https://docs.github.com/en/repositories/working-with-files/managing-files/adding-a-file-to-a-repository
- Cloudflare Git integration: https://developers.cloudflare.com/pages/get-started/git-integration/
- Cloudflare static HTML: https://developers.cloudflare.com/pages/framework-guides/deploy-anything/

Packaged October 24, 2026. Source version 74: `46083220a292d6440d9caf1810f1bf5249cc5592`.

## Existing Cloudflare Workers project

A project whose GitHub check is named **Workers Builds** uses Workers static assets rather than the Pages settings above. The repository's `wrangler.json` configures `dist` as the static asset directory, runs the full check suite as its custom build, and enables the `previews` block required by `wrangler preview`.

Keep the repository root as the working directory. Preview builds can use `npx wrangler@4.152.0 preview`; production deployment uses `npx wrangler@4.152.0 deploy` only after review and authorization. Node.js and Python 3 must be available for the custom checks. No application npm dependencies or framework build are required. The Wrangler name is `er-reference-github22`, matching the existing project.

For a local packaging check without uploading or deploying, use `npx wrangler@4.152.0 deploy --dry-run`. A successful dry run verifies configuration and packaging; it does not establish that Cloudflare authentication, account settings or a remote deployment succeeded.
