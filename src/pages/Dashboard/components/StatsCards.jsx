import { Grid, Card, CardContent, Typography, Box, useTheme, useMediaQuery } from '@mui/material';
import { PeopleAlt, Storefront, ShoppingBag, AttachMoney, Restaurant, LocalShipping, TrendingUp, Assessment } from '@mui/icons-material';

const StatCard = ({ title, value, icon: Icon, color, subtext }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  return (
    <Card sx={{ height: '100%' }}>
      <CardContent sx={{ p: { xs: 1.5, sm: 2 } }}>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Box sx={{ textAlign: 'right' }}>
            <Typography 
              color="textSecondary" 
              variant={isMobile ? "caption" : "body2"}
              sx={{ fontSize: { xs: '0.7rem', sm: '0.875rem' } }}
            >
              {title}
            </Typography>
            <Typography 
              variant={isMobile ? "h5" : "h4"} 
              sx={{ 
                mt: 1, 
                fontWeight: 'bold',
                fontSize: { xs: '1.25rem', sm: '1.5rem', md: '2rem' }
              }}
            >
              {typeof value === 'number' ? value.toLocaleString() : value}
            </Typography>
            {subtext && (
              <Typography 
                variant="caption" 
                color="textSecondary"
                sx={{ fontSize: { xs: '0.65rem', sm: '0.75rem' } }}
              >
                {subtext}
              </Typography>
            )}
          </Box>
          <Box
            sx={{
              backgroundColor: `${color}20`,
              borderRadius: 2,
              p: { xs: 1, sm: 1.5 },
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Icon sx={{ color, fontSize: { xs: 28, sm: 32 } }} />
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

export default function StatsCards({ stats = {} }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  const cards = [
    { title: 'إجمالي المستخدمين', value: stats.totalUsers || 0, icon: PeopleAlt, color: '#2196f3', subtext: `+${stats.newUsersThisMonth || 0} هذا الشهر` },
    { title: 'المتاجر النشطة', value: stats.activeStores || 0, icon: Storefront, color: '#4caf50', subtext: `من أصل ${stats.totalStores || 0} إجمالي` },
    { title: 'المنتجات', value: stats.totalProducts || 0, icon: Restaurant, color: '#ff9800', subtext: `${stats.activeProducts || 0} متاحة` },
    { title: 'الطلبات اليوم', value: stats.todayOrders || 0, icon: ShoppingBag, color: '#9c27b0', subtext: `متوسط ${stats.avgDailyOrders || 0} / يوم` },
    { title: 'المندوبين', value: stats.totalDrivers || 0, icon: LocalShipping, color: '#00bcd4', subtext: `${stats.onlineDrivers || 0} متصل الآن` },
    { title: 'الإيرادات اليوم', value: `${(stats.todayRevenue || 0).toLocaleString()} ₪`, icon: AttachMoney, color: '#f44336', subtext: `إجمالي ${(stats.totalRevenue || 0).toLocaleString()} ₪` },
    { title: 'نسبة النمو', value: `${stats.growthRate || 0}%`, icon: TrendingUp, color: '#3f51b5', subtext: 'مقارنة بالشهر الماضي' },
    { title: 'التقارير', value: stats.reportsCount || 0, icon: Assessment, color: '#795548', subtext: 'تقرير جديد اليوم' },
  ];
  
  return (
    <Grid container spacing={isMobile ? 1.5 : 3}>
      {cards.map((card, index) => (
        <Grid item xs={6} sm={6} md={3} key={index}>
          <StatCard {...card} />
        </Grid>
      ))}
    </Grid>
  );
}