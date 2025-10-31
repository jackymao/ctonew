# Multi-Tenant SvelteKit SPA with PocketBase

A multi-tenant, domain-based wiki/knowledge base built with SvelteKit (Svelte 5, SvelteKit 2) and PocketBase. This project uses `adapter-static` with SPA fallback to enable runtime routing for static deployments across multiple domains.

## Features

- 🏢 **Multi-tenant architecture**: Resolve sites by domain at runtime
- 📚 **Dynamic wiki pages**: Catch-all route renderer for flexible page paths
- 🎨 **Theme support**: Per-site theming via JSON configuration
- 📝 **Markdown & HTML**: Support for both Markdown and HTML content formats
- 🚀 **Static deployment**: Built with SvelteKit adapter-static for CDN hosting
- 🔒 **PocketBase backend**: Leverage PocketBase for database, auth, and file storage

## Tech Stack

- **Frontend**: SvelteKit 2, Svelte 5, TypeScript
- **Backend**: PocketBase 0.26+
- **Package Manager**: pnpm
- **Markdown**: marked
- **Deployment**: Static SPA with 200.html fallback

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm (recommended) or npm
- PocketBase instance (local or remote)

### Installation

1. Clone the repository
2. Install dependencies:

Using pnpm (recommended):
```bash
pnpm install
```

Using npm:
```bash
npm install
```

3. Create a `.env` file based on `.env.example`:

```bash
cp .env.example .env
```

4. Configure your PocketBase URL in `.env`:

```env
VITE_PB_URL=http://localhost:8090
```

### Development

Start the development server:

```bash
pnpm dev
```

Visit `http://localhost:5173` in your browser.

### Build

Build the static SPA:

```bash
pnpm build
```

The output will be in the `build/` directory with a `200.html` fallback for SPA routing.

### Preview

Preview the production build locally:

```bash
pnpm preview
```

## PocketBase Schema

This application expects the following PocketBase collections:

### Collection: `sites`

Stores multi-tenant site configurations.

**Fields**:
- `name` (text, required): Site display name
- `slug` (text, required): URL-friendly identifier
- `domain` (text, required, unique): Domain name for site resolution (e.g., `example.com`, `localhost:5173`)
- `theme` (json or text, optional): JSON object with theme config (e.g., `{"primaryColor": "#2563eb", "backgroundColor": "#f8fafc"}`)
- `logo` (file, optional): Site logo file
- `public_read` (bool, default: true): Whether site is publicly readable

**List/View Rules**:
```javascript
// Allow public read if public_read is true
public_read = true
```

**Example Record**:
```json
{
  "name": "My Knowledge Base",
  "slug": "my-kb",
  "domain": "localhost:5173",
  "theme": "{\"primaryColor\": \"#2563eb\", \"backgroundColor\": \"#f8fafc\"}",
  "public_read": true
}
```

### Collection: `pages`

Stores page content for each site.

**Fields**:
- `site` (relation to `sites`, required): The site this page belongs to
- `path` (text, required): URL path for the page (e.g., `""` for root, `"about"`, `"docs/guide"`)
- `title` (text, required): Page title
- `content` (text/editor, required): Page content (Markdown or HTML)
- `content_format` (select, required): Format of content (`md` or `html`)
- `published` (bool, default: false): Whether page is published

**Indexes**:
- Unique index on `site + path` to ensure one page per path per site

**List/View Rules**:
```javascript
// Only show published pages
published = true
```

**Write Rules**: Restrict to authenticated editors/admins only

**Example Record**:
```json
{
  "site": "RELATION_ID",
  "path": "index",
  "title": "Welcome",
  "content": "# Welcome\n\nThis is the homepage.",
  "content_format": "md",
  "published": true
}
```

### Path Mapping

- Root path (`/`) maps to `path = ""` or `path = "index"` (adjust `src/lib/pocketbase.ts` as needed)
- Nested paths like `/docs/guide` map to `path = "docs/guide"`

## Runtime Behavior

1. **Site Resolution**: On app load, the client reads `window.location.host` and queries PocketBase for a site with matching `domain`
2. **Page Loading**: The catch-all route `[...path]` fetches pages by `siteId` and `path` from PocketBase
3. **Content Rendering**: 
   - If `content_format === 'md'`, content is rendered using `marked`
   - If `content_format === 'html'`, content is rendered as-is (assumed to be sanitized)
4. **Error Handling**: Friendly error messages for missing sites or pages

## CORS and Hosting

### CORS Configuration

PocketBase must allow requests from your frontend domain(s). Configure CORS in PocketBase settings or use a reverse proxy.

**Example PocketBase CORS config** (in PocketBase admin):
- Allow origins: `http://localhost:5173`, `https://yourdomain.com`

Alternatively, use a reverse proxy (e.g., Caddy, Nginx) to handle CORS headers.

### Deployment

1. **Build the static SPA**:
   ```bash
   pnpm build
   ```

2. **Deploy to a CDN/static host**: Upload the `build/` directory to Netlify, Vercel, Cloudflare Pages, AWS S3+CloudFront, etc.

3. **Configure the host**:
   - Ensure SPA fallback is enabled (most hosts detect `200.html` automatically)
   - Point multiple domains to the same deployment if needed

4. **Configure PocketBase**:
   - Create a `sites` record for each domain
   - Set the `domain` field to match exactly (e.g., `example.com`, `www.example.com`)

5. **DNS**: Point your domains to the CDN/host

**Multi-domain strategy**: Deploy once and serve multiple domains. The app resolves the site at runtime based on `window.location.host`.

## Project Structure

```
.
├── src/
│   ├── app.css                 # Global styles
│   ├── app.d.ts                # TypeScript declarations
│   ├── lib/
│   │   ├── pocketbase.ts       # PocketBase client and helpers
│   │   └── types.ts            # TypeScript interfaces (Site, Page)
│   └── routes/
│       ├── +layout.svelte      # Root layout with site resolution
│       ├── +layout.ts          # Load site by domain
│       ├── +error.svelte       # Error page
│       └── [...path]/
│           ├── +page.svelte    # Page renderer
│           └── +page.ts        # Fetch page content
├── static/
│   ├── 200.html                # SPA fallback
│   └── favicon.ico             # Placeholder favicon
├── .env.example                # Environment variable template
├── .gitignore
├── package.json
├── svelte.config.js            # SvelteKit config with adapter-static
├── tsconfig.json
├── tsconfig.app.json
├── vite.config.ts
└── README.md
```

## Scripts

- `pnpm dev` — Start development server
- `pnpm build` — Build for production
- `pnpm preview` — Preview production build
- `pnpm lint` — Run svelte-check
- `pnpm format` — Format code with Prettier

## Environment Variables

- `VITE_PB_URL` (required): Base URL of your PocketBase instance (e.g., `http://localhost:8090`)

## Notes

- **Client-side only**: This app uses `ssr: false` and `prerender: false` to resolve sites at runtime
- **Content safety**: Ensure content is sanitized if allowing user-generated HTML
- **Authentication**: Extend PocketBase client with auth for protected pages/admin features
- **SEO**: For better SEO, consider server-side rendering or pre-rendering known paths
- **PocketBase version**: The project targets PocketBase `0.26.x`, the latest version available at the time of writing. Update the dependency when newer releases (e.g., `0.30.x`) become available.

## Troubleshooting

### Site not loading

1. Check that `VITE_PB_URL` is set correctly
2. Verify your PocketBase instance is running and accessible
3. Ensure a `sites` record exists with `domain` matching your current host
4. Check browser console for errors

### CORS errors

- Configure PocketBase to allow your frontend domain
- Or use a reverse proxy to add CORS headers

### Pages not found

- Ensure the page has `published = true`
- Verify the `path` field matches your URL (e.g., `/about` → `path = "about"`)
- Check that the page's `site` relation points to the correct site ID

## License

MIT License - see [LICENSE](./LICENSE) file for details.

## Contributing

Contributions welcome! Please open an issue or pull request.

---

Built with ❤️ using SvelteKit and PocketBase.
