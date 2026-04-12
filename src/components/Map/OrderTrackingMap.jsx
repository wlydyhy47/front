// src/components/Map/OrderTrackingMap.jsx - نسخة مصححة بالكامل

import { useEffect, useRef, forwardRef, useImperativeHandle, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { isValidCoordinate, getOrderCoordinates } from '../../utils/mapHelpers';
import { getId } from '../../utils/helpers';

// تأكد من وجود token في环境变量
mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN || '';

const OrderTrackingMap = forwardRef(({ 
    orderId, 
    order = null,
    height = 500,
    center,
    zoom,
    onZoomChange,
    onMapReady,
    showRoute = true,
    showMarkers = true,
    refreshInterval = 5000,
}, ref) => {
    const mapContainer = useRef(null);
    const map = useRef(null);
    const routeLayer = useRef(null);
    const pickupMarker = useRef(null);
    const deliveryMarker = useRef(null);
    const driverMarker = useRef(null);
    const refreshIntervalRef = useRef(null);

    // ✅ دالة تنظيف العلامات
    const clearMarkers = useCallback(() => {
        if (pickupMarker.current) {
            pickupMarker.current.remove();
            pickupMarker.current = null;
        }
        if (deliveryMarker.current) {
            deliveryMarker.current.remove();
            deliveryMarker.current = null;
        }
        if (driverMarker.current) {
            driverMarker.current.remove();
            driverMarker.current = null;
        }
    }, []);

    // ✅ دالة إضافة المسار
    const addRouteToMap = useCallback((coordinates) => {
        if (!map.current || !map.current.getSource('route')) return;
        
        const validCoords = coordinates.filter(coord => 
            isValidCoordinate(coord[1], coord[0])
        );
        
        if (validCoords.length > 0) {
            map.current.getSource('route').setData({
                type: 'Feature',
                properties: {},
                geometry: {
                    type: 'LineString',
                    coordinates: validCoords
                }
            });
            
            // ضبط الخريطة على المسار
            const bounds = new mapboxgl.LngLatBounds();
            validCoords.forEach(coord => bounds.extend(coord));
            map.current.fitBounds(bounds, { padding: 50 });
        }
    }, []);

    // ✅ دالة تحديث موقع المندوب
    const updateDriverLocation = useCallback((lat, lng, driverName = 'المندوب') => {
        if (!map.current) return;
        
        if (driverMarker.current) {
            driverMarker.current.remove();
        }
        
        if (isValidCoordinate(lat, lng)) {
            driverMarker.current = new mapboxgl.Marker({ color: '#4CAF50' })
                .setLngLat([lng, lat])
                .setPopup(new mapboxgl.Popup().setHTML(`
                    <div style="padding: 8px; direction: rtl;">
                        <strong>🚗 ${driverName}</strong><br/>
                        <small>${new Date().toLocaleTimeString('ar-SA')}</small>
                    </div>
                `))
                .addTo(map.current);
        }
    }, []);

    // ✅ دالة جلب بيانات الطلب
    const fetchOrderData = useCallback(async () => {
        const orderIdentifier = orderId || getId(order);
        if (!orderIdentifier) return;

        try {
            const response = await fetch(`/api/orders/${orderIdentifier}/track`);
            if (!response.ok) throw new Error('Failed to fetch order data');
            
            const data = await response.json();
            
            if (showMarkers) {
                // إضافة علامة نقطة الاستلام
                if (data.pickupLocation && isValidCoordinate(data.pickupLocation.lat, data.pickupLocation.lng)) {
                    if (pickupMarker.current) pickupMarker.current.remove();
                    pickupMarker.current = new mapboxgl.Marker({ color: '#FF5722' })
                        .setLngLat([data.pickupLocation.lng, data.pickupLocation.lat])
                        .setPopup(new mapboxgl.Popup().setHTML(`
                            <div style="padding: 8px; direction: rtl;">
                                <strong>📍 نقطة الاستلام</strong><br/>
                                <small>${data.pickupLocation.address || ''}</small>
                            </div>
                        `))
                        .addTo(map.current);
                }
                
                // إضافة علامة وجهة التوصيل
                if (data.deliveryLocation && isValidCoordinate(data.deliveryLocation.lat, data.deliveryLocation.lng)) {
                    if (deliveryMarker.current) deliveryMarker.current.remove();
                    deliveryMarker.current = new mapboxgl.Marker({ color: '#2196F3' })
                        .setLngLat([data.deliveryLocation.lng, data.deliveryLocation.lat])
                        .setPopup(new mapboxgl.Popup().setHTML(`
                            <div style="padding: 8px; direction: rtl;">
                                <strong>🏠 وجهة التوصيل</strong><br/>
                                <small>${data.deliveryLocation.address || ''}</small>
                            </div>
                        `))
                        .addTo(map.current);
                }
            }
            
            // تحديث موقع المندوب
            if (data.driverLocation && isValidCoordinate(data.driverLocation.lat, data.driverLocation.lng)) {
                updateDriverLocation(data.driverLocation.lat, data.driverLocation.lng, data.driverName);
            }
            
            // إضافة المسار
            if (showRoute && data.route && data.route.coordinates) {
                addRouteToMap(data.route.coordinates);
            }
            
            return data;
        } catch (error) {
            console.error('Failed to fetch order route:', error);
            return null;
        }
    }, [orderId, order, showMarkers, showRoute, addRouteToMap, updateDriverLocation]);

    // ✅ تعريف الدوال التي يمكن استدعاؤها من الخارج
    useImperativeHandle(ref, () => ({
        zoomIn: () => {
            if (map.current) map.current.zoomIn();
        },
        zoomOut: () => {
            if (map.current) map.current.zoomOut();
        },
        fitBounds: (bounds) => {
            if (map.current && bounds) {
                map.current.fitBounds(bounds, { padding: 50 });
            }
        },
        refresh: () => {
            fetchOrderData();
        },
        clearRoute: () => {
            if (map.current && map.current.getSource('route')) {
                map.current.getSource('route').setData({
                    type: 'Feature',
                    properties: {},
                    geometry: {
                        type: 'LineString',
                        coordinates: []
                    }
                });
            }
        },
        clearMarkers: () => {
            clearMarkers();
        }
    }));

    // ✅ تهيئة الخريطة
    useEffect(() => {
        if (!mapContainer.current || map.current) return;

        // تحديد المركز الافتراضي
        let defaultCenter = [2.1254, 13.5127]; // نيامي، النيجر
        
        if (center && isValidCoordinate(center.lat, center.lng)) {
            defaultCenter = [center.lng, center.lat];
        }

        map.current = new mapboxgl.Map({
            container: mapContainer.current,
            style: 'mapbox://styles/mapbox/streets-v12',
            center: defaultCenter,
            zoom: zoom || 12,
        });

        // إضافة أدوات التحكم
        map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');
        map.current.addControl(new mapboxgl.FullscreenControl());
        map.current.addControl(new mapboxgl.ScaleControl(), 'bottom-right');

        // مراقبة تغيير التكبير
        if (onZoomChange) {
            map.current.on('zoomend', () => {
                onZoomChange(map.current.getZoom());
            });
        }

        // إضافة طبقة المسار عند تحميل الخريطة
        map.current.on('load', () => {
            map.current.addSource('route', {
                type: 'geojson',
                data: {
                    type: 'Feature',
                    properties: {},
                    geometry: {
                        type: 'LineString',
                        coordinates: []
                    }
                }
            });

            map.current.addLayer({
                id: 'route',
                type: 'line',
                source: 'route',
                layout: {
                    'line-join': 'round',
                    'line-cap': 'round'
                },
                paint: {
                    'line-color': '#3887be',
                    'line-width': 5,
                    'line-opacity': 0.75
                }
            });
            
            if (onMapReady) {
                onMapReady(map.current);
            }
        });

        return () => {
            if (refreshIntervalRef.current) {
                clearInterval(refreshIntervalRef.current);
            }
            if (map.current) {
                map.current.remove();
                map.current = null;
            }
        };
    }, [center, zoom, onZoomChange, onMapReady]);

    // ✅ جلب بيانات الطلب عند تغيير orderId
    useEffect(() => {
        const orderIdentifier = orderId || getId(order);
        if (!orderIdentifier || !map.current) return;

        // جلب البيانات فوراً
        fetchOrderData();

        // إعداد التحديث الدوري
        if (refreshInterval > 0) {
            if (refreshIntervalRef.current) {
                clearInterval(refreshIntervalRef.current);
            }
            refreshIntervalRef.current = setInterval(fetchOrderData, refreshInterval);
        }

        return () => {
            if (refreshIntervalRef.current) {
                clearInterval(refreshIntervalRef.current);
            }
        };
    }, [orderId, order, fetchOrderData, refreshInterval]);

    // ✅ تنظيف عند إلغاء تحميل المكون
    useEffect(() => {
        return () => {
            clearMarkers();
        };
    }, [clearMarkers]);

    return (
        <div 
            ref={mapContainer} 
            style={{ 
                width: '100%', 
                height: `${height}px`,
                borderRadius: '8px',
                overflow: 'hidden'
            }} 
        />
    );
});

OrderTrackingMap.displayName = 'OrderTrackingMap';

export default OrderTrackingMap;