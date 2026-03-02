'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { setToken } from '../../lib/api';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin');
  const [error, setError] = useState('');

  function handleLogin(e) {
    e.preventDefault();

    const adminToken = process.env.NEXT_PUBLIC_ADMIN_TOKEN || 'admin-dev-token';
    const memberToken = process.env.NEXT_PUBLIC_MEMBER_TOKEN || 'member-dev-token';

    if (username === 'admin' && password === 'admin') {
      setToken(adminToken, 'admin');
      setError('');
      router.push('/tickets');
      return;
    }
    if (username === 'member' && password === 'member') {
      setToken(memberToken, 'member');
      setError('');
      router.push('/tickets');
      return;
    }
    setError('Invalid credentials. Use admin/admin or member/member.');
  }

  return (
    <section className="card" style={{ maxWidth: 420, margin: '0 auto' }}>
      <h2 style={{ marginTop: 0 }}>Login</h2>
      <p className="subtitle">Sign in to access dashboard actions.</p>
      <form onSubmit={handleLogin} style={{ display: 'grid', gap: 10, marginTop: 12 }}>
        <input className="input" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Username" />
        <input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" />
        <button className="btn" type="submit">Sign in</button>
      </form>
      {error && <p className="message-error">{error}</p>}
    </section>
  );
}
