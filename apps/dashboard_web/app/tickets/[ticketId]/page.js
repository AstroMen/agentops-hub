'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { apiFetch, getToken } from '../../../lib/api';

const emptyForm = {
  title: '',
  description: '',
  type: '',
  priority: 'P2',
  assigned_agent: '',
};

export default function TicketEditPage() {
  const params = useParams();
  const router = useRouter();
  const ticketId = useMemo(() => params?.ticketId, [params]);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.push('/login');
      return;
    }

    async function loadTicket() {
      try {
        setError('');
        const ticket = await apiFetch(`/tickets/${ticketId}`);
        setForm({
          title: ticket.title,
          description: ticket.description,
          type: ticket.type,
          priority: ticket.priority,
          assigned_agent: ticket.assigned_agent,
        });
      } catch (err) {
        setError(String(err.message));
      } finally {
        setLoading(false);
      }
    }

    if (ticketId) {
      loadTicket();
    }
  }, [router, ticketId]);

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      setMessage('');
      setError('');
      await apiFetch(`/tickets/${ticketId}`, {
        method: 'PUT',
        body: JSON.stringify(form),
      });
      setMessage('Ticket updated successfully.');
    } catch (err) {
      setError(String(err.message));
    }
  }

  return (
    <section className="card" style={{ maxWidth: 900 }}>
      <div className="controls" style={{ justifyContent: 'space-between', marginBottom: 12 }}>
        <h2 style={{ margin: 0 }}>Edit Ticket #{ticketId}</h2>
        <Link className="btn btn-secondary" href="/tickets">Back to board</Link>
      </div>

      {loading ? (
        <p className="subtitle">Loading ticket...</p>
      ) : (
        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 10 }}>
          <input className="input" placeholder="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
          <textarea className="textarea" placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} required />
          <div style={{ display: 'grid', gap: 8, gridTemplateColumns: 'repeat(3, minmax(160px, 1fr))' }}>
            <input className="input" placeholder="Type" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} required />
            <select className="select" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
              <option value="P0">P0</option>
              <option value="P1">P1</option>
              <option value="P2">P2</option>
              <option value="P3">P3</option>
            </select>
            <input className="input" placeholder="Assigned agent" value={form.assigned_agent} onChange={(e) => setForm({ ...form, assigned_agent: e.target.value })} required />
          </div>

          <div className="controls">
            <button className="btn" type="submit">Save changes</button>
            {message && <small className="message-success">{message}</small>}
          </div>
        </form>
      )}

      {error && <p className="message-error">{error}</p>}
    </section>
  );
}
