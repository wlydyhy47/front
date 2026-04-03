import { useState } from 'react';
import { useQuery } from 'react-query';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Tabs,
  Tab,
  MenuItem,
  TextField,
  CircularProgress,
  Card,
  CardContent,
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
import { analyticsService } from '../../api';
import { useResponsive } from '../../hooks/useResponsive';
import { formatCurrency } from '../../utils/formatters';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

export default function Analytics() {
  const { isMobile, fontSize, spacing } = useResponsive();
  const [tabValue, setTabValue] = useState(0);
  const [period, setPeriod] = useState('week');
  
  const { data: usersAnalytics, isLoading: usersLoading } = useQuery(
    ['users-analytics', period],
    () => analyticsService.getUsersAnalytics({ period }),
    { enabled: tabValue === 0 }
  );
  
  const { data: ordersAnalytics, isLoading: ordersLoading } = useQuery(
    ['orders-analytics', period],
    () => analyticsService.getOrdersAnalytics({ period }),
    { enabled: tabValue === 1 }
  );
  
  const { data: revenueAnalytics, isLoading: revenueLoading } = useQuery(
    ['revenue-analytics', period],
    () => analyticsService.getRevenueAnalytics({ period }),
    { enabled: tabValue === 2 }
  );
  
  const periods = [
    { value: 'day', label: 'يوم' },
    { value: 'week', label: 'أسبوع' },
    { value: 'month', label: 'شهر' },
    { value: 'year', label: 'سنة' },
  ];

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

  return (
    <Box sx={{ p: spacing.page }}>
      <Paper sx={{ p: spacing.card }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2} flexWrap="wrap" gap={1}>
          <Typography variant="h5" fontWeight="bold" sx={{ fontSize: fontSize.h2 }}>
            التحليلات والتقارير
          </Typography>
          <TextField
            select
            label="الفترة"
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            size="small"
            sx={{ width: isMobile ? 120 : 150 }}
          >
            {periods.map((p) => (
              <MenuItem key={p.value} value={p.value}>
                {p.label}
              </MenuItem>
            ))}
          </TextField>
        </Box>
        
        <Tabs 
          value={tabValue} 
          onChange={(e, newValue) => setTabValue(newValue)} 
          sx={{ mb: 3 }}
          variant={isMobile ? "scrollable" : "standard"}
          scrollButtons={isMobile ? "auto" : false}
        >
          <Tab label="المستخدمين" />
          <Tab label="الطلبات" />
          <Tab label="الإيرادات" />
        </Tabs>
        
        {/* تحليلات المستخدمين */}
        {tabValue === 0 && (
          <Box>
            {usersLoading ? (
              <Box display="flex" justifyContent="center" p={4}>
                <CircularProgress />
              </Box>
            ) : (
              <Grid container spacing={spacing.card}>
                <Grid item xs={6} md={4}>
                  <Card>
                    <CardContent sx={{ textAlign: 'center', p: isMobile ? 1.5 : 2 }}>
                      <Typography variant={isMobile ? "h5" : "h4"} color="primary">
                        {usersAnalytics?.data?.totalUsers?.toLocaleString() || 0}
                      </Typography>
                      <Typography variant="body2">إجمالي المستخدمين</Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={6} md={4}>
                  <Card>
                    <CardContent sx={{ textAlign: 'center', p: isMobile ? 1.5 : 2 }}>
                      <Typography variant={isMobile ? "h5" : "h4"} color="success.main">
                        {usersAnalytics?.data?.newUsers?.toLocaleString() || 0}
                      </Typography>
                      <Typography variant="body2">مستخدمين جدد ({period})</Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={6} md={4}>
                  <Card>
                    <CardContent sx={{ textAlign: 'center', p: isMobile ? 1.5 : 2 }}>
                      <Typography variant={isMobile ? "h5" : "h4"} color="warning.main">
                        {usersAnalytics?.data?.activeUsers?.toLocaleString() || 0}
                      </Typography>
                      <Typography variant="body2">مستخدمين نشطين</Typography>
                    </CardContent>
                  </Card>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  {renderChart('نمو المستخدمين',
                    <LineChart data={usersAnalytics?.data?.growth || []}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" tick={{ fontSize: isMobile ? 10 : 12 }} />
                      <YAxis tick={{ fontSize: isMobile ? 10 : 12 }} />
                      <Tooltip />
                      <Legend wrapperStyle={{ fontSize: isMobile ? 10 : 12 }} />
                      <Line type="monotone" dataKey="newUsers" stroke="#8884d8" name="مستخدمين جدد" />
                      <Line type="monotone" dataKey="totalUsers" stroke="#82ca9d" name="إجمالي المستخدمين" />
                    </LineChart>
                  )}
                </Grid>
                
                <Grid item xs={12} md={6}>
                  {renderChart('توزيع المستخدمين حسب الدور',
                    <PieChart>
                      <Pie
                        data={usersAnalytics?.data?.rolesDistribution || []}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => !isMobile && `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={isMobile ? 60 : 80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {(usersAnalytics?.data?.rolesDistribution || []).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend wrapperStyle={{ fontSize: isMobile ? 10 : 12 }} />
                    </PieChart>
                  )}
                </Grid>
              </Grid>
            )}
          </Box>
        )}
        
        {/* تحليلات الطلبات */}
        {tabValue === 1 && (
          <Box>
            {ordersLoading ? (
              <Box display="flex" justifyContent="center" p={4}>
                <CircularProgress />
              </Box>
            ) : (
              <Grid container spacing={spacing.card}>
                <Grid item xs={6} md={3}>
                  <Card>
                    <CardContent sx={{ textAlign: 'center', p: isMobile ? 1.5 : 2 }}>
                      <Typography variant={isMobile ? "h5" : "h4"} color="primary">
                        {ordersAnalytics?.data?.totalOrders?.toLocaleString() || 0}
                      </Typography>
                      <Typography variant="body2">إجمالي الطلبات</Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={6} md={3}>
                  <Card>
                    <CardContent sx={{ textAlign: 'center', p: isMobile ? 1.5 : 2 }}>
                      <Typography variant={isMobile ? "h5" : "h4"} color="success.main">
                        {ordersAnalytics?.data?.completedOrders?.toLocaleString() || 0}
                      </Typography>
                      <Typography variant="body2">طلبات مكتملة</Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={6} md={3}>
                  <Card>
                    <CardContent sx={{ textAlign: 'center', p: isMobile ? 1.5 : 2 }}>
                      <Typography variant={isMobile ? "h5" : "h4"} color="error.main">
                        {ordersAnalytics?.data?.cancelledOrders?.toLocaleString() || 0}
                      </Typography>
                      <Typography variant="body2">طلبات ملغية</Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={6} md={3}>
                  <Card>
                    <CardContent sx={{ textAlign: 'center', p: isMobile ? 1.5 : 2 }}>
                      <Typography variant={isMobile ? "h5" : "h4"} color="warning.main">
                        {formatCurrency(ordersAnalytics?.data?.averageOrderValue || 0)}
                      </Typography>
                      <Typography variant="body2">متوسط قيمة الطلب</Typography>
                    </CardContent>
                  </Card>
                </Grid>
                
                <Grid item xs={12}>
                  {renderChart('اتجاه الطلبات',
                    <BarChart data={ordersAnalytics?.data?.dailyOrders || []}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" tick={{ fontSize: isMobile ? 10 : 12 }} />
                      <YAxis tick={{ fontSize: isMobile ? 10 : 12 }} />
                      <Tooltip />
                      <Legend wrapperStyle={{ fontSize: isMobile ? 10 : 12 }} />
                      <Bar dataKey="orders" fill="#8884d8" name="الطلبات" />
                      <Bar dataKey="completed" fill="#82ca9d" name="مكتملة" />
                      <Bar dataKey="cancelled" fill="#ff8042" name="ملغية" />
                    </BarChart>
                  )}
                </Grid>
              </Grid>
            )}
          </Box>
        )}
        
        {/* تحليلات الإيرادات */}
        {tabValue === 2 && (
          <Box>
            {revenueLoading ? (
              <Box display="flex" justifyContent="center" p={4}>
                <CircularProgress />
              </Box>
            ) : (
              <Grid container spacing={spacing.card}>
                <Grid item xs={6} md={4}>
                  <Card>
                    <CardContent sx={{ textAlign: 'center', p: isMobile ? 1.5 : 2 }}>
                      <Typography variant={isMobile ? "h5" : "h4"} color="primary">
                        {formatCurrency(revenueAnalytics?.data?.totalRevenue || 0)}
                      </Typography>
                      <Typography variant="body2">إجمالي الإيرادات</Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={6} md={4}>
                  <Card>
                    <CardContent sx={{ textAlign: 'center', p: isMobile ? 1.5 : 2 }}>
                      <Typography variant={isMobile ? "h5" : "h4"} color="success.main">
                        {formatCurrency(revenueAnalytics?.data?.thisPeriodRevenue || 0)}
                      </Typography>
                      <Typography variant="body2">إيرادات {period}</Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={6} md={4}>
                  <Card>
                    <CardContent sx={{ textAlign: 'center', p: isMobile ? 1.5 : 2 }}>
                      <Typography variant={isMobile ? "h5" : "h4"} color="warning.main">
                        {revenueAnalytics?.data?.growthRate || 0}%
                      </Typography>
                      <Typography variant="body2">نسبة النمو</Typography>
                    </CardContent>
                  </Card>
                </Grid>
                
                <Grid item xs={12}>
                  {renderChart('اتجاه الإيرادات',
                    <AreaChart data={revenueAnalytics?.data?.dailyRevenue || []}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" tick={{ fontSize: isMobile ? 10 : 12 }} />
                      <YAxis tick={{ fontSize: isMobile ? 10 : 12 }} />
                      <Tooltip formatter={(value) => formatCurrency(value)} />
                      <Legend wrapperStyle={{ fontSize: isMobile ? 10 : 12 }} />
                      <Area type="monotone" dataKey="revenue" stroke="#8884d8" fill="#8884d8" name="الإيرادات" />
                    </AreaChart>
                  )}
                </Grid>
              </Grid>
            )}
          </Box>
        )}
      </Paper>
    </Box>
  );
}