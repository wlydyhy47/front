// src/components/Common/ResponsiveDialog.jsx - نسخة محسنة

import { Dialog, DialogTitle, DialogContent, DialogActions, useTheme, useMediaQuery } from '@mui/material';
import { memo } from 'react';

/**
 * مكون حوار متجاوب - يتكيف مع حجم الشاشة
 * 
 * @param {boolean} open - حالة فتح الحوار
 * @param {Function} onClose - دالة الإغلاق
 * @param {string} title - عنوان الحوار
 * @param {ReactNode} children - محتوى الحوار
 * @param {ReactNode} actions - أزرار الإجراءات
 * @param {string} maxWidth - أقصى عرض (xs, sm, md, lg, xl)
 * @param {boolean} fullScreenOnMobile - عرض كامل الشاشة على الهواتف
 */
const ResponsiveDialog = memo(({
  open,
  onClose,
  title,
  children,
  actions,
  maxWidth = 'sm',
  fullScreenOnMobile = true,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const fullScreen = isMobile && fullScreenOnMobile;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullScreen={fullScreen}
      maxWidth={maxWidth}
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: fullScreen ? 0 : { xs: 2, sm: 3 },
          margin: fullScreen ? 0 : { xs: 2, sm: 3 },
        }
      }}
    >
      <DialogTitle sx={{ 
        pb: 1,
        fontSize: { xs: '1.1rem', sm: '1.25rem' },
        fontWeight: 600,
      }}>
        {title}
      </DialogTitle>
      <DialogContent dividers={!fullScreen} sx={{ p: { xs: 2, sm: 3 } }}>
        {children}
      </DialogContent>
      {actions && (
        <DialogActions sx={{ p: { xs: 2, sm: 3 }, pt: { xs: 1, sm: 2 } }}>
          {actions}
        </DialogActions>
      )}
    </Dialog>
  );
});

ResponsiveDialog.displayName = 'ResponsiveDialog';

export default ResponsiveDialog;