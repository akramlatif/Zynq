import { NextPageContext } from 'next';

type ErrorPageProps = {
  statusCode?: number;
};

function ErrorPage({ statusCode }: ErrorPageProps) {
  return (
    <main style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: '2rem', background: '#f8fafc', color: '#0f172a', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ maxWidth: '32rem', textAlign: 'center' }}>
        <p style={{ marginBottom: '0.75rem', fontSize: '0.875rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#0f766e' }}>Zynq</p>
        <h1 style={{ margin: 0, fontSize: '2.5rem', lineHeight: 1.1 }}>Something went wrong</h1>
        <p style={{ marginTop: '1rem', fontSize: '1rem', color: '#475569' }}>
          {statusCode ? `Server returned ${statusCode}.` : 'The page could not be rendered.'}
        </p>
      </div>
    </main>
  );
}

ErrorPage.getInitialProps = ({ res, err }: NextPageContext) => {
  const statusCode = res?.statusCode ?? err?.statusCode ?? 404;
  return { statusCode };
};

export default ErrorPage;