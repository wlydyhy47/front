import { useState } from 'react';
import { useQuery } from 'react-query';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Button,
  TextField,
  MenuItem,
  Card,
  CardContent,
  CircularProgress,
  Tabs,
  Tab,
} from '@mui/material';
import { Download, Assessment, TrendingUp, TableChart } from '@mui/icons-material';
import { reportsService } from '../../api';
import { useResponsive } from '../../hooks/useResponsive';
import { formatDate, formatCurrency } from '../../utils/formatters';
import { exportToCSV, exportToJSON } from '../../utils/exportHelpers';
import ResponsiveTable from '../../components/Common/ResponsiveTable';

export default function Reports() {
  const { isMobile, fontSize, spacing } = useResponsive();
  const [tabValue, setTabValue] = useState(0);
  const [dateRange, setDateRange] = useState({
    from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    to: new Date().toISOString().split('T')[0],
  });
  const [format, setFormat] = useState('json');
  
  const { data: ordersReport, isLoading: ordersLoading, refetch: refetchOrders } = useQuery(
    ['orders-report', dateRange.from, dateRange.to, format],
    () => reportsService.getOrdersReport({ ...dateRange, format }),
    { enabled: tabValue === 0 }
  );
  
  const { data: usersReport, isLoading: usersLoading } = useQuery(
    ['users-report', format],
    () => reportsService.getUsersReport({ format }),
    { enabled: tabValue === 1 }
  );
  
  const { data: revenueReport, isLoading: revenueLoading } = useQuery(
    ['revenue-report', dateRange.from, dateRange.to],
    () => reportsService.getRevenueReport(dateRange),
    { enabled: tabValue === 2 }
  );
  
  const { data: driversReport, isLoading: driversLoading } = useQuery(
    ['drivers-report'],
    () => reportsService.getDriversReport(),
    { enabled: tabValue === 3 }
  );
  
  const { data: storesReport, isLoading: storesLoading } = useQuery(
    ['stores-report'],
    () => reportsService.getStoresReport(),
    { enabled: tabValue === 4 }
  );
  
  const handleExport = () => {
    let data = [];
    let filename = '';
    
    switch (tabValue) {
      case 0:
        data = ordersReport?.data?.orders || [];
        filename = `orders-report-${dateRange.from}_to_${dateRange.to}`;
        break;
      case 1:
        data = usersReport?.data?.users || [];
        filename = `users-report`;
        break;
      case 2:
        data = revenueReport?.data?.dailyRevenue || [];
        filename = `revenue-report-${dateRange.from}_to_${dateRange.to}`;
        break;
      case 3:
        data = driversReport?.data?.drivers || [];
        filename = `drivers-report`;
        break;
      case 4:
        data = storesReport?.data?.stores || [];
        filename = `stores-report`;
        break;
    }
    
    if (format === 'csv') {
      exportToCSV(data, `${filename}.csv`);
    } else {
      exportToJSON(data, `${filename}.json`);
    }
  };

  const renderStatsCards = (stats) => (
    <Grid container spacing={spacing.card} sx={{ mb: 3 }}>
      {stats.map((stat, index) => (
        <Grid item xs={6} sm={6} md={3} key={index}>
          <Card>
            <CardContent sx={{ textAlign: 'center', p: isMobile ? 1.5 : 2 }}>
              <Typography variant={isMobile ? "h5" : "h4"} color={stat.color}>
                {stat.value}
              </Typography>
              <Typography variant="body2">{stat.label}</Typography>
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );

  const ordersColumns = [
    { field: 'id', headerName: 'رقم الطلب', width: 150 },
    { field: 'user', headerName: 'العميل', width: 150, valueGetter: (row) => row.user?.name || row.userId },
    { field: 'store', headerName: 'المتجر', width: 150, valueGetter: (row) => row.store?.name || row.storeId },
    { field: 'totalPrice', headerName: 'المبلغ', width: 120, valueFormatter: (value) => formatCurrency(value) },
    { field: 'status', headerName: 'الحالة', width: 120 },
    { field: 'createdAt', headerName: 'التاريخ', width: 150, valueFormatter: (value) => formatDate(value) },
  ];

  return (
    <Box sx={{ p: spacing.page }}>
      <Paper sx={{ p: spacing.card }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3} flexWrap="wrap" gap={1}>
          <Typography variant="h5" fontWeight="bold" sx={{ fontSize: fontSize.h2 }}>
            التقارير
          </Typography>
          <Box display="flex" gap={2} flexWrap="wrap">
            <TextField
              select
              label="صيغة التصدير"
              value={format}
              onChange={(e) => setFormat(e.target.value)}
              size="small"
              sx={{ width: isMobile ? 100 : 120 }}
            >
              <MenuItem value="json">JSON</MenuItem>
              <MenuItem value="csv">CSV</MenuItem>
            </TextField>
            <Button variant="contained" startIcon={<Download />} onClick={handleExport} size={isMobile ? "small" : "medium"}>
              تصدير
            </Button>
          </Box>
        </Box>
        
        <Tabs 
          value={tabValue} 
          onChange={(e, newValue) => setTabValue(newValue)} 
          sx={{ mb: 3 }}
          variant={isMobile ? "scrollable" : "standard"}
          scrollButtons={isMobile ? "auto" : false}
        >
          <Tab icon={<Assessment />} label="الطلبات" />
          <Tab icon={<TableChart />} label="المستخدمين" />
          <Tab icon={<TrendingUp />} label="الإيرادات" />
          <Tab icon={<Assessment />} label="المندوبين" />
          <Tab icon={<Assessment />} label="المتاجر" />
        </Tabs>
        
        {tabValue !== 1 && (
          <Box display="flex" gap={2} mb={3} flexWrap="wrap">
            <TextField
              type="date"
              label="من تاريخ"
              value={dateRange.from}
              onChange={(e) => setDateRange({ ...dateRange, from: e.target.value })}
              size="small"
              InputLabelProps={{ shrink: true }}
              fullWidth={isMobile}
            />
            <TextField
              type="date"
              label="إلى تاريخ"
              value={dateRange.to}
              onChange={(e) => setDateRange({ ...dateRange, to: e.target.value })}
              size="small"
              InputLabelProps={{ shrink: true }}
              fullWidth={isMobile}
            />
            <Button variant="outlined" onClick={() => refetchOrders()} size="small">
              تطبيق
            </Button>
          </Box>
        )}
        
        {/* تقارير الطلبات */}
        {tabValue === 0 && (
          ordersLoading ? <Box textAlign="center" py={4}><CircularProgress /></Box> : (
            <Box>
              {renderStatsCards([
                { label: 'إجمالي الطلبات', value: ordersReport?.data?.totalOrders?.toLocaleString() || 0, color: '#2196f3' },
                { label: 'طلبات مكتملة', value: ordersReport?.data?.completedOrders?.toLocaleString() || 0, color: '#4caf50' },
                { label: 'طلبات ملغية', value: ordersReport?.data?.cancelledOrders?.toLocaleString() || 0, color: '#f44336' },
                { label: 'إجمالي الإيرادات', value: formatCurrency(ordersReport?.data?.totalRevenue || 0), color: '#ff9800' },
              ])}
              <ResponsiveTable data={ordersReport?.data?.orders || []} columns={ordersColumns} emptyMessage="لا توجد طلبات" />
            </Box>
          )
        )}
        
        {/* تقارير المستخدمين */}
        {tabValue === 1 && (
          usersLoading ? <Box textAlign="center" py={4}><CircularProgress /></Box> : (
            <Box>
              {renderStatsCards([
                { label: 'إجمالي المستخدمين', value: usersReport?.data?.totalUsers?.toLocaleString() || 0, color: '#2196f3' },
                { label: 'مستخدمين نشطين', value: usersReport?.data?.activeUsers?.toLocaleString() || 0, color: '#4caf50' },
                { label: 'مستخدمين موثقين', value: usersReport?.data?.verifiedUsers?.toLocaleString() || 0, color: '#ff9800' },
                { label: 'مستخدمين جدد', value: usersReport?.data?.newUsersThisMonth?.toLocaleString() || 0, color: '#9c27b0' },
              ])}
              <ResponsiveTable 
                data={usersReport?.data?.users || []} 
                columns={[
                  { field: 'name', headerName: 'الاسم', width: 150 },
                  { field: 'phone', headerName: 'رقم الهاتف', width: 150 },
                  { field: 'email', headerName: 'البريد الإلكتروني', width: 180 },
                  { field: 'role', headerName: 'الدور', width: 100 },
                  { field: 'isActive', headerName: 'الحالة', width: 100, valueFormatter: (v) => v ? 'نشط' : 'غير نشط' },
                  { field: 'createdAt', headerName: 'تاريخ التسجيل', width: 150, valueFormatter: (v) => formatDate(v) },
                ]}
                emptyMessage="لا يوجد مستخدمين"
              />
            </Box>
          )
        )}
        
        {/* تقارير الإيرادات */}
        {tabValue === 2 && (
          revenueLoading ? <Box textAlign="center" py={4}><CircularProgress /></Box> : (
            <Box>
              {renderStatsCards([
                { label: 'إجمالي الإيرادات', value: formatCurrency(revenueReport?.data?.totalRevenue || 0), color: '#2196f3' },
                { label: 'متوسط الإيرادات اليومية', value: formatCurrency(revenueReport?.data?.avgDailyRevenue || 0), color: '#4caf50' },
                { label: 'نسبة النمو', value: `${revenueReport?.data?.growthRate || 0}%`, color: '#ff9800' },
                { label: 'الإيرادات المتوقعة', value: formatCurrency(revenueReport?.data?.projectedRevenue || 0), color: '#9c27b0' },
              ])}
              <ResponsiveTable 
                data={revenueReport?.data?.dailyRevenue || []} 
                columns={[
                  { field: 'date', headerName: 'اليوم', width: 150, valueFormatter: (v) => formatDate(v, 'yyyy-MM-dd') },
                  { field: 'orders', headerName: 'عدد الطلبات', width: 120 },
                  { field: 'revenue', headerName: 'الإيرادات', width: 150, valueFormatter: (v) => formatCurrency(v) },
                  { field: 'averageOrderValue', headerName: 'متوسط قيمة الطلب', width: 150, valueFormatter: (v) => formatCurrency(v) },
                ]}
                emptyMessage="لا توجد بيانات"
              />
            </Box>
          )
        )}
      </Paper>
    </Box>
  );
}