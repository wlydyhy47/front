// src/api/client.js - مع interceptor لتوحيد البيانات

import axios from 'axios';
import { toast } from 'react-hot-toast';
import { normalizeData } from '../utils/helpers';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Accept': 'application/json',
  },
  timeout: 30000,
});

// متغير لمنع تكرار محاولات refresh
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Request interceptor
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // إذا كانت البيانات FormData، اترك axios يضبط Content-Type تلقائياً
    if (config.data instanceof FormData) {
      // لا نضيف Content-Type يدوياً
      console.log('📤 Sending FormData');
      for (let pair of config.data.entries()) {
        console.log(`   ${pair[0]}:`, pair[1] instanceof File ? `[File: ${pair[1].name}]` : pair[1]);
      }
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - مع توحيد البيانات
apiClient.interceptors.response.use(
  (response) => {
    // توحيد البيانات في جميع الاستجابات
    if (response.data) {
      // توحيد البيانات الرئيسية
      response.data = normalizeData(response.data);
      
      // إذا كان هناك data.data (حسب هيكل الـ API)
      if (response.data.data) {
        response.data.data = normalizeData(response.data.data);
      }
      
      // إذا كان هناك data.results (لـ pagination)
      if (response.data.results) {
        response.data.results = normalizeData(response.data.results);
      }
      
      // إذا كان هناك data.orders أو data.users أو data.stores
      if (response.data.orders) {
        response.data.orders = normalizeData(response.data.orders);
      }
      if (response.data.users) {
        response.data.users = normalizeData(response.data.users);
      }
      if (response.data.stores) {
        response.data.stores = normalizeData(response.data.stores);
      }
      if (response.data.products) {
        response.data.products = normalizeData(response.data.products);
      }
      if (response.data.drivers) {
        response.data.drivers = normalizeData(response.data.drivers);
      }
      if (response.data.vendors) {
        response.data.vendors = normalizeData(response.data.vendors);
      }
    }
    return response.data;
  },
  async (error) => {
    const originalRequest = error.config;
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(token => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return apiClient(originalRequest);
          })
          .catch(err => Promise.reject(err));
      }
      
      originalRequest._retry = true;
      isRefreshing = true;
      
      try {
        const refreshToken = localStorage.getItem('refreshToken');
        
        if (!refreshToken) {
          throw new Error('No refresh token');
        }
        
        const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
          refreshToken,
        });
        
        const { accessToken, refreshToken: newRefreshToken } = response.data.data || response.data;
        
        localStorage.setItem('accessToken', accessToken);
        if (newRefreshToken) {
          localStorage.setItem('refreshToken', newRefreshToken);
        }
        
        processQueue(null, accessToken);
        
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        
        return apiClient(originalRequest);
      } catch (refreshError) {
        console.error('Refresh token failed:', refreshError);
        processQueue(refreshError, null);
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        window.location.href = '/login';
        toast.error('انتهت الجلسة، يرجى تسجيل الدخول مرة أخرى');
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }
    
    const errorMessage = error.response?.data?.message || error.message || 'حدث خطأ غير متوقع';
    
    if (error.response?.status === 403) {
      toast.error('ليس لديك صلاحية للوصول إلى هذا المورد');
    } else if (error.response?.status === 404) {
      toast.error('المورد غير موجود');
    } else if (error.response?.status === 429) {
      toast.error('طلبات كثيرة جداً، الرجاء المحاولة لاحقاً');
    } else if (error.response?.status >= 500) {
      toast.error('خطأ في الخادم، الرجاء المحاولة لاحقاً');
    } else if (error.response?.status !== 401) {
      toast.error(errorMessage);
    }
    
    return Promise.reject(error);
  }
);

export default apiClient;