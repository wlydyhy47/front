// src/pages/Drivers/index.jsx - نسخة مصححة بالكامل

import { useState, useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import {
  Box,
  Paper,
  Typography,
  TextField,
  MenuItem,
  Button,
  Chip,
  IconButton,
  Tooltip,
  Grid,
  Card,
  CardContent,
  Avatar,
  Rating,
  Alert,
  Snackbar,
} from '@mui/material';
import {
  Edit,
  Delete,
  Visibility,
  Verified,
  LocalShipping,
  Refresh,
  LocationOn,
  Block,
  CheckCircle,
} from '@mui/icons-material';
import { driversService } from '../../api';
import ResponsiveTable from '../../components/Common/ResponsiveTable';
import ResponsiveStatsCards from '../../components/Common/ResponsiveStatsCards';
import ResponsiveFilters from '../../components/Common/ResponsiveFilters';
import ResponsiveDialog from '../../components/Common/ResponsiveDialog';
import { useResponsive } from '../../hooks/useResponsive';
import DriverDetails from './components/DriverDetails';
import DriverLocation from './components/DriverLocation';
import { formatDate, formatCurrency } from '../../utils/formatters';
import { getId, handleError } from '../../utils/helpers';

export default function Drivers() {
  const { isMobile, fontSize, spacing } = useResponsive();
  const queryClient = useQueryClient();
  
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(isMobile ? 10 : 20);
  const [filters, setFilters] = useState({
    search: '',
    status: 'all',
    availability: 'all',
  });
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [openDetails, setOpenDetails] = useState(false);
  const [openLocation, setOpenLocation] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  // جلب المندوبين
  const { data, isLoading, refetch, isFetching } = useQuery(
    ['drivers', page, pageSize, filters],
    () => driversService.getDrivers({
      page: page + 1,
      limit: pageSize,
      search: filters.search || undefined,
      isActive: filters.status !== 'all' ? filters.status === 'active' : undefined,
      isOnline: filters.availability !== 'all' ? filters.availability === 'online' : undefined,
    }),
    {
      keepPreviousData: true,
      onError: (error) => {
        setSnackbar({ 
          open: true, 
          message: handleError(error, 'فشل تحميل بيانات المندوبين'), 
          severity: 'error' 
        });
      }
    }
  );

  const drivers = data?.data || [];
  const totalCount = data?.pagination?.total || 0;

  // تحديث حالة المندوب
  const updateStatusMutation = useMutation(
    ({ id, isActive }) => driversService.updateDriverStatus(id, { isActive }),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('drivers');
        setSnackbar({ open: true, message: 'تم تغيير حالة المندوب', severity: 'success' });
      },
      onError: (error) => {
        setSnackbar({ open: true, message: handleError(error, 'فشل تغيير حالة المندوب'), severity: 'error' });
      },
    }
  );

  // توثيق المندوب
  const verifyMutation = useMutation(
    (id) => driversService.verifyDriver(id),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('drivers');
        setSnackbar({ open: true, message: 'تم توثيق المندوب', severity: 'success' });
      },
      onError: (error) => {
        setSnackbar({ open: true, message: handleError(error, 'فشل توثيق المندوب'), severity: 'error' });
      },
    }
  );

  // ✅ دوال المعالجة
  const handleViewDetails = useCallback((driver) => {
    setSelectedDriver(driver);
    setOpenDetails(true);
  }, []);

  const handleViewLocation = useCallback((driver) => {
    setSelectedDriver(driver);
    setOpenLocation(true);
  }, []);

  const handleToggleStatus = useCallback((driver) => {
    updateStatusMutation.mutate({ id: getId(driver), isActive: !driver.isActive });
  }, [updateStatusMutation]);

  const handleVerify = useCallback((driver) => {
    verifyMutation.mutate(getId(driver));
  }, [verifyMutation]);

  const resetFilters = useCallback(() => {
    setFilters({
      search: '',
      status: 'all',
      availability: 'all',
    });
    setPage(0);
  }, []);

  // ✅ إحصائيات سريعة
  const statsCards = useMemo(() => {
    const activeDrivers = drivers.filter(d => d.isActive).length;
    const onlineDrivers = drivers.filter(d => d.isOnline).length;
    const verifiedDrivers = drivers.filter(d => d.isVerified).length;
    
    return [
      { title: 'إجمالي المندوبين', value: totalCount, icon: LocalShipping, color: '#2196f3' },
      { title: 'مندوبين نشطين', value: activeDrivers, icon: CheckCircle, color: '#4caf50' },
      { title: 'متصلون الآن', value: onlineDrivers, icon: LocationOn, color: '#ff9800' },
      { title: 'مندوبين موثقين', value: verifiedDrivers, icon: Verified, color: '#9c27b0' },
    ];
  }, [drivers, totalCount]);

  // ✅ أعمدة الجدول
  const columns = useMemo(() => [
    {
      field: 'avatar',
      headerName: '',
      width: 60,
      renderCell: (params) => (
        <Avatar src={params.row.avatar} sx={{ width: 40, height: 40 }}>
          {params.row.name?.charAt(0)}
        </Avatar>
      ),
    },
    { field: 'name', headerName: 'الاسم', width: 150 },
    { field: 'phone', headerName: 'رقم الهاتف', width: 150 },
    { field: 'email', headerName: 'البريد الإلكتروني', width: 180 },
    {
      field: 'rating',
      headerName: 'التقييم',
      width: 120,
      renderCell: (params) => (
        <Rating value={params.value || 0} readOnly size="small" precision={0.5} />
      ),
    },
    {
      field: 'isOnline',
      headerName: 'الحالة',
      width: 100,
      renderCell: (params) => (
        <Chip 
          label={params.value ? 'متصل' : 'غير متصل'} 
          size="small" 
          color={params.value ? 'success' : 'default'} 
        />
      ),
    },
    {
      field: 'isActive',
      headerName: 'نشط',
      width: 80,
      renderCell: (params) => (
        <Chip 
          label={params.value ? 'نشط' : 'غير نشط'} 
          size="small" 
          color={params.value ? 'success' : 'error'} 
        />
      ),
    },
    {
      field: 'actions',
      headerName: 'الإجراءات',
      width: 200,
      hideOnDesktop: false,
      renderCell: (params) => {
        const driver = params.row;
        const driverId = getId(driver);
        return (
          <Box display="flex" gap={0.5}>
            <Tooltip title="عرض التفاصيل">
              <IconButton size="small" onClick={() => handleViewDetails(driver)}>
                <Visibility fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="الموقع الحالي">
              <IconButton size="small" onClick={() => handleViewLocation(driver)}>
                <LocationOn fontSize="small" />
              </IconButton>
            </Tooltip>
            {!driver.isVerified && (
              <Tooltip title="توثيق">
                <IconButton size="small" onClick={() => handleVerify(driver)} color="primary">
                  <Verified fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
            <Tooltip title={driver.isActive ? 'تعطيل' : 'تفعيل'}>
              <IconButton size="small" onClick={() => handleToggleStatus(driver)}>
                {driver.isActive ? <Block fontSize="small" color="error" /> : <CheckCircle fontSize="small" color="success" />}
              </IconButton>
            </Tooltip>
          </Box>
        );
      },
    },
  ], [handleViewDetails, handleViewLocation, handleVerify, handleToggleStatus]);

  return (
    <Box sx={{ p: spacing.page }}>
      <Typography variant="h5" fontWeight="bold" sx={{ mb: spacing.section, fontSize: fontSize.h2 }}>
        إدارة المندوبين
      </Typography>

      <ResponsiveStatsCards 
        cards={statsCards} 
        columnsDesktop={4} 
        columnsTablet={2} 
        columnsMobile={2} 
        spacing={spacing.section} 
      />

      <Paper sx={{ p: spacing.card }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2} flexWrap="wrap" gap={1}>
          <Typography variant="h6" fontWeight="bold" sx={{ fontSize: fontSize.h3 }}>
            قائمة المندوبين
          </Typography>
          <Button 
            variant="outlined" 
            startIcon={<Refresh />} 
            onClick={() => refetch()} 
            size="small" 
            disabled={isFetching}
          >
            تحديث
          </Button>
        </Box>

        <ResponsiveFilters onReset={resetFilters}>
          <Grid item xs={12} sm={6} md={4}>
            <TextField
              fullWidth
              label="بحث"
              size="small"
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              placeholder="الاسم، رقم الهاتف..."
            />
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <TextField
              fullWidth
              select
              label="حالة الحساب"
              size="small"
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            >
              <MenuItem value="all">الكل</MenuItem>
              <MenuItem value="active">نشط</MenuItem>
              <MenuItem value="inactive">غير نشط</MenuItem>
            </TextField>
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <TextField
              fullWidth
              select
              label="حالة الاتصال"
              size="small"
              value={filters.availability}
              onChange={(e) => setFilters({ ...filters, availability: e.target.value })}
            >
              <MenuItem value="all">الكل</MenuItem>
              <MenuItem value="online">متصل</MenuItem>
              <MenuItem value="offline">غير متصل</MenuItem>
            </TextField>
          </Grid>
        </ResponsiveFilters>

        <ResponsiveTable
          data={drivers}
          columns={columns}
          loading={isLoading}
          onRowClick={(driver) => {
            setSelectedDriver(driver);
            setOpenDetails(true);
          }}
          emptyMessage="لا يوجد مندوبين"
          renderMobileCard={(driver) => {
            const driverId = getId(driver);
            return (
              <Paper 
                key={driverId} 
                sx={{ p: 1.5, cursor: 'pointer', mb: 1.5 }} 
                onClick={() => {
                  setSelectedDriver(driver);
                  setOpenDetails(true);
                }}
              >
                <Box display="flex" gap={2}>
                  <Avatar src={driver.avatar} sx={{ width: 50, height: 50 }}>
                    {driver.name?.charAt(0)}
                  </Avatar>
                  <Box flex={1}>
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={0.5}>
                      <Typography variant="subtitle2" fontWeight="bold">
                        {driver.name}
                      </Typography>
                      <Chip 
                        label={driver.isOnline ? 'متصل' : 'غير متصل'} 
                        size="small" 
                        color={driver.isOnline ? 'success' : 'default'} 
                      />
                    </Box>
                    <Typography variant="caption" color="textSecondary" display="block">
                      {driver.phone}
                    </Typography>
                    <Box display="flex" justifyContent="space-between" alignItems="center" mt={1}>
                      <Rating value={driver.rating || 0} readOnly size="small" />
                      {driver.isVerified && <Verified fontSize="small" color="primary" />}
                    </Box>
                  </Box>
                </Box>
                <Box display="flex" justifyContent="flex-end" gap={1} mt={1}>
                  <IconButton 
                    size="small" 
                    onClick={(e) => { 
                      e.stopPropagation(); 
                      handleViewLocation(driver);
                    }}
                  >
                    <LocationOn fontSize="small" />
                  </IconButton>
                  {!driver.isVerified && (
                    <IconButton 
                      size="small" 
                      onClick={(e) => { 
                        e.stopPropagation(); 
                        handleVerify(driver);
                      }}
                      color="primary"
                    >
                      <Verified fontSize="small" />
                    </IconButton>
                  )}
                  <IconButton 
                    size="small" 
                    onClick={(e) => { 
                      e.stopPropagation(); 
                      handleToggleStatus(driver);
                    }}
                  >
                    {driver.isActive ? <Block fontSize="small" color="error" /> : <CheckCircle fontSize="small" color="success" />}
                  </IconButton>
                </Box>
              </Paper>
            );
          }}
        />
      </Paper>

      {/* حوار تفاصيل المندوب */}
      <ResponsiveDialog 
        open={openDetails} 
        onClose={() => setOpenDetails(false)} 
        title="تفاصيل المندوب" 
        maxWidth="md" 
        actions={<Button onClick={() => setOpenDetails(false)}>إغلاق</Button>}
      >
        {selectedDriver && <DriverDetails driver={selectedDriver} />}
      </ResponsiveDialog>

      {/* حوار موقع المندوب */}
      <ResponsiveDialog 
        open={openLocation} 
        onClose={() => setOpenLocation(false)} 
        title={`موقع المندوب - ${selectedDriver?.name}`} 
        maxWidth="md" 
        actions={<Button onClick={() => setOpenLocation(false)}>إغلاق</Button>}
      >
        {selectedDriver && <DriverLocation driverId={getId(selectedDriver)} />}
      </ResponsiveDialog>

      {/* إشعارات */}
      <Snackbar 
        open={snackbar.open} 
        autoHideDuration={6000} 
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity={snackbar.severity}>{snackbar.message}</Alert>
      </Snackbar>
    </Box>
  );
}