import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Button,
  TextField,
  Alert,
  Snackbar,
  CircularProgress,
  Card,
  CardContent,
  Divider,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Tooltip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import {
  Refresh,
  DeleteSweep,
  Speed,
  Security,
  ClearAll,
  PersonOff,
  ExpandMore,
} from '@mui/icons-material';
import { systemService } from '../../api';
import { useResponsive } from '../../hooks/useResponsive';

// ✅ دالة مساعدة لتحويل أي قيمة إلى نص بأمان
const safeString = (value, defaultValue = '0') => {
  if (value === undefined || value === null) return defaultValue;
  if (typeof value === 'string') return value;
  if (typeof value === 'number') return value.toString();
  if (typeof value === 'object') {
    // إذا كان الكائن يحتوي على rss (مثل stats)
    if (value.rss !== undefined) {
      return `${Math.round((value.heapUsed || 0) / 1024 / 1024)} MB`;
    }
    return defaultValue;
  }
  return defaultValue;
};

// ✅ دالة مساعدة لعرض قيمة الذاكرة بأمان
const formatMemory = (value) => {
  if (value === undefined || value === null) return '0 MB';
  if (typeof value === 'string') return value;
  if (typeof value === 'number') return `${value} MB`;
  if (typeof value === 'object') {
    if (value.heapUsed) {
      return `${Math.round(value.heapUsed / 1024 / 1024)} MB`;
    }
    if (value.memoryUsage) {
      return value.memoryUsage;
    }
    return '0 MB';
  }
  return '0 MB';
};

export default function System() {
  const { isMobile, fontSize, spacing } = useResponsive();
  const queryClient = useQueryClient();
  const [clearPattern, setClearPattern] = useState('');
  const [resetUserId, setResetUserId] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  
  // جلب إحصائيات الكاش - مع منع توقف الصفحة عند الخطأ
  const { 
    data: cacheStats, 
    isLoading: cacheLoading, 
    refetch: refetchCache,
    error: cacheError 
  } = useQuery(
    'cache-stats',
    () => systemService.getCacheStats(),
    { 
      refetchInterval: false, // تعطيل التحديث التلقائي لتجنب الأخطاء المتكررة
      retry: false, // عدم إعادة المحاولة
      onError: (err) => {
        console.error('Cache stats error:', err);
      }
    }
  );
  
  // جلب إحصائيات Rate Limit - مع منع توقف الصفحة عند الخطأ
  const { 
    data: rateLimitStats, 
    isLoading: rateLimitLoading, 
    refetch: refetchRateLimit,
    error: rateLimitError
  } = useQuery(
    'rate-limit-stats',
    () => systemService.getRateLimitStats(),
    { 
      retry: false,
      onError: (err) => {
        console.error('Rate limit stats error:', err);
      }
    }
  );
  
  // جلب رؤوس الأمان - مع منع توقف الصفحة عند الخطأ
  const { 
    data: securityHeaders, 
    isLoading: securityLoading,
    error: securityError
  } = useQuery(
    'security-headers',
    () => systemService.getSecurityHeaders(),
    { 
      retry: false,
      onError: (err) => {
        console.error('Security headers error:', err);
      }
    }
  );
  
  const clearCacheMutation = useMutation(
    () => systemService.clearCache(),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('cache-stats');
        setSnackbar({ open: true, message: 'تم مسح الكاش بنجاح', severity: 'success' });
      },
      onError: (error) => {
        setSnackbar({ open: true, message: error.response?.data?.message || 'فشل مسح الكاش', severity: 'error' });
      },
    }
  );
  
  const clearCachePatternMutation = useMutation(
    (pattern) => systemService.clearCacheByPattern(pattern),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('cache-stats');
        setSnackbar({ open: true, message: `تم مسح الكاش للنمط: ${clearPattern}`, severity: 'success' });
        setClearPattern('');
      },
      onError: (error) => {
        setSnackbar({ open: true, message: error.response?.data?.message || 'فشل مسح الكاش', severity: 'error' });
      },
    }
  );
  
  const resetRateLimitMutation = useMutation(
    (userId) => systemService.resetRateLimit(userId),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('rate-limit-stats');
        setSnackbar({ open: true, message: `تم إعادة تعيين حدود المستخدم: ${resetUserId}`, severity: 'success' });
        setResetUserId('');
      },
      onError: (error) => {
        setSnackbar({ open: true, message: error.response?.data?.message || 'فشل إعادة تعيين الحدود', severity: 'error' });
      },
    }
  );
  
  const clearAllRateLimitsMutation = useMutation(
    () => systemService.clearAllRateLimits(),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('rate-limit-stats');
        setSnackbar({ open: true, message: 'تم مسح جميع حدود المعدل', severity: 'success' });
      },
      onError: (error) => {
        setSnackbar({ open: true, message: error.response?.data?.message || 'فشل مسح الحدود', severity: 'error' });
      },
    }
  );
  
  // ✅ الحصول على البيانات بأمان
  const getCacheTotalKeys = () => {
    try {
      const total = cacheStats?.data?.totalKeys;
      if (typeof total === 'number') return total;
      if (typeof total === 'string') return total;
      return 0;
    } catch {
      return 0;
    }
  };
  
  const getCacheMemoryUsage = () => {
    try {
      const memory = cacheStats?.data?.memoryUsage;
      return formatMemory(memory);
    } catch {
      return '0 MB';
    }
  };
  
  const getCacheSections = () => {
    try {
      const sections = cacheStats?.data?.sections;
      if (Array.isArray(sections)) return sections;
      return [];
    } catch {
      return [];
    }
  };
  
  const getRateLimitTotalUsers = () => {
    try {
      const total = rateLimitStats?.data?.totalUsers;
      if (typeof total === 'number') return total;
      return 0;
    } catch {
      return 0;
    }
  };
  
  const getRateLimitBlockedUsers = () => {
    try {
      const blocked = rateLimitStats?.data?.blockedUsers;
      if (typeof blocked === 'number') return blocked;
      return 0;
    } catch {
      return 0;
    }
  };
  
  const getRateLimitTopUsers = () => {
    try {
      const topUsers = rateLimitStats?.data?.topUsers;
      if (Array.isArray(topUsers)) return topUsers;
      return [];
    } catch {
      return [];
    }
  };
  
  // ✅ دالة لعرض رؤوس الأمان بأمان
  const renderSecurityHeaders = () => {
    if (securityLoading) {
      return (
        <Box display="flex" justifyContent="center" py={4}>
          <CircularProgress size={30} />
        </Box>
      );
    }
    
    if (securityError) {
      return (
        <Alert severity="warning" sx={{ m: 2 }}>
          لا يمكن تحميل رؤوس الأمان: {securityError.message}
        </Alert>
      );
    }
    
    try {
      // الحصول على البيانات
      let headersData = securityHeaders?.data || securityHeaders || {};
      
      // إذا كانت البيانات موجودة في response.data
      if (securityHeaders?.data?.data) {
        headersData = securityHeaders.data.data;
      }
      
      // التحقق من أن البيانات موجودة
      if (!headersData || Object.keys(headersData).length === 0) {
        return (
          <Alert severity="info" sx={{ m: 2 }}>
            لا توجد رؤوس أمان متاحة
          </Alert>
        );
      }
      
      // تحويل الكائن إلى مصفوفة
      const headersArray = Object.entries(headersData).map(([key, value]) => ({
        name: key,
        value: typeof value === 'object' ? JSON.stringify(value) : String(value)
      }));
      
      if (headersArray.length === 0) {
        return (
          <Alert severity="info" sx={{ m: 2 }}>
            لا توجد رؤوس أمان متاحة
          </Alert>
        );
      }
      
      return (
        <List dense>
          {headersArray.map((header, index) => (
            <ListItem key={header.name || index} divider>
              <ListItemText
                primary={
                  <Typography variant="body2" fontWeight="bold" component="span">
                    {header.name}
                  </Typography>
                }
                secondary={
                  <Typography 
                    variant="caption" 
                    color="textSecondary" 
                    component="span"
                    sx={{ wordBreak: 'break-all', display: 'block', mt: 0.5 }}
                  >
                    {header.value}
                  </Typography>
                }
              />
            </ListItem>
          ))}
        </List>
      );
    } catch (error) {
      console.error('Error rendering security headers:', error);
      return (
        <Alert severity="warning" sx={{ m: 2 }}>
          حدث خطأ في عرض رؤوس الأمان
        </Alert>
      );
    }
  };
  
  return (
    <Box sx={{ p: spacing.page }}>
      <Typography 
        variant="h5" 
        fontWeight="bold" 
        sx={{ mb: spacing.section, fontSize: fontSize.h2 }}
      >
        إدارة النظام
      </Typography>
      
      <Grid container spacing={spacing.card}>
        {/* إدارة الكاش */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: spacing.card }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography 
                variant="h6" 
                fontWeight="bold" 
                sx={{ fontSize: fontSize.h3, display: 'flex', alignItems: 'center', gap: 1 }}
              >
                <Speed /> إدارة الكاش
              </Typography>
              <Tooltip title="تحديث">
                <IconButton size="small" onClick={() => refetchCache()}>
                  <Refresh fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>
            
            {cacheLoading ? (
              <Box display="flex" justifyContent="center" py={4}>
                <CircularProgress />
              </Box>
            ) : cacheError ? (
              <Alert severity="warning" sx={{ mb: 2 }}>
                خطأ في تحميل بيانات الكاش. يرجى المحاولة مرة أخرى.
              </Alert>
            ) : (
              <>
                <Grid container spacing={1.5} sx={{ mb: 2 }}>
                  <Grid item xs={6}>
                    <Card sx={{ bgcolor: '#2196f310' }}>
                      <CardContent sx={{ textAlign: 'center', p: 1.5 }}>
                        <Typography variant={isMobile ? "h5" : "h4"} color="primary" component="div">
                          {getCacheTotalKeys()}
                        </Typography>
                        <Typography variant="caption" component="div">
                          إجمالي المفاتيح
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={6}>
                    <Card sx={{ bgcolor: '#4caf5010' }}>
                      <CardContent sx={{ textAlign: 'center', p: 1.5 }}>
                        <Typography variant={isMobile ? "h5" : "h4"} color="success.main" component="div">
                          {getCacheMemoryUsage()}
                        </Typography>
                        <Typography variant="caption" component="div">
                          استخدام الذاكرة
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>
                
                {getCacheSections().length > 0 && (
                  <>
                    <Divider sx={{ my: 1.5 }} />
                    <Accordion sx={{ mb: 2 }}>
                      <AccordionSummary expandIcon={<ExpandMore />}>
                        <Typography variant="body2">أقسام الكاش</Typography>
                      </AccordionSummary>
                      <AccordionDetails>
                        {getCacheSections().map((section, idx) => (
                          <Box key={section.name || idx} display="flex" justifyContent="space-between" mb={1}>
                            <Typography variant="body2" component="span">{section.name}</Typography>
                            <Typography variant="body2" fontWeight="bold" component="span">{section.keys} مفتاح</Typography>
                          </Box>
                        ))}
                      </AccordionDetails>
                    </Accordion>
                  </>
                )}
                
                <Button
                  variant="contained"
                  color="error"
                  startIcon={<DeleteSweep />}
                  onClick={() => clearCacheMutation.mutate()}
                  disabled={clearCacheMutation.isLoading}
                  fullWidth
                  sx={{ mb: 1.5 }}
                >
                  {clearCacheMutation.isLoading ? <CircularProgress size={24} /> : 'مسح الكاش بالكامل'}
                </Button>
                
                <Box display="flex" gap={1}>
                  <TextField
                    size="small"
                    placeholder="نمط المسح (مثال: users:*)"
                    value={clearPattern}
                    onChange={(e) => setClearPattern(e.target.value)}
                    fullWidth
                  />
                  <Button
                    variant="outlined"
                    onClick={() => clearCachePatternMutation.mutate(clearPattern)}
                    disabled={!clearPattern || clearCachePatternMutation.isLoading}
                  >
                    مسح
                  </Button>
                </Box>
              </>
            )}
          </Paper>
        </Grid>
        
        {/* إدارة Rate Limit */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: spacing.card }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography 
                variant="h6" 
                fontWeight="bold" 
                sx={{ fontSize: fontSize.h3, display: 'flex', alignItems: 'center', gap: 1 }}
              >
                <Speed /> إدارة معدل الطلبات
              </Typography>
              <Tooltip title="تحديث">
                <IconButton size="small" onClick={() => refetchRateLimit()}>
                  <Refresh fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>
            
            {rateLimitLoading ? (
              <Box display="flex" justifyContent="center" py={4}>
                <CircularProgress />
              </Box>
            ) : rateLimitError ? (
              <Alert severity="warning" sx={{ mb: 2 }}>
                خطأ في تحميل بيانات معدل الطلبات. قد تكون هذه الميزة غير متاحة حالياً.
              </Alert>
            ) : (
              <>
                <Grid container spacing={1.5} sx={{ mb: 2 }}>
                  <Grid item xs={6}>
                    <Card sx={{ bgcolor: '#2196f310' }}>
                      <CardContent sx={{ textAlign: 'center', p: 1.5 }}>
                        <Typography variant={isMobile ? "h5" : "h4"} color="primary" component="div">
                          {getRateLimitTotalUsers()}
                        </Typography>
                        <Typography variant="caption" component="div">
                          إجمالي المستخدمين
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={6}>
                    <Card sx={{ bgcolor: '#ff980010' }}>
                      <CardContent sx={{ textAlign: 'center', p: 1.5 }}>
                        <Typography variant={isMobile ? "h5" : "h4"} color="warning.main" component="div">
                          {getRateLimitBlockedUsers()}
                        </Typography>
                        <Typography variant="caption" component="div">
                          مستخدمين محظورين
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>
                
                {getRateLimitTopUsers().length > 0 && (
                  <>
                    <Divider sx={{ my: 1.5 }} />
                    <Accordion sx={{ mb: 2 }}>
                      <AccordionSummary expandIcon={<ExpandMore />}>
                        <Typography variant="body2">أعلى المستخدمين طلباً</Typography>
                      </AccordionSummary>
                      <AccordionDetails>
                        {getRateLimitTopUsers().slice(0, 5).map((user, idx) => (
                          <Box key={user.userId || idx} display="flex" justifyContent="space-between" mb={1}>
                            <Typography variant="body2" component="span">{user.userId}</Typography>
                            <Typography variant="body2" fontWeight="bold" component="span">{user.requests} طلب</Typography>
                          </Box>
                        ))}
                      </AccordionDetails>
                    </Accordion>
                  </>
                )}
                
                <Box display="flex" gap={1} sx={{ mb: 1.5 }}>
                  <TextField
                    size="small"
                    placeholder="معرف المستخدم"
                    value={resetUserId}
                    onChange={(e) => setResetUserId(e.target.value)}
                    fullWidth
                  />
                  <Button
                    variant="outlined"
                    startIcon={<PersonOff />}
                    onClick={() => resetRateLimitMutation.mutate(resetUserId)}
                    disabled={!resetUserId || resetRateLimitMutation.isLoading}
                  >
                    إعادة تعيين
                  </Button>
                </Box>
                
                <Button
                  variant="contained"
                  color="error"
                  startIcon={<ClearAll />}
                  onClick={() => clearAllRateLimitsMutation.mutate()}
                  disabled={clearAllRateLimitsMutation.isLoading}
                  fullWidth
                >
                  {clearAllRateLimitsMutation.isLoading ? <CircularProgress size={24} /> : 'مسح جميع الحدود'}
                </Button>
              </>
            )}
          </Paper>
        </Grid>
        
        {/* رؤوس الأمان */}
        <Grid item xs={12}>
          <Paper sx={{ p: spacing.card }}>
            <Box display="flex" alignItems="center" gap={1} mb={2}>
              <Security />
              <Typography variant="h6" fontWeight="bold" sx={{ fontSize: fontSize.h3 }}>
                رؤوس الأمان
              </Typography>
            </Box>
            
            {renderSecurityHeaders()}
          </Paper>
        </Grid>
      </Grid>
      
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert 
          onClose={() => setSnackbar({ ...snackbar, open: false })} 
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box> 
  );
}