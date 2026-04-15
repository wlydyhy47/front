// src/hooks/useItemId.js - Hook مخصص للحصول على الـ ID

import { useCallback } from 'react';
import { getId, getReactKey } from '../utils/helpers';

/**
 * Hook مخصص للحصول على ID العنصر بأمان
 * @returns {Function} - دالة getId
 */
export const useItemId = () => {
  return useCallback((item) => getId(item), []);
};

/**
 * Hook لإنشاء مفاتيح React فريدة
 * @returns {Function} - دالة getKey
 */
export const useReactKey = () => {
  return useCallback((item, index) => getReactKey(item, index), []);
};

/**
 * Hook للتحقق من وجود ID
 * @returns {Function} - دالة hasId
 */
export const useHasId = () => {
  return useCallback((item) => !!getId(item), []);
};