import React, { useEffect, useState } from 'react';
import { listBrochures, createBrochure } from './api';

function App() {
  const [brochures, setBrochures] = useState([]);
  const [title, setTitle] = useState('');
  const [supplierId, setSupplierId] = useState('');
  const [image, setImage] = useState(null);
  const [token, setToken] = useState('');
  const [qrText, setQrText] = useState('');

  useEffect(() => {
    load();
  }, []);

  async function load() {
    try {
      const data = await listBrochures();
      setBrochures(data);
    } catch (e) {
      console.error(e);
    }
  }

  async function submit(e) {
    e.preventDefault();
    const fd = new FormData();
    fd.append('title', title);
    if (supplierId) fd.append('supplier_id', supplierId);
    if (image) fd.append('image', image);
    if (qrText) fd.append('qr_text', qrText);
    try {
      await createBrochure(fd, token);
      setTitle('');
      setImage(null);
      setQrText('');
      load();
    } catch (err) {
      alert('Error: ' + err.message);
    }
  }

  // Helper to build absolute URL for images on backend
  function absUrl(rel) {
    if (!rel) return null;
    if (rel.startsWith('http')) return rel;
    return (process.env.REACT_APP_API_URL || 'http://localhost:4000') + rel;
  }

  return (
    <div style={{ padding: 20 }}>
      <h1>Brochures</h1>
      <ul>
        {brochures.map(b => (
          <li key={b.id} style={{ marginBottom: 12 }}>
            <div>
              <strong>{b.title}</strong> {b.supplier_name ? `— ${b.supplier_name}` : ''}
            </div>
            <div style={{ display: 'flex', gap: 12, marginTop: 6 }}>
              {b.image_path && <img src={absUrl(b.image_path)} alt={b.title} style={{ maxWidth: 120 }} />}
              {b.qr_code_path && (
                <div style={{ textAlign: 'center' }}>
                  <img src={absUrl(b.qr_code_path)} alt={`${b.title} QR`} style={{ width: 120, height: 120 }} />
                  <div>
                    <a href={absUrl(b.qr_code_path)} target="_blank" rel="noreferrer">Open QR</a>
                  </div>
                </div>
              )}
            </div>
          </li>
        ))}
      </ul>

      <h2>Add brochure</h2>
      <form onSubmit={submit}>
        <div>
          <label>Title: <input value={title} onChange={e => setTitle(e.target.value)} required /></label>
        </div>
        <div>
          <label>Image: <input type="file" accept="image/*" onChange={e => setImage(e.target.files[0])} /></label>
        </div>
        <div>
          <label>QR text or URL (optional): <input value={qrText} onChange={e => setQrText(e.target.value)} placeholder="https://example.com or custom text" /></label>
        </div>
        <div>
          <label>Auth token (for demo): <input value={token} onChange={e => setToken(e.target.value)} /></label>
        </div>
        <button type="submit">Create</button>
      </form>
    </div>
  );
}

export default App;
