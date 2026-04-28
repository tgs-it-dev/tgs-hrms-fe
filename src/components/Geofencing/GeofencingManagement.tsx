import { useEffect, useState, useContext } from 'react';
import {
  Box,
  Typography,
  Paper,
  Alert,
  Snackbar,
  IconButton,
  Tooltip,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  Delete as DeleteIcon,
  Edit as EditIcon,
  LocationOn as LocationIcon,
  Info as ViewIcon,
  Close as CloseIcon,
  Add as AddIcon,
} from '@mui/icons-material';
import {
  MapContainer,
  TileLayer,
  Circle,
  Polygon,
  Rectangle,
  useMap,
  Marker,
  Popup,
} from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
import type { Geofence } from '../../types/geofencing';
import { geofencingApi } from '../../api/geofencingApi';
import { teamApiService } from '../../api/teamApi';
import { UserContext } from '../../context/UserContext';
import { isManager, isHRAdmin, isAdmin } from '../../utils/roleUtils';
import AppPageTitle from '../common/AppPageTitle';
import AppButton from '../common/AppButton';
import GeofenceFormModal from './GeofenceFormModal';
import DeleteConfirmationDialog from '../common/DeleteConfirmationDialog';

// Fix for default marker icons in React-Leaflet
const DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

interface MapControllerProps {
  center: [number, number];
  zoom: number;
}

function MapController({ center, zoom }: MapControllerProps) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom);
  }, [map, center, zoom]);
  return null;
}

const GeofencingManagement = () => {
  const [geofences, setGeofences] = useState<Geofence[]>([]);
  const [loading, setLoading] = useState(true);

  const [editingGeofence, setEditingGeofence] = useState<Geofence | null>(null);
  const [viewingGeofence, setViewingGeofence] = useState<Geofence | null>(null);
  const [deletingGeofence, setDeletingGeofence] = useState<Geofence | null>(
    null
  );
  const [managerTeams, setManagerTeams] = useState<
    Array<{ id: string; name?: string }>
  >([]);
  const userContext = useContext(UserContext);
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error';
  }>({
    open: false,
    message: '',
    severity: 'success',
  });

  const fetchGeofences = async () => {
    try {
      setLoading(true);
      const data = await geofencingApi.getGeofences();
      setGeofences(data);
      setGeofences(data);
    } catch {
      showSnackbar('Failed to load geofences', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGeofences();
    // load manager teams to determine permissions
    (async () => {
      try {
        const teams = await teamApiService.getMyTeams();
        setManagerTeams(teams);
      } catch {
        setManagerTeams([]);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const showSnackbar = (
    message: string,
    severity: 'success' | 'error' = 'success'
  ) => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const handleCreate = () => {
    setEditingGeofence(null);
    setFormModalOpen(true);
  };

  const handleEdit = (geofence: Geofence) => {
    setEditingGeofence(geofence);
    setFormModalOpen(true);
  };

  const handleView = (geofence: Geofence) => {
    setViewingGeofence(geofence);
  };

  const handleDelete = (geofence: Geofence) => {
    setDeletingGeofence(geofence);
  };

  const handleFormSubmit = async (
    data: Omit<Geofence, 'id' | 'createdAt' | 'updatedAt'>
  ) => {
    try {
      setSaving(true);
      // Data from form should already have teamId if provided
      const payload = { ...data };

      if (editingGeofence) {
        await geofencingApi.updateGeofence(editingGeofence.id, payload);
        showSnackbar('Geofence updated successfully', 'success');
      } else {
        await geofencingApi.createGeofence(payload);
        showSnackbar('Geofence created successfully', 'success');
      }
      setFormModalOpen(false);
      setEditingGeofence(null);
      setEditingGeofence(null);
      fetchGeofences();
    } catch {
      showSnackbar('Failed to save geofence', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingGeofence) return;

    try {
      await geofencingApi.deleteGeofence(deletingGeofence.id);
      showSnackbar('Geofence deleted successfully', 'error');
      setDeletingGeofence(null);
      setDeletingGeofence(null);
      fetchGeofences();
    } catch {
      showSnackbar('Failed to delete geofence', 'error');
    }
  };

  const getDisplayCenter = (geofence: Geofence): [number, number] => {
    if (
      geofence.type === 'circle' ||
      !geofence.coordinates ||
      geofence.coordinates.length === 0
    ) {
      return geofence.center;
    }
    try {
      const bounds = L.latLngBounds(geofence.coordinates);
      const center = bounds.getCenter();
      return [center.lat, center.lng];
    } catch {
      return geofence.center;
    }
  };

  if (loading) {
    return (
      <Box
        display='flex'
        justifyContent='center'
        alignItems='center'
        minHeight='400px'
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box
        display='flex'
        justifyContent='space-between'
        alignItems='center'
        mb={3}
      >
        <AppPageTitle>Geofencing Management</AppPageTitle>
        {(() => {
          // Show create only to managers (not admins/hr-admins) who have at least one team
          const user = userContext?.user;
          const role = user?.role;
          if (
            user &&
            isManager(role) &&
            !isAdmin(role) &&
            !isHRAdmin(role) &&
            managerTeams.length > 0
          ) {
            return (
              <AppButton
                onClick={handleCreate}
                startIcon={<AddIcon />}
                variant='contained'
              >
                Create Geofence
              </AppButton>
            );
          }
          return null;
        })()}
      </Box>

      {/* Geofence List */}
      {geofences.length === 0 ? (
        <Alert severity='info'>No geofences created yet.</Alert>
      ) : (
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' },
            gap: 2,
          }}
        >
          {geofences.map(geofence => (
            <Paper
              key={geofence.id}
              sx={{
                p: 2,
                display: 'flex',
                flexDirection: 'column',
                height: '100%',
                borderLeft: `4px solid ${
                  geofence.isActive ? '#3083dc' : '#888'
                }`,
              }}
            >
              <Box sx={{ flex: 1 }}>
                <Box display='flex' alignItems='center' gap={1} mb={1}>
                  <LocationIcon
                    color={geofence.isActive ? 'primary' : 'disabled'}
                  />
                  <Typography variant='subtitle1' fontWeight='bold'>
                    {geofence.name}
                  </Typography>
                  {geofence.isActive ? (
                    <Typography variant='caption' color='success.main'>
                      Active
                    </Typography>
                  ) : (
                    <Typography variant='caption' color='text.disabled'>
                      Inactive
                    </Typography>
                  )}
                </Box>
                {geofence.description && (
                  <Typography variant='body2' color='text.secondary' mb={1}>
                    {geofence.description}
                  </Typography>
                )}
                <Typography variant='caption' color='text.secondary'>
                  Type: {geofence.type} | Created:{' '}
                  {new Date(geofence.createdAt).toLocaleDateString()}
                  {geofence.threshold_enabled &&
                    geofence.threshold_distance && (
                      <> | Threshold: {geofence.threshold_distance}m</>
                    )}
                </Typography>
              </Box>
              <Box display='flex' gap={1} mt={2} justifyContent='flex-end'>
                <Tooltip title='View'>
                  <IconButton
                    size='small'
                    color='info'
                    onClick={() => handleView(geofence)}
                  >
                    <ViewIcon />
                  </IconButton>
                </Tooltip>

                {(() => {
                  const user = userContext?.user;
                  const role = user?.role;
                  const isTeamManager =
                    user &&
                    isManager(role) &&
                    !isAdmin(role) &&
                    !isHRAdmin(role) &&
                    geofence.teamId &&
                    managerTeams.some(t => t.id === geofence.teamId);
                  if (isTeamManager) {
                    return (
                      <>
                        <Tooltip title='Edit'>
                          <IconButton
                            size='small'
                            color='primary'
                            onClick={() => handleEdit(geofence)}
                          >
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title='Delete'>
                          <IconButton
                            size='small'
                            color='error'
                            onClick={() => handleDelete(geofence)}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                      </>
                    );
                  }
                  return null;
                })()}
              </Box>
            </Paper>
          ))}
        </Box>
      )}

      {/* Create/Edit Form Modal */}
      <GeofenceFormModal
        open={formModalOpen}
        onClose={() => {
          setFormModalOpen(false);
          setEditingGeofence(null);
        }}
        onSubmit={handleFormSubmit}
        geofence={editingGeofence}
        loading={saving}
        availableTeams={managerTeams}
      />

      {/* View Dialog */}
      <Dialog
        open={!!viewingGeofence}
        onClose={() => setViewingGeofence(null)}
        maxWidth='lg'
        fullWidth
      >
        <DialogTitle>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <Typography variant='h6'>
              View Geofence: {viewingGeofence?.name}
            </Typography>
            <IconButton onClick={() => setViewingGeofence(null)} size='small'>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          {viewingGeofence && (
            <Box
              sx={{
                display: 'flex',
                flexDirection: { xs: 'column', md: 'row' },
                gap: 3,
              }}
            >
              {/* Left side - Details */}
              <Box sx={{ width: { xs: '100%', md: '40%' } }}>
                <Box sx={{ mb: 3 }}>
                  <Typography
                    variant='body2'
                    color='text.secondary'
                    gutterBottom
                  >
                    Name
                  </Typography>
                  <Typography variant='body1'>
                    {viewingGeofence.name}
                  </Typography>
                </Box>
                {viewingGeofence.description && (
                  <Box sx={{ mb: 3 }}>
                    <Typography
                      variant='body2'
                      color='text.secondary'
                      gutterBottom
                    >
                      Description
                    </Typography>
                    <Typography variant='body1'>
                      {viewingGeofence.description}
                    </Typography>
                  </Box>
                )}
                <Box sx={{ mb: 3 }}>
                  <Typography
                    variant='body2'
                    color='text.secondary'
                    gutterBottom
                  >
                    Type
                  </Typography>
                  <Typography variant='body1'>
                    {viewingGeofence.type}
                  </Typography>
                </Box>
                <Box sx={{ mb: 3 }}>
                  <Typography
                    variant='body2'
                    color='text.secondary'
                    gutterBottom
                  >
                    Status
                  </Typography>
                  <Typography variant='body1'>
                    {viewingGeofence.isActive ? 'Active' : 'Inactive'}
                  </Typography>
                </Box>
                <Box sx={{ mb: 3 }}>
                  <Typography
                    variant='body2'
                    color='text.secondary'
                    gutterBottom
                  >
                    Coordinates
                  </Typography>
                  <Typography variant='body1'>
                    {getDisplayCenter(viewingGeofence)[0].toFixed(6)},{' '}
                    {getDisplayCenter(viewingGeofence)[1].toFixed(6)}
                  </Typography>
                </Box>
                {viewingGeofence.type === 'circle' &&
                  viewingGeofence.radius && (
                    <Box sx={{ mb: 3 }}>
                      <Typography
                        variant='body2'
                        color='text.secondary'
                        gutterBottom
                      >
                        Radius
                      </Typography>
                      <Typography variant='body1'>
                        {viewingGeofence.radius}m
                      </Typography>
                    </Box>
                  )}
                {viewingGeofence.threshold_enabled && (
                  <Box sx={{ mb: 3 }}>
                    <Typography
                      variant='body2'
                      color='text.secondary'
                      gutterBottom
                    >
                      Threshold Distance
                    </Typography>
                    <Typography variant='body1'>
                      {viewingGeofence.threshold_distance
                        ? `${viewingGeofence.threshold_distance}m`
                        : 'Not set'}
                    </Typography>
                  </Box>
                )}
              </Box>

              {/* Right side - Map */}
              <Box
                sx={{
                  width: { xs: '100%', md: '60%' },
                  height: '400px',
                  borderRadius: 1,
                  overflow: 'hidden',
                  border: '1px solid',
                  borderColor: 'divider',
                  '& .leaflet-container': {
                    height: '100%',
                    width: '100%',
                  },
                }}
              >
                <MapContainer
                  center={getDisplayCenter(viewingGeofence)}
                  zoom={15}
                  style={{ height: '100%', width: '100%' }}
                  zoomControl={true}
                  scrollWheelZoom={true}
                >
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url='https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
                  />
                  <MapController
                    center={getDisplayCenter(viewingGeofence)}
                    zoom={15}
                  />

                  <Marker position={getDisplayCenter(viewingGeofence)}>
                    <Popup>
                      <Typography variant='subtitle2'>
                        {viewingGeofence.name}
                      </Typography>
                    </Popup>
                  </Marker>

                  {viewingGeofence.type === 'circle' &&
                    viewingGeofence.radius && (
                      <Circle
                        center={viewingGeofence.center}
                        radius={viewingGeofence.radius}
                        pathOptions={{
                          color: '#3083dc',
                          fillColor: '#3083dc',
                          fillOpacity: 0.3,
                        }}
                      >
                        <Popup>
                          <Typography variant='subtitle2'>
                            {viewingGeofence.name}
                          </Typography>
                          <Typography variant='body2'>
                            {viewingGeofence.description}
                          </Typography>
                          <Typography variant='caption'>
                            Radius: {viewingGeofence.radius}m
                          </Typography>
                        </Popup>
                      </Circle>
                    )}
                  {viewingGeofence.type === 'rectangle' &&
                    viewingGeofence.coordinates && (
                      <Rectangle
                        bounds={
                          [
                            [
                              viewingGeofence.coordinates[0][0],
                              viewingGeofence.coordinates[0][1],
                            ],
                            [
                              viewingGeofence.coordinates[2][0],
                              viewingGeofence.coordinates[2][1],
                            ],
                          ] as [[number, number], [number, number]]
                        }
                        pathOptions={{
                          color: '#3083dc',
                          fillColor: '#3083dc',
                          fillOpacity: 0.3,
                        }}
                      >
                        <Popup>
                          <Typography variant='subtitle2'>
                            {viewingGeofence.name}
                          </Typography>
                          <Typography variant='body2'>
                            {viewingGeofence.description}
                          </Typography>
                        </Popup>
                      </Rectangle>
                    )}
                  {viewingGeofence.type === 'polygon' &&
                    viewingGeofence.coordinates && (
                      <Polygon
                        positions={viewingGeofence.coordinates}
                        pathOptions={{
                          color: '#3083dc',
                          fillColor: '#3083dc',
                          fillOpacity: 0.3,
                        }}
                      >
                        <Popup>
                          <Typography variant='subtitle2'>
                            {viewingGeofence.name}
                          </Typography>
                          <Typography variant='body2'>
                            {viewingGeofence.description}
                          </Typography>
                        </Popup>
                      </Polygon>
                    )}
                </MapContainer>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <AppButton
            onClick={() => setViewingGeofence(null)}
            variant='outlined'
          >
            Close
          </AppButton>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmationDialog
        open={!!deletingGeofence}
        onClose={() => setDeletingGeofence(null)}
        onConfirm={handleConfirmDelete}
        title='Delete Geofence'
        message={`Are you sure you want to delete the geofence "${deletingGeofence?.name}"? This action cannot be undone.`}
        itemName={deletingGeofence?.name}
        confirmText='Delete'
        cancelText='Cancel'
      />

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          variant="standard"
          sx={{
            width: '100%',
            ...(snackbar.severity === 'error'
              ? {
                  backgroundColor: 'rgb(253, 237, 237)',
                  color: 'rgb(95, 33, 32)',
                  '& .MuiAlert-icon': { color: 'rgb(95, 33, 32)' },
                  '& .MuiAlert-message': { color: 'rgb(95, 33, 32)' },
                  '& .MuiIconButton-root': { color: 'rgb(95, 33, 32)' },
                }
              : {}),
          }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default GeofencingManagement;
