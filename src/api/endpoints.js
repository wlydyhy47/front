// src/api/endpoints.js - مع دوال موحدة للـ IDs

import { getId } from '../utils/helpers';

// ==================== نقاط نهاية المصادقة ====================
export const authEndpoints = {
  login: '/auth/login',
  register: '/auth/register',
  logout: '/auth/logout',
  refresh: '/auth/refresh',
  verify: '/auth/verify',
  resendVerification: '/auth/resend-verification',
  forgotPassword: '/auth/forgot-password',
  resetPassword: '/auth/reset-password',
  changePassword: '/auth/change-password',
  validateToken: '/auth/validate',
  revokeAllSessions: '/auth/revoke-all-sessions',
};

// ==================== نقاط نهاية الخرائط ====================
export const mapEndpoints = {
  directions: '/map/directions',
  distance: '/map/distance',
  staticMap: '/map/static',
  geocode: '/map/geocode',
  reverseGeocode: '/map/reverse-geocode',
  stores: '/map/stores',
  storeIsochrone: (storeId) => `/map/store/${storeId}/isochrone`,
  nearestDriver: '/map/store/nearest-driver',
  driverLocation: '/map/driver/location',
  trackDriver: (driverId) => `/map/driver/${driverId}/track`,
  allDriversLocations: '/map/drivers/locations',
  trackAllDrivers: '/map/drivers/track-all',
  nearestDriverAdmin: '/map/nearest-driver',
  orderRoute: (orderId) => `/map/order/${orderId}/route`,
  driverCurrentRoute: '/map/driver/current-route',
};

// ==================== نقاط نهاية الأدمن ====================
export const adminEndpoints = {
  dashboard: '/admin/dashboard',
  stats: '/admin/stats',
  statsUsers: '/admin/stats/users',
  statsOrders: '/admin/stats/orders',
  statsRevenue: '/admin/stats/revenue',
  
  users: '/admin/users',
  userDetails: (id) => `/admin/users/${id}`,
  
  vendors: '/admin/vendors',
  vendorDetails: (id) => `/admin/vendors/${id}`,
  verifyVendor: (id) => `/admin/vendors/${id}/verify`,
  updateVendorStatus: (id) => `/admin/vendors/${id}/status`,
  
  stores: '/admin/stores',
  storeDetails: (id) => `/admin/stores/${id}`,
  verifyStore: (id) => `/admin/stores/${id}/verify`,
  toggleStoreStatus: (id) => `/admin/stores/${id}/toggle-status`,
  updateStoreCoordinates: '/admin/stores/update-coordinates',
  
  products: '/admin/products',
  productStats: '/admin/products/stats',
  productDetails: (id) => `/admin/products/${id}`,
  featureProduct: (id) => `/admin/products/${id}/feature`,
  updateProductImage: (id) => `/admin/products/${id}/image`,
  toggleProductAvailability: (id) => `/admin/products/${id}/toggle-availability`,
  updateProductInventory: (id) => `/admin/products/${id}/inventory`,
  
  orders: '/admin/orders',
  orderDetails: (id) => `/admin/orders/${id}`,
  ordersStatsOverview: '/admin/orders/stats/overview',
  ordersStatsDaily: '/admin/orders/stats/daily',
  ordersStatsMonthly: '/admin/orders/stats/monthly',
  assignDriver: (id) => `/admin/orders/${id}/assign`,
  reassignDriver: (id) => `/admin/orders/${id}/reassign`,
  forceCancelOrder: (id) => `/admin/orders/${id}/force-cancel`,
  
  drivers: '/admin/drivers',
  driverDetails: (id) => `/admin/drivers/${id}`,
  driverLocation: (id) => `/admin/drivers/${id}/location`,
  driverStats: (id) => `/admin/drivers/${id}/stats`,
  driverOrders: (id) => `/admin/drivers/${id}/orders`,
  verifyDriver: (id) => `/admin/drivers/${id}/verify`,
  updateDriverStatus: (id) => `/admin/drivers/${id}/status`,
  
  sendNotification: '/admin/notifications/send',
  campaignStats: (campaignId) => `/admin/notifications/campaign/${campaignId}/stats`,
  notificationsAllStats: '/admin/notifications/all/stats',
  
  cacheStats: '/admin/cache/stats',
  clearCache: '/admin/cache/clear',
  clearCacheByPattern: (pattern) => `/admin/cache/clear/${encodeURIComponent(pattern)}`,
  rateLimitStats: '/admin/rate-limit/stats',
  resetRateLimit: (userId) => `/admin/rate-limit/reset/${userId}`,
  clearAllRateLimits: '/admin/rate-limit/clear-all',
  securityHeaders: '/admin/security/headers',
  
  analyticsUsers: '/admin/analytics/users',
  analyticsOrders: '/admin/analytics/orders',
  analyticsRevenue: '/admin/analytics/revenue',
  
  reportsOrders: '/admin/reports/orders',
  reportsUsers: '/admin/reports/users',
  reportsRevenue: '/admin/reports/revenue',
  reportsDrivers: '/admin/reports/drivers',
  reportsStores: '/admin/reports/stores',
  
  advancedStatsDaily: '/admin/advanced-stats/daily',
  advancedStatsWeekly: '/admin/advanced-stats/weekly',
  advancedStatsMonthly: '/admin/advanced-stats/monthly',
  advancedStatsCustom: '/admin/advanced-stats/custom',
};

// ==================== دوال مساعدة ====================

/**
 * بناء URL مع المعاملات
 * @param {string} endpoint - نقطة النهاية
 * @param {Object} params - المعاملات
 * @returns {string} - URL مع المعاملات
 */
export const buildUrl = (endpoint, params = {}) => {
  const url = new URL(endpoint, window.location.origin);
  Object.keys(params).forEach(key => {
    if (params[key] !== undefined && params[key] !== null && params[key] !== '') {
      url.searchParams.append(key, params[key]);
    }
  });
  return url.pathname + url.search;
};

/**
 * الحصول على ID من العنصر (يدعم _id و id)
 * @param {Object|string} item - العنصر أو الـ ID
 * @returns {string|null}
 */
export const getItemId = (item) => {
  if (!item) return null;
  if (typeof item === 'string') return item;
  return item._id || item.id || null;
};

/**
 * توحيد المصفوفات (تحويل id إلى _id)
 * @param {Array} items - المصفوفة
 * @returns {Array} - مصفوفة مع توحيد الـ IDs
 */
export const normalizeItems = (items) => {
  if (!Array.isArray(items)) return [];
  return items.map(item => ({
    ...item,
    _id: item._id || item.id,
  }));
};

/**
 * الحصول على قيمة بأمان من كائن
 * @param {Object} obj - الكائن
 * @param {string} path - المسار
 * @param {any} defaultValue - القيمة الافتراضية
 * @returns {any}
 */
export const getSafeValue = (obj, path, defaultValue = '') => {
  if (!obj || !path) return defaultValue;
  
  const keys = path.split('.');
  let result = obj;
  
  for (const key of keys) {
    if (result === undefined || result === null) {
      return defaultValue;
    }
    result = result[key];
  }
  
  return result !== undefined && result !== null ? result : defaultValue;
};