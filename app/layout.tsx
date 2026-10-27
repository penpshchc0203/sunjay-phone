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
  description: '캐릭터의 가상 스마트폰을 직접 조작해 보는 인터랙티브 팬 콘텐츠',
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
        url: '/sunjay-phone/icon.svg',
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
