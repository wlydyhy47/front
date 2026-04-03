import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import {
  Box,
  Button,
  Paper,
  Typography,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Chip,
  Alert,
  Snackbar,
  Grid,
  Card,
  CardContent,
  Avatar,
  useTheme,
  useMediaQuery,
  Collapse,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  Visibility,
  Block,
  CheckCircle,
  Refresh,
  Download,
  Person,
  AdminPanelSettings,
  Storefront,
  DeliveryDining,
  People,
  FilterList,
  Close,
} from '@mui/icons-material';
import { DataGrid } from '@mui/x-data-grid';
import { usersService } from '../../api';
import UserForm from './components/UserForm';
import UserDetails from './components/UserDetails';
import { useDebounce } from '../../hooks/useDebounce';
import { formatDate } from '../../utils/formatters';

const roleConfig = {
  admin: {
    name: 'مشرف',
    color: '#f44336',
    icon: AdminPanelSettings,
    bgColor: '#f4433620',
  },
  vendor: {
    name: 'تاجر',
    color: '#ff9800',
    icon: Storefront,
    bgColor: '#ff980020',
  },
  driver: {
    name: 'مندوب',
    color: '#2196f3',
    icon: DeliveryDining,
    bgColor: '#2196f320',
  },
  client: {
    name: 'عميل',
    color: '#4caf50',
    icon: People,
    bgColor: '#4caf5020',
  },
};

export default function Users() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'));
  const queryClient = useQueryClient();
  
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(isMobile ? 10 : 20);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedUser, setSelectedUser] = useState(null);
  const [openForm, setOpenForm] = useState(false);
  const [openDetails, setOpenDetails] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const debouncedSearch = useDebounce(search, 500);

  const { data, isLoading, refetch, isFetching } = useQuery(
    ['users', page, pageSize, debouncedSearch, roleFilter, statusFilter],
    () => usersService.getUsers({
      page: page + 1,
      limit: pageSize,
      search: debouncedSearch || undefined,
      role: roleFilter !== 'all' ? roleFilter : undefined,
      isActive: statusFilter !== 'all' ? statusFilter === 'active' : undefined,
    }),
    {
      onSuccess: (response) => {
        console.log('✅ Users data received:', response);
      },
    }
  );

  const users = data?.data || [];
  const pagination = data?.pagination || {};
  const totalCount = pagination?.total || 0;
  const stats = data?.stats || {};

  const deleteMutation = useMutation(
    (id) => usersService.deleteUser(id),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('users');
        setOpenDeleteDialog(false);
        setSnackbar({ open: true, message: 'تم حذف المستخدم بنجاح', severity: 'success' });
      },
    }
  );

  const toggleStatusMutation = useMutation(
    ({ id, isActive }) => usersService.updateUser(id, { isActive: !isActive }),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('users');
        setSnackbar({ open: true, message: 'تم تغيير حالة المستخدم بنجاح', severity: 'success' });
      },
    }
  );

  const handleViewDetails = (user) => {
    setSelectedUser(user);
    setOpenDetails(true);
  };

  const handleEdit = (user) => {
    setSelectedUser(user);
    setOpenForm(true);
  };

  const handleDelete = (user) => {
    setSelectedUser(user);
    setOpenDeleteDialog(true);
  };

  const handleToggleStatus = (user) => {
    toggleStatusMutation.mutate({ id: user._id, isActive: user.isActive });
  };

  const confirmDelete = () => {
    if (selectedUser) {
      deleteMutation.mutate(selectedUser._id);
    }
  };

  const totalUsers = stats?.total || 0;
  const activeUsers = stats?.active || 0;
  const verifiedUsers = stats?.verified || 0;
  const byRole = stats?.byRole || [];

  // عرض بطاقات للهواتف
  const renderMobileUsers = () => {
    if (isLoading) {
      return (
        <Box textAlign="center" py={4}>
          <CircularProgress />
        </Box>
      );
    }

    return (
      <List sx={{ width: '100%' }}>
        {users.map((user) => (
          <Card key={user._id} sx={{ mb: 1.5, p: 1.5 }}>
            <Box display="flex" alignItems="center" gap={2}>
              <Avatar src={user.image} sx={{ width: 48, height: 48 }}>
                {user.name?.charAt(0)}
              </Avatar>
              <Box flex={1}>
                <Box display="flex" alignItems="center" gap={1} flexWrap="wrap">
                  <Typography variant="subtitle2" fontWeight="bold">
                    {user.name}
                  </Typography>
                  {user.isVerified && (
                    <CheckCircle sx={{ fontSize: 14, color: '#4caf50' }} />
                  )}
                </Box>
                <Typography variant="caption" color="textSecondary" display="block">
                  {user.phone}
                </Typography>
                <Typography variant="caption" color="textSecondary" display="block">
                  {user.email}
                </Typography>
                <Box display="flex" gap={1} mt={1} flexWrap="wrap">
                  <Chip
                    icon={React.createElement(roleConfig[user.role]?.icon || Person)}
                    label={roleConfig[user.role]?.name || user.role}
                    size="small"
                    sx={{
                      backgroundColor: roleConfig[user.role]?.bgColor,
                      color: roleConfig[user.role]?.color,
                    }}
                  />
                  <Chip
                    label={user.isActive ? 'نشط' : 'غير نشط'}
                    size="small"
                    color={user.isActive ? 'success' : 'error'}
                    variant="outlined"
                  />
                </Box>
              </Box>
              <Box>
                <IconButton size="small" onClick={() => handleViewDetails(user)}>
                  <Visibility fontSize="small" />
                </IconButton>
                <IconButton size="small" onClick={() => handleEdit(user)}>
                  <Edit fontSize="small" />
                </IconButton>
                <IconButton size="small" onClick={() => handleToggleStatus(user)}>
                  {user.isActive ? <Block fontSize="small" /> : <CheckCircle fontSize="small" />}
                </IconButton>
              </Box>
            </Box>
          </Card>
        ))}
      </List>
    );
  };

  return (
    <Box 
      dir="rtl" 
      sx={{ 
        p: { xs: 1.5, sm: 2, md: 3 },
        width: '100%',
        overflowX: 'hidden',
      }}
    >
      {/* بطاقات الإحصائيات */}
      <Grid container spacing={isMobile ? 1.5 : 2} sx={{ mb: 3 }}>
        <Grid item xs={6} sm={6} md={3}>
          <Card sx={{ bgcolor: '#1976d210', borderRight: '4px solid #1976d2' }}>
            <CardContent sx={{ p: { xs: 1.5, sm: 2 } }}>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    إجمالي المستخدمين
                  </Typography>
                  <Typography variant={isMobile ? "h5" : "h4"} fontWeight="bold">
                    {totalUsers}
                  </Typography>
                </Box>
                <People sx={{ fontSize: { xs: 32, sm: 48 }, color: '#1976d2', opacity: 0.5 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={6} md={3}>
          <Card sx={{ bgcolor: '#4caf5010', borderRight: '4px solid #4caf50' }}>
            <CardContent sx={{ p: { xs: 1.5, sm: 2 } }}>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    المستخدمين النشطين
                  </Typography>
                  <Typography variant={isMobile ? "h5" : "h4"} fontWeight="bold" color="success.main">
                    {activeUsers}
                  </Typography>
                </Box>
                <CheckCircle sx={{ fontSize: { xs: 32, sm: 48 }, color: '#4caf50', opacity: 0.5 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={6} md={3}>
          <Card sx={{ bgcolor: '#ff980010', borderRight: '4px solid #ff9800' }}>
            <CardContent sx={{ p: { xs: 1.5, sm: 2 } }}>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    المستخدمين الموثقين
                  </Typography>
                  <Typography variant={isMobile ? "h5" : "h4"} fontWeight="bold" color="warning.main">
                    {verifiedUsers}
                  </Typography>
                </Box>
                <AdminPanelSettings sx={{ fontSize: { xs: 32, sm: 48 }, color: '#ff9800', opacity: 0.5 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={6} md={3}>
          <Card sx={{ bgcolor: '#9c27b010', borderRight: '4px solid #9c27b0' }}>
            <CardContent sx={{ p: { xs: 1.5, sm: 2 } }}>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    الأدوار المتاحة
                  </Typography>
                  <Typography variant={isMobile ? "h5" : "h4"} fontWeight="bold" color="secondary.main">
                    {byRole.length}
                  </Typography>
                </Box>
                <Person sx={{ fontSize: { xs: 32, sm: 48 }, color: '#9c27b0', opacity: 0.5 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Paper sx={{ p: { xs: 1.5, sm: 2 } }}>
        {/* شريط العنوان والأزرار */}
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2} flexWrap="wrap" gap={1}>
          <Typography variant={isMobile ? "h6" : "h5"} fontWeight="bold">
            إدارة المستخدمين
          </Typography>
          <Box display="flex" gap={1} flexWrap="wrap">
            {isMobile && (
              <Button
                variant="outlined"
                startIcon={<FilterList />}
                onClick={() => setShowFilters(!showFilters)}
                size="small"
              >
                فلتر
              </Button>
            )}
            <Button
              variant="outlined"
              startIcon={<Refresh />}
              onClick={() => refetch()}
              size="small"
              disabled={isFetching}
            >
              تحديث
            </Button>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => {
                setSelectedUser(null);
                setOpenForm(true);
              }}
              size="small"
            >
              {isMobile ? 'جديد' : 'مستخدم جديد'}
            </Button>
          </Box>
        </Box>

        {/* فلاتر البحث */}
        <Collapse in={!isMobile || showFilters}>
          <Box mb={2}>
            <Grid container spacing={1.5}>
              <Grid item xs={12} sm={12} md={4}>
                <TextField
                  fullWidth
                  label="بحث"
                  size="small"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="بحث بالاسم أو البريد أو رقم الهاتف..."
                  InputProps={{
                    startAdornment: <Person sx={{ mr: 1, color: 'text.secondary' }} fontSize="small" />,
                  }}
                />
              </Grid>
              <Grid item xs={6} sm={6} md={3}>
                <TextField
                  fullWidth
                  select
                  label="الدور"
                  size="small"
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                >
                  <MenuItem value="all">الكل</MenuItem>
                  {Object.entries(roleConfig).map(([key, config]) => (
                    <MenuItem key={key} value={key}>
                      <Box display="flex" alignItems="center" gap={1}>
                        <config.icon fontSize="small" sx={{ color: config.color }} />
                        {config.name}
                      </Box>
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={6} sm={6} md={3}>
                <TextField
                  fullWidth
                  select
                  label="الحالة"
                  size="small"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <MenuItem value="all">الكل</MenuItem>
                  <MenuItem value="active">نشط</MenuItem>
                  <MenuItem value="inactive">غير نشط</MenuItem>
                </TextField>
              </Grid>
              {isMobile && (
                <Grid item xs={12}>
                  <Button
                    fullWidth
                    variant="outlined"
                    onClick={() => {
                      setSearch('');
                      setRoleFilter('all');
                      setStatusFilter('all');
                      setShowFilters(false);
                    }}
                    size="small"
                  >
                    مسح الفلترة
                  </Button>
                </Grid>
              )}
            </Grid>
          </Box>
        </Collapse>

        {/* عرض حسب نوع الجهاز */}
        {isMobile ? (
          renderMobileUsers()
        ) : (
          <DataGrid
            rows={users}
            columns={[
              { field: 'name', headerName: 'الاسم', width: 180 },
              { field: 'phone', headerName: 'رقم الهاتف', width: 150 },
              { field: 'email', headerName: 'البريد الإلكتروني', width: 200 },
              { field: 'role', headerName: 'الدور', width: 120 },
              { field: 'isActive', headerName: 'الحالة', width: 100 },
              { field: 'createdAt', headerName: 'تاريخ التسجيل', width: 180 },
              { field: 'actions', headerName: 'الإجراءات', width: 200 },
            ]}
            loading={isLoading}
            rowCount={totalCount}
            paginationMode="server"
            page={page}
            pageSize={pageSize}
            onPageChange={(newPage) => setPage(newPage)}
            onPageSizeChange={(newSize) => setPageSize(newSize)}
            rowsPerPageOptions={[10, 20, 50, 100]}
            autoHeight
            disableSelectionOnClick
            getRowId={(row) => row._id}
          />
        )}

        {/* ترقيم الصفحات للهواتف */}
        {isMobile && totalCount > pageSize && (
          <Box display="flex" justifyContent="center" mt={2}>
            <Button
              variant="outlined"
              onClick={() => setPage(page - 1)}
              disabled={page === 0}
              size="small"
              sx={{ mx: 0.5 }}
            >
              السابق
            </Button>
            <Typography variant="body2" sx={{ mx: 1, alignSelf: 'center' }}>
              صفحة {page + 1} من {Math.ceil(totalCount / pageSize)}
            </Typography>
            <Button
              variant="outlined"
              onClick={() => setPage(page + 1)}
              disabled={(page + 1) * pageSize >= totalCount}
              size="small"
              sx={{ mx: 0.5 }}
            >
              التالي
            </Button>
          </Box>
        )}
      </Paper>

      {/* باقي الحوارات كما هي */}
      <Dialog open={openForm} onClose={() => setOpenForm(false)} maxWidth="md" fullWidth>
        <DialogTitle>{selectedUser ? 'تعديل مستخدم' : 'إضافة مستخدم جديد'}</DialogTitle>
        <DialogContent>
          <UserForm
            user={selectedUser}
            onSuccess={() => {
              setOpenForm(false);
              queryClient.invalidateQueries('users');
              setSnackbar({ open: true, message: selectedUser ? 'تم تحديث المستخدم' : 'تم إضافة المستخدم', severity: 'success' });
            }}
            onCancel={() => setOpenForm(false)}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={openDetails} onClose={() => setOpenDetails(false)} maxWidth="md" fullWidth>
        <DialogTitle>تفاصيل المستخدم</DialogTitle>
        <DialogContent dividers>
          {selectedUser && <UserDetails user={selectedUser} />}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDetails(false)}>إغلاق</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={openDeleteDialog} onClose={() => setOpenDeleteDialog(false)}>
        <DialogTitle>تأكيد الحذف</DialogTitle>
        <DialogContent>
          <Typography>هل أنت متأكد من حذف المستخدم "{selectedUser?.name}"؟</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDeleteDialog(false)}>إلغاء</Button>
          <Button onClick={confirmDelete} color="error" variant="contained">حذف</Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={() => setSnackbar({ ...snackbar, open: false })}>
        <Alert severity={snackbar.severity}>{snackbar.message}</Alert>
      </Snackbar>
    </Box>
  );
}

import { CircularProgress } from '@mui/material';