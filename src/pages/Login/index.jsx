import { useState } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Alert,
  CircularProgress,
  InputAdornment,
  IconButton,
  Container,
  Avatar,
  useTheme,
} from '@mui/material';
import { Visibility, VisibilityOff, Lock, Phone } from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';

// فيديو خلفية من مجلد public
// الخيار 1: إذا كان الفيديو مباشرة في مجلد public
const backgroundVideo = '/background.mp4';


// الخيار 3: إذا أردت استخدام فيديو احتياطي في حال لم يتم تحميل الفيديو
const fallbackImage = '/fallback-bg.jpg'; // صورة احتياطية اختيارية

const validationSchema = Yup.object({
  phone: Yup.string().required('رقم الهاتف مطلوب'),
  password: Yup.string().required('كلمة المرور مطلوبة'),
});

export default function Login() {
  const { login } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [videoError, setVideoError] = useState(false); // لمتابعة أخطاء الفيديو
  const theme = useTheme();
  
  const formik = useFormik({
    initialValues: {
      phone: '',
      password: '',
    },
    validationSchema,
    onSubmit: async (values) => {
      setLoading(true);
      setError('');
      
      try {
        const result = await login(values);
        if (!result.success) {
          setError(result.message);
        }
      } catch (err) {
        setError('حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.');
      } finally {
        setLoading(false);
      }
    },
  });
  
  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* فيديو الخلفية من مجلد public */}
      {!videoError ? (
        <video
          autoPlay
          loop
          muted
          playsInline
          onError={() => setVideoError(true)} // في حال خطأ في تحميل الفيديو
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            minWidth: '100%',
            minHeight: '100%',
            width: 'auto',
            height: 'auto',
            transform: 'translate(-50%, -50%)',
            objectFit: 'cover',
            zIndex: 0,
          }}
        >
          <source src={backgroundVideo} type="video/mp4" />
          متصفحك لا يدعم تشغيل الفيديو.
        </video>
      ) : (
        // صورة احتياطية في حال فشل تحميل الفيديو
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: `linear-gradient(135deg, ${theme.palette.primary.main}20, ${theme.palette.primary.dark}20), url(${fallbackImage})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            zIndex: 0,
          }}
        />
      )}
      
      {/* طبقة داكنة فوق الفيديو لتحسين وضوح النص */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          zIndex: 1,
        }}
      />
      
      <Container maxWidth="sm" sx={{ position: 'relative', zIndex: 2 }}>
        <Paper
          elevation={24}
          sx={{
            p: 4,
            borderRadius: 4,
            backdropFilter: 'blur(16px)',
            backgroundColor: 'rgba(255, 255, 255, 0.85)',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
            transition: 'transform 0.3s ease, box-shadow 0.3s ease',
            '&:hover': {
              transform: 'translateY(-5px)',
              boxShadow: '0 12px 48px rgba(0, 0, 0, 0.2)',
            },
          }}
        >
          {/* مساحة الشعار - بدون إطار */}
          <Box 
            sx={{ 
              display: 'flex', 
              justifyContent: 'center', 
              mb: 0,
              p: 0,
            }}
          >
            <Avatar
              src="/logo.png"
              alt="الشعار"
              sx={{
                width: 100,
                height: 100,
                scale:2
              }}
            />
          </Box>
          
          <Box textAlign="center" mb={0}>
            <Typography 
              variant="h4" 
              fontWeight="bold" 
              sx={{ 
                color: theme.palette.primary.main,
                mb: 1,
              }}
              gutterBottom
            >
              لوحة تحكم الأدمن
            </Typography>
            <Typography variant="body2" sx={{ color: 'rgba(0, 0, 0, 0.7)' }}>
             نظام إدارة منصة توصيل الطلبات  
            </Typography>
          </Box>
          
          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}
          
          <form onSubmit={formik.handleSubmit}>
            <TextField
              fullWidth
              name="phone"
              label="رقم الهاتف"
              value={formik.values.phone}
              onChange={formik.handleChange}
              error={formik.touched.phone && Boolean(formik.errors.phone)}
              helperText={formik.touched.phone && formik.errors.phone}
              margin="normal"
              sx={{
                '& .MuiOutlinedInput-root': {
                  backgroundColor: 'rgba(255, 255, 255, 0.7)',
                  backdropFilter: 'blur(4px)',
                  '&:hover fieldset': {
                    borderColor: theme.palette.primary.main,
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: theme.palette.primary.main,
                  },
                },
                '& .MuiInputLabel-root.Mui-focused': {
                  color: theme.palette.primary.main,
                },
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Phone sx={{ color: theme.palette.primary.main }} />
                  </InputAdornment>
                ),
              }}
            />
            
            <TextField
              fullWidth
              name="password"
              label="كلمة المرور"
              type={showPassword ? 'text' : 'password'}
              value={formik.values.password}
              onChange={formik.handleChange}
              error={formik.touched.password && Boolean(formik.errors.password)}
              helperText={formik.touched.password && formik.errors.password}
              margin="normal"
              sx={{
                '& .MuiOutlinedInput-root': {
                  backgroundColor: 'rgba(255, 255, 255, 0.7)',
                  backdropFilter: 'blur(4px)',
                  '&:hover fieldset': {
                    borderColor: theme.palette.primary.main,
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: theme.palette.primary.main,
                  },
                },
                '& .MuiInputLabel-root.Mui-focused': {
                  color: theme.palette.primary.main,
                },
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Lock sx={{ color: theme.palette.primary.main }} />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
            
            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              disabled={loading}
              sx={{ 
                mt: 3, 
                mb: 2, 
                py: 1.5,
                backgroundColor: theme.palette.primary.main,
                '&:hover': {
                  backgroundColor: theme.palette.primary.dark,
                },
              }}
            >
              {loading ? <CircularProgress size={24} color="inherit" /> : 'تسجيل الدخول'}
            </Button>
          </form>
          
          <Typography variant="caption" color="textSecondary" align="center" display="block">
            © {new Date().getFullYear()} منصة توصيل الطلبات - جميع الحقوق محفوظة
          </Typography>
        </Paper>
      </Container>
    </Box>
  );
}