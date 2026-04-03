import { Outlet } from 'react-router-dom';
import { Box, AppBar, Toolbar, IconButton, Typography, Drawer, useTheme, useMediaQuery } from '@mui/material';
import { Menu as MenuIcon, Logout, DarkMode, LightMode } from '@mui/icons-material';
import { useState } from 'react';
import Sidebar from './Sidebar';
import { useAuth } from '../../context/AuthContext';
import { useThemeContext } from '../../context/ThemeContext';

const drawerWidth = 280;
const miniDrawerWidth = 72; // عرض القائمة المصغرة للهواتف

export default function MainLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const theme = useTheme();
  // ✅ توحيد نقطة التوقف - استخدام نفس النقطة في جميع المكونات
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { user, logout } = useAuth();
  const { mode, toggleTheme } = useThemeContext();

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      {/* App Bar */}
      <AppBar
        position="fixed"
        sx={{
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` },
          backgroundColor: theme.palette.background.paper,
          color: theme.palette.text.primary,
          boxShadow: 1,
          transition: theme.transitions.create(['width', 'margin'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
          }),
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          
          <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 500 }}>
            Food Delivery Admin
          </Typography>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, sm: 2 } }}>
            <IconButton color="inherit" onClick={toggleTheme} size="small">
              {mode === 'dark' ? <LightMode /> : <DarkMode />}
            </IconButton>
            
            <Typography 
              variant="body2" 
              sx={{ 
                display: { xs: 'none', sm: 'block' },
                fontWeight: 500,
              }}
            >
              {user?.name || 'Admin'}
            </Typography>
            
            <IconButton color="inherit" onClick={logout} size="small">
              <Logout />
            </IconButton>
          </Box>
        </Toolbar>
      </AppBar>
      
      {/* Sidebar Drawer */}
      <Box
        component="nav"
        sx={{ 
          width: { sm: drawerWidth },
          flexShrink: { sm: 0 },
        }}
      >
        {/* للهواتف - Drawer مؤقت */}
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': {
              width: drawerWidth,
              boxSizing: 'border-box',
              backgroundColor: theme.palette.background.default,
              borderRight: `1px solid ${theme.palette.divider}`,
              overflowX: 'hidden',
            },
          }}
        >
          <Sidebar onClose={handleDrawerToggle} />
        </Drawer>
        
        {/* للشاشات الكبيرة - Drawer دائم */}
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': {
              width: drawerWidth,
              boxSizing: 'border-box',
              backgroundColor: theme.palette.background.default,
              borderRight: `1px solid ${theme.palette.divider}`,
              overflowX: 'hidden',
              transition: theme.transitions.create('width', {
                easing: theme.transitions.easing.sharp,
                duration: theme.transitions.duration.enteringScreen,
              }),
            },
          }}
          open
        >
          <Sidebar />
        </Drawer>
      </Box>
      
      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: { xs: 2, sm: 3 },
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          mt: '64px',
          backgroundColor: theme.palette.background.default,
          minHeight: 'calc(100vh - 64px)',
          transition: theme.transitions.create('margin', {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
          }),
        }}
      >
        <Outlet />
      </Box>
    </Box>
  );
}