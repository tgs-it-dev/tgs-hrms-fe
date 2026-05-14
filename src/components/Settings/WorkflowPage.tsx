import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  useTheme,
  Stack,
  Switch,
  FormControlLabel,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  IconButton,
  CircularProgress,
  MenuItem as MuiMenuItem,
} from '@mui/material';
import { Edit, Delete } from '@mui/icons-material';
import AppCard from '../common/AppCard';
import AppButton from '../common/AppButton';
import AppTable from '../common/AppTable';
import AppFormModal from '../common/AppFormModal';
import AppInputField from '../common/AppInputField';
import AppSelect from '../common/AppSelect';
import workflowApi, {
  type WorkflowConfigStep,
  type WorkflowRequestType,
} from '../../api/workflowApi';
import rolesApi, { type Role } from '../../api/rolesApi';
import { useErrorHandler } from '../../hooks/useErrorHandler';
import { useScopedTranslations } from '../../hooks/useScopedTranslations';
import DeleteConfirmationDialog from '../common/DeleteConfirmationDialog';

const WorkflowPage: React.FC = () => {
  const theme = useTheme();
  const { showError, showSuccess } = useErrorHandler();
  const t = useScopedTranslations('workflow');
  const tc = useScopedTranslations('common');

  const [workflowType, setWorkflowType] =
    useState<WorkflowRequestType>('leave');
  const [steps, setSteps] = useState<WorkflowConfigStep[]>([]);
  const [availableRoles, setAvailableRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(false);

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingStep, setEditingStep] = useState<WorkflowConfigStep | null>(
    null
  );
  const [saveLoading, setSaveLoading] = useState(false);
  const [formData, setFormData] = useState({
    approver_role: '',
    step_label: '',
    is_active: true,
  });

  // Delete State
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [stepToDelete, setStepToDelete] = useState<WorkflowConfigStep | null>(
    null
  );
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchSteps = useCallback(async () => {
    if (!workflowType) return;
    setLoading(true);
    try {
      const data = await workflowApi.getWorkflowConfigSteps({
        type: workflowType,
      });
      // Sort steps by order just in case
      setSteps(data.sort((a, b) => a.step_order - b.step_order));
    } catch (error) {
      showError(error);
    } finally {
      setLoading(false);
    }
  }, [workflowType, showError]);

  const fetchRoles = useCallback(async () => {
    try {
      const data = await rolesApi.getAllRoles();
      setAvailableRoles(data);
    } catch (error) {
      showError(error);
    }
  }, [showError]);

  useEffect(() => {
    fetchSteps();
  }, [fetchSteps]);

  useEffect(() => {
    fetchRoles();
  }, [fetchRoles]);

  const handleOpenModal = (step: WorkflowConfigStep | null = null) => {
    if (step) {
      setEditingStep(step);
      setFormData({
        approver_role: step.approver_role,
        step_label: step.step_label,
        is_active: step.is_active,
      });
    } else {
      setEditingStep(null);
      setFormData({
        approver_role: '',
        step_label: '',
        is_active: true,
      });
    }
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!workflowType) return;
    setSaveLoading(true);
    try {
      if (editingStep) {
        await workflowApi.updateWorkflowConfigStep(
          workflowType,
          editingStep.step_order,
          formData
        );
        showSuccess(tc.update + ' ' + t.stepLabel);
      } else {
        await workflowApi.createWorkflowConfigStep({
          request_type: workflowType,
          ...formData,
        });
        showSuccess(tc.create + ' ' + t.stepLabel);
      }
      setModalOpen(false);
      fetchSteps();
    } catch (error) {
      showError(error);
    } finally {
      setSaveLoading(false);
    }
  };

  const handleDeleteClick = (step: WorkflowConfigStep) => {
    setStepToDelete(step);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!stepToDelete || !workflowType) return;
    setDeleteLoading(true);
    try {
      await workflowApi.deleteWorkflowConfigStep(
        workflowType,
        stepToDelete.step_order
      );
      showSuccess(tc.delete + ' ' + t.stepLabel);
      setDeleteDialogOpen(false);
      fetchSteps();
    } catch (error) {
      showError(error);
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleToggleActive = async (
    step: WorkflowConfigStep,
    checked: boolean
  ) => {
    if (!workflowType) return;
    try {
      await workflowApi.updateWorkflowConfigStep(
        workflowType,
        step.step_order,
        { is_active: checked }
      );
      // Optimistic update or refetch
      setSteps(prev =>
        prev.map(s => (s.id === step.id ? { ...s, is_active: checked } : s))
      );
    } catch (error) {
      showError(error);
    }
  };

  return (
    <Box sx={{ mt: 4 }}>
      <Box
        sx={{
          mb: 3,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <Typography variant='h6' sx={{ fontWeight: 600 }}>
          {t.title}
        </Typography>
        <AppButton
          variant='contained'
          variantType='primary'
          onClick={() => handleOpenModal()}
          startIcon={
            <Box component='span' sx={{ fontSize: '1.5rem' }}>
              +
            </Box>
          }
        >
          {t.addStep}
        </AppButton>
      </Box>

      <AppCard sx={{ mb: 3, p: 2 }}>
        <Stack direction='row' spacing={2} alignItems='center'>
          <Typography sx={{ fontWeight: 500, minWidth: 100 }}>
            {t.requestType}:
          </Typography>
          <AppSelect
            value={workflowType}
            onChange={e =>
              setWorkflowType(e.target.value as WorkflowRequestType)
            }
            sx={{ minWidth: 200 }}
          >
            <MuiMenuItem value='leave'>Leave</MuiMenuItem>
            <MuiMenuItem value='wfh'>WFH</MuiMenuItem>
            <MuiMenuItem value='overtime'>Overtime</MuiMenuItem>
          </AppSelect>
        </Stack>
      </AppCard>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : (
        <AppTable tableLabel={t.steps}>
          <TableHead>
            <TableRow>
              <TableCell>{t.stepOrder}</TableCell>
              <TableCell>{t.stepLabel}</TableCell>
              <TableCell>{t.approverRole}</TableCell>
              <TableCell>{t.active}</TableCell>
              <TableCell align='right'>{tc.actions}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {steps.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align='center' sx={{ py: 4 }}>
                  <Typography color='text.secondary'>{t.noSteps}</Typography>
                </TableCell>
              </TableRow>
            ) : (
              steps.map(step => (
                <TableRow key={step.id}>
                  <TableCell>{step.step_order}</TableCell>
                  <TableCell>{step.step_label}</TableCell>
                  <TableCell sx={{ textTransform: 'capitalize' }}>
                    {step.approver_role}
                  </TableCell>
                  <TableCell>
                    <Switch
                      size='small'
                      checked={step.is_active}
                      onChange={(_, checked) =>
                        handleToggleActive(step, checked)
                      }
                    />
                  </TableCell>
                  <TableCell align='right'>
                    <Stack
                      direction='row'
                      spacing={1}
                      justifyContent='flex-end'
                    >
                      <IconButton
                        size='small'
                        onClick={() => handleOpenModal(step)}
                        sx={{ color: theme.palette.primary.main }}
                      >
                        <Edit fontSize='small' />
                      </IconButton>
                      <IconButton
                        size='small'
                        onClick={() => handleDeleteClick(step)}
                        sx={{ color: theme.palette.error.main }}
                      >
                        <Delete fontSize='small' />
                      </IconButton>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </AppTable>
      )}

      {/* Add/Edit Modal */}
      <AppFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingStep ? t.editStep : t.addStep}
        onSubmit={handleSave}
        loading={saveLoading}
      >
        <Stack spacing={3} sx={{ mt: 1 }}>
          <AppInputField
            label={t.stepLabel}
            value={formData.step_label}
            onChange={e =>
              setFormData({ ...formData, step_label: e.target.value })
            }
            placeholder='e.g. Manager Approval'
            required
          />
          <AppSelect
            label={t.approverRole}
            value={formData.approver_role}
            onChange={e =>
              setFormData({
                ...formData,
                approver_role: e.target.value as string,
              })
            }
            required
          >
            {availableRoles.map(role => (
              <MuiMenuItem key={role.id} value={role.name.toLowerCase()}>
                {role.name}
              </MuiMenuItem>
            ))}
          </AppSelect>
          <FormControlLabel
            control={
              <Switch
                checked={formData.is_active}
                onChange={e =>
                  setFormData({ ...formData, is_active: e.target.checked })
                }
              />
            }
            label={t.active}
          />
        </Stack>
      </AppFormModal>

      {/* Delete Confirmation */}
      <DeleteConfirmationDialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleConfirmDelete}
        loading={deleteLoading}
        title={tc.delete}
        message={t.confirmDelete}
      />
    </Box>
  );
};

export default WorkflowPage;
