import axios from 'axios';

const API_BASE = typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1'
  ? ''
  : (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000');

export const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
    'bypass-tunnel-reminder': 'true',
    'ngrok-skip-browser-warning': 'true',
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
  createRazorpayOrder: (holdId: string, amount: number) => api.post('/api/bookings/create-order', { holdId, amount }),
  verifyRazorpayPayment: (data: any) => api.post('/api/bookings/verify-payment', data),
  create: (data: { holdId: string; idempotencyKey?: string; addons?: any[]; couponCode?: string; discountAmount?: number }) =>
    api.post(
      '/api/bookings',
      data,
      data.idempotencyKey ? { headers: { 'Idempotency-Key': data.idempotencyKey } } : {}
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

export const foodService = {
  // Public
  getMenuItems: () => api.get('/api/food/menu-items'),
  getStalls: () => api.get('/api/food/stalls'),
  getCoupons: () => api.get('/api/food/coupons'),
  validateCoupon: (code: string, cartTotal: number) =>
    api.post('/api/food/coupons/validate', { code, cartTotal }),

  // Admin
  createStall: (data: any) => api.post('/api/food/admin/stalls', data),
  deleteStall: (id: string) => api.delete(`/api/food/admin/stalls/${id}`),
  addMenuItem: (data: any) => api.post('/api/food/admin/menu-items', data),
  deleteMenuItem: (id: string) => api.delete(`/api/food/admin/menu-items/${id}`),
  getAllPartnerships: () => api.get('/api/food/admin/partnerships'),
  updatePartnershipStatus: (id: string, status: string, notes?: string) =>
    api.patch(`/api/food/admin/partnerships/${id}/status`, { status, notes }),

  // Organiser
  submitPartnershipProof: (data: any) => api.post('/api/food/organiser/partnerships', data),
  getOrganiserPartnerships: () => api.get('/api/food/organiser/partnerships'),
  createCoupon: (data: any) => api.post('/api/food/organiser/coupons', data),
  getOrganiserCoupons: () => api.get('/api/food/organiser/coupons'),
};
