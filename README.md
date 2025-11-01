# Multi-Tenant SvelteKit SPA with PocketBase

A multi-tenant, domain-based wiki/knowledge base built with SvelteKit (Svelte 5, SvelteKit 2) and PocketBase. This project uses `adapter-static` with SPA fallback to enable runtime routing for static deployments across multiple domains.

## Features

- 👤 **Per-user wiki namespaces**: Each user gets their own wiki at `/{username}/...`
- 🔒 **Owner-only access**: Strict visibility controls - only page owners can view and edit their own pages
- 🏢 **Multi-tenant architecture**: Resolve sites by domain at runtime (for custom domain use-cases)
- 📚 **Dynamic wiki pages**: Catch-all route renderer for flexible page paths
- 🎨 **Theme support**: Per-site theming via JSON configuration
- 📝 **Markdown & HTML**: Support for both Markdown and HTML content formats
- ✏️ **Editor dashboards**: Login flow, new page creation, editing, and deletion directly from the SPA
- 👤 **Self-service registration**: `/register` route for creating PocketBase users with optional email verification
- 🚀 **Static deployment**: Built with SvelteKit adapter-static for CDN hosting
- 🔒 **PocketBase backend**: Leverage PocketBase for database, auth, and file storage

## Tech Stack

- **Frontend**: SvelteKit 2, Svelte 5, TypeScript
- **Backend**: PocketBase 0.30+
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

## Editor Workflow

The SPA ships with a lightweight editorial UI built directly into the frontend. All requests are
made to PocketBase from the browser, so you can manage content without a separate admin panel
while still respecting PocketBase collection rules.

- **Login** – Visit `/login` and authenticate with a PocketBase user account (uses the native
  `users` collection). Successful login stores the auth token locally via the PocketBase JS client.
- **Create** – Use `/new` (or the “New Page” link in the top bar) to create content for the current
  site. You can provide the URL path, choose Markdown or HTML, and control the published flag.
- **Edit** – When viewing a page while authenticated, an “Edit Page” button appears. It links to
  `/edit/{path}` where you can update metadata, content, format, and publish status.
- **Delete** – The edit screen provides a guarded delete flow, allowing you to remove the current
  page once confirmed.
- **Drafts** – Toggle the “Publish page” checkbox on either the create or edit screens to control
  visibility. Unpublished pages remain inaccessible to anonymous visitors (assuming PocketBase
  rules enforce `published == true`).

The authenticated navigation items automatically appear in the site header after login and revert
once you sign out. Because the app is entirely client-rendered, ensure CORS rules on PocketBase
allow requests from your deployed domains.

## User Registration

The SPA includes a self-service registration feature to let new users sign up directly from the frontend.

### How it Works

- **Route**: Visit `/register` to display the registration form
- **Fields**: Users provide their name, email, password, and password confirmation
- **Validation**: Client-side validation ensures:
  - All required fields are filled
  - Email is valid
  - Password is at least 8 characters long
  - Passwords match
- **Backend**: On submit, the app calls `pb.collection('users').create()` to create a new user record in PocketBase
- **Email Verification** (optional): If your PocketBase instance is configured to require email verification, the app automatically calls `pb.collection('users').requestVerification()` after creating the account
- **Success State**: After successful registration, the user sees a confirmation message and is prompted to either:
  - Check their email for a verification link (if verification is enabled)
  - Sign in immediately with their new credentials (if verification is not required)

### PocketBase Requirements

To enable user registration, you must configure PocketBase's `users` collection:

1. **Enable "Email/Password" Auth**:
   - In PocketBase Admin UI, go to **Collections** → **users** → **API rules**
   - Ensure the "Auth with password" option is enabled

2. **Enable Email Verification** (optional):
   - Go to **Settings** → **Mail settings**
   - Configure your SMTP server (e.g., Gmail, SendGrid, Mailgun)
   - In **Collections** → **users**, enable "Require email verification"
   - This triggers a verification email on registration

3. **Create Rules** (if needed):
   - By default, PocketBase allows user creation
   - Adjust the `users` collection's **create rules** if you need to restrict or extend registration logic

### Testing Email Verification

During local development, PocketBase logs emails to the console (no SMTP required). Look for the verification link in the PocketBase server logs:

```
[Mailer] Email sent: Verify your email...
```

Click the link to complete verification. For production, configure a real SMTP service.

### UI Flow

- **Register Link**: When not authenticated, a "Register" link appears in the site header next to "Editor Login"
- **Form Validation**: Errors are displayed inline per field and as a general message
- **Success Message**: After successful registration, users see a confirmation message with next steps
- **Back to Login**: A "Back to login" button lets users return to the login screen

### Error Handling

- **Field-level errors**: PocketBase validation errors (e.g., email already exists, invalid format) are displayed beneath the relevant input
- **General errors**: Network issues or unexpected failures show a general error message
- **Graceful degradation**: If PocketBase is not configured, the form displays a friendly notice

## Importing PocketBase schema

This repository includes a ready-to-import PocketBase schema file at the root: `pocketbase-schema.json`.

### Import Steps

1. **Start PocketBase** (version 0.30+):
   ```bash
   ./pocketbase serve
   ```

2. **Access PocketBase Admin UI**: Navigate to `http://localhost:8090/_/` in your browser and log in (or create an admin account if first run)

3. **Import the schema**:
   - Go to **Settings** → **Import collections**
   - Click "Load from JSON file" or paste the contents of `pocketbase-schema.json`
   - Review the collections (`sites` and `pages`) and click **Import**

4. **Verify**: Check that both `sites` and `pages` collections appear in the Collections section with the proper fields, rules, and indexes

### CORS Configuration

Since this is a client-side SPA, you **must** configure CORS in PocketBase to allow requests from your frontend domain(s):

1. In PocketBase Admin UI, go to **Settings** → **Application**
2. Under **API rules**, add your allowed origins:
   - Development: `http://localhost:5173`
   - Production: `https://yourdomain.com`, `https://www.yourdomain.com`, etc.
3. Save the settings

Alternatively, use a reverse proxy (Caddy, Nginx, Cloudflare Workers) to handle CORS headers.

### Creating Your First Site

After importing the schema, create a site record:

1. Go to **Collections** → **sites** → **New record**
2. Fill in:
   - **name**: "My Knowledge Base"
   - **domain**: `localhost:5173` (or your actual domain)
   - **slug**: `my-kb` (optional, URL-friendly identifier)
   - **public_read**: checked (true)
3. Click **Create**

Now you can create pages for this site in the `pages` collection.

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

Stores page content for each user or optional custom domain.

**Fields**:
- `owner` (relation to `users`, required): The authenticated user that owns the page
- `site` (relation to `sites`, optional): The custom-domain site this page belongs to (if any)
- `path` (text, required): URL path for the page (e.g., `""` for root, `"about"`, `"docs/guide"`)
- `title` (text, required): Page title
- `content` (text/editor, required): Page content (Markdown or HTML)
- `content_format` (select, required): Format of content (`md` or `html`)
- `published` (bool, default: false): Optional published flag (owner-only views ignore this flag for drafts)

**Indexes**:
- Unique index on `owner + path` to prevent duplicates within a personal wiki
- Unique index on `site + path` so custom domains still resolve a single page per path

**List/View Rules**:
```javascript
owner = @request.auth.id
```

**Write Rules**:
```javascript
@request.auth.id != "" && owner = @request.auth.id // create
owner = @request.auth.id                           // update/delete
```

**Example Record**:
```json
{
  "owner": "RELATION_ID",
  "site": "RELATION_ID", // optional when using custom domains
  "path": "index",
  "title": "Welcome",
  "content": "# Welcome\n\nThis is the homepage.",
  "content_format": "md",
  "published": true
}
```

### Collection: `users`

Standard PocketBase auth collection with one additional field:

**Fields**:
- `username` (text, unique, optional): URL-safe username for personal wiki namespace (e.g., `"alice"` → `/{alice}/...`)
- `email`, `password`, `name`, `verified` (standard PocketBase auth fields)

**Index**:
- Unique index on `username`

### Path Mapping

- Root path (`/`) maps to `path = ""` or `path = "index"` (adjust `src/lib/pocketbase.ts` as needed)
- Nested paths like `/docs/guide` map to `path = "docs/guide"`
- User namespace paths like `/{username}/about` map to a page owned by that user with `path = "about"`

## Runtime Behavior

**Username-based Routing** (primary):
1. **Namespace Resolution**: Route `/[username]/[...path]` looks up the user by `username` and loads pages where `owner` matches that user ID
2. **Owner-only Visibility**: PocketBase rules enforce `owner = @request.auth.id` for all list/view/write operations, so only the owner can see and edit their pages
3. **Profile Setup**: On registration, users are prompted to set a `username` at `/settings` and then redirect to `/{username}`

**Domain-based Routing** (legacy/custom domains):
1. **Site Resolution**: On app load, the client reads `window.location.host` and queries PocketBase for a site with matching `domain`
2. **Page Loading**: The catch-all route `[...path]` fetches pages by `siteId` and `path` from PocketBase where the owner matches the authenticated user
3. **Content Rendering**: 
   - If `content_format === 'md'`, content is rendered using `marked`
   - If `content_format === 'html'`, content is rendered as-is (assumed to be sanitized)
4. **Error Handling**: Friendly error messages for missing sites or pages, or permission errors

## Migrating Existing Installations

If you previously deployed the domain-only version of this project, follow these steps to adopt per-user namespaces safely:

1. **Add usernames**: In PocketBase, open the `users` collection and populate the new `username` field for every user. Usernames must be unique and URL safe (letters, numbers, `_`, `-`).
2. **Assign page owners**: For each page record, copy the appropriate user ID into the required `owner` relation. Pages without an owner will now fail validation. You can use the PocketBase admin UI bulk editor or run an `update` migration script.
3. **Optional – keep custom domains**: If you use domain-based routing, leave the `site` relation populated. Pages without `site` continue to render under the `/{username}` namespace only.
4. **Re-import or update schema**: Import the updated `pocketbase-schema.json` or manually apply the new rules/indexes so the collection enforces uniqueness and owner-only access.
5. **Verify rules**: Test viewing pages while logged out or as another user—you should now receive a 403/empty state thanks to the stricter `owner = @request.auth.id` rules.

> Tip: run a quick PocketBase script (or use the admin UI) to backfill `owner` by matching existing pages to their intended user before enabling the new rules in production.

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
- **PocketBase version**: The project targets PocketBase `0.30.x`. Update the dependency alongside the app when newer releases become available.

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
