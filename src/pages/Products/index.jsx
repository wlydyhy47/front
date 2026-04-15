// src/pages/Products/index.jsx - نسخة كاملة مع _id

import { useState, useCallback, useMemo } from 'react';
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
  FilterList,
  ClearAll,
  AttachMoney,
  Restaurant,
  LocalDrink,
} from '@mui/icons-material';
import { productsService, storesService } from '../../api';
import ResponsiveTable from '../../components/Common/ResponsiveTable';
import ResponsiveStatsCards from '../../components/Common/ResponsiveStatsCards';
import ResponsiveFilters from '../../components/Common/ResponsiveFilters';
import ResponsiveDialog from '../../components/Common/ResponsiveDialog';
import { useResponsive } from '../../hooks/useResponsive';
import ProductForm from './components/ProductForm';
import ProductInventory from './components/ProductInventory';
import ProductDetails from './components/ProductDetails';
import { formatCurrency } from '../../utils/formatters';
import { getReactKey, handleError } from '../../utils/helpers';

const CATEGORIES = [
  { value: 'all', label: 'الكل', icon: Restaurant },
  { value: 'main', label: 'وجبات رئيسية', icon: Restaurant },
  { value: 'appetizer', label: 'مقبلات', icon: Restaurant },
  { value: 'beverage', label: 'مشروبات', icon: LocalDrink },
  { value: 'dessert', label: 'حلويات', icon: Restaurant },
  { value: 'salad', label: 'سلطات', icon: Restaurant },
  { value: 'sauce', label: 'صلصات', icon: Restaurant },
];

const AVAILABILITY_OPTIONS = [
  { value: 'all', label: 'الكل' },
  { value: 'available', label: 'متاح' },
  { value: 'unavailable', label: 'غير متاح' },
];

const FEATURED_OPTIONS = [
  { value: 'all', label: 'الكل' },
  { value: 'featured', label: 'مميز' },
  { value: 'not_featured', label: 'غير مميز' },
];

export default function Products() {
  const { isMobile, fontSize, spacing } = useResponsive();
  const queryClient = useQueryClient();
  
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(isMobile ? 10 : 20);
  const [filters, setFilters] = useState({
    search: '',
    category: 'all',
    store: 'all',
    availability: 'all',
    featured: 'all',
    minPrice: '',
    maxPrice: '',
  });
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [openForm, setOpenForm] = useState(false);
  const [openDetails, setOpenDetails] = useState(false);
  const [openInventory, setOpenInventory] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  const { data, isLoading, refetch, isFetching } = useQuery(
    ['products', page, pageSize, filters],
    () => productsService.getProducts({
      page: page + 1,
      limit: pageSize,
      search: filters.search || undefined,
      category: filters.category !== 'all' ? filters.category : undefined,
      store: filters.store !== 'all' ? filters.store : undefined,
      isAvailable: filters.availability !== 'all' ? filters.availability === 'available' : undefined,
      featured: filters.featured !== 'all' ? filters.featured === 'featured' : undefined,
      minPrice: filters.minPrice || undefined,
      maxPrice: filters.maxPrice || undefined,
    }),
    {
      keepPreviousData: true,
      onError: (error) => {
        setSnackbar({ 
          open: true, 
          message: handleError(error, 'فشل تحميل بيانات المنتجات'), 
          severity: 'error' 
        });
      }
    }
  );

  const { data: storesData, isLoading: storesLoading } = useQuery(
    'stores-list', 
    () => storesService.getStores({ limit: 100 }),
    {
      onError: (error) => {
        console.error('Failed to load stores:', error);
      }
    }
  );

  const products = data?.data || [];
  const totalCount = data?.pagination?.total || 0;
  const stats = data?.stats || {};

  const deleteMutation = useMutation(
    (productId) => productsService.deleteProduct(productId),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('products');
        setOpenDeleteDialog(false);
        setSnackbar({ open: true, message: 'تم حذف المنتج بنجاح', severity: 'success' });
      },
      onError: (error) => {
        setSnackbar({ open: true, message: handleError(error, 'فشل حذف المنتج'), severity: 'error' });
      },
    }
  );

  const toggleAvailabilityMutation = useMutation(
    (productId) => productsService.toggleAvailability(productId),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('products');
        setSnackbar({ open: true, message: 'تم تغيير حالة توفر المنتج', severity: 'success' });
      },
      onError: (error) => {
        setSnackbar({ open: true, message: handleError(error, 'فشل تغيير حالة المنتج'), severity: 'error' });
      },
    }
  );

  const featureProductMutation = useMutation(
    ({ productId, featured }) => productsService.featureProduct(productId, { featured }),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('products');
        setSnackbar({ open: true, message: 'تم تحديث حالة التمييز', severity: 'success' });
      },
      onError: (error) => {
        setSnackbar({ open: true, message: handleError(error, 'فشل تحديث حالة التمييز'), severity: 'error' });
      },
    }
  );

  const handleViewDetails = useCallback((product) => {
    setSelectedProduct(product);
    setOpenDetails(true);
  }, []);

  const handleEdit = useCallback((product) => {
    setSelectedProduct(product);
    setOpenForm(true);
  }, []);

  const handleInventory = useCallback((product) => {
    setSelectedProduct(product);
    setOpenInventory(true);
  }, []);

  const handleDelete = useCallback((product) => {
    setSelectedProduct(product);
    setOpenDeleteDialog(true);
  }, []);

  const handleToggleAvailability = useCallback((product) => {
    toggleAvailabilityMutation.mutate(product._id);
  }, [toggleAvailabilityMutation]);

  const handleToggleFeature = useCallback((product) => {
    featureProductMutation.mutate({ productId: product._id, featured: !product.featured });
  }, [featureProductMutation]);

  const confirmDelete = useCallback(() => {
    if (selectedProduct) {
      deleteMutation.mutate(selectedProduct._id);
    }
  }, [selectedProduct, deleteMutation]);

  const resetFilters = useCallback(() => {
    setFilters({
      search: '',
      category: 'all',
      store: 'all',
      availability: 'all',
      featured: 'all',
      minPrice: '',
      maxPrice: '',
    });
    setPage(0);
    setShowAdvancedFilters(false);
  }, []);

  const statsCards = useMemo(() => [
    { 
      title: 'إجمالي المنتجات', 
      value: stats.total || totalCount, 
      icon: Add, 
      color: '#2196f3',
      subtext: `+${stats.newThisMonth || 0} هذا الشهر`
    },
    { 
      title: 'منتجات متاحة', 
      value: stats.available || products.filter(p => p.isAvailable).length, 
      icon: ToggleOn, 
      color: '#4caf50',
      subtext: `${((stats.available / stats.total) * 100 || 0).toFixed(0)}% من الإجمالي`
    },
    { 
      title: 'مخزون منخفض', 
      value: stats.lowStock || products.filter(p => p.inventory?.quantity <= (p.inventory?.lowStockThreshold || 5)).length, 
      icon: Inventory, 
      color: '#ff9800',
      subtext: 'تحتاج إلى إعادة تعبئة'
    },
    { 
      title: 'منتجات مميزة', 
      value: stats.featured || products.filter(p => p.featured).length, 
      icon: Star, 
      color: '#9c27b0',
      subtext: 'في الصفحة الرئيسية'
    },
  ], [stats, totalCount, products]);

  const columns = useMemo(() => [
    {
      field: 'image',
      headerName: 'الصورة',
      width: 80,
      renderCell: (params) => {
        const imageUrl = params.row.image || '/placeholder-product.jpg';
        return (
          <Avatar 
            src={imageUrl} 
            sx={{ width: 45, height: 45, borderRadius: 2 }}
            variant="rounded"
          >
            {params.row.name?.charAt(0) || 'P'}
          </Avatar>
        );
      },
    },
    { 
      field: 'name', 
      headerName: 'اسم المنتج', 
      width: 200,
      renderCell: (params) => (
        <Box>
          <Typography variant="body2" fontWeight="medium">
            {params.row.name || 'بدون اسم'}
          </Typography>
          {params.row.featured && (
            <Chip label="مميز" size="small" color="warning" sx={{ mt: 0.5, height: 18, fontSize: 10 }} />
          )}
        </Box>
      )
    },
    { 
      field: 'store', 
      headerName: 'المتجر', 
      width: 150,
      renderCell: (params) => {
        const row = params.row;
        if (row.store && typeof row.store === 'object') {
          return row.store.name || 'غير محدد';
        }
        if (row.storeId && storesData?.data) {
          const store = storesData.data.find(s => s._id === row.storeId);
          return store?.name || row.storeId?.slice(-6) || 'غير محدد';
        }
        return 'غير محدد';
      }
    },
    { 
      field: 'price', 
      headerName: 'السعر', 
      width: 120,
      renderCell: (params) => (
        <Box>
          <Typography variant="body2" fontWeight="bold" color="primary">
            {formatCurrency(params.row.price || 0)}
          </Typography>
          {params.row.discountedPrice && (
            <Typography variant="caption" color="error" sx={{ textDecoration: 'line-through' }}>
              {formatCurrency(params.row.discountedPrice)}
            </Typography>
          )}
        </Box>
      )
    },
    { 
      field: 'category', 
      headerName: 'التصنيف', 
      width: 120,
      renderCell: (params) => {
        const categoryMap = {
          'main': 'وجبات رئيسية',
          'appetizer': 'مقبلات',
          'beverage': 'مشروبات',
          'dessert': 'حلويات',
          'salad': 'سلطات'
        };
        return categoryMap[params.row.category] || params.row.category || 'غير محدد';
      }
    },
    {
      field: 'isAvailable',
      headerName: 'الحالة',
      width: 100,
      renderCell: (params) => (
        <Chip
          label={params.row.isAvailable ? 'متاح' : 'غير متاح'}
          size="small"
          color={params.row.isAvailable ? 'success' : 'error'}
          variant="outlined"
        />
      ),
    },
    {
      field: 'rating',
      headerName: 'التقييم',
      width: 120,
      renderCell: (params) => (
        <Box>
          <Rating value={params.row.rating || 0} readOnly size="small" precision={0.5} />
          <Typography variant="caption" color="textSecondary">
            ({params.row.stats?.orders || 0} طلب)
          </Typography>
        </Box>
      ),
    },
    {
      field: 'actions',
      headerName: 'الإجراءات',
      width: 250,
      hideOnDesktop: false,
      renderCell: (params) => {
        const product = params.row;
        return (
          <Box display="flex" gap={0.5}>
            <Tooltip title="عرض التفاصيل">
              <IconButton size="small" onClick={() => handleViewDetails(product)}>
                <Visibility fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="تعديل">
              <IconButton size="small" onClick={() => handleEdit(product)}>
                <Edit fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="إدارة المخزون">
              <IconButton size="small" onClick={() => handleInventory(product)}>
                <Inventory fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title={product.isAvailable ? 'تعطيل' : 'تفعيل'}>
              <IconButton size="small" onClick={() => handleToggleAvailability(product)}>
                {product.isAvailable ? <ToggleOff fontSize="small" color="error" /> : <ToggleOn fontSize="small" color="success" />}
              </IconButton>
            </Tooltip>
            <Tooltip title={product.featured ? 'إلغاء التمييز' : 'تمييز'}>
              <IconButton
                size="small"
                onClick={() => handleToggleFeature(product)}
                color={product.featured ? 'warning' : 'default'}
              >
                <Star fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="حذف">
              <IconButton size="small" onClick={() => handleDelete(product)} color="error">
                <Delete fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        );
      },
    },
  ], [storesData, handleViewDetails, handleEdit, handleInventory, handleToggleAvailability, handleToggleFeature, handleDelete]);

  return (
    <Box sx={{ p: spacing.page }}>
      <Typography variant="h5" fontWeight="bold" sx={{ mb: spacing.section, fontSize: fontSize.h2 }}>
        إدارة المنتجات
      </Typography>

      <ResponsiveStatsCards 
        cards={statsCards} 
        columnsDesktop={4}
        columnsTablet={2}
        columnsMobile={2}
        spacing={spacing.section}
      />

      <Paper sx={{ p: spacing.card }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2} flexWrap="wrap" gap={1}>
          <Typography variant="h6" fontWeight="bold" sx={{ fontSize: fontSize.h3 }}>
            قائمة المنتجات
          </Typography>
          <Box display="flex" gap={1} flexWrap="wrap">
            {isMobile && (
              <Button
                variant="outlined"
                startIcon={<FilterList />}
                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
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
              variant="outlined" 
              startIcon={<Download />} 
              onClick={() => setSnackbar({ open: true, message: 'جاري التصدير...', severity: 'info' })} 
              size="small"
            >
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
              {CATEGORIES.map((cat) => (
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
              disabled={storesLoading}
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
              {AVAILABILITY_OPTIONS.map((opt) => (
                <MenuItem key={opt.value} value={opt.value}>
                  {opt.label}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
        </ResponsiveFilters>

        {(showAdvancedFilters || !isMobile) && (
          <Box mt={2} mb={2}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  fullWidth
                  select
                  label="حالة التمييز"
                  size="small"
                  value={filters.featured}
                  onChange={(e) => setFilters({ ...filters, featured: e.target.value })}
                >
                  {FEATURED_OPTIONS.map((opt) => (
                    <MenuItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={6} sm={3} md={2}>
                <TextField
                  fullWidth
                  type="number"
                  label="الحد الأدنى"
                  size="small"
                  placeholder="السعر"
                  value={filters.minPrice}
                  onChange={(e) => setFilters({ ...filters, minPrice: e.target.value })}
                  InputProps={{ startAdornment: <AttachMoney fontSize="small" /> }}
                />
              </Grid>
              <Grid item xs={6} sm={3} md={2}>
                <TextField
                  fullWidth
                  type="number"
                  label="الحد الأقصى"
                  size="small"
                  placeholder="السعر"
                  value={filters.maxPrice}
                  onChange={(e) => setFilters({ ...filters, maxPrice: e.target.value })}
                  InputProps={{ startAdornment: <AttachMoney fontSize="small" /> }}
                />
              </Grid>
              {isMobile && (
                <Grid item xs={12}>
                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<ClearAll />}
                    onClick={resetFilters}
                    size="small"
                  >
                    مسح جميع الفلاتر
                  </Button>
                </Grid>
              )}
            </Grid>
          </Box>
        )}

        <ResponsiveTable
          data={products}
          columns={columns}
          loading={isLoading}
          onRowClick={(product) => {
            setSelectedProduct(product);
            setOpenDetails(true);
          }}
          emptyMessage="لا توجد منتجات"
          renderMobileCard={(product, index) => {
            const storeName = typeof product.store === 'object' ? product.store?.name : (product.storeId || 'غير محدد');
            const isLowStock = product.inventory?.quantity <= (product.inventory?.lowStockThreshold || 5);
            
            return (
              <Paper 
                key={getReactKey(product, index)} 
                sx={{ p: 1.5, cursor: 'pointer', mb: 1.5 }} 
                onClick={() => {
                  setSelectedProduct(product);
                  setOpenDetails(true);
                }}
              >
                <Box display="flex" gap={2}>
                  <Avatar 
                    src={product.image || '/placeholder-product.jpg'} 
                    sx={{ width: 60, height: 60, borderRadius: 2 }}
                    variant="rounded"
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
                      {storeName}
                    </Typography>
                    <Typography variant="caption" color="textSecondary" display="block">
                      {product.category || 'غير محدد'}
                    </Typography>
                    <Box display="flex" justifyContent="space-between" alignItems="center" mt={1}>
                      <Box>
                        <Typography variant="body2" fontWeight="bold" color="primary">
                          {formatCurrency(product.price || 0)}
                        </Typography>
                        {product.discountedPrice && (
                          <Typography variant="caption" color="error" sx={{ textDecoration: 'line-through', ml: 1 }}>
                            {formatCurrency(product.discountedPrice)}
                          </Typography>
                        )}
                      </Box>
                      <Rating value={product.rating || 0} readOnly size="small" />
                    </Box>
                    
                    {isLowStock && product.inventory?.quantity > 0 && (
                      <Chip 
                        label={`مخزون منخفض: ${product.inventory.quantity}`} 
                        size="small" 
                        color="warning" 
                        sx={{ mt: 1 }}
                      />
                    )}
                    
                    {product.attributes && Object.values(product.attributes).some(v => v === true || v > 0) && (
                      <Box display="flex" gap={0.5} mt={1}>
                        {product.attributes.spicyLevel > 0 && (
                          <Chip label={`🌶️${product.attributes.spicyLevel}`} size="small" variant="outlined" />
                        )}
                        {product.attributes.isVegetarian && <Chip label="نباتي" size="small" variant="outlined" />}
                        {product.featured && <Chip label="مميز" size="small" color="warning" />}
                      </Box>
                    )}
                  </Box>
                </Box>
                <Box display="flex" justifyContent="flex-end" gap={1} mt={1}>
                  <IconButton 
                    size="small" 
                    onClick={(e) => { 
                      e.stopPropagation(); 
                      handleToggleAvailability(product);
                    }}
                  >
                    {product.isAvailable ? <ToggleOff fontSize="small" /> : <ToggleOn fontSize="small" />}
                  </IconButton>
                  <IconButton 
                    size="small" 
                    onClick={(e) => { 
                      e.stopPropagation(); 
                      handleToggleFeature(product);
                    }}
                  >
                    <Star fontSize="small" color={product.featured ? 'warning' : 'disabled'} />
                  </IconButton>
                  <IconButton 
                    size="small" 
                    onClick={(e) => { 
                      e.stopPropagation(); 
                      handleInventory(product);
                    }}
                  >
                    <Inventory fontSize="small" />
                  </IconButton>
                </Box>
              </Paper>
            );
          }}
        />

        {isMobile && totalCount > pageSize && (
          <Box display="flex" justifyContent="center" mt={2} gap={2}>
            <Button
              variant="outlined"
              onClick={() => setPage(page - 1)}
              disabled={page === 0}
              size="small"
            >
              السابق
            </Button>
            <Typography variant="body2" sx={{ alignSelf: 'center' }}>
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

      <ResponsiveDialog
        open={openForm}
        onClose={() => setOpenForm(false)}
        title={selectedProduct ? 'تعديل منتج' : 'إضافة منتج جديد'}
        maxWidth="md"
        fullScreenOnMobile={true}
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

      <ResponsiveDialog
        open={openDetails}
        onClose={() => setOpenDetails(false)}
        title={`تفاصيل المنتج: ${selectedProduct?.name || ''}`}
        maxWidth="lg"
        fullScreenOnMobile={true}
        actions={<Button onClick={() => setOpenDetails(false)}>إغلاق</Button>}
      >
        {selectedProduct && <ProductDetails product={selectedProduct} />}
      </ResponsiveDialog>

      <ResponsiveDialog
        open={openInventory}
        onClose={() => setOpenInventory(false)}
        title={`إدارة المخزون - ${selectedProduct?.name || ''}`}
        maxWidth="sm"
        fullScreenOnMobile={true}
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

      <ResponsiveDialog
        open={openDeleteDialog}
        onClose={() => setOpenDeleteDialog(false)}
        title="تأكيد الحذف"
        maxWidth="xs"
        actions={
          <>
            <Button onClick={() => setOpenDeleteDialog(false)}>إلغاء</Button>
            <Button onClick={confirmDelete} color="error" variant="contained">
              حذف
            </Button>
          </>
        }
      >
        <Typography>
          هل أنت متأكد من حذف المنتج "{selectedProduct?.name || ''}"؟
        </Typography>
      </ResponsiveDialog>

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