'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch, getRole, getToken } from '../../lib/api';

const columns = ['PENDING_APPROVAL', 'APPROVED', 'QUEUED', 'RUNNING', 'DONE', 'FAILED'];

const TICKET_TYPES = ['Bug', 'Improvement', 'Documentation Needed', 'Task', 'New Feature'];

const defaultForm = {
  title: '',
  description: '',
  type: '',
  priority: '',
  project_id: '',
  assigned_agent: '',
};

export default function TicketsPage() {
  const router = useRouter();
  const [tickets, setTickets] = useState([]);
  const [error, setError] = useState('');
  const [form, setForm] = useState(defaultForm);
  const [formMessage, setFormMessage] = useState('');
  const [agents, setAgents] = useState([]);
  const [projects, setProjects] = useState([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [authReady, setAuthReady] = useState(false);

  async function loadAgents() {
    const data = await apiFetch('/agents');
    setAgents(data.filter((agent) => agent.is_active));
  }

  async function loadProjects() {
    const data = await apiFetch('/projects');
    setProjects(data.filter((project) => project.is_active));
  }

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
    if (!form.type || !form.priority || !form.assigned_agent || !form.project_id) {
      setFormMessage('Create failed: Please select type, priority, project, and agent.');
      return;
    }

    try {
      setFormMessage('');
      await apiFetch('/tickets', { method: 'POST', body: JSON.stringify({ ...form, project_id: Number(form.project_id) }) });
      setForm(defaultForm);
      setFormMessage('Ticket created');
      await loadTickets();
    } catch (err) {
      setFormMessage(`Create failed: ${String(err.message)}`);
    }
  }

  useEffect(() => {
    const t = getToken();
    setIsAdmin(getRole() === 'admin');
    setAuthReady(true);

    if (!t) {
      router.push('/login');
      return;
    }
    Promise.all([loadTickets(), loadAgents(), loadProjects()]);
  }, [router]);

  const projectNameMap = useMemo(
    () => Object.fromEntries(projects.map((project) => [project.id, project.name])),
    [projects],
  );

  const grouped = useMemo(() => {
    const g = Object.fromEntries(columns.map((c) => [c, []]));
    tickets.forEach((t) => g[t.status]?.push(t));
    return g;
  }, [tickets]);

  return (
    <div style={{ display: 'grid', gap: '1rem' }}>
      <section className="card">
        <h2 style={{ marginTop: 0 }}>Tickets Board</h2>
        <p className="subtitle">Create tickets and move them through status transitions.</p>
        {authReady && !isAdmin && <p className="message-error">You do not have permission to create tickets with this account.</p>}
        <div className="controls" style={{ marginTop: '.5rem' }}>
          <button className="btn" onClick={loadTickets}>Refresh</button>
        </div>
      </section>

      {authReady && isAdmin && (
        <form className="card" onSubmit={createTicket}>
          <h3 style={{ marginTop: 0 }}>Create ticket</h3>
          <div style={{ display: 'grid', gap: 10, maxWidth: 900 }}>
            <input className="input" placeholder="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
            <textarea className="textarea" placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} required />
            <div style={{ display: 'grid', gap: 8, gridTemplateColumns: 'repeat(4, minmax(160px, 1fr))' }}>
              <select className="select" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} required>
                <option value="">Select type</option>
                {TICKET_TYPES.map((typeOption) => <option key={typeOption} value={typeOption}>{typeOption}</option>)}
              </select>
              <select className="select" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })} required>
                <option value="">Select priority</option>
                <option value="P0">P0</option>
                <option value="P1">P1</option>
                <option value="P2">P2</option>
                <option value="P3">P3</option>
              </select>
              <select className="select" value={form.project_id} onChange={(e) => setForm({ ...form, project_id: e.target.value })} required>
                <option value="">Select project</option>
                {projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}
              </select>
              <select className="select" value={form.assigned_agent} onChange={(e) => setForm({ ...form, assigned_agent: e.target.value })} required>
                <option value="">Select agent</option>
                {agents.map((agent) => <option key={agent.id} value={agent.name}>{agent.name}</option>)}
              </select>
            </div>
            <div className="controls">
              <button className="btn" type="submit">Create</button>
              {formMessage && <small className={formMessage.startsWith('Create failed') ? 'message-error' : 'message-success'}>{formMessage}</small>}
            </div>
          </div>
        </form>
      )}

      {error && <p className="message-error">{error}</p>}
      <section className="board">
        {columns.map((col) => (
          <div key={col} className="column">
            <h4>{col}</h4>
            {grouped[col].map((t) => (
              <article key={t.id} className="ticket">
                <div className="ticket-title">#{t.id} {t.title}</div>
                <div className="ticket-meta">{t.type} / {t.priority}</div>
                <div className="ticket-meta">Project: {projectNameMap[t.project_id] || `#${t.project_id}`}</div>
                {((authReady && isAdmin) || t.status === 'PENDING_APPROVAL') && (
                  <Link className="ticket-edit-link" href={`/tickets/${t.id}`}>Edit</Link>
                )}
                {authReady && isAdmin && (
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
