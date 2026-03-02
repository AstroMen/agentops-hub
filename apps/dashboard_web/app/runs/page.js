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
    <section className="card">
      <div className="controls" style={{ justifyContent: 'space-between' }}>
        <div>
          <h2 style={{ margin: 0 }}>Runs</h2>
          <p className="subtitle" style={{ marginTop: 4 }}>查看每次执行记录、状态与产物。</p>
        </div>
        <button className="btn" onClick={loadRuns}>Load Runs</button>
      </div>

      {error && <p className="message-error">{error}</p>}

      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Ticket</th>
              <th>Status</th>
              <th>Started</th>
              <th>Finished</th>
              <th>Artifacts</th>
            </tr>
          </thead>
          <tbody>
            {runs.map((r) => (
              <tr key={r.id}>
                <td>{r.id}</td>
                <td>{r.ticket_id}</td>
                <td>{r.status}</td>
                <td>{r.started_at}</td>
                <td>{r.finished_at || '-'}</td>
                <td style={{ maxWidth: 380, whiteSpace: 'pre-wrap' }}>{JSON.stringify(r.artifacts || {})}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
