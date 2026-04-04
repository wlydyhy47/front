// src/components/Map/DriverLocationMap.jsx - النسخة المصححة
import { useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { getDriverCoordinates, isValidCoordinate } from '../../utils/mapHelpers';

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN;

const DriverLocationMap = forwardRef(({
  drivers = [],
  selectedDriver,
  onDriverSelect,
  height = 500,
  center,
  zoom,
  onZoomChange,
  onMapReady
}, ref) => {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const markers = useRef({});

  // ✅ استخدام الدالة المساعدة من mapHelpers
  const getValidDrivers = () => {
    return drivers.filter(driver => {
      const coords = getDriverCoordinates(driver);
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
    flyToDriver: (driverId) => {
      const driver = drivers.find(d => d.id === driverId);
      if (driver) {
        const coords = getDriverCoordinates(driver);
        if (coords && map.current) {
          map.current.flyTo({ center: [coords.lng, coords.lat], zoom: 14 });
        }
      }
    }
  }));

  useEffect(() => {
    if (!mapContainer.current) return;

    // المركز الافتراضي - نيامي، النيجر
    let defaultCenter = [2.1254, 13.5127];

    if (center && isValidCoordinate(center.lat, center.lng)) {
      defaultCenter = [center.lng, center.lat];
    } else {
      const validDrivers = getValidDrivers();
      if (validDrivers.length > 0) {
        const firstDriver = validDrivers[0];
        const coords = getDriverCoordinates(firstDriver);
        if (coords) {
          defaultCenter = [coords.lng, coords.lat];
        }
      }
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

    if (onMapReady) {
      map.current.on('load', () => {
        onMapReady();
      });
    }

    return () => {
      if (map.current) {
        map.current.remove();
      }
    };
  }, []);

  // إضافة علامات المندوبين
  useEffect(() => {
    if (!map.current) return;

    // إزالة العلامات القديمة
    Object.values(markers.current).forEach(marker => marker.remove());
    markers.current = {};

    const validDrivers = getValidDrivers();

    validDrivers.forEach(driver => {
      const coords = getDriverCoordinates(driver);
      if (!coords) return;

      const isOnline = driver.isOnline;
      const markerColor = isOnline ? '#4CAF50' : '#9E9E9E';

      const popup = new mapboxgl.Popup({ offset: 25 })
        .setHTML(`
          <div style="padding: 8px; direction: rtl;">
            <strong>${driver.name || 'مندوب'}</strong><br/>
            ${isOnline ? '🟢 متصل' : '⚫ غير متصل'}<br/>
            ${driver.rating ? `⭐ ${driver.rating.toFixed(1)} / 5` : ''}
            ${driver.location?.updatedAt ? `<br/><small>${new Date(driver.location.updatedAt).toLocaleTimeString()}</small>` : ''}
          </div>
        `);

      const marker = new mapboxgl.Marker({ color: markerColor })
        .setLngLat([coords.lng, coords.lat])
        .setPopup(popup)
        .addTo(map.current);

      marker.getElement().addEventListener('click', () => {
        if (onDriverSelect) onDriverSelect(driver);
      });

      markers.current[driver.id] = marker;
    });

  }, [drivers, onDriverSelect]);

  // تحديث العلامة المحددة
  useEffect(() => {
    if (!map.current || !selectedDriver) return;

    const coords = getDriverCoordinates(selectedDriver);
    if (coords) {
      map.current.flyTo({ center: [coords.lng, coords.lat], zoom: 14 });

      // تمييز العلامة المحددة
      Object.values(markers.current).forEach(marker => {
        marker.getElement().style.transform = '';
      });

      if (markers.current[selectedDriver.id]) {
        markers.current[selectedDriver.id].getElement().style.transform = 'scale(1.2)';
        markers.current[selectedDriver.id].togglePopup();
      }
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