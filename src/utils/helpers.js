// src/utils/helpers.js - دوال مساعدة

/**
 * الحصول على ID بأمان (يدعم _id و id)
 * @param {Object} item - العنصر
 * @returns {string|null} - الـ ID أو null
 */
export const getId = (item) => {
  if (!item) return null;
  return item._id || item.id || null;
};

/**
 * توحيد IDs في مصفوفة
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
 * إنشاء key فريد للـ React
 * @param {Object} item - العنصر
 * @param {number} index - الفهرس
 * @returns {string} - المفتاح
 */
export const getReactKey = (item, index) => {
  const id = getId(item);
  return id ? String(id) : `item-${index}-${Date.now()}`;
};

/**
 * معالجة الأخطاء بشكل موحد
 * @param {Error} error - الخطأ
 * @param {Function} onError - دالة معالجة إضافية
 * @returns {string} - رسالة الخطأ
 */
export const handleError = (error, onError = null) => {
  console.error('Error:', error);
  
  let message = 'حدث خطأ غير متوقع';
  
  if (error.response) {
    // خطأ من الخادم
    message = error.response.data?.message || 
              error.response.data?.error || 
              `خطأ ${error.response.status}`;
  } else if (error.request) {
    // لم يتم استلام رد
    message = 'لا يمكن الاتصال بالخادم';
  } else if (error.message) {
    message = error.message;
  }
  
  if (onError && typeof onError === 'function') {
    onError(message);
  }
  
  return message;
};

/**
 * تأخير التنفيذ (لـ debounce)
 * @param {Function} fn - الدالة
 * @param {number} delay - التأخير بالمللي ثانية
 * @returns {Function} - الدالة مع debounce
 */
export const debounce = (fn, delay = 500) => {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
};

/**
 * نسخ عميق للكائن
 * @param {Object} obj - الكائن
 * @returns {Object} - نسخة عميقة
 */
export const deepClone = (obj) => {
  if (!obj) return null;
  try {
    return JSON.parse(JSON.stringify(obj));
  } catch {
    return { ...obj };
  }
};

/**
 * التحقق من أن الكائن فارغ
 * @param {Object} obj - الكائن
 * @returns {boolean}
 */
export const isEmptyObject = (obj) => {
  return obj && Object.keys(obj).length === 0 && obj.constructor === Object;
};

/**
 * تنسيق الاسم (capitalize)
 * @param {string} str - النص
 * @returns {string}
 */
export const capitalize = (str) => {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

/**
 * انتظار لمدة محددة (Promise-based sleep)
 * @param {number} ms - المدة بالمللي ثانية
 * @returns {Promise}
 */
export const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * نسخ النص إلى الحافظة
 * @param {string} text - النص للنسخ
 * @returns {Promise<boolean>}
 */
export const copyToClipboard = async (text) => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (err) {
    console.error('Failed to copy:', err);
    return false;
  }
};

/**
 * استخراج رسالة الخطأ من الاستجابة
 * @param {Object} error - كائن الخطأ
 * @returns {string}
 */
export const extractErrorMessage = (error) => {
  if (error.response?.data?.message) {
    return error.response.data.message;
  }
  if (error.response?.data?.error) {
    return error.response.data.error;
  }
  if (error.message) {
    return error.message;
  }
  return 'حدث خطأ غير متوقع';
};