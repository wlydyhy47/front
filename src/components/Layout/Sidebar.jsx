import { NavLink, useLocation } from 'react-router-dom';
import {
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemButton,
  Divider,
  Box,
  Typography,
  useTheme,
  useMediaQuery,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Dashboard,
  People,
  Storefront,
  Restaurant,
  ShoppingBag,
  LocalShipping,
  Notifications,
  Analytics,
  Assessment,
  TrendingUp,
  Settings,
  Security,
  Map,
  Menu as MenuIcon,
  Close,
} from '@mui/icons-material';

const menuItems = [
  { path: '/dashboard', label: 'لوحة التحكم', icon: Dashboard },
  { path: '/users', label: 'المستخدمين', icon: People },
  { path: '/vendors', label: 'التجار', icon: People },
  { path: '/stores', label: 'المتاجر', icon: Storefront },
  { path: '/products', label: 'المنتجات', icon: Restaurant },
  { path: '/orders', label: 'الطلبات', icon: ShoppingBag },
  { path: '/drivers', label: 'المندوبين', icon: LocalShipping },
  { path: '/map', label: 'الخرائط', icon: Map },
  { path: '/notifications', label: 'الإشعارات', icon: Notifications },
  { path: '/analytics', label: 'التحليلات', icon: Analytics },
  { path: '/reports', label: 'التقارير', icon: Assessment },
  { path: '/advanced-stats', label: 'إحصائيات متقدمة', icon: TrendingUp },
  { path: '/system', label: 'النظام', icon: Settings },
];

export default function Sidebar({ onClose }) {
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'));

  // حساب العرض المناسب
  const logoWidth = isMobile ? 70 : isTablet ? 180 : 220;
  const logoHeight = isMobile ? 70 : isTablet ? 100 : 120;
  const titleFontSize = isMobile ? '0.875rem' : isTablet ? '1rem' : '1.25rem';
  const menuFontSize = isMobile ? '0.75rem' : isTablet ? '0.875rem' : '1rem';

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        position: 'relative',
      }}
    >
      {/* زر إغلاق القائمة للهواتف */}
      {isMobile && onClose && (
        <IconButton
          onClick={onClose}
          sx={{
            position: 'absolute',
            top: 8,
            left: 8,
            zIndex: 1,
            backgroundColor: theme.palette.action.hover,
            '&:hover': {
              backgroundColor: theme.palette.action.selected,
            },
          }}
          size="small"
        >
          <Close fontSize="small" />
        </IconButton>
      )}
      
      {/* الجزء العلوي - الشعار */}
      <Box
        sx={{
          p: { xs: 1, sm: 2 },
          pt: { xs: 4, sm: 2 },
          textAlign: 'center',
          borderBottom: `1px solid ${theme.palette.divider}`,
          backgroundColor: theme.palette.background.paper,
          transition: 'all 0.3s ease',
        }}
      >
        <Box
          sx={{
            width: logoWidth,
            height: logoHeight,
            mx: 'auto',
            cursor: 'pointer',
            overflow: 'hidden',
            transition: 'transform 0.3s ease',
            backgroundImage: 'url(/logo.png)',
            backgroundSize: 'contain',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            '&:hover': {
              transform: 'scale(1.05)',
            },
          }}
          onClick={() => window.location.href = '/'}
        />
        {!isMobile && (
          <Typography
            variant="h6"
            fontWeight="bold"
            color="primary"
            sx={{
              fontSize: titleFontSize,
              mt: 1,
              transition: 'all 0.3s ease',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            Food Delivery Admin
          </Typography>
        )}
      </Box>

      {/* الجزء القابل للتمرير - القائمة */}
      <Box
        sx={{
          flex: 1,
          overflowY: 'auto',
          overflowX: 'hidden',
          '&::-webkit-scrollbar': {
            width: '4px',
          },
          '&::-webkit-scrollbar-track': {
            backgroundColor: theme.palette.grey[200],
            borderRadius: '2px',
          },
          '&::-webkit-scrollbar-thumb': {
            backgroundColor: theme.palette.primary.main,
            borderRadius: '2px',
            '&:hover': {
              backgroundColor: theme.palette.primary.dark,
            },
          },
        }}
      >
        <List sx={{ px: { xs: 1, sm: 2 }, py: 1 }}>
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path ||
              location.pathname.startsWith(`${item.path}/`);

            return (
              <ListItem key={item.path} disablePadding sx={{ mb: 0.5 }}>
                <ListItemButton
                  component={NavLink}
                  to={item.path}
                  onClick={isMobile ? onClose : undefined}
                  selected={isActive}
                  sx={{
                    borderRadius: 1.5,
                    py: { xs: 0.75, sm: 1 },
                    transition: 'all 0.2s ease',
                    '&.active': {
                      backgroundColor: theme.palette.primary.main + '15',
                      color: theme.palette.primary.main,
                      '& .MuiListItemIcon-root': {
                        color: theme.palette.primary.main,
                      },
                    },
                    '&:hover': {
                      transform: isMobile ? 'none' : 'translateX(4px)',
                      backgroundColor: theme.palette.action.hover,
                    },
                  }}
                >
                  <ListItemIcon 
                    sx={{ 
                      minWidth: { xs: 36, sm: 40 },
                      mr: { xs: 0.5, sm: 1 },
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <item.icon fontSize={isMobile ? "small" : "medium"} />
                  </ListItemIcon>
                  <ListItemText
                    primary={item.label}
                    primaryTypographyProps={{
                      fontSize: menuFontSize,
                      fontWeight: isActive ? 600 : 400,
                      sx: {
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }
                    }}
                  />
                </ListItemButton>
              </ListItem>
            );
          })}
        </List>

        <Divider sx={{ my: 1, mx: 2 }} />

        <List sx={{ px: { xs: 1, sm: 2 }, pb: 2 }}>
          <ListItem disablePadding>
            <ListItemButton
              component={NavLink}
              to="/system"
              onClick={isMobile ? onClose : undefined}
              sx={{
                borderRadius: 1.5,
                py: { xs: 0.75, sm: 1 },
                transition: 'all 0.2s ease',
                '&.active': {
                  backgroundColor: theme.palette.primary.main + '15',
                  color: theme.palette.primary.main,
                },
                '&:hover': {
                  transform: isMobile ? 'none' : 'translateX(4px)',
                },
              }}
            >
              <ListItemIcon sx={{ minWidth: { xs: 36, sm: 40 } }}>
                <Security fontSize={isMobile ? "small" : "medium"} />
              </ListItemIcon>
              <ListItemText
                primary="الأمان والإعدادات"
                primaryTypographyProps={{
                  fontSize: menuFontSize,
                }}
              />
            </ListItemButton>
          </ListItem>
        </List>
      </Box>

      {/* نسخة مبسطة من التذييل للهواتف */}
      {isMobile && (
        <Box
          sx={{
            p: 1,
            textAlign: 'center',
            borderTop: `1px solid ${theme.palette.divider}`,
            backgroundColor: theme.palette.background.paper,
          }}
        >
          <Typography variant="caption" color="textSecondary">
            v1.0.0
          </Typography>
        </Box>
      )}
    </Box>
  );
}