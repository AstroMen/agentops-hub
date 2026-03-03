'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { clearToken, getToken, getUsername } from '../../lib/api';

const links = [
  { href: '/tickets', label: 'Tickets' },
  { href: '/runs', label: 'Runs' },
  { href: '/agents', label: 'Agents' },
];

export default function NavLinks() {
  const router = useRouter();
  const pathname = usePathname();
  const [authState, setAuthState] = useState({
    ready: false,
    isLoggedIn: false,
    username: '',
  });

  useEffect(() => {
    function syncAuthStatus() {
      setAuthState({
        ready: true,
        isLoggedIn: Boolean(getToken()),
        username: getUsername(),
      });
    }

    syncAuthStatus();
    window.addEventListener('storage', syncAuthStatus);
    window.addEventListener('auth-change', syncAuthStatus);
    return () => {
      window.removeEventListener('storage', syncAuthStatus);
      window.removeEventListener('auth-change', syncAuthStatus);
    };
  }, []);

  const navItems = authState.ready && !authState.isLoggedIn
    ? [...links, { href: '/login', label: 'Login' }]
    : links;

  return (
    <nav className="nav-links" aria-label="Primary navigation">
      {navItems.map((link) => {
        const isActive = pathname === link.href;

        return (
          <a
            key={link.href}
            className={`nav-link${isActive ? ' nav-link-active' : ''}`}
            href={link.href}
            aria-current={isActive ? 'page' : undefined}
          >
            {link.label}
          </a>
        );
      })}
      {authState.ready && authState.isLoggedIn && <span className="subtitle" style={{ marginLeft: 8 }}>Hi, {authState.username || 'User'}</span>}
      {authState.ready && authState.isLoggedIn && (
        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => {
            clearToken();
            router.push('/login');
          }}
          style={{ marginLeft: 8 }}
        >
          Logout
        </button>
      )}
    </nav>
  );
}
