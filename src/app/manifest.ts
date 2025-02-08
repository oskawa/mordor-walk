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
      src: "/favicon/web-app-manifest-192x192.png",
      sizes: "192x192",
      type: "image/png",
      purpose: "maskable"
    },
    {
      src: "/favicon/web-app-manifest-512x512.png",
      sizes: "512x512",
      type: "image/png",
      purpose: "maskable"
    }
  ],
  }
}