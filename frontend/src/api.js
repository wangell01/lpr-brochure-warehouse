const API_ROOT = process.env.REACT_APP_API_URL || 'http://localhost:4000';

async function request(path, opts = {}) {
  const res = await fetch(API_ROOT + path, opts);
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(txt || res.status);
  }
  return res.json();
}

export async function listBrochures() {
  return request('/api/brochures');
}

export async function createBrochure(formData, token) {
  const headers = token ? { Authorization: 'Bearer ' + token } : {};
  const res = await fetch(API_ROOT + '/api/brochures', {
    method: 'POST',
    headers,
    body: formData
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
