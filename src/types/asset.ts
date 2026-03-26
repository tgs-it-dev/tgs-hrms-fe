// Asset Management Types

export interface Asset {
  id: string;
  name: string;
  category: AssetCategory;
  status: AssetStatus;
  assignedTo?: string; // User ID
  assignedToName?: string; // User name for display
  serialNumber: string;
  purchaseDate: string;
  warrantyExpiry?: string;
  location: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  subcategoryId?: string;
}

export interface AssetCategory {
  id: string;
  name: string;
  nameAr: string;
  description?: string;
  color?: string;
  subcategories?: string[];
  requestedItem?: string; // Specific item requested (subcategory)
}

export type AssetStatus =
  | 'available'
  | 'assigned'
  | 'under_maintenance'
  | 'retired';

export interface AssetRequest {
  id: string;
  employeeId: string;
  employeeName: string;
  category: AssetCategory;
  subcategoryId?: string;
  subcategoryName?: string;
  remarks?: string;
  managerRemarks?: string;
  status: RequestStatus;
  requestedDate: string;
  processedDate?: string;
  processedBy?: string;
  processedByName?: string;
  rejectionReason?: string;
  assignedAssetId?: string;
  assignedAssetName?: string;
}

export type RequestStatus = 'pending' | 'approved' | 'rejected' | 'cancelled';

export interface CreateAssetRequest {
  categoryId: string;
  remarks?: string;
}

export interface UpdateAssetRequest {
  name: string;
  category: string;
  serialNumber: string;
  purchaseDate: string;
  warrantyExpiry?: string;
  location: string;
  description?: string;
}

export interface AssignAssetRequest {
  assetId: string;
  userId: string;
}

export interface ProcessRequestRequest {
  requestId: string;
  action: 'approve' | 'reject';
  rejectionReason?: string;
}

// Mock data types
export interface MockUser {
  id: string;
  name: string;
  email: string;
  department: string;
}

// Filter types
export interface AssetFilters {
  status?: AssetStatus;
  category?: string;
  assignedTo?: string[];
}

export interface RequestFilters {
  status?: RequestStatus[];
  category?: string[];
  employee?: string[];
  dateRange?: {
    start: string;
    end: string;
  };
}

// Statistics types
export interface AssetStatistics {
  totalAssets: number;
  availableAssets: number;
  assignedAssets: number;
  underMaintenanceAssets: number;
  retiredAssets: number;
  totalRequests: number;
  pendingRequests: number;
  approvedRequests: number;
  rejectedRequests: number;
}
