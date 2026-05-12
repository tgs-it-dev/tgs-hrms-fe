import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  IconButton,
  Button,
  Dialog,
  DialogActions,
  DialogTitle,
  Divider,
  useTheme,
} from '@mui/material';
import type { Policy } from '../../types/policy';
import { mockPolicies } from '../../Data/HrmockData';
import PolicyForm from './PolicyForm';
import edit from '../../assets/dashboardIcon/edit.svg';
import deleteIcon from '../../assets/dashboardIcon/ui-delete.svg';

const PolicyList: React.FC = () => {
  const [policies, setPolicies] = useState<Policy[]>(mockPolicies);
  const [openForm, setOpenForm] = useState(false);
  const [selected, setSelected] = useState<Policy | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const theme = useTheme();

  const handleAddEdit = (policy: Policy) => {
    setPolicies(prev =>
      prev.some(p => p.id === policy.id)
        ? prev.map(p => (p.id === policy.id ? policy : p))
        : [...prev, policy]
    );
  };

  const handleDelete = () => {
    setPolicies(prev => prev.filter(p => p.id !== confirmDeleteId));
    setConfirmDeleteId(null);
  };

  return (
    <Box sx={{ p: 0 }}>
      {/* Header */}
      <Box
        sx={{
          mb: 2,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 2,
        }}
      >
        <Typography variant='h5' sx={{ color: theme.palette.text.secondary }}>
          HR Policies
        </Typography>

        <Button
          variant='contained'
          onClick={() => {
            setSelected(null);
            setOpenForm(true);
          }}
          sx={{ backgroundColor: 'primary.main' }}
        >
          Add Policy
        </Button>
      </Box>
      <Divider sx={{ flexGrow: 1, mb: 2 }} />

      {/* Policies List */}
      <Box
        sx={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 1,
        }}
      >
        {policies.map(policy => (
          <Box
            key={policy.id}
            sx={{
              flex: '1 1 100%',
              maxWidth: { xs: '100%', sm: '48%', md: '48%', lg: '32%' },
            }}
          >
            <Card>
              <CardContent>
                {/* Title */}
                <Typography variant='h6' gutterBottom>
                  {policy.name}
                </Typography>
                <Divider sx={{ mb: 2 }} />

                {/* Description & Details */}
                <Typography variant='body2' sx={{ mb: 1 }}>
                  {policy.description}
                </Typography>
                <Typography color='text.secondary'>
                  Type: {policy.type}
                </Typography>
                <Typography color='text.secondary' gutterBottom>
                  Effective: {policy.effectiveDate}
                </Typography>

                {/* Action Buttons at Bottom */}
                <Box display='flex' width={100} mt={2}>
                  <IconButton
                    onClick={() => {
                      setSelected(policy);
                      setOpenForm(true);
                    }}
                    color='success'
                    size='small'
                    aria-label={`Edit policy ${policy.name}`}
                    sx={{
                      borderWidth: '1px',
                      borderStyle: 'solid',
                      borderColor: 'divider',
                      borderTopLeftRadius: '3px',
                      borderBottomLeftRadius: '3px',
                      borderTopRightRadius: 0,
                      borderBottomRightRadius: 0,
                      '&:hover': {
                        backgroundColor: 'orange',
                        color: 'white',
                      },
                    }}
                  >
                    <img
                      src={edit}
                      alt=''
                      aria-hidden='true'
                      style={{
                        width: 15,
                        height: 15,
                        filter:
                          'invert(48%) sepia(59%) saturate(528%) hue-rotate(85deg) brightness(90%) contrast(91%)',
                      }}
                    />
                    {/* <EditIcon fontSize="small" /> */}
                  </IconButton>

                  <IconButton
                    onClick={() => setConfirmDeleteId(policy.id)}
                    color='error'
                    size='small'
                    aria-label={`Delete policy ${policy.name}`}
                    sx={{
                      borderWidth: '1px',
                      borderStyle: 'solid',
                      borderColor: 'divider',
                      borderTopLeftRadius: '0px',
                      borderBottomLeftRadius: '0px',
                      borderTopRightRadius: '3px',
                      borderBottomRightRadius: '3px',
                      '&:hover': {
                        backgroundColor: 'orange',
                        color: 'white',
                      },
                    }}
                  >
                    <img
                      src={deleteIcon}
                      alt=''
                      aria-hidden='true'
                      style={{
                        width: 15,
                        height: 15,
                        filter:
                          'invert(28%) sepia(97%) saturate(1404%) hue-rotate(329deg) brightness(95%) contrast(96%)',
                      }}
                    />
                  </IconButton>
                </Box>
              </CardContent>
            </Card>
          </Box>
        ))}
      </Box>

      {/* Add/Edit Form Dialog */}
      <PolicyForm
        open={openForm}
        onClose={() => setOpenForm(false)}
        onSubmit={handleAddEdit}
        initialData={selected}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!confirmDeleteId} onClose={() => setConfirmDeleteId(null)}>
        <DialogTitle>Are you sure you want to delete this policy?</DialogTitle>
        <DialogActions>
          <Button color='error' onClick={handleDelete}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PolicyList;
