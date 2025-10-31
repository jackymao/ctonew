<script lang="ts">
  import { page } from '$app/stores';

  const statusMessages: Record<number, string> = {
    404: 'Page Not Found',
    500: 'Internal Server Error',
    403: 'Forbidden',
    401: 'Unauthorized'
  };

  $: status = $page.status;
  $: title = statusMessages[status] || 'Error';
  $: message = $page.error?.message || 'An unexpected error occurred.';
</script>

<svelte:head>
  <title>{status} – {title}</title>
</svelte:head>

<div class="error-page">
  <div class="error-code">{status}</div>
  <h1>{title}</h1>
  <p class="error-message">{message}</p>
  <a href="/" class="home-link">← Return to home</a>
</div>

<style>
  .error-page {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    padding: 3rem 1.5rem;
    min-height: 50vh;
  }

  .error-code {
    font-size: 6rem;
    font-weight: 700;
    line-height: 1;
    color: rgba(37, 99, 235, 0.2);
    user-select: none;
  }

  h1 {
    margin: 1rem 0 0.5rem;
    font-size: 2rem;
  }

  .error-message {
    color: rgba(15, 23, 42, 0.7);
    margin-bottom: 2rem;
  }

  .home-link {
    display: inline-flex;
    align-items: center;
    padding: 0.75rem 1.5rem;
    background: #2563eb;
    color: white;
    border-radius: 0.5rem;
    text-decoration: none;
    font-weight: 500;
    transition: background 0.15s ease;
  }

  .home-link:hover {
    background: #1e40af;
    text-decoration: none;
  }
</style>
