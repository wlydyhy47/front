import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Chip } from '@mui/material';
import { formatDate, formatCurrency } from '../../../utils/formatters';

export default function DriverOrders({ orders = [] }) {
  return (
    <TableContainer component={Paper}>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>رقم الطلب</TableCell>
            <TableCell>العميل</TableCell>
            <TableCell>المتجر</TableCell>
            <TableCell>المبلغ</TableCell>
            <TableCell>الحالة</TableCell>
            <TableCell>التاريخ</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {orders.map((order) => (
            // ✅ FIXED: استخدام order._id بدلاً من order.id
            <TableRow key={order._id}>
              <TableCell>#{order._id?.slice(-6)}</TableCell>
              <TableCell>{order.user?.name || order.userId}</TableCell>
              <TableCell>{order.store?.name || order.storeId}</TableCell>
              <TableCell>{formatCurrency(order.totalPrice)}</TableCell>
              <TableCell><Chip label={order.status} size="small" /></TableCell>
              <TableCell>{formatDate(order.createdAt)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}