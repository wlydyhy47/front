import { Box, Grid, Typography, Paper, Avatar, Chip, Rating, Divider } from '@mui/material';
import { Storefront, Person, Phone, Email, LocationOn, Verified, Schedule } from '@mui/icons-material';
import { formatDate } from '../../../utils/formatters';

export default function StoreDetails({ store }) {
  // التحقق من وجود البيانات
  if (!store) return null;

  // استخراج معلومات المالك (التاجر)
  const owner = store.owner;
  const ownerName = typeof owner === 'object' ? owner?.name : (owner || 'غير محدد');
  const ownerPhone = typeof owner === 'object' ? owner?.phone : null;
  const ownerEmail = typeof owner === 'object' ? owner?.email : null;
  const ownerIsVerified = typeof owner === 'object' ? owner?.isVerified : false;

  return (
    <Box>
      <Paper sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={3}>
          {/* القسم الأيمن - الشعار والمعلومات الأساسية */}
          <Grid item xs={12} md={4} textAlign="center">
            <Avatar 
              src={store.logo} 
              sx={{ width: 120, height: 120, mx: 'auto', mb: 2 }}
            >
              {store.name?.charAt(0)}
            </Avatar>
            <Typography variant="h6">{store.name}</Typography>
            <Box display="flex" justifyContent="center" mt={1}>
              <Rating value={store.averageRating || 0} readOnly precision={0.5} />
              <Typography variant="caption" sx={{ ml: 1 }}>
                ({store.ratingsCount || 0})
              </Typography>
            </Box>
            
            {/* حالة المتجر */}
            <Box display="flex" justifyContent="center" gap={1} mt={2}>
              <Chip 
                label={store.isVerified ? 'موثق' : 'غير موثق'} 
                color={store.isVerified ? 'primary' : 'default'} 
                size="small"
              />
              <Chip 
                label={store.isOpen ? 'مفتوح' : 'مغلق'} 
                color={store.isOpen ? 'success' : 'error'} 
                size="small"
              />
            </Box>
            
            {store.deliveryInfo?.hasDelivery && (
              <Chip 
                label={`توصيل: ${store.deliveryInfo.deliveryFee} CFA`} 
                color="info" 
                size="small"
                variant="outlined"
                sx={{ mt: 1 }}
              />
            )}
          </Grid>

          {/* القسم الأيسر - المعلومات التفصيلية */}
          <Grid item xs={12} md={8}>
            {/* معلومات المتجر */}
            <Typography variant="subtitle1" fontWeight="bold" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Storefront fontSize="small" color="primary" />
              معلومات المتجر
            </Typography>
            
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={12}>
                <Typography variant="body1" gutterBottom>
                  <strong>الوصف:</strong> {store.description || '-'}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body1" gutterBottom>
                  <strong>التصنيف:</strong> {store.category || '-'}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body1" gutterBottom>
                  <strong>عدد المنتجات:</strong> {store.stats?.productsCount || store.productsCount || 0}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body1" gutterBottom>
                  <strong>رقم الهاتف:</strong> {store.phone || '-'}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body1" gutterBottom>
                  <strong>البريد الإلكتروني:</strong> {store.email || '-'}
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="body1" gutterBottom>
                  <strong>العنوان:</strong> {store.address?.street || '-'}
                </Typography>
                <Typography variant="body2" color="textSecondary" sx={{ mt: 0.5 }}>
                  {store.address?.city && `${store.address.city}, `}
                  {store.address?.state && `${store.address.state}, `}
                  {store.address?.country || 'النيجر'}
                  {store.address?.postalCode && ` - ${store.address.postalCode}`}
                </Typography>
              </Grid>
            </Grid>

            <Divider sx={{ my: 2 }} />

            {/* معلومات المالك (التاجر) */}
            <Typography variant="subtitle1" fontWeight="bold" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Person fontSize="small" color="secondary" />
              معلومات المالك (التاجر)
            </Typography>

            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={12}>
                <Paper variant="outlined" sx={{ p: 2, bgcolor: 'action.hover' }}>
                  <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} sm={3} textAlign="center">
                      <Avatar 
                        src={typeof owner === 'object' ? owner?.avatar : null} 
                        sx={{ width: 64, height: 64, mx: 'auto' }}
                      >
                        {ownerName?.charAt(0) || 'T'}
                      </Avatar>
                      {ownerIsVerified && (
                        <Chip 
                          label="موثق" 
                          size="small" 
                          color="success" 
                          icon={<Verified fontSize="small" />}
                          sx={{ mt: 1 }}
                        />
                      )}
                    </Grid>
                    <Grid item xs={12} sm={9}>
                      <Typography variant="body1" gutterBottom>
                        <strong>الاسم:</strong> {ownerName}
                      </Typography>
                      {ownerPhone && (
                        <Typography variant="body1" gutterBottom>
                          <strong>رقم الهاتف:</strong> {ownerPhone}
                        </Typography>
                      )}
                      {ownerEmail && (
                        <Typography variant="body1" gutterBottom>
                          <strong>البريد الإلكتروني:</strong> {ownerEmail}
                        </Typography>
                      )}
                      {!ownerPhone && !ownerEmail && (
                        <Typography variant="body2" color="textSecondary">
                          لا توجد معلومات إضافية متاحة
                        </Typography>
                      )}
                    </Grid>
                  </Grid>
                </Paper>
              </Grid>
            </Grid>

            <Divider sx={{ my: 2 }} />

            {/* معلومات إضافية */}
            <Typography variant="subtitle1" fontWeight="bold" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Schedule fontSize="small" color="info" />
              معلومات إضافية
            </Typography>

            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="textSecondary">
                  <strong>تاريخ التسجيل:</strong>
                </Typography>
                <Typography variant="body1">
                  {formatDate(store.createdAt)}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="textSecondary">
                  <strong>آخر تحديث:</strong>
                </Typography>
                <Typography variant="body1">
                  {formatDate(store.updatedAt)}
                </Typography>
              </Grid>
              {store.deliveryInfo?.estimatedDeliveryTime && (
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="textSecondary">
                    <strong>وقت التوصيل المقدر:</strong>
                  </Typography>
                  <Typography variant="body1">
                    {store.deliveryInfo.estimatedDeliveryTime} دقيقة
                  </Typography>
                </Grid>
              )}
              {store.deliveryInfo?.minOrderAmount > 0 && (
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="textSecondary">
                    <strong>الحد الأدنى للطلب:</strong>
                  </Typography>
                  <Typography variant="body1">
                    {store.deliveryInfo.minOrderAmount} CFA
                  </Typography>
                </Grid>
              )}
              {store.deliveryInfo?.freeDeliveryThreshold > 0 && (
                <Grid item xs={12}>
                  <Typography variant="body2" color="success.main">
                    <strong>توصيل مجاني للطلبات التي تزيد عن {store.deliveryInfo.freeDeliveryThreshold} CFA</strong>
                  </Typography>
                </Grid>
              )}
            </Grid>

            {/* العلامات (Tags) */}
            {store.tags && store.tags.length > 0 && (
              <>
                <Divider sx={{ my: 2 }} />
                <Typography variant="subtitle2" gutterBottom>
                  الكلمات المفتاحية:
                </Typography>
                <Box display="flex" gap={1} flexWrap="wrap">
                  {store.tags.map((tag, index) => (
                    <Chip key={index} label={tag} size="small" variant="outlined" />
                  ))}
                </Box>
              </>
            )}
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
}