import { ImageResponse } from 'next/og';

export const size = { width: 180, height: 180 };
export const contentType = 'image/png';

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#0F766E',
          color: '#F8FAFA',
          fontSize: 110,
          fontWeight: 700,
          letterSpacing: -4,
        }}
      >
        E
      </div>
    ),
    { ...size },
  );
}
