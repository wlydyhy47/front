import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import {
  Box,
  Paper,
  Typography,
  TextField,
  MenuItem,
  Button,
  Chip,
  IconButton,
  Tooltip,
  Grid,
  Card,
  CardContent,
  Rating,
  Alert,
  Snackbar,
  Avatar,
} from '@mui/material';
import {
  Edit,
  Delete,
  Visibility,
  Add,
  Refresh,
  Download,
  Inventory,
  ToggleOn,
  ToggleOff,
  Star,
} from '@mui/icons-material';
import { productsService, storesService } from '../../api';
import ResponsiveTable from '../../components/Common/ResponsiveTable';
import ResponsiveStatsCards from '../../components/Common/ResponsiveStatsCards';
import ResponsiveFilters from '../../components/Common/ResponsiveFilters';
import ResponsiveDialog from '../../components/Common/ResponsiveDialog';
import { useResponsive } from '../../hooks/useResponsive';
import ProductForm from './components/ProductForm';
import ProductInventory from './components/ProductInventory';
import { formatCurrency, formatDate } from '../../utils/formatters';

export default function Products() {
  const { isMobile, fontSize, spacing, gridColumns } = useResponsive();
  const queryClient = useQueryClient();
  
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(isMobile ? 10 : 20);
  const [filters, setFilters] = useState({
    search: '',
    category: 'all',
    store: 'all',
    availability: 'all',
  });
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [openForm, setOpenForm] = useState(false);
  const [openDetails, setOpenDetails] = useState(false);
  const [openInventory, setOpenInventory] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  // جلب المنتجات
  const { data, isLoading, refetch, isFetching } = useQuery(
    ['products', page, pageSize, filters],
    () => productsService.getProducts({
      page: page + 1,
      limit: pageSize,
      search: filters.search || undefined,
      category: filters.category !== 'all' ? filters.category : undefined,
      store: filters.store !== 'all' ? filters.store : undefined,
      isAvailable: filters.availability !== 'all' ? filters.availability === 'available' : undefined,
    })
  );

  // جلب المتاجر للفلتر
  const { data: storesData } = useQuery('stores-list', () => storesService.getStores({ limit: 100 }));

  const products = data?.data || [];
  const totalCount = data?.pagination?.total || 0;
  const stats = data?.stats || {};

  // حذف منتج
  const deleteMutation = useMutation(
    (id) => productsService.deleteProduct(id),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('products');
        setOpenDeleteDialog(false);
        setSnackbar({ open: true, message: 'تم حذف المنتج بنجاح', severity: 'success' });
      },
    }
  );

  // تغيير حالة التوفر
  const toggleAvailabilityMutation = useMutation(
    (id) => productsService.toggleAvailability(id),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('products');
        setSnackbar({ open: true, message: 'تم تغيير حالة توفر المنتج', severity: 'success' });
      },
    }
  );

  // تمييز منتج
  const featureProductMutation = useMutation(
    ({ id, featured }) => productsService.featureProduct(id, { featured }),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('products');
        setSnackbar({ open: true, message: 'تم تحديث حالة التمييز', severity: 'success' });
      },
    }
  );

  // إحصائيات المنتجات
  const statsCards = [
    { title: 'إجمالي المنتجات', value: stats.total || 0, icon: Add, color: '#2196f3' },
    { title: 'منتجات متاحة', value: stats.available || 0, icon: ToggleOn, color: '#4caf50' },
    { title: 'مخزون منخفض', value: stats.lowStock || 0, icon: Inventory, color: '#ff9800' },
    { title: 'منتجات مميزة', value: stats.featured || 0, icon: Star, color: '#9c27b0' },
  ];

  // أعمدة الجدول - تم إصلاحها
  const columns = [
    {
      field: 'image',
      headerName: 'الصورة',
      width: 80,
      renderCell: (params) => {
        const imageUrl = params.row.image || '/placeholder-product.jpg';
        return (
          <Avatar 
            src={imageUrl} 
            sx={{ width: 40, height: 40, borderRadius: 1 }}
          >
            {params.row.name?.charAt(0) || 'P'}
          </Avatar>
        );
      },
    },
    { 
      field: 'name', 
      headerName: 'اسم المنتج', 
      width: 180,
      renderCell: (params) => params.row.name || 'بدون اسم'
    },
    { 
      field: 'store', 
      headerName: 'المتجر', 
      width: 150,
      renderCell: (params) => {
        // التعامل مع两种情况: إذا كان store كائنًا أو إذا كان storeId فقط
        if (params.row.store && typeof params.row.store === 'object') {
          return params.row.store.name || 'غير محدد';
        }
        if (params.row.storeId) {
          // إذا كان لديك storeId فقط، حاول البحث عن اسم المتجر من storesData
          const store = storesData?.data?.find(s => s._id === params.row.storeId);
          return store?.name || params.row.storeId || 'غير محدد';
        }
        return 'غير محدد';
      }
    },
    { 
      field: 'price', 
      headerName: 'السعر', 
      width: 120,
      renderCell: (params) => formatCurrency(params.row.price || 0)
    },
    { 
      field: 'category', 
      headerName: 'التصنيف', 
      width: 120,
      renderCell: (params) => {
        const categoriesMap = {
          'main': 'وجبات رئيسية',
          'appetizer': 'مقبلات',
          'beverage': 'مشروبات',
          'dessert': 'حلويات',
          'salad': 'سلطات'
        };
        return categoriesMap[params.row.category] || params.row.category || 'غير محدد';
      }
    },
    {
      field: 'isAvailable',
      headerName: 'متاح',
      width: 80,
      renderCell: (params) => (
        <Chip
          label={params.row.isAvailable ? 'نعم' : 'لا'}
          size="small"
          color={params.row.isAvailable ? 'success' : 'error'}
        />
      ),
    },
    {
      field: 'rating',
      headerName: 'التقييم',
      width: 120,
      renderCell: (params) => (
        <Rating value={params.row.rating || 0} readOnly size="small" precision={0.5} />
      ),
    },
    {
      field: 'actions',
      headerName: 'الإجراءات',
      width: 200,
      hideOnDesktop: false,
      renderCell: (params) => (
        <Box>
          <Tooltip title="عرض التفاصيل">
            <IconButton size="small" onClick={() => {
              setSelectedProduct(params.row);
              setOpenDetails(true);
            }}>
              <Visibility fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="تعديل">
            <IconButton size="small" onClick={() => {
              setSelectedProduct(params.row);
              setOpenForm(true);
            }}>
              <Edit fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="إدارة المخزون">
            <IconButton size="small" onClick={() => {
              setSelectedProduct(params.row);
              setOpenInventory(true);
            }}>
              <Inventory fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title={params.row.isAvailable ? 'تعطيل' : 'تفعيل'}>
            <IconButton size="small" onClick={() => toggleAvailabilityMutation.mutate(params.row._id)}>
              {params.row.isAvailable ? <ToggleOff fontSize="small" color="error" /> : <ToggleOn fontSize="small" color="success" />}
            </IconButton>
          </Tooltip>
          <Tooltip title="تمييز">
            <IconButton
              size="small"
              onClick={() => featureProductMutation.mutate({ id: params.row._id, featured: !params.row.featured })}
              color={params.row.featured ? 'warning' : 'default'}
            >
              <Star fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="حذف">
            <IconButton size="small" onClick={() => {
              setSelectedProduct(params.row);
              setOpenDeleteDialog(true);
            }} color="error">
              <Delete fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      ),
    },
  ];

  const categories = [
    { value: 'all', label: 'الكل' },
    { value: 'main', label: 'وجبات رئيسية' },
    { value: 'appetizer', label: 'مقبلات' },
    { value: 'beverage', label: 'مشروبات' },
    { value: 'dessert', label: 'حلويات' },
    { value: 'salad', label: 'سلطات' },
  ];

  const resetFilters = () => {
    setFilters({
      search: '',
      category: 'all',
      store: 'all',
      availability: 'all',
    });
  };

  return (
    <Box sx={{ p: spacing.page }}>
      <Typography 
        variant="h5" 
        fontWeight="bold" 
        sx={{ mb: spacing.section, fontSize: fontSize.h2 }}
      >
        إدارة المنتجات
      </Typography>

      {/* بطاقات الإحصائيات */}
      <ResponsiveStatsCards 
        cards={statsCards} 
        columnsDesktop={4}
        columnsTablet={2}
        columnsMobile={2}
        spacing={spacing.section}
      />

      <Paper sx={{ p: spacing.card }}>
        {/* شريط العنوان والأزرار */}
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2} flexWrap="wrap" gap={1}>
          <Typography variant="h6" fontWeight="bold" sx={{ fontSize: fontSize.h3 }}>
            قائمة المنتجات
          </Typography>
          <Box display="flex" gap={1} flexWrap="wrap">
            <Button variant="outlined" startIcon={<Refresh />} onClick={() => refetch()} size="small" disabled={isFetching}>
              تحديث
            </Button>
            <Button variant="outlined" startIcon={<Download />} size="small">
              تصدير
            </Button>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => {
                setSelectedProduct(null);
                setOpenForm(true);
              }}
              size="small"
            >
              {isMobile ? 'جديد' : 'منتج جديد'}
            </Button>
          </Box>
        </Box>

        {/* الفلاتر */}
        <ResponsiveFilters onReset={resetFilters}>
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              label="بحث"
              size="small"
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              placeholder="اسم المنتج..."
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              select
              label="التصنيف"
              size="small"
              value={filters.category}
              onChange={(e) => setFilters({ ...filters, category: e.target.value })}
            >
              {categories.map((cat) => (
                <MenuItem key={cat.value} value={cat.value}>
                  {cat.label}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              select
              label="المتجر"
              size="small"
              value={filters.store}
              onChange={(e) => setFilters({ ...filters, store: e.target.value })}
            >
              <MenuItem value="all">الكل</MenuItem>
              {storesData?.data?.map((store) => (
                <MenuItem key={store._id} value={store._id}>
                  {store.name}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              select
              label="الحالة"
              size="small"
              value={filters.availability}
              onChange={(e) => setFilters({ ...filters, availability: e.target.value })}
            >
              <MenuItem value="all">الكل</MenuItem>
              <MenuItem value="available">متاح</MenuItem>
              <MenuItem value="unavailable">غير متاح</MenuItem>
            </TextField>
          </Grid>
        </ResponsiveFilters>

        {/* الجدول المتجاوب */}
        <ResponsiveTable
          data={products}
          columns={columns}
          loading={isLoading}
          onRowClick={(product) => {
            setSelectedProduct(product);
            setOpenDetails(true);
          }}
          emptyMessage="لا توجد منتجات"
          renderMobileCard={(product) => (
            <Paper key={product._id} sx={{ p: 1.5, cursor: 'pointer' }} onClick={() => {
              setSelectedProduct(product);
              setOpenDetails(true);
            }}>
              <Box display="flex" gap={2}>
                <Avatar 
                  src={product.image || '/placeholder-product.jpg'} 
                  sx={{ width: 50, height: 50, borderRadius: 1 }}
                >
                  {product.name?.charAt(0) || 'P'}
                </Avatar>
                <Box flex={1}>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={0.5}>
                    <Typography variant="subtitle2" fontWeight="bold">
                      {product.name || 'بدون اسم'}
                    </Typography>
                    <Chip
                      label={product.isAvailable ? 'متاح' : 'غير متاح'}
                      size="small"
                      color={product.isAvailable ? 'success' : 'error'}
                    />
                  </Box>
                  <Typography variant="caption" color="textSecondary" display="block">
                    {typeof product.store === 'object' ? product.store?.name : (product.storeId || 'غير محدد')}
                  </Typography>
                  <Typography variant="caption" color="textSecondary" display="block">
                    {product.category || 'غير محدد'}
                  </Typography>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mt={1}>
                    <Typography variant="body2" fontWeight="bold" color="primary">
                      {formatCurrency(product.price || 0)}
                    </Typography>
                    <Rating value={product.rating || 0} readOnly size="small" />
                  </Box>
                </Box>
              </Box>
              <Box display="flex" justifyContent="flex-end" gap={1} mt={1}>
                <IconButton size="small" onClick={(e) => { e.stopPropagation(); toggleAvailabilityMutation.mutate(product._id); }}>
                  {product.isAvailable ? <ToggleOff fontSize="small" /> : <ToggleOn fontSize="small" />}
                </IconButton>
                <IconButton size="small" onClick={(e) => { e.stopPropagation(); featureProductMutation.mutate({ id: product._id, featured: !product.featured }); }}>
                  <Star fontSize="small" color={product.featured ? 'warning' : 'disabled'} />
                </IconButton>
                <IconButton size="small" onClick={(e) => { e.stopPropagation(); setSelectedProduct(product); setOpenInventory(true); }}>
                  <Inventory fontSize="small" />
                </IconButton>
              </Box>
            </Paper>
          )}
        />

        {/* ترقيم الصفحات للهواتف */}
        {isMobile && totalCount > pageSize && (
          <Box display="flex" justifyContent="center" mt={2}>
            <Button
              variant="outlined"
              onClick={() => setPage(page - 1)}
              disabled={page === 0}
              size="small"
            >
              السابق
            </Button>
            <Typography variant="body2" sx={{ mx: 2, alignSelf: 'center' }}>
              {page + 1} / {Math.ceil(totalCount / pageSize)}
            </Typography>
            <Button
              variant="outlined"
              onClick={() => setPage(page + 1)}
              disabled={(page + 1) * pageSize >= totalCount}
              size="small"
            >
              التالي
            </Button>
          </Box>
        )}
      </Paper>

      {/* نموذج إضافة/تعديل منتج */}
      <ResponsiveDialog
        open={openForm}
        onClose={() => setOpenForm(false)}
        title={selectedProduct ? 'تعديل منتج' : 'إضافة منتج جديد'}
        maxWidth="md"
      >
        <ProductForm
          product={selectedProduct}
          onSuccess={() => {
            setOpenForm(false);
            queryClient.invalidateQueries('products');
            setSnackbar({ open: true, message: selectedProduct ? 'تم تحديث المنتج' : 'تم إضافة المنتج', severity: 'success' });
          }}
          onCancel={() => setOpenForm(false)}
        />
      </ResponsiveDialog>

      {/* تفاصيل المنتج */}
      <ResponsiveDialog
        open={openDetails}
        onClose={() => setOpenDetails(false)}
        title="تفاصيل المنتج"
        maxWidth="md"
        actions={<Button onClick={() => setOpenDetails(false)}>إغلاق</Button>}
      >
        {selectedProduct && (
          <Box>
            <Grid container spacing={2}>
              <Grid item xs={12} md={4} textAlign="center">
                <Avatar
                  src={selectedProduct.image || '/placeholder-product.jpg'}
                  sx={{ width: 120, height: 120, mx: 'auto', borderRadius: 2 }}
                >
                  {selectedProduct.name?.charAt(0) || 'P'}
                </Avatar>
              </Grid>
              <Grid item xs={12} md={8}>
                <Typography variant="h6">{selectedProduct.name || 'بدون اسم'}</Typography>
                <Typography variant="body2" color="textSecondary" paragraph>
                  {selectedProduct.description || 'لا يوجد وصف'}
                </Typography>
                <Typography variant="body2">
                  <strong>السعر:</strong> {formatCurrency(selectedProduct.price || 0)}
                </Typography>
                {selectedProduct.discountedPrice && (
                  <Typography variant="body2" color="error">
                    <strong>بعد الخصم:</strong> {formatCurrency(selectedProduct.discountedPrice)}
                  </Typography>
                )}
                <Typography variant="body2">
                  <strong>التصنيف:</strong> {selectedProduct.category || 'غير محدد'}
                </Typography>
                <Typography variant="body2">
                  <strong>وقت التحضير:</strong> {selectedProduct.preparationTime || 15} دقيقة
                </Typography>
                <Box display="flex" alignItems="center" mt={1}>
                  <strong>التقييم:</strong>
                  <Rating value={selectedProduct.rating || 0} readOnly size="small" sx={{ ml: 1 }} />
                </Box>
              </Grid>
            </Grid>
          </Box>
        )}
      </ResponsiveDialog>

      {/* إدارة المخزون */}
      <ResponsiveDialog
        open={openInventory}
        onClose={() => setOpenInventory(false)}
        title={`إدارة المخزون - ${selectedProduct?.name || ''}`}
        maxWidth="sm"
      >
        {selectedProduct && (
          <ProductInventory
            product={selectedProduct}
            onSuccess={() => {
              setOpenInventory(false);
              queryClient.invalidateQueries('products');
              setSnackbar({ open: true, message: 'تم تحديث المخزون', severity: 'success' });
            }}
          />
        )}
      </ResponsiveDialog>

      {/* حوار تأكيد الحذف */}
      <ResponsiveDialog
        open={openDeleteDialog}
        onClose={() => setOpenDeleteDialog(false)}
        title="تأكيد الحذف"
        maxWidth="xs"
        actions={
          <>
            <Button onClick={() => setOpenDeleteDialog(false)}>إلغاء</Button>
            <Button onClick={() => deleteMutation.mutate(selectedProduct?._id)} color="error" variant="contained">
              حذف
            </Button>
          </>
        }
      >
        <Typography>
          هل أنت متأكد من حذف المنتج "{selectedProduct?.name || ''}"؟
        </Typography>
      </ResponsiveDialog>

      {/* إشعارات */}
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