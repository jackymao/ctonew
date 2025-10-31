import { browser } from '$app/environment';
import PocketBase, { ClientResponseError, type RecordModel } from 'pocketbase';
import type { Page, Site, SiteTheme } from './types';

export type FetchResult<T> = {
  data: T | null;
  error?: string;
};

const PB_URL = import.meta.env.VITE_PB_URL;
let client: PocketBase | null = null;

function ensureClient(): PocketBase | null {
  if (!browser) {
    return null;
  }

  if (!PB_URL) {
    console.warn('PocketBase URL missing. Set VITE_PB_URL in your environment.');
    return null;
  }

  if (!client) {
    client = new PocketBase(PB_URL);
    client.autoCancellation(false);
  }

  return client;
}

type SiteRecord = RecordModel & {
  name: string;
  slug: string;
  domain: string;
  theme?: unknown;
  logo?: string | null;
  public_read: boolean;
};

type PageRecord = RecordModel & {
  site: string | RecordModel;
  path: string;
  title: string;
  content: string;
  content_format: 'md' | 'html';
  published: boolean;
};

function parseTheme(theme: unknown): SiteTheme | undefined {
  if (!theme) return undefined;
  if (typeof theme === 'object') return theme as SiteTheme;
  if (typeof theme === 'string') {
    try {
      return JSON.parse(theme) as SiteTheme;
    } catch (error) {
      console.warn('Failed to parse theme JSON', error);
    }
  }
  return undefined;
}

function mapSite(record: SiteRecord, pb: PocketBase): Site {
  const theme = parseTheme(record.theme);
  const logoFile = record.logo ?? null;

  return {
    id: record.id,
    name: record.name,
    slug: record.slug,
    domain: record.domain,
    theme,
    logoFile,
    logoUrl: logoFile ? pb.files.getUrl(record, logoFile) : undefined,
    public_read: record.public_read,
    created: record.created,
    updated: record.updated
  };
}

function mapPage(record: PageRecord): Page {
  const siteRelation = record.site;
  const siteId = typeof siteRelation === 'string' ? siteRelation : siteRelation?.id ?? '';

  return {
    id: record.id,
    site: siteId,
    path: record.path,
    title: record.title,
    content: record.content,
    content_format: record.content_format,
    published: record.published,
    created: record.created,
    updated: record.updated
  };
}

export async function fetchSiteByDomain(domain: string): Promise<FetchResult<Site>> {
  const pb = ensureClient();
  if (!pb) {
    return {
      data: null,
      error: 'PocketBase client not configured. Check that VITE_PB_URL is set.'
    };
  }

  try {
    const sanitizedDomain = escapeFilterValue(domain);
    const record = await pb
      .collection('sites')
      .getFirstListItem<SiteRecord>(`domain = "${sanitizedDomain}"`);
    return {
      data: mapSite(record, pb)
    };
  } catch (error) {
    if (error instanceof ClientResponseError && error.status === 404) {
      return {
        data: null,
        error: `No site configured for domain "${domain}".`
      };
    }

    console.error('Failed to fetch site by domain', error);
    return {
      data: null,
      error: 'Unable to load site details. Please try again later.'
    };
  }
}

export async function fetchPageByPath(siteId: string, path: string): Promise<FetchResult<Page>> {
  const pb = ensureClient();
  if (!pb) {
    return {
      data: null,
      error: 'PocketBase client not configured. Check that VITE_PB_URL is set.'
    };
  }

  const normalized = normalizePath(path);

  try {
    const record = await getPage(pb, siteId, normalized);
    if (record) {
      return { data: mapPage(record) };
    }

    if (!normalized) {
      const fallback = await getPage(pb, siteId, 'index');
      if (fallback) {
        return { data: mapPage(fallback) };
      }
    }

    return {
      data: null,
      error: 'Page not found.'
    };
  } catch (error) {
    if (error instanceof ClientResponseError) {
      if (error.status === 404) {
        return {
          data: null,
          error: 'Page not found.'
        };
      }
    }

    console.error('Failed to fetch page by path', error);
    return {
      data: null,
      error: 'Unable to load page content. Please try again later.'
    };
  }
}

async function getPage(pb: PocketBase, siteId: string, path: string): Promise<PageRecord | null> {
  const sanitizedSiteId = escapeFilterValue(siteId);
  const sanitizedPath = escapeFilterValue(path);
  const filter = `site = "${sanitizedSiteId}" && path = "${sanitizedPath}" && published = true`;
  try {
    return await pb.collection('pages').getFirstListItem<PageRecord>(filter);
  } catch (error) {
    if (error instanceof ClientResponseError && error.status === 404) {
      return null;
    }
    throw error;
  }
}

function normalizePath(path: string): string {
  const trimmed = path.replace(/^\/+|\/+$/g, '');
  return trimmed;
}

function escapeFilterValue(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}
