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

export function getClient(): PocketBase | null {
  return ensureClient();
}

export function authToken(): string | null {
  const pb = ensureClient();
  return pb ? pb.authStore.token : null;
}

export function currentUser(): PocketBase['authStore']['model'] | null {
  const pb = ensureClient();
  return pb ? pb.authStore.model : null;
}

export function isAuthenticated(): boolean {
  const pb = ensureClient();
  return pb ? pb.authStore.isValid : false;
}

export async function login(email: string, password: string): Promise<FetchResult<boolean>> {
  const pb = ensureClient();
  if (!pb) {
    return {
      data: null,
      error: 'PocketBase client not configured.'
    };
  }

  try {
    await pb.collection('users').authWithPassword(email, password);
    return { data: true };
  } catch (error) {
    console.error('Login failed', error);
    if (error instanceof ClientResponseError) {
      return {
        data: null,
        error: error.status === 400 ? 'Invalid email or password.' : 'Login failed. Please try again.'
      };
    }
    return {
      data: null,
      error: 'Login failed. Please try again.'
    };
  }
}

export function logout(): void {
  const pb = ensureClient();
  if (pb) {
    pb.authStore.clear();
  }
}

export async function createPage(data: {
  site: string;
  path: string;
  title: string;
  content: string;
  content_format: 'md' | 'html';
  published: boolean;
}): Promise<FetchResult<Page>> {
  const pb = ensureClient();
  if (!pb) {
    return {
      data: null,
      error: 'PocketBase client not configured.'
    };
  }

  if (!pb.authStore.isValid) {
    return {
      data: null,
      error: 'You must be logged in to create pages.'
    };
  }

  try {
    const record = await pb.collection('pages').create<PageRecord>(data);
    return { data: mapPage(record) };
  } catch (error) {
    console.error('Failed to create page', error);
    if (error instanceof ClientResponseError) {
      return {
        data: null,
        error: error.message || 'Failed to create page.'
      };
    }
    return {
      data: null,
      error: 'Failed to create page. Please try again.'
    };
  }
}

export async function updatePage(
  id: string,
  data: {
    path?: string;
    title?: string;
    content?: string;
    content_format?: 'md' | 'html';
    published?: boolean;
  }
): Promise<FetchResult<Page>> {
  const pb = ensureClient();
  if (!pb) {
    return {
      data: null,
      error: 'PocketBase client not configured.'
    };
  }

  if (!pb.authStore.isValid) {
    return {
      data: null,
      error: 'You must be logged in to update pages.'
    };
  }

  try {
    const record = await pb.collection('pages').update<PageRecord>(id, data);
    return { data: mapPage(record) };
  } catch (error) {
    console.error('Failed to update page', error);
    if (error instanceof ClientResponseError) {
      return {
        data: null,
        error: error.message || 'Failed to update page.'
      };
    }
    return {
      data: null,
      error: 'Failed to update page. Please try again.'
    };
  }
}

export async function deletePage(id: string): Promise<FetchResult<boolean>> {
  const pb = ensureClient();
  if (!pb) {
    return {
      data: null,
      error: 'PocketBase client not configured.'
    };
  }

  if (!pb.authStore.isValid) {
    return {
      data: null,
      error: 'You must be logged in to delete pages.'
    };
  }

  try {
    await pb.collection('pages').delete(id);
    return { data: true };
  } catch (error) {
    console.error('Failed to delete page', error);
    if (error instanceof ClientResponseError) {
      return {
        data: null,
        error: error.message || 'Failed to delete page.'
      };
    }
    return {
      data: null,
      error: 'Failed to delete page. Please try again.'
    };
  }
}

export async function fetchPageById(id: string): Promise<FetchResult<Page>> {
  const pb = ensureClient();
  if (!pb) {
    return {
      data: null,
      error: 'PocketBase client not configured.'
    };
  }

  try {
    const record = await pb.collection('pages').getOne<PageRecord>(id);
    return { data: mapPage(record) };
  } catch (error) {
    console.error('Failed to fetch page by ID', error);
    if (error instanceof ClientResponseError && error.status === 404) {
      return {
        data: null,
        error: 'Page not found.'
      };
    }
    return {
      data: null,
      error: 'Failed to fetch page. Please try again.'
    };
  }
}

export async function fetchPageForEdit(
  siteId: string,
  path: string
): Promise<FetchResult<Page>> {
  const pb = ensureClient();
  if (!pb) {
    return {
      data: null,
      error: 'PocketBase client not configured.'
    };
  }

  if (!pb.authStore.isValid) {
    return {
      data: null,
      error: 'You must be logged in to edit pages.'
    };
  }

  const normalized = normalizePath(path);
  const sanitizedSiteId = escapeFilterValue(siteId);
  const sanitizedPath = escapeFilterValue(normalized);

  try {
    const filter = `site = "${sanitizedSiteId}" && path = "${sanitizedPath}"`;
    const record = await pb.collection('pages').getFirstListItem<PageRecord>(filter);
    return { data: mapPage(record) };
  } catch (error) {
    if (error instanceof ClientResponseError && error.status === 404) {
      if (!normalized) {
        try {
          const fallback = await pb
            .collection('pages')
            .getFirstListItem<PageRecord>(`site = "${sanitizedSiteId}" && path = "index"`);
          return { data: mapPage(fallback) };
        } catch (fallbackError) {
          if (fallbackError instanceof ClientResponseError && fallbackError.status === 404) {
            return {
              data: null,
              error: 'Page not found.'
            };
          }
          console.error('Failed to fetch page for edit', fallbackError);
          return {
            data: null,
            error: 'Failed to fetch page. Please try again.'
          };
        }
      }

      return {
        data: null,
        error: 'Page not found.'
      };
    }
    console.error('Failed to fetch page for edit', error);
    return {
      data: null,
      error: 'Failed to fetch page. Please try again.'
    };
  }
}
