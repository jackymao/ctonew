import { redirect } from '@sveltejs/kit';
import { isAuthenticated } from '$lib/pocketbase';
import type { PageLoad } from './$types';

export const ssr = false;

export const load: PageLoad = async ({ parent, url }) => {
  const { site } = await parent();

  if (!site) {
    return {
      site: null,
      initialPath: ''
    };
  }

  if (!isAuthenticated()) {
    const redirectTo = `/login?redirect=${encodeURIComponent(url.pathname + url.search)}`;
    throw redirect(302, redirectTo);
  }

  return {
    site,
    initialPath: url.searchParams.get('path') ?? ''
  };
};
