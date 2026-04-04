// src/api/endpoints.js - النسخة المصححة بالكامل

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
  // المسارات
  directions: '/map/directions',
  distance: '/map/distance',
  staticMap: '/map/static',
  
  // البحث عن العناوين
  geocode: '/map/geocode',
  reverseGeocode: '/map/reverse-geocode',
  
  // المتاجر
  stores: '/map/stores',
  storeIsochrone: (storeId) => `/map/store/${storeId}/isochrone`,
  nearestDriver: '/map/store/nearest-driver',
  
  // المندوبين
  driverLocation: '/map/driver/location',
  trackDriver: (driverId) => `/map/driver/${driverId}/track`,
  allDriversLocations: '/map/drivers/locations',
  trackAllDrivers: '/map/drivers/track-all',
  nearestDriverAdmin: '/map/nearest-driver',
  
  // الطلبات
  orderRoute: (orderId) => `/map/order/${orderId}/route`,
  driverCurrentRoute: '/map/driver/current-route',
};

// ==================== نقاط نهاية الأدمن ====================
export const adminEndpoints = {
  // لوحة التحكم والإحصائيات
  dashboard: '/admin/dashboard',
  stats: '/admin/stats',
  statsUsers: '/admin/stats/users',
  statsOrders: '/admin/stats/orders',
  statsRevenue: '/admin/stats/revenue',
  
  // إدارة المستخدمين
  users: '/admin/users',
  userDetails: (id) => `/admin/users/${id}`,
  
  // إدارة التجار
  vendors: '/admin/vendors',
  vendorDetails: (id) => `/admin/vendors/${id}`,
  verifyVendor: (id) => `/admin/vendors/${id}/verify`,
  updateVendorStatus: (id) => `/admin/vendors/${id}/status`,
  
  // إدارة المتاجر
  stores: '/admin/stores',
  storeDetails: (id) => `/admin/stores/${id}`,
  verifyStore: (id) => `/admin/stores/${id}/verify`,
  toggleStoreStatus: (id) => `/admin/stores/${id}/toggle-status`,
  updateStoreCoordinates: '/admin/stores/update-coordinates',
  
  // إدارة المنتجات
  products: '/admin/products',
  productStats: '/admin/products/stats',
  productDetails: (id) => `/admin/products/${id}`,
  featureProduct: (id) => `/admin/products/${id}/feature`,
  updateProductImage: (id) => `/admin/products/${id}/image`,
  toggleProductAvailability: (id) => `/admin/products/${id}/toggle-availability`,
  updateProductInventory: (id) => `/admin/products/${id}/inventory`,
  
  // إدارة الطلبات
  orders: '/admin/orders',
  orderDetails: (id) => `/admin/orders/${id}`,
  ordersStatsOverview: '/admin/orders/stats/overview',
  ordersStatsDaily: '/admin/orders/stats/daily',
  ordersStatsMonthly: '/admin/orders/stats/monthly',
  assignDriver: (id) => `/admin/orders/${id}/assign`,
  reassignDriver: (id) => `/admin/orders/${id}/reassign`,
  forceCancelOrder: (id) => `/admin/orders/${id}/force-cancel`,
  
  // إدارة المندوبين
  drivers: '/admin/drivers',
  driverDetails: (id) => `/admin/drivers/${id}`,
  driverLocation: (id) => `/admin/drivers/${id}/location`,
  driverStats: (id) => `/admin/drivers/${id}/stats`,
  driverOrders: (id) => `/admin/drivers/${id}/orders`,
  verifyDriver: (id) => `/admin/drivers/${id}/verify`,
  updateDriverStatus: (id) => `/admin/drivers/${id}/status`,
  
  // إدارة الإشعارات
  sendNotification: '/admin/notifications/send',
  campaignStats: (campaignId) => `/admin/notifications/campaign/${campaignId}/stats`,
  notificationsAllStats: '/admin/notifications/all/stats',
  
  // إدارة النظام والكاش
  cacheStats: '/admin/cache/stats',
  clearCache: '/admin/cache/clear',
  clearCacheByPattern: (pattern) => `/admin/cache/clear/${encodeURIComponent(pattern)}`,
  rateLimitStats: '/admin/rate-limit/stats',
  resetRateLimit: (userId) => `/admin/rate-limit/reset/${userId}`,
  clearAllRateLimits: '/admin/rate-limit/clear-all',
  securityHeaders: '/admin/security/headers',
  
  // التحليلات
  analyticsUsers: '/admin/analytics/users',
  analyticsOrders: '/admin/analytics/orders',
  analyticsRevenue: '/admin/analytics/revenue',
  
  // التقارير
  reportsOrders: '/admin/reports/orders',
  reportsUsers: '/admin/reports/users',
  reportsRevenue: '/admin/reports/revenue',
  reportsDrivers: '/admin/reports/drivers',
  reportsStores: '/admin/reports/stores',
  
  // الإحصائيات المتقدمة
  advancedStatsDaily: '/admin/advanced-stats/daily',
  advancedStatsWeekly: '/admin/advanced-stats/weekly',
  advancedStatsMonthly: '/admin/advanced-stats/monthly',
  advancedStatsCustom: '/admin/advanced-stats/custom',
};

// ==================== دوال مساعدة ====================
export const buildUrl = (endpoint, params = {}) => {
  const url = new URL(endpoint, window.location.origin);
  Object.keys(params).forEach(key => {
    if (params[key] !== undefined && params[key] !== null && params[key] !== '') {
      url.searchParams.append(key, params[key]);
    }
  });
  return url.pathname + url.search;
};