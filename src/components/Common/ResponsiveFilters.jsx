// src/components/Common/ResponsiveFilters.jsx - نسخة مصححة

import { useState } from 'react';
import { 
  Box, 
  Button, 
  Collapse, 
  Grid, 
  IconButton, 
  useTheme, 
  useMediaQuery,
  Paper,
  Typography,
} from '@mui/material';
import { FilterList, Close } from '@mui/icons-material';
import { memo } from 'react';

const ResponsiveFilters = memo(({ 
  children, 
  onReset, 
  title = 'الفلاتر',
  showResetButton = true,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [showFilters, setShowFilters] = useState(false);

  if (isMobile) {
    return (
      <Box mb={2}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
          <Button
            variant="outlined"
            startIcon={<FilterList />}
            onClick={() => setShowFilters(!showFilters)}
            size="small"
            fullWidth
          >
            {showFilters ? 'إخفاء الفلاتر' : 'إظهار الفلاتر'}
          </Button>
        </Box>
        
        <Collapse in={showFilters}>
          <Paper sx={{ p: 2, mb: 2 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="subtitle2">{title}</Typography>
              <IconButton size="small" onClick={() => setShowFilters(false)}>
                <Close fontSize="small" />
              </IconButton>
            </Box>
            {children}
            {showResetButton && onReset && (
              <Button
                fullWidth
                variant="outlined"
                onClick={onReset}
                size="small"
                sx={{ mt: 2 }}
              >
                مسح الكل
              </Button>
            )}
          </Paper>
        </Collapse>
      </Box>
    );
  }

  return (
    <Box mb={3}>
      <Grid container spacing={2} alignItems="flex-end">
        {children}
        {showResetButton && onReset && (
          <Grid item xs={12} sm={6} md={2}>
            <Button
              fullWidth
              variant="outlined"
              onClick={onReset}
              sx={{ height: '40px' }}
            >
              مسح الكل
            </Button>
          </Grid>
        )}
      </Grid>
    </Box>
  );
});

ResponsiveFilters.displayName = 'ResponsiveFilters';

export default ResponsiveFilters;