# Shashwat Aryal — Cloud & DevOps Portfolio

A responsive portfolio for a BSc CSIT student in Kathmandu, Nepal, focused on Cloud, DevOps, and cloud security. The site is plain HTML, CSS, and JavaScript; it has no application backend and no production npm dependencies.

The portfolio presents completed work, active learning, and planned project stages separately. Project implementation details link to the corresponding public repositories. No employment history, certification, or production results are claimed.

## Site features

- Dark and light themes, with the visitor's choice saved locally.
- Responsive, keyboard-usable navigation and a searchable command palette.
- Project case studies with technologies, architecture, security, evidence, and lessons.
- Reduced-motion support and visible focus styling.
- A project workflow panel, portfolio readouts, and a compact learning notebook with learning and planned states kept distinct.
- Lightweight scroll progress and scroll-triggered reveals, with reduced-motion fallbacks.
- Optional fixed-command demo terminal; it does not execute shell commands.
- Email and phone links, with no pretend contact form.
- Static security headers for Cloudflare Pages, a custom 404 page, and social-preview assets.

## Project structure

```text
site/                 Deployable static site
  assets/             Profile images, resume, and social-preview artwork
  css/                Shared and multipage styles
  js/                 Content, page behavior, command palette, and terminal
site-src/partials/    Shared HTML templates used by the page builder
scripts/              Page builder, local server, URL metadata helper, and Lighthouse runner
tests/                Playwright end-to-end and axe accessibility tests
.github/workflows/    Pull request and main-branch quality checks
```

## Requirements and local development

Use Node.js 22.19 or newer and npm. The committed lockfile supports reproducible installation.

```sh
npm ci
npx playwright install chromium
npm start
```

Open `http://127.0.0.1:4173`. In another terminal, run:

```sh
npm test
npm run lighthouse
npm audit
```

Playwright checks rendered routes, JavaScript-disabled navigation, project links and command-palette search, theme persistence, terminal input safety, contact links, responsive overflow at 320–1440 px, 404 handling, reduced motion, and axe WCAG A/AA rules in both themes. Lighthouse writes HTML and JSON reports under `.lighthouseci/`; accessibility, SEO, and best-practices scores below 90 fail the command. Performance below 90 is reported as a baseline warning because the local and CI runner conditions vary.

`npm run build:pages` generates the deployable pages in `site/`; `npm run check:pages` verifies generated output is current. The `npm start` server is for local review and does not simulate Cloudflare response headers.

## Automated checks

GitHub Actions runs on pull requests and pushes to `main`. It installs dependencies with `npm ci`, installs Chromium, runs Playwright and axe, then runs Lighthouse. The workflow uses read-only repository permissions and does not require deployment credentials. Test and audit reports are retained as workflow artifacts.

## Cloudflare Pages

This is a static site. Connect the portfolio repository to Cloudflare Pages with:

| Setting | Value |
| --- | --- |
| Framework preset | None |
| Build command | Leave empty |
| Build output directory | `site` |
| Production branch | `main` (or the chosen production branch) |

Preview deployments can be enabled for pull requests. The `site/_headers` file configures security headers on Cloudflare Pages. The site itself needs no server, database, paid service, or environment variables.

No custom production domain is configured in this repository. After a domain is registered and connected in Cloudflare Pages, generate canonical and sitemap metadata with:

```sh
npm run set-site-url -- https://your-approved-domain.example
```

Use the exact HTTPS origin assigned to the site. This updates `site/index.html`, `site/robots.txt`, and creates `site/sitemap.xml`. Do not publish a canonical domain until it is actually connected and serving the site.

## Project evidence

- [Cloud-Native DevOps Platform](https://github.com/sassy-on-cloud/cloud-native-devops-platform) — in progress; Terraform, ECS Fargate, and OIDC delivery stages are documented in the repository. Its README also notes that TLS, WAF, Kubernetes, fuller observability, and production database configuration remain future work.
- [ProductHub AWS deployment](https://github.com/sassy-on-cloud/producthub-aws-deployment) — completed Docker Compose and AWS ECR/EC2 deployment project.
- [Terraform AWS Infrastructure](https://github.com/sassy-on-cloud/terraform-aws-infrastructure) — completed Terraform lab with VPC, routing, security group, and EC2.
- [Linux Server Administration](https://github.com/sassy-on-cloud/linux-server-administration) — completed documented exercises with Ubuntu, SSH, permissions, and Nginx.
- [AWS Cloud Quest: Cloud Practitioner](https://github.com/sassy-on-cloud/aws-cloud-quest-cloud-practitioner) — completed training badge and selected hands-on evidence; it is not an AWS certification.

Review each repository for its current implementation and evidence. Update `site/js/content.js` when project status changes.
