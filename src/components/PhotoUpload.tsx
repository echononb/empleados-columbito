import React, { useState, useRef, useCallback } from 'react';
import { storage } from '../firebase';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';

interface PhotoUploadProps {
  currentPhotoUrl?: string;
  onPhotoUploaded: (url: string) => void;
  onPhotoRemoved: () => void;
  disabled?: boolean;
}

const PhotoUpload: React.FC<PhotoUploadProps> = ({
  currentPhotoUrl,
  onPhotoUploaded,
  onPhotoRemoved,
  disabled = false
}) => {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Por favor selecciona un archivo de imagen válido.');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('La imagen debe ser menor a 5MB.');
      return;
    }

    setError('');
    await uploadPhoto(file);
  }, []);

  const uploadPhoto = useCallback(async (file: File) => {
    if (!storage) {
      setError('Firebase Storage no está configurado.');
      return;
    }

    setUploading(true);
    try {
      // Create unique filename
      const timestamp = Date.now();
      const filename = `employee_photos/${timestamp}_${file.name}`;
      const storageRef = ref(storage, filename);

      // Upload file with metadata for better performance
      const metadata = {
        contentType: file.type,
        customMetadata: {
          uploadedAt: new Date().toISOString(),
          originalName: file.name
        }
      };

      await uploadBytes(storageRef, file, metadata);

      // Get download URL
      const downloadURL = await getDownloadURL(storageRef);

      onPhotoUploaded(downloadURL);
    } catch (error) {
      console.error('Error uploading photo:', error);
      setError('Error al subir la foto. Inténtalo de nuevo.');
    } finally {
      setUploading(false);
    }
  }, [onPhotoUploaded]);

  const handleRemovePhoto = async () => {
    if (!currentPhotoUrl || !storage) return;

    try {
      // Extract filename from URL to delete from storage
      const urlParts = currentPhotoUrl.split('/');
      const filename = urlParts[urlParts.length - 1].split('?')[0];
      const storageRef = ref(storage, `employee_photos/${filename}`);

      await deleteObject(storageRef);
    } catch (error) {
      console.error('Error deleting photo:', error);
      // Continue with removal even if delete fails
    }

    onPhotoRemoved();
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="photo-upload">
      <label className="photo-upload-label">Foto del Empleado</label>

      <div className="photo-upload-container">
        {currentPhotoUrl ? (
          <div className="photo-preview">
            <img
              src={currentPhotoUrl}
              alt="Foto del empleado"
              className="photo-image"
            />
            <div className="photo-actions">
              <button
                type="button"
                onClick={triggerFileSelect}
                disabled={disabled || uploading}
                className="btn btn-secondary btn-small"
              >
                Cambiar Foto
              </button>
              <button
                type="button"
                onClick={handleRemovePhoto}
                disabled={disabled}
                className="btn btn-danger btn-small"
              >
                Remover
              </button>
            </div>
          </div>
        ) : (
          <div className="photo-placeholder">
            <div className="photo-placeholder-icon">📷</div>
            <p>No hay foto seleccionada</p>
            <button
              type="button"
              onClick={triggerFileSelect}
              disabled={disabled || uploading}
              className="btn btn-primary btn-small"
            >
              {uploading ? 'Subiendo...' : 'Seleccionar Foto'}
            </button>
          </div>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        style={{ display: 'none' }}
        disabled={disabled || uploading}
      />

      {error && <div className="error-message">{error}</div>}

      <div className="photo-upload-info">
        <small>
          Formatos aceptados: JPG, PNG, GIF. Tamaño máximo: 5MB.
          {!storage && ' (Firebase Storage no configurado)'}
        </small>
      </div>
    </div>
  );
};

export default PhotoUpload;