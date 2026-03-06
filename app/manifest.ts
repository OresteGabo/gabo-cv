import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
    return {
        name: 'Gabo Oreste | Ingénieur Fullstack & DevOps',
        short_name: 'GABO',
        description: 'Portfolio d’architecture système V2',
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