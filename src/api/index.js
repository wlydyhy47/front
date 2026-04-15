// src/api/index.js - جميع الخدمات مع توحيد الـ IDs

import apiClient from './client';
import { adminEndpoints, mapEndpoints, buildUrl, getItemId } from './endpoints';

// ==================== خدمات الخرائط ====================
export const mapService = {
  getDirections: (origin, destination, profile = 'driving') => 
    apiClient.post(mapEndpoints.directions, { origin, destination, profile }),
  
  calculateDistance: (points, profile = 'driving') => 
    apiClient.post(mapEndpoints.distance, { points, profile }),
  
  getStaticMap: (params) => 
    apiClient.get(buildUrl(mapEndpoints.staticMap, params)),
  
  geocode: (address, limit = 5) => 
    apiClient.get(buildUrl(mapEndpoints.geocode, { address, limit })),
  
  reverseGeocode: (latitude, longitude) => 
    apiClient.get(buildUrl(mapEndpoints.reverseGeocode, { latitude, longitude })),
  
  getStoresMap: (params = {}) => 
    apiClient.get(buildUrl(mapEndpoints.stores, params)),
  
  getStoreIsochrone: (storeId, minutes = 15, profile = 'driving') => 
    apiClient.get(buildUrl(mapEndpoints.storeIsochrone(storeId), { minutes, profile })),
  
  findNearestDriverForStore: (latitude, longitude, radius = 5000, limit = 10) => 
    apiClient.post(mapEndpoints.nearestDriver, { latitude, longitude, radius, limit }),
  
  updateDriverLocation: (latitude, longitude, accuracy, heading, speed) => 
    apiClient.put(mapEndpoints.driverLocation, { latitude, longitude, accuracy, heading, speed }),
  
  trackDriver: (driverId) => 
    apiClient.get(mapEndpoints.trackDriver(driverId)),
  
  getAllDriversLocations: (params = {}) => 
    apiClient.get(buildUrl(mapEndpoints.allDriversLocations, params)),
  
  trackAllDrivers: () => 
    apiClient.get(mapEndpoints.trackAllDrivers),
  
  findNearestDriver: (latitude, longitude, radius = 5000, limit = 10) => 
    apiClient.post(mapEndpoints.nearestDriverAdmin, { latitude, longitude, radius, limit }),
  
  getOrderRoute: (orderId) => 
    apiClient.get(mapEndpoints.orderRoute(orderId)),
  
  getDriverCurrentRoute: () => 
    apiClient.get(mapEndpoints.driverCurrentRoute),
};

// ==================== خدمات لوحة التحكم ====================
export const dashboardService = {
  getDashboard: () => apiClient.get(adminEndpoints.dashboard),
  getStats: () => apiClient.get(adminEndpoints.stats),
  getStatsUsers: () => apiClient.get(adminEndpoints.statsUsers),
  getStatsOrders: () => apiClient.get(adminEndpoints.statsOrders),
  getStatsRevenue: () => apiClient.get(adminEndpoints.statsRevenue),
};

// ==================== خدمات المستخدمين ====================
export const usersService = {
  getUsers: (params = {}) => apiClient.get(buildUrl(adminEndpoints.users, params)),
  createUser: (data) => apiClient.post(adminEndpoints.users, data),
  getUserDetails: (user) => {
    const id = getItemId(user);
    return apiClient.get(adminEndpoints.userDetails(id));
  },
  updateUser: (user, data) => {
    const id = getItemId(user);
    return apiClient.put(adminEndpoints.userDetails(id), data);
  },
  deleteUser: (user) => {
    const id = getItemId(user);
    return apiClient.delete(adminEndpoints.userDetails(id));
  },
};

// ==================== خدمات التجار ====================
export const vendorsService = {
  getVendors: (params = {}) => apiClient.get(buildUrl(adminEndpoints.vendors, params)),
  getVendorDetails: (vendor) => {
    const id = getItemId(vendor);
    return apiClient.get(adminEndpoints.vendorDetails(id));
  },
  verifyVendor: (vendor) => {
    const id = getItemId(vendor);
    return apiClient.put(adminEndpoints.verifyVendor(id));
  },
  updateVendorStatus: (vendor, data) => {
    const id = getItemId(vendor);
    return apiClient.put(adminEndpoints.updateVendorStatus(id), data);
  },
};

// ==================== خدمات المتاجر ====================
export const storesService = {
  getStores: (params = {}) => apiClient.get(buildUrl(adminEndpoints.stores, params)),
  createStore: (data) => apiClient.post(adminEndpoints.stores, data),
  getStoreDetails: (store) => {
    const id = getItemId(store);
    return apiClient.get(adminEndpoints.storeDetails(id));
  },
  updateStore: (store, data) => {
    const id = getItemId(store);
    return apiClient.put(adminEndpoints.storeDetails(id), data);
  },
  deleteStore: (store) => {
    const id = getItemId(store);
    return apiClient.delete(adminEndpoints.storeDetails(id));
  },
  verifyStore: (store) => {
    const id = getItemId(store);
    return apiClient.put(adminEndpoints.verifyStore(id));
  },
  toggleStoreStatus: (store) => {
    const id = getItemId(store);
    return apiClient.put(adminEndpoints.toggleStoreStatus(id));
  },
  updateStoreCoordinates: () => apiClient.post(adminEndpoints.updateStoreCoordinates),
};

// ==================== خدمات المنتجات ====================
export const productsService = {
  getProducts: (params = {}) => apiClient.get(buildUrl(adminEndpoints.products, params)),
  
  createProduct: (data) => {
    if (data instanceof FormData) {
      return apiClient.post(adminEndpoints.products, data, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    }
    return apiClient.post(adminEndpoints.products, data);
  },
  
  getProductStats: () => apiClient.get(adminEndpoints.productStats),
  
  getProductDetails: (product) => {
    const id = getItemId(product);
    return apiClient.get(adminEndpoints.productDetails(id));
  },
  
  updateProduct: (product, data) => {
    const id = getItemId(product);
    if (data instanceof FormData) {
      return apiClient.put(adminEndpoints.productDetails(id), data, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    }
    return apiClient.put(adminEndpoints.productDetails(id), data);
  },
  
  deleteProduct: (product) => {
    const id = getItemId(product);
    return apiClient.delete(adminEndpoints.productDetails(id));
  },
  
  featureProduct: (product, data) => {
    const id = getItemId(product);
    return apiClient.put(adminEndpoints.featureProduct(id), data);
  },
  
  updateProductImage: (product, formData) => {
    const id = getItemId(product);
    return apiClient.put(adminEndpoints.updateProductImage(id), formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  
  toggleAvailability: (product) => {
    const id = getItemId(product);
    return apiClient.put(adminEndpoints.toggleProductAvailability(id));
  },
  
  updateInventory: (product, data) => {
    const id = getItemId(product);
    return apiClient.put(adminEndpoints.updateProductInventory(id), data);
  },
};

// ==================== خدمات الطلبات ====================
export const ordersService = {
  getOrders: (params = {}) => apiClient.get(buildUrl(adminEndpoints.orders, params)),
  getOrderDetails: (order) => {
    const id = getItemId(order);
    return apiClient.get(adminEndpoints.orderDetails(id));
  },
  getOrdersStatsOverview: (params = {}) => apiClient.get(buildUrl(adminEndpoints.ordersStatsOverview, params)),
  getOrdersStatsDaily: () => apiClient.get(adminEndpoints.ordersStatsDaily),
  getOrdersStatsMonthly: (params = {}) => apiClient.get(buildUrl(adminEndpoints.ordersStatsMonthly, params)),
  assignDriver: (order, data) => {
    const id = getItemId(order);
    return apiClient.put(adminEndpoints.assignDriver(id), data);
  },
  reassignDriver: (order) => {
    const id = getItemId(order);
    return apiClient.put(adminEndpoints.reassignDriver(id));
  },
  forceCancelOrder: (order, data) => {
    const id = getItemId(order);
    return apiClient.put(adminEndpoints.forceCancelOrder(id), data);
  },
};

// ==================== خدمات المندوبين ====================
export const driversService = {
  getDrivers: (params = {}) => apiClient.get(buildUrl(adminEndpoints.drivers, params)),
  getDriverDetails: (driver) => {
    const id = getItemId(driver);
    return apiClient.get(adminEndpoints.driverDetails(id));
  },
  getDriverLocation: (driver) => {
    const id = getItemId(driver);
    return apiClient.get(adminEndpoints.driverLocation(id));
  },
  getDriverStats: (driver) => {
    const id = getItemId(driver);
    return apiClient.get(adminEndpoints.driverStats(id));
  },
  getDriverOrders: (driver, params = {}) => {
    const id = getItemId(driver);
    return apiClient.get(buildUrl(adminEndpoints.driverOrders(id), params));
  },
  verifyDriver: (driver) => {
    const id = getItemId(driver);
    return apiClient.put(adminEndpoints.verifyDriver(id));
  },
  updateDriverStatus: (driver, data) => {
    const id = getItemId(driver);
    return apiClient.put(adminEndpoints.updateDriverStatus(id), data);
  },
};

// ==================== خدمات الإشعارات ====================
export const notificationsService = {
  sendNotification: (data) => apiClient.post(adminEndpoints.sendNotification, data),
  getCampaignStats: (campaignId) => apiClient.get(adminEndpoints.campaignStats(campaignId)),
  getAllNotificationsStats: (params = {}) => apiClient.get(buildUrl(adminEndpoints.notificationsAllStats, params)),
};

// ==================== خدمات النظام ====================
export const systemService = {
  getCacheStats: () => apiClient.get(adminEndpoints.cacheStats),
  clearCache: (data = {}) => apiClient.post(adminEndpoints.clearCache, data),
  clearCacheByPattern: (pattern) => apiClient.post(adminEndpoints.clearCacheByPattern(pattern)),
  getRateLimitStats: () => apiClient.get(adminEndpoints.rateLimitStats),
  resetRateLimit: (userId) => apiClient.post(adminEndpoints.resetRateLimit(userId)),
  clearAllRateLimits: () => apiClient.delete(adminEndpoints.clearAllRateLimits),
  getSecurityHeaders: () => apiClient.get(adminEndpoints.securityHeaders),
};

// ==================== خدمات التحليلات ====================
export const analyticsService = {
  getUsersAnalytics: (params = {}) => apiClient.get(buildUrl(adminEndpoints.analyticsUsers, params)),
  getOrdersAnalytics: (params = {}) => apiClient.get(buildUrl(adminEndpoints.analyticsOrders, params)),
  getRevenueAnalytics: (params = {}) => apiClient.get(buildUrl(adminEndpoints.analyticsRevenue, params)),
};

// ==================== خدمات التقارير ====================
export const reportsService = {
  getOrdersReport: (params = {}) => apiClient.get(buildUrl(adminEndpoints.reportsOrders, params)),
  getUsersReport: (params = {}) => apiClient.get(buildUrl(adminEndpoints.reportsUsers, params)),
  getRevenueReport: (params = {}) => apiClient.get(buildUrl(adminEndpoints.reportsRevenue, params)),
  getDriversReport: (params = {}) => apiClient.get(buildUrl(adminEndpoints.reportsDrivers, params)),
  getStoresReport: (params = {}) => apiClient.get(buildUrl(adminEndpoints.reportsStores, params)),
};

// ==================== خدمات الإحصائيات المتقدمة ====================
export const advancedStatsService = {
  getDailyStats: () => apiClient.get(adminEndpoints.advancedStatsDaily),
  getWeeklyStats: () => apiClient.get(adminEndpoints.advancedStatsWeekly),
  getMonthlyStats: (params = {}) => apiClient.get(buildUrl(adminEndpoints.advancedStatsMonthly, params)),
  getCustomStats: (params = {}) => apiClient.get(buildUrl(adminEndpoints.advancedStatsCustom, params)),
};