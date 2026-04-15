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
  Storefront,
  Refresh,
  Add,
  ToggleOn,
  ToggleOff,
} from '@mui/icons-material';
import { storesService } from '../../api';
import ResponsiveTable from '../../components/Common/ResponsiveTable';
import ResponsiveStatsCards from '../../components/Common/ResponsiveStatsCards';
import ResponsiveFilters from '../../components/Common/ResponsiveFilters';
import ResponsiveDialog from '../../components/Common/ResponsiveDialog';
import { useResponsive } from '../../hooks/useResponsive';
import StoreForm from './components/StoreForm';
import StoreDetails from './components/StoreDetails'; // ✅ استيراد مكون StoreDetails
import { formatDate } from '../../utils/formatters';
import { getId, handleError } from '../../utils/helpers';

const categories = [
  { value: 'all', label: 'الكل' },
  { value: 'restaurant', label: 'مطعم' },
  { value: 'cafe', label: 'مقهى' },
  { value: 'fast_food', label: 'وجبات سريعة' },
  { value: 'bakery', label: 'مخبز' },
  { value: 'grocery', label: 'بقالة' },
  { value: 'pharmacy', label: 'صيدلية' },
];

export default function Stores() {
  const { isMobile, fontSize, spacing } = useResponsive();
  const queryClient = useQueryClient();
  
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(isMobile ? 10 : 20);
  const [filters, setFilters] = useState({
    search: '',
    category: 'all',
    status: 'all',
  });
  const [selectedStore, setSelectedStore] = useState(null);
  const [openForm, setOpenForm] = useState(false);
  const [openDetails, setOpenDetails] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  // جلب المتاجر
  const { data, isLoading, refetch, isFetching } = useQuery(
    ['stores', page, pageSize, filters],
    () => storesService.getStores({
      page: page + 1,
      limit: pageSize,
      search: filters.search || undefined,
      category: filters.category !== 'all' ? filters.category : undefined,
      isOpen: filters.status !== 'all' ? filters.status === 'open' : undefined,
    }),
    {
      keepPreviousData: true,
      onError: (error) => {
        setSnackbar({ 
          open: true, 
          message: handleError(error, 'فشل تحميل بيانات المتاجر'), 
          severity: 'error' 
        });
      }
    }
  );

  const stores = data?.data || [];
  const totalCount = data?.pagination?.total || 0;
  const stats = data?.stats || {};

  // حذف متجر
  const deleteMutation = useMutation(
    (id) => storesService.deleteStore(id),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('stores');
        setOpenDeleteDialog(false);
        setSnackbar({ open: true, message: 'تم حذف المتجر بنجاح', severity: 'success' });
      },
      onError: (error) => {
        setSnackbar({ open: true, message: handleError(error, 'فشل حذف المتجر'), severity: 'error' });
      },
    }
  );

  // توثيق متجر
  const verifyMutation = useMutation(
    (id) => storesService.verifyStore(id),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('stores');
        setSnackbar({ open: true, message: 'تم توثيق المتجر بنجاح', severity: 'success' });
      },
      onError: (error) => {
        setSnackbar({ open: true, message: handleError(error, 'فشل توثيق المتجر'), severity: 'error' });
      },
    }
  );

  // تغيير حالة المتجر
  const toggleStatusMutation = useMutation(
    (id) => storesService.toggleStoreStatus(id),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('stores');
        setSnackbar({ open: true, message: 'تم تغيير حالة المتجر', severity: 'success' });
      },
      onError: (error) => {
        setSnackbar({ open: true, message: handleError(error, 'فشل تغيير حالة المتجر'), severity: 'error' });
      },
    }
  );

  // دوال المعالجة
  const handleViewDetails = useCallback((store) => {
    setSelectedStore(store);
    setOpenDetails(true);
  }, []);

  const handleEdit = useCallback((store) => {
    setSelectedStore(store);
    setOpenForm(true);
  }, []);

  const handleDelete = useCallback((store) => {
    setSelectedStore(store);
    setOpenDeleteDialog(true);
  }, []);

  const handleVerify = useCallback((store) => {
    verifyMutation.mutate(getId(store));
  }, [verifyMutation]);

  const handleToggleStatus = useCallback((store) => {
    toggleStatusMutation.mutate(getId(store));
  }, [toggleStatusMutation]);

  const confirmDelete = useCallback(() => {
    if (selectedStore) {
      deleteMutation.mutate(getId(selectedStore));
    }
  }, [selectedStore, deleteMutation]);

  const resetFilters = useCallback(() => {
    setFilters({
      search: '',
      category: 'all',
      status: 'all',
    });
    setPage(0);
  }, []);

  // إحصائيات سريعة
  const statsCards = useMemo(() => {
    const activeStores = stores.filter(s => s.isOpen).length;
    const verifiedStores = stores.filter(s => s.isVerified).length;
    const avgRating = stores.length > 0 
      ? (stores.reduce((sum, s) => sum + (s.averageRating || 0), 0) / stores.length).toFixed(1)
      : '0';
    
    return [
      { title: 'إجمالي المتاجر', value: totalCount, icon: Storefront, color: '#2196f3' },
      { title: 'متاجر نشطة', value: activeStores, icon: ToggleOn, color: '#4caf50' },
      { title: 'متاجر موثقة', value: verifiedStores, icon: Verified, color: '#ff9800' },
      { title: 'متوسط التقييم', value: avgRating, icon: Rating, color: '#9c27b0' },
    ];
  }, [stores, totalCount]);

  // أعمدة الجدول
  const columns = useMemo(() => [
    {
      field: 'logo',
      headerName: 'الشعار',
      width: 80,
      renderCell: (params) => (
        <Avatar src={params.value || '/placeholder-store.jpg'} sx={{ width: 40, height: 40, borderRadius: 1 }}>
          {params.row.name?.charAt(0)}
        </Avatar>
      ),
    },
    { field: 'name', headerName: 'اسم المتجر', width: 180 },
    { 
      field: 'owner', 
      headerName: 'المالك (التاجر)', 
      width: 150,
      renderCell: (params) => {
        const owner = params.row.owner;
        if (!owner) return '-';
        if (typeof owner === 'object') {
          return (
            <Box display="flex" alignItems="center" gap={1}>
              <Avatar src={owner.avatar} sx={{ width: 24, height: 24 }}>
                {owner.name?.charAt(0)}
              </Avatar>
              <Typography variant="body2">{owner.name}</Typography>
            </Box>
          );
        }
        return owner;
      }
    },
    { field: 'phone', headerName: 'رقم الهاتف', width: 150 },
    { field: 'category', headerName: 'التصنيف', width: 120 },
    {
      field: 'averageRating',
      headerName: 'التقييم',
      width: 120,
      renderCell: (params) => (
        <Rating value={params.value || 0} readOnly size="small" precision={0.5} />
      ),
    },
    {
      field: 'isOpen',
      headerName: 'الحالة',
      width: 100,
      renderCell: (params) => (
        <Chip
          label={params.value ? 'مفتوح' : 'مغلق'}
          size="small"
          color={params.value ? 'success' : 'error'}
        />
      ),
    },
    {
      field: 'isVerified',
      headerName: 'موثق',
      width: 80,
      renderCell: (params) => (
        params.value ? <Verified color="primary" /> : <Chip label="غير موثق" size="small" variant="outlined" />
      ),
    },
    {
      field: 'actions',
      headerName: 'الإجراءات',
      width: 250,
      hideOnDesktop: false,
      renderCell: (params) => {
        const store = params.row;
        return (
          <Box display="flex" gap={0.5}>
            <Tooltip title="عرض التفاصيل">
              <IconButton size="small" onClick={() => handleViewDetails(store)}>
                <Visibility fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="تعديل">
              <IconButton size="small" onClick={() => handleEdit(store)}>
                <Edit fontSize="small" />
              </IconButton>
            </Tooltip>
            {!store.isVerified && (
              <Tooltip title="توثيق">
                <IconButton size="small" onClick={() => handleVerify(store)} color="primary">
                  <Verified fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
            <Tooltip title={store.isOpen ? 'إغلاق' : 'فتح'}>
              <IconButton size="small" onClick={() => handleToggleStatus(store)}>
                {store.isOpen ? <ToggleOff fontSize="small" color="error" /> : <ToggleOn fontSize="small" color="success" />}
              </IconButton>
            </Tooltip>
            <Tooltip title="حذف">
              <IconButton size="small" onClick={() => handleDelete(store)} color="error">
                <Delete fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        );
      },
    },
  ], [handleViewDetails, handleEdit, handleVerify, handleToggleStatus, handleDelete]);

  return (
    <Box sx={{ p: spacing.page }}>
      <Typography variant="h5" fontWeight="bold" sx={{ mb: spacing.section, fontSize: fontSize.h2 }}>
        إدارة المتاجر
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
            قائمة المتاجر
          </Typography>
          <Box display="flex" gap={1} flexWrap="wrap">
            <Button variant="outlined" startIcon={<Refresh />} onClick={() => refetch()} size="small" disabled={isFetching}>
              تحديث
            </Button>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => {
                setSelectedStore(null);
                setOpenForm(true);
              }}
              size="small"
            >
              {isMobile ? 'جديد' : 'متجر جديد'}
            </Button>
          </Box>
        </Box>

        <ResponsiveFilters onReset={resetFilters}>
          <Grid item xs={12} sm={6} md={4}>
            <TextField
              fullWidth
              label="بحث"
              size="small"
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              placeholder="اسم المتجر، البريد، رقم الهاتف..."
            />
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <TextField
              fullWidth
              select
              label="التصنيف"
              size="small"
              value={filters.category}
              onChange={(e) => setFilters({ ...filters, category: e.target.value })}
            >
              {categories.map((cat) => (
                <MenuItem key={cat.value} value={cat.value}>
                  {cat.label}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <TextField
              fullWidth
              select
              label="الحالة"
              size="small"
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            >
              <MenuItem value="all">الكل</MenuItem>
              <MenuItem value="open">مفتوح</MenuItem>
              <MenuItem value="closed">مغلق</MenuItem>
            </TextField>
          </Grid>
        </ResponsiveFilters>

        <ResponsiveTable
          data={stores}
          columns={columns}
          loading={isLoading}
          onRowClick={(store) => {
            setSelectedStore(store);
            setOpenDetails(true);
          }}
          emptyMessage="لا توجد متاجر"
          renderMobileCard={(store) => {
            const storeId = getId(store);
            const ownerName = typeof store.owner === 'object' ? store.owner?.name : (store.owner || 'غير محدد');
            return (
              <Paper 
                key={storeId} 
                sx={{ p: 1.5, cursor: 'pointer', mb: 1.5 }} 
                onClick={() => {
                  setSelectedStore(store);
                  setOpenDetails(true);
                }}
              >
                <Box display="flex" gap={2}>
                  <Avatar src={store.logo || '/placeholder-store.jpg'} sx={{ width: 50, height: 50, borderRadius: 1 }}>
                    {store.name?.charAt(0)}
                  </Avatar>
                  <Box flex={1}>
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={0.5}>
                      <Typography variant="subtitle2" fontWeight="bold">
                        {store.name}
                      </Typography>
                      <Chip
                        label={store.isOpen ? 'مفتوح' : 'مغلق'}
                        size="small"
                        color={store.isOpen ? 'success' : 'error'}
                      />
                    </Box>
                    <Typography variant="caption" color="textSecondary" display="block">
                      {store.phone}
                    </Typography>
                    <Typography variant="caption" color="textSecondary" display="block">
                      المالك: {ownerName}
                    </Typography>
                    <Typography variant="caption" color="textSecondary" display="block">
                      {store.category}
                    </Typography>
                    <Box display="flex" justifyContent="space-between" alignItems="center" mt={1}>
                      <Rating value={store.averageRating || 0} readOnly size="small" />
                      {store.isVerified && <Verified fontSize="small" color="primary" />}
                    </Box>
                  </Box>
                </Box>
                <Box display="flex" justifyContent="flex-end" gap={1} mt={1}>
                  {!store.isVerified && (
                    <IconButton 
                      size="small" 
                      onClick={(e) => { 
                        e.stopPropagation(); 
                        handleVerify(store);
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
                      handleToggleStatus(store);
                    }}
                  >
                    {store.isOpen ? <ToggleOff fontSize="small" /> : <ToggleOn fontSize="small" />}
                  </IconButton>
                </Box>
              </Paper>
            );
          }}
        />
      </Paper>

      {/* نموذج إضافة/تعديل متجر */}
      <ResponsiveDialog
        open={openForm}
        onClose={() => setOpenForm(false)}
        title={selectedStore ? 'تعديل متجر' : 'إضافة متجر جديد'}
        maxWidth="md"
      >
        <StoreForm
          store={selectedStore}
          onSuccess={() => {
            setOpenForm(false);
            queryClient.invalidateQueries('stores');
            setSnackbar({ open: true, message: selectedStore ? 'تم تحديث المتجر' : 'تم إضافة المتجر', severity: 'success' });
          }}
          onCancel={() => setOpenForm(false)}
        />
      </ResponsiveDialog>

      {/* ✅ تفاصيل المتجر - استخدام مكون StoreDetails المستقل */}
      <ResponsiveDialog
        open={openDetails}
        onClose={() => setOpenDetails(false)}
        title="تفاصيل المتجر"
        maxWidth="md"
        fullScreenOnMobile={true}
        actions={<Button onClick={() => setOpenDetails(false)}>إغلاق</Button>}
      >
        <StoreDetails store={selectedStore} />
      </ResponsiveDialog>

      {/* حوار تأكيد الحذف */}
      <ResponsiveDialog
        open={openDeleteDialog}
        onClose={() => setOpenDeleteDialog(false)}
        title="تأكيد الحذف"
        maxWidth="xs"
        actions={
          <>
            <Button onClick={() => setOpenDeleteDialog(false)}>إلغاء</Button>
            <Button onClick={confirmDelete} color="error" variant="contained">
              حذف
            </Button>
          </>
        }
      >
        <Typography>
          هل أنت متأكد من حذف المتجر "{selectedStore?.name}"؟
        </Typography>
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