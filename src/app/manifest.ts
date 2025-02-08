import type { MetadataRoute } from 'next'
 
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Mordor Walk',
    short_name: 'MordorWalk',
    description: 'Seul ou entre amis, allez jusqu\'au Mordor',
    start_url: '/',
    display: 'standalone',
    background_color: '#00C8A0',
    theme_color: '#00C8A0',
    icons: [
      {
        src: './icone.png',
        sizes: '500x500',
        type: 'image/png',
      },
    ],
  }
}