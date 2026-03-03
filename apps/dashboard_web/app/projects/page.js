'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch, getRole, getToken } from '../../lib/api';

const emptyForm = { name: '', description: '', is_active: true };

export default function ProjectsPage() {
  const router = useRouter();
  const [projects, setProjects] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    const token = getToken();
    setIsAdmin(getRole() === 'admin');
    setAuthReady(true);

    if (!token) {
      router.push('/login');
      return;
    }
    loadProjects().catch((err) => setError(String(err.message)));
  }, [router]);

  async function loadProjects() {
    const data = await apiFetch('/projects');
    setProjects(data);
  }

  async function submitForm(e) {
    e.preventDefault();
    if (!isAdmin) {
      setError('Only admin can manage projects.');
      return;
    }
    setError('');
    try {
      if (editingId) {
        await apiFetch(`/projects/${editingId}`, { method: 'PUT', body: JSON.stringify(form) });
      } else {
        await apiFetch('/projects', { method: 'POST', body: JSON.stringify(form) });
      }
      setForm(emptyForm);
      setEditingId(null);
      await loadProjects();
    } catch (err) {
      setError(String(err.message));
    }
  }

  async function deleteProject(id) {
    if (!isAdmin) {
      setError('You do not have permission to delete projects. Please login as admin.');
      return;
    }
    try {
      await apiFetch(`/projects/${id}`, { method: 'DELETE' });
      await loadProjects();
    } catch (err) {
      setError(String(err.message));
    }
  }

  return (
    <div style={{ display: 'grid', gap: '1rem' }}>
      <section className="card">
        <h2 style={{ marginTop: 0 }}>Project Management</h2>
        <p className="subtitle">Use project tags to classify tickets by department or business line.</p>
        {authReady && !isAdmin && <p className="message-error">Your account is read-only on this page. Please login as admin to manage projects.</p>}
      </section>

      {authReady && isAdmin && (
        <form className="card" onSubmit={submitForm} style={{ display: 'grid', gap: 10, maxWidth: 760 }}>
          <h3 style={{ marginTop: 0 }}>{editingId ? 'Edit project' : 'Create project'}</h3>
          <input className="input" placeholder="Project name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
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
        <h3 style={{ marginTop: 0 }}>Projects</h3>
        <div style={{ display: 'grid', gap: 8 }}>
          {projects.map((project) => (
            <article key={project.id} className="ticket" style={{ display: 'grid', gap: 6 }}>
              <div className="ticket-title">{project.name}</div>
              <div className="ticket-meta">{project.is_active ? 'Active' : 'Inactive'}</div>
              {project.description && <div style={{ whiteSpace: 'pre-wrap' }}>{project.description}</div>}
              {isAdmin && (
                <div className="controls">
                  <button
                    className="btn btn-secondary"
                    onClick={() => {
                      setEditingId(project.id);
                      setForm({ name: project.name, description: project.description || '', is_active: project.is_active });
                    }}
                  >
                    Edit
                  </button>
                  <button className="btn btn-danger" onClick={() => deleteProject(project.id)}>Delete</button>
                </div>
              )}
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
