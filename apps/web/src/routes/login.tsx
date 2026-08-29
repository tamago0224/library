import { createFileRoute, Link } from '@tanstack/react-router'
import { useState } from 'react'
import { authClient } from '../lib/auth-client'

export const Route = createFileRoute('/login')({ component: LoginPage })

function LoginPage() {
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function signIn() {
    setError(null)
    setLoading(true)
    try {
      await authClient.signIn.social({ provider: 'google', callbackURL: '/app' })
    } catch {
      setError('ログインを開始できませんでした。設定を確認して、もう一度お試しください。')
      setLoading(false)
    }
  }

  return (
    <section className="auth-page container">
      <div className="auth-card">
        <p className="eyebrow">WELCOME TO LIBRARY</p>
        <h1>あなたの読書を、<br /><em>あなたのペースで。</em></h1>
        <p>Googleアカウントでログインして、読書の記録を始めましょう。</p>
        <button type="button" className="button button-primary button-wide" onClick={signIn} disabled={loading}>
          {loading ? '接続しています…' : 'Googleでログイン'}
        </button>
        {error && <p role="alert" className="form-error">{error}</p>}
        <p className="auth-note">ログイン後の初回設定で、年齢確認と利用規約・プライバシーポリシーへの同意を行います。</p>
        <Link to="/" className="back-link">← ホームへ戻る</Link>
      </div>
    </section>
  )
}
