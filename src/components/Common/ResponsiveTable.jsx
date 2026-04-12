// src/components/Common/ResponsiveTable.jsx - تحسين معالجة الخلايا

import { 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow, 
  Paper, 
  Box, 
  Typography, 
  Card,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import { memo } from 'react';

const ResponsiveTable = memo(({ 
  data = [], 
  columns = [], 
  onRowClick, 
  renderMobileCard,
  emptyMessage = 'لا توجد بيانات',
  loading = false,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'));

  // عرض رسالة التحميل
  if (loading) {
    return (
      <Box textAlign="center" py={4}>
        <Typography color="textSecondary">جاري التحميل...</Typography>
      </Box>
    );
  }

  // عرض رسالة عدم وجود بيانات
  if (!data || data.length === 0) {
    return (
      <Box textAlign="center" py={4}>
        <Typography color="textSecondary">{emptyMessage}</Typography>
      </Box>
    );
  }

  // ✅ دالة مساعدة للحصول على id
  const getItemId = (item, index) => {
    return item._id || item.id || `item-${index}`;
  };

  // ✅ دالة مساعدة لعرض قيمة الخلية بشكل آمن
  const renderCellValue = (column, row) => {
    // إذا كان هناك renderCell مخصص
    if (column.renderCell) {
      return column.renderCell({ row, value: row[column.field] });
    }
    
    // إذا كان هناك valueGetter
    if (column.valueGetter) {
      const value = column.valueGetter(row);
      // التأكد من أن القيمة ليست كائن
      if (typeof value === 'object' && value !== null) {
        console.warn(`Column ${column.field} returned an object:`, value);
        return JSON.stringify(value);
      }
      return value !== undefined && value !== null ? value : '-';
    }
    
    // الحصول على القيمة مباشرة
    let value = row[column.field];
    
    // التأكد من أن القيمة ليست كائن
    if (typeof value === 'object' && value !== null) {
      console.warn(`Field ${column.field} contains an object:`, value);
      // محاولة استخراج قيمة من الكائن
      if (value.name) return value.name;
      if (value.label) return value.label;
      if (value.id) return value.id;
      return JSON.stringify(value);
    }
    
    // استخدام valueFormatter إذا وجد
    if (column.valueFormatter) {
      return column.valueFormatter(value);
    }
    
    return value !== undefined && value !== null ? value : '-';
  };

  // عرض كبطاقات على الهواتف
  if (isMobile) {
    if (renderMobileCard) {
      return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          {data.map((item, index) => (
            <div key={getItemId(item, index)}>
              {renderMobileCard(item, index)}
            </div>
          ))}
        </Box>
      );
    }

    // عرض بطاقة افتراضية
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
        {data.map((item, index) => (
          <Card 
            key={getItemId(item, index)} 
            sx={{ 
              p: 1.5, 
              cursor: onRowClick ? 'pointer' : 'default',
              '&:hover': onRowClick ? { bgcolor: 'action.hover' } : {}
            }}
            onClick={() => onRowClick && onRowClick(item)}
          >
            {columns.map((column) => {
              if (column.hideOnMobile) return null;
              const displayValue = renderCellValue(column, item);
              
              return (
                <Box key={column.field} display="flex" justifyContent="space-between" mb={1}>
                  <Typography variant="caption" color="textSecondary">
                    {column.headerName}:
                  </Typography>
                  <Box>
                    {typeof displayValue === 'string' || typeof displayValue === 'number' ? (
                      <Typography variant="body2">{displayValue}</Typography>
                    ) : (
                      displayValue
                    )}
                  </Box>
                </Box>
              );
            })}
          </Card>
        ))}
      </Box>
    );
  }

  // عرض كجدول على الشاشات الكبيرة
  return (
    <TableContainer component={Paper} sx={{ overflowX: 'auto' }}>
      <Table size={isTablet ? "small" : "medium"}>
        <TableHead>
          <TableRow>
            {columns.map((column) => (
              !column.hideOnDesktop && (
                <TableCell 
                  key={column.field} 
                  align={column.align || 'left'}
                  sx={{ 
                    width: column.width,
                    minWidth: column.minWidth,
                    fontWeight: 600,
                  }}
                >
                  {column.headerName}
                </TableCell>
              )
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {data.map((item, index) => (
            <TableRow 
              key={getItemId(item, index)}
              hover={!!onRowClick}
              onClick={() => onRowClick && onRowClick(item)}
              sx={{ 
                cursor: onRowClick ? 'pointer' : 'default',
                '&:hover': onRowClick ? { bgcolor: 'action.hover' } : {}
              }}
            >
              {columns.map((column) => (
                !column.hideOnDesktop && (
                  <TableCell key={column.field} align={column.align || 'left'}>
                    {renderCellValue(column, item)}
                  </TableCell>
                )
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
});

ResponsiveTable.displayName = 'ResponsiveTable';

export default ResponsiveTable;