import { ImageResponse } from 'next/og';

export const alt = 'Eventer — invite-only private events on Telegram';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          backgroundColor: '#0E1116',
          color: '#E8EDF4',
          padding: 72,
        }}
      >
        <div style={{ fontSize: 28, letterSpacing: -0.5, color: '#2DD4BF' }}>
          Eventer
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div
            style={{
              fontSize: 64,
              lineHeight: 1.1,
              letterSpacing: -1.5,
              maxWidth: 900,
            }}
          >
            The room stays closed until you open it.
          </div>
          <div style={{ fontSize: 28, color: '#9AA6B8', maxWidth: 760 }}>
            Invite-only events. Guests in Telegram. Hosts on the web.
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
