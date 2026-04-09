// src/components/Map/StoreMap.jsx - النسخة المصححة
import { useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { getStoreCoordinates, isValidCoordinate } from '../../utils/mapHelpers';

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN;

// ✅ FIXED: استخدام forwardRef مع قوسين عاديين (props, ref)
const StoreMap = forwardRef(({ 
    stores = [], 
    userLocation, 
    onStoreSelect, 
    onRefresh,
    height = 500,
    center,
    zoom,
    onZoomChange 
}, ref) => {
    const mapContainer = useRef(null);
    const map = useRef(null);
    const markers = useRef([]);
    const userMarker = useRef(null);

    // ✅ استخدام الدالة المساعدة من mapHelpers
    const getValidStores = () => {
        return stores.filter(store => {
            const coords = getStoreCoordinates(store);
            return coords !== null;
        });
    };

    useImperativeHandle(ref, () => ({
        zoomIn: () => {
            if (map.current) map.current.zoomIn();
        },
        zoomOut: () => {
            if (map.current) map.current.zoomOut();
        },
        flyTo: (lng, lat) => {
            if (map.current && isValidCoordinate(lat, lng)) {
                map.current.flyTo({ center: [lng, lat], zoom: 14 });
            }
        }
    }));

    useEffect(() => {
        if (!mapContainer.current) return;

        // المركز الافتراضي - نيامي، النيجر
        let defaultCenter = [2.1254, 13.5127];

        if (center && isValidCoordinate(center.lat, center.lng)) {
            defaultCenter = [center.lng, center.lat];
        } else if (userLocation && isValidCoordinate(userLocation.lat, userLocation.lng)) {
            defaultCenter = [userLocation.lng, userLocation.lat];
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

        return () => {
            if (map.current) {
                map.current.remove();
            }
        };
    }, []);

    // إضافة علامات المتاجر
    useEffect(() => {
        if (!map.current) return;

        // إزالة العلامات القديمة
        markers.current.forEach(marker => marker.remove());
        markers.current = [];

        const validStores = getValidStores();

        validStores.forEach(store => {
            const coords = getStoreCoordinates(store);
            if (!coords) return;

            const popup = new mapboxgl.Popup({ offset: 25 })
                .setHTML(`
                    <div style="padding: 8px; min-width: 150px; direction: rtl;">
                        <h4 style="margin: 0 0 5px 0;">${store.name || 'متجر'}</h4>
                        <p style="margin: 5px 0; font-size: 12px; color: #666;">
                            ${store.category || ''}
                        </p>
                        ${store.averageRating ? `
                            <p style="margin: 5px 0; font-size: 12px;">
                                ⭐ ${store.averageRating.toFixed(1)} / 5
                            </p>
                        ` : ''}
                        <button 
                            onclick="window.selectStore('${store._id}')"
                            style="
                                margin-top: 5px;
                                padding: 4px 12px;
                                background: #1976d2;
                                color: white;
                                border: none;
                                border-radius: 4px;
                                cursor: pointer;
                                font-size: 12px;
                            "
                        >
                            عرض التفاصيل
                        </button>
                    </div>
                `);

            const marker = new mapboxgl.Marker({ color: '#FF5722' })
                .setLngLat([coords.lng, coords.lat])
                .setPopup(popup)
                .addTo(map.current);

            marker.getElement().addEventListener('click', () => {
                if (onStoreSelect) onStoreSelect(store);
            });

            markers.current.push(marker);
        });

        // ربط الدالة العالمية
        window.selectStore = (storeId) => {
            const store = stores.find(s => s._id === storeId);
            if (store && onStoreSelect) onStoreSelect(store);
        };

    }, [stores, onStoreSelect]);

    // تحديث موقع المستخدم
    useEffect(() => {
        if (!map.current) return;

        // إزالة العلامة القديمة
        if (userMarker.current) {
            userMarker.current.remove();
        }

        if (userLocation && isValidCoordinate(userLocation.lat, userLocation.lng)) {
            userMarker.current = new mapboxgl.Marker({ color: '#2196F3' })
                .setLngLat([userLocation.lng, userLocation.lat])
                .setPopup(new mapboxgl.Popup().setHTML('<strong>📍 موقعك الحالي</strong>'))
                .addTo(map.current);
        }
    }, [userLocation]);

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

StoreMap.displayName = 'StoreMap';

export default StoreMap;