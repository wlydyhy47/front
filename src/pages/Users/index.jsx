// src/pages/Users/index.jsx - نسخة كاملة مع _id

import React, { useState, useCallback, useMemo } from 'react';
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
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  Visibility,
  Block,
  CheckCircle,
  Refresh,
  Person,
  AdminPanelSettings,
  Storefront,
  DeliveryDining,
  People,
  FilterList,
} from '@mui/icons-material';
import { usersService } from '../../api';
import UserForm from './components/UserForm';
import UserDetails from './components/UserDetails';
import { useDebounce } from '../../hooks/useDebounce';
import { formatDate } from '../../utils/formatters';
import { getId, getReactKey } from '../../utils/helpers';

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
  const [rowsPerPage, setRowsPerPage] = useState(isMobile ? 10 : 20);
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
    ['users', page, rowsPerPage, debouncedSearch, roleFilter, statusFilter],
    () => usersService.getUsers({
      page: page + 1,
      limit: rowsPerPage,
      search: debouncedSearch || undefined,
      role: roleFilter !== 'all' ? roleFilter : undefined,
      isActive: statusFilter !== 'all' ? statusFilter === 'active' : undefined,
    }),
    {
      keepPreviousData: true,
    }
  );

  const users = data?.data || [];
  const totalCount = data?.pagination?.total || 0;
  const stats = data?.stats || {};

  const deleteMutation = useMutation(
    (userId) => usersService.deleteUser(userId),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('users');
        setOpenDeleteDialog(false);
        setSnackbar({ open: true, message: 'تم حذف المستخدم بنجاح', severity: 'success' });
      },
      onError: (error) => {
        setSnackbar({ open: true, message: error.response?.data?.message || 'فشل حذف المستخدم', severity: 'error' });
      },
    }
  );

  const toggleStatusMutation = useMutation(
    ({ userId, isActive }) => usersService.updateUser(userId, { isActive: !isActive }),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('users');
        setSnackbar({ open: true, message: 'تم تغيير حالة المستخدم بنجاح', severity: 'success' });
      },
      onError: (error) => {
        setSnackbar({ open: true, message: error.response?.data?.message || 'فشل تغيير الحالة', severity: 'error' });
      },
    }
  );

  const handleViewDetails = useCallback((user) => {
    setSelectedUser(user);
    setOpenDetails(true);
  }, []);

  const handleEdit = useCallback((user) => {
    setSelectedUser(user);
    setOpenForm(true);
  }, []);

  const handleDelete = useCallback((user) => {
    setSelectedUser(user);
    setOpenDeleteDialog(true);
  }, []);

  const handleToggleStatus = useCallback((user) => {
    toggleStatusMutation.mutate({ userId: user._id, isActive: user.isActive });
  }, [toggleStatusMutation]);

  const confirmDelete = useCallback(() => {
    if (selectedUser) {
      deleteMutation.mutate(selectedUser._id);
    }
  }, [selectedUser, deleteMutation]);

  const handleChangePage = useCallback((event, newPage) => {
    setPage(newPage);
  }, []);

  const handleChangeRowsPerPage = useCallback((event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  }, []);

  const resetFilters = useCallback(() => {
    setSearch('');
    setRoleFilter('all');
    setStatusFilter('all');
    setShowFilters(false);
  }, []);

  const statsCards = useMemo(() => [
    { label: 'إجمالي المستخدمين', value: stats?.total || 0, color: '#1976d2', icon: People },
    { label: 'مستخدمين نشطين', value: stats?.active || 0, color: '#4caf50', icon: CheckCircle },
    { label: 'مستخدمين موثقين', value: stats?.verified || 0, color: '#ff9800', icon: AdminPanelSettings },
    { label: 'الأدوار المتاحة', value: stats?.byRole?.length || 0, color: '#9c27b0', icon: Person },
  ], [stats]);

  const renderDesktopTable = () => {
    if (isLoading) {
      return (
        <Box display="flex" justifyContent="center" py={4}>
          <CircularProgress />
        </Box>
      );
    }

    return (
      <>
        <TableContainer>
          <Table size={isTablet ? "small" : "medium"}>
            <TableHead>
              <TableRow>
                <TableCell>الاسم</TableCell>
                <TableCell>رقم الهاتف</TableCell>
                {!isTablet && <TableCell>البريد الإلكتروني</TableCell>}
                <TableCell>الدور</TableCell>
                <TableCell>الحالة</TableCell>
                {!isTablet && <TableCell>تاريخ التسجيل</TableCell>}
                <TableCell align="center">الإجراءات</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {users.map((user, index) => {
                const RoleIcon = roleConfig[user.role]?.icon || Person;
                return (
                  <TableRow key={getReactKey(user, index)} hover>
                    <TableCell>
                      <Box display="flex" alignItems="center" gap={1}>
                        <Avatar src={user.image} sx={{ width: 32, height: 32 }}>
                          {user.name?.charAt(0)}
                        </Avatar>
                        <Typography variant="body2" fontWeight="medium">
                          {user.name}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>{user.phone}</TableCell>
                    {!isTablet && <TableCell>{user.email || '-'}</TableCell>}
                    <TableCell>
                      <Chip
                        icon={<RoleIcon />}
                        label={roleConfig[user.role]?.name || user.role}
                        size="small"
                        sx={{
                          backgroundColor: roleConfig[user.role]?.bgColor,
                          color: roleConfig[user.role]?.color,
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={user.isActive ? 'نشط' : 'غير نشط'}
                        size="small"
                        color={user.isActive ? 'success' : 'error'}
                        variant="outlined"
                      />
                    </TableCell>
                    {!isTablet && <TableCell>{formatDate(user.createdAt)}</TableCell>}
                    <TableCell align="center">
                      <Box display="flex" justifyContent="center" gap={0.5}>
                        <Tooltip title="عرض التفاصيل">
                          <IconButton size="small" onClick={() => handleViewDetails(user)}>
                            <Visibility fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="تعديل">
                          <IconButton size="small" onClick={() => handleEdit(user)}>
                            <Edit fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title={user.isActive ? 'تعطيل' : 'تفعيل'}>
                          <IconButton size="small" onClick={() => handleToggleStatus(user)}>
                            {user.isActive ? <Block fontSize="small" /> : <CheckCircle fontSize="small" />}
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="حذف">
                          <IconButton size="small" onClick={() => handleDelete(user)} color="error">
                            <Delete fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
        
        <TablePagination
          rowsPerPageOptions={[10, 20, 50, 100]}
          component="div"
          count={totalCount}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          labelRowsPerPage="عدد الصفوف في الصفحة:"
          labelDisplayedRows={({ from, to, count }) => `${from}-${to} من ${count}`}
        />
      </>
    );
  };

  const renderMobileCards = () => {
    if (isLoading) {
      return (
        <Box textAlign="center" py={4}>
          <CircularProgress />
        </Box>
      );
    }

    if (users.length === 0) {
      return (
        <Alert severity="info" sx={{ mt: 2 }}>
          لا توجد مستخدمين
        </Alert>
      );
    }

    return (
      <List sx={{ width: '100%', p: 0 }}>
        {users.map((user, index) => {
          const RoleIcon = roleConfig[user.role]?.icon || Person;
          return (
            <Card key={getReactKey(user, index)} sx={{ mb: 2, p: 1.5 }}>
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
                      icon={<RoleIcon />}
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
              </Box>
              
              <Box 
                display="flex" 
                justifyContent="space-between" 
                alignItems="center" 
                mt={2} 
                pt={1} 
                borderTop="1px solid" 
                borderColor="divider"
              >
                <Box display="flex" gap={0.5}>
                  <Tooltip title="عرض التفاصيل">
                    <IconButton size="small" onClick={() => handleViewDetails(user)}>
                      <Visibility fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="تعديل">
                    <IconButton size="small" onClick={() => handleEdit(user)}>
                      <Edit fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title={user.isActive ? 'تعطيل' : 'تفعيل'}>
                    <IconButton size="small" onClick={() => handleToggleStatus(user)}>
                      {user.isActive ? <Block fontSize="small" /> : <CheckCircle fontSize="small" />}
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="حذف">
                    <IconButton size="small" onClick={() => handleDelete(user)} color="error">
                      <Delete fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Box>
                <Typography variant="caption" color="textSecondary">
                  {formatDate(user.createdAt, 'yyyy-MM-dd')}
                </Typography>
              </Box>
            </Card>
          );
        })}
        
        {totalCount > rowsPerPage && (
          <Box display="flex" justifyContent="center" alignItems="center" mt={2} gap={2}>
            <Button
              variant="outlined"
              onClick={() => setPage(page - 1)}
              disabled={page === 0}
              size="small"
            >
              السابق
            </Button>
            <Typography variant="body2">
              صفحة {page + 1} من {Math.ceil(totalCount / rowsPerPage)}
            </Typography>
            <Button
              variant="outlined"
              onClick={() => setPage(page + 1)}
              disabled={(page + 1) * rowsPerPage >= totalCount}
              size="small"
            >
              التالي
            </Button>
          </Box>
        )}
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
      <Grid container spacing={isMobile ? 1.5 : 2} sx={{ mb: 3 }}>
        {statsCards.map((stat, index) => (
          <Grid item xs={6} sm={6} md={3} key={index}>
            <Card sx={{ bgcolor: `${stat.color}10`, borderRight: `4px solid ${stat.color}` }}>
              <CardContent sx={{ p: { xs: 1.5, sm: 2 } }}>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      {stat.label}
                    </Typography>
                    <Typography variant={isMobile ? "h5" : "h4"} fontWeight="bold" sx={{ color: stat.color }}>
                      {typeof stat.value === 'number' ? stat.value.toLocaleString() : stat.value}
                    </Typography>
                  </Box>
                  <stat.icon sx={{ fontSize: { xs: 32, sm: 48 }, color: stat.color, opacity: 0.5 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Paper sx={{ p: { xs: 1.5, sm: 2 } }}>
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
                {showFilters ? 'إخفاء الفلتر' : 'فلتر'}
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
                    onClick={resetFilters}
                    size="small"
                  >
                    مسح الفلترة
                  </Button>
                </Grid>
              )}
            </Grid>
          </Box>
        </Collapse>

        {isMobile ? renderMobileCards() : renderDesktopTable()}
      </Paper>

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
          <Button onClick={confirmDelete} color="error" variant="contained">
            حذف
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar 
        open={snackbar.open} 
        autoHideDuration={6000} 
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
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