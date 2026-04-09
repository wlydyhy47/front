import { useState } from 'react';
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
  Chip,
  Typography,
} from '@mui/material';
import { Add, CloudUpload } from '@mui/icons-material';
import { productsService, storesService } from '../../../api';
import { useQuery } from 'react-query';

const validationSchema = Yup.object({
  name: Yup.string().required('اسم المنتج مطلوب').min(2, 'الاسم يجب أن يكون حرفين على الأقل'),
  price: Yup.number().required('السعر مطلوب').positive('السعر يجب أن يكون موجباً'),
  discountedPrice: Yup.number().positive('السعر بعد الخصم يجب أن يكون موجباً'),
  category: Yup.string().required('التصنيف مطلوب'),
  description: Yup.string().max(500, 'الوصف طويل جداً'),
  preparationTime: Yup.number().min(0).max(60),
  isAvailable: Yup.boolean(),
  isVegetarian: Yup.boolean(),
  isVegan: Yup.boolean(),
  isGlutenFree: Yup.boolean(),
  spicyLevel: Yup.number().min(0).max(3),
});

export default function ProductForm({ product, onSuccess, onCancel }) {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [ingredients, setIngredients] = useState(product?.ingredients || []);
  const [newIngredient, setNewIngredient] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(product?.image || '');
  const isEdit = !!product;

  // جلب المتاجر
  const { data: storesData, isLoading: storesLoading } = useQuery(
    'stores-list',
    () => storesService.getStores({ limit: 100 })
  );

  // استخراج المتاجر من الاستجابة
  const stores = storesData?.data || [];

  const formik = useFormik({
    initialValues: {
      name: product?.name || '',
      price: product?.price || '',
      discountedPrice: product?.discountedPrice || '',
      category: product?.category || '',
      description: product?.description || '',
      preparationTime: product?.preparationTime || 15,
      isAvailable: product?.isAvailable !== undefined ? product.isAvailable : true,
      isVegetarian: product?.isVegetarian || false,
      isVegan: product?.isVegan || false,
      isGlutenFree: product?.isGlutenFree || false,
      spicyLevel: product?.spicyLevel || 0,
      store: product?.store?.id || product?.storeId || product?.store?._id || '',
    },
    validationSchema,
    onSubmit: async (values) => {
      setLoading(true);
      setError('');

      try {
        // إنشاء FormData لإرسال البيانات مع الصورة
        const formData = new FormData();

        // ✅ إضافة الحقول الأساسية
        formData.append('name', values.name);
        formData.append('price', Number(values.price));
        formData.append('category', values.category);
        formData.append('description', values.description || '');
        formData.append('preparationTime', Number(values.preparationTime));
        formData.append('isAvailable', values.isAvailable);
        
        // ✅ مهم: إرسال store ID (للمشرف فقط)
        if (values.store) {
          formData.append('store', values.store);
        }

        // ✅ الحقول الاختيارية
        if (values.discountedPrice) {
          formData.append('discountedPrice', Number(values.discountedPrice));
        }

        // ✅ FIXED: Removed duplicate spicyLevel - it's already in attributes
        // if (values.spicyLevel !== undefined) {
        //   formData.append('spicyLevel', Number(values.spicyLevel));
        // }

        // ✅ الخصائص في كائن attributes
        const attributes = {
          spicyLevel: Number(values.spicyLevel || 0),
          isVegetarian: values.isVegetarian,
          isVegan: values.isVegan,
          isGlutenFree: values.isGlutenFree
        };
        formData.append('attributes', JSON.stringify(attributes));

        // ✅ المكونات
        if (ingredients.length > 0) {
          formData.append('ingredients', ingredients.join(','));
        }

        // ✅ صورة المنتج
        if (imageFile) {
          console.log('📸 Adding image to FormData:', imageFile.name);
          formData.append('image', imageFile);
        } else {
          console.warn('⚠️ No image file selected');
        }

        // ✅ المخزون الافتراضي
        const inventory = {
          quantity: 0,
          unit: 'piece',
          lowStockThreshold: 5,
          trackInventory: false
        };
        formData.append('inventory', JSON.stringify(inventory));

        // ✅ إضافة tags إذا وجدت (اختياري)
        if (values.tags && values.tags.length > 0) {
          formData.append('tags', values.tags.join(','));
        }

        // ✅ إضافة options إذا وجدت (اختياري - للإضافات مثل الحجم، النكهات)
        if (values.options && values.options.length > 0) {
          formData.append('options', JSON.stringify(values.options));
        }

        // ✅ تسجيل جميع البيانات للـ debugging
        console.log('📦 FormData entries:');
        for (let pair of formData.entries()) {
          if (pair[1] instanceof File) {
            console.log(pair[0], '=', pair[1].name, '(File)');
          } else {
            console.log(pair[0], '=', pair[1]);
          }
        }

        if (isEdit) {
          await productsService.updateProduct(product._id, formData);
        } else {
          await productsService.createProduct(formData);
        }
        onSuccess();
      } catch (err) {
        console.error('❌ Error creating product:', err);
        console.error('❌ Error response:', err.response?.data);
        setError(err.response?.data?.message || 'حدث خطأ أثناء حفظ المنتج');
      } finally {
        setLoading(false);
      }
    },
  });

  const addIngredient = () => {
    if (newIngredient.trim()) {
      setIngredients([...ingredients, newIngredient.trim()]);
      setNewIngredient('');
    }
  };

  const removeIngredient = (index) => {
    setIngredients(ingredients.filter((_, i) => i !== index));
  };

  const handleImageChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      console.log('📸 Image selected:', file.name, file.size);
      setImageFile(file);
      // إنشاء معاينة للصورة
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const categories = [
    'وجبات رئيسية',
    'مقبلات',
    'مشروبات',
    'حلويات',
    'سلطات',
    'عصائر',
    'قهوة',
    'ساندويشات',
    'بيتزا',
    'باستا',
  ];

  return (
    <form onSubmit={formik.handleSubmit}>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      <Grid container spacing={2}>
        {!isEdit && (
          <Grid item xs={12}>
            <TextField
              fullWidth
              select
              name="store"
              label="المتجر"
              value={formik.values.store}
              onChange={formik.handleChange}
              error={formik.touched.store && Boolean(formik.errors.store)}
              helperText={formik.touched.store && formik.errors.store}
              disabled={loading || storesLoading}
              required
            >
              <MenuItem value="">اختر متجر</MenuItem>
              {stores.length > 0 ? (
                stores.map((store) => (
                  <MenuItem key={store._id} value={store._id}>
                    {store.name}
                  </MenuItem>
                ))
              ) : (
                <MenuItem disabled>لا توجد متاجر</MenuItem>
              )}
            </TextField>
          </Grid>
        )}

        <Grid item xs={12}>
          <TextField
            fullWidth
            name="name"
            label="اسم المنتج"
            value={formik.values.name}
            onChange={formik.handleChange}
            error={formik.touched.name && Boolean(formik.errors.name)}
            helperText={formik.touched.name && formik.errors.name}
            disabled={loading}
            required
          />
        </Grid>

        <Grid item xs={12}>
          <Button
            variant="outlined"
            component="label"
            fullWidth
            startIcon={<CloudUpload />}
            sx={{ mb: 1 }}
            disabled={loading}
          >
            {imagePreview ? 'تغيير صورة المنتج' : 'رفع صورة المنتج'}
            <input
              type="file"
              hidden
              accept="image/*"
              onChange={handleImageChange}
              disabled={loading}
            />
          </Button>
          {imagePreview && (
            <Box sx={{ mt: 1, textAlign: 'center' }}>
              <img
                src={imagePreview}
                alt="Product preview"
                style={{
                  maxWidth: '100%',
                  maxHeight: '150px',
                  borderRadius: '8px',
                  objectFit: 'cover'
                }}
              />
              <Typography variant="caption" color="success.main" display="block">
                {imageFile ? `تم اختيار: ${imageFile.name}` : 'الصورة الحالية'}
              </Typography>
            </Box>
          )}
        </Grid>

        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            name="price"
            label="السعر"
            type="number"
            InputProps={{
              startAdornment: <InputAdornment position="start">₪</InputAdornment>,
            }}
            value={formik.values.price}
            onChange={formik.handleChange}
            error={formik.touched.price && Boolean(formik.errors.price)}
            helperText={formik.touched.price && formik.errors.price}
            disabled={loading}
            required
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            name="discountedPrice"
            label="السعر بعد الخصم (اختياري)"
            type="number"
            InputProps={{
              startAdornment: <InputAdornment position="start">₪</InputAdornment>,
            }}
            value={formik.values.discountedPrice}
            onChange={formik.handleChange}
            error={formik.touched.discountedPrice && Boolean(formik.errors.discountedPrice)}
            helperText={formik.touched.discountedPrice && formik.errors.discountedPrice}
            disabled={loading}
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
            {categories.map((cat) => (
              <MenuItem key={cat} value={cat}>
                {cat}
              </MenuItem>
            ))}
          </TextField>
        </Grid>

        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            name="preparationTime"
            label="وقت التحضير (دقائق)"
            type="number"
            value={formik.values.preparationTime}
            onChange={formik.handleChange}
            error={formik.touched.preparationTime && Boolean(formik.errors.preparationTime)}
            helperText={formik.touched.preparationTime && formik.errors.preparationTime}
            disabled={loading}
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
          />
        </Grid>

        <Grid item xs={12}>
          <Typography variant="subtitle2" gutterBottom>
            المكونات
          </Typography>
          <Box display="flex" gap={1}>
            <TextField
              fullWidth
              size="small"
              placeholder="أضف مكون..."
              value={newIngredient}
              onChange={(e) => setNewIngredient(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addIngredient()}
              disabled={loading}
            />
            <Button variant="outlined" onClick={addIngredient} disabled={loading}>
              <Add />
            </Button>
          </Box>
          <Box display="flex" flexWrap="wrap" gap={1} mt={1}>
            {ingredients.map((ing, index) => (
              <Chip
                key={index}
                label={ing}
                onDelete={() => removeIngredient(index)}
                size="small"
              />
            ))}
          </Box>
        </Grid>

        <Grid item xs={12}>
          <Typography variant="subtitle2" gutterBottom>
            الخصائص
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={6} sm={3}>
              <FormControlLabel
                control={
                  <Switch
                    name="isAvailable"
                    checked={formik.values.isAvailable}
                    onChange={formik.handleChange}
                    disabled={loading}
                  />
                }
                label="متاح"
              />
            </Grid>
            <Grid item xs={6} sm={3}>
              <FormControlLabel
                control={
                  <Switch
                    name="isVegetarian"
                    checked={formik.values.isVegetarian}
                    onChange={formik.handleChange}
                    disabled={loading}
                  />
                }
                label="نباتي"
              />
            </Grid>
            <Grid item xs={6} sm={3}>
              <FormControlLabel
                control={
                  <Switch
                    name="isVegan"
                    checked={formik.values.isVegan}
                    onChange={formik.handleChange}
                    disabled={loading}
                  />
                }
                label="فيجان"
              />
            </Grid>
            <Grid item xs={6} sm={3}>
              <FormControlLabel
                control={
                  <Switch
                    name="isGlutenFree"
                    checked={formik.values.isGlutenFree}
                    onChange={formik.handleChange}
                    disabled={loading}
                  />
                }
                label="خالٍ من الجلوتين"
              />
            </Grid>
          </Grid>
        </Grid>

        <Grid item xs={12}>
          <TextField
            fullWidth
            select
            name="spicyLevel"
            label="مستوى الحرارة"
            value={formik.values.spicyLevel}
            onChange={formik.handleChange}
            disabled={loading}
          >
            <MenuItem value={0}>بدون حار</MenuItem>
            <MenuItem value={1}>خفيف</MenuItem>
            <MenuItem value={2}>متوسط</MenuItem>
            <MenuItem value={3}>حار جداً</MenuItem>
          </TextField>
        </Grid>
      </Grid>

      <Box display="flex" justifyContent="flex-end" gap={2} sx={{ mt: 3 }}>
        <Button onClick={onCancel} disabled={loading}>
          إلغاء
        </Button>
        <Button
          type="submit"
          variant="contained"
          disabled={loading || (!isEdit && !formik.values.store)}
        >
          {loading ? <CircularProgress size={24} /> : isEdit ? 'تحديث' : 'إضافة'}
        </Button>
      </Box>
    </form>
  );
}