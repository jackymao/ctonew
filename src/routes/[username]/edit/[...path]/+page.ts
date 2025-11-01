import { redirect } from '@sveltejs/kit';
import { isAuthenticated, getClient, getPageByOwnerAndPath } from '$lib/pocketbase';
import type { PageLoad } from './$types';

export const ssr = false;

export const load: PageLoad = async ({ parent, params }) => {
  const { namespaceUser, username } = await parent();

  if (!isAuthenticated()) {
    const path = params.path ?? '';
    throw redirect(302, `/login?redirect=${encodeURIComponent(`/${username}/edit/${path}`)}`);
  }

  const pb = getClient();
  const currentUserId = pb?.authStore.model?.id;

  if (!currentUserId || !namespaceUser || currentUserId !== namespaceUser.id) {
    throw redirect(302, `/${username}`);
  }

  const requestedPath = params.path ?? '';
  const result = await getPageByOwnerAndPath(namespaceUser.id, requestedPath);

  return {
    namespaceUser,
    username,
    page: result.data,
    pageError: result.error,
    requestedPath
  };
};
