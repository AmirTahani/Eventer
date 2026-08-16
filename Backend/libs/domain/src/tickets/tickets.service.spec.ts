import { signTicketQrToken, verifyTicketQrToken } from './tickets.service';

describe('ticket QR HMAC', () => {
  const secret = 'test-ticket-qr-secret!!';

  it('signs and verifies a token', () => {
    const token = signTicketQrToken('tkt-1', secret);
    expect(verifyTicketQrToken(token, secret)).toBe('tkt-1');
  });

  it('rejects a forged token', () => {
    const token = signTicketQrToken('tkt-1', secret);
    const forged = token.replace(/.$/, token.endsWith('a') ? 'b' : 'a');
    expect(verifyTicketQrToken(forged, secret)).toBeNull();
    expect(verifyTicketQrToken('tkt-1.deadbeef', secret)).toBeNull();
    expect(verifyTicketQrToken('not-a-token', secret)).toBeNull();
  });
});
