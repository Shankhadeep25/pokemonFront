import axios from 'axios';
import toast from 'react-hot-toast';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('pokeToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle errors globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response?.data?.error || 'Something went wrong';
    if (error.response?.status === 401 && !error.config?._skipAuthRedirect) {
      localStorage.removeItem('pokeToken');
      localStorage.removeItem('pokeUser');
      toast.error('Session expired — please login again');
      // Redirect admins back to admin login, participants to regular login
      const isAdminRoute = window.location.pathname.startsWith('/admin');
      window.location.href = isAdminRoute ? '/admin/login' : '/login';
    } else {
      toast.error(message);
    }
    return Promise.reject(error);
  }
);

// ─── Auth ───
export const signup = (data) => api.post('/auth/signup', data);
export const login = (data) => api.post('/auth/login', data);

// ─── Game (Participant) ───
export const getTeamInfo = () => api.get('/game/team', { _skipAuthRedirect: true });
export const getRiddle = () => api.get('/game/riddle');
export const catchPokemon = (qrCodeValue) => api.post('/game/catch', { qrCodeValue });
export const releasePokemon = (pokemonId) => api.post('/game/release', { pokemonId });
export const changeRiddle = () => api.post('/game/change-riddle');
export const selectPokemon = (pokemonIds) => api.post('/game/select-pokemon', { pokemonIds });
export const getGyms = () => api.get('/game/gyms');
export const getDeck = () => api.get('/game/deck');

// ─── Admin ───
export const createTeam = (teamId) => api.post('/admin/team', { teamId });
export const getTeams = () => api.get('/admin/teams');
export const deleteTeam = (teamId) => api.delete(`/admin/team/${teamId}`);
export const startGame = () => api.post('/admin/game/start');
export const endGame = () => api.post('/admin/game/end');
export const getLeaderboard = () => api.get('/admin/leaderboard');
export const nextRound = () => api.post('/admin/game/next-round');
export const resetRound = () => api.post('/admin/game/reset-round');
export const getGameState = () => api.get('/admin/game/state');

export default api;
