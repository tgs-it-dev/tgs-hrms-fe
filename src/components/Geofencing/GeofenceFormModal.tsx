import { useEffect, useState, useRef } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Switch,
  FormControlLabel,
  Alert,
  IconButton,
  Box,
  Typography,
  InputAdornment,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Paper,
  CircularProgress,
  useTheme,
} from '@mui/material';
import {
  Close as CloseIcon,
  Search as SearchIcon,
  LocationOn as LocationIcon,
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
import 'leaflet-draw/dist/leaflet.draw.css';
import L from 'leaflet';
import 'leaflet-draw';
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
import type { Geofence } from '../../types/geofencing';
import { searchNominatimLocations } from '../../api/geofencingApi';
import AppButton from '../common/AppButton';
import { useGooglePlaces } from '../../hooks/useGooglePlaces';

// Fix for default marker icons in React-Leaflet
const DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

interface LocationSearchResult {
  // For Google predictions this will be the description; for OSM the display_name
  display_name: string;
  // Optional lat/lon (present for Nominatim results); Google predictions provide place_id only
  lat?: string;
  lon?: string;
  // place_id for Google Places predictions or numeric id for Nominatim
  place_id: string;
}

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

interface DraggableMarkerProps {
  position: [number, number];
  name: string;
  onDragEnd: (e: L.DragEndEvent) => void;
}

function DraggableMarker({ position, name, onDragEnd }: DraggableMarkerProps) {
  const [markerPosition, setMarkerPosition] = useState(position);

  useEffect(() => {
    setMarkerPosition(position);
  }, [position]);

  const eventHandlers = {
    dragend: (e: L.DragEndEvent) => {
      onDragEnd(e);
      const marker = e.target;
      const newPos = marker.getLatLng();
      setMarkerPosition([newPos.lat, newPos.lng]);
    },
  };

  return (
    <Marker
      position={markerPosition}
      draggable={true}
      eventHandlers={eventHandlers}
    >
      <Popup>
        <Typography variant='subtitle2'>{name || 'Location'}</Typography>
        <Typography variant='caption'>
          {markerPosition[0].toFixed(6)}, {markerPosition[1].toFixed(6)}
        </Typography>
        <Typography variant='caption' display='block' sx={{ mt: 0.5 }}>
          Drag to change location
        </Typography>
      </Popup>
    </Marker>
  );
}

interface DrawControlProps {
  onDrawCreated: (e: L.DrawEvents.Created) => void;
  onDrawEdited?: (layers: L.LayerGroup<L.Layer>) => void;
  onDrawDeleted?: () => void;
  enabled: boolean;
  featureGroupRef: React.MutableRefObject<L.FeatureGroup | null>;
  shapeForEdit?: {
    type: 'circle' | 'polygon' | 'rectangle';
    center?: [number, number];
    radius?: number;
    coordinates?: [number, number][];
  } | null;
}

function DrawControl({
  onDrawCreated,
  onDrawEdited,
  onDrawDeleted,
  enabled,
  featureGroupRef,
  shapeForEdit,
}: DrawControlProps) {
  const map = useMap();
  const drawControlRef = useRef<L.Control.Draw | null>(null);

  // Ensure a single feature group exists on the map for editing
  useEffect(() => {
    if (!map) return;

    if (!featureGroupRef.current) {
      featureGroupRef.current = new L.FeatureGroup();
      map.addLayer(featureGroupRef.current);
    }
  }, [map, featureGroupRef]);

  // Sync initial / edited shape into the feature group so user can drag points
  useEffect(() => {
    if (!map || !featureGroupRef.current || !shapeForEdit) return;

    const featureGroup = featureGroupRef.current;

    featureGroup.clearLayers();

    let layer: L.Layer | null = null;

    if (
      shapeForEdit.type === 'circle' &&
      shapeForEdit.center &&
      shapeForEdit.radius
    ) {
      layer = new L.Circle(shapeForEdit.center, {
        radius: shapeForEdit.radius,
      });
    } else if (shapeForEdit.type === 'rectangle' && shapeForEdit.coordinates) {
      const bounds = L.latLngBounds(
        [shapeForEdit.coordinates[0][0], shapeForEdit.coordinates[0][1]],
        [shapeForEdit.coordinates[2][0], shapeForEdit.coordinates[2][1]]
      );
      layer = new L.Rectangle(bounds);
    } else if (shapeForEdit.type === 'polygon' && shapeForEdit.coordinates) {
      layer = new L.Polygon(shapeForEdit.coordinates);
    }

    if (layer) {
      featureGroup.addLayer(layer);
    }
  }, [map, featureGroupRef, shapeForEdit]);

  useEffect(() => {
    if (!enabled) {
      if (drawControlRef.current) {
        map.removeControl(drawControlRef.current);
        drawControlRef.current = null;
      }
      return;
    }

    const featureGroup = featureGroupRef.current ?? new L.FeatureGroup();

    if (!featureGroupRef.current) {
      featureGroupRef.current = featureGroup;
      map.addLayer(featureGroup);
    }

    const drawControl = new L.Control.Draw({
      position: 'topright',
      draw: {
        rectangle: false,
        polygon: {},
        circle: {},
        marker: false,
        circlemarker: false,
        polyline: false,
      },
      edit: {
        featureGroup,
        remove: false,
      },
    });

    map.addControl(drawControl);
    drawControlRef.current = drawControl;

    const handleCreated = (e: L.LeafletEvent) => {
      const createdEvent = e as L.DrawEvents.Created;
      const { layer } = createdEvent;

      // Only keep a single layer at a time for this modal
      featureGroup.clearLayers();
      featureGroup.addLayer(layer);

      onDrawCreated(createdEvent);
    };

    const handleEdited = (e: L.LeafletEvent) => {
      const editedEvent = e as L.DrawEvents.Edited;
      if (onDrawEdited) {
        onDrawEdited(editedEvent.layers);
      }
    };

    const handleDeleted = () => {
      featureGroup.clearLayers();
      if (onDrawDeleted) {
        onDrawDeleted();
      }
    };

    map.on(L.Draw.Event.CREATED, handleCreated);
    map.on(L.Draw.Event.EDITED, handleEdited);
    map.on(L.Draw.Event.DELETED, handleDeleted);

    return () => {
      if (drawControlRef.current) {
        map.removeControl(drawControlRef.current);
      }
      map.off(L.Draw.Event.CREATED, handleCreated);
      map.off(L.Draw.Event.EDITED, handleEdited);
      map.off(L.Draw.Event.DELETED, handleDeleted);
    };
  }, [
    map,
    onDrawCreated,
    onDrawEdited,
    onDrawDeleted,
    enabled,
    featureGroupRef,
  ]);

  return null;
}

interface GeofenceFormModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: Omit<Geofence, 'id' | 'createdAt' | 'updatedAt'>) => void;
  geofence?: Geofence | null;
  loading?: boolean;
  availableTeams?: Array<{ id: string; name?: string }>;
}

const GeofenceFormModal: React.FC<GeofenceFormModalProps> = ({
  open,
  onClose,
  onSubmit,
  geofence,
  loading = false,
  availableTeams = [],
}) => {
  const theme = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<LocationSearchResult[]>(
    []
  );
  const [showSearchResults, setShowSearchResults] = useState(false);
  const {
    isLoaded: isGoogleLoaded,
    getPredictions,
    getPlaceDetails,
  } = useGooglePlaces();
  const [selectedLocation, setSelectedLocation] = useState<
    [number, number] | null
  >(null);
  const [selectedLocationName, setSelectedLocationName] = useState('');
  const [mapCenter, setMapCenter] = useState<[number, number]>([
    40.7128, -74.006,
  ]);
  const [mapZoom, setMapZoom] = useState(13);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'circle' as 'circle' | 'polygon' | 'rectangle',
    isActive: true,
    threshold_enabled: false,
    threshold_distance: 50,
    teamId: '',
  });

  // Track initial snapshot to detect changes for enabling Update button
  const initialSnapshotRef = useRef<{
    name: string;
    description: string;
    isActive: boolean;
    center?: [number, number] | null;
    type?: 'circle' | 'polygon' | 'rectangle' | null;
    radius?: number | null;
    coordinates?: [number, number][] | null;
    threshold_enabled?: boolean;
    threshold_distance?: number | null;
    teamId?: string;
  } | null>(null);

  type ShapeData = {
    type: 'circle' | 'polygon' | 'rectangle';
    center?: [number, number];
    radius?: number;
    coordinates?: [number, number][];
  };

  const [drawnShape, setDrawnShape] = useState<ShapeData | null>(null);

  const [manualCoordinates, setManualCoordinates] = useState({
    latitude: '',
    longitude: '',
  });

  const featureGroupRef = useRef<L.FeatureGroup | null>(null);

  // Compute dirty state: whether any meaningful value changed vs initial snapshot
  const isDirty = (() => {
    const init = initialSnapshotRef.current;
    if (!geofence) {
      // For create mode: consider dirty if any input present
      if (formData.name.trim()) return true;
      if (formData.description.trim()) return true;
      if (selectedLocation) return true;
      if (drawnShape) return true;
      return false;
    }

    if (!init) return false;

    if (formData.name.trim() !== (init.name || '')) return true;
    if ((formData.description || '') !== (init.description || '')) return true;
    if (formData.isActive !== !!init.isActive) return true;
    if (formData.threshold_enabled !== (init.threshold_enabled ?? false))
      return true;
    if (formData.threshold_distance !== (init.threshold_distance ?? 50))
      return true;
    if (formData.teamId !== (init.teamId || '')) return true;

    // Compare center/coordinates/drawn shape
    const coordsEqual = (
      a?: [number, number] | null,
      b?: [number, number] | null
    ) => {
      if (!a && !b) return true;
      if (!a || !b) return false;
      return Math.abs(a[0] - b[0]) < 1e-6 && Math.abs(a[1] - b[1]) < 1e-6;
    };

    // If a drawnShape exists now but didn't before (or vice versa)
    if (Boolean(drawnShape) !== Boolean(init.type)) return true;

    if (drawnShape && init.type) {
      if (drawnShape.type !== init.type) return true;
      if (
        drawnShape.center &&
        init.center &&
        !coordsEqual(drawnShape.center, init.center)
      )
        return true;
      if (drawnShape.radius !== (init.radius ?? undefined)) return true;
      if (drawnShape.coordinates && init.coordinates) {
        if (drawnShape.coordinates.length !== init.coordinates.length)
          return true;
        for (let i = 0; i < drawnShape.coordinates.length; i++) {
          if (
            !coordsEqual(
              drawnShape.coordinates[i] as [number, number],
              init.coordinates[i] as [number, number]
            )
          )
            return true;
        }
      }
    }

    // If no drawn shape, compare selected/manual location to initial center
    if (!drawnShape) {
      if (!coordsEqual(selectedLocation ?? null, init.center ?? null))
        return true;
    }

    return false;
  })();

  // Get user's current location for default map center
  useEffect(() => {
    if (open && !geofence) {
      // Only get location when creating a new geofence
      if ('geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(
          position => {
            const userLocation: [number, number] = [
              position.coords.latitude,
              position.coords.longitude,
            ];
            setMapCenter(userLocation);
            setMapZoom(15);
          },
          error => {
            console.warn('Could not get user location:', error);
            // Keep default location
          },
          {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 60000,
          }
        );
      }
    }
  }, [open, geofence, availableTeams]);

  useEffect(() => {
    if (open) {
      if (geofence) {
        setFormData({
          name: geofence.name,
          description: geofence.description || '',
          type: geofence.type,
          isActive: geofence.isActive,
          threshold_enabled: geofence.threshold_enabled ?? false,
          threshold_distance: geofence.threshold_distance ?? 50,
          teamId: geofence.teamId || '',
        });
        setSelectedLocationName(geofence.name);
        setSearchQuery('');
        setMapZoom(15);

        if (geofence.type === 'circle' && geofence.radius) {
          setDrawnShape({
            type: 'circle',
            center: geofence.center,
            radius: geofence.radius,
          });
          setSelectedLocation(geofence.center);
          setMapCenter(geofence.center);
          setManualCoordinates({
            latitude: geofence.center[0].toFixed(6),
            longitude: geofence.center[1].toFixed(6),
          });
        } else if (geofence.coordinates) {
          let calculatedCenter = geofence.center;
          try {
            const bounds = L.latLngBounds(geofence.coordinates);
            const c = bounds.getCenter();
            calculatedCenter = [c.lat, c.lng];
          } catch (e) {
            console.warn('Center calculation failed', e);
          }
          setDrawnShape({
            type: geofence.type,
            center: calculatedCenter,
            coordinates: geofence.coordinates,
          });
          setSelectedLocation(calculatedCenter);
          setMapCenter(calculatedCenter);
          setManualCoordinates({
            latitude: calculatedCenter[0].toFixed(6),
            longitude: calculatedCenter[1].toFixed(6),
          });
        }
        // Capture initial snapshot for dirty-check
        initialSnapshotRef.current = {
          name: geofence.name,
          description: geofence.description || '',
          isActive: geofence.isActive,
          center: geofence.center,
          type: geofence.type,
          radius: geofence.radius ?? null,
          coordinates: geofence.coordinates ?? null,
          threshold_enabled: geofence.threshold_enabled ?? false,
          threshold_distance: geofence.threshold_distance ?? null,
          teamId: geofence.teamId || '',
        };
      } else {
        setFormData({
          name: '',
          description: '',
          type: 'circle',
          isActive: true,
          threshold_enabled: false,
          threshold_distance: 50,
          teamId: availableTeams.length > 0 ? availableTeams[0].id : '',
        });
        setSelectedLocation(null);
        setSelectedLocationName('');
        setSearchQuery('');
        setDrawnShape(null);
        // Map center will be set by geolocation effect above
        setMapZoom(13);
        setManualCoordinates({
          latitude: '',
          longitude: '',
        });
      }
    }
  }, [open, geofence, availableTeams]);

  const searchLocation = async (query: string) => {
    if (query.trim().length < 2) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    if (isGoogleLoaded && getPredictions) {
      try {
        const preds = await getPredictions(query);
        interface GooglePrediction {
          description: string;
          place_id: string;
        }
        const mapped: LocationSearchResult[] = preds.map(
          (p: GooglePrediction) => ({
            display_name: p.description,
            place_id: p.place_id,
          })
        );
        setSearchResults(mapped);
        setShowSearchResults(true);
        return;
      } catch (err) {
        console.warn(
          'Google Places predictions failed, falling back to Nominatim',
          err
        );
      }
    }

    try {
      const results = await searchNominatimLocations(query);
      setSearchResults(results);
      setShowSearchResults(true);
    } catch (error) {
      console.error('Location search error:', error);
      if (query.trim().length >= 3) {
        setSearchResults([]);
        setShowSearchResults(false);
      }
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (value.trim().length < 2) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    searchTimeoutRef.current = setTimeout(() => {
      searchLocation(value);
    }, 500);
  };

  const handleSelectLocation = (result: LocationSearchResult) => {
    const useGoogle =
      isGoogleLoaded && result.place_id && result.place_id.length > 0;
    if (useGoogle && getPlaceDetails) {
      getPlaceDetails(result.place_id)
        .then((place: google.maps.places.PlaceResult) => {
          const lat = place.geometry?.location?.lat();
          const lon = place.geometry?.location?.lng();
          if (lat !== undefined && lon !== undefined) {
            setSelectedLocation([lat, lon]);
            setSelectedLocationName(
              place.formatted_address || place.name || result.display_name
            );
            setMapCenter([lat, lon]);
            setMapZoom(15);
            setSearchQuery(
              place.formatted_address || place.name || result.display_name
            );
            setShowSearchResults(false);
            setManualCoordinates({
              latitude: lat.toFixed(6),
              longitude: lon.toFixed(6),
            });
          }
        })
        .catch(err => {
          console.warn('Failed to fetch Google place details, ignoring', err);
        });
      return;
    }

    // Fallback for Nominatim results which include lat/lon
    if (result.lat && result.lon) {
      const lat = parseFloat(result.lat);
      const lon = parseFloat(result.lon);
      setSelectedLocation([lat, lon]);
      setSelectedLocationName(result.display_name);
      setMapCenter([lat, lon]);
      setMapZoom(15);
      setSearchQuery(result.display_name);
      setShowSearchResults(false);
      setManualCoordinates({
        latitude: lat.toFixed(6),
        longitude: lon.toFixed(6),
      });
    }
  };

  const handleCoordinateChange = (
    field: 'latitude' | 'longitude',
    value: string
  ) => {
    setManualCoordinates(prev => ({
      ...prev,
      [field]: value,
    }));

    const lat =
      field === 'latitude'
        ? parseFloat(value)
        : parseFloat(manualCoordinates.latitude);
    const lng =
      field === 'longitude'
        ? parseFloat(value)
        : parseFloat(manualCoordinates.longitude);

    if (
      !isNaN(lat) &&
      !isNaN(lng) &&
      lat >= -90 &&
      lat <= 90 &&
      lng >= -180 &&
      lng <= 180
    ) {
      const newLocation: [number, number] = [lat, lng];
      setSelectedLocation(newLocation);
      setMapCenter(newLocation);
      if (drawnShape?.center) {
        setDrawnShape(prev => (prev ? { ...prev, center: newLocation } : null));
      }
    }
  };

  const handleMarkerDrag = (e: L.DragEndEvent) => {
    const marker = e.target;
    const position = marker.getLatLng();
    const newLocation: [number, number] = [position.lat, position.lng];
    setSelectedLocation(newLocation);
    setMapCenter(newLocation);
    setManualCoordinates({
      latitude: position.lat.toFixed(6),
      longitude: position.lng.toFixed(6),
    });
    // Update drawn shape center if it exists
    if (drawnShape) {
      if (drawnShape.type === 'circle' && drawnShape.center) {
        setDrawnShape(prev => (prev ? { ...prev, center: newLocation } : null));
      } else if (drawnShape.coordinates && drawnShape.coordinates.length > 0) {
        const oldRef = drawnShape.center || drawnShape.coordinates[0];
        const latDiff = newLocation[0] - oldRef[0];
        const lngDiff = newLocation[1] - oldRef[1];

        const updatedCoords = drawnShape.coordinates.map(
          ([lat, lng]): [number, number] => [lat + latDiff, lng + lngDiff]
        );

        setDrawnShape(prev =>
          prev
            ? { ...prev, center: newLocation, coordinates: updatedCoords }
            : null
        );
      }
    }
  };

  useEffect(() => {
    const handleClickOutside = () => {
      setShowSearchResults(false);
    };

    if (showSearchResults) {
      setTimeout(() => {
        document.addEventListener('click', handleClickOutside);
      }, 100);
    }

    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [showSearchResults]);

  const handleDrawCreated = (e: L.DrawEvents.Created) => {
    const { layer } = e;
    const layerType =
      layer instanceof L.Circle
        ? 'circle'
        : layer instanceof L.Rectangle
          ? 'rectangle'
          : 'polygon';

    let shapeData: {
      type: 'circle' | 'polygon' | 'rectangle';
      center?: [number, number];
      radius?: number;
      coordinates?: [number, number][];
    };

    if (layerType === 'circle') {
      const circle = layer as L.Circle;
      const center = circle.getLatLng();
      const radius = circle.getRadius();
      shapeData = {
        type: 'circle',
        center: [center.lat, center.lng],
        radius,
      };
    } else if (layerType === 'rectangle') {
      const rectangle = layer as L.Rectangle;
      const bounds = rectangle.getBounds();
      const sw = bounds.getSouthWest();
      const ne = bounds.getNorthEast();
      const center = bounds.getCenter();
      shapeData = {
        type: 'rectangle',
        center: [center.lat, center.lng],
        coordinates: [
          [sw.lat, sw.lng],
          [ne.lat, sw.lng],
          [ne.lat, ne.lng],
          [sw.lat, ne.lng],
          [sw.lat, sw.lng],
        ],
      };
    } else {
      const polygon = layer as L.Polygon;
      const latlngs = polygon.getLatLngs()[0] as L.LatLng[];
      const center = polygon.getBounds().getCenter();
      shapeData = {
        type: 'polygon',
        center: [center.lat, center.lng],
        coordinates: latlngs.map(ll => [ll.lat, ll.lng]),
      };
    }

    setDrawnShape(shapeData);
    setFormData(prev => ({ ...prev, type: layerType }));

    // Update coordinates in manual input if shape has a center
    if (shapeData.center) {
      setManualCoordinates({
        latitude: shapeData.center[0].toFixed(6),
        longitude: shapeData.center[1].toFixed(6),
      });
      setSelectedLocation(shapeData.center);
    } else if (shapeData.coordinates && shapeData.coordinates.length > 0) {
      const center = shapeData.center || shapeData.coordinates[0];
      setManualCoordinates({
        latitude: center[0].toFixed(6),
        longitude: center[1].toFixed(6),
      });
      setSelectedLocation(center);
    }
  };

  const handleDrawEdited = (layers: L.LayerGroup<L.Layer>) => {
    let updatedShape: ShapeData | null = null;

    layers.eachLayer(layer => {
      if (layer instanceof L.Circle) {
        const center = layer.getLatLng();
        const radius = layer.getRadius();
        updatedShape = {
          type: 'circle',
          center: [center.lat, center.lng],
          radius,
        };
      } else if (layer instanceof L.Rectangle) {
        const bounds = layer.getBounds();
        const sw = bounds.getSouthWest();
        const ne = bounds.getNorthEast();
        const center = bounds.getCenter();
        updatedShape = {
          type: 'rectangle',
          center: [center.lat, center.lng],
          coordinates: [
            [sw.lat, sw.lng],
            [ne.lat, sw.lng],
            [ne.lat, ne.lng],
            [sw.lat, ne.lng],
            [sw.lat, sw.lng],
          ],
        };
      } else if (layer instanceof L.Polygon) {
        const latlngs = layer.getLatLngs()[0] as L.LatLng[];
        const center = layer.getBounds().getCenter();
        updatedShape = {
          type: 'polygon',
          center: [center.lat, center.lng],
          coordinates: latlngs.map(ll => [ll.lat, ll.lng]),
        };
      }
    });

    if (updatedShape) {
      setDrawnShape(updatedShape);

      const shape = updatedShape as ShapeData;

      if (shape.center) {
        setManualCoordinates({
          latitude: shape.center[0].toFixed(6),
          longitude: shape.center[1].toFixed(6),
        });
        setSelectedLocation(shape.center);
      } else if (shape.coordinates && shape.coordinates.length > 0) {
        const center = shape.center || shape.coordinates[0];
        setManualCoordinates({
          latitude: center[0].toFixed(6),
          longitude: center[1].toFixed(6),
        });
        setSelectedLocation(center);
      }
    }
  };

  const handleDrawDeleted = () => {
    setDrawnShape(null);
  };

  const handleSubmit = () => {
    if (!formData.name.trim()) {
      return;
    }

    // Allow saving when either a drawn boundary exists, or a manual/selected location is provided
    const hasLocation = !!drawnShape || !!selectedLocation;
    if (!hasLocation) return;

    let type: 'circle' | 'polygon' | 'rectangle' = formData.type;
    let centerLocation: [number, number] = mapCenter;
    let radius: number | undefined = undefined;
    let coordinates: [number, number][] | undefined = undefined;

    if (drawnShape) {
      type = drawnShape.type;
      centerLocation =
        drawnShape.center || drawnShape.coordinates?.[0] || mapCenter;
      radius = drawnShape.radius;
      coordinates = drawnShape.coordinates;
    } else if (selectedLocation) {
      centerLocation = selectedLocation;
      // If editing and original geofence had a radius, keep type as circle; otherwise use selected type
      radius = undefined;
      coordinates = undefined;
    }

    onSubmit({
      tenantId: geofence?.tenantId || 'tenant-1',
      name: formData.name,
      description: formData.description,
      type,
      center: centerLocation,
      radius,
      coordinates,
      isActive: formData.isActive,
      threshold_enabled: formData.threshold_enabled,
      threshold_distance: formData.threshold_enabled
        ? formData.threshold_distance
        : undefined,
      teamId: formData.teamId,
    });
  };

  const handleClose = () => {
    setShowSearchResults(false);
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth='lg'
      fullWidth
      PaperProps={{
        sx: {
          maxHeight: '90vh',
        },
      }}
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
            {geofence ? 'Edit Geofence' : 'Create New Geofence'}
          </Typography>
          <IconButton onClick={handleClose} size='small'>
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent dividers>
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', md: 'row' },
            gap: 3,
            minHeight: '500px',
          }}
        >
          {/* Left Side - Form */}
          <Box sx={{ width: { xs: '100%', md: '40%' } }}>
            <Typography variant='body2' color='text.secondary' mb={2}>
              Search for a location to navigate there, then draw a boundary on
              the map anywhere you want. Fill in the details below.
            </Typography>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {/* Location Search */}
              <Box sx={{ position: 'relative' }}>
                <TextField
                  label='Search Location'
                  fullWidth
                  size='small'
                  value={searchQuery}
                  onChange={handleSearchChange}
                  onFocus={() => {
                    if (searchResults.length > 0) {
                      setShowSearchResults(true);
                    }
                  }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position='start'>
                        <SearchIcon />
                      </InputAdornment>
                    ),
                  }}
                  placeholder='Enter address or place name...'
                />
                {showSearchResults && searchResults.length > 0 && (
                  <Paper
                    sx={{
                      position: 'absolute',
                      top: '100%',
                      left: 0,
                      right: 0,
                      zIndex: 1000,
                      mt: 0.5,
                      maxHeight: 200,
                      overflow: 'auto',
                    }}
                  >
                    <List dense>
                      {searchResults.map(result => (
                        <ListItem key={result.place_id} disablePadding>
                          <ListItemButton
                            onClick={() => handleSelectLocation(result)}
                          >
                            <LocationIcon
                              sx={{ mr: 1, color: 'primary.main' }}
                            />
                            <ListItemText
                              primary={
                                result.display_name
                                  .split(',')
                                  .slice(0, 2)
                                  .join(',') ||
                                result.display_name.substring(0, 50)
                              }
                              secondary={
                                result.display_name.length > 50
                                  ? result.display_name.substring(50)
                                  : result.display_name
                                      .split(',')
                                      .slice(2)
                                      .join(',')
                              }
                              primaryTypographyProps={{
                                style: { fontWeight: 500 },
                              }}
                            />
                          </ListItemButton>
                        </ListItem>
                      ))}
                    </List>
                  </Paper>
                )}
              </Box>

              {selectedLocation && (
                <Alert severity='success' sx={{ mb: 1 }}>
                  <Typography variant='body2' fontWeight='bold'>
                    Navigated to: {selectedLocationName}
                  </Typography>
                  <Typography variant='caption'>
                    Coordinates: {selectedLocation[0].toFixed(6)},{' '}
                    {selectedLocation[1].toFixed(6)}
                  </Typography>
                </Alert>
              )}

              <TextField
                label='Geofence Name'
                fullWidth
                required
                size='small'
                value={formData.name}
                onChange={e =>
                  setFormData({ ...formData, name: e.target.value })
                }
              />

              <TextField
                label='Description'
                fullWidth
                multiline
                rows={3}
                size='small'
                value={formData.description}
                onChange={e =>
                  setFormData({ ...formData, description: e.target.value })
                }
              />

              <Box sx={{ display: 'flex', gap: 1 }}>
                <TextField
                  label='Latitude'
                  fullWidth
                  size='small'
                  type='number'
                  value={manualCoordinates.latitude}
                  onChange={e =>
                    handleCoordinateChange('latitude', e.target.value)
                  }
                  inputProps={{
                    step: '0.000001',
                    min: -90,
                    max: 90,
                  }}
                />
                <TextField
                  label='Longitude'
                  fullWidth
                  size='small'
                  type='number'
                  value={manualCoordinates.longitude}
                  onChange={e =>
                    handleCoordinateChange('longitude', e.target.value)
                  }
                  inputProps={{
                    step: '0.000001',
                    min: -180,
                    max: 180,
                  }}
                />
              </Box>

              {/* Radius Input for Circle */}
              {formData.type === 'circle' &&
                drawnShape?.type === 'circle' &&
                drawnShape.radius && (
                  <Box>
                    <Typography variant='caption' color='text.secondary' mb={1}>
                      Radius (meters)
                    </Typography>
                    <TextField
                      label='Radius'
                      fullWidth
                      size='small'
                      type='number'
                      value={Math.round(drawnShape.radius)}
                      onChange={e => {
                        const radius = parseFloat(e.target.value);
                        if (!isNaN(radius) && radius > 0) {
                          setDrawnShape(prev =>
                            prev ? { ...prev, radius } : null
                          );
                        }
                      }}
                      inputProps={{
                        min: 1,
                        step: 1,
                      }}
                    />
                  </Box>
                )}

              <FormControlLabel
                control={
                  <Switch
                    checked={formData.isActive}
                    onChange={e =>
                      setFormData({ ...formData, isActive: e.target.checked })
                    }
                  />
                }
                label='Active'
              />

              {/* Threshold Distance Toggle and Input */}
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.threshold_enabled}
                    onChange={e =>
                      setFormData({
                        ...formData,
                        threshold_enabled: e.target.checked,
                      })
                    }
                  />
                }
                label='Enable Threshold Distance'
              />

              {formData.threshold_enabled && (
                <TextField
                  label='Threshold Distance (meters)'
                  fullWidth
                  size='small'
                  type='number'
                  value={formData.threshold_distance}
                  onChange={e => {
                    const value = parseFloat(e.target.value);
                    if (!isNaN(value) && value > 0) {
                      setFormData({
                        ...formData,
                        threshold_distance: value,
                      });
                    }
                  }}
                  inputProps={{
                    min: 1,
                    step: 1,
                  }}
                />
              )}

              {!drawnShape && (
                <Alert severity='info'>
                  Use the drawing tools on the map to draw a {formData.type}{' '}
                  boundary. You can search for a location to navigate there
                  first (optional).
                </Alert>
              )}
            </Box>
          </Box>

          {/* Right Side - Map */}
          <Box sx={{ width: { xs: '100%', md: '60%' } }}>
            <Box
              sx={{
                height: '500px',
                width: '100%',
                borderRadius: 1,
                overflow: 'hidden',
                position: 'relative',
                border: '1px solid',
                borderColor: 'divider',
                '& .leaflet-container': {
                  height: '100%',
                  width: '100%',
                  zIndex: 0,
                },
              }}
            >
              <MapContainer
                center={mapCenter}
                zoom={mapZoom}
                style={{ height: '100%', width: '100%', zIndex: 0 }}
                zoomControl={true}
                scrollWheelZoom={true}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url='https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
                  maxZoom={19}
                  minZoom={1}
                />
                <MapController center={mapCenter} zoom={mapZoom} />

                {/* Selected Location Marker - Draggable */}
                {selectedLocation && (
                  <DraggableMarker
                    key={`marker-${selectedLocation[0]}-${selectedLocation[1]}`}
                    position={selectedLocation}
                    name={selectedLocationName}
                    onDragEnd={handleMarkerDrag}
                  />
                )}

                {/* Existing drawn shape preview */}
                {drawnShape && (
                  <>
                    {drawnShape.type === 'circle' &&
                      drawnShape.center &&
                      drawnShape.radius && (
                        <Circle
                          center={drawnShape.center}
                          radius={drawnShape.radius}
                          pathOptions={{
                            color: theme.palette.primary.main,
                            fillColor: theme.palette.primary.main,
                            fillOpacity: 0.3,
                          }}
                        />
                      )}
                    {drawnShape.type === 'rectangle' &&
                      drawnShape.coordinates && (
                        <Rectangle
                          bounds={
                            [
                              [
                                drawnShape.coordinates[0][0],
                                drawnShape.coordinates[0][1],
                              ],
                              [
                                drawnShape.coordinates[2][0],
                                drawnShape.coordinates[2][1],
                              ],
                            ] as [[number, number], [number, number]]
                          }
                          pathOptions={{
                            color: theme.palette.primary.main,
                            fillColor: theme.palette.primary.main,
                            fillOpacity: 0.3,
                          }}
                        />
                      )}
                    {drawnShape.type === 'polygon' &&
                      drawnShape.coordinates && (
                        <Polygon
                          positions={drawnShape.coordinates}
                          pathOptions={{
                            color: theme.palette.primary.main,
                            fillColor: theme.palette.primary.main,
                            fillOpacity: 0.3,
                          }}
                        />
                      )}
                  </>
                )}

                {/* Drawing + Editing Tools */}
                <DrawControl
                  onDrawCreated={handleDrawCreated}
                  onDrawEdited={handleDrawEdited}
                  onDrawDeleted={handleDrawDeleted}
                  enabled={true}
                  featureGroupRef={featureGroupRef}
                  shapeForEdit={drawnShape}
                />
              </MapContainer>
            </Box>
          </Box>
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        <AppButton onClick={handleClose} variant='outlined'>
          Cancel
        </AppButton>
        <AppButton
          onClick={handleSubmit}
          variant='contained'
          disabled={(() => {
            // Name is always required
            if (!formData.name.trim()) return true;
            // If editing, require at least one change
            if (geofence) {
              return !isDirty || loading;
            }
            // Creating: need a location (drawn or selected)
            const hasLocation = !!drawnShape || !!selectedLocation;
            return !hasLocation || loading;
          })()}
        >
          {loading ? (
            <CircularProgress size={20} color='inherit' />
          ) : geofence ? (
            'Update'
          ) : (
            'Create'
          )}
        </AppButton>
      </DialogActions>
    </Dialog>
  );
};

export default GeofenceFormModal;
