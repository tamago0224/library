/// <reference types="vite/client" />
import { HeadContent, Link, Outlet, Scripts, createRootRoute } from '@tanstack/react-router'
import appCss from '../styles/app.css?url'

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { title: 'Library — 読書の記録を、あなたの本棚に' },
      { name: 'description', content: '蔵書と読書の記録を、自分らしく管理するLibrary' },
    ],
    links: [{ rel: 'stylesheet', href: appCss }],
  }),
  component: RootDocument,
})

function RootDocument() {
  return (
    <html lang="ja">
      <head><HeadContent /></head>
      <body>
        <header className="site-header">
          <div className="container header-inner">
            <Link to="/" className="brand" aria-label="Library ホーム">Library</Link>
            <nav aria-label="メインナビゲーション">
              <Link to="/login" className="nav-link">ログイン</Link>
            </nav>
          </div>
        </header>
        <main><Outlet /></main>
        <footer className="site-footer"><div className="container">Library — 読書を、もっと自分らしく。</div></footer>
        <Scripts />
      </body>
    </html>
  )
}
