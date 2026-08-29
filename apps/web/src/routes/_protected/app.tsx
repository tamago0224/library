import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_protected/app')({ component: DashboardPage })

function DashboardPage() {
  const { user } = Route.useRouteContext()
  return (
    <section className="dashboard container">
      <p className="eyebrow">YOUR LIBRARY</p>
      <h1>おかえりなさい、{user.name}さん。</h1>
      <div className="dashboard-empty">
        <div className="empty-mark" aria-hidden="true">✦</div>
        <h2>あなたの本棚をつくりましょう</h2>
        <p>本の検索や読書記録は、次のアップデートでご利用いただけます。<br />まずはプロフィールを設定して、あなたのLibraryを始めましょう。</p>
        <button type="button" className="button button-secondary" disabled>本を探す（準備中）</button>
      </div>
    </section>
  )
}
