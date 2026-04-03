import { useQuery } from 'react-query';
import { Grid, Paper, Typography, Box, CircularProgress, Card, CardContent, useTheme, useMediaQuery } from '@mui/material';
import { dashboardService } from '../../api';
import StatsCards from './components/StatsCards';
import OrdersChart from './components/OrdersChart';
import RevenueChart from './components/RevenueChart';
import RecentOrders from './components/RecentOrders';

export default function Dashboard() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'));
  
  const { data, isLoading, error } = useQuery(
    'dashboard',
    () => dashboardService.getDashboard(),
    {
      refetchInterval: 30000,
    }
  );

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={isMobile ? 2 : 3}>
        <Typography color="error">حدث خطأ في تحميل البيانات: {error.message}</Typography>
      </Box>
    );
  }

  const dashboardData = data?.data || {};

  return (
    <Box 
      dir="rtl" 
      sx={{ 
        p: { xs: 1.5, sm: 2, md: 3 },
        width: '100%',
        overflowX: 'hidden',
      }}
    >
      <Typography 
        variant={isMobile ? "h5" : "h4"} 
        sx={{ 
          mb: { xs: 2, sm: 3 }, 
          fontWeight: 'bold',
          fontSize: { xs: '1.5rem', sm: '1.75rem', md: '2rem' }
        }}
      >
        لوحة التحكم الرئيسية
      </Typography>
      
      {/* بطاقات الإحصائيات */}
      <StatsCards stats={dashboardData.stats || {}} />
      
      {/* الرسوم البيانية */}
      <Grid container spacing={isMobile ? 2 : 3} sx={{ mt: { xs: 0, sm: 1 } }}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: { xs: 1.5, sm: 2 } }}>
            <Typography variant={isMobile ? "subtitle1" : "h6"} sx={{ mb: 2 }}>
              تحليل الطلبات
            </Typography>
            <OrdersChart data={dashboardData.ordersAnalytics || []} />
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: { xs: 1.5, sm: 2 } }}>
            <Typography variant={isMobile ? "subtitle1" : "h6"} sx={{ mb: 2 }}>
              الإيرادات
            </Typography>
            <RevenueChart data={dashboardData.revenueData || []} />
          </Paper>
        </Grid>
        
        <Grid item xs={12}>
          <Paper sx={{ p: { xs: 1.5, sm: 2 }, overflowX: 'auto' }}>
            <Typography variant={isMobile ? "subtitle1" : "h6"} sx={{ mb: 2 }}>
              أحدث الطلبات
            </Typography>
            <RecentOrders orders={dashboardData.recentOrders || []} />
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}