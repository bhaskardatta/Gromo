import axios from 'axios';
import config from '../config';

const api = axios.create({
  baseURL: config.apiUrl,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor for adding auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Voice API methods
export const voiceApi = {
  getSupportedLanguages: () => api.get('/voice/supported-languages'),
  processVoice: (file: File) => {
    const formData = new FormData();
    formData.append('audio', file);
    return api.post('/voice/process', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  }
};

// OCR API methods
export const ocrApi = {
  getSupportedDocumentTypes: () => api.get('/ocr/supported-document-types'),
  processDocument: (file: File) => {
    const formData = new FormData();
    formData.append('document', file);
    return api.post('/ocr/process', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  }
};

// Claims API methods
export const claimsApi = {
  getAllClaims: () => api.get('/claims'),
  getClaimById: (id: string) => api.get(`/claims/${id}`),
  createClaim: (claimData: any) => api.post('/claims', claimData),
  updateClaim: (id: string, claimData: any) => api.put(`/claims/${id}`, claimData),
  deleteClaim: (id: string) => api.delete(`/claims/${id}`)
};

// Auth API methods
export const authApi = {
  login: (email: string, password: string) => 
    axios.post(`${config.authUrl}/login`, { email, password }),
  getProfile: () => axios.get(`${config.authUrl}/profile`, {
    headers: {
      Authorization: `Bearer ${localStorage.getItem('authToken')}`
    }
  })
};

export default api;