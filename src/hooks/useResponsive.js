import { useTheme, useMediaQuery } from '@mui/material';

/**
 * هوك للتحقق من حجم الشاشة بسهولة
 */
export function useResponsive() {
  const theme = useTheme();
  
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'));
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'));
  const isLargeDesktop = useMediaQuery(theme.breakpoints.up('lg'));
  
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('md'));
  const isMediumScreen = useMediaQuery(theme.breakpoints.between('md', 'lg'));
  const isLargeScreen = useMediaQuery(theme.breakpoints.up('lg'));

  return {
    isMobile,
    isTablet,
    isDesktop,
    isLargeDesktop,
    isSmallScreen,
    isMediumScreen,
    isLargeScreen,
    // حجم الخط المناسب
    fontSize: {
      h1: isMobile ? '1.5rem' : isTablet ? '1.75rem' : '2rem',
      h2: isMobile ? '1.25rem' : isTablet ? '1.5rem' : '1.75rem',
      h3: isMobile ? '1.1rem' : isTablet ? '1.25rem' : '1.5rem',
      body: isMobile ? '0.875rem' : '1rem',
      caption: isMobile ? '0.7rem' : '0.75rem',
    },
    // المسافات المناسبة
    spacing: {
      page: isMobile ? 1.5 : isTablet ? 2 : 3,
      card: isMobile ? 1.5 : 2,
      section: isMobile ? 2 : 3,
    },
    // حجم الصفوف في الجداول
    tableSize: isMobile ? 'small' : isTablet ? 'small' : 'medium',
    // عدد الأعمدة في الشبكة
    gridColumns: {
      stats: isMobile ? 2 : isTablet ? 2 : 4,
      list: isMobile ? 1 : isTablet ? 2 : 3,
      form: isMobile ? 1 : 2,
    },
  };
}