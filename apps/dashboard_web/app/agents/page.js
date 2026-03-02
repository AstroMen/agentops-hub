'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch, getToken } from '../../lib/api';

const emptyForm = { name: '', description: '', is_active: true };

export default function AgentsPage() {
  const router = useRouter();
  const [agents, setAgents] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    // Check admin status on client side only
    const token = getToken();
    setIsAdmin(token === (process.env.NEXT_PUBLIC_ADMIN_TOKEN || 'admin-dev-token'));
    
    if (!token) {
      router.push('/login');
      return;
    }
    loadAgents().catch((err) => setError(String(err.message)));
  }, [router]);

  async function loadAgents() {
    const data = await apiFetch('/agents');
    setAgents(data);
  }

  async function submitForm(e) {
    e.preventDefault();
    if (!isAdmin) {
      setError('Only admin can manage agents.');
      return;
    }
    setError('');
    try {
      if (editingId) {
        await apiFetch(`/agents/${editingId}`, { method: 'PUT', body: JSON.stringify(form) });
      } else {
        await apiFetch('/agents', { method: 'POST', body: JSON.stringify(form) });
      }
      setForm(emptyForm);
      setEditingId(null);
      await loadAgents();
    } catch (err) {
      setError(String(err.message));
    }
  }

  async function deleteAgent(id) {
    if (!isAdmin) {
      setError('You do not have permission to delete agents. Please login as admin.');
      return;
    }
    try {
      await apiFetch(`/agents/${id}`, { method: 'DELETE' });
      await loadAgents();
    } catch (err) {
      setError(String(err.message));
    }
  }

  return (
    <div style={{ display: 'grid', gap: '1rem' }}>
      <section className="card">
        <h2 style={{ marginTop: 0 }}>Agent Management</h2>
        <p className="subtitle">Admins can create, update, and delete available agents.</p>
        {!isAdmin && <p className="message-error">Your account is read-only on this page. Please login as admin to manage agents.</p>}
      </section>

      {isAdmin && (
        <form className="card" onSubmit={submitForm} style={{ display: 'grid', gap: 10, maxWidth: 760 }}>
          <h3 style={{ marginTop: 0 }}>{editingId ? 'Edit agent' : 'Create agent'}</h3>
          <input className="input" placeholder="Agent name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          <textarea className="textarea" placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <label style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} />
            Active
          </label>
          <div className="controls">
            <button className="btn" type="submit">{editingId ? 'Update' : 'Create'}</button>
            {editingId && <button type="button" className="btn btn-secondary" onClick={() => { setEditingId(null); setForm(emptyForm); }}>Cancel</button>}
          </div>
        </form>
      )}

      {error && <p className="message-error">{error}</p>}

      <section className="card">
        <h3 style={{ marginTop: 0 }}>Agents</h3>
        <div style={{ display: 'grid', gap: 8 }}>
          {agents.map((agent) => (
            <article key={agent.id} className="ticket" style={{ display: 'grid', gap: 6 }}>
              <div className="ticket-title">{agent.name}</div>
              <div className="ticket-meta">{agent.is_active ? 'Active' : 'Inactive'}</div>
              {agent.description && <div style={{ whiteSpace: 'pre-wrap' }}>{agent.description}</div>}
              <div className="controls">
                <button
                  className="btn btn-secondary"
                  onClick={() => {
                    if (!isAdmin) {
                      setError('You do not have permission to edit agents. Please login as admin.');
                      return;
                    }
                    setEditingId(agent.id);
                    setForm({ name: agent.name, description: agent.description || '', is_active: agent.is_active });
                  }}
                >
                  Edit
                </button>
                <button className="btn btn-danger" onClick={() => deleteAgent(agent.id)}>Delete</button>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
