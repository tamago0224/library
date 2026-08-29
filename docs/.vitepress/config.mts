import { defineConfig } from 'vitepress'

const base = process.env.BASE_PATH || '/'

export default defineConfig({
  lang: 'ja-JP',
  title: 'Library Specification',
  description: '一般公開を目指す読書管理サービス Library のプロダクト仕様',
  base,
  cleanUrls: true,
  lastUpdated: true,
  head: [
    ['meta', { name: 'theme-color', content: '#183e36' }],
    ['meta', { property: 'og:type', content: 'website' }],
    ['meta', { property: 'og:locale', content: 'ja_JP' }],
  ],
  themeConfig: {
    logo: {
      light: '/logo.svg',
      dark: '/logo.svg',
      alt: 'Library',
    },
    nav: [
      { text: '概要', link: '/' },
      { text: '仕様', link: '/product-requirements' },
      { text: '設計', link: '/architecture' },
      { text: 'ロードマップ', link: '/roadmap' },
    ],
    sidebar: [
      {
        text: 'Library',
        items: [
          { text: '概要', link: '/' },
          { text: 'プロダクト仕様', link: '/product-requirements' },
          { text: 'ドメインモデル', link: '/domain-model' },
          { text: '技術設計', link: '/architecture' },
          { text: 'ロードマップ', link: '/roadmap' },
          { text: '決定事項', link: '/decisions' },
        ],
      },
    ],
    search: { provider: 'local' },
    outline: {
      level: [2, 3],
      label: 'このページの内容',
    },
    docFooter: {
      prev: '前のページ',
      next: '次のページ',
    },
    lastUpdated: {
      text: '最終更新',
      formatOptions: {
        dateStyle: 'long',
        timeStyle: 'short',
      },
    },
    returnToTopLabel: 'ページ上部へ戻る',
    sidebarMenuLabel: 'メニュー',
    darkModeSwitchLabel: 'テーマ',
    lightModeSwitchTitle: 'ライトテーマへ切り替え',
    darkModeSwitchTitle: 'ダークテーマへ切り替え',
    notFound: {
      title: 'ページが見つかりません',
      quote: 'URLが変更されたか、ページが削除された可能性があります。',
      linkLabel: 'トップへ戻る',
      linkText: 'トップへ戻る',
    },
    footer: {
      message: 'Product specification for Library.',
      copyright: '© Library project',
    },
  },
})
