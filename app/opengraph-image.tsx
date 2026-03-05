import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'Gabo Oreste | Engineering Portfolio';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function Image() {
    // Optional: Fetch a font to make it look premium
    // If you skip this, it uses a basic system font
    const geistBold = await fetch(
        new URL('https://github.com/vercel/geist-font/raw/main/packages/next/dist/fonts/geist-sans/Geist-Black.ttf')
    ).then((res) => res.arrayBuffer());

    return new ImageResponse(
        (
            <div
                style={{
                    background: 'rgb(255 249 238)',
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '24px solid rgb(109 94 15)', // Thick frame for impact
                    padding: '40px',
                }}
            >
                {/* Visual Background Element (Subtle Grid) */}
                <div style={{
                    position: 'absolute',
                    inset: 0,
                    opacity: 0.05,
                    backgroundImage: 'radial-gradient(circle, rgb(109 94 15) 2px, transparent 2px)',
                    backgroundSize: '40px 40px',
                }} />

                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
                    <h1 style={{
                        fontSize: 90,
                        fontWeight: 900,
                        color: 'rgb(30 27 19)',
                        margin: 0,
                        letterSpacing: '-0.05em'
                    }}>
                        SYSTEMS ARCHITECT
                    </h1>
                    <p style={{
                        fontSize: 34,
                        color: 'rgb(109 94 15)',
                        marginTop: 10,
                        fontWeight: 600,
                        textTransform: 'uppercase',
                        letterSpacing: '0.1em'
                    }}>
                        Oreste MUHIRWA GABO • Fullstack & DevOps
                    </p>
                </div>

                <div style={{ display: 'flex', gap: 30, marginTop: 60, position: 'relative' }}>
                    <div style={{
                        padding: '12px 24px',
                        borderRadius: 12,
                        border: '3px dashed #ba1a1a',
                        color: '#ba1a1a',
                        fontSize: 24,
                        fontWeight: 'bold'
                    }}>
                        Legacy Audit
                    </div>
                    {/* The "Arrow" or Link icon would go here in a real UI,
                        but we can simulate it with a simple character */}
                    <div style={{ fontSize: 40, color: 'rgb(109 94 15)', display: 'flex', alignItems: 'center' }}>→</div>
                    <div style={{
                        padding: '12px 24px',
                        borderRadius: 12,
                        background: 'rgb(109 94 15)',
                        color: 'white',
                        fontSize: 24,
                        fontWeight: 'bold',
                        boxShadow: '0 10px 20px rgba(109, 94, 15, 0.2)'
                    }}>
                        V2 Deployment
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