'use client';

import { useEffect, useMemo, useState } from 'react';
import { apiFetch, getToken } from '../../lib/api';

const columns = ['PENDING_APPROVAL', 'APPROVED', 'QUEUED', 'RUNNING', 'DONE', 'FAILED'];

const defaultForm = {
  title: '',
  description: '',
  type: 'feature',
  priority: 'P2',
  assigned_agent: 'dashboard-dev',
};

export default function TicketsPage() {
  const [token, setToken] = useState('');
  const [tickets, setTickets] = useState([]);
  const [error, setError] = useState('');
  const [form, setForm] = useState(defaultForm);
  const [formMessage, setFormMessage] = useState('');

  const isAdmin = token && token === (process.env.NEXT_PUBLIC_ADMIN_TOKEN || 'admin-dev-token');

  async function loadTickets() {
    try {
      setError('');
      const data = await apiFetch('/tickets');
      setTickets(data);
    } catch (e) {
      setError(String(e.message));
    }
  }

  async function action(id, act) {
    await apiFetch(`/tickets/${id}/${act}`, { method: 'POST', body: JSON.stringify({}) });
    await loadTickets();
  }

  async function createTicket(e) {
    e.preventDefault();
    try {
      setFormMessage('');
      await apiFetch('/tickets', { method: 'POST', body: JSON.stringify(form) });
      setForm(defaultForm);
      setFormMessage('Ticket created');
      await loadTickets();
    } catch (err) {
      setFormMessage(`Create failed: ${String(err.message)}`);
    }
  }

  useEffect(() => {
    const t = getToken();
    setToken(t);
    if (t) loadTickets();
  }, []);

  const grouped = useMemo(() => {
    const g = Object.fromEntries(columns.map((c) => [c, []]));
    tickets.forEach((t) => g[t.status]?.push(t));
    return g;
  }, [tickets]);

  return (
    <div style={{ display: 'grid', gap: '1rem' }}>
      <section className="card">
        <h2 style={{ marginTop: 0 }}>Tickets Board</h2>
        <p className="subtitle">创建工单并推动状态流转。管理员 token 可进行审批与队列操作。</p>
        <div className="controls" style={{ marginTop: '.5rem' }}>
          <input
            className="input"
            style={{ maxWidth: 300 }}
            placeholder="paste dev token"
            defaultValue={token}
            onBlur={(e) => {
              localStorage.setItem('dashboard_token', e.target.value);
              setToken(e.target.value);
            }}
          />
          <button className="btn" onClick={loadTickets}>Load</button>
        </div>
      </section>

      <form className="card" onSubmit={createTicket}>
        <h3 style={{ marginTop: 0 }}>Create ticket</h3>
        <div style={{ display: 'grid', gap: 10, maxWidth: 820 }}>
          <input className="input" placeholder="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
          <textarea className="textarea" placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} required />
          <div style={{ display: 'grid', gap: 8, gridTemplateColumns: 'repeat(3, minmax(160px, 1fr))' }}>
            <input className="input" placeholder="Type" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} />
            <select className="select" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
              <option value="P0">P0</option>
              <option value="P1">P1</option>
              <option value="P2">P2</option>
              <option value="P3">P3</option>
            </select>
            <input
              className="input"
              placeholder="Assigned agent"
              value={form.assigned_agent}
              onChange={(e) => setForm({ ...form, assigned_agent: e.target.value })}
            />
          </div>
          <div className="controls">
            <button className="btn" type="submit">Create</button>
            {formMessage && <small className={formMessage.startsWith('Create failed') ? 'message-error' : 'message-success'}>{formMessage}</small>}
          </div>
        </div>
      </form>

      {error && <p className="message-error">{error}</p>}
      <section className="board">
        {columns.map((col) => (
          <div key={col} className="column">
            <h4>{col}</h4>
            {grouped[col].map((t) => (
              <article key={t.id} className="ticket">
                <div className="ticket-title">#{t.id} {t.title}</div>
                <div className="ticket-meta">{t.type} / {t.priority}</div>
                {isAdmin && (
                  <div className="controls" style={{ marginTop: 8 }}>
                    {t.status === 'PENDING_APPROVAL' && (
                      <>
                        <button className="btn btn-secondary" onClick={() => action(t.id, 'approve')}>Approve</button>
                        <button className="btn btn-danger" onClick={() => action(t.id, 'reject')}>Reject</button>
                      </>
                    )}
                    {t.status === 'APPROVED' && <button className="btn btn-secondary" onClick={() => action(t.id, 'queue')}>Queue</button>}
                  </div>
                )}
              </article>
            ))}
          </div>
        ))}
      </section>
    </div>
  );
}
