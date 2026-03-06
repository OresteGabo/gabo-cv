import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
    return [
        {
            url: 'https://orestegabo.dev',
            lastModified: new Date(),
            changeFrequency: 'monthly',
            priority: 1,
        },
        // Si tu ajoutes des pages plus tard (ex: /blog ou /projects),
        // tu les ajouteras simplement ici.
    ]
}