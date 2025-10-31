import { writable } from 'svelte/store';
import { browser } from '$app/environment';
import { isAuthenticated, getClient } from '$lib/pocketbase';

function createAuthStore() {
  const { subscribe, set } = writable<boolean>(false);

  if (browser) {
    const pb = getClient();
    if (pb) {
      set(pb.authStore.isValid);
      pb.authStore.onChange(() => {
        set(pb.authStore.isValid);
      });
    }
  }

  return {
    subscribe,
    check: () => {
      if (browser) {
        set(isAuthenticated());
      }
    }
  };
}

export const authenticated = createAuthStore();
