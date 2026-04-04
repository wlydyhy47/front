// src/api/client.js - النسخة المصححة بالكامل

import axios from 'axios';
import { toast } from 'react-hot-toast';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Accept': 'application/json',
  },
  timeout: 30000,
});

// Request interceptor
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // ✅ إذا كانت البيانات FormData، اترك axios يضبط Content-Type تلقائياً
    if (config.data instanceof FormData) {
      // لا نضيف Content-Type يدوياً لأن axios سيضيفه مع الـ boundary
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

// Response interceptor
apiClient.interceptors.response.use(
  (response) => {
    return response.data;
  },
  async (error) => {
    const originalRequest = error.config;
    
    // ✅ تصحيح: استخدام /auth/refresh (بدون -token)
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        const refreshToken = localStorage.getItem('refreshToken');
        
        if (!refreshToken) {
          throw new Error('No refresh token');
        }
        
        // ✅ المسار الصحيح حسب Backend
        const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
          refreshToken,
        });
        
        const { accessToken, refreshToken: newRefreshToken } = response.data.data;
        
        localStorage.setItem('accessToken', accessToken);
        if (newRefreshToken) {
          localStorage.setItem('refreshToken', newRefreshToken);
        }
        
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        
        return apiClient(originalRequest);
      } catch (refreshError) {
        console.error('Refresh token failed:', refreshError);
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        window.location.href = '/login';
        toast.error('انتهت الجلسة، يرجى تسجيل الدخول مرة أخرى');
        return Promise.reject(refreshError);
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