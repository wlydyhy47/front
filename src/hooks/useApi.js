// src/hooks/useApi.js - مع تحسينات

import { useState, useCallback, useRef } from 'react';
import apiClient from '../api/client';
import { toast } from 'react-hot-toast';

export function useApi(options = {}) {
  const { showToast = true, defaultErrorMessage = 'حدث خطأ' } = options;
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);
  
  // منع الطلبات المتزامنة
  const abortControllerRef = useRef(null);
  
  const cancelRequest = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  }, []);
  
  const request = useCallback(async (config) => {
    // إلغاء الطلب السابق إذا كان موجوداً
    cancelRequest();
    
    // إنشاء AbortController جديد
    abortControllerRef.current = new AbortController();
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiClient({
        ...config,
        signal: abortControllerRef.current.signal,
      });
      setData(response);
      return { success: true, data: response };
    } catch (err) {
      // تجاهل أخطاء الإلغاء
      if (err.name === 'AbortError' || err.code === 'ERR_CANCELED') {
        return { success: false, error: 'Request cancelled' };
      }
      
      const errorMessage = err.response?.data?.message || err.message || defaultErrorMessage;
      setError(errorMessage);
      
      if (showToast && errorMessage !== 'Request cancelled') {
        toast.error(errorMessage);
      }
      
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
      abortControllerRef.current = null;
    }
  }, [cancelRequest, showToast, defaultErrorMessage]);
  
  const get = useCallback((url, params) => 
    request({ method: 'GET', url, params }), [request]);
  
  const post = useCallback((url, data, config = {}) => 
    request({ method: 'POST', url, data, ...config }), [request]);
  
  const put = useCallback((url, data, config = {}) => 
    request({ method: 'PUT', url, data, ...config }), [request]);
  
  const del = useCallback((url) => 
    request({ method: 'DELETE', url }), [request]);
  
  const patch = useCallback((url, data) => 
    request({ method: 'PATCH', url, data }), [request]);
  
  return {
    loading,
    error,
    data,
    get,
    post,
    put,
    delete: del,
    patch,
    cancelRequest,
    request,
  };
}