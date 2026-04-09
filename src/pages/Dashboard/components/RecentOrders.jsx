import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Tooltip,
  Box,
  Typography,
  Card,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import { Visibility } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { formatDate, formatCurrency } from '../../../utils/formatters';

const statusColors = {
  pending: 'warning',
  accepted: 'info',
  ready: 'primary',
  picked: 'secondary',
  delivered: 'success',
  cancelled: 'error',
};

const statusLabels = {
  pending: 'قيد الانتظار',
  accepted: 'مقبول',
  ready: 'جاهز',
  picked: 'تم الاستلام',
  delivered: 'تم التوصيل',
  cancelled: 'ملغي',
};

export default function RecentOrders({ orders = [] }) {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  if (isMobile) {
    // عرض بطاقات للهواتف بدلاً من الجدول
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
        {orders.map((order) => (
          // ✅ FIXED: استخدام order._id بدلاً من order.id
          <Card key={order._id} sx={{ p: 1.5 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
              <Typography variant="subtitle2" fontWeight="bold">
                #{order._id?.slice(-6)}
              </Typography>
              <Chip
                label={statusLabels[order.status] || order.status}
                size="small"
                color={statusColors[order.status] || 'default'}
              />
            </Box>
            <Typography variant="body2" color="textSecondary">
              {order.user?.name || order.userId}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              {order.store?.name || order.storeId}
            </Typography>
            <Box display="flex" justifyContent="space-between" alignItems="center" mt={1}>
              <Typography variant="body2" fontWeight="bold">
                {formatCurrency(order.totalPrice)}
              </Typography>
              <Typography variant="caption" color="textSecondary">
                {formatDate(order.createdAt, 'HH:mm')}
              </Typography>
              <IconButton
                size="small"
                onClick={() => navigate(`/orders/${order._id}`)}
              >
                <Visibility fontSize="small" />
              </IconButton>
            </Box>
          </Card>
        ))}
      </Box>
    );
  }
  
  // عرض جدول للشاشات الكبيرة
  return (
    <TableContainer sx={{ overflowX: 'auto' }}>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>رقم الطلب</TableCell>
            <TableCell>العميل</TableCell>
            <TableCell>المتجر</TableCell>
            <TableCell>المبلغ</TableCell>
            <TableCell>الحالة</TableCell>
            <TableCell>التاريخ</TableCell>
            <TableCell></TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {orders.map((order) => (
            // ✅ FIXED: استخدام order._id بدلاً من order.id
            <TableRow key={order._id} hover>
              <TableCell>#{order._id?.slice(-6)}</TableCell>
              <TableCell>{order.user?.name || order.userId}</TableCell>
              <TableCell>{order.store?.name || order.storeId}</TableCell>
              <TableCell>{formatCurrency(order.totalPrice)}</TableCell>
              <TableCell>
                <Chip
                  label={statusLabels[order.status] || order.status}
                  size="small"
                  color={statusColors[order.status] || 'default'}
                />
              </TableCell>
              <TableCell>{formatDate(order.createdAt, 'HH:mm')}</TableCell>
              <TableCell>
                <Tooltip title="عرض التفاصيل">
                  <IconButton
                    size="small"
                    onClick={() => navigate(`/orders/${order._id}`)}
                  >
                    <Visibility fontSize="small" />
                  </IconButton>
                </Tooltip>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}