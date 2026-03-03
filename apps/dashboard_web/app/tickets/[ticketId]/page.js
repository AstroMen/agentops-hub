'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { apiFetch, getToken } from '../../../lib/api';

const TICKET_TYPES = ['Bug', 'Improvement', 'Documentation Needed', 'Task', 'New Feature'];

const emptyForm = {
  title: '',
  description: '',
  type: 'Task',
  priority: 'P2',
  project_id: '',
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
  const [agents, setAgents] = useState([]);
  const [projects, setProjects] = useState([]);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.push('/login');
      return;
    }

    async function loadPageData() {
      try {
        setError('');
        const [ticket, agentList, projectList] = await Promise.all([apiFetch(`/tickets/${ticketId}`), apiFetch('/agents'), apiFetch('/projects')]);
        const activeAgents = agentList.filter((agent) => agent.is_active);
        const activeProjects = projectList.filter((project) => project.is_active);
        setAgents(activeAgents);
        setProjects(activeProjects);
        setForm({
          title: ticket.title,
          description: ticket.description,
          type: ticket.type,
          priority: ticket.priority,
          project_id: String(ticket.project_id),
          assigned_agent: ticket.assigned_agent,
        });
      } catch (err) {
        setError(String(err.message));
      } finally {
        setLoading(false);
      }
    }

    if (ticketId) {
      loadPageData();
    }
  }, [router, ticketId]);

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      setMessage('');
      setError('');
      await apiFetch(`/tickets/${ticketId}/update`, {
        method: 'POST',
        body: JSON.stringify({ ...form, project_id: Number(form.project_id) }),
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
          <div style={{ display: 'grid', gap: 8, gridTemplateColumns: 'repeat(4, minmax(160px, 1fr))' }}>
            <select className="select" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
              {TICKET_TYPES.map((typeOption) => <option key={typeOption} value={typeOption}>{typeOption}</option>)}
            </select>
            <select className="select" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
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
            <button className="btn" type="submit">Save changes</button>
            {message && <small className="message-success">{message}</small>}
          </div>
        </form>
      )}

      {error && <p className="message-error">{error}</p>}
    </section>
  );
}
