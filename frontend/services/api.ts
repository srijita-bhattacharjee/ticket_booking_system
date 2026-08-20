import axios from 'axios';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

export const authService = {
  login: (data: any) => api.post('/api/auth/login', data),
  register: (data: any) => api.post('/api/auth/register', data),
  getMe: () => api.get('/api/auth/me'),
};

export const eventService = {
  getAll: (type?: string, search?: string) =>
    api.get('/api/events', { params: { type, search } }),
  getOne: (id: string) => api.get(`/api/events/${id}`),
  create: (data: any) => api.post('/api/events', data),
  delete: (id: string) => api.delete(`/api/events/${id}`),
};

export const holdService = {
  create: (eventId: string, seatIds: string[]) =>
    api.post('/api/holds', { eventId, seatIds }),
  getDetails: (id: string) => api.get(`/api/holds/${id}`),
  cancel: (id: string) => api.delete(`/api/holds/${id}`),
};

export const bookingService = {
  create: (holdId: string, idempotencyKey?: string) =>
    api.post(
      '/api/bookings',
      { holdId },
      idempotencyKey ? { headers: { 'Idempotency-Key': idempotencyKey } } : {}
    ),
  getUserBookings: () => api.get('/api/bookings'),
  getOne: (id: string) => api.get(`/api/bookings/${id}`),
  cancel: (id: string) => api.delete(`/api/bookings/${id}`),
};

export const waitlistService = {
  join: (eventId: string, category: string) =>
    api.post('/api/waitlist', { eventId, category }),
  getStatus: (eventId: string) =>
    api.get(`/api/events/${eventId}/waitlist/status`),
  acceptOffer: (offerToken: string) =>
    api.post('/api/waitlist/offers/accept', { offerToken }),
};

export const ticketService = {
  getOne: (id: string) => api.get(`/api/tickets/${id}`),
  checkIn: (id: string) => api.post(`/api/tickets/${id}/check-in`),
};

export const venueService = {
  getAll: () => api.get('/api/admin/venues'),
  getOne: (id: string) => api.get(`/api/admin/venues/${id}`),
  create: (data: any) => api.post('/api/admin/venues', data),
  delete: (id: string) => api.delete(`/api/admin/venues/${id}`),
};

export const analyticsService = {
  getDashboard: () => api.get('/api/organiser/dashboard'),
  getEventAnalytics: (id: string) => api.get(`/api/organiser/events/${id}/analytics`),
  getHeatmap: (id: string) => api.get(`/api/organiser/events/${id}/heatmap`),
};
