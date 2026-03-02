import './globals.css';

export const metadata = { title: 'AgentOps Dashboard' };

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <main className="app-shell">
          <header className="header-card">
            <div>
              <h1 className="page-title">AgentOps Dashboard</h1>
              <p className="subtitle">Track tickets, approvals and execution runs in one place.</p>
            </div>
            <nav className="nav-links">
              <a className="nav-link" href="/tickets">Tickets</a>
              <a className="nav-link" href="/runs">Runs</a>
              <a className="nav-link" href="/login">Login</a>
            </nav>
          </header>
          {children}
        </main>
      </body>
    </html>
  );
}
