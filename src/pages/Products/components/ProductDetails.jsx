// src/pages/Products/components/ProductDetails.jsx
// مكون مستقل لعرض تفاصيل المنتج بشكل كامل ومنظم

import { Box, Grid, Typography, Paper, Avatar, Chip, Rating, Divider, Stack, LinearProgress } from '@mui/material';
import {
  Storefront,
  Category,
  Schedule,
  Inventory,
  LocalOffer,
  TrendingUp,
  Visibility,
  ShoppingBag,
  AttachMoney,
  CheckCircle,
  Cancel,
  LocalFireDepartment,
  Grass,
  EmojiNature,
  Restaurant,
  AccessTime,
  CalendarToday,
  Update,
  Fastfood,
  HealthAndSafety,
  Warning,
} from '@mui/icons-material';
import { formatDate, formatCurrency } from '../../../utils/formatters';

// ✅ مكون عرض خاصية واحدة
const InfoItem = ({ icon: Icon, label, value, color = 'primary' }) => (
  <Paper variant="outlined" sx={{ p: 1.5, textAlign: 'center', height: '100%' }}>
    <Icon fontSize="small" color={color} sx={{ mb: 0.5 }} />
    <Typography variant="caption" color="textSecondary" display="block">
      {label}
    </Typography>
    <Typography variant="body2" fontWeight="bold">
      {value}
    </Typography>
  </Paper>
);

// ✅ مكون عرض الخصائص الغذائية
const DietaryTag = ({ label, icon: Icon, active, color = 'success' }) => {
  if (!active) return null;
  return (
    <Chip
      icon={<Icon fontSize="small" />}
      label={label}
      size="small"
      color={color}
      variant="outlined"
      sx={{ borderRadius: 2 }}
    />
  );
};

// ✅ مكون عرض المكونات
const IngredientsSection = ({ ingredients }) => {
  if (!ingredients || ingredients.length === 0) return null;
  
  return (
    <Box sx={{ mb: 3 }}>
      <Typography variant="subtitle2" gutterBottom display="flex" alignItems="center" gap={1}>
        <Fastfood fontSize="small" color="primary" />
        المكونات
      </Typography>
      <Box display="flex" flexWrap="wrap" gap={1}>
        {ingredients.map((ingredient, idx) => (
          <Chip
            key={idx}
            label={ingredient}
            size="small"
            variant="outlined"
            sx={{ borderRadius: 2 }}
          />
        ))}
      </Box>
    </Box>
  );
};

// ✅ مكون عرض الخيارات
const OptionsSection = ({ options }) => {
  if (!options || options.length === 0) return null;
  
  return (
    <Box sx={{ mb: 3 }}>
      <Typography variant="subtitle2" gutterBottom display="flex" alignItems="center" gap={1}>
        <LocalOffer fontSize="small" color="primary" />
        الخيارات المتاحة
      </Typography>
      <Stack spacing={1.5}>
        {options.map((option, idx) => (
          <Paper key={idx} variant="outlined" sx={{ p: 1.5 }}>
            <Typography variant="body2" fontWeight="bold" gutterBottom>
              {option.name}
              {option.required && <Chip label="إجباري" size="small" color="warning" sx={{ ml: 1 }} />}
            </Typography>
            <Box display="flex" flexWrap="wrap" gap={1}>
              {option.choices?.map((choice, cidx) => (
                <Chip
                  key={cidx}
                  label={`${choice.name} ${choice.price > 0 ? `+${formatCurrency(choice.price)}` : ''}`}
                  size="small"
                  variant="outlined"
                />
              ))}
            </Box>
          </Paper>
        ))}
      </Stack>
    </Box>
  );
};

// ✅ مكون عرض الإحصائيات
const StatsSection = ({ stats }) => {
  if (!stats) return null;
  
  const statsItems = [
    { icon: Visibility, label: 'مشاهدات', value: stats.views || 0, color: 'info' },
    { icon: ShoppingBag, label: 'طلبات', value: stats.orders || 0, color: 'primary' },
    { icon: AttachMoney, label: 'إيرادات', value: formatCurrency(stats.revenue || 0), color: 'success' },
  ];
  
  return (
    <Paper variant="outlined" sx={{ p: 2, bgcolor: 'action.hover', mb: 3 }}>
      <Typography variant="subtitle2" gutterBottom display="flex" alignItems="center" gap={1}>
        <TrendingUp fontSize="small" color="primary" />
        إحصائيات المنتج
      </Typography>
      <Grid container spacing={2}>
        {statsItems.map((item, idx) => (
          <Grid item xs={4} key={idx}>
            <Box textAlign="center">
              <item.icon fontSize="small" color={item.color} />
              <Typography variant="caption" color="textSecondary" display="block">
                {item.label}
              </Typography>
              <Typography variant="body2" fontWeight="bold">
                {item.value}
              </Typography>
            </Box>
          </Grid>
        ))}
      </Grid>
    </Paper>
  );
};

// ✅ المكون الرئيسي
export default function ProductDetails({ product }) {
  if (!product) {
    return (
      <Box textAlign="center" py={4}>
        <Typography color="textSecondary">لا توجد بيانات للمنتج</Typography>
      </Box>
    );
  }

  // استخراج معلومات المتجر
  const storeName = typeof product.store === 'object' 
    ? product.store.name 
    : (product.storeId || 'غير محدد');
  
  // التحقق من وجود خصائص غذائية
  const attributes = product.attributes || {};
  const hasAttributes = Object.values(attributes).some(v => v === true || v > 0);
  
  // التحقق من وجود معرض صور
  const hasGallery = product.gallery && product.gallery.length > 0;
  
  // حساب نسبة الخصم
  const discountPercent = product.discountedPrice 
    ? Math.round(((product.price - product.discountedPrice) / product.price) * 100)
    : 0;
  
  // حالة المخزون
  const stockQuantity = product.inventory?.quantity || 0;
  const isLowStock = stockQuantity > 0 && stockQuantity <= (product.inventory?.lowStockThreshold || 5);
  const isOutOfStock = stockQuantity === 0;
  
  return (
    <Box>
      <Grid container spacing={3}>
        {/* ========== القسم الأيمن: الصور ========== */}
        <Grid item xs={12} md={5}>
          <Paper sx={{ p: 2, textAlign: 'center', position: 'sticky', top: 20 }}>
            {/* الصورة الرئيسية */}
            <Box sx={{ position: 'relative' }}>
              <Avatar
                src={product.image || '/placeholder-product.jpg'}
                sx={{ 
                  width: '100%', 
                  height: 'auto', 
                  maxHeight: 280, 
                  borderRadius: 2,
                  bgcolor: '#f5f5f5',
                }}
                variant="rounded"
              >
                {product.name?.charAt(0) || 'P'}
              </Avatar>
              
              {/* علامة الخصم */}
              {discountPercent > 0 && (
                <Chip
                  label={`-${discountPercent}%`}
                  color="error"
                  size="small"
                  sx={{
                    position: 'absolute',
                    top: 10,
                    right: 10,
                    fontWeight: 'bold',
                  }}
                />
              )}
              
              {/* علامة التوفر */}
              {!product.isAvailable && (
                <Chip
                  label="غير متاح"
                  color="default"
                  size="small"
                  sx={{
                    position: 'absolute',
                    top: 10,
                    left: 10,
                    fontWeight: 'bold',
                  }}
                />
              )}
            </Box>
            
            {/* معرض الصور الإضافية */}
            {hasGallery && (
              <Box display="flex" gap={1} mt={2} justifyContent="center" flexWrap="wrap">
                {product.gallery.slice(0, 4).map((img, idx) => (
                  <Avatar
                    key={idx}
                    src={img}
                    sx={{ width: 60, height: 60, borderRadius: 1, cursor: 'pointer' }}
                    variant="rounded"
                  />
                ))}
                {product.gallery.length > 4 && (
                  <Chip label={`+${product.gallery.length - 4}`} size="small" variant="outlined" />
                )}
              </Box>
            )}
          </Paper>
        </Grid>
        
        {/* ========== القسم الأيسر: المعلومات ========== */}
        <Grid item xs={12} md={7}>
          <Paper sx={{ p: 3 }}>
            {/* العنوان والتقييم */}
            <Box display="flex" justifyContent="space-between" alignItems="flex-start" flexWrap="wrap" mb={2}>
              <Box>
                <Typography variant="h5" fontWeight="bold" gutterBottom>
                  {product.name}
                </Typography>
                <Box display="flex" alignItems="center" gap={1} flexWrap="wrap">
                  <Chip
                    icon={<Storefront fontSize="small" />}
                    label={storeName}
                    size="small"
                    variant="outlined"
                  />
                  <Chip
                    icon={<Category fontSize="small" />}
                    label={product.category || 'غير محدد'}
                    size="small"
                    variant="outlined"
                  />
                </Box>
              </Box>
              
              <Box textAlign="center">
                <Rating value={product.rating || 0} readOnly precision={0.5} />
                <Typography variant="caption" color="textSecondary" display="block">
                  ({product.stats?.orders || 0} طلب)
                </Typography>
              </Box>
            </Box>
            
            {/* الأسعار */}
            <Box display="flex" alignItems="baseline" gap={2} mb={3} flexWrap="wrap">
              <Typography variant="h3" color="primary" fontWeight="bold">
                {formatCurrency(product.price)}
              </Typography>
              {product.discountedPrice && (
                <>
                  <Typography variant="h5" color="error" sx={{ textDecoration: 'line-through' }}>
                    {formatCurrency(product.discountedPrice)}
                  </Typography>
                  <Chip 
                    label={`وفر ${formatCurrency(product.price - product.discountedPrice)}`}
                    color="success"
                    size="small"
                  />
                </>
              )}
            </Box>
            
            {/* الوصف */}
            {product.description && (
              <Typography variant="body2" color="textSecondary" paragraph sx={{ mb: 3 }}>
                {product.description}
              </Typography>
            )}
            
            {/* معلومات سريعة */}
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={6} sm={3}>
                <InfoItem icon={AccessTime} label="وقت التحضير" value={`${product.preparationTime || 15} دقيقة`} />
              </Grid>
              <Grid item xs={6} sm={3}>
                <InfoItem 
                  icon={Inventory} 
                  label="المخزون" 
                  value={isOutOfStock ? 'نفد' : `${stockQuantity} ${product.inventory?.unit || 'قطعة'}`}
                  color={isLowStock ? 'warning' : isOutOfStock ? 'error' : 'success'}
                />
              </Grid>
              <Grid item xs={6} sm={3}>
                <InfoItem 
                  icon={product.isAvailable ? CheckCircle : Cancel} 
                  label="الحالة" 
                  value={product.isAvailable ? 'متاح' : 'غير متاح'}
                  color={product.isAvailable ? 'success' : 'error'}
                />
              </Grid>
              <Grid item xs={6} sm={3}>
                <InfoItem 
                  icon={product.featured ? TrendingUp : LocalOffer} 
                  label="تمييز" 
                  value={product.featured ? 'مميز' : 'عادي'}
                  color={product.featured ? 'warning' : 'default'}
                />
              </Grid>
            </Grid>
            
            {/* شريط المخزون المنخفض */}
            {isLowStock && !isOutOfStock && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="caption" color="warning.main" display="flex" alignItems="center" gap={1}>
                  <Warning fontSize="small" />
                  المخزون منخفض! المتبقي {stockQuantity} {product.inventory?.unit || 'قطعة'}
                </Typography>
                <LinearProgress 
                  variant="determinate" 
                  value={(stockQuantity / (product.inventory?.lowStockThreshold || 5)) * 100} 
                  color="warning"
                  sx={{ mt: 0.5, height: 6, borderRadius: 3 }}
                />
              </Box>
            )}
            
            <Divider sx={{ my: 2 }} />
            
            {/* الخصائص الغذائية */}
            {hasAttributes && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" gutterBottom display="flex" alignItems="center" gap={1}>
                  <HealthAndSafety fontSize="small" color="primary" />
                  الخصائص الغذائية
                </Typography>
                <Box display="flex" flexWrap="wrap" gap={1}>
                  {attributes.spicyLevel > 0 && (
                    <Chip
                      icon={<LocalFireDepartment />}
                      label={`حار ${'🌶️'.repeat(attributes.spicyLevel)}`}
                      size="small"
                      color="error"
                      variant="outlined"
                    />
                  )}
                  <DietaryTag label="نباتي" icon={Grass} active={attributes.isVegetarian} />
                  <DietaryTag label="فيجان" icon={EmojiNature} active={attributes.isVegan} />
                  {attributes.isGlutenFree && (
                    <Chip 
                      icon={<HealthAndSafety />} 
                      label="خالٍ من الجلوتين" 
                      size="small" 
                      color="info" 
                      variant="outlined" 
                    />
                  )}
                  {attributes.isOrganic && (
                    <Chip icon={<EmojiNature />} label="عضوي" size="small" color="success" variant="outlined" />
                  )}
                </Box>
              </Box>
            )}
            
            {/* المكونات */}
            <IngredientsSection ingredients={product.ingredients} />
            
            {/* الخيارات */}
            <OptionsSection options={product.options} />
            
            {/* الإحصائيات */}
            <StatsSection stats={product.stats} />
            
            {/* التواريخ */}
            <Box display="flex" justifyContent="space-between" flexWrap="wrap" gap={1}>
              <Typography variant="caption" color="textSecondary" display="flex" alignItems="center" gap={0.5}>
                <CalendarToday fontSize="inherit" />
                تاريخ الإضافة: {formatDate(product.createdAt)}
              </Typography>
              <Typography variant="caption" color="textSecondary" display="flex" alignItems="center" gap={0.5}>
                <Update fontSize="inherit" />
                آخر تحديث: {formatDate(product.updatedAt)}
              </Typography>
            </Box>
            
            {/* العلامات (Tags) */}
            {product.tags && product.tags.length > 0 && (
              <Box display="flex" gap={1} mt={2} flexWrap="wrap">
                {product.tags.map((tag, idx) => (
                  <Chip key={idx} label={`#${tag}`} size="small" variant="outlined" />
                ))}
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}