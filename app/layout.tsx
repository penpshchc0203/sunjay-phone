import type { Metadata, Viewport } from 'next'
import { Geist, Noto_Sans_KR } from 'next/font/google'
import './globals.css'

const geist = Geist({ subsets: ['latin'], variable: '--font-geist' })
const notoSansKr = Noto_Sans_KR({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-noto-kr',
})

export const metadata: Metadata = {
  title: '박종성의 휴대폰',
  description: '제이선우 사랑 이야기',
  generator: 'v0.app',
  icons: {
    icon: [
      {
        url: '/sunjay-phone/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/sunjay-phone/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/sunjay-phone/icon-light-32x32.png',
        type: 'image/svg+xml',
      },
    ],
    apple: '/sunjay-phone/apple-icon.png',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#000000',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ko" className={`${geist.variable} ${notoSansKr.variable}`}>
      <body className="font-sans antialiased">
        {children}
      </body>
    </html>
  )
}
