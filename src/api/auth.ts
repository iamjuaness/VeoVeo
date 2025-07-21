const API_URL = 'http://localhost:5000/api/auth';

export async function register(data: { name: string, email: string, password: string, passwordConfirm: string }) {
  const res = await fetch(`${API_URL}/register`, {
    method: 'POST',
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  });
  const result = await res.json();
  return result;
}


export async function login(data: { email: string, password: string }) {
    const res = await fetch(`${API_URL}/login`, {
      method: 'POST',
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(data)
    });
    const result = await res.json();
    return result;
  }
  