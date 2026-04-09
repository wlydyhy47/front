import { useQuery } from 'react-query';
import {
  Box,
  Grid,
  Typography,
  Paper,
  Avatar,
  Rating,
  Chip,
  Divider,
  LinearProgress,
} from '@mui/material';
import { driversService } from '../../../api';
import { formatDate, formatCurrency } from '../../../utils/formatters';

export default function DriverDetails({ driver }) {
  // ✅ FIXED: استخدام driver._id بدلاً من driver.id
  const { data: stats } = useQuery(
    ['driver-stats', driver._id],
    () => driversService.getDriverStats(driver._id),
    { enabled: !!driver._id }
  );
  
  // ✅ FIXED: استخدام driver._id بدلاً من driver.id
  const { data: orders } = useQuery(
    ['driver-orders', driver._id],
    () => driversService.getDriverOrders(driver._id, { limit: 5 }),
    { enabled: !!driver._id }
  );
  
  const statsData = stats?.data || {};
  const recentOrders = orders?.data?.orders || [];
  
  return (
    <Box>
      <Paper sx={{ p: 3, mb: 3, textAlign: 'center' }}>
        <Avatar
          src={driver.avatar}
          sx={{ width: 100, height: 100, mx: 'auto', mb: 2 }}
        >
          {driver.name?.charAt(0)}
        </Avatar>
        <Typography variant="h5">{driver.name}</Typography>
        <Box display="flex" justifyContent="center" alignItems="center" gap={1} mt={1}>
          <Rating value={driver.rating || 0} readOnly precision={0.5} />
          <Typography variant="body2">({driver.rating || 0})</Typography>
        </Box>
        <Box display="flex" justifyContent="center" gap={1} mt={2}>
          {driver.isVerified && <Chip label="موثق" color="primary" size="small" />}
          {driver.isOnline && <Chip label="متصل" color="success" size="small" />}
          <Chip
            label={driver.isActive ? 'حساب نشط' : 'حساب غير نشط'}
            color={driver.isActive ? 'success' : 'error'}
            size="small"
          />
        </Box>
      </Paper>
      
      <Typography variant="h6" gutterBottom>
        معلومات الاتصال
      </Typography>
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <Typography variant="body2" color="textSecondary">
              رقم الهاتف
            </Typography>
            <Typography variant="body1">{driver.phone}</Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="body2" color="textSecondary">
              البريد الإلكتروني
            </Typography>
            <Typography variant="body1">{driver.email || '-'}</Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="body2" color="textSecondary">
              تاريخ التسجيل
            </Typography>
            <Typography variant="body1">{formatDate(driver.createdAt)}</Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="body2" color="textSecondary">
              آخر نشاط
            </Typography>
            <Typography variant="body1">{formatDate(driver.lastActive)}</Typography>
          </Grid>
        </Grid>
      </Paper>
      
      <Typography variant="h6" gutterBottom>
        إحصائيات التوصيل
      </Typography>
      <Grid container spacing={2} mb={3}>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h4">{statsData.totalDeliveries || 0}</Typography>
            <Typography variant="body2">إجمالي التوصيلات</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h4">{statsData.todayDeliveries || 0}</Typography>
            <Typography variant="body2">توصيلات اليوم</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h4">{statsData.weeklyDeliveries || 0}</Typography>
            <Typography variant="body2">توصيلات هذا الأسبوع</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h4">{formatCurrency(statsData.totalEarnings || 0)}</Typography>
            <Typography variant="body2">إجمالي الأرباح</Typography>
          </Paper>
        </Grid>
      </Grid>
      
      <Typography variant="h6" gutterBottom>
        آخر الطلبات
      </Typography>
      <Paper sx={{ p: 2 }}>
        {recentOrders.length === 0 ? (
          <Typography color="textSecondary">لا توجد طلبات سابقة</Typography>
        ) : (
          recentOrders.map((order) => (
            <Box key={order._id} sx={{ mb: 2 }}>
              <Box display="flex" justifyContent="space-between">
                <Typography variant="body2">
                  <strong>طلب #{order._id?.slice(-6)}</strong>
                </Typography>
                <Typography variant="caption" color="textSecondary">
                  {formatDate(order.createdAt)}
                </Typography>
              </Box>
              <Typography variant="body2">
                من: {order.store?.name || order.storeId}
              </Typography>
              <Typography variant="body2">
                إلى: {order.deliveryAddress?.addressLine}
              </Typography>
              <Typography variant="body2">
                المبلغ: {formatCurrency(order.totalPrice)}
              </Typography>
              <Chip
                label={order.status}
                size="small"
                sx={{ mt: 1 }}
              />
              <Divider sx={{ mt: 2 }} />
            </Box>
          ))
        )}
      </Paper>
    </Box>
  );
}