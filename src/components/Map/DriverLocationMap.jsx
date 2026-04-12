// src/components/Map/DriverLocationMap.jsx - نسخة مصححة بالكامل

import { useEffect, useRef, forwardRef, useImperativeHandle, useCallback, useMemo } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { getDriverCoordinates, isValidCoordinate, formatDistance } from '../../utils/mapHelpers';
import { getId } from '../../utils/helpers';

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN || '';

const DriverLocationMap = forwardRef(({
    drivers = [],
    selectedDriver,
    onDriverSelect,
    onDriverClick,
    height = 500,
    center,
    zoom,
    onZoomChange,
    onMapReady,
    showUserLocation = true,
    userLocation = null,
    refreshInterval = 10000,
    fitBoundsOnLoad = true,
}, ref) => {
    const mapContainer = useRef(null);
    const map = useRef(null);
    const markers = useRef({});
    const userMarker = useRef(null);
    const refreshIntervalRef = useRef(null);
    const boundsRef = useRef(null);

    // ✅ الحصول على المندوبين الصالحين (ذوي إحداثيات صحيحة)
    const getValidDrivers = useCallback(() => {
        return drivers.filter(driver => {
            const coords = getDriverCoordinates(driver);
            return coords !== null && isValidCoordinate(coords.lat, coords.lng);
        });
    }, [drivers]);

    // ✅ حساب المركز المبدئي للخريطة
    const getInitialCenter = useCallback(() => {
        if (center && isValidCoordinate(center.lat, center.lng)) {
            return [center.lng, center.lat];
        }
        
        if (userLocation && isValidCoordinate(userLocation.lat, userLocation.lng) && showUserLocation) {
            return [userLocation.lng, userLocation.lat];
        }
        
        const validDrivers = getValidDrivers();
        if (validDrivers.length > 0) {
            const firstDriver = validDrivers[0];
            const coords = getDriverCoordinates(firstDriver);
            if (coords) {
                return [coords.lng, coords.lat];
            }
        }
        
        return [2.1254, 13.5127]; // نيامي، النيجر
    }, [center, userLocation, showUserLocation, getValidDrivers]);

    // ✅ ضبط حدود الخريطة لتشمل جميع المندوبين
    const fitBoundsToDrivers = useCallback(() => {
        if (!map.current) return;
        
        const validDrivers = getValidDrivers();
        if (validDrivers.length === 0) return;
        
        const bounds = new mapboxgl.LngLatBounds();
        
        validDrivers.forEach(driver => {
            const coords = getDriverCoordinates(driver);
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
    }, [getValidDrivers, showUserLocation, userLocation]);

    // ✅ إضافة أو تحديث علامات المندوبين
    const updateDriverMarkers = useCallback(() => {
        if (!map.current) return;
        
        const validDrivers = getValidDrivers();
        const currentMarkerIds = Object.keys(markers.current);
        const newDriverIds = new Set();
        
        validDrivers.forEach(driver => {
            const driverId = getId(driver);
            if (!driverId) return;
            
            newDriverIds.add(driverId);
            const coords = getDriverCoordinates(driver);
            if (!coords) return;
            
            const isOnline = driver.isOnline;
            const markerColor = isOnline ? '#4CAF50' : '#9E9E9E';
            
            // تحديث العلامة الموجودة أو إنشاء علامة جديدة
            if (markers.current[driverId]) {
                // تحديث موقع العلامة
                markers.current[driverId].setLngLat([coords.lng, coords.lat]);
                
                // تحديث لون العلامة إذا تغيرت الحالة
                const markerElement = markers.current[driverId].getElement();
                const currentColor = markerElement.querySelector('svg circle')?.getAttribute('fill');
                if (currentColor !== markerColor) {
                    markers.current[driverId].remove();
                    markers.current[driverId] = null;
                }
            }
            
            if (!markers.current[driverId]) {
                const popup = new mapboxgl.Popup({ offset: 25 })
                    .setHTML(`
                        <div style="padding: 8px; direction: rtl; min-width: 150px;">
                            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
                                <img src="${driver.avatar || ''}" style="width: 32px; height: 32px; border-radius: 50%;" onerror="this.src='data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'32\' height=\'32\' viewBox=\'0 0 24 24\'%3E%3Ccircle cx=\'12\' cy=\'12\' r=\'12\' fill=\'%23999\'/%3E%3Ctext x=\'12\' y=\'16\' text-anchor=\'middle\' fill=\'white\' font-size=\'12\'%3E${driver.name?.charAt(0) || 'D'}%3C/text%3E%3C/svg%3E'"/>
                                <div>
                                    <strong>${driver.name || 'مندوب'}</strong><br/>
                                    ${isOnline ? '<span style="color: #4CAF50;">🟢 متصل</span>' : '<span style="color: #9E9E9E;">⚫ غير متصل</span>'}
                                </div>
                            </div>
                            ${driver.rating ? `<div>⭐ ${driver.rating.toFixed(1)} / 5</div>` : ''}
                            ${driver.totalDeliveries ? `<div>📦 ${driver.totalDeliveries} توصيلة</div>` : ''}
                            ${driver.location?.updatedAt ? `<div><small>🕐 ${new Date(driver.location.updatedAt).toLocaleTimeString('ar-SA')}</small></div>` : ''}
                            <button 
                                onclick="window.selectDriver_${driverId}()"
                                style="
                                    margin-top: 8px;
                                    padding: 4px 12px;
                                    background: #1976d2;
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
                    `);
                
                const marker = new mapboxgl.Marker({ color: markerColor })
                    .setLngLat([coords.lng, coords.lat])
                    .setPopup(popup)
                    .addTo(map.current);
                
                // إضافة حدث النقر
                marker.getElement().addEventListener('click', () => {
                    if (onDriverClick) onDriverClick(driver);
                    if (onDriverSelect) onDriverSelect(driver);
                });
                
                markers.current[driverId] = marker;
                
                // ربط الدالة العالمية
                window[`selectDriver_${driverId}`] = () => {
                    if (onDriverSelect) onDriverSelect(driver);
                };
            }
        });
        
        // إزالة العلامات القديمة
        currentMarkerIds.forEach(markerId => {
            if (!newDriverIds.has(markerId) && markers.current[markerId]) {
                markers.current[markerId].remove();
                delete markers.current[markerId];
                delete window[`selectDriver_${markerId}`];
            }
        });
        
        // تمييز المندوب المحدد
        const selectedId = getId(selectedDriver);
        Object.entries(markers.current).forEach(([id, marker]) => {
            const markerElement = marker.getElement();
            if (id === selectedId) {
                markerElement.style.transform = 'scale(1.2)';
                markerElement.style.zIndex = '1000';
                marker.togglePopup();
            } else {
                markerElement.style.transform = '';
                markerElement.style.zIndex = '';
            }
        });
        
    }, [drivers, selectedDriver, getValidDrivers, onDriverSelect, onDriverClick]);

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
                .setPopup(new mapboxgl.Popup().setHTML('<strong>📍 موقعك الحالي</strong>'))
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
            fitBoundsToDrivers();
        },
        refresh: () => {
            updateDriverMarkers();
        },
        flyToDriver: (driver) => {
            const coords = getDriverCoordinates(driver);
            if (coords && map.current) {
                map.current.flyTo({ center: [coords.lng, coords.lat], zoom: 14 });
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
                fitBoundsToDrivers();
            }
            if (onMapReady) {
                onMapReady(map.current);
            }
        });

        return () => {
            if (refreshIntervalRef.current) {
                clearInterval(refreshIntervalRef.current);
            }
            Object.values(markers.current).forEach(marker => marker.remove());
            markers.current = {};
            if (userMarker.current) userMarker.current.remove();
            if (map.current) {
                map.current.remove();
                map.current = null;
            }
        };
    }, []);

    // ✅ تحديث العلامات عند تغيير المندوبين
    useEffect(() => {
        if (!map.current) return;
        
        updateDriverMarkers();
        
        // إعداد التحديث الدوري
        if (refreshInterval > 0) {
            if (refreshIntervalRef.current) {
                clearInterval(refreshIntervalRef.current);
            }
            refreshIntervalRef.current = setInterval(updateDriverMarkers, refreshInterval);
        }
        
        return () => {
            if (refreshIntervalRef.current) {
                clearInterval(refreshIntervalRef.current);
            }
        };
    }, [drivers, updateDriverMarkers, refreshInterval]);

    // ✅ تحديث موقع المستخدم
    useEffect(() => {
        if (!map.current) return;
        updateUserLocation();
    }, [userLocation, showUserLocation, updateUserLocation]);

    // ✅ الطيران إلى المندوب المحدد
    useEffect(() => {
        if (!map.current || !selectedDriver) return;
        
        const coords = getDriverCoordinates(selectedDriver);
        if (coords) {
            map.current.flyTo({ center: [coords.lng, coords.lat], zoom: 14 });
        }
    }, [selectedDriver]);

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

DriverLocationMap.displayName = 'DriverLocationMap';

export default DriverLocationMap;