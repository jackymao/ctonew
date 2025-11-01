<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { getClient, updateUsername } from '$lib/pocketbase';
  import type { FormErrors } from '$lib/types';
  import { ClientResponseError } from 'pocketbase';

  type SettingsField = 'username';

  const pb = getClient();

  let username = pb?.authStore.model?.username ?? '';
  let errors: FormErrors<SettingsField> = {};
  let generalError = '';
  let success = '';
  let submitting = false;

  async function handleSubmit() {
    errors = {};
    generalError = '';
    success = '';

    if (!username.trim()) {
      errors.username = 'Username is required.';
      generalError = 'Please provide a username.';
      return;
    }

    submitting = true;

    try {
      const result = await updateUsername(username.trim());
      if (result.data) {
        success = 'Username saved!';
        username = result.data.username ?? '';

        const redirectTo = `/${username}`;
        goto(redirectTo);
      } else {
        generalError = result.error || 'Could not save username.';
      }
    } catch (error) {
      if (error instanceof ClientResponseError) {
        generalError = error.message || 'Could not save username.';
      } else {
        console.error('Failed to save username', error);
        generalError = 'Could not save username. Please try again.';
      }
    } finally {
      submitting = false;
    }
  }
</script>

<svelte:head>
  <title>Profile Settings</title>
</svelte:head>

<div class="settings">
  <h1>Profile Settings</h1>
  <p class="subtitle">Choose a username to publish your personal wiki.</p>

  {#if generalError}
    <div class="error">{generalError}</div>
  {/if}

  {#if success}
    <div class="success">{success}</div>
  {/if}

  <form on:submit|preventDefault={handleSubmit}>
    <div class="form-group" class:has-error={Boolean(errors.username)}>
      <label for="username">Username</label>
      <input
        id="username"
        type="text"
        bind:value={username}
        minlength={3}
        maxlength={32}
        pattern="[A-Za-z0-9_-]+"
        inputmode="text"
        autocomplete="username"
        placeholder="your-name"
        required
        disabled={submitting}
      />
      <small>Use letters, numbers, dashes, or underscores.</small>
      {#if errors.username}
        <p class="field-error">{errors.username}</p>
      {/if}
    </div>

    <div class="form-actions">
      <button class="btn btn-primary" type="submit" disabled={submitting}>
        {submitting ? 'Saving…' : 'Save username'}
      </button>
      <a class="btn btn-secondary" href={$page.url.searchParams.get('redirect') ?? '/'}>Cancel</a>
    </div>
  </form>
</div>

<style>
  .settings {
    max-width: 580px;
    margin: 0 auto;
  }

  .settings h1 {
    margin: 0;
    font-size: 2.25rem;
  }

  .subtitle {
    margin: 0.5rem 0 2rem;
    color: rgba(15, 23, 42, 0.65);
  }

  .form-group {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    margin-bottom: 2rem;
  }

  .form-group.has-error label {
    color: #b91c1c;
  }

  .field-error {
    margin: 0;
    color: #b91c1c;
    font-size: 0.9rem;
  }

  .form-actions {
    display: flex;
    gap: 1rem;
  }

  .form-actions .btn {
    min-width: 9rem;
  }

  .success,
  .error {
    margin: 1rem 0 1.5rem;
    padding: 1rem 1.25rem;
    border-radius: 0.75rem;
    font-weight: 500;
  }

  .success {
    background: rgba(34, 197, 94, 0.15);
    color: #047857;
    border: 1px solid rgba(34, 197, 94, 0.4);
  }

  .error {
    background: rgba(239, 68, 68, 0.15);
    color: #b91c1c;
    border: 1px solid rgba(239, 68, 68, 0.4);
  }

  @media (max-width: 640px) {
    .form-actions {
      flex-direction: column;
    }

    .form-actions .btn {
      width: 100%;
    }
  }
</style>
