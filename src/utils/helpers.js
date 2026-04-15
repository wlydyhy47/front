// src/utils/helpers.js - دوال مساعدة موحدة

/**
 * الحصول على ID بأمان - موحد لاستخدام _id
 * @param {Object} item - العنصر (مستخدم، متجر، منتج، طلب)
 * @returns {string|null}
 */
export const getId = (item) => {
  if (!item) return null;
  // إعطاء أولوية لـ _id كما في الـ Backend
  return item._id || item.id || null;
};

/**
 * توحيد البيانات المستلمة من الـ API
 * تضمن أن كل كائن له _id
 * @param {Object|Array} data - البيانات المستلمة
 * @returns {Object|Array} - البيانات بعد التوحيد
 */
export const normalizeData = (data) => {
  if (!data) return data;
  
  // إذا كانت مصفوفة
  if (Array.isArray(data)) {
    return data.map(item => normalizeItem(item));
  }
  
  // إذا كان كائن
  if (typeof data === 'object') {
    return normalizeItem(data);
  }
  
  return data;
};

/**
 * توحيد عنصر واحد
 * @param {Object} item - العنصر
 * @returns {Object} - العنصر بعد التوحيد
 */
const normalizeItem = (item) => {
  if (!item || typeof item !== 'object') return item;
  
  const normalized = { ...item };
  
  // التأكد من وجود _id
  if (item._id) {
    normalized._id = item._id;
  } else if (item.id) {
    normalized._id = item.id;
    // احتفظ بـ id للتوافق مع الإصدارات القديمة
    normalized.id = item.id;
  }
  
  // معالجة الكائنات المتداخلة
  Object.keys(normalized).forEach(key => {
    if (normalized[key] && typeof normalized[key] === 'object') {
      normalized[key] = normalizeData(normalized[key]);
    }
  });
  
  return normalized;
};

/**
 * إنشاء مفتاح فريد لـ React
 * @param {Object} item - العنصر
 * @param {number} index - الفهرس
 * @returns {string}
 */
export const getReactKey = (item, index) => {
  const id = getId(item);
  return id ? String(id) : `item-${index}`;
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

/**
 * الحصول على قيمة بأمان من كائن
 * @param {Object} obj - الكائن
 * @param {string} path - المسار (مثل 'user.name')
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

/**
 * تنسيق رقم الهاتف بأمان
 * @param {string} phone - رقم الهاتف
 * @returns {string}
 */
export const formatPhoneSafe = (phone) => {
  if (!phone) return '-';
  return String(phone);
};

/**
 * تنسيق التاريخ بأمان
 * @param {any} date - التاريخ
 * @returns {string}
 */
export const formatDateSafe = (date) => {
  if (!date) return '-';
  try {
    return new Date(date).toLocaleDateString('ar-SA');
  } catch {
    return '-';
  }
};

/**
 * معالجة الأخطاء بشكل موحد
 * @param {Error} error - الخطأ
 * @param {string} defaultMessage - الرسالة الافتراضية
 * @returns {string} - رسالة الخطأ
 */
export const handleError = (error, defaultMessage = 'حدث خطأ غير متوقع') => {
  console.error('Error:', error);
  
  if (error.response?.data?.message) {
    return error.response.data.message;
  }
  if (error.response?.data?.error) {
    return error.response.data.error;
  }
  if (error.message) {
    return error.message;
  }
  return defaultMessage;
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