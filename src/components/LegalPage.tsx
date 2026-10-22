import { SiteFooter, SiteHeader } from './SiteChrome';

export default function LegalPage({ title, updated, children }: { title: string; updated: string; children: React.ReactNode }) {
  return (
    <>
      <SiteHeader />
      <main className="container narrow page legal">
        <h1 style={{ fontSize: 34, marginBottom: 6 }}>{title}</h1>
        <p className="muted small" style={{ marginBottom: 28 }}>עדכון אחרון: {updated}</p>
        {children}
      </main>
      <SiteFooter />
    </>
  );
}
