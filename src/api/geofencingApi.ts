import type { Geofence } from '../types/geofencing';
import axiosInstance from './axiosInstance';

// Backend API shapes
export interface GeofenceResponse {
  id: string;
  tenant_id: string;
  name: string;
  description?: string | null;
  latitude: string;
  longitude: string;
  status: 'active' | 'inactive' | string;
  created_at: string;
  updated_at: string;
  radius?: number | string | null;
  coordinates?: [number, number][] | null;
  type?: 'circle' | 'polygon' | 'rectangle' | string | null;
  team_id?: string | null;
  threshold_enabled?: boolean | null;
  threshold_distance?: number | string | null;
}

export interface CreateGeofencePayload {
  name: string;
  description?: string;
  latitude: number;
  longitude: number;
  status?: 'active' | 'inactive' | string;
  type?: 'circle' | 'polygon' | 'rectangle' | string;
  radius?: number | null;
  coordinates?: [number, number][] | null;
  team_id?: string;
  threshold_enabled?: boolean;
  threshold_distance?: number | null;
}

export interface UpdateGeofencePayload {
  name?: string;
  description?: string;
  latitude?: number;
  longitude?: number;
  status?: 'active' | 'inactive' | string;
  type?: 'circle' | 'polygon' | 'rectangle' | string;
  radius?: number | null;
  coordinates?: [number, number][] | null;
  team_id?: string | null;
  threshold_enabled?: boolean;
  threshold_distance?: number | null;
}

class GeofencingApiService {
  // Map backend geofence to frontend Geofence type
  private mapFromBackend(item: GeofenceResponse): Geofence {
    const lat = Number(item.latitude);
    const lng = Number(item.longitude);
    const center: [number, number] = [
      Number.isFinite(lat) ? lat : 0,
      Number.isFinite(lng) ? lng : 0,
    ];
    const radiusVal =
      item.radius !== null && item.radius !== undefined
        ? Number(item.radius)
        : undefined;
    return {
      id: item.id,
      tenantId: item.tenant_id,
      teamId: item.team_id ?? undefined,
      name: item.name,
      description: item.description ?? '',
      type: (item.type as 'circle' | 'polygon' | 'rectangle') ?? 'circle',
      center,
      radius: Number.isFinite(radiusVal) ? radiusVal : undefined,
      coordinates: item.coordinates ?? undefined,
      isActive: item.status === 'active',
      threshold_enabled: item.threshold_enabled ?? false,
      threshold_distance:
        item.threshold_distance !== null &&
        item.threshold_distance !== undefined
          ? Number(item.threshold_distance)
          : undefined,
      createdAt: item.created_at,
      updatedAt: item.updated_at,
    };
  }

  async getGeofences(): Promise<Geofence[]> {
    const resp = await axiosInstance.get<GeofenceResponse[]>('/geofences');
    const data = resp.data ?? [];
    return data.map(d => this.mapFromBackend(d));
  }

  async getGeofenceById(id: string): Promise<Geofence | null> {
    const resp = await axiosInstance.get<GeofenceResponse>(`/geofences/${id}`);
    const data = resp.data;
    return data ? this.mapFromBackend(data) : null;
  }

  async createGeofence(
    data:
      | CreateGeofencePayload
      | Omit<Geofence, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<Geofence> {
    // Build a sanitized payload containing only backend-expected fields (snake_case)
    type InputData = Partial<CreateGeofencePayload> &
      Partial<Geofence> & {
        isActive?: boolean;
        teamId?: string;
        team_id?: string;
      };
    const input = data as InputData;
    const payload: CreateGeofencePayload = {
      name: input.name || '',
      latitude: 0,
      longitude: 0,
    };

    if (typeof input.name !== 'undefined') payload.name = input.name;
    if (typeof input.description !== 'undefined')
      payload.description = input.description;

    // center (frontend) -> latitude/longitude (backend)
    if (Array.isArray(input.center) && input.center.length >= 2) {
      payload.latitude = input.center[0];
      payload.longitude = input.center[1];
    }

    if (typeof input.latitude !== 'undefined')
      payload.latitude = input.latitude;
    if (typeof input.longitude !== 'undefined')
      payload.longitude = input.longitude;

    if (typeof input.isActive === 'boolean') {
      payload.status = input.isActive ? 'active' : 'inactive';
    }

    if (typeof input.type !== 'undefined') payload.type = input.type;
    if (typeof input.radius !== 'undefined')
      payload.radius = input.radius ?? null;
    if (typeof input.coordinates !== 'undefined')
      payload.coordinates = input.coordinates;

    if (typeof input.teamId !== 'undefined') payload.team_id = input.teamId;
    if (typeof input.team_id !== 'undefined') payload.team_id = input.team_id;

    if (typeof input.threshold_enabled !== 'undefined')
      payload.threshold_enabled = input.threshold_enabled;
    if (typeof input.threshold_distance !== 'undefined')
      payload.threshold_distance = input.threshold_distance ?? null;

    const resp = await axiosInstance.post<GeofenceResponse>(
      '/geofences',
      payload
    );
    return this.mapFromBackend(resp.data);
  }

  async updateGeofence(
    id: string,
    data: UpdateGeofencePayload | Partial<Geofence>
  ): Promise<Geofence> {
    // Build a sanitized payload that only contains backend-expected fields
    const payload: UpdateGeofencePayload = {};

    // Accept either backend-shaped payload or frontend Geofence-like partials.
    type InputData = Partial<UpdateGeofencePayload> &
      Partial<Geofence> & {
        isActive?: boolean;
        teamId?: string;
        team_id?: string;
      };
    const input = data as InputData;

    if (typeof input.name !== 'undefined') payload.name = input.name;
    if (typeof input.description !== 'undefined')
      payload.description = input.description;

    // center (frontend) -> latitude/longitude (backend)
    if (Array.isArray(input.center) && input.center.length >= 2) {
      payload.latitude = input.center[0];
      payload.longitude = input.center[1];
    }

    // direct latitude/longitude if provided
    if (typeof input.latitude !== 'undefined')
      payload.latitude = input.latitude;
    if (typeof input.longitude !== 'undefined')
      payload.longitude = input.longitude;

    if (typeof input.isActive === 'boolean') {
      payload.status = input.isActive ? 'active' : 'inactive';
    }

    if (typeof input.type !== 'undefined') payload.type = input.type;
    if (typeof input.radius !== 'undefined')
      payload.radius = input.radius ?? null;

    if (typeof input.coordinates !== 'undefined')
      payload.coordinates = input.coordinates;

    // teamId (frontend) -> team_id (backend)
    if (typeof input.teamId !== 'undefined') payload.team_id = input.teamId;
    if (typeof input.team_id !== 'undefined') payload.team_id = input.team_id;

    if (typeof input.threshold_enabled !== 'undefined')
      payload.threshold_enabled = input.threshold_enabled;
    if (typeof input.threshold_distance !== 'undefined')
      payload.threshold_distance = input.threshold_distance ?? null;

    const resp = await axiosInstance.patch<GeofenceResponse>(
      `/geofences/${id}`,
      payload
    );
    return this.mapFromBackend(resp.data);
  }

  async deleteGeofence(id: string): Promise<void> {
    await axiosInstance.delete(`/geofences/${id}`);
  }
}

export const geofencingApi = new GeofencingApiService();

// ── Nominatim (OSM) geocoding ─────────────────────────────────────────────────

export interface NominatimResult {
  place_id: string;
  display_name: string;
  lat: string;
  lon: string;
  [key: string]: unknown;
}

/**
 * Search for locations via the Nominatim OpenStreetMap API.
 * Returned place_id is always coerced to string for consistency.
 */
export async function searchNominatimLocations(
  query: string
): Promise<NominatimResult[]> {
  const response = await fetch(
    `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=10&addressdetails=1&extratags=1`,
    {
      headers: {
        'User-Agent': 'TGS-HRMS-Geofencing/1.0',
        'Accept-Language': 'en',
      },
    }
  );

  if (!response.ok) {
    throw new Error('Location search failed');
  }

  const data = (await response.json()) as NominatimResult[];
  return data.map(d => ({
    ...d,
    place_id: String(d.place_id ?? d.osm_id ?? d.display_name),
  }));
}
