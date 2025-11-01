import { getUserByUsername } from '$lib/pocketbase';
import type { LayoutLoad } from './$types';

export const ssr = false;
export const prerender = false;

export const load: LayoutLoad = async ({ params }) => {
  const username = params.username;
  const result = await getUserByUsername(username);

  return {
    namespaceUser: result.data,
    namespaceError: result.error,
    username
  };
};
