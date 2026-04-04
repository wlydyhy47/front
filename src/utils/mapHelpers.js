// src/utils/mapHelpers.js - دوال مساعدة للخرائط

/**
 * التحقق من صحة الإحداثيات
 */
export const isValidCoordinate = (lat, lng) => {
  return (
    lat !== undefined && 
    lng !== undefined && 
    !isNaN(lat) && 
    !isNaN(lng) && 
    lat !== null && 
    lng !== null &&
    Math.abs(lat) <= 90 &&
    Math.abs(lng) <= 180
  );
};

/**
 * استخراج إحداثيات المتجر بأمان
 * يدعم كلاً من:
 * - address.latitude / address.longitude
 * - location.coordinates (GeoJSON format)
 * - lat / lng مباشرة
 */
export const getStoreCoordinates = (store) => {
  if (!store) return null;
  
  try {
    // 1. محاولة من address.latitude/longitude
    if (store.address?.latitude && store.address?.longitude) {
      const lat = parseFloat(store.address.latitude);
      const lng = parseFloat(store.address.longitude);
      if (isValidCoordinate(lat, lng)) {
        return { lat, lng };
      }
    }
    
    // 2. محاولة من location.coordinates (GeoJSON format)
    if (store.location?.coordinates && Array.isArray(store.location.coordinates)) {
      const coords = store.location.coordinates;
      if (coords.length >= 2) {
        const lng = parseFloat(coords[0]);
        const lat = parseFloat(coords[1]);
        if (isValidCoordinate(lat, lng)) {
          return { lat, lng };
        }
      }
    }
    
    // 3. محاولة من lat/lng مباشرة
    if (store.lat && store.lng && isValidCoordinate(store.lat, store.lng)) {
      return { 
        lat: parseFloat(store.lat), 
        lng: parseFloat(store.lng) 
      };
    }
    
    return null;
  } catch (error) {
    console.error('Error getting store coordinates:', error);
    return null;
  }
};

/**
 * استخراج إحداثيات المندوب بأمان
 */
export const getDriverCoordinates = (driver) => {
  if (!driver) return null;
  
  try {
    // 1. محاولة من location.coordinates (GeoJSON format)
    if (driver.location?.coordinates && Array.isArray(driver.location.coordinates)) {
      const coords = driver.location.coordinates;
      if (coords.length >= 2) {
        const lng = parseFloat(coords[0]);
        const lat = parseFloat(coords[1]);
        if (isValidCoordinate(lat, lng)) {
          return { lat, lng };
        }
      }
    }
    
    // 2. محاولة من driver.location.latitude/longitude
    if (driver.location?.latitude && driver.location?.longitude) {
      const lat = parseFloat(driver.location.latitude);
      const lng = parseFloat(driver.location.longitude);
      if (isValidCoordinate(lat, lng)) {
        return { lat, lng };
      }
    }
    
    // 3. محاولة من driverInfo.currentLocation
    if (driver.driverInfo?.currentLocation?.coordinates) {
      const coords = driver.driverInfo.currentLocation.coordinates;
      if (coords.length >= 2) {
        const lng = parseFloat(coords[0]);
        const lat = parseFloat(coords[1]);
        if (isValidCoordinate(lat, lng)) {
          return { lat, lng };
        }
      }
    }
    
    // 4. محاولة من lat/lng مباشرة
    if (driver.lat && driver.lng && isValidCoordinate(driver.lat, driver.lng)) {
      return { 
        lat: parseFloat(driver.lat), 
        lng: parseFloat(driver.lng) 
      };
    }
    
    return null;
  } catch (error) {
    console.error('Error getting driver coordinates:', error);
    return null;
  }
};

/**
 * استخراج إحداثيات الطلب (موقع الاستلام أو التوصيل)
 */
export const getOrderCoordinates = (order, type = 'delivery') => {
  if (!order) return null;
  
  try {
    let address = null;
    
    if (type === 'pickup') {
      address = order.pickupAddress;
    } else {
      address = order.deliveryAddress;
    }
    
    if (!address) return null;
    
    // محاولة من address.latitude/longitude
    if (address.latitude && address.longitude) {
      const lat = parseFloat(address.latitude);
      const lng = parseFloat(address.longitude);
      if (isValidCoordinate(lat, lng)) {
        return { lat, lng, address: address.addressLine };
      }
    }
    
    // محاولة من location.coordinates
    if (address.location?.coordinates && address.location.coordinates.length >= 2) {
      const coords = address.location.coordinates;
      const lng = parseFloat(coords[0]);
      const lat = parseFloat(coords[1]);
      if (isValidCoordinate(lat, lng)) {
        return { lat, lng, address: address.addressLine };
      }
    }
    
    return null;
  } catch (error) {
    console.error('Error getting order coordinates:', error);
    return null;
  }
};

/**
 * حساب المسافة بين نقطتين (هافرسين)
 * @returns المسافة بالكيلومترات
 */
export const calculateDistance = (lat1, lng1, lat2, lng2) => {
  const R = 6371; // نصف قطر الأرض بالكيلومتر
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

/**
 * تنسيق المسافة للعرض
 */
export const formatDistance = (distanceKm) => {
  if (distanceKm < 1) {
    return `${Math.round(distanceKm * 1000)} م`;
  }
  return `${distanceKm.toFixed(1)} كم`;
};

/**
 * الحصول على عنوان من الإحداثيات (عكسياً)
 */
export const reverseGeocode = async (lat, lng, apiKey) => {
  try {
    const response = await fetch(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${apiKey}&language=ar`
    );
    const data = await response.json();
    if (data.features && data.features.length > 0) {
      return data.features[0].place_name;
    }
    return null;
  } catch (error) {
    console.error('Reverse geocoding error:', error);
    return null;
  }
};