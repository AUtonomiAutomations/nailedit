import Logo from './Logo';
export default function AuthShell({ children, aside }: { children: React.ReactNode; aside?: React.ReactNode }) {
  return (
    <main className="container" style={{ maxWidth: 980, paddingBlock: '36px 64px' }}>
      <div style={{ marginBottom: 28 }}><Logo /></div>
      <div className="grid g2" style={{ alignItems: 'start', gap: 32 }}>
        <div className="card raised">{children}</div>
        {aside && <div className="stack">{aside}</div>}
      </div>
    </main>
  );
}
