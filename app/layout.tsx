import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '词格使用手册｜北艾sama',
  description: '词格中文翻填助手的完整使用文档：发音格、吸收、连读、音频与 LRC、盲听打点和工程导入。',
  openGraph: {
    title: '词格使用手册',
    description: '把听见的每一个音，稳稳放进中文里。',
    images: [{ url: '/og.png', width: 1200, height: 630, alt: '词格使用手册' }],
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
