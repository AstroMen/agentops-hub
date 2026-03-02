'use client';

import { useState } from 'react';
import { apiFetch } from '../../lib/api';

export default function RunsPage() {
  const [runs, setRuns] = useState([]);
  const [error, setError] = useState('');

  async function loadRuns() {
    try {
      setRuns(await apiFetch('/runs'));
      setError('');
    } catch (e) {
      setError(String(e.message));
    }
  }

  return (
    <div>
      <h2>Runs</h2>
      <button onClick={loadRuns}>Load Runs</button>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <table border="1" cellPadding="6" style={{ marginTop: 12 }}>
        <thead><tr><th>ID</th><th>Ticket</th><th>Status</th><th>Started</th><th>Finished</th><th>Artifacts</th></tr></thead>
        <tbody>
          {runs.map((r) => <tr key={r.id}><td>{r.id}</td><td>{r.ticket_id}</td><td>{r.status}</td><td>{r.started_at}</td><td>{r.finished_at || '-'}</td><td>{JSON.stringify(r.artifacts || {})}</td></tr>)}
        </tbody>
      </table>
    </div>
  );
}
