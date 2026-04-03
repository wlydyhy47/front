import { useState } from 'react';
import { useQuery } from 'react-query';
import {
  Box,
  Paper,
  Typography,
  Grid,
  TextField,
  MenuItem,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Tabs,
  Tab,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
} from 'recharts';
import { advancedStatsService } from '../../api';
import { useResponsive } from '../../hooks/useResponsive';
import { formatCurrency } from '../../utils/formatters';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

export default function AdvancedStats() {
  const { isMobile, fontSize, spacing } = useResponsive();
  const [tabValue, setTabValue] = useState(0);
  const [customParams, setCustomParams] = useState({
    from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    to: new Date().toISOString().split('T')[0],
    groupBy: 'day',
  });
  
  const { data: dailyStats, isLoading: dailyLoading } = useQuery(
    'daily-stats',
    () => advancedStatsService.getDailyStats(),
    { enabled: tabValue === 0 }
  );
  
  const { data: weeklyStats, isLoading: weeklyLoading } = useQuery(
    'weekly-stats',
    () => advancedStatsService.getWeeklyStats(),
    { enabled: tabValue === 1 }
  );
  
  const { data: monthlyStats, isLoading: monthlyLoading } = useQuery(
    'monthly-stats',
    () => advancedStatsService.getMonthlyStats(),
    { enabled: tabValue === 2 }
  );
  
  const { data: customStats, isLoading: customLoading, refetch: refetchCustom } = useQuery(
    ['custom-stats', customParams],
    () => advancedStatsService.getCustomStats(customParams),
    { enabled: tabValue === 3 }
  );
  
  const renderChart = (title, children, height = 300) => (
    <Paper sx={{ p: spacing.card }}>
      <Typography variant={isMobile ? "subtitle1" : "h6"} mb={2}>
        {title}
      </Typography>
      <ResponsiveContainer width="100%" height={isMobile ? 250 : height}>
        {children}
      </ResponsiveContainer>
    </Paper>
  );

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
  
  const renderDailyStats = () => {
    if (dailyLoading) return <Box textAlign="center" py={4}><CircularProgress /></Box>;
    
    const stats = dailyStats?.data || {};
    
    return (
      <Box>
        {renderStatsCards([
          { label: 'إجمالي الطلبات', value: stats.totalOrders || 0, color: '#2196f3' },
          { label: 'طلبات مكتملة', value: stats.completedOrders || 0, color: '#4caf50' },
          { label: 'مستخدمين نشطين', value: stats.activeUsers || 0, color: '#ff9800' },
          { label: 'مستخدمين جدد', value: stats.newUsers || 0, color: '#9c27b0' },
        ])}
        
        <Grid container spacing={spacing.card}>
          <Grid item xs={12} md={6}>
            {renderChart('الطلبات حسب الساعة',
              <LineChart data={stats.hourlyOrders || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="hour" tick={{ fontSize: isMobile ? 10 : 12 }} />
                <YAxis tick={{ fontSize: isMobile ? 10 : 12 }} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: isMobile ? 10 : 12 }} />
                <Line type="monotone" dataKey="orders" stroke="#8884d8" name="الطلبات" />
              </LineChart>
            )}
          </Grid>
          
          <Grid item xs={12} md={6}>
            {renderChart('أكثر المنتجات مبيعاً',
              <BarChart data={stats.topProducts || []} layout={isMobile ? "horizontal" : "vertical"}>
                <CartesianGrid strokeDasharray="3 3" />
                {isMobile ? (
                  <>
                    <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                  </>
                ) : (
                  <>
                    <XAxis type="number" />
                    <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 12 }} />
                  </>
                )}
                <Tooltip />
                <Bar dataKey="quantity" fill="#82ca9d" name="الكمية" />
              </BarChart>
            )}
          </Grid>
        </Grid>
      </Box>
    );
  };
  
  const renderWeeklyStats = () => {
    if (weeklyLoading) return <Box textAlign="center" py={4}><CircularProgress /></Box>;
    
    const stats = weeklyStats?.data || {};
    
    return (
      <Box>
        {renderStatsCards([
          { label: 'إجمالي الطلبات', value: stats.totalOrders || 0, color: '#2196f3' },
          { label: 'إجمالي الإيرادات', value: formatCurrency(stats.totalRevenue || 0), color: '#4caf50' },
          { label: 'نسبة النمو', value: `${stats.growthRate || 0}%`, color: '#ff9800' },
          { label: 'متوسط قيمة الطلب', value: formatCurrency(stats.avgOrderValue || 0), color: '#9c27b0' },
        ])}
        
        <Grid item xs={12}>
          {renderChart('الطلبات والإيرادات خلال الأسبوع',
            <AreaChart data={stats.dailyData || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" tick={{ fontSize: isMobile ? 10 : 12 }} />
              <YAxis yAxisId="left" tick={{ fontSize: isMobile ? 10 : 12 }} />
              <YAxis yAxisId="right" orientation="right" tick={{ fontSize: isMobile ? 10 : 12 }} />
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: isMobile ? 10 : 12 }} />
              <Area yAxisId="left" type="monotone" dataKey="orders" stroke="#8884d8" fill="#8884d8" name="الطلبات" />
              <Area yAxisId="right" type="monotone" dataKey="revenue" stroke="#82ca9d" fill="#82ca9d" name="الإيرادات" />
            </AreaChart>
          )}
        </Grid>
      </Box>
    );
  };
  
  const renderMonthlyStats = () => {
    if (monthlyLoading) return <Box textAlign="center" py={4}><CircularProgress /></Box>;
    
    const stats = monthlyStats?.data || {};
    
    return (
      <Box>
        {renderStatsCards([
          { label: 'إجمالي الطلبات', value: stats.totalOrders || 0, color: '#2196f3' },
          { label: 'إجمالي الإيرادات', value: formatCurrency(stats.totalRevenue || 0), color: '#4caf50' },
          { label: 'نمو شهري', value: `${stats.monthlyGrowth || 0}%`, color: '#ff9800' },
          { label: 'متاجر نشطة', value: stats.activeStores || 0, color: '#9c27b0' },
        ])}
        
        <Grid container spacing={spacing.card}>
          <Grid item xs={12} md={6}>
            {renderChart('توزيع الطلبات حسب اليوم',
              <BarChart data={stats.ordersByDayOfWeek || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" tick={{ fontSize: isMobile ? 10 : 12 }} />
                <YAxis tick={{ fontSize: isMobile ? 10 : 12 }} />
                <Tooltip />
                <Bar dataKey="orders" fill="#8884d8" name="الطلبات" />
              </BarChart>
            )}
          </Grid>
          
          <Grid item xs={12} md={6}>
            {renderChart('توزيع الإيرادات حسب طريقة الدفع',
              <PieChart>
                <Pie
                  data={stats.paymentMethodDistribution || []}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => !isMobile && `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={isMobile ? 60 : 80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {(stats.paymentMethodDistribution || []).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: isMobile ? 10 : 12 }} />
              </PieChart>
            )}
          </Grid>
        </Grid>
      </Box>
    );
  };
  
  const renderCustomStats = () => {
    if (customLoading) return <Box textAlign="center" py={4}><CircularProgress /></Box>;
    
    const stats = customStats?.data || {};
    
    return (
      <Box>
        <Paper sx={{ p: spacing.card, mb: 3 }}>
          <Typography variant="subtitle1" fontWeight="bold" mb={2}>
            الفترة المحددة
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={4}>
              <TextField
                fullWidth
                type="date"
                label="من تاريخ"
                value={customParams.from}
                onChange={(e) => setCustomParams({ ...customParams, from: e.target.value })}
                InputLabelProps={{ shrink: true }}
                size={isMobile ? "small" : "medium"}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <TextField
                fullWidth
                type="date"
                label="إلى تاريخ"
                value={customParams.to}
                onChange={(e) => setCustomParams({ ...customParams, to: e.target.value })}
                InputLabelProps={{ shrink: true }}
                size={isMobile ? "small" : "medium"}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                select
                label="التجميع حسب"
                value={customParams.groupBy}
                onChange={(e) => setCustomParams({ ...customParams, groupBy: e.target.value })}
                size={isMobile ? "small" : "medium"}
              >
                <MenuItem value="hour">ساعة</MenuItem>
                <MenuItem value="day">يوم</MenuItem>
                <MenuItem value="week">أسبوع</MenuItem>
                <MenuItem value="month">شهر</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6} md={1}>
              <Button
                fullWidth
                variant="contained"
                onClick={() => refetchCustom()}
                sx={{ height: isMobile ? 40 : '100%' }}
              >
                تطبيق
              </Button>
            </Grid>
          </Grid>
        </Paper>
        
        {renderStatsCards([
          { label: 'إجمالي الطلبات', value: stats.totalOrders?.toLocaleString() || 0, color: '#2196f3' },
          { label: 'إجمالي الإيرادات', value: formatCurrency(stats.totalRevenue || 0), color: '#4caf50' },
          { label: 'إجمالي المستخدمين', value: stats.totalUsers?.toLocaleString() || 0, color: '#ff9800' },
          { label: 'متوسط قيمة الطلب', value: formatCurrency(stats.avgOrderValue || 0), color: '#9c27b0' },
        ])}
        
        <Grid item xs={12}>
          {renderChart('الاتجاهات خلال الفترة',
            <LineChart data={stats.timelineData || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="period" tick={{ fontSize: isMobile ? 10 : 12 }} />
              <YAxis yAxisId="left" tick={{ fontSize: isMobile ? 10 : 12 }} />
              <YAxis yAxisId="right" orientation="right" tick={{ fontSize: isMobile ? 10 : 12 }} />
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: isMobile ? 10 : 12 }} />
              <Line yAxisId="left" type="monotone" dataKey="orders" stroke="#8884d8" name="الطلبات" />
              <Line yAxisId="right" type="monotone" dataKey="revenue" stroke="#82ca9d" name="الإيرادات" />
            </LineChart>
          )}
        </Grid>
      </Box>
    );
  };
  
  return (
    <Box sx={{ p: spacing.page }}>
      <Paper sx={{ p: spacing.card }}>
        <Typography variant="h5" fontWeight="bold" sx={{ mb: 3, fontSize: fontSize.h2 }}>
          الإحصائيات المتقدمة
        </Typography>
        
        <Tabs 
          value={tabValue} 
          onChange={(e, newValue) => setTabValue(newValue)} 
          sx={{ mb: 3 }}
          variant={isMobile ? "scrollable" : "standard"}
          scrollButtons={isMobile ? "auto" : false}
        >
          <Tab label="يومية" />
          <Tab label="أسبوعية" />
          <Tab label="شهرية" />
          <Tab label="مخصصة" />
        </Tabs>
        
        {tabValue === 0 && renderDailyStats()}
        {tabValue === 1 && renderWeeklyStats()}
        {tabValue === 2 && renderMonthlyStats()}
        {tabValue === 3 && renderCustomStats()}
      </Paper>
    </Box>
  );
}