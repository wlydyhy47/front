// src/components/Common/ResponsiveStatsCards.jsx - نسخة مصححة

import { Grid, Card, CardContent, Typography, Box, useTheme, useMediaQuery } from '@mui/material';
import { memo } from 'react'; // ✅ استيراد memo من react

const ResponsiveStatsCards = memo(({ 
  cards = [], 
  columnsDesktop = 4, 
  columnsTablet = 2, 
  columnsMobile = 2,
  spacing = 3,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'));

  // تحديد عدد الأعمدة
  let columns = columnsDesktop;
  if (isMobile) columns = columnsMobile;
  else if (isTablet) columns = columnsTablet;

  const StatCard = ({ title, value, icon: Icon, color, subtext }) => (
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

  return (
    <Grid container spacing={isMobile ? 1.5 : spacing}>
      {cards.map((card, index) => (
        <Grid item xs={12 / columns} key={index}>
          <StatCard {...card} />
        </Grid>
      ))}
    </Grid>
  );
});

ResponsiveStatsCards.displayName = 'ResponsiveStatsCards';

export default ResponsiveStatsCards;