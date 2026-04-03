import { useState } from 'react';
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
  Avatar,
  Rating,
  Alert,
  Snackbar,
} from '@mui/material';
import {
  Visibility,
  Verified,
  Refresh,
  Block,
  CheckCircle,
  Storefront,
} from '@mui/icons-material';
import { vendorsService } from '../../api';
import ResponsiveTable from '../../components/Common/ResponsiveTable';
import ResponsiveStatsCards from '../../components/Common/ResponsiveStatsCards';
import ResponsiveFilters from '../../components/Common/ResponsiveFilters';
import ResponsiveDialog from '../../components/Common/ResponsiveDialog';
import { useResponsive } from '../../hooks/useResponsive';
import { formatDate } from '../../utils/formatters';

export default function Vendors() {
  const { isMobile, fontSize, spacing } = useResponsive();
  const queryClient = useQueryClient();
  
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(isMobile ? 10 : 20);
  const [filters, setFilters] = useState({
    search: '',
    status: 'all',
  });
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [openDetails, setOpenDetails] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const { data, isLoading, refetch, isFetching } = useQuery(
    ['vendors', page, pageSize, filters],
    () => vendorsService.getVendors({
      page: page + 1,
      limit: pageSize,
      search: filters.search || undefined,
      isActive: filters.status !== 'all' ? filters.status === 'active' : undefined,
    })
  );

  const vendors = data?.data || [];
  const totalCount = data?.pagination?.total || 0;
  const stats = data?.stats || {};

  const verifyMutation = useMutation(
    (id) => vendorsService.verifyVendor(id),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('vendors');
        setSnackbar({ open: true, message: 'تم توثيق التاجر بنجاح', severity: 'success' });
      },
    }
  );

  const updateStatusMutation = useMutation(
    ({ id, isActive }) => vendorsService.updateVendorStatus(id, { isActive }),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('vendors');
        setSnackbar({ open: true, message: 'تم تغيير حالة التاجر', severity: 'success' });
      },
    }
  );

  const activeVendors = vendors.filter(v => v.isActive).length;
  const verifiedVendors = vendors.filter(v => v.isVerified).length;

  const statsCards = [
    { title: 'إجمالي التجار', value: totalCount, icon: Storefront, color: '#2196f3' },
    { title: 'تجار نشطين', value: activeVendors, icon: CheckCircle, color: '#4caf50' },
    { title: 'تجار موثقين', value: verifiedVendors, icon: Verified, color: '#ff9800' },
    { title: 'متوسط التقييم', value: stats.avgRating || '4.5', icon: Rating, color: '#9c27b0' },
  ];

  const columns = [
    {
      field: 'avatar',
      headerName: '',
      width: 60,
      renderCell: (params) => (
        <Avatar src={params.value} sx={{ width: 40, height: 40 }}>
          {params.row.name?.charAt(0)}
        </Avatar>
      ),
    },
    { field: 'name', headerName: 'الاسم', width: 150 },
    { field: 'phone', headerName: 'رقم الهاتف', width: 150 },
    { field: 'email', headerName: 'البريد الإلكتروني', width: 200 },
    {
      field: 'storeCount',
      headerName: 'عدد المتاجر',
      width: 120,
      valueGetter: (row) => row.stores?.length || 0,
    },
    {
      field: 'rating',
      headerName: 'التقييم',
      width: 120,
      renderCell: (params) => (
        <Rating value={params.value || 0} readOnly size="small" precision={0.5} />
      ),
    },
    {
      field: 'isVerified',
      headerName: 'موثق',
      width: 100,
      renderCell: (params) => (
        params.value ? <Verified color="primary" /> : <Chip label="غير موثق" size="small" variant="outlined" />
      ),
    },
    {
      field: 'isActive',
      headerName: 'الحالة',
      width: 100,
      renderCell: (params) => (
        <Chip label={params.value ? 'نشط' : 'غير نشط'} size="small" color={params.value ? 'success' : 'error'} variant="outlined" />
      ),
    },
    {
      field: 'createdAt',
      headerName: 'تاريخ التسجيل',
      width: 150,
      valueFormatter: (value) => formatDate(value),
      hideOnMobile: true,
    },
    {
      field: 'actions',
      headerName: 'الإجراءات',
      width: 150,
      hideOnDesktop: false,
      renderCell: (params) => (
        <Box display="flex" gap={0.5}>
          <Tooltip title="عرض التفاصيل">
            <IconButton size="small" onClick={() => {
              setSelectedVendor(params.row);
              setOpenDetails(true);
            }}>
              <Visibility fontSize="small" />
            </IconButton>
          </Tooltip>
          {!params.row.isVerified && (
            <Tooltip title="توثيق">
              <IconButton size="small" onClick={() => verifyMutation.mutate(params.row._id)} color="primary">
                <Verified fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
          <Tooltip title={params.row.isActive ? 'تعطيل' : 'تفعيل'}>
            <IconButton size="small" onClick={() => updateStatusMutation.mutate({ id: params.row._id, isActive: !params.row.isActive })}>
              {params.row.isActive ? <Block fontSize="small" color="error" /> : <CheckCircle fontSize="small" color="success" />}
            </IconButton>
          </Tooltip>
        </Box>
      ),
    },
  ];

  const resetFilters = () => {
    setFilters({
      search: '',
      status: 'all',
    });
  };

  return (
    <Box sx={{ p: spacing.page }}>
      <Typography variant="h5" fontWeight="bold" sx={{ mb: spacing.section, fontSize: fontSize.h2 }}>
        إدارة التجار
      </Typography>

      <ResponsiveStatsCards cards={statsCards} columnsDesktop={4} columnsTablet={2} columnsMobile={2} spacing={spacing.section} />

      <Paper sx={{ p: spacing.card }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2} flexWrap="wrap" gap={1}>
          <Typography variant="h6" fontWeight="bold" sx={{ fontSize: fontSize.h3 }}>
            قائمة التجار
          </Typography>
          <Button variant="outlined" startIcon={<Refresh />} onClick={() => refetch()} size="small" disabled={isFetching}>
            تحديث
          </Button>
        </Box>

        <ResponsiveFilters onReset={resetFilters}>
          <Grid item xs={12} sm={6} md={8}>
            <TextField
              fullWidth
              label="بحث"
              size="small"
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              placeholder="الاسم، رقم الهاتف، البريد الإلكتروني..."
            />
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
              <MenuItem value="active">نشط</MenuItem>
              <MenuItem value="inactive">غير نشط</MenuItem>
            </TextField>
          </Grid>
        </ResponsiveFilters>

        <ResponsiveTable
          data={vendors}
          columns={columns}
          loading={isLoading}
          onRowClick={(vendor) => {
            setSelectedVendor(vendor);
            setOpenDetails(true);
          }}
          emptyMessage="لا يوجد تجار"
          renderMobileCard={(vendor) => (
            <Paper key={vendor._id} sx={{ p: 1.5, cursor: 'pointer', mb: 1.5 }} onClick={() => {
              setSelectedVendor(vendor);
              setOpenDetails(true);
            }}>
              <Box display="flex" gap={2}>
                <Avatar src={vendor.avatar} sx={{ width: 50, height: 50 }}>
                  {vendor.name?.charAt(0)}
                </Avatar>
                <Box flex={1}>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={0.5}>
                    <Typography variant="subtitle2" fontWeight="bold">
                      {vendor.name}
                    </Typography>
                    <Chip label={vendor.isActive ? 'نشط' : 'غير نشط'} size="small" color={vendor.isActive ? 'success' : 'error'} />
                  </Box>
                  <Typography variant="caption" color="textSecondary" display="block">
                    {vendor.phone}
                  </Typography>
                  <Typography variant="caption" color="textSecondary" display="block">
                    {vendor.email}
                  </Typography>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mt={1}>
                    <Typography variant="caption">عدد المتاجر: {vendor.stores?.length || 0}</Typography>
                    {vendor.isVerified && <Verified fontSize="small" color="primary" />}
                  </Box>
                </Box>
              </Box>
            </Paper>
          )}
        />
      </Paper>

      <ResponsiveDialog
        open={openDetails}
        onClose={() => setOpenDetails(false)}
        title="تفاصيل التاجر"
        maxWidth="md"
        actions={<Button onClick={() => setOpenDetails(false)}>إغلاق</Button>}
      >
        {selectedVendor && (
          <Box>
            <Grid container spacing={2}>
              <Grid item xs={12} md={4} textAlign="center">
                <Avatar src={selectedVendor.avatar} sx={{ width: 100, height: 100, mx: 'auto' }}>
                  {selectedVendor.name?.charAt(0)}
                </Avatar>
                <Typography variant="h6" sx={{ mt: 2 }}>{selectedVendor.name}</Typography>
                <Rating value={selectedVendor.rating || 0} readOnly precision={0.5} />
              </Grid>
              <Grid item xs={12} md={8}>
                <Typography variant="body1" gutterBottom>
                  <strong>رقم الهاتف:</strong> {selectedVendor.phone}
                </Typography>
                <Typography variant="body1" gutterBottom>
                  <strong>البريد الإلكتروني:</strong> {selectedVendor.email || '-'}
                </Typography>
                <Typography variant="body1" gutterBottom>
                  <strong>عدد المتاجر:</strong> {selectedVendor.stores?.length || 0}
                </Typography>
                <Typography variant="body1" gutterBottom>
                  <strong>تاريخ التسجيل:</strong> {formatDate(selectedVendor.createdAt)}
                </Typography>
                <Box display="flex" gap={1} mt={2}>
                  <Chip label={selectedVendor.isVerified ? 'موثق' : 'غير موثق'} color={selectedVendor.isVerified ? 'primary' : 'default'} />
                  <Chip label={selectedVendor.isActive ? 'نشط' : 'غير نشط'} color={selectedVendor.isActive ? 'success' : 'error'} />
                </Box>
              </Grid>
            </Grid>
          </Box>
        )}
      </ResponsiveDialog>

      <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={() => setSnackbar({ ...snackbar, open: false })}>
        <Alert severity={snackbar.severity}>{snackbar.message}</Alert>
      </Snackbar>
    </Box>
  );
}