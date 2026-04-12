// src/components/Map/StoreMap.jsx - نسخة مصححة بالكامل

import { useEffect, useRef, forwardRef, useImperativeHandle, useCallback, useMemo } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { getStoreCoordinates, isValidCoordinate, calculateDistance, formatDistance } from '../../utils/mapHelpers';
import { getId } from '../../utils/helpers';

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN || '';

const StoreMap = forwardRef(({ 
    stores = [], 
    userLocation, 
    onStoreSelect,
    onStoreClick,
    onRefresh,
    height = 500,
    center,
    zoom,
    onZoomChange,
    onMapReady,
    showUserLocation = true,
    showDistance = true,
    fitBoundsOnLoad = true,
    clusterMarkers = true,
}, ref) => {
    const mapContainer = useRef(null);
    const map = useRef(null);
    const markers = useRef([]);
    const userMarker = useRef(null);
    const boundsRef = useRef(null);

    // ✅ الحصول على المتاجر الصالحة (ذوي إحداثيات صحيحة)
    const getValidStores = useCallback(() => {
        return stores.filter(store => {
            const coords = getStoreCoordinates(store);
            return coords !== null && isValidCoordinate(coords.lat, coords.lng);
        });
    }, [stores]);

    // ✅ حساب المسافة من المستخدم لكل متجر
    const getStoresWithDistance = useCallback(() => {
        const validStores = getValidStores();
        if (!userLocation || !showDistance) return validStores;
        
        return validStores.map(store => {
            const coords = getStoreCoordinates(store);
            if (coords && userLocation) {
                const distance = calculateDistance(
                    userLocation.lat, userLocation.lng,
                    coords.lat, coords.lng
                );
                return { ...store, distance };
            }
            return store;
        }).sort((a, b) => (a.distance || Infinity) - (b.distance || Infinity));
    }, [getValidStores, userLocation, showDistance]);

    // ✅ حساب المركز المبدئي للخريطة
    const getInitialCenter = useCallback(() => {
        if (center && isValidCoordinate(center.lat, center.lng)) {
            return [center.lng, center.lat];
        }
        
        if (userLocation && isValidCoordinate(userLocation.lat, userLocation.lng) && showUserLocation) {
            return [userLocation.lng, userLocation.lat];
        }
        
        const validStores = getValidStores();
        if (validStores.length > 0) {
            const firstStore = validStores[0];
            const coords = getStoreCoordinates(firstStore);
            if (coords) {
                return [coords.lng, coords.lat];
            }
        }
        
        return [2.1254, 13.5127]; // نيامي، النيجر
    }, [center, userLocation, showUserLocation, getValidStores]);

    // ✅ ضبط حدود الخريطة لتشمل جميع المتاجر
    const fitBoundsToStores = useCallback(() => {
        if (!map.current) return;
        
        const storesToFit = getStoresWithDistance();
        if (storesToFit.length === 0) return;
        
        const bounds = new mapboxgl.LngLatBounds();
        
        storesToFit.forEach(store => {
            const coords = getStoreCoordinates(store);
            if (coords) {
                bounds.extend([coords.lng, coords.lat]);
            }
        });
        
        if (showUserLocation && userLocation && isValidCoordinate(userLocation.lat, userLocation.lng)) {
            bounds.extend([userLocation.lng, userLocation.lat]);
        }
        
        if (!bounds.isEmpty()) {
            map.current.fitBounds(bounds, { padding: 50 });
        }
    }, [getStoresWithDistance, showUserLocation, userLocation]);

    // ✅ إضافة علامات المتاجر
    const updateStoreMarkers = useCallback(() => {
        if (!map.current) return;
        
        // إزالة العلامات القديمة
        markers.current.forEach(marker => marker.remove());
        markers.current = [];
        
        const storesToShow = getStoresWithDistance();
        
        storesToShow.forEach(store => {
            const coords = getStoreCoordinates(store);
            if (!coords) return;
            
            const storeId = getId(store);
            const distanceText = store.distance ? formatDistance(store.distance) : '';
            const ratingText = store.averageRating ? `⭐ ${store.averageRating.toFixed(1)}` : '';
            
            // إنشاء محتوى popup
            const popupContent = `
                <div style="padding: 8px; direction: rtl; min-width: 180px;">
                    <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
                        <img src="${store.logo || ''}" style="width: 40px; height: 40px; border-radius: 8px; object-fit: cover;" onerror="this.src='data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'40\' height=\'40\' viewBox=\'0 0 24 24\'%3E%3Crect width=\'24\' height=\'24\' fill=\'%23FF5722\'/%3E%3Ctext x=\'12\' y=\'16\' text-anchor=\'middle\' fill=\'white\' font-size=\'12\'%3E${store.name?.charAt(0) || 'S'}%3C/text%3E%3C/svg%3E'"/>
                        <div>
                            <strong style="font-size: 14px;">${store.name || 'متجر'}</strong><br/>
                            <span style="font-size: 11px; color: #666;">${store.category || ''}</span>
                        </div>
                    </div>
                    ${ratingText ? `<div style="font-size: 12px; margin-bottom: 4px;">${ratingText}</div>` : ''}
                    ${distanceText ? `<div style="font-size: 11px; color: #4CAF50;">📍 ${distanceText}</div>` : ''}
                    ${store.isOpen !== undefined ? `
                        <div style="font-size: 11px; margin: 4px 0;">
                            ${store.isOpen ? '🟢 مفتوح الآن' : '🔴 مغلق حالياً'}
                        </div>
                    ` : ''}
                    <button 
                        onclick="window.selectStore_${storeId}()"
                        style="
                            margin-top: 8px;
                            padding: 4px 12px;
                            background: #FF5722;
                            color: white;
                            border: none;
                            border-radius: 4px;
                            cursor: pointer;
                            font-size: 12px;
                            width: 100%;
                        "
                    >
                        عرض التفاصيل
                    </button>
                </div>
            `;
            
            const popup = new mapboxgl.Popup({ offset: 25 })
                .setHTML(popupContent);
            
            const marker = new mapboxgl.Marker({ color: '#FF5722' })
                .setLngLat([coords.lng, coords.lat])
                .setPopup(popup)
                .addTo(map.current);
            
            // إضافة حدث النقر
            marker.getElement().addEventListener('click', () => {
                if (onStoreClick) onStoreClick(store);
                if (onStoreSelect) onStoreSelect(store);
            });
            
            markers.current.push(marker);
            
            // ربط الدالة العالمية
            window[`selectStore_${storeId}`] = () => {
                if (onStoreSelect) onStoreSelect(store);
            };
        });
        
    }, [getStoresWithDistance, onStoreSelect, onStoreClick]);

    // ✅ تحديث موقع المستخدم
    const updateUserLocation = useCallback(() => {
        if (!map.current) return;
        
        if (userMarker.current) {
            userMarker.current.remove();
            userMarker.current = null;
        }
        
        if (showUserLocation && userLocation && isValidCoordinate(userLocation.lat, userLocation.lng)) {
            userMarker.current = new mapboxgl.Marker({ color: '#2196F3' })
                .setLngLat([userLocation.lng, userLocation.lat])
                .setPopup(new mapboxgl.Popup().setHTML(`
                    <div style="padding: 8px; direction: rtl;">
                        <strong>📍 موقعك الحالي</strong>
                    </div>
                `))
                .addTo(map.current);
        }
    }, [showUserLocation, userLocation]);

    // ✅ تعريف الدوال التي يمكن استدعاؤها من الخارج
    useImperativeHandle(ref, () => ({
        zoomIn: () => {
            if (map.current) map.current.zoomIn();
        },
        zoomOut: () => {
            if (map.current) map.current.zoomOut();
        },
        fitBounds: () => {
            fitBoundsToStores();
        },
        refresh: () => {
            updateStoreMarkers();
            if (onRefresh) onRefresh();
        },
        flyToStore: (store) => {
            const coords = getStoreCoordinates(store);
            if (coords && map.current) {
                map.current.flyTo({ center: [coords.lng, coords.lat], zoom: 15 });
            }
        },
        flyTo: (lng, lat) => {
            if (map.current && isValidCoordinate(lat, lng)) {
                map.current.flyTo({ center: [lng, lat], zoom: 14 });
            }
        },
        getMap: () => map.current,
    }));

    // ✅ تهيئة الخريطة
    useEffect(() => {
        if (!mapContainer.current || map.current) return;

        const initialCenter = getInitialCenter();

        map.current = new mapboxgl.Map({
            container: mapContainer.current,
            style: 'mapbox://styles/mapbox/streets-v12',
            center: initialCenter,
            zoom: zoom || 12,
        });

        map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');
        map.current.addControl(new mapboxgl.FullscreenControl());
        map.current.addControl(new mapboxgl.ScaleControl(), 'bottom-right');

        if (onZoomChange) {
            map.current.on('zoomend', () => {
                onZoomChange(map.current.getZoom());
            });
        }

        map.current.on('load', () => {
            if (fitBoundsOnLoad) {
                fitBoundsToStores();
            }
            if (onMapReady) {
                onMapReady(map.current);
            }
        });

        return () => {
            markers.current.forEach(marker => marker.remove());
            markers.current = [];
            if (userMarker.current) userMarker.current.remove();
            if (map.current) {
                map.current.remove();
                map.current = null;
            }
        };
    }, []);

    // ✅ تحديث العلامات عند تغيير المتاجر
    useEffect(() => {
        if (!map.current) return;
        updateStoreMarkers();
    }, [stores, userLocation, updateStoreMarkers]);

    // ✅ تحديث موقع المستخدم
    useEffect(() => {
        if (!map.current) return;
        updateUserLocation();
        
        // إعادة ضبط الحدود عند تغيير موقع المستخدم
        if (fitBoundsOnLoad && userLocation) {
            setTimeout(() => fitBoundsToStores(), 100);
        }
    }, [userLocation, showUserLocation, updateUserLocation, fitBoundsToStores, fitBoundsOnLoad]);

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