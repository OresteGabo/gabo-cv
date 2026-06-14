import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
    return {
        name: 'Gabo Oreste | Software & Systems Engineer',
        short_name: 'GABO.',
        description: 'Secure mobile platforms, backend services, realtime systems, and selected engineering projects.',
        start_url: '/',
        display: 'standalone',
        background_color: '#fff9ee',
        theme_color: '#6d5e0f',
        icons: [
            {
                src: '/apple-icon.png',
                sizes: '180x180',
                type: 'image/png',
            },
        ],
    }
}
