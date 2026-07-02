import { Button } from '@ramps/ui/Button';

export default function HomePage() {
  return (
    <main
      style={{
        display: 'flex',
        minHeight: '100dvh',
        flexDirection: 'column',
        alignItems: 'flex-start',
        gap: 'var(--rui-space-4)',
        padding: 'var(--rui-space-4)',
        background: 'var(--rui-limestone)',
        color: 'var(--rui-ink)',
        fontFamily: 'var(--rui-font-sans)',
        fontWeight: 'var(--rui-font-weight-body)',
      }}
    >
      <h1 style={{ fontWeight: 'var(--rui-font-weight-heading)' }}>ramps — payables</h1>
      <p>Monorepo scaffold is live. The golden path lands next.</p>
      <Button>Get started</Button>
    </main>
  );
}
