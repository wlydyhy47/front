import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useQuery, useQueryClient } from 'react-query';
import { useResponsive } from '../../hooks/useResponsive';
import {
    Box,
    Paper,
    Typography,
    Grid,
    TextField,
    Button,
    Chip,
    IconButton,
    Tooltip,
    CircularProgress,
    Alert,
    List,
    ListItem,
    ListItemText,
    ListItemAvatar,
    Avatar,
    Rating,
    Snackbar,
    Fab,
    Badge,
    Zoom,
    FormControlLabel,
    Switch,
    Tabs,
    Tab,
    Collapse,
} from '@mui/material';
import {
    Refresh,
    MyLocation,
    Search,
    LocalShipping,
    Storefront,
    LocationOn,
    Directions,
    Update,
    ZoomIn,
    ZoomOut,
    FilterList,
    ClearAll,
} from '@mui/icons-material';
import { mapService, ordersService, storesService } from '../../api';
import DriverLocationMap from '../../components/Map/DriverLocationMap';
import OrderTrackingMap from '../../components/Map/OrderTrackingMap';
import StoreMap from '../../components/Map/StoreMap';

// ✅ تبويبات الصفحة
const TABS = {
    DRIVERS: 'drivers',
    ORDERS: 'orders',
    STORES: 'stores',
    SEARCH: 'search',
};

// ✅ مكون Tooltip آمن يتعامل مع العناصر المعطلة
const SafeTooltip = ({ title, children, disabled, ...props }) => {
    // إذا كان الـ Tooltip معطل أو الزر معطل، نلف الزر بـ span
    if (disabled || (children && children.props && children.props.disabled)) {
        return (
            <Tooltip title={title} {...props}>
                <span style={{ display: 'inline-flex', cursor: 'not-allowed' }}>
                    {children}
                </span>
            </Tooltip>
        );
    }
    
    return (
        <Tooltip title={title} {...props}>
            {children}
        </Tooltip>
    );
};

export default function MapPage() {
    const { isMobile, isTablet, fontSize, spacing } = useResponsive();
    const queryClient = useQueryClient();
    const mapRef = useRef(null);
    const [activeTab, setActiveTab] = useState(TABS.DRIVERS);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [selectedDriver, setSelectedDriver] = useState(null);
    const [userLocation, setUserLocation] = useState(null);
    const [nearbyStores, setNearbyStores] = useState([]);
    const [loadingLocation, setLoadingLocation] = useState(false);
    const [error, setError] = useState(null);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
    const [updatingStores, setUpdatingStores] = useState(false);
    const [autoRefreshInterval] = useState(10000);
    const [showDriverFilters, setShowDriverFilters] = useState(false);
    const [driverFilters, setDriverFilters] = useState({
        showOnlineOnly: false,
        showOfflineOnly: false,
        minRating: 0,
    });
    const [mapZoom, setMapZoom] = useState(12);
    const [mapCenter, setMapCenter] = useState(null);
    const [isMapReady, setIsMapReady] = useState(false);
    const [lastUpdateTime, setLastUpdateTime] = useState(null);

    // تحديد ارتفاع الخريطة حسب حجم الشاشة
    const mapHeight = isMobile ? 400 : isTablet ? 500 : 560;
    const sidePanelHeight = isMobile ? 400 : 650;

    // جلب مواقع المندوبين
    const { 
        data: driversLocations, 
        isLoading: driversLoading, 
        refetch: refetchDrivers,
        isFetching: isDriversFetching,
    } = useQuery(
        'drivers-locations',
        () => mapService.getAllDriversLocations({ limit: 100 }),
        { 
            enabled: activeTab === TABS.DRIVERS, 
            refetchInterval: autoRefreshInterval > 0 ? autoRefreshInterval : false,
            onSuccess: () => setLastUpdateTime(new Date()),
        }
    );
    
    // جلب الطلبات النشطة
    const { data: activeOrders, isLoading: ordersLoading, refetch: refetchOrders } = useQuery(
        'active-orders',
        () => ordersService.getOrders({
            page: 1,
            limit: 50,
            status: 'accepted,ready,picked,preparing,out_for_delivery'
        }),
        { 
            enabled: activeTab === TABS.ORDERS,
            refetchInterval: autoRefreshInterval > 0 ? autoRefreshInterval : false,
        }
    );

    // جلب المتاجر
    const { 
        data: allStores, 
        refetch: refetchStores,
        isLoading: storesLoading,
        isFetching: isStoresFetching,
    } = useQuery(
        'all-stores',
        () => storesService.getStores({ limit: 100 }),
        { 
            enabled: activeTab === TABS.STORES,
            refetchInterval: autoRefreshInterval > 0 ? autoRefreshInterval : false,
        }
    );

    // فلترة المندوبين
    const filteredDrivers = useCallback(() => {
        if (!driversLocations?.data?.drivers) return [];
        
        let drivers = [...driversLocations.data.drivers];
        
        if (driverFilters.showOnlineOnly) {
            drivers = drivers.filter(d => d.isOnline === true);
        }
        if (driverFilters.showOfflineOnly) {
            drivers = drivers.filter(d => d.isOnline === false);
        }
        if (driverFilters.minRating > 0) {
            drivers = drivers.filter(d => (d.rating || 0) >= driverFilters.minRating);
        }
        
        return drivers;
    }, [driversLocations, driverFilters]);

    // تحديث إحداثيات المتاجر
    const handleUpdateStoresCoordinates = async () => {
        try {
            setUpdatingStores(true);
            setSnackbar({ open: true, message: 'جاري تحديث مواقع المتاجر...', severity: 'info' });
            
            await storesService.updateStoreCoordinates();
            await refetchStores();
            
            if (userLocation) {
                await fetchNearbyStores(userLocation.lat, userLocation.lng);
            }
            
            setSnackbar({
                open: true,
                message: 'تم تحديث مواقع المتاجر بنجاح',
                severity: 'success'
            });
        } catch (error) {
            console.error('❌ Failed to update store coordinates:', error);
            setSnackbar({
                open: true,
                message: error.response?.data?.message || 'فشل تحديث مواقع المتاجر',
                severity: 'error'
            });
        } finally {
            setUpdatingStores(false);
        }
    };

    // تحديث جميع البيانات
    const refreshAllData = async () => {
        try {
            setSnackbar({ open: true, message: 'جاري تحديث البيانات...', severity: 'info' });
            
            const refreshPromises = [];
            
            if (activeTab === TABS.DRIVERS) {
                refreshPromises.push(refetchDrivers());
            } else if (activeTab === TABS.ORDERS) {
                refreshPromises.push(refetchOrders());
            } else if (activeTab === TABS.STORES) {
                refreshPromises.push(refetchStores());
                if (userLocation) {
                    refreshPromises.push(fetchNearbyStores(userLocation.lat, userLocation.lng));
                }
            }
            
            await Promise.all(refreshPromises);
            setLastUpdateTime(new Date());
            
            setSnackbar({
                open: true,
                message: 'تم تحديث البيانات بنجاح',
                severity: 'success'
            });
        } catch (error) {
            console.error('Refresh failed:', error);
            setSnackbar({
                open: true,
                message: 'فشل تحديث البيانات',
                severity: 'error'
            });
        }
    };

    // الحصول على موقع المستخدم
    const getUserLocation = useCallback(() => {
        setLoadingLocation(true);
        setError(null);

        if (!navigator.geolocation) {
            setError('المتصفح لا يدعم خدمات الموقع');
            setLoadingLocation(false);
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                const location = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude,
                };
                setUserLocation(location);
                setMapCenter(location);
                setLoadingLocation(false);
                
                if (activeTab === TABS.STORES) {
                    fetchNearbyStores(location.lat, location.lng);
                }
                
                setSnackbar({
                    open: true,
                    message: 'تم تحديد موقعك بنجاح',
                    severity: 'success'
                });
            },
            (err) => {
                console.error('Geolocation error:', err);
                setError('فشل الحصول على الموقع. يرجى تفعيل خدمات الموقع.');
                setLoadingLocation(false);
            },
            { enableHighAccuracy: true, timeout: 10000 }
        );
    }, [activeTab]);

    // جلب المتاجر القريبة
    const fetchNearbyStores = async (lat, lng) => {
        try {
            const response = await mapService.getStoresMap({ lat, lng, radius: 5000 });
            setNearbyStores(response.data?.stores || []);
        } catch (err) {
            console.error('Failed to fetch nearby stores:', err);
        }
    };

    // البحث عن موقع
    const handleSearch = async () => {
        if (!searchQuery.trim()) return;

        try {
            const response = await mapService.geocode(searchQuery, 10);
            setSearchResults(response.data || []);
            
            if (response.data?.length > 0) {
                const firstResult = response.data[0];
                setMapCenter({
                    lat: parseFloat(firstResult.lat),
                    lng: parseFloat(firstResult.lon),
                });
            }
        } catch (err) {
            console.error('Search failed:', err);
            setError('فشل البحث عن الموقع');
        }
    };
    
    // ✅ FIXED: استخدام order._id بدلاً من order.id
    const handleTrackOrder = async (order) => {
        setSelectedOrder(order);
        try {
            const response = await mapService.getOrderRoute(order._id);
            console.log('Order route:', response.data);
        } catch (err) {
            console.error('Failed to get order route:', err);
        }
    };
    
    // ✅ FIXED: استخدام driver._id بدلاً من driver.id
    const handleViewDriverLocation = (driver) => {
        setSelectedDriver(driver);
        if (driver.location?.coordinates && driver.location.coordinates.length >= 2) {
            setMapCenter({
                lat: driver.location.coordinates[1],
                lng: driver.location.coordinates[0],
            });
        }
    };
    
    // اختيار متجر
    const handleStoreSelect = (store) => {
        console.log('Selected store:', store);
    };

    // التحكم في تكبير الخريطة
    const handleZoomIn = () => {
        if (mapRef.current?.zoomIn) {
            mapRef.current.zoomIn();
        }
    };
    
    const handleZoomOut = () => {
        if (mapRef.current?.zoomOut) {
            mapRef.current.zoomOut();
        }
    };

    // إعادة تعيين الفلاتر
    const resetFilters = () => {
        setDriverFilters({
            showOnlineOnly: false,
            showOfflineOnly: false,
            minRating: 0,
        });
        setShowDriverFilters(false);
        setSnackbar({
            open: true,
            message: 'تم إعادة تعيين الفلاتر',
            severity: 'info'
        });
    };

    // حساب عدد المتاجر بدون إحداثيات
    const storesList = nearbyStores.length > 0 ? nearbyStores : (allStores?.data || []);
    const storesWithoutCoords = storesList.filter(store => {
        return !store.address?.latitude && !store.address?.longitude && !store.location?.coordinates;
    });
    
    const driversList = filteredDrivers();
    const onlineDriversCount = driversList.filter(d => d.isOnline).length;
    const offlineDriversCount = driversList.filter(d => !d.isOnline).length;

    // تحميل الموقع تلقائياً
    useEffect(() => {
        if (activeTab === TABS.STORES && !userLocation) {
            getUserLocation();
        }
    }, [activeTab, getUserLocation, userLocation]);

    return (
        <Box sx={{ p: spacing.page, position: 'relative' }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={spacing.section} flexWrap="wrap" gap={2}>
                <Typography variant={isMobile ? "h6" : "h5"} fontWeight="bold" sx={{ fontSize: fontSize.h2 }}>
                    الخرائط والتتبع
                </Typography>
                
                <Badge 
                    color="primary" 
                    variant="dot" 
                    invisible={!isDriversFetching && !isStoresFetching}
                >
                    <Button
                        variant="contained"
                        startIcon={<Refresh />}
                        onClick={refreshAllData}
                        disabled={isDriversFetching || isStoresFetching}
                        sx={{ textTransform: 'none' }}
                        size={isMobile ? "small" : "medium"}
                    >
                        {isDriversFetching || isStoresFetching ? (
                            <CircularProgress size={20} />
                        ) : (
                            isMobile ? 'تحديث' : 'تحديث الكل'
                        )}
                    </Button>
                </Badge>
            </Box>

            {/* تبويبات متجاوبة */}
            <Paper sx={{ mb: spacing.card }}>
                <Tabs
                    value={activeTab}
                    onChange={(e, newValue) => setActiveTab(newValue)}
                    variant={isMobile ? "scrollable" : "standard"}
                    scrollButtons={isMobile ? "auto" : false}
                    sx={{
                        '& .MuiTab-root': {
                            minHeight: isMobile ? 40 : 48,
                            fontSize: isMobile ? '0.75rem' : '0.875rem',
                            px: isMobile ? 1.5 : 3,
                        }
                    }}
                >
                    <Tab 
                        icon={<LocalShipping />} 
                        iconPosition="start"
                        label={isMobile ? "المندوبين" : "مواقع المندوبين"}
                        value={TABS.DRIVERS}
                    />
                    <Tab 
                        icon={<Directions />} 
                        iconPosition="start"
                        label={isMobile ? "الطلبات" : "تتبع الطلبات"}
                        value={TABS.ORDERS}
                    />
                    <Tab 
                        icon={<Storefront />} 
                        iconPosition="start"
                        label={isMobile ? "المتاجر" : "المتاجر القريبة"}
                        value={TABS.STORES}
                    />
                    <Tab 
                        icon={<Search />} 
                        iconPosition="start"
                        label="البحث"
                        value={TABS.SEARCH}
                    />
                </Tabs>
            </Paper>

            {/* تبويب المندوبين */}
            {activeTab === TABS.DRIVERS && (
                <Grid container spacing={spacing.card}>
                    <Grid item xs={12} md={8}>
                        <Paper sx={{ p: spacing.card, position: 'relative' }}>
                            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2} flexWrap="wrap" gap={1}>
                                <Box>
                                    <Typography variant={isMobile ? "subtitle1" : "h6"} sx={{ fontSize: fontSize.h3 }}>
                                        مواقع المندوبين
                                    </Typography>
                                    <Typography variant="caption" color="textSecondary" component="div">
                                        {onlineDriversCount} متصل / {offlineDriversCount} غير متصل
                                    </Typography>
                                </Box>
                                <Box display="flex" gap={0.5}>
                                    <SafeTooltip title="تحديث الخريطة">
                                        <IconButton onClick={refreshAllData} disabled={driversLoading} size="small">
                                            <Refresh />
                                        </IconButton>
                                    </SafeTooltip>
                                    
                                    <SafeTooltip title="الفلاتر">
                                        <IconButton 
                                            onClick={() => setShowDriverFilters(!showDriverFilters)}
                                            color={showDriverFilters ? 'primary' : 'default'}
                                            size="small"
                                        >
                                            <FilterList />
                                        </IconButton>
                                    </SafeTooltip>
                                    
                                    <SafeTooltip title="تكبير">
                                        <IconButton onClick={handleZoomIn} size="small">
                                            <ZoomIn />
                                        </IconButton>
                                    </SafeTooltip>
                                    
                                    <SafeTooltip title="تصغير">
                                        <IconButton onClick={handleZoomOut} size="small">
                                            <ZoomOut />
                                        </IconButton>
                                    </SafeTooltip>
                                    
                                    <SafeTooltip title="موقعي">
                                        <IconButton onClick={getUserLocation} size="small">
                                            <MyLocation />
                                        </IconButton>
                                    </SafeTooltip>
                                </Box>
                            </Box>
                            
                            {/* فلتر المندوبين */}
                            <Collapse in={showDriverFilters}>
                                <Paper sx={{ p: spacing.card, mb: 2, bgcolor: 'action.hover' }}>
                                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                                        <Typography variant="subtitle2">فلترة المندوبين</Typography>
                                        <Button size="small" onClick={resetFilters} startIcon={<ClearAll />}>
                                            إعادة تعيين
                                        </Button>
                                    </Box>
                                    <Grid container spacing={2}>
                                        <Grid item xs={12} sm={6}>
                                            <FormControlLabel
                                                control={
                                                    <Switch
                                                        checked={driverFilters.showOnlineOnly}
                                                        onChange={(e) => setDriverFilters({
                                                            ...driverFilters,
                                                            showOnlineOnly: e.target.checked,
                                                            showOfflineOnly: e.target.checked ? false : driverFilters.showOfflineOnly,
                                                        })}
                                                        size="small"
                                                    />
                                                }
                                                label="المندوبين المتصلين فقط"
                                            />
                                        </Grid>
                                        <Grid item xs={12} sm={6}>
                                            <FormControlLabel
                                                control={
                                                    <Switch
                                                        checked={driverFilters.showOfflineOnly}
                                                        onChange={(e) => setDriverFilters({
                                                            ...driverFilters,
                                                            showOfflineOnly: e.target.checked,
                                                            showOnlineOnly: e.target.checked ? false : driverFilters.showOnlineOnly,
                                                        })}
                                                        size="small"
                                                    />
                                                }
                                                label="المندوبين غير المتصلين"
                                            />
                                        </Grid>
                                    </Grid>
                                </Paper>
                            </Collapse>
                            
                            <DriverLocationMap
                                ref={mapRef}
                                drivers={driversList}
                                selectedDriver={selectedDriver}
                                onDriverSelect={handleViewDriverLocation}
                                height={showDriverFilters ? mapHeight - 80 : mapHeight}
                                center={mapCenter}
                                zoom={mapZoom}
                                onZoomChange={setMapZoom}
                                onMapReady={() => setIsMapReady(true)}
                            />
                        </Paper>
                    </Grid>
                    <Grid item xs={12} md={4}>
                        <Paper sx={{ p: spacing.card, height: sidePanelHeight, overflow: 'auto' }}>
                            <Typography variant={isMobile ? "subtitle1" : "h6"} gutterBottom sx={{ fontSize: fontSize.h3 }}>
                                قائمة المندوبين
                            </Typography>
                            {driversLoading ? (
                                <Box>
                                    {[1, 2, 3, 4].map(i => (
                                        <Box key={i} sx={{ mb: 1, height: 72, bgcolor: 'action.hover', borderRadius: 1 }} />
                                    ))}
                                </Box>
                            ) : (
                                <List sx={{ p: 0 }}>
                                    {driversList.map((driver) => (
                                        // ✅ FIXED: استخدام driver._id بدلاً من driver.id
                                        <ListItem
                                            key={driver._id}
                                            component="div"
                                            selected={selectedDriver?._id === driver._id}
                                            onClick={() => handleViewDriverLocation(driver)}
                                            sx={{
                                                borderRadius: 1,
                                                mb: 1,
                                                cursor: 'pointer',
                                                bgcolor: selectedDriver?._id === driver._id ? 'action.selected' : 'transparent',
                                                transition: 'all 0.2s ease',
                                                p: isMobile ? 1 : 1.5,
                                                '&:hover': {
                                                    transform: isMobile ? 'none' : 'translateX(-4px)',
                                                    bgcolor: 'action.hover',
                                                },
                                            }}
                                        >
                                            <ListItemAvatar>
                                                <Avatar src={driver.avatar} sx={{ width: isMobile ? 32 : 40, height: isMobile ? 32 : 40 }}>
                                                    {driver.name?.charAt(0)}
                                                </Avatar>
                                            </ListItemAvatar>
                                            <ListItemText
                                                primary={
                                                    <Box component="span" display="flex" alignItems="center" gap={1} flexWrap="wrap">
                                                        <Typography variant="body2" fontWeight="bold" component="span">
                                                            {driver.name}
                                                        </Typography>
                                                        {driver.rating && (
                                                            <Rating value={driver.rating} readOnly size="small" />
                                                        )}
                                                    </Box>
                                                }
                                                secondary={
                                                    <Box component="span">
                                                        <Chip
                                                            label={driver.isOnline ? '🟢 متصل' : '⚫ غير متصل'}
                                                            size="small"
                                                            color={driver.isOnline ? 'success' : 'default'}
                                                            sx={{ height: 20, fontSize: 10, mt: 0.5 }}
                                                        />
                                                        {driver.location && (
                                                            <Typography variant="caption" display="block" color="textSecondary" mt={0.5}>
                                                                {new Date(driver.location.updatedAt).toLocaleTimeString()}
                                                            </Typography>
                                                        )}
                                                    </Box>
                                                }
                                            />
                                        </ListItem>
                                    ))}
                                    {driversList.length === 0 && (
                                        <Alert severity="info" sx={{ mt: 2 }}>
                                            لا يوجد مندوبين مطابقين للفلتر المحدد
                                        </Alert>
                                    )}
                                </List>
                            )}
                        </Paper>
                    </Grid>
                </Grid>
            )}

            {/* تبويب الطلبات */}
            {activeTab === TABS.ORDERS && (
                <Grid container spacing={spacing.card}>
                    <Grid item xs={12} md={8}>
                        <Paper sx={{ p: spacing.card }}>
                            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2} flexWrap="wrap" gap={1}>
                                <Typography variant={isMobile ? "subtitle1" : "h6"} sx={{ fontSize: fontSize.h3 }}>
                                    تتبع الطلب {selectedOrder && `#${selectedOrder._id.slice(-6)}`}
                                </Typography>
                                <Box display="flex" gap={0.5}>
                                    <SafeTooltip title="تحديث الخريطة">
                                        <IconButton onClick={refreshAllData} size="small">
                                            <Refresh />
                                        </IconButton>
                                    </SafeTooltip>
                                    <SafeTooltip title="تكبير">
                                        <IconButton onClick={handleZoomIn} size="small">
                                            <ZoomIn />
                                        </IconButton>
                                    </SafeTooltip>
                                    <SafeTooltip title="تصغير">
                                        <IconButton onClick={handleZoomOut} size="small">
                                            <ZoomOut />
                                        </IconButton>
                                    </SafeTooltip>
                                </Box>
                            </Box>
                            <OrderTrackingMap
                                orderId={selectedOrder?._id}
                                height={mapHeight}
                                center={mapCenter}
                                zoom={mapZoom}
                            />
                        </Paper>
                    </Grid>
                    <Grid item xs={12} md={4}>
                        <Paper sx={{ p: spacing.card, height: sidePanelHeight, overflow: 'auto' }}>
                            <Typography variant={isMobile ? "subtitle1" : "h6"} gutterBottom sx={{ fontSize: fontSize.h3 }}>
                                الطلبات النشطة
                            </Typography>
                            {ordersLoading ? (
                                <Box>
                                    {[1, 2, 3].map(i => (
                                        <Box key={i} sx={{ mb: 1, height: 100, bgcolor: 'action.hover', borderRadius: 1 }} />
                                    ))}
                                </Box>
                            ) : (
                                <List sx={{ p: 0 }}>
                                    {(activeOrders?.data?.orders || []).map((order) => (
                                        // ✅ FIXED: استخدام order._id بدلاً من order.id
                                        <ListItem
                                            key={order._id}
                                            component="div"
                                            selected={selectedOrder?._id === order._id}
                                            onClick={() => handleTrackOrder(order)}
                                            sx={{ 
                                                borderRadius: 1, 
                                                mb: 1,
                                                cursor: 'pointer',
                                                p: isMobile ? 1 : 1.5,
                                                transition: 'all 0.2s ease',
                                                '&:hover': {
                                                    transform: isMobile ? 'none' : 'translateX(-4px)',
                                                    bgcolor: 'action.hover',
                                                },
                                            }}
                                        >
                                            <ListItemText
                                                primary={
                                                    <Typography variant="body2" fontWeight="bold" component="span">
                                                        طلب #{order._id.slice(-6)}
                                                    </Typography>
                                                }
                                                secondary={
                                                    <Box component="span">
                                                        <Typography variant="caption" display="block" color="textSecondary" component="span">
                                                            {order.store?.name || order.storeId}
                                                        </Typography>
                                                        <Chip
                                                            label={order.status === 'accepted' ? 'تم القبول' : 
                                                                   order.status === 'preparing' ? 'قيد التحضير' :
                                                                   order.status === 'ready' ? 'جاهز' :
                                                                   order.status === 'out_for_delivery' ? 'قيد التوصيل' : order.status}
                                                            size="small"
                                                            color={order.status === 'out_for_delivery' ? 'warning' : 'info'}
                                                            sx={{ mt: 0.5 }}
                                                        />
                                                    </Box>
                                                }
                                            />
                                        </ListItem>
                                    ))}
                                    {(activeOrders?.data?.orders || []).length === 0 && (
                                        <Alert severity="info" sx={{ mt: 2 }}>
                                            لا توجد طلبات نشطة
                                        </Alert>
                                    )}
                                </List>
                            )}
                        </Paper>
                    </Grid>
                </Grid>
            )}

            {/* تبويب المتاجر */}
            {activeTab === TABS.STORES && (
                <Grid container spacing={spacing.card}>
                    <Grid item xs={12} md={8}>
                        <Paper sx={{ p: spacing.card, position: 'relative' }}>
                            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2} flexWrap="wrap" gap={1}>
                                <Typography variant={isMobile ? "subtitle1" : "h6"} sx={{ fontSize: fontSize.h3 }}>
                                    المتاجر القريبة
                                </Typography>
                                <Box display="flex" gap={0.5}>
                                    <SafeTooltip title="تحديث الخريطة">
                                        <IconButton onClick={refreshAllData} disabled={isStoresFetching} size="small">
                                            <Refresh />
                                        </IconButton>
                                    </SafeTooltip>
                                    {storesWithoutCoords.length > 0 && !isMobile && (
                                        <SafeTooltip title={`تحديث مواقع ${storesWithoutCoords.length} متجر`}>
                                            <IconButton 
                                                onClick={handleUpdateStoresCoordinates} 
                                                disabled={updatingStores}
                                                size="small"
                                                color="warning"
                                            >
                                                <Update />
                                            </IconButton>
                                        </SafeTooltip>
                                    )}
                                    <SafeTooltip title="موقعي">
                                        <span style={{ display: 'inline-flex' }}>
                                            <IconButton 
                                                onClick={getUserLocation} 
                                                disabled={loadingLocation}
                                                size="small"
                                            >
                                                {loadingLocation ? <CircularProgress size={20} /> : <MyLocation />}
                                            </IconButton>
                                        </span>
                                    </SafeTooltip>
                                    <SafeTooltip title="تكبير">
                                        <IconButton onClick={handleZoomIn} size="small">
                                            <ZoomIn />
                                        </IconButton>
                                    </SafeTooltip>
                                    <SafeTooltip title="تصغير">
                                        <IconButton onClick={handleZoomOut} size="small">
                                            <ZoomOut />
                                        </IconButton>
                                    </SafeTooltip>
                                </Box>
                            </Box>
                            
                            {error && (
                                <Alert severity="warning" sx={{ mb: 2 }} onClose={() => setError(null)}>
                                    {error}
                                </Alert>
                            )}
                            
                            <StoreMap
                                ref={mapRef}
                                stores={storesList}
                                userLocation={userLocation}
                                onStoreSelect={handleStoreSelect}
                                onRefresh={handleUpdateStoresCoordinates}
                                height={mapHeight}
                                center={mapCenter}
                                zoom={mapZoom}
                                onZoomChange={setMapZoom}
                            />
                        </Paper>
                    </Grid>
                    <Grid item xs={12} md={4}>
                        <Paper sx={{ p: spacing.card, height: sidePanelHeight, overflow: 'auto' }}>
                            <Typography variant={isMobile ? "subtitle1" : "h6"} gutterBottom sx={{ fontSize: fontSize.h3 }}>
                                المتاجر القريبة
                                {storesWithoutCoords.length > 0 && !isMobile && (
                                    <Chip 
                                        size="small" 
                                        label={`${storesWithoutCoords.length} بدون إحداثيات`}
                                        color="warning"
                                        sx={{ ml: 1 }}
                                    />
                                )}
                            </Typography>
                            
                            {!userLocation ? (
                                <Alert severity="info" sx={{ mb: 2 }}>
                                    اضغط على أيقونة "موقعي" لعرض المتاجر القريبة منك
                                </Alert>
                            ) : storesLoading ? (
                                <Box>
                                    {[1, 2, 3, 4].map(i => (
                                        <Box key={i} sx={{ mb: 1, height: 80, bgcolor: 'action.hover', borderRadius: 1 }} />
                                    ))}
                                </Box>
                            ) : (
                                <List sx={{ p: 0 }}>
                                    {storesList.slice(0, isMobile ? 5 : 10).map((store) => {
                                        const hasCoords = store.address?.latitude || store.location?.coordinates;
                                        return (
                                            // ✅ FIXED: استخدام store._id بدلاً من store.id
                                            <ListItem 
                                                key={store._id} 
                                                component="div"
                                                sx={{ 
                                                    borderRadius: 1, 
                                                    mb: 1,
                                                    p: isMobile ? 1 : 1.5,
                                                    opacity: hasCoords ? 1 : 0.6,
                                                    bgcolor: !hasCoords ? 'action.hover' : 'transparent',
                                                    transition: 'all 0.2s ease',
                                                    '&:hover': {
                                                        transform: isMobile ? 'none' : 'translateX(-4px)',
                                                        bgcolor: 'action.selected',
                                                    },
                                                }}
                                            >
                                                <ListItemAvatar>
                                                    <Avatar src={store.logo} sx={{ width: isMobile ? 32 : 40, height: isMobile ? 32 : 40 }}>
                                                        <Storefront />
                                                    </Avatar>
                                                </ListItemAvatar>
                                                <ListItemText
                                                    primary={
                                                        <Box component="span" display="flex" alignItems="center" gap={1} flexWrap="wrap">
                                                            <Typography variant="body2" fontWeight="bold" component="span">
                                                                {store.name}
                                                            </Typography>
                                                        </Box>
                                                    }
                                                    secondary={
                                                        <Box component="span">
                                                            <Rating 
                                                                value={store.averageRating || 0} 
                                                                readOnly 
                                                                size="small" 
                                                            />
                                                            <Typography variant="caption" display="block" color="textSecondary" component="span">
                                                                {store.category} 
                                                                {store.distance && ` • ${store.distance.toFixed(1)} كم`}
                                                            </Typography>
                                                        </Box>
                                                    }
                                                />
                                            </ListItem>
                                        );
                                    })}
                                    {storesList.length === 0 && (
                                        <Alert severity="info" sx={{ mt: 2 }}>
                                            لا توجد متاجر قريبة
                                        </Alert>
                                    )}
                                </List>
                            )}
                            
                            {storesWithoutCoords.length > 0 && isMobile && (
                                <Button
                                    fullWidth
                                    variant="outlined"
                                    size="small"
                                    startIcon={<Update />}
                                    onClick={handleUpdateStoresCoordinates}
                                    disabled={updatingStores}
                                    sx={{ mt: 2 }}
                                >
                                    {updatingStores ? <CircularProgress size={20} /> : `تحديث مواقع ${storesWithoutCoords.length} متجر`}
                                </Button>
                            )}
                            
                            {storesWithoutCoords.length > 0 && !isMobile && (
                                <Alert severity="warning" sx={{ mt: 2 }}>
                                    يوجد {storesWithoutCoords.length} متجر بدون إحداثيات دقيقة.
                                </Alert>
                            )}
                        </Paper>
                    </Grid>
                </Grid>
            )}

            {/* تبويب البحث */}
            {activeTab === TABS.SEARCH && (
                <Paper sx={{ p: spacing.card }}>
                    <Typography variant={isMobile ? "subtitle1" : "h6"} gutterBottom sx={{ fontSize: fontSize.h3 }}>
                        البحث عن موقع
                    </Typography>
                    <Box display="flex" gap={2} mb={3} flexWrap="wrap">
                        <TextField
                            fullWidth
                            label="ابحث عن موقع، شارع، مدينة..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                            size={isMobile ? "small" : "medium"}
                            sx={{ flex: 1 }}
                        />
                        <Button
                            variant="contained"
                            startIcon={<Search />}
                            onClick={handleSearch}
                            size={isMobile ? "small" : "medium"}
                        >
                            بحث
                        </Button>
                    </Box>

                    {searchResults.length > 0 && (
                        <List>
                            {searchResults.slice(0, isMobile ? 5 : 10).map((result, index) => (
                                <ListItem key={index} divider sx={{ flexDirection: isMobile ? 'column' : 'row', alignItems: isMobile ? 'flex-start' : 'center' }}>
                                    <ListItemAvatar>
                                        <Avatar>
                                            <LocationOn />
                                        </Avatar>
                                    </ListItemAvatar>
                                    <ListItemText
                                        primary={result.display_name || result.name}
                                        secondary={result.type}
                                        sx={{ mb: isMobile ? 1 : 0 }}
                                    />
                                    <Button
                                        size="small"
                                        startIcon={<Directions />}
                                        onClick={() => {
                                            setMapCenter({
                                                lat: parseFloat(result.lat),
                                                lng: parseFloat(result.lon),
                                            });
                                            setActiveTab(TABS.STORES);
                                        }}
                                        fullWidth={isMobile}
                                    >
                                        عرض على الخريطة
                                    </Button>
                                </ListItem>
                            ))}
                        </List>
                    )}
                    
                    {searchResults.length === 0 && searchQuery && (
                        <Alert severity="info">
                            لا توجد نتائج للبحث عن "{searchQuery}"
                        </Alert>
                    )}
                </Paper>
            )}

            {/* Floating Action Button - للهواتف فقط */}
            {isMobile && (
                <Zoom in={true}>
                    <Fab
                        color="primary"
                        size="small"
                        sx={{
                            position: 'fixed',
                            bottom: 16,
                            right: 16,
                            zIndex: 1000,
                        }}
                        onClick={refreshAllData}
                    >
                        <Refresh />
                    </Fab>
                </Zoom>
            )}

            {/* Snackbar */}
            <Snackbar
                open={snackbar.open}
                autoHideDuration={4000}
                onClose={() => setSnackbar({ ...snackbar, open: false })}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert 
                    onClose={() => setSnackbar({ ...snackbar, open: false })} 
                    severity={snackbar.severity}
                    sx={{ width: '100%' }}
                >
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Box>
    );
}