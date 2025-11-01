import { redirect } from '@sveltejs/kit';
import { isAuthenticated, getClient } from '$lib/pocketbase';
import type { PageLoad } from './$types';

export const ssr = false;

export const load: PageLoad = async ({ parent, params, url }) => {
  const { namespaceUser, username } = await parent();

  if (!isAuthenticated()) {
    const redirectTo = `/login?redirect=${encodeURIComponent(url.pathname + url.search)}`;
    throw redirect(302, redirectTo);
  }

  const pb = getClient();
  const currentUserId = pb?.authStore.model?.id;

  if (!currentUserId || !namespaceUser || currentUserId !== namespaceUser.id) {
    throw redirect(302, `/${username}`);
  }

  return {
    namespaceUser,
    username,
    initialPath: url.searchParams.get('path') ?? ''
  };
};
