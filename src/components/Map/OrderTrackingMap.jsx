// src/components/Map/OrderTrackingMap.jsx - النسخة المصححة
import { useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { getOrderCoordinates, isValidCoordinate } from '../../utils/mapHelpers';

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN;

const OrderTrackingMap = forwardRef(({ 
    orderId, 
    height = 500,
    center,
    zoom,
    onZoomChange 
}, ref) => {
    const mapContainer = useRef(null);
    const map = useRef(null);
    const routeLayer = useRef(null);
    const pickupMarker = useRef(null);
    const deliveryMarker = useRef(null);
    const driverMarker = useRef(null);

    useImperativeHandle(ref, () => ({
        zoomIn: () => {
            if (map.current) map.current.zoomIn();
        },
        zoomOut: () => {
            if (map.current) map.current.zoomOut();
        },
        addRoute: (coordinates) => {
            if (!map.current) return;
            
            const validCoords = coordinates.filter(coord => 
                isValidCoordinate(coord[1], coord[0])
            );
            
            if (validCoords.length > 0 && map.current.getSource('route')) {
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
        },
        updateDriverLocation: (lat, lng) => {
            if (!map.current) return;
            
            if (driverMarker.current) {
                driverMarker.current.remove();
            }
            
            if (isValidCoordinate(lat, lng)) {
                driverMarker.current = new mapboxgl.Marker({ color: '#4CAF50' })
                    .setLngLat([lng, lat])
                    .setPopup(new mapboxgl.Popup().setHTML('<strong>🚗 المندوب</strong>'))
                    .addTo(map.current);
            }
        }
    }));

    useEffect(() => {
        if (!mapContainer.current) return;

        let defaultCenter = [2.1254, 13.5127];
        
        if (center && isValidCoordinate(center.lat, center.lng)) {
            defaultCenter = [center.lng, center.lat];
        }

        map.current = new mapboxgl.Map({
            container: mapContainer.current,
            style: 'mapbox://styles/mapbox/streets-v12',
            center: defaultCenter,
            zoom: zoom || 12,
        });

        map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');
        map.current.addControl(new mapboxgl.FullscreenControl());

        if (onZoomChange) {
            map.current.on('zoomend', () => {
                onZoomChange(map.current.getZoom());
            });
        }

        map.current.on('load', () => {
            // إضافة طبقة المسار
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
        });

        return () => {
            if (map.current) {
                map.current.remove();
            }
        };
    }, []);

    // جلب مسار الطلب
    useEffect(() => {
        if (!orderId || !map.current) return;

        const fetchOrderRoute = async () => {
            try {
                const response = await fetch(`/api/orders/${orderId}/track`);
                const data = await response.json();
                
                // إضافة علامات نقاط البداية والنهاية
                if (data.pickupLocation && isValidCoordinate(data.pickupLocation.lat, data.pickupLocation.lng)) {
                    if (pickupMarker.current) pickupMarker.current.remove();
                    pickupMarker.current = new mapboxgl.Marker({ color: '#FF5722' })
                        .setLngLat([data.pickupLocation.lng, data.pickupLocation.lat])
                        .setPopup(new mapboxgl.Popup().setHTML('<strong>📍 نقطة الاستلام</strong>'))
                        .addTo(map.current);
                }
                
                if (data.deliveryLocation && isValidCoordinate(data.deliveryLocation.lat, data.deliveryLocation.lng)) {
                    if (deliveryMarker.current) deliveryMarker.current.remove();
                    deliveryMarker.current = new mapboxgl.Marker({ color: '#2196F3' })
                        .setLngLat([data.deliveryLocation.lng, data.deliveryLocation.lat])
                        .setPopup(new mapboxgl.Popup().setHTML('<strong>🏠 وجهة التوصيل</strong>'))
                        .addTo(map.current);
                }
                
                if (data.route && data.route.coordinates) {
                    const validCoords = data.route.coordinates.filter(coord => 
                        isValidCoordinate(coord[1], coord[0])
                    );
                    
                    if (validCoords.length > 0 && map.current.getSource('route')) {
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
                }
            } catch (error) {
                console.error('Failed to fetch order route:', error);
            }
        };

        fetchOrderRoute();
        
        // تحديث الموقع كل 5 ثواني
        const interval = setInterval(fetchOrderRoute, 5000);
        
        return () => clearInterval(interval);
    }, [orderId]);

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