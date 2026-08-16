import { parseInviteStartPayload } from './deep-link';

describe('parseInviteStartPayload', () => {
  it('extracts token from invite_<token>', () => {
    expect(parseInviteStartPayload('invite_abc123XYZ')).toBe('abc123XYZ');
  });

  it('accepts start=invite_ prefix', () => {
    expect(parseInviteStartPayload('start=invite_tok_1')).toBe('tok_1');
  });

  it('returns null for empty /start', () => {
    expect(parseInviteStartPayload(undefined)).toBeNull();
    expect(parseInviteStartPayload('')).toBeNull();
    expect(parseInviteStartPayload('   ')).toBeNull();
  });

  it('returns null for unrelated payloads', () => {
    expect(parseInviteStartPayload('hello')).toBeNull();
    expect(parseInviteStartPayload('invite_')).toBeNull();
    expect(parseInviteStartPayload('invite token')).toBeNull();
  });
});
