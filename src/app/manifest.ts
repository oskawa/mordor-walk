import type { MetadataRoute } from 'next'
 
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Mordor Walk',
    short_name: 'MordorWalk',
    description: 'Seul ou entre amis, allez jusqu\'au Mordor',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#000000',
    icons: [
      {
        src: '/icone.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icone.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  }
}