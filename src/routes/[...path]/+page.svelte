<script lang="ts">
  import { marked } from 'marked';
  import type { PageData } from './$types';
  import { authenticated } from '$lib/stores/auth';

  marked.setOptions({
    breaks: true,
    gfm: true,
    headerIds: true,
    mangle: false
  });

  export let data: PageData;

  $: content = data.page?.content;
  $: isMarkdown = data.page?.content_format === 'md';
  $: renderedContent = isMarkdown && content ? marked(content) : content ?? '';
  $: editPath = data.requestedPath || 'index';
</script>

<svelte:head>
  <title>{data.page?.title ?? 'Page'}</title>
</svelte:head>

<article class="page">
  {#if data.page}
    <header class="page-header">
      <div class="page-header-content">
        <h1>{data.page.title}</h1>
        {#if $authenticated}
          <div class="page-actions">
            <a href="/edit/{editPath}" class="btn btn-secondary">Edit Page</a>
          </div>
        {/if}
      </div>
    </header>
    <div class="page-content">
      {@html renderedContent}
    </div>
  {:else if data.pageError}
    <div class="notice">
      <strong>Unable to load page.</strong>
      <p>{data.pageError}</p>
      {#if data.requestedPath}
        <p>Requested path: <code>/{data.requestedPath}</code></p>
      {/if}
      {#if $authenticated && data.site}
        <p>
          <a href="/new?path={encodeURIComponent(data.requestedPath)}" class="btn btn-primary"
            >Create this page</a
          >
        </p>
      {/if}
    </div>
  {:else}
    <div class="notice">
      Loading page…
    </div>
  {/if}
</article>

<style>
  .page {
    max-width: 100%;
  }

  .page-header {
    margin-bottom: 2rem;
    border-bottom: 1px solid rgba(15, 23, 42, 0.1);
    padding-bottom: 1rem;
  }

  .page-header-content {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 1rem;
    justify-content: space-between;
  }

  .page-header h1 {
    margin: 0;
    font-size: 2.5rem;
    line-height: 1.1;
  }

  .page-actions {
    display: flex;
    gap: 0.75rem;
  }

  .page-content {
    line-height: 1.7;
  }

  .page-content :global(h2) {
    margin-top: 2.5rem;
    margin-bottom: 1rem;
    font-size: 1.875rem;
  }

  .page-content :global(h3) {
    margin-top: 2rem;
    margin-bottom: 0.75rem;
    font-size: 1.5rem;
  }

  .page-content :global(p) {
    margin-bottom: 1.25rem;
  }

  .page-content :global(a) {
    color: #2563eb;
    text-decoration: underline;
  }

  .page-content :global(a:hover) {
    color: #1e40af;
  }

  .page-content :global(ul),
  .page-content :global(ol) {
    margin-bottom: 1.25rem;
    padding-left: 2rem;
  }

  .page-content :global(li) {
    margin-bottom: 0.5rem;
  }

  .page-content :global(code) {
    font-family: 'JetBrains Mono', 'Fira Code', monospace;
    background: rgba(15, 23, 42, 0.05);
    padding: 0.15rem 0.35rem;
    border-radius: 0.25rem;
    font-size: 0.9em;
  }

  .page-content :global(pre) {
    background: #1e293b;
    color: #e2e8f0;
    padding: 1rem;
    border-radius: 0.5rem;
    overflow-x: auto;
    margin-bottom: 1.25rem;
  }

  .page-content :global(pre code) {
    background: none;
    padding: 0;
    color: inherit;
  }

  .page-content :global(blockquote) {
    border-left: 4px solid #2563eb;
    padding-left: 1rem;
    margin: 1.25rem 0;
    color: rgba(15, 23, 42, 0.7);
  }

  code {
    font-family: 'JetBrains Mono', 'Fira Code', monospace;
    background: rgba(15, 23, 42, 0.05);
    padding: 0.1rem 0.25rem;
    border-radius: 0.35rem;
  }
</style>
