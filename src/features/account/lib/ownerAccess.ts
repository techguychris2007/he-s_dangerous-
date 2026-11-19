import { useAuth } from '../state/authStore';
import { isOwnerEmail } from './ownerSession';

export * from './ownerSession';

export function useIsOwner(): boolean {
  return isOwnerEmail(useAuth().user?.email);
}
