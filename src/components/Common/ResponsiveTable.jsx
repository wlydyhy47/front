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
  Chip,
  IconButton,
  useTheme,
  useMediaQuery 
} from '@mui/material';
import { Visibility } from '@mui/icons-material';

/**
 * مكون جدول متجاوب - يعرض كجدول على الشاشات الكبيرة وكبطاقات على الهواتف
 * 
 * @param {Array} data - مصفوفة البيانات
 * @param {Array} columns - أعمدة الجدول
 * @param {Function} onRowClick - دالة عند النقر على صف (اختياري)
 * @param {Function} renderMobileCard - دالة لتخصيص عرض البطاقة على الهواتف (اختياري)
 * @param {string} emptyMessage - رسالة عند عدم وجود بيانات
 */
export default function ResponsiveTable({ 
  data = [], 
  columns = [], 
  onRowClick, 
  renderMobileCard,
  emptyMessage = 'لا توجد بيانات',
  loading = false,
}) {
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

  // عرض كبطاقات على الهواتف
  if (isMobile) {
    // إذا كان هناك دالة مخصصة لعرض البطاقات
    if (renderMobileCard) {
      return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          {data.map((item, index) => renderMobileCard(item, index))}
        </Box>
      );
    }

    // عرض بطاقة افتراضية
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
        {data.map((item, index) => (
          <Card 
            key={item.id || index} 
            sx={{ 
              p: 1.5, 
              cursor: onRowClick ? 'pointer' : 'default',
              '&:hover': onRowClick ? { bgcolor: 'action.hover' } : {}
            }}
            onClick={() => onRowClick && onRowClick(item)}
          >
            {columns.map((column) => {
              const value = column.valueGetter ? column.valueGetter(item) : item[column.field];
              if (column.hideOnMobile) return null;
              
              return (
                <Box key={column.field} display="flex" justifyContent="space-between" mb={1}>
                  <Typography variant="caption" color="textSecondary">
                    {column.headerName}:
                  </Typography>
                  <Box>
                    {column.renderCell ? column.renderCell({ row: item, value }) : (
                      <Typography variant="body2">
                        {value || '-'}
                      </Typography>
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
              key={item.id || index}
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
                    {column.renderCell ? column.renderCell({ row: item, value: item[column.field] }) : (
                      column.valueFormatter ? column.valueFormatter(item[column.field]) : (item[column.field] || '-')
                    )}
                  </TableCell>
                )
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}