<script lang="ts">
  import { goto } from '$app/navigation';
  import { login, getClient } from '$lib/pocketbase';
  import { authenticated } from '$lib/stores/auth';

  let email = '';
  let password = '';
  let error = '';
  let loading = false;

  async function handleSubmit() {
    error = '';
    loading = true;

    const result = await login(email, password);

    if (result.data) {
      authenticated.check();
      const pb = getClient();
      const username = pb?.authStore.model?.username;
      
      if (username) {
        goto(`/${username}`);
      } else {
        goto('/settings?redirect=/');
      }
    } else {
      error = result.error || 'Login failed';
    }

    loading = false;
  }
</script>

<svelte:head>
  <title>Editor Login</title>
</svelte:head>

<div class="login-page">
  <div class="login-card">
    <h1>Editor Login</h1>
    <p class="subtitle">Sign in to create and edit pages</p>

    {#if error}
      <div class="error">
        {error}
      </div>
    {/if}

    <form on:submit|preventDefault={handleSubmit}>
      <div class="form-group">
        <label for="email">Email</label>
        <input
          id="email"
          type="email"
          bind:value={email}
          required
          disabled={loading}
          placeholder="editor@example.com"
        />
      </div>

      <div class="form-group">
        <label for="password">Password</label>
        <input
          id="password"
          type="password"
          bind:value={password}
          required
          disabled={loading}
          placeholder="••••••••"
        />
      </div>

      <div class="form-actions">
        <button type="submit" class="btn btn-primary" disabled={loading}>
          {loading ? 'Signing in...' : 'Sign in'}
        </button>
        <a href="/" class="btn btn-secondary">Cancel</a>
      </div>
    </form>
  </div>
</div>

<style>
  .login-page {
    display: flex;
    justify-content: center;
    align-items: flex-start;
    padding-top: 4rem;
    min-height: 60vh;
  }

  .login-card {
    width: min(450px, 90vw);
    background: white;
    border: 1px solid rgba(15, 23, 42, 0.1);
    border-radius: 1rem;
    padding: 2.5rem;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03);
  }

  .login-card h1 {
    margin: 0 0 0.5rem;
    font-size: 2rem;
  }

  .subtitle {
    margin: 0 0 2rem;
    color: rgba(15, 23, 42, 0.6);
  }

  .form-actions {
    margin-top: 1.5rem;
  }

  .form-actions .btn {
    width: 100%;
    justify-content: center;
  }
</style>
