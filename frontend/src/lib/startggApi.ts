import type { ID } from '@/types';

const STARTGG_ENDPOINT = 'https://api.start.gg/gql/alpha';

function normalizeSlug(slug: string): string {
  // start.gg acepta el slug sin el prefijo "tournament/"
  return slug.replace(/^tournament\//, '').replace(/^\//, '');
}

const tournamentAdminsQuery = `
  query TournamentAdmins($slug: String!) {
    tournament(slug: $slug) {
      id
      name
      admins {
        id
        name
        user {
          id
          slug
        }
      }
    }
  }
`;

export interface TournamentAdmin {
  id: ID;
  name?: string;
  user?: { id: ID; slug?: string } | null;
}

export async function getTournamentAdmins(slug: string): Promise<TournamentAdmin[]> {
  const token = import.meta.env.VITE_STARTGG_TOKEN;
  if (!token) {
    console.warn('Missing VITE_STARTGG_TOKEN for start.gg admin lookup');
    return [];
  }

  const normalized = normalizeSlug(slug);

  if (normalized !== slug) {
    console.debug('Normalized tournament slug for admin lookup', { original: slug, normalized });
  }

  const res = await fetch(STARTGG_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ query: tournamentAdminsQuery, variables: { slug: normalized } }),
  });

  if (!res.ok) {
    console.warn('start.gg admin lookup failed', await res.text());
    return [];
  }

  const json = await res.json();
  const admins: TournamentAdmin[] = json?.data?.tournament?.admins || [];
  return admins;
}
