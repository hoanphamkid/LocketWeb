import axios from 'axios';

// Backend URL from Vite env variable (default to localhost)
const API_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

// Get Firebase ID token (if user logged in)
export const getIdToken = async () => {
  try {
    const { getAuth } = await import('firebase/auth');
    const { firebaseApp } = await import('../firebase/init');
    if (!firebaseApp) return null;
    const auth = getAuth(firebaseApp);
    if (auth.currentUser) {
      return await auth.currentUser.getIdToken();
    }
    return null;
  } catch (e) {
    console.error('Failed to get ID token', e);
    return null;
  }
};

export const uploadPhoto = async (file, caption) => {
  const token = await getIdToken();
  const form = new FormData();
  form.append('image', file);
  form.append('caption', caption || '');

  const headers = {
    'Content-Type': 'multipart/form-data',
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return axios.post(`${API_URL}/api/upload`, form, { headers });
};

export const healthCheck = async () => {
  return axios.get(`${API_URL}/api/health`);
};
