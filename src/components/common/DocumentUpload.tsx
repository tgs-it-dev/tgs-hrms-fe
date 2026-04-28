import React, { useRef } from 'react';
import {
  Box,
  Typography,
  IconButton,
  Paper,
  useTheme,
  Button,
} from '@mui/material';
import { Delete as DeleteIcon } from '@mui/icons-material';
import { env } from '../../config/env';
export interface DocumentItem {
  id: string;
  url?: string; // For existing documents (URLs)
  file?: File; // For new documents (Files)
  name: string;
}

interface DocumentUploadProps {
  label?: string;
  existingDocuments?: string[]; // Array of document URLs
  newDocuments?: File[]; // Array of new File objects
  onDocumentsChange?: (documents: { existing: string[]; new: File[] }) => void;
  onDocumentRemove?: (type: 'existing' | 'new', index: number) => void;

  multiple?: boolean;
  accept?: string;
  maxSize?: number; // in bytes
  disabled?: boolean;
}

const DocumentUpload: React.FC<DocumentUploadProps> = ({
  label = 'Supporting Documents (Optional)',
  existingDocuments = [],
  newDocuments = [],
  onDocumentsChange,
  onDocumentRemove,
  multiple = true,
  accept,
  maxSize = 10 * 1024 * 1024, // 10MB default
  disabled = false,
}) => {
  const theme = useTheme();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Helper function to construct base URL for documents
  const getBaseDocumentUrl = (docUrl: string): string => {
    if (!docUrl) return '';
    if (docUrl.startsWith('http://') || docUrl.startsWith('https://')) {
      return docUrl;
    }
    if (docUrl.startsWith('/')) {
      return `${env.apiBaseUrl}${docUrl}`;
    }
    return `${env.apiBaseUrl}/${docUrl}`;
  };

  // Check if a file is an image
  const isImageFile = (fileName: string): boolean => {
    const extension = fileName.split('.').pop()?.toLowerCase() || '';
    return ['jpeg', 'jpg', 'png', 'gif', 'webp', 'bmp', 'svg'].includes(
      extension
    );
  };

  // Validate if file is an image
  const validateImageFile = (file: File): boolean => {
    return file.type.startsWith('image/') || isImageFile(file.name);
  };

  // Get file name from URL or File
  const getFileName = (urlOrFile: string | File): string => {
    if (typeof urlOrFile === 'string') {
      return urlOrFile.split('/').pop() || 'Document';
    }
    return urlOrFile.name;
  };

  // Handle file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;

    const files = Array.from(e.target.files);
    const validFiles: File[] = [];

    files.forEach(file => {
      // Only allow image files
      if (!validateImageFile(file)) {
        return;
      }
      if (file.size > maxSize) {
        // Could show error here
        return;
      }
      validFiles.push(file);
    });

    if (validFiles.length > 0 && onDocumentsChange) {
      onDocumentsChange({
        existing: existingDocuments,
        new: [...newDocuments, ...validFiles],
      });
    }

    // Reset input
    e.target.value = '';
  };

  // Handle document removal
  const handleRemove = (type: 'existing' | 'new', index: number) => {
    if (onDocumentRemove) {
      onDocumentRemove(type, index);
    } else if (onDocumentsChange) {
      if (type === 'existing') {
        const updated = existingDocuments.filter((_, i) => i !== index);
        onDocumentsChange({ existing: updated, new: newDocuments });
      } else {
        const updated = newDocuments.filter((_, i) => i !== index);
        onDocumentsChange({ existing: existingDocuments, new: updated });
      }
    }
  };

  // Render document preview
  const renderDocument = (
    doc: string | File,
    type: 'existing' | 'new',
    index: number
  ) => {
    const fileName = getFileName(doc);
    const isExisting = type === 'existing';
    const docUrlString = isExisting ? (doc as string) : '';

    const imageUrl =
      typeof doc === 'string'
        ? getBaseDocumentUrl(doc)
        : URL.createObjectURL(doc);

    if (!imageUrl || imageUrl === '') return null;

    return (
      <Paper
        key={`${type}-${index}`}
        elevation={1}
        sx={{
          p: 1.5,
          display: 'flex',
          flexDirection: 'column',
          gap: 1,
          position: 'relative',
          border: `1px solid ${theme.palette.divider}`,
          borderRadius: 2,
          '&:hover': { boxShadow: 2 },
        }}
      >
        {/* Image Preview Container */}
        <Box
          sx={{
            width: '100%',
            height: 120,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: theme.palette.action.hover,
            borderRadius: 1,
            overflow: 'hidden',
            position: 'relative',
            border: '1px solid #ccc',
            cursor: isExisting && docUrlString ? 'pointer' : 'default',
          }}
          onClick={() => {
            if (isExisting && docUrlString) {
              const baseUrl = getBaseDocumentUrl(docUrlString);
              window.open(baseUrl, '_blank');
            }
          }}
        >
          <Box
            component='img'
            src={imageUrl}
            alt={fileName}
            onError={e => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
            sx={{
              width: '100%',
              height: '100%',
              objectFit: 'cover', // or 'contain' based on preference
            }}
          />
        </Box>

        {/* File Name */}
        <Typography
          variant='body2'
          sx={{
            fontWeight: 500,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            fontSize: '12px',
            textAlign: 'center',
          }}
          title={fileName}
        >
          {fileName}
        </Typography>

        {/* Action Buttons */}
        <Box sx={{ display: 'flex', justifyContent: 'center' }}>
          {!disabled && (
            <IconButton
              size='small'
              onClick={() => handleRemove(type, index)}
              sx={{ color: theme.palette.error.main }}
            >
              <DeleteIcon fontSize='small' />
            </IconButton>
          )}
        </Box>
      </Paper>
    );
  };

  const hasDocuments = existingDocuments.length > 0 || newDocuments.length > 0;

  return (
    <Box>
      <Typography
        variant='subtitle2'
        sx={{
          mb: 1.5,
          fontWeight: 500,
          fontSize: { xs: '14px', sm: '16px' },
        }}
      >
        {label}
      </Typography>

      {/* Existing Documents */}
      {existingDocuments.length > 0 && (
        <Box sx={{ mb: 2 }}>
          <Typography
            variant='caption'
            color='text.secondary'
            sx={{ mb: 1, display: 'block', fontSize: '12px' }}
          >
            Existing Documents:
          </Typography>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: 'repeat(auto-fill, minmax(120px, 1fr))',
                sm: 'repeat(auto-fill, minmax(140px, 1fr))',
                md: 'repeat(auto-fill, minmax(160px, 1fr))',
              },
              gap: 1.5,
            }}
          >
            {existingDocuments.map((doc, index) =>
              renderDocument(doc, 'existing', index)
            )}
          </Box>
        </Box>
      )}

      {/* New Documents */}
      {newDocuments.length > 0 && (
        <Box sx={{ mb: 2 }}>
          <Typography
            variant='caption'
            color='text.secondary'
            sx={{ mb: 1, display: 'block', fontSize: '12px' }}
          >
            {existingDocuments.length > 0
              ? 'New Documents to Add:'
              : 'Documents:'}
          </Typography>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: 'repeat(auto-fill, minmax(120px, 1fr))',
                sm: 'repeat(auto-fill, minmax(140px, 1fr))',
                md: 'repeat(auto-fill, minmax(160px, 1fr))',
              },
              gap: 1.5,
            }}
          >
            {newDocuments.map((file, index) =>
              renderDocument(file, 'new', index)
            )}
          </Box>
        </Box>
      )}

      {/* File Input Button */}
      {!disabled && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <input
            ref={fileInputRef}
            type='file'
            accept={accept || 'image/*'}
            multiple={multiple}
            onChange={handleFileSelect}
            style={{ display: 'none' }}
          />
          <Button
            variant='outlined'
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled}
            sx={{
              textTransform: 'none',
              borderColor: theme.palette.divider,
              color: theme.palette.text.primary,
              '&:hover': {
                borderColor: theme.palette.primary.main,
                backgroundColor: theme.palette.action.hover,
              },
            }}
          >
            {hasDocuments ? 'Add More Documents' : 'Choose files'}
          </Button>
          {!hasDocuments && (
            <Typography
              variant='caption'
              color='text.secondary'
              sx={{ fontSize: '12px' }}
            >
              No file chosen
            </Typography>
          )}
        </Box>
      )}
    </Box>
  );
};

export default DocumentUpload;
