import { redirect } from '@sveltejs/kit';
import { isAuthenticated } from '$lib/pocketbase';
import type { PageLoad } from './$types';

export const ssr = false;

export const load: PageLoad = async () => {
  if (!isAuthenticated()) {
    throw redirect(302, '/login?redirect=/settings');
  }

  return {};
};
