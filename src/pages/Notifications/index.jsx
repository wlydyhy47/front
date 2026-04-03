import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from 'react-query';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Grid,
  FormControlLabel,
  Switch,
  MenuItem,
  Alert,
  Snackbar,
  CircularProgress,
  Card,
  CardContent,
  Chip,
  Divider,
  useTheme,
  useMediaQuery,
  Collapse,
  IconButton,
} from '@mui/material';
import { Send, Refresh, BarChart, FilterList, Close } from '@mui/icons-material';
import { notificationsService, usersService } from '../../api';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useResponsive } from '../../hooks/useResponsive';
import ResponsiveDialog from '../../components/Common/ResponsiveDialog';

const validationSchema = Yup.object({
  title: Yup.string().required('العنوان مطلوب').max(100, 'العنوان طويل جداً'),
  message: Yup.string().required('نص الإشعار مطلوب').max(500, 'النص طويل جداً'),
  type: Yup.string().required('النوع مطلوب'),
  priority: Yup.string(),
});

export default function Notifications() {
  const { isMobile, fontSize, spacing } = useResponsive();
  const queryClient = useQueryClient();
  const [sendToAll, setSendToAll] = useState(false);
  const [selectedUserIds, setSelectedUserIds] = useState([]);
  const [searchUser, setSearchUser] = useState('');
  const [showUserList, setShowUserList] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  
  // جلب المستخدمين
  const { data: usersData, isLoading: usersLoading } = useQuery(
    ['users-for-notifications', searchUser],
    () => usersService.getUsers({ search: searchUser || undefined, limit: 20 }),
    { enabled: !sendToAll }
  );
  
  // إحصائيات الإشعارات
  const { data: statsData, refetch: refetchStats } = useQuery(
    'notifications-stats',
    () => notificationsService.getAllNotificationsStats()
  );
  
  // إرسال إشعار
  const sendMutation = useMutation(
    (data) => notificationsService.sendNotification(data),
    {
      onSuccess: () => {
        setSnackbar({ open: true, message: 'تم إرسال الإشعارات بنجاح', severity: 'success' });
        formik.resetForm();
        setSelectedUserIds([]);
        queryClient.invalidateQueries('notifications-stats');
        refetchStats();
      },
      onError: (error) => {
        setSnackbar({
          open: true,
          message: error.response?.data?.message || 'فشل إرسال الإشعارات',
          severity: 'error',
        });
      },
    }
  );
  
  const formik = useFormik({
    initialValues: {
      title: '',
      message: '',
      type: 'system',
      priority: 'normal',
      link: '',
      icon: '',
    },
    validationSchema,
    onSubmit: (values) => {
      const payload = {
        ...values,
        userIds: sendToAll ? [] : selectedUserIds,
        sendToAll: sendToAll,
      };
      sendMutation.mutate(payload);
    },
  });
  
  const notificationTypes = [
    { value: 'order', label: 'طلب', color: '#2196f3' },
    { value: 'promotion', label: 'عرض ترويجي', color: '#ff9800' },
    { value: 'system', label: 'نظام', color: '#4caf50' },
    { value: 'chat', label: 'دردشة', color: '#9c27b0' },
    { value: 'loyalty', label: 'ولاء', color: '#f44336' },
  ];
  
  const priorities = [
    { value: 'low', label: 'منخفضة', color: '#4caf50' },
    { value: 'normal', label: 'عادية', color: '#2196f3' },
    { value: 'high', label: 'عالية', color: '#ff9800' },
    { value: 'urgent', label: 'طارئة', color: '#f44336' },
  ];
  
  const statsCards = [
    { label: 'إجمالي الإشعارات', value: statsData?.data?.total || 0, color: '#2196f3' },
    { label: 'تم الإرسال', value: statsData?.data?.sent || 0, color: '#4caf50' },
    { label: 'قيد الانتظار', value: statsData?.data?.pending || 0, color: '#ff9800' },
    { label: 'فشل الإرسال', value: statsData?.data?.failed || 0, color: '#f44336' },
  ];
  
  // عرض المستخدمين المختارين
  const renderSelectedUsers = () => {
    if (selectedUserIds.length === 0) return null;
    
    const selectedUsers = usersData?.data?.users?.filter(u => selectedUserIds.includes(u.id)) || [];
    
    return (
      <Box sx={{ mt: 2 }}>
        <Typography variant="caption" color="textSecondary">
          المستخدمين المختارين ({selectedUserIds.length}):
        </Typography>
        <Box display="flex" flexWrap="wrap" gap={0.5} mt={0.5}>
          {selectedUsers.map((user) => (
            <Chip
              key={user.id}
              label={user.name}
              size="small"
              onDelete={() => setSelectedUserIds(selectedUserIds.filter(id => id !== user.id))}
            />
          ))}
        </Box>
      </Box>
    );
  };
  
  return (
    <Box sx={{ p: spacing.page }}>
      <Typography variant="h5" fontWeight="bold" sx={{ mb: spacing.section, fontSize: fontSize.h2 }}>
        إدارة الإشعارات
      </Typography>
      
      <Grid container spacing={spacing.card}>
        {/* نموذج إرسال إشعار */}
        <Grid item xs={12} md={7}>
          <Paper sx={{ p: spacing.card }}>
            <Typography variant="h6" fontWeight="bold" sx={{ mb: 2, fontSize: fontSize.h3 }}>
              إرسال إشعار جديد
            </Typography>
            
            <form onSubmit={formik.handleSubmit}>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    name="title"
                    label="عنوان الإشعار"
                    value={formik.values.title}
                    onChange={formik.handleChange}
                    error={formik.touched.title && Boolean(formik.errors.title)}
                    helperText={formik.touched.title && formik.errors.title}
                    size={isMobile ? "small" : "medium"}
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    name="message"
                    label="نص الإشعار"
                    multiline
                    rows={isMobile ? 3 : 4}
                    value={formik.values.message}
                    onChange={formik.handleChange}
                    error={formik.touched.message && Boolean(formik.errors.message)}
                    helperText={formik.touched.message && formik.errors.message}
                    size={isMobile ? "small" : "medium"}
                  />
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    select
                    name="type"
                    label="نوع الإشعار"
                    value={formik.values.type}
                    onChange={formik.handleChange}
                    size={isMobile ? "small" : "medium"}
                  >
                    {notificationTypes.map((type) => (
                      <MenuItem key={type.value} value={type.value}>
                        <Box display="flex" alignItems="center" gap={1}>
                          <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: type.color }} />
                          {type.label}
                        </Box>
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    select
                    name="priority"
                    label="الأولوية"
                    value={formik.values.priority}
                    onChange={formik.handleChange}
                    size={isMobile ? "small" : "medium"}
                  >
                    {priorities.map((priority) => (
                      <MenuItem key={priority.value} value={priority.value}>
                        <Box display="flex" alignItems="center" gap={1}>
                          <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: priority.color }} />
                          {priority.label}
                        </Box>
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
                
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    name="link"
                    label="رابط (اختياري)"
                    value={formik.values.link}
                    onChange={formik.handleChange}
                    placeholder="https://..."
                    size={isMobile ? "small" : "medium"}
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={sendToAll}
                        onChange={(e) => setSendToAll(e.target.checked)}
                      />
                    }
                    label="إرسال لجميع المستخدمين"
                  />
                </Grid>
                
                {!sendToAll && (
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="البحث عن مستخدمين"
                      value={searchUser}
                      onChange={(e) => setSearchUser(e.target.value)}
                      placeholder="الاسم أو رقم الهاتف..."
                      size={isMobile ? "small" : "medium"}
                      InputProps={{
                        endAdornment: usersLoading && <CircularProgress size={20} />,
                      }}
                    />
                    
                    {searchUser && usersData?.data?.users?.length > 0 && (
                      <Box sx={{ mt: 1, maxHeight: 200, overflow: 'auto' }}>
                        {usersData.data.users.map((user) => (
                          <Card
                            key={user.id}
                            sx={{
                              mb: 1,
                              cursor: 'pointer',
                              bgcolor: selectedUserIds.includes(user.id) ? 'action.selected' : 'background.paper',
                              '&:hover': { bgcolor: 'action.hover' }
                            }}
                            onClick={() => {
                              if (selectedUserIds.includes(user.id)) {
                                setSelectedUserIds(selectedUserIds.filter(id => id !== user.id));
                              } else {
                                setSelectedUserIds([...selectedUserIds, user.id]);
                              }
                            }}
                          >
                            <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                              <Typography variant="body2" fontWeight="bold">{user.name}</Typography>
                              <Typography variant="caption" color="textSecondary">
                                {user.phone} - {user.email}
                              </Typography>
                              <Chip label={user.role} size="small" sx={{ mt: 0.5 }} />
                            </CardContent>
                          </Card>
                        ))}
                      </Box>
                    )}
                    
                    {renderSelectedUsers()}
                  </Grid>
                )}
                
                <Grid item xs={12}>
                  <Button
                    type="submit"
                    variant="contained"
                    startIcon={<Send />}
                    disabled={sendMutation.isLoading}
                    fullWidth
                    size="large"
                    sx={{ py: isMobile ? 1 : 1.5 }}
                  >
                    {sendMutation.isLoading ? <CircularProgress size={24} /> : 'إرسال الإشعار'}
                  </Button>
                </Grid>
              </Grid>
            </form>
          </Paper>
        </Grid>
        
        {/* إحصائيات الإشعارات */}
        <Grid item xs={12} md={5}>
          <Paper sx={{ p: spacing.card }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6" fontWeight="bold" sx={{ fontSize: fontSize.h3 }}>
                إحصائيات الإشعارات
              </Typography>
              <IconButton size="small" onClick={() => refetchStats()}>
                <Refresh fontSize="small" />
              </IconButton>
            </Box>
            
            <Grid container spacing={1.5}>
              {statsCards.map((stat, index) => (
                <Grid item xs={6} key={index}>
                  <Card sx={{ bgcolor: `${stat.color}10` }}>
                    <CardContent sx={{ textAlign: 'center', p: 1.5 }}>
                      <Typography variant={isMobile ? "h5" : "h4"} sx={{ color: stat.color, fontWeight: 'bold' }}>
                        {stat.value}
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        {stat.label}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
            
            <Divider sx={{ my: 2 }} />
            
            <Typography variant="subtitle2" gutterBottom>
              حسب النوع
            </Typography>
            {statsData?.data?.byType?.map((item) => {
              const type = notificationTypes.find(t => t.value === item.type);
              return (
                <Box key={item.type} display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                  <Box display="flex" alignItems="center" gap={1}>
                    <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: type?.color || '#999' }} />
                    <Typography variant="body2">{type?.label || item.type}</Typography>
                  </Box>
                  <Typography variant="body2" fontWeight="bold">
                    {item.count}
                  </Typography>
                </Box>
              );
            })}
            
            <Divider sx={{ my: 2 }} />
            
            <Typography variant="subtitle2" gutterBottom>
              حسب الأولوية
            </Typography>
            {statsData?.data?.byPriority?.map((item) => {
              const priority = priorities.find(p => p.value === item.priority);
              return (
                <Box key={item.priority} display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                  <Box display="flex" alignItems="center" gap={1}>
                    <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: priority?.color || '#999' }} />
                    <Typography variant="body2">{priority?.label || item.priority}</Typography>
                  </Box>
                  <Typography variant="body2" fontWeight="bold">
                    {item.count}
                  </Typography>
                </Box>
              );
            })}
          </Paper>
        </Grid>
      </Grid>
      
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert severity={snackbar.severity}>{snackbar.message}</Alert>
      </Snackbar>
    </Box>
  );
}