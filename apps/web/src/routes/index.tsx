import { Link, createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/')({ component: LandingPage })

function LandingPage() {
  return (
    <div className="landing">
      <section className="hero container">
        <p className="eyebrow">読書の記録を、あなたの本棚に。</p>
        <h1>読んだ本も、<br /><em>これからの一冊</em>も。</h1>
        <p className="hero-copy">Libraryは、蔵書・読書状態・再読の履歴を<br className="desktop-break" />ひとつの場所で大切に残せるサービスです。</p>
        <Link to="/login" className="button button-primary">Googleで始める <span aria-hidden="true">→</span></Link>
      </section>
      <section className="feature-grid container" aria-label="Libraryの特徴">
        <article className="feature-card"><span className="feature-number">01</span><h2>記録を重ねる</h2><p>読書を始めるたびに新しい記録。再読で変わった気持ちも、過去の自分も残せます。</p></article>
        <article className="feature-card"><span className="feature-number">02</span><h2>本棚を分ける</h2><p>読みたい、読書中、読了。所有状態と読書状態を分けて、今の本棚を正確に。</p></article>
        <article className="feature-card"><span className="feature-number">03</span><h2>公開を選べる</h2><p>自分だけの記録は非公開に。共有したい本と感想だけを、プロフィールに公開できます。</p></article>
      </section>
    </div>
  )
}
