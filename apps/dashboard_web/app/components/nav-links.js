'use client';

import { usePathname } from 'next/navigation';

const links = [
  { href: '/tickets', label: 'Tickets' },
  { href: '/runs', label: 'Runs' },
  { href: '/login', label: 'Login' },
];

export default function NavLinks() {
  const pathname = usePathname();

  return (
    <nav className="nav-links" aria-label="Primary navigation">
      {links.map((link) => {
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
    </nav>
  );
}
