<script lang="ts">
  import '../app.css';
  import { browser } from '$app/environment';
  import type { LayoutData } from './$types';

  export let data: LayoutData;

  const pbConfigured = Boolean(import.meta.env.VITE_PB_URL);

  const theme = data.site?.theme ?? {};
  const primaryColor = (theme.primaryColor as string) ?? '#2563eb';
  const backgroundColor = (theme.backgroundColor as string) ?? '#f8fafc';
  const textColor = (theme.textColor as string) ?? '#0f172a';

  const domain = browser ? window.location.host : data.host ?? '';
</script>

<svelte:head>
  <title>{data.site?.name ?? 'PocketBase Multi-tenant Wiki'}</title>
  {#if data.site?.logoUrl}
    <link rel="icon" href={data.site.logoUrl} />
  {/if}
</svelte:head>

<div class="frame" style={`--primary:${primaryColor};--text:${textColor};--background:${backgroundColor};`}>
  <header class="top-bar">
    <div class="branding">
      <div class="mark" aria-hidden="true">📚</div>
      <div class="identity">
        <h1>{data.site?.name ?? 'Knowledge Base'}</h1>
        <p class="tagline">
          {#if data.site}
            {data.site.domain}
          {:else}
            Multi-tenant wiki scaffold
          {/if}
        </p>
      </div>
    </div>
    <div class="domain">{domain}</div>
  </header>

  <main>
    {#if !pbConfigured}
      <div class="notice">
        <strong>PocketBase not configured.</strong>
        <p>
          Set <code>VITE_PB_URL</code> in your <code>.env</code> file to point at your PocketBase instance, then restart the dev server.
        </p>
      </div>
    {/if}

    {#if data.siteError}
      <div class="error">
        <strong>Unable to load site.</strong>
        <p>{data.siteError}</p>
      </div>
    {/if}

    {#if data.site}
      <slot />
    {:else if pbConfigured && !data.siteError}
      <div class="notice">
        Resolving site for <code>{domain}</code>...
      </div>
    {:else}
      <slot />
    {/if}
  </main>

  <footer>
    <p>
      Powered by SvelteKit and PocketBase. Configure your sites and pages collections to begin publishing content.
    </p>
  </footer>
</div>

<style>
  .frame {
    min-height: 100vh;
    background: var(--background);
    color: var(--text);
    display: flex;
    flex-direction: column;
  }

  .top-bar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1.5rem clamp(1.5rem, 4vw, 3.5rem);
    border-bottom: 1px solid rgba(15, 23, 42, 0.1);
    background: rgba(255, 255, 255, 0.7);
    backdrop-filter: blur(8px);
    position: sticky;
    top: 0;
    z-index: 10;
  }

  .branding {
    display: flex;
    gap: 1rem;
    align-items: center;
  }

  .mark {
    font-size: 2rem;
  }

  .identity h1 {
    margin: 0;
    font-size: 1.5rem;
  }

  .identity .tagline {
    margin: 0.25rem 0 0;
    color: rgba(15, 23, 42, 0.6);
  }

  .domain {
    font-family: 'JetBrains Mono', 'Fira Code', monospace;
    font-size: 0.875rem;
    color: rgba(15, 23, 42, 0.6);
  }

  main {
    width: min(900px, 90vw);
    margin: 0 auto;
    padding: 2.5rem 0 4rem;
    flex: 1;
  }

  footer {
    margin-top: auto;
    padding: 1.5rem clamp(1.5rem, 4vw, 3.5rem);
    font-size: 0.875rem;
    color: rgba(15, 23, 42, 0.55);
    border-top: 1px solid rgba(15, 23, 42, 0.08);
  }

  code {
    font-family: 'JetBrains Mono', 'Fira Code', monospace;
    background: rgba(15, 23, 42, 0.05);
    padding: 0.1rem 0.25rem;
    border-radius: 0.35rem;
  }

  @media (max-width: 640px) {
    .top-bar {
      flex-direction: column;
      align-items: flex-start;
      gap: 0.75rem;
    }

    .domain {
      align-self: flex-start;
    }
  }
</style>
