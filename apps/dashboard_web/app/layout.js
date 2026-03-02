export const metadata = { title: 'AgentOps Dashboard' };

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body style={{ fontFamily: 'Arial, sans-serif', margin: '1rem 2rem' }}>
        <h1>AgentOps Dashboard</h1>
        <nav style={{ display: 'flex', gap: 16, marginBottom: 12 }}>
          <a href="/tickets">Tickets</a>
          <a href="/runs">Runs</a>
        </nav>
        {children}
      </body>
    </html>
  );
}
