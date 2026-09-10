import { parseCorsOrigins } from './cors-origins';

describe('parseCorsOrigins', () => {
  it('returns a single origin string', () => {
    expect(parseCorsOrigins('https://eventer.world')).toBe(
      'https://eventer.world',
    );
  });

  it('splits a comma-separated list', () => {
    expect(
      parseCorsOrigins(
        'https://eventer.world, https://app.eventer.world',
      ),
    ).toEqual(['https://eventer.world', 'https://app.eventer.world']);
  });
});
