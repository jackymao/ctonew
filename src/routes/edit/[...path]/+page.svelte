<script lang="ts">
  import { goto } from '$app/navigation';
  import { updatePage, deletePage } from '$lib/pocketbase';
  import type { PageData } from './$types';

  export let data: PageData;

  let path = data.page?.path || '';
  let title = data.page?.title || '';
  let content = data.page?.content || '';
  let contentFormat: 'md' | 'html' = data.page?.content_format || 'md';
  let published = data.page?.published || false;
  let error = '';
  let saving = false;
  let deleting = false;
  let showDeleteConfirm = false;

  async function handleSubmit() {
    if (!data.page) {
      error = 'No page loaded';
      return;
    }

    error = '';
    saving = true;

    const normalizedPath = path.trim().replace(/^\/+|\/+$/g, '');

    const result = await updatePage(data.page.id, {
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
      error = result.error || 'Failed to update page';
      saving = false;
    }
  }

  async function handleDelete() {
    if (!data.page) return;

    deleting = true;
    const result = await deletePage(data.page.id);

    if (result.data) {
      goto('/');
    } else {
      error = result.error || 'Failed to delete page';
      deleting = false;
      showDeleteConfirm = false;
    }
  }
</script>

<svelte:head>
  <title>Edit: {data.page?.title ?? 'Page'}</title>
</svelte:head>

<div class="page-form">
  <h1>Edit Page</h1>
  <p class="subtitle">Editing: {data.page?.title ?? data.requestedPath}</p>

  {#if data.loadError}
    <div class="error">
      <strong>Error:</strong> {data.loadError}
      <p><a href="/" class="btn btn-secondary">Go back</a></p>
    </div>
  {:else if data.page}
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
            URL path for this page (e.g., "about", "docs/guide"). Leave empty or use "index" for
            the homepage.
          </small>
        </label>
        <input
          id="path"
          type="text"
          bind:value={path}
          placeholder="about"
          disabled={saving || deleting}
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
          disabled={saving || deleting}
          placeholder="Welcome to our site"
        />
      </div>

      <div class="form-group">
        <label for="content-format">Content Format</label>
        <select id="content-format" bind:value={contentFormat} disabled={saving || deleting}>
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
          disabled={saving || deleting}
          placeholder={contentFormat === 'md'
            ? '# Heading\n\nYour markdown content here...'
            : '<h1>Heading</h1>\n<p>Your HTML content here...</p>'}
        ></textarea>
      </div>

      <div class="form-group checkbox-group">
        <input
          id="published"
          type="checkbox"
          bind:checked={published}
          disabled={saving || deleting}
        />
        <label for="published"> Publish page (make it visible to visitors) </label>
      </div>

      <div class="form-actions">
        <button type="submit" class="btn btn-primary" disabled={saving || deleting}>
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
        <a href={`/${data.page?.path ?? ''}`} class="btn btn-secondary">Cancel</a>
        {#if !showDeleteConfirm}
          <button
            type="button"
            class="btn btn-danger"
            on:click={() => (showDeleteConfirm = true)}
            disabled={saving || deleting}
          >
            Delete
          </button>
        {/if}
      </div>

      {#if showDeleteConfirm}
        <div class="delete-confirm">
          <p><strong>Are you sure you want to delete this page?</strong></p>
          <p>This action cannot be undone.</p>
          <div class="form-actions">
            <button
              type="button"
              class="btn btn-danger"
              on:click={handleDelete}
              disabled={deleting}
            >
              {deleting ? 'Deleting...' : 'Yes, Delete Page'}
            </button>
            <button
              type="button"
              class="btn btn-secondary"
              on:click={() => (showDeleteConfirm = false)}
              disabled={deleting}
            >
              Cancel
            </button>
          </div>
        </div>
      {/if}
    </form>
  {:else}
    <div class="notice">Loading page...</div>
  {/if}
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

  .delete-confirm {
    margin-top: 2rem;
    padding: 1.5rem;
    border: 2px solid #dc2626;
    border-radius: 0.75rem;
    background: rgba(220, 38, 38, 0.05);
  }

  .delete-confirm p {
    margin: 0 0 1rem;
  }

  .delete-confirm p:last-of-type {
    margin-bottom: 1.5rem;
  }
</style>
