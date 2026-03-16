import { createClient } from './server';
import type { Organization } from '@/lib/types';

export async function getCurrentUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export async function getUserOrganization(): Promise<Organization | null> {
  const supabase = await createClient();
  const user = await getCurrentUser();

  if (!user) return null;

  const { data } = await supabase
    .from('organizations')
    .select('*')
    .eq('user_id', user.id)
    .single();

  return data;
}

export async function requireAuth() {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error('Unauthorized');
  }
  return user;
}

export async function requireOrganization() {
  const org = await getUserOrganization();
  if (!org) {
    throw new Error('No organization found');
  }
  return org;
}
