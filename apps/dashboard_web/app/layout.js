import './globals.css';

import NavLinks from './components/nav-links';

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
            <NavLinks />
          </header>
          {children}
        </main>
      </body>
    </html>
  );
}
