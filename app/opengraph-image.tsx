import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'Gabo Oreste | Engineering Portfolio';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

const colors = {
    background: '#fff9ee',
    border: '#6d5e0f22',
    textPrimary: '#1e1b13',
    textSecondary: '#6d5e0f',
    grid: '#6d5e0f08',
};

export default async function Image() {
    const geistBold = await fetch(
        new URL('https://github.com/vercel/geist-font/raw/main/packages/next/dist/fonts/geist-sans/Geist-Black.ttf')
    ).then((res) => res.arrayBuffer());

    return new ImageResponse(
        (
            <div style={{
                background: colors.background,
                width: '100%',
                height: '100%',
                display: 'flex',
                flexDirection: 'row',
                position: 'relative',
                overflow: 'hidden'
            }}>
                {/* Background Grid Texture */}
                <div style={{
                    position: 'absolute',
                    inset: 0,
                    display: 'flex',
                    backgroundImage: `linear-gradient(${colors.grid} 1px, transparent 1px), linear-gradient(90deg, ${colors.grid} 1px, transparent 1px)`,
                    backgroundSize: '64px 64px'
                }} />

                {/* LEFT COLUMN */}
                <div style={{
                    width: '30%',
                    height: '100%',
                    borderRight: `2px solid ${colors.border}`,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    padding: '60px 40px',
                    backgroundColor: colors.grid,
                    zIndex: 10
                }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        <div style={{ fontSize: 12, color: colors.textSecondary, opacity: 0.5, fontWeight: 900 }}>IDENTIFIER</div>
                        <div style={{ fontSize: 24, fontWeight: 900, color: colors.textSecondary }}>ORESTE.GABO</div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <div style={{ fontSize: 12, color: colors.textSecondary, opacity: 0.5, fontWeight: 900 }}>VERSION</div>
                            <div style={{ fontSize: 18, fontWeight: 700, color: colors.textPrimary }}>v2026.06</div>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <div style={{ fontSize: 12, color: colors.textSecondary, opacity: 0.5, fontWeight: 900 }}>REGION</div>
                            <div style={{ fontSize: 18, fontWeight: 700, color: colors.textPrimary }}>EU_WEST_1</div>
                        </div>
                    </div>
                </div>

                {/* RIGHT COLUMN */}
                <div style={{
                    width: '70%',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    padding: '0 80px',
                    position: 'relative'
                }}>
                    <div style={{ display: 'flex', flexDirection: 'column', position: 'relative' }}>
                        <div style={{ fontSize: 18, fontWeight: 900, color: colors.textSecondary, letterSpacing: '0.35em', marginBottom: 14 }}>SOFTWARE &</div>
                        <h1 style={{
                            fontSize: 92,
                            fontWeight: 900,
                            margin: 0,
                            lineHeight: 1.05,
                            letterSpacing: '-0.04em',
                            display: 'flex',
                            flexDirection: 'column'
                        }}>
                            <span style={{ color: colors.textPrimary }}>SYSTEMS</span>
                            <span style={{ color: colors.textSecondary }}>ENGINEER</span>
                        </h1>
                    </div>

                    {/* Corner Logo (Standardized sizing) */}
                    <div style={{ position: 'absolute', right: 40, bottom: 40, display: 'flex', opacity: 0.15 }}>
                        <svg width="120" height="120" viewBox="0 0 100 100">
                            <path d="M70 28 H42 L25 50 L42 72 H70 M58 50 H80" stroke={colors.textSecondary} strokeWidth="8" fill="none" />
                            <circle cx="80" cy="50" r="5" fill={colors.textSecondary} />
                        </svg>
                    </div>
                </div>
            </div>
        ),
        {
            ...size,
            fonts: [
                {
                    name: 'Geist',
                    data: geistBold,
                    style: 'normal',
                    weight: 900,
                },
            ],
        }
    );
}
