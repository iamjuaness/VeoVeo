const API_URL = 'http://localhost:5000/api/auth';

export async function register(data: { name: string, email: string, password: string, passwordConfirm: string, selectedAvatar: string }) {
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
    if (result.token) {
      // Puedes elegir localStorage o sessionStorage
      localStorage.setItem("authToken", result.token);
      // Si solo quieres que dure la sesión: sessionStorage.setItem("authToken", data.token);
  
      // También puedes guardar el usuario en algún estado global o contexto si deseas
      // setUser({ id: data.id, name: data.name, email: data.email, avatar: data.avatar });
    } else {
      // Manejo de error
    }
    return result;
  }
  