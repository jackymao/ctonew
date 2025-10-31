import type { PageLoad } from './$types';
import { fetchPageByPath } from '$lib/pocketbase';

export const prerender = false;

export const load: PageLoad = async ({ parent, params }) => {
  const { site, siteError } = await parent();
  const requestedPath = params.path ?? '';

  if (!site) {
    return {
      site: null,
      page: null,
      pageError: siteError ?? 'Site could not be resolved for this domain.',
      requestedPath
    };
  }

  const result = await fetchPageByPath(site.id, requestedPath);

  return {
    site,
    page: result.data,
    pageError: result.error,
    requestedPath
  };
};
