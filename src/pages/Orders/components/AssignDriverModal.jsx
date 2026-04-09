import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from 'react-query';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
  Box,
  Typography,
  Avatar,
  Alert,
  CircularProgress,
} from '@mui/material';
import { ordersService, driversService } from '../../../api';

export default function AssignDriverModal({ open, onClose, orderId, onSuccess }) {
  const queryClient = useQueryClient();
  const [driverId, setDriverId] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  // جلب قائمة المندوبين المتاحين
  const { data: drivers, isLoading: driversLoading } = useQuery(
    'available-drivers',
    () => driversService.getDrivers({ isAvailable: true, limit: 50 }),
    { enabled: open }
  );
  
  const assignMutation = useMutation(
    () => ordersService.assignDriver(orderId, { driverId }),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('orders');
        onSuccess();
        onClose();
      },
      onError: (err) => {
        setError(err.response?.data?.message || 'فشل تعيين المندوب');
        setLoading(false);
      },
    }
  );
  
  const handleSubmit = () => {
    if (!driverId) {
      setError('الرجاء اختيار مندوب');
      return;
    }
    setError('');
    setLoading(true);
    assignMutation.mutate();
  };
  
  const availableDrivers = drivers?.data?.drivers || [];
  
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>تعيين مندوب للطلب #{orderId?.slice(-6)}</DialogTitle>
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        
        {driversLoading ? (
          <Box display="flex" justifyContent="center" p={3}>
            <CircularProgress />
          </Box>
        ) : (
          <TextField
            fullWidth
            select
            label="اختر المندوب"
            value={driverId}
            onChange={(e) => setDriverId(e.target.value)}
            margin="normal"
            SelectProps={{
              renderValue: (selected) => {
                // ✅ FIXED: استخدام driver._id بدلاً من driver.id
                const driver = availableDrivers.find(d => d._id === selected);
                return driver ? (
                  <Box display="flex" alignItems="center" gap={1}>
                    <Avatar src={driver.avatar} sx={{ width: 24, height: 24 }}>
                      {driver.name?.charAt(0)}
                    </Avatar>
                    <Typography>{driver.name}</Typography>
                  </Box>
                ) : selected;
              },
            }}
          >
            {availableDrivers.map((driver) => (
              // ✅ FIXED: استخدام driver._id بدلاً من driver.id
              <MenuItem key={driver._id} value={driver._id}>
                <Box display="flex" alignItems="center" gap={1}>
                  <Avatar src={driver.avatar} sx={{ width: 32, height: 32 }}>
                    {driver.name?.charAt(0)}
                  </Avatar>
                  <Box>
                    <Typography variant="body1">{driver.name}</Typography>
                    <Typography variant="caption" color="textSecondary">
                      {driver.phone} • {driver.totalDeliveries || 0} توصيلة
                    </Typography>
                  </Box>
                </Box>
              </MenuItem>
            ))}
          </TextField>
        )}
        
        {availableDrivers.length === 0 && !driversLoading && (
          <Alert severity="warning" sx={{ mt: 2 }}>
            لا يوجد مندوبين متاحين حالياً
          </Alert>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>إلغاء</Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={loading || !driverId || availableDrivers.length === 0}
        >
          {loading ? <CircularProgress size={24} /> : 'تعيين'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}