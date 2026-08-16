import { SelfOnlyGuard } from './self-only.guard';
import { AuthUser } from './policies';

describe('SelfOnlyGuard (IDOR protection)', () => {
  const guard = new SelfOnlyGuard();

  function ctx(user: AuthUser | undefined, id?: string) {
    return {
      switchToHttp: () => ({
        getRequest: () => ({ user, params: { id } }),
      }),
    } as never;
  }

  const me: AuthUser = {
    id: 'user-1',
    telegramUserId: '1',
    firstName: 'A',
    lastName: null,
    telegramUsername: null,
    locale: 'en',
    status: 'APPROVED',
    roles: [],
  };

  it('allows /users/me without id param', () => {
    expect(guard.canActivate(ctx(me))).toBe(true);
  });

  it('blocks accessing another user id', () => {
    expect(() => guard.canActivate(ctx(me, 'user-2'))).toThrow(/IDOR/);
  });
});
