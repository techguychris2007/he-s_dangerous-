import { useAuth } from '../../features/account/state/authStore';

export { isVisitorPath } from './visitorPaths';

/** True once sign-in has resolved and nobody with an account is signed in. */
export function useIsVisitor(): boolean {
  const auth = useAuth();
  return !auth.loading && (!auth.user || Boolean(auth.user.is_anonymous));
}
