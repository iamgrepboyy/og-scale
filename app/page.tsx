const demoCards = [
  {
    name: 'Repository card',
    href: '/api/og/repo?owner=vercel&repo=next.js',
  },
  {
    name: 'Commit card',
    href: '/api/og/commit?owner=vercel&repo=next.js&sha=8d8f0b7',
  },
  {
    name: 'Issue card',
    href: '/api/og/issue?owner=vercel&repo=next.js&number=1',
  },
  {
    name: 'Pull request card',
    href: '/api/og/pr?owner=vercel&repo=next.js&number=1',
  },
];

export default function HomePage() {
  return (
    <main className="page-shell">
      <section className="hero">
        <div className="badge">OG Scale</div>
        <h1>Dynamic OpenGraph cards for your GitHub work.</h1>
        <p>
          Generate polished social preview images for repositories, commit hashes, issue threads,
          and pull request updates in seconds.
        </p>
        <div className="actions">
          <a href="/api/og/repo?owner=vercel&repo=next.js">Try repo example</a>
          <a href="https://github.com/iamgrepboyy/og-scale" target="_blank" rel="noreferrer" className="ghost">
            View repo
          </a>
        </div>
      </section>

      <section className="demo-grid">
        {demoCards.map((card) => (
          <a key={card.name} href={card.href} className="demo-card" target="_blank" rel="noreferrer">
            <span>{card.name}</span>
            <code>{card.href}</code>
          </a>
        ))}
      </section>

      <section className="usage-panel">
        <h2>Usage</h2>
        <pre>{`/api/og/repo?owner=OWNER&repo=REPO
/api/og/commit?owner=OWNER&repo=REPO&sha=COMMIT_SHA
/api/og/issue?owner=OWNER&repo=REPO&number=ISSUE_NUMBER
/api/og/pr?owner=OWNER&repo=REPO&number=PR_NUMBER`}</pre>
      </section>
    </main>
  );
}