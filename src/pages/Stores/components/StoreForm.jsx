import { useState, useEffect } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import {
  TextField,
  MenuItem,
  Button,
  Box,
  Grid,
  Switch,
  FormControlLabel,
  Alert,
  CircularProgress,
  InputAdornment,
  Typography,
  Divider,
  Paper,
  Chip,
  Stack,
  IconButton,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Avatar,
  Badge,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  ExpandMore as ExpandMoreIcon,
  LocationOn as LocationIcon,
  DeliveryDining as DeliveryIcon,
  Schedule as ScheduleIcon,
  Map as MapIcon,
  CloudUpload as CloudUploadIcon,
  PhotoCamera as PhotoCameraIcon,
  Clear as ClearIcon,
} from '@mui/icons-material';
import { storesService, vendorsService } from '../../../api';

const validationSchema = Yup.object({
  name: Yup.string()
    .required('اسم المتجر مطلوب')
    .min(3, 'الاسم يجب أن يكون 3 أحرف على الأقل')
    .max(100, 'الاسم يجب أن لا يتجاوز 100 حرف'),
  description: Yup.string()
    .max(500, 'الوصف طويل جداً')
    .required('الوصف مطلوب'),
  category: Yup.string().required('التصنيف مطلوب'),
  owner: Yup.string().required('مالك المتجر مطلوب'),
  phone: Yup.string()
    .required('رقم الهاتف مطلوب')
    .matches(/^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{4,6}$/, 'رقم الهاتف غير صالح'),
  email: Yup.string().email('بريد إلكتروني غير صحيح'),
  website: Yup.string().url('رابط غير صحيح'),
  address: Yup.object({
    street: Yup.string().max(200),
    city: Yup.string().max(100),
    state: Yup.string().max(100),
    country: Yup.string().max(100),
    postalCode: Yup.string().max(20),
    latitude: Yup.number()
      .min(-90, 'خط العرض يجب أن يكون بين -90 و 90')
      .max(90, 'خط العرض يجب أن يكون بين -90 و 90'),
    longitude: Yup.number()
      .min(-180, 'خط الطول يجب أن يكون بين -180 و 180')
      .max(180, 'خط الطول يجب أن يكون بين -180 و 180'),
  }),
  deliveryInfo: Yup.object({
    hasDelivery: Yup.boolean(),
    deliveryFee: Yup.number().min(0, 'رسوم التوصيل يجب أن تكون 0 أو أكثر'),
    minOrderAmount: Yup.number().min(0, 'الحد الأدنى للطلب يجب أن يكون 0 أو أكثر'),
    estimatedDeliveryTime: Yup.number().min(5, 'الوقت المقدر يجب أن لا يقل عن 5 دقائق').max(120, 'الوقت المقدر يجب أن لا يتجاوز 120 دقيقة'),
    deliveryRadius: Yup.number().min(1, 'نطاق التوصيل يجب أن لا يقل عن 1 كم').max(50, 'نطاق التوصيل يجب أن لا يتجاوز 50 كم'),
    freeDeliveryThreshold: Yup.number().min(0),
  }),
  tags: Yup.array().of(Yup.string()),
  isOpen: Yup.boolean(),
});

const categories = [
  { value: 'restaurant', label: 'مطعم' },
  { value: 'cafe', label: 'مقهى' },
  { value: 'fast_food', label: 'وجبات سريعة' },
  { value: 'bakery', label: 'مخبز' },
  { value: 'grocery', label: 'بقالة' },
  { value: 'supermarket', label: 'سوبر ماركت' },
  { value: 'pharmacy', label: 'صيدلية' },
  { value: 'clothing', label: 'ملابس' },
  { value: 'electronics', label: 'إلكترونيات' },
  { value: 'other', label: 'أخرى' },
];

const daysOfWeek = [
  { value: 'monday', label: 'الإثنين' },
  { value: 'tuesday', label: 'الثلاثاء' },
  { value: 'wednesday', label: 'الأربعاء' },
  { value: 'thursday', label: 'الخميس' },
  { value: 'friday', label: 'الجمعة' },
  { value: 'saturday', label: 'السبت' },
  { value: 'sunday', label: 'الأحد' },
];

export default function StoreForm({ store, onSuccess, onCancel }) {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [tagInput, setTagInput] = useState('');
  const [expandedSections, setExpandedSections] = useState({
    address: false,
    delivery: false,
    hours: false,
  });
  
  // ✅ States لرفع الملفات
  const [logoFile, setLogoFile] = useState(null);
  const [coverFile, setCoverFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(store?.logo || null);
  const [coverPreview, setCoverPreview] = useState(store?.coverImage || null);
  
  // ✅ States لجلب التجار
  const [vendors, setVendors] = useState([]);
  const [vendorsLoading, setVendorsLoading] = useState(false);
  
  const isEdit = !!store;

  // ✅ جلب قائمة التجار عند إنشاء متجر جديد
  useEffect(() => {
    if (!isEdit) {
      const fetchVendors = async () => {
        setVendorsLoading(true);
        try {
          const response = await vendorsService.getVendors({ limit: 100 });
          // التعامل مع هيكل الاستجابة المختلفة
          const vendorsList = response.data?.vendors || response.data || [];
          setVendors(vendorsList);
          console.log('✅ Vendors loaded:', vendorsList.length);
        } catch (error) {
          console.error('❌ Failed to fetch vendors:', error);
          setError('فشل تحميل قائمة التجار');
        } finally {
          setVendorsLoading(false);
        }
      };
      fetchVendors();
    }
  }, [isEdit]);

  // ✅ دالة معالجة رفع الشعار
  const handleLogoChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setLogoFile(file);
      const previewUrl = URL.createObjectURL(file);
      setLogoPreview(previewUrl);
    }
  };

  // ✅ دالة معالجة رفع صورة الغلاف
  const handleCoverChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setCoverFile(file);
      const previewUrl = URL.createObjectURL(file);
      setCoverPreview(previewUrl);
    }
  };

  // ✅ دالة إزالة الشعار
  const handleRemoveLogo = () => {
    setLogoFile(null);
    setLogoPreview(store?.logo || null);
  };

  // ✅ دالة إزالة صورة الغلاف
  const handleRemoveCover = () => {
    setCoverFile(null);
    setCoverPreview(store?.coverImage || null);
  };

  // دالة لجلب الموقع الحالي للمستخدم
  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError('المتصفح لا يدعم تحديد الموقع');
      return;
    }

    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        formik.setFieldValue('address.latitude', position.coords.latitude);
        formik.setFieldValue('address.longitude', position.coords.longitude);
        setLoading(false);
      },
      (error) => {
        console.error('❌ Geolocation error:', error);
        setError('فشل في تحديد الموقع الحالي');
        setLoading(false);
      }
    );
  };

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !formik.values.tags.includes(tagInput.trim())) {
      formik.setFieldValue('tags', [...formik.values.tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const handleDeleteTag = (tagToDelete) => {
    formik.setFieldValue('tags', formik.values.tags.filter(tag => tag !== tagToDelete));
  };

  const formik = useFormik({
    initialValues: {
      name: store?.name || '',
      description: store?.description || '',
      category: store?.category || '',
      owner: store?.owner || store?.ownerId || '',
      phone: store?.phone || '',
      email: store?.email || '',
      website: store?.website || '',
      isOpen: store?.isOpen !== undefined ? store.isOpen : true,
      address: {
        street: store?.address?.street || '',
        city: store?.address?.city || '',
        state: store?.address?.state || '',
        country: store?.address?.country || 'Niger',
        postalCode: store?.address?.postalCode || '',
        latitude: store?.address?.latitude || '',
        longitude: store?.address?.longitude || '',
      },
      deliveryInfo: {
        hasDelivery: store?.deliveryInfo?.hasDelivery !== undefined ? store.deliveryInfo.hasDelivery : true,
        deliveryFee: store?.deliveryInfo?.deliveryFee || 0,
        minOrderAmount: store?.deliveryInfo?.minOrderAmount || 0,
        estimatedDeliveryTime: store?.deliveryInfo?.estimatedDeliveryTime || 30,
        deliveryRadius: store?.deliveryInfo?.deliveryRadius || 10,
        freeDeliveryThreshold: store?.deliveryInfo?.freeDeliveryThreshold || 0,
      },
      tags: store?.tags || [],
      openingHours: store?.openingHours || {
        monday: { open: '09:00', close: '22:00', isOpen: true },
        tuesday: { open: '09:00', close: '22:00', isOpen: true },
        wednesday: { open: '09:00', close: '22:00', isOpen: true },
        thursday: { open: '09:00', close: '22:00', isOpen: true },
        friday: { open: '09:00', close: '22:00', isOpen: true },
        saturday: { open: '10:00', close: '23:00', isOpen: true },
        sunday: { open: '10:00', close: '23:00', isOpen: true },
      },
    },
    validationSchema,
    onSubmit: async (values) => {
      setLoading(true);
      setError('');

      try {
        const formData = new FormData();

        // ✅ إضافة الحقول الأساسية
        formData.append('name', values.name);
        formData.append('description', values.description);
        formData.append('category', values.category);
        formData.append('phone', values.phone);
        
        // ✅ إضافة مالك المتجر (التاجر)
        if (values.owner) {
          formData.append('owner', values.owner);
          console.log('📦 Owner ID:', values.owner);
        }
        
        if (values.email) {
          formData.append('email', values.email);
        }
        
        if (values.website) {
          formData.append('website', values.website);
        }
        
        formData.append('isOpen', values.isOpen);
        
        // ✅ تحويل الكائنات إلى JSON string
        const addressString = JSON.stringify(values.address);
        console.log('📦 Address JSON:', addressString);
        formData.append('address', addressString);
        
        const deliveryString = JSON.stringify(values.deliveryInfo);
        console.log('📦 Delivery JSON:', deliveryString);
        formData.append('deliveryInfo', deliveryString);
        
        const hoursString = JSON.stringify(values.openingHours);
        console.log('📦 Opening Hours JSON:', hoursString);
        formData.append('openingHours', hoursString);
        
        // ✅ تحويل tags إلى string مفصول بفواصل
        if (values.tags && values.tags.length > 0) {
          const tagsString = values.tags.join(',');
          console.log('📦 Tags:', tagsString);
          formData.append('tags', tagsString);
        }
        
        // ✅ إضافة الصور إذا وجدت
        if (logoFile) {
          console.log('📦 Adding logo file:', logoFile.name);
          formData.append('logo', logoFile);
        }
        
        if (coverFile) {
          console.log('📦 Adding cover image file:', coverFile.name);
          formData.append('coverImage', coverFile);
        }

        // تسجيل جميع البيانات للـ debugging
        console.log('📦 FormData entries:');
        for (let pair of formData.entries()) {
          if (pair[1] instanceof File) {
            console.log(pair[0], '=', pair[1].name, '(File)');
          } else {
            console.log(pair[0], '=', pair[1]);
          }
        }

        // إرسال البيانات
        if (isEdit) {
          await storesService.updateStore(store._id, formData);
        } else {
          await storesService.createStore(formData);
        }
        
        onSuccess();
      } catch (err) {
        console.error('❌ Store form error:', err);
        console.error('❌ Error response:', err.response?.data);
        setError(err.response?.data?.message || 'حدث خطأ أثناء حفظ المتجر');
      } finally {
        setLoading(false);
      }
    },
  });

  // دالة عرض التاجر في الـ Select
  const renderVendorValue = (selected) => {
    const vendor = vendors.find(v => (v._id || v.id) === selected);
    if (!vendor) return 'اختر التاجر';
    return (
      <Box display="flex" alignItems="center" gap={1}>
        <Avatar src={vendor.avatar} sx={{ width: 28, height: 28 }}>
          {vendor.name?.charAt(0)}
        </Avatar>
        <Typography variant="body2">{vendor.name}</Typography>
        {vendor.isVerified && (
          <Chip label="موثق" size="small" color="success" sx={{ height: 20, fontSize: '0.7rem' }} />
        )}
      </Box>
    );
  };

  return (
    <form onSubmit={formik.handleSubmit}>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      <Grid container spacing={2}>
        {/* ✅ قسم الصور */}
        <Grid item xs={12}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            صور المتجر
          </Typography>
        </Grid>

        {/* شعار المتجر */}
        <Grid item xs={12} sm={6}>
          <Paper variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="subtitle2" gutterBottom>
              شعار المتجر
            </Typography>
            <Box sx={{ position: 'relative', display: 'inline-block' }}>
              <Badge
                overlap="circular"
                anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
                badgeContent={
                  logoPreview && !logoFile && !store?.logo ? null : (
                    <IconButton
                      size="small"
                      onClick={handleRemoveLogo}
                      sx={{
                        bgcolor: 'error.main',
                        color: 'white',
                        '&:hover': { bgcolor: 'error.dark' },
                      }}
                    >
                      <ClearIcon fontSize="small" />
                    </IconButton>
                  )
                }
              >
                <Avatar
                  src={logoPreview}
                  sx={{ width: 100, height: 100, mx: 'auto', mb: 1 }}
                  variant="rounded"
                >
                  {!logoPreview && <PhotoCameraIcon sx={{ fontSize: 40 }} />}
                </Avatar>
              </Badge>
            </Box>
            <Button
              variant="outlined"
              component="label"
              startIcon={<CloudUploadIcon />}
              size="small"
              sx={{ mt: 1 }}
            >
              رفع شعار
              <input
                type="file"
                hidden
                accept="image/*"
                onChange={handleLogoChange}
              />
            </Button>
            <Typography variant="caption" display="block" color="text.secondary" sx={{ mt: 0.5 }}>
              PNG, JPG, JPEG (Max 2MB)
            </Typography>
          </Paper>
        </Grid>

        {/* صورة الغلاف */}
        <Grid item xs={12} sm={6}>
          <Paper variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="subtitle2" gutterBottom>
              صورة الغلاف
            </Typography>
            <Box sx={{ position: 'relative', display: 'inline-block' }}>
              <Badge
                overlap="circular"
                anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
                badgeContent={
                  coverPreview && !coverFile && !store?.coverImage ? null : (
                    <IconButton
                      size="small"
                      onClick={handleRemoveCover}
                      sx={{
                        bgcolor: 'error.main',
                        color: 'white',
                        '&:hover': { bgcolor: 'error.dark' },
                      }}
                    >
                      <ClearIcon fontSize="small" />
                    </IconButton>
                  )
                }
              >
                <Avatar
                  src={coverPreview}
                  sx={{ width: 100, height: 100, mx: 'auto', mb: 1 }}
                  variant="rounded"
                >
                  {!coverPreview && <PhotoCameraIcon sx={{ fontSize: 40 }} />}
                </Avatar>
              </Badge>
            </Box>
            <Button
              variant="outlined"
              component="label"
              startIcon={<CloudUploadIcon />}
              size="small"
              sx={{ mt: 1 }}
            >
              رفع غلاف
              <input
                type="file"
                hidden
                accept="image/*"
                onChange={handleCoverChange}
              />
            </Button>
            <Typography variant="caption" display="block" color="text.secondary" sx={{ mt: 0.5 }}>
              PNG, JPG, JPEG (Max 5MB)
            </Typography>
          </Paper>
        </Grid>

        {/* المعلومات الأساسية */}
        <Grid item xs={12}>
          <Typography variant="h6" sx={{ mb: 2, mt: 1 }}>
            المعلومات الأساسية
          </Typography>
        </Grid>

        <Grid item xs={12}>
          <TextField
            fullWidth
            name="name"
            label="اسم المتجر"
            value={formik.values.name}
            onChange={formik.handleChange}
            error={formik.touched.name && Boolean(formik.errors.name)}
            helperText={formik.touched.name && formik.errors.name}
            disabled={loading}
            required
          />
        </Grid>

        <Grid item xs={12}>
          <TextField
            fullWidth
            name="description"
            label="الوصف"
            multiline
            rows={3}
            value={formik.values.description}
            onChange={formik.handleChange}
            error={formik.touched.description && Boolean(formik.errors.description)}
            helperText={formik.touched.description && formik.errors.description}
            disabled={loading}
            required
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            select
            name="category"
            label="التصنيف"
            value={formik.values.category}
            onChange={formik.handleChange}
            error={formik.touched.category && Boolean(formik.errors.category)}
            helperText={formik.touched.category && formik.errors.category}
            disabled={loading}
            required
          >
            <MenuItem value="">اختر تصنيف</MenuItem>
            {categories.map(c => (
              <MenuItem key={c.value} value={c.value}>
                {c.label}
              </MenuItem>
            ))}
          </TextField>
        </Grid>

        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            name="phone"
            label="رقم الهاتف"
            value={formik.values.phone}
            onChange={formik.handleChange}
            error={formik.touched.phone && Boolean(formik.errors.phone)}
            helperText={formik.touched.phone && formik.errors.phone}
            disabled={loading}
            required
            InputProps={{
              startAdornment: <InputAdornment position="start">+</InputAdornment>,
            }}
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            name="email"
            label="البريد الإلكتروني"
            type="email"
            value={formik.values.email}
            onChange={formik.handleChange}
            error={formik.touched.email && Boolean(formik.errors.email)}
            helperText={formik.touched.email && formik.errors.email}
            disabled={loading}
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            name="website"
            label="الموقع الإلكتروني"
            value={formik.values.website}
            onChange={formik.handleChange}
            error={formik.touched.website && Boolean(formik.errors.website)}
            helperText={formik.touched.website && formik.errors.website}
            disabled={loading}
          />
        </Grid>

        {/* ✅ حقل مالك المتجر - يظهر فقط عند إنشاء متجر جديد */}
        {!isEdit && (
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              select
              name="owner"
              label="مالك المتجر (التاجر)"
              value={formik.values.owner}
              onChange={formik.handleChange}
              error={formik.touched.owner && Boolean(formik.errors.owner)}
              helperText={formik.touched.owner && formik.errors.owner}
              disabled={loading || vendorsLoading}
              required
              SelectProps={{
                renderValue: renderVendorValue,
              }}
            >
              <MenuItem value="">
                <em>اختر التاجر</em>
              </MenuItem>
              {vendorsLoading ? (
                <MenuItem disabled>
                  <Box display="flex" alignItems="center" gap={1}>
                    <CircularProgress size={20} />
                    جاري تحميل التجار...
                  </Box>
                </MenuItem>
              ) : (
                vendors.map((vendor) => (
                  <MenuItem key={vendor._id || vendor.id} value={vendor._id || vendor.id}>
                    <Box display="flex" alignItems="center" gap={2} justifyContent="space-between" width="100%">
                      <Box display="flex" alignItems="center" gap={1}>
                        <Avatar src={vendor.avatar} sx={{ width: 32, height: 32 }}>
                          {vendor.name?.charAt(0)}
                        </Avatar>
                        <Box>
                          <Typography variant="body2" fontWeight="medium">
                            {vendor.name}
                          </Typography>
                          <Typography variant="caption" color="textSecondary">
                            {vendor.phone} {vendor.email ? `• ${vendor.email}` : ''}
                          </Typography>
                        </Box>
                      </Box>
                      {vendor.isVerified && (
                        <Chip label="موثق" size="small" color="success" sx={{ height: 20 }} />
                      )}
                    </Box>
                  </MenuItem>
                ))
              )}
            </TextField>
            <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
              اختر التاجر الذي سيمتلك هذا المتجر
            </Typography>
          </Grid>
        )}

        <Grid item xs={12}>
          <FormControlLabel
            control={
              <Switch
                name="isOpen"
                checked={formik.values.isOpen}
                onChange={formik.handleChange}
                disabled={loading}
              />
            }
            label="المتجر مفتوح حالياً"
          />
        </Grid>

        {/* التاغات */}
        <Grid item xs={12}>
          <TextField
            fullWidth
            label="التاغات (كلمات مفتاحية)"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
            placeholder="أدخل تاغ ثم اضغط Enter"
            disabled={loading}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={handleAddTag} disabled={!tagInput.trim()}>
                    <AddIcon />
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
          <Stack direction="row" spacing={1} sx={{ mt: 1, flexWrap: 'wrap', gap: 1 }}>
            {formik.values.tags.map((tag, index) => (
              <Chip
                key={index}
                label={tag}
                onDelete={() => handleDeleteTag(tag)}
                disabled={loading}
                size="small"
              />
            ))}
          </Stack>
        </Grid>

        {/* العنوان مع إحداثيات GPS */}
        <Grid item xs={12}>
          <Accordion
            expanded={expandedSections.address}
            onChange={() => toggleSection('address')}
            sx={{ mt: 1 }}
          >
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Box display="flex" alignItems="center" gap={1}>
                <LocationIcon color="primary" />
                <Typography>العنوان والإحداثيات</Typography>
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    name="address.street"
                    label="الشارع"
                    value={formik.values.address.street}
                    onChange={formik.handleChange}
                    disabled={loading}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    name="address.city"
                    label="المدينة"
                    value={formik.values.address.city}
                    onChange={formik.handleChange}
                    disabled={loading}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    name="address.state"
                    label="الولاية/المنطقة"
                    value={formik.values.address.state}
                    onChange={formik.handleChange}
                    disabled={loading}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    name="address.country"
                    label="الدولة"
                    value={formik.values.address.country}
                    onChange={formik.handleChange}
                    disabled={loading}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    name="address.postalCode"
                    label="الرمز البريدي"
                    value={formik.values.address.postalCode}
                    onChange={formik.handleChange}
                    disabled={loading}
                  />
                </Grid>

                <Grid item xs={12}>
                  <Divider sx={{ my: 1 }}>
                    <Box display="flex" alignItems="center" gap={1}>
                      <MapIcon fontSize="small" />
                      <Typography variant="caption">إحداثيات الموقع (GPS)</Typography>
                    </Box>
                  </Divider>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    name="address.latitude"
                    label="خط العرض (Latitude)"
                    type="number"
                    value={formik.values.address.latitude}
                    onChange={formik.handleChange}
                    error={formik.touched.address?.latitude && Boolean(formik.errors.address?.latitude)}
                    helperText={formik.touched.address?.latitude && formik.errors.address?.latitude}
                    disabled={loading}
                    InputProps={{
                      startAdornment: <InputAdornment position="start">🌐</InputAdornment>,
                    }}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    name="address.longitude"
                    label="خط الطول (Longitude)"
                    type="number"
                    value={formik.values.address.longitude}
                    onChange={formik.handleChange}
                    error={formik.touched.address?.longitude && Boolean(formik.errors.address?.longitude)}
                    helperText={formik.touched.address?.longitude && formik.errors.address?.longitude}
                    disabled={loading}
                    InputProps={{
                      startAdornment: <InputAdornment position="start">🌐</InputAdornment>,
                    }}
                  />
                </Grid>

                <Grid item xs={12}>
                  <Button
                    variant="outlined"
                    startIcon={<MapIcon />}
                    onClick={getCurrentLocation}
                    disabled={loading}
                    fullWidth
                  >
                    استخدام موقعي الحالي
                  </Button>
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                    اضغط الزر لتحديد إحداثيات موقع المتجر تلقائياً
                  </Typography>
                </Grid>
              </Grid>
            </AccordionDetails>
          </Accordion>
        </Grid>

        {/* معلومات التوصيل */}
        <Grid item xs={12}>
          <Accordion
            expanded={expandedSections.delivery}
            onChange={() => toggleSection('delivery')}
          >
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Box display="flex" alignItems="center" gap={1}>
                <DeliveryIcon color="primary" />
                <Typography>معلومات التوصيل</Typography>
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Switch
                        name="deliveryInfo.hasDelivery"
                        checked={formik.values.deliveryInfo.hasDelivery}
                        onChange={formik.handleChange}
                        disabled={loading}
                      />
                    }
                    label="يتوفر توصيل"
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    name="deliveryInfo.deliveryFee"
                    label="رسوم التوصيل"
                    type="number"
                    value={formik.values.deliveryInfo.deliveryFee}
                    onChange={formik.handleChange}
                    error={formik.touched.deliveryInfo?.deliveryFee && Boolean(formik.errors.deliveryInfo?.deliveryFee)}
                    helperText={formik.touched.deliveryInfo?.deliveryFee && formik.errors.deliveryInfo?.deliveryFee}
                    disabled={loading}
                    InputProps={{
                      startAdornment: <InputAdornment position="start">CFA</InputAdornment>,
                    }}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    name="deliveryInfo.minOrderAmount"
                    label="الحد الأدنى للطلب"
                    type="number"
                    value={formik.values.deliveryInfo.minOrderAmount}
                    onChange={formik.handleChange}
                    disabled={loading}
                    InputProps={{
                      startAdornment: <InputAdornment position="start">CFA</InputAdornment>,
                    }}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    name="deliveryInfo.estimatedDeliveryTime"
                    label="الوقت المقدر للتوصيل (دقائق)"
                    type="number"
                    value={formik.values.deliveryInfo.estimatedDeliveryTime}
                    onChange={formik.handleChange}
                    disabled={loading}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    name="deliveryInfo.deliveryRadius"
                    label="نطاق التوصيل (كم)"
                    type="number"
                    value={formik.values.deliveryInfo.deliveryRadius}
                    onChange={formik.handleChange}
                    disabled={loading}
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    name="deliveryInfo.freeDeliveryThreshold"
                    label="الحد الأدنى للتوصيل المجاني"
                    type="number"
                    value={formik.values.deliveryInfo.freeDeliveryThreshold}
                    onChange={formik.handleChange}
                    disabled={loading}
                    InputProps={{
                      startAdornment: <InputAdornment position="start">CFA</InputAdornment>,
                    }}
                  />
                </Grid>
              </Grid>
            </AccordionDetails>
          </Accordion>
        </Grid>

        {/* ساعات العمل */}
        <Grid item xs={12}>
          <Accordion
            expanded={expandedSections.hours}
            onChange={() => toggleSection('hours')}
          >
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Box display="flex" alignItems="center" gap={1}>
                <ScheduleIcon color="primary" />
                <Typography>ساعات العمل</Typography>
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={2}>
                {daysOfWeek.map((day) => (
                  <Grid item xs={12} key={day.value}>
                    <Paper variant="outlined" sx={{ p: 2 }}>
                      <Grid container spacing={2} alignItems="center">
                        <Grid item xs={12} sm={3}>
                          <FormControlLabel
                            control={
                              <Switch
                                name={`openingHours.${day.value}.isOpen`}
                                checked={formik.values.openingHours[day.value]?.isOpen}
                                onChange={formik.handleChange}
                                disabled={loading}
                              />
                            }
                            label={day.label}
                          />
                        </Grid>
                        {formik.values.openingHours[day.value]?.isOpen && (
                          <>
                            <Grid item xs={12} sm={4}>
                              <TextField
                                fullWidth
                                name={`openingHours.${day.value}.open`}
                                label="وقت الفتح"
                                type="time"
                                value={formik.values.openingHours[day.value]?.open || '09:00'}
                                onChange={formik.handleChange}
                                disabled={loading}
                                InputLabelProps={{ shrink: true }}
                              />
                            </Grid>
                            <Grid item xs={12} sm={4}>
                              <TextField
                                fullWidth
                                name={`openingHours.${day.value}.close`}
                                label="وقت الإغلاق"
                                type="time"
                                value={formik.values.openingHours[day.value]?.close || '22:00'}
                                onChange={formik.handleChange}
                                disabled={loading}
                                InputLabelProps={{ shrink: true }}
                              />
                            </Grid>
                          </>
                        )}
                      </Grid>
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            </AccordionDetails>
          </Accordion>
        </Grid>
      </Grid>

      <Box display="flex" justifyContent="flex-end" gap={2} sx={{ mt: 3 }}>
        <Button onClick={onCancel} disabled={loading}>
          إلغاء
        </Button>
        <Button type="submit" variant="contained" disabled={loading}>
          {loading ? <CircularProgress size={24} /> : (isEdit ? 'تحديث' : 'إضافة')}
        </Button>
      </Box>
    </form>
  );
}