import { browser } from '$app/environment';
import { fetchSiteByDomain } from '$lib/pocketbase';
import type { Site } from '$lib/types';
import type { LayoutLoad } from './$types';

export const ssr = false;
export const prerender = false;

export const load: LayoutLoad = async () => {
  if (!browser) {
    return { site: null, host: '' };
  }

  const host = window.location.host;
  const result = await fetchSiteByDomain(host);

  const site: Site | null = result.data;
  const error = result.error;

  return {
    site,
    siteError: error,
    host
  };
};
