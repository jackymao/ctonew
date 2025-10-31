<script lang="ts">
  import { goto } from '$app/navigation';
  import { createPage } from '$lib/pocketbase';
  import type { PageData } from './$types';

  export let data: PageData;

  let path = data.initialPath || '';
  let title = '';
  let content = '';
  let contentFormat: 'md' | 'html' = 'md';
  let published = false;
  let error = '';
  let saving = false;

  async function handleSubmit() {
    if (!data.site) {
      error = 'No site selected';
      return;
    }

    error = '';
    saving = true;

    const normalizedPath = path.trim().replace(/^\/+|\/+$/g, '');

    const result = await createPage({
      site: data.site.id,
      path: normalizedPath || '',
      title: title.trim(),
      content: content.trim(),
      content_format: contentFormat,
      published
    });

    if (result.data) {
      const pagePath = normalizedPath || 'index';
      goto(`/${pagePath}`);
    } else {
      error = result.error || 'Failed to create page';
      saving = false;
    }
  }
</script>

<svelte:head>
  <title>Create New Page</title>
</svelte:head>

<div class="page-form">
  <h1>Create New Page</h1>
  <p class="subtitle">Add a new page to {data.site?.name ?? 'the site'}</p>

  {#if error}
    <div class="error">
      <strong>Error:</strong> {error}
    </div>
  {/if}

  <form on:submit|preventDefault={handleSubmit}>
    <div class="form-group">
      <label for="path">
        Page Path
        <small>
          URL path for this page (e.g., "about", "docs/guide"). Leave empty or use "index" for the
          homepage.
        </small>
      </label>
      <input
        id="path"
        type="text"
        bind:value={path}
        placeholder="about"
        disabled={saving}
        pattern="[a-zA-Z0-9\-_/]*"
        title="Only letters, numbers, hyphens, underscores, and forward slashes"
      />
    </div>

    <div class="form-group">
      <label for="title">Page Title</label>
      <input
        id="title"
        type="text"
        bind:value={title}
        required
        disabled={saving}
        placeholder="Welcome to our site"
      />
    </div>

    <div class="form-group">
      <label for="content-format">Content Format</label>
      <select id="content-format" bind:value={contentFormat} disabled={saving}>
        <option value="md">Markdown</option>
        <option value="html">HTML</option>
      </select>
      <small>
        {#if contentFormat === 'md'}
          Write in Markdown syntax (supports headings, lists, links, etc.)
        {:else}
          Write raw HTML (ensure content is safe and sanitized)
        {/if}
      </small>
    </div>

    <div class="form-group">
      <label for="content">Content</label>
      <textarea
        id="content"
        bind:value={content}
        required
        disabled={saving}
        placeholder={contentFormat === 'md'
          ? '# Heading\n\nYour markdown content here...'
          : '<h1>Heading</h1>\n<p>Your HTML content here...</p>'}
      ></textarea>
    </div>

    <div class="form-group checkbox-group">
      <input id="published" type="checkbox" bind:checked={published} disabled={saving} />
      <label for="published">
        Publish page (make it visible to visitors)
      </label>
    </div>

    <div class="form-actions">
      <button type="submit" class="btn btn-primary" disabled={saving}>
        {saving ? 'Creating...' : 'Create Page'}
      </button>
      <a href="/" class="btn btn-secondary">Cancel</a>
    </div>
  </form>
</div>

<style>
  .page-form {
    max-width: 900px;
    margin: 0 auto;
  }

  .page-form h1 {
    margin: 0 0 0.5rem;
    font-size: 2.5rem;
  }

  .subtitle {
    margin: 0 0 2.5rem;
    color: rgba(15, 23, 42, 0.6);
    font-size: 1.125rem;
  }
</style>
