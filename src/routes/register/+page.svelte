<script lang="ts">
  import { browser } from '$app/environment';
  import { goto } from '$app/navigation';
  import { ClientResponseError } from 'pocketbase';
  import { pb, getClient } from '$lib/pocketbase';
  import { authenticated } from '$lib/stores/auth';
  import type { FormErrors } from '$lib/types';

  type RegisterField = 'name' | 'email' | 'password' | 'passwordConfirm';

  const MIN_PASSWORD_LENGTH = 8;
  const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  let name = '';
  let email = '';
  let password = '';
  let passwordConfirm = '';

  let errors: FormErrors<RegisterField> = {};
  let generalError = '';
  let successMessage = '';
  let submitting = false;
  let verificationRequested = false;
  let verificationNote = '';

  const pbConfigured = Boolean(import.meta.env.VITE_PB_URL);

  $: if (browser && $authenticated) {
    goto('/');
  }

  function validate(): FormErrors<RegisterField> {
    const validationErrors: FormErrors<RegisterField> = {};

    if (!name.trim()) {
      validationErrors.name = 'Name is required.';
    }

    if (!email.trim()) {
      validationErrors.email = 'Email is required.';
    } else if (!EMAIL_PATTERN.test(email.trim())) {
      validationErrors.email = 'Please enter a valid email address.';
    }

    if (!password) {
      validationErrors.password = 'Password is required.';
    } else if (password.length < MIN_PASSWORD_LENGTH) {
      validationErrors.password = `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`;
    }

    if (!passwordConfirm) {
      validationErrors.passwordConfirm = 'Confirm your password.';
    } else if (password !== passwordConfirm) {
      validationErrors.passwordConfirm = 'Passwords do not match.';
    }

    return validationErrors;
  }

  function clearFieldError(field: RegisterField) {
    if (errors[field]) {
      const updated = { ...errors };
      delete updated[field];
      errors = updated;
    }
  }

  function resolveClient() {
    return pb ?? getClient();
  }

  async function handleSubmit() {
    errors = {};
    generalError = '';
    successMessage = '';
    verificationRequested = false;
    verificationNote = '';

    const validationErrors = validate();

    if (Object.keys(validationErrors).length > 0) {
      errors = validationErrors;
      generalError = 'Please correct the highlighted fields.';
      return;
    }

    const client = resolveClient();

    if (!client) {
      generalError = 'PocketBase client not configured. Check that VITE_PB_URL is set.';
      return;
    }

    submitting = true;

    try {
      const trimmedName = name.trim();
      const trimmedEmail = email.trim();

      await client.collection('users').create({
        name: trimmedName,
        email: trimmedEmail,
        password,
        passwordConfirm
      });

      try {
        await client.collection('users').requestVerification(trimmedEmail);
        verificationRequested = true;
      } catch (verificationError) {
        if (verificationError instanceof ClientResponseError) {
          const message = verificationError.data?.message || verificationError.message;
          if (message) {
            verificationNote = message;
          }
        }
      }

      successMessage = verificationRequested
        ? 'Account created! Please check your email to verify your address before signing in.'
        : 'Account created successfully. You can now log in.';

      if (!verificationRequested && verificationNote) {
        successMessage += ` (${verificationNote})`;
      }

      name = '';
      email = '';
      password = '';
      passwordConfirm = '';
    } catch (error) {
      if (error instanceof ClientResponseError) {
        const fieldErrors: FormErrors<RegisterField> = {};
        const errorData = error.data?.data as Record<string, { message?: string } | undefined> | undefined;

        if (errorData) {
          const fieldNames: RegisterField[] = ['name', 'email', 'password', 'passwordConfirm'];

          for (const field of fieldNames) {
            const fieldError = errorData[field];
            if (fieldError?.message) {
              fieldErrors[field] = fieldError.message;
            }
          }
        }

        if (Object.keys(fieldErrors).length > 0) {
          errors = fieldErrors;
        }

        generalError =
          error.data?.message || error.message || 'Registration failed. Please review the form and try again.';

        if (!generalError && Object.keys(fieldErrors).length > 0) {
          generalError = 'Please correct the highlighted fields.';
        }
      } else {
        console.error('Registration failed', error);
        generalError = 'Registration failed. Please try again.';
      }
    } finally {
      submitting = false;
    }
  }
</script>

<svelte:head>
  <title>Create Account</title>
</svelte:head>

<div class="register-page">
  <div class="register-card">
    <h1>Create your account</h1>
    <p class="subtitle">Sign up to collaborate on your knowledge base.</p>

    {#if !$authenticated && !pbConfigured}
      <div class="notice">
        <strong>PocketBase not configured.</strong>
        <p>Set <code>VITE_PB_URL</code> in your <code>.env</code> file and restart the dev server.</p>
      </div>
    {/if}

    {#if $authenticated}
      <div class="notice inline">
        You are already signed in. <a href="/">Return to the dashboard.</a>
      </div>
    {/if}

    {#if generalError}
      <div class="error">
        {generalError}
      </div>
    {/if}

    {#if successMessage}
      <div class="success">
        <p>{successMessage}</p>
        <p class="success-next">
          Ready to go? <a href="/login">Sign in</a> with your new credentials.
        </p>
      </div>
    {/if}

    <form on:submit|preventDefault={handleSubmit} aria-live="polite">
      <div class="form-group" class:has-error={Boolean(errors.name)}>
        <label for="name">Full name</label>
        <input
          id="name"
          type="text"
          bind:value={name}
          required
          autocomplete="name"
          placeholder="Ada Lovelace"
          on:input={() => clearFieldError('name')}
          class:input-error={Boolean(errors.name)}
          disabled={submitting}
        />
        {#if errors.name}
          <p class="field-error">{errors.name}</p>
        {/if}
      </div>

      <div class="form-group" class:has-error={Boolean(errors.email)}>
        <label for="email">Email</label>
        <input
          id="email"
          type="email"
          bind:value={email}
          required
          autocomplete="email"
          placeholder="you@example.com"
          on:input={() => clearFieldError('email')}
          class:input-error={Boolean(errors.email)}
          disabled={submitting}
        />
        {#if errors.email}
          <p class="field-error">{errors.email}</p>
        {/if}
      </div>

      <div class="form-group" class:has-error={Boolean(errors.password)}>
        <label for="password">Password</label>
        <input
          id="password"
          type="password"
          bind:value={password}
          required
          autocomplete="new-password"
          minlength={MIN_PASSWORD_LENGTH}
          placeholder="••••••••"
          on:input={() => clearFieldError('password')}
          class:input-error={Boolean(errors.password)}
          disabled={submitting}
        />
        <small>Use at least {MIN_PASSWORD_LENGTH} characters.</small>
        {#if errors.password}
          <p class="field-error">{errors.password}</p>
        {/if}
      </div>

      <div class="form-group" class:has-error={Boolean(errors.passwordConfirm)}>
        <label for="passwordConfirm">Confirm password</label>
        <input
          id="passwordConfirm"
          type="password"
          bind:value={passwordConfirm}
          required
          autocomplete="new-password"
          placeholder="••••••••"
          on:input={() => clearFieldError('passwordConfirm')}
          class:input-error={Boolean(errors.passwordConfirm)}
          disabled={submitting}
        />
        {#if errors.passwordConfirm}
          <p class="field-error">{errors.passwordConfirm}</p>
        {/if}
      </div>

      <div class="form-actions">
        <button type="submit" class="btn btn-primary" disabled={submitting}>
          {submitting ? 'Creating account…' : 'Create account'}
        </button>
        <a href="/login" class="btn btn-secondary">Back to login</a>
      </div>
    </form>
  </div>
</div>

<style>
  .register-page {
    display: flex;
    justify-content: center;
    align-items: flex-start;
    padding-top: 4rem;
    min-height: 60vh;
  }

  .register-card {
    width: min(520px, 90vw);
    background: white;
    border: 1px solid rgba(15, 23, 42, 0.1);
    border-radius: 1rem;
    padding: clamp(2rem, 4vw, 2.75rem);
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03);
  }

  .register-card h1 {
    margin: 0;
    font-size: 2rem;
  }

  .subtitle {
    margin: 0.5rem 0 2rem;
    color: rgba(15, 23, 42, 0.6);
  }

  form {
    margin-top: 2rem;
  }

  .form-group.has-error label {
    color: #b91c1c;
  }

  .input-error {
    border-color: #dc2626;
  }

  .field-error {
    margin-top: 0.5rem;
    color: #b91c1c;
    font-size: 0.875rem;
  }

  .success {
    border-radius: 0.75rem;
    padding: 1rem 1.25rem;
    margin: 1.5rem 0;
    background: rgba(34, 197, 94, 0.15);
    color: #065f46;
    border: 1px solid rgba(34, 197, 94, 0.4);
  }

  .success-next {
    margin-top: 0.75rem;
    font-size: 0.9rem;
  }

  .notice.inline {
    margin: 0 0 1.5rem;
  }

  .form-actions {
    display: flex;
    gap: 0.75rem;
    margin-top: 2rem;
  }

  .form-actions .btn {
    flex: 1;
    justify-content: center;
  }

  @media (max-width: 640px) {
    .register-page {
      padding-top: 2rem;
    }

    .register-card {
      padding: 1.75rem;
    }

    .form-actions {
      flex-direction: column;
    }
  }
</style>
