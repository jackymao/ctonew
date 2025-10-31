import { redirect } from '@sveltejs/kit';
import { fetchPageForEdit, isAuthenticated } from '$lib/pocketbase';
import type { PageLoad } from './$types';

export const ssr = false;

export const load: PageLoad = async ({ parent, params, url }) => {
  const { site } = await parent();
  const path = params.path ?? '';

  if (!site) {
    return {
      site: null,
      page: null,
      requestedPath: path,
      loadError: 'Site could not be resolved.'
    };
  }

  if (!isAuthenticated()) {
    const redirectTo = `/login?redirect=${encodeURIComponent(url.pathname + url.search)}`;
    throw redirect(302, redirectTo);
  }

  const result = await fetchPageForEdit(site.id, path);

  return {
    site,
    page: result.data,
    requestedPath: path,
    loadError: result.error
  };
};
