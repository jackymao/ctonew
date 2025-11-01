import type { PageLoad } from './$types';
import { getPageByOwnerAndPath } from '$lib/pocketbase';

export const prerender = false;

export const load: PageLoad = async ({ parent, params }) => {
  const { namespaceUser, namespaceError, username } = await parent();
  const requestedPath = params.path ?? '';

  if (!namespaceUser) {
    return {
      namespaceUser: null,
      page: null,
      pageError: namespaceError ?? 'User could not be found.',
      requestedPath,
      username
    };
  }

  const result = await getPageByOwnerAndPath(namespaceUser.id, requestedPath);

  return {
    namespaceUser,
    page: result.data,
    pageError: result.error,
    requestedPath,
    username
  };
};
