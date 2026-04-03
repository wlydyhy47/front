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
  Alert,
  Snackbar,
  Rating,
} from '@mui/material';
import {
  Visibility,
  LocalShipping,
  Cancel,
  Refresh,
  Download,
  CheckCircle,
  Block,
} from '@mui/icons-material';
import { ordersService } from '../../api';
import ResponsiveTable from '../../components/Common/ResponsiveTable';
import ResponsiveStatsCards from '../../components/Common/ResponsiveStatsCards';
import ResponsiveFilters from '../../components/Common/ResponsiveFilters';
import ResponsiveDialog from '../../components/Common/ResponsiveDialog';
import { useResponsive } from '../../hooks/useResponsive';
import OrderDetails from './components/OrderDetails';
import AssignDriverModal from './components/AssignDriverModal';
import { formatDate, formatCurrency } from '../../utils/formatters';

const statusColors = {
  pending: { label: 'قيد الانتظار', color: '#ff9800', bg: '#ff980020' },
  accepted: { label: 'تم القبول', color: '#2196f3', bg: '#2196f320' },
  ready: { label: 'جاهز', color: '#4caf50', bg: '#4caf5020' },
  picked: { label: 'تم الاستلام', color: '#9c27b0', bg: '#9c27b020' },
  delivered: { label: 'تم التوصيل', color: '#4caf50', bg: '#4caf5020' },
  cancelled: { label: 'ملغي', color: '#f44336', bg: '#f4433620' },
};

const statusOptions = [
  { value: 'all', label: 'الكل' },
  { value: 'pending', label: 'قيد الانتظار' },
  { value: 'accepted', label: 'تم القبول' },
  { value: 'ready', label: 'جاهز' },
  { value: 'picked', label: 'تم الاستلام' },
  { value: 'delivered', label: 'تم التوصيل' },
  { value: 'cancelled', label: 'ملغي' },
];

export default function Orders() {
  const { isMobile, fontSize, spacing, gridColumns } = useResponsive();
  const queryClient = useQueryClient();
  
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(isMobile ? 10 : 20);
  const [filters, setFilters] = useState({
    search: '',
    status: 'all',
    fromDate: '',
    toDate: '',
  });
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [openDetails, setOpenDetails] = useState(false);
  const [openAssignDriver, setOpenAssignDriver] = useState(false);
  const [openCancelDialog, setOpenCancelDialog] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  // جلب الطلبات
  const { data, isLoading, refetch, isFetching } = useQuery(
    ['orders', page, pageSize, filters],
    () => ordersService.getOrders({
      page: page + 1,
      limit: pageSize,
      status: filters.status !== 'all' ? filters.status : undefined,
      search: filters.search || undefined,
      fromDate: filters.fromDate || undefined,
      toDate: filters.toDate || undefined,
    })
  );

  const orders = data?.data || [];
  const totalCount = data?.pagination?.total || 0;
  const stats = data?.stats || {};

  // إلغاء طلب
  const cancelMutation = useMutation(
    ({ id, reason }) => ordersService.forceCancelOrder(id, { reason }),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('orders');
        setOpenCancelDialog(false);
        setCancelReason('');
        setSnackbar({ open: true, message: 'تم إلغاء الطلب بنجاح', severity: 'success' });
      },
      onError: (error) => {
        setSnackbar({ open: true, message: error.response?.data?.message || 'فشل إلغاء الطلب', severity: 'error' });
      },
    }
  );

  const statsCards = [
    { title: 'إجمالي الطلبات', value: stats.totalOrders?.toLocaleString() || 0, icon: Refresh, color: '#2196f3' },
    { title: 'طلبات مكتملة', value: stats.completedOrders?.toLocaleString() || 0, icon: CheckCircle, color: '#4caf50' },
    { title: 'طلبات ملغية', value: stats.cancelledOrders?.toLocaleString() || 0, icon: Cancel, color: '#f44336' },
    { title: 'إجمالي الإيرادات', value: formatCurrency(stats.totalRevenue || 0), icon: Download, color: '#ff9800' },
  ];

  const columns = [
    { field: '_id', headerName: 'رقم الطلب', width: 220, hideOnMobile: true },
    { 
      field: 'user', 
      headerName: 'العميل', 
      width: 150,
      valueGetter: (row) => row.user?.name || row.userId,
    },
    { 
      field: 'store', 
      headerName: 'المتجر', 
      width: 150,
      valueGetter: (row) => row.store?.name || row.storeId,
    },
    { 
      field: 'totalPrice', 
      headerName: 'الإجمالي', 
      width: 120,
      valueFormatter: (value) => formatCurrency(value),
    },
    {
      field: 'status',
      headerName: 'الحالة',
      width: 120,
      renderCell: (params) => {
        const status = statusColors[params.value] || { label: params.value, color: '#999', bg: '#99920' };
        return (
          <Chip
            label={status.label}
            size="small"
            sx={{ backgroundColor: status.bg, color: status.color, fontWeight: 500 }}
          />
        );
      },
    },
    {
      field: 'paymentStatus',
      headerName: 'حالة الدفع',
      width: 120,
      renderCell: (params) => (
        <Chip
          label={params.value === 'paid' ? 'مدفوع' : params.value === 'pending' ? 'قيد الانتظار' : 'فشل'}
          size="small"
          color={params.value === 'paid' ? 'success' : params.value === 'pending' ? 'warning' : 'error'}
          variant="outlined"
        />
      ),
    },
    {
      field: 'createdAt',
      headerName: 'التاريخ',
      width: 150,
      valueFormatter: (value) => formatDate(value, 'yyyy-MM-dd HH:mm'),
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
              setSelectedOrder(params.row);
              setOpenDetails(true);
            }}>
              <Visibility fontSize="small" />
            </IconButton>
          </Tooltip>
          {params.row.status !== 'delivered' && params.row.status !== 'cancelled' && (
            <>
              <Tooltip title="تعيين مندوب">
                <IconButton size="small" onClick={() => {
                  setSelectedOrder(params.row);
                  setOpenAssignDriver(true);
                }}>
                  <LocalShipping fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="إلغاء الطلب">
                <IconButton size="small" onClick={() => {
                  setSelectedOrder(params.row);
                  setOpenCancelDialog(true);
                }} color="error">
                  <Cancel fontSize="small" />
                </IconButton>
              </Tooltip>
            </>
          )}
        </Box>
      ),
    },
  ];

  const resetFilters = () => {
    setFilters({
      search: '',
      status: 'all',
      fromDate: '',
      toDate: '',
    });
  };

  return (
    <Box sx={{ p: spacing.page }}>
      <Typography variant="h5" fontWeight="bold" sx={{ mb: spacing.section, fontSize: fontSize.h2 }}>
        إدارة الطلبات
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
            قائمة الطلبات
          </Typography>
          <Box display="flex" gap={1} flexWrap="wrap">
            <Button variant="outlined" startIcon={<Refresh />} onClick={() => refetch()} size="small" disabled={isFetching}>
              تحديث
            </Button>
            <Button variant="outlined" startIcon={<Download />} size="small">
              تصدير
            </Button>
          </Box>
        </Box>

        <ResponsiveFilters onReset={resetFilters}>
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              label="بحث"
              size="small"
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              placeholder="رقم الطلب، العميل، المتجر..."
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              select
              label="الحالة"
              size="small"
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            >
              {statusOptions.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              type="date"
              label="من تاريخ"
              size="small"
              value={filters.fromDate}
              onChange={(e) => setFilters({ ...filters, fromDate: e.target.value })}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              type="date"
              label="إلى تاريخ"
              size="small"
              value={filters.toDate}
              onChange={(e) => setFilters({ ...filters, toDate: e.target.value })}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
        </ResponsiveFilters>

        <ResponsiveTable
          data={orders}
          columns={columns}
          loading={isLoading}
          onRowClick={(order) => {
            setSelectedOrder(order);
            setOpenDetails(true);
          }}
          emptyMessage="لا توجد طلبات"
          renderMobileCard={(order) => {
            const status = statusColors[order.status] || { label: order.status, color: '#999', bg: '#99920' };
            return (
              <Paper key={order._id} sx={{ p: 1.5, cursor: 'pointer', mb: 1.5 }} onClick={() => {
                setSelectedOrder(order);
                setOpenDetails(true);
              }}>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                  <Typography variant="subtitle2" fontWeight="bold">
                    #{order._id?.slice(-6)}
                  </Typography>
                  <Chip
                    label={status.label}
                    size="small"
                    sx={{ backgroundColor: status.bg, color: status.color }}
                  />
                </Box>
                <Typography variant="body2" color="textSecondary">
                  {order.user?.name || order.userId}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  {order.store?.name || order.storeId}
                </Typography>
                <Box display="flex" justifyContent="space-between" alignItems="center" mt={1}>
                  <Typography variant="body2" fontWeight="bold" color="primary">
                    {formatCurrency(order.totalPrice)}
                  </Typography>
                  <Typography variant="caption" color="textSecondary">
                    {formatDate(order.createdAt, 'HH:mm')}
                  </Typography>
                </Box>
                <Box display="flex" justifyContent="flex-end" gap={1} mt={1}>
                  {order.status !== 'delivered' && order.status !== 'cancelled' && (
                    <>
                      <IconButton 
                        size="small" 
                        onClick={(e) => { 
                          e.stopPropagation(); 
                          setSelectedOrder(order);
                          setOpenAssignDriver(true);
                        }}
                      >
                        <LocalShipping fontSize="small" />
                      </IconButton>
                      <IconButton 
                        size="small" 
                        color="error"
                        onClick={(e) => { 
                          e.stopPropagation(); 
                          setSelectedOrder(order);
                          setOpenCancelDialog(true);
                        }}
                      >
                        <Cancel fontSize="small" />
                      </IconButton>
                    </>
                  )}
                </Box>
              </Paper>
            );
          }}
        />

        {/* ترقيم الصفحات للهواتف */}
        {isMobile && totalCount > pageSize && (
          <Box display="flex" justifyContent="center" mt={2} gap={1}>
            <Button variant="outlined" onClick={() => setPage(page - 1)} disabled={page === 0} size="small">
              السابق
            </Button>
            <Typography variant="body2" sx={{ alignSelf: 'center' }}>
              {page + 1} / {Math.ceil(totalCount / pageSize)}
            </Typography>
            <Button variant="outlined" onClick={() => setPage(page + 1)} disabled={(page + 1) * pageSize >= totalCount} size="small">
              التالي
            </Button>
          </Box>
        )}
      </Paper>

      {/* تفاصيل الطلب */}
      <ResponsiveDialog
        open={openDetails}
        onClose={() => setOpenDetails(false)}
        title={`تفاصيل الطلب #${selectedOrder?._id?.slice(-6)}`}
        maxWidth="md"
        actions={<Button onClick={() => setOpenDetails(false)}>إغلاق</Button>}
      >
        {selectedOrder && <OrderDetails order={selectedOrder} />}
      </ResponsiveDialog>

      {/* تعيين مندوب */}
      <AssignDriverModal
        open={openAssignDriver}
        onClose={() => setOpenAssignDriver(false)}
        orderId={selectedOrder?._id}
        onSuccess={() => {
          setOpenAssignDriver(false);
          queryClient.invalidateQueries('orders');
          setSnackbar({ open: true, message: 'تم تعيين المندوب بنجاح', severity: 'success' });
        }}
      />

      {/* إلغاء الطلب */}
      <ResponsiveDialog
        open={openCancelDialog}
        onClose={() => setOpenCancelDialog(false)}
        title="إلغاء الطلب"
        maxWidth="xs"
        actions={
          <>
            <Button onClick={() => setOpenCancelDialog(false)}>إلغاء</Button>
            <Button
              onClick={() => cancelMutation.mutate({ id: selectedOrder?._id, reason: cancelReason })}
              color="error"
              variant="contained"
              disabled={!cancelReason.trim() || cancelMutation.isLoading}
            >
              {cancelMutation.isLoading ? 'جاري...' : 'تأكيد الإلغاء'}
            </Button>
          </>
        }
      >
        <TextField
          fullWidth
          label="سبب الإلغاء"
          multiline
          rows={3}
          value={cancelReason}
          onChange={(e) => setCancelReason(e.target.value)}
          placeholder="يرجى توضيح سبب إلغاء الطلب..."
          sx={{ mt: 1 }}
        />
      </ResponsiveDialog>

      <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={() => setSnackbar({ ...snackbar, open: false })}>
        <Alert severity={snackbar.severity}>{snackbar.message}</Alert>
      </Snackbar>
    </Box>
  );
}