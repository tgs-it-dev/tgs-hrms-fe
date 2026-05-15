import React, { useEffect, useState, useCallback } from 'react';
import {
  Box,
  Typography,
  useTheme,
  Switch,
  CircularProgress,
  IconButton,
  Tooltip,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Stack,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import SecurityIcon from '@mui/icons-material/Security';
import AppCard from '../common/AppCard';
import AppButton from '../common/AppButton';
import AppTable from '../common/AppTable';
import AppFormModal from '../common/AppFormModal';
import AppInputField from '../common/AppInputField';
import DeleteConfirmationDialog from '../common/DeleteConfirmationDialog';
import { useScopedTranslations } from '../../hooks/useScopedTranslations';
import { useErrorHandler } from '../../hooks/useErrorHandler';
import ipWhitelistApi, { type IPWhitelistItem } from '../../api/ipWhitelistApi';
import { useCompany } from '../../context/CompanyContext';
import { formatValidationErrors } from '../../utils/formErrorFormatter';
import axios from 'axios';

export interface ValidationErrorItem {
  field: string;
  message: string;
}


const IpManagement: React.FC = () => {
  const theme = useTheme();
  const t = useScopedTranslations('settings');
  const { showError, showSuccess } = useErrorHandler();
  const { companyDetails, refreshCompanyDetails } = useCompany();

  const [loading, setLoading] = useState(true);
  const [ips, setIps] = useState<IPWhitelistItem[]>([]);
  const [isRestrictionEnabled, setIsRestrictionEnabled] = useState(false);
  const [toggleLoading, setToggleLoading] = useState(false);
  //error states
  const [errors, setErrors] = useState({
    ip_address: '',
    description: '',
  });

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addLoading, setAddLoading] = useState(false);
  const [formData, setFormData] = useState({ ip_address: '', description: '' });
  // Delete states
  const [deleteIp, setDeleteIp] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  // Set restriction status
  useEffect(() => {
    if (companyDetails) {
      setIsRestrictionEnabled(companyDetails.ip_restriction_enabled || false);
    }
  }, [companyDetails]);
  //validate ip address
  const validateIpAddress = (ip: string) => {
    const value = ip.trim();

    // IPv4
    const ipv4Regex =
      /^(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}$/;

    // IPv6
    const ipv6Regex =
      /^(([0-9a-fA-F]{1,4}:){7}([0-9a-fA-F]{1,4}|:)|(([0-9a-fA-F]{1,4}:){1,7}:)|(([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4})|(([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2})|(([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3})|(([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4})|(([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5})|([0-9a-fA-F]{1,4}:)((:[0-9a-fA-F]{1,4}){1,6})|(:)((:[0-9a-fA-F]{1,4}){1,7}|:))$/;

    if (!value) {
      return 'IP address is required';
    }

    if (!ipv4Regex.test(value) && !ipv6Regex.test(value)) {
      return 'Enter a valid IPv4 or IPv6 address';
    }

    return '';
  };
  //validate description
  const validateDescription = (description: string) => {
    const value = description.trim();

    if (!value) {
      return 'Description is required';
    }

    if (value.length < 3) {
      return 'Description must be at least 3 characters';
    }

    if (value.length > 100) {
      return 'Description must not exceed 100 characters';
    }

    return '';
  };
  //validate form
  const validateForm = () => {
    const newErrors = {
      ip_address: validateIpAddress(formData.ip_address),
      description: validateDescription(formData.description),
    };

    setErrors(newErrors);

    return !newErrors.ip_address && !newErrors.description;
  };

  const fetchIps = useCallback(async () => {
    try {
      setLoading(true);
      const response = await ipWhitelistApi.getWhitelistedIPs();
      setIps(response.items);
    } catch (error) {
      showError(error);
    } finally {
      setLoading(false);
    }
  }, [showError]);

  useEffect(() => {
    fetchIps();
  }, [fetchIps]);

  const handleToggleRestriction = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const checked = event.target.checked;
    setToggleLoading(true);
    try {
      if (checked) {
        await ipWhitelistApi.enableIPRestriction();
        showSuccess('IP restriction enabled successfully');
      } else {
        await ipWhitelistApi.disableIPRestriction();
        showSuccess('IP restriction disabled successfully');
      }
      setIsRestrictionEnabled(checked);
      await refreshCompanyDetails();
    } catch (error) {
      showError(error);
    } finally {
      setToggleLoading(false);
    }
  };

  const handleAddIp = async () => {
    if (!validateForm()) return;
    setAddLoading(true);
    try {
      await ipWhitelistApi.addIPToWhitelist(formData);
      showSuccess('IP address added to whitelist');
      setIsAddModalOpen(false);
      setFormData({ ip_address: '', description: '' });
      fetchIps();
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const formattedError = formatValidationErrors(
          error.response?.data?.errors || []
        );

        setErrors((prev) => ({
          ...prev,
          ...formattedError,
        }));
      } else {
        showError(error);
      }
    }
    finally {
      setAddLoading(false);
    }
  };

  const handleClose = () => {
    setIsAddModalOpen(false);
    setErrors({
      ip_address: '',
      description: '',
    })
    setFormData({ ip_address: '', description: '' });
  }

  const handleDeleteIp = async () => {
    if (!deleteIp) return;

    setDeleteLoading(true);
    try {
      await ipWhitelistApi.removeIPFromWhitelist(deleteIp);
      showSuccess('IP address removed from whitelist');
      setDeleteIp(null);
      fetchIps();
    } catch (error) {
      showError(error);
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleIpChange = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      ip_address: value,
    }));

    setErrors((prev) => ({
      ...prev,
      ip_address: validateIpAddress(value),
    }));
  };

  const handleDescriptionChange = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      description: value,
    }));

    setErrors((prev) => ({
      ...prev,
      description: validateDescription(value),
    }));
  };

  return (
    <Box display={'flex'} flexDirection={'column'} gap={3}>
      {/* IP Restriction Toggle Card */}
      <Typography variant='h5' fontWeight={600} color={theme.palette.text.secondary}>Current IP Address: <span style={{ color: theme.palette.text.primary }}>{companyDetails?.current_ip}</span></Typography>
      <AppCard
        elevation={1}
        sx={{ borderRadius: 3, border: 'none', p: { xs: 2, sm: 3, lg: 4 } }}
      >
        <Box display={'flex'} flexDirection={'row'} gap={2} justifyContent={'space-between'} >
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Box
              sx={{
                width: { xs: 42, sm: 50 },
                height: { xs: 42, sm: 50 },
                borderRadius: '50%',
                backgroundColor: 'background.default',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mr: { xs: 2, sm: 3 },
              }}
            >
              <SecurityIcon
                sx={{
                  fontSize: { xs: 22, sm: 28 },
                  color: theme.palette.text.disabled,
                }}
              />
            </Box>
            <Box>
              <Typography
                variant='body1'
                sx={{
                  color: theme.palette.text.primary,
                  fontWeight: 600,
                  fontSize: { xs: '14px', sm: '16px' },
                }}
              >
                {t.ipRestriction}
              </Typography>
              <Typography
                variant='body2'
                sx={{
                  color: theme.palette.text.secondary,
                  fontSize: { xs: '12px', sm: '13px' },
                  maxWidth: 600,
                }}
              >
                {t.ipRestrictionDesc}
              </Typography>
            </Box>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            {toggleLoading && <CircularProgress size={20} sx={{ mr: 1 }} />}
            <Switch
              checked={isRestrictionEnabled}
              onChange={handleToggleRestriction}
              disabled={toggleLoading}
              color='primary'
            />
          </Box>
        </Box>
      </AppCard>

      {/* Whitelisted IPs Table Card */}
      <AppCard
        elevation={1}
        sx={{ borderRadius: 3, border: 'none', p: { xs: 2, sm: 3, lg: 4 } }}
      >
        <Box
          display={'flex'}
          flexDirection={'row'}
          gap={2}
          justifyContent={'space-between'}
          alignItems={'center'}
          mb={3}
        >
          <Typography
            variant='h6'
            sx={{
              fontWeight: 600,
              color: theme.palette.text.primary,
            }}
          >
            {t.whitelistedIps}
          </Typography>
          <AppButton
            variant='contained'
            variantType='primary'
            startIcon={<AddIcon />}
            onClick={() => setIsAddModalOpen(true)}
          >
            {t.addIp}
          </AppButton>
        </Box>

        {loading ? (
          <Box display={'flex'} justifyContent={'center'} py={4} >
            <CircularProgress />
          </Box>
        ) : (
          <AppTable tableLabel={t.whitelistedIps}>
            <TableHead>
              <TableRow>
                <TableCell>{t.ipAddress}</TableCell>
                <TableCell>{t.ipDescription}</TableCell>
                <TableCell align='right'>{t.actions}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {ips.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} align='center' sx={{ py: 4 }}>
                    <Typography color='text.secondary'>No Results Found</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                ips.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell sx={{ fontWeight: 500 }}>{item.ip_address}</TableCell>
                    <TableCell>{item.description}</TableCell>
                    <TableCell align='right'>
                      <Tooltip title={"Delete Ip"}>
                        <IconButton
                          color='error'
                          onClick={() => setDeleteIp(item.ip_address)}
                          size='small'
                        >
                          <DeleteIcon fontSize='small' />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </AppTable>
        )}
      </AppCard>

      {/* Add IP Modal */}
      <AppFormModal
        open={isAddModalOpen}
        onClose={() => handleClose()}
        title={t.addIp}
        onSubmit={handleAddIp}
        submitLabel={t.addIp}
        isSubmitting={addLoading}
      >
        <Stack spacing={3} mt={1} >
          <AppInputField
            label={t.ipAddress}
            placeholder='e.g. 192.168.1.1'
            value={formData.ip_address}
            onChange={(e) => handleIpChange(e.target.value)}
            error={!!errors.ip_address}
            helperText={errors.ip_address}
            required
          />
          <AppInputField
            label={t.ipDescription}
            placeholder='e.g. Office Network'
            value={formData.description}
            onChange={(e) => handleDescriptionChange(e.target.value)}
            error={!!errors.description}
            helperText={errors.description}
            required
          />
        </Stack>
      </AppFormModal>

      {/* Delete Confirmation */}
      <DeleteConfirmationDialog
        open={Boolean(deleteIp)}
        onClose={() => setDeleteIp(null)}
        onConfirm={handleDeleteIp}
        title={t.confirmDelete}
        message={t.confirmDeleteIp}
        loading={deleteLoading}
      />
    </Box>
  );
};

export default IpManagement;