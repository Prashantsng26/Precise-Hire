import axios from 'axios';
const API = axios.create({ 
  baseURL: import.meta.env.VITE_API_URL, 
  timeout: 600000 
});

export const uploadCandidates = (formData) => API.post('/api/upload', formData);
export const screenCandidates = (data) => API.post('/api/screen', data);
export const getShortlist = (jobId) => API.get(`/api/screen/${jobId}`);
export const sendInterviewInvites = (data) => API.post('/api/email/interview', data);
export const sendAssessmentLinks = (data) => API.post('/api/email/assessment', data);
export const sendOfferLetters = (data) => API.post('/api/email/offer', data);
export const getPipelineStatus = (jobId) => API.get(`/api/pipeline/status/${jobId}`);
export const createPipeline = (data) => API.post('/api/pipeline/create', data);
export const markResult = (data) => API.post('/api/pipeline/mark-result', data);
export const addCustomRound = (data) => API.post('/api/pipeline/add-round', data);
export const moveCandidate = (data) => API.post('/api/pipeline/move-candidate', data);
export const getDashboardStats = () => API.get('/api/dashboard/stats');
export default API;
