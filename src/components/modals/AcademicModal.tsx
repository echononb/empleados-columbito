import React, { useState, useEffect } from 'react';

interface AcademicData {
  gradoInstruccion: string;
  nombreInstitucion: string;
  tipoInstitucion: string;
  carrera: string;
  anoEgreso: number;
}

interface AcademicModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: AcademicData) => void;
  initialData?: AcademicData;
}

const AcademicModal: React.FC<AcademicModalProps> = ({ isOpen, onClose, onSave, initialData }) => {
  const [academicData, setAcademicData] = useState<AcademicData>({
    gradoInstruccion: '',
    nombreInstitucion: '',
    tipoInstitucion: '',
    carrera: '',
    anoEgreso: new Date().getFullYear()
  });

  const [errors, setErrors] = useState<{[key: string]: string}>({});

  useEffect(() => {
    if (initialData) {
      setAcademicData(initialData);
    } else {
      setAcademicData({
        gradoInstruccion: '',
        nombreInstitucion: '',
        tipoInstitucion: '',
        carrera: '',
        anoEgreso: new Date().getFullYear()
      });
    }
  }, [initialData, isOpen]);

  const validateForm = (): boolean => {
    const newErrors: {[key: string]: string} = {};

    if (!academicData.gradoInstruccion) {
      newErrors.gradoInstruccion = 'Grado de instrucción es requerido';
    }
    if (!academicData.nombreInstitucion) {
      newErrors.nombreInstitucion = 'Nombre de institución es requerido';
    }
    if (!academicData.tipoInstitucion) {
      newErrors.tipoInstitucion = 'Tipo de institución es requerido';
    }
    if (!academicData.carrera) {
      newErrors.carrera = 'Carrera es requerida';
    }
    if (!academicData.anoEgreso || academicData.anoEgreso < 1950 || academicData.anoEgreso > new Date().getFullYear() + 10) {
      newErrors.anoEgreso = 'Año de egreso inválido';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    onSave(academicData);
    onClose();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const numericValue = type === 'number' ? parseInt(value) || 0 : value;

    setAcademicData(prev => ({
      ...prev,
      [name]: numericValue
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h3>Información Académica</h3>
          <button type="button" onClick={onClose} className="modal-close">
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-body">
          <div className="form-group">
            <label htmlFor="gradoInstruccion">Grado de Instrucción *</label>
            <select
              id="gradoInstruccion"
              name="gradoInstruccion"
              value={academicData.gradoInstruccion}
              onChange={handleInputChange}
              className={errors.gradoInstruccion ? 'error' : ''}
            >
              <option value="">Seleccionar grado...</option>
              <option value="Primaria">Primaria</option>
              <option value="Secundaria">Secundaria</option>
              <option value="Técnico">Técnico</option>
              <option value="Universitario">Universitario</option>
              <option value="Maestría">Maestría</option>
              <option value="Doctorado">Doctorado</option>
              <option value="Otro">Otro</option>
            </select>
            {errors.gradoInstruccion && <span className="error-message">{errors.gradoInstruccion}</span>}
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="nombreInstitucion">Nombre de Institución *</label>
              <input
                type="text"
                id="nombreInstitucion"
                name="nombreInstitucion"
                value={academicData.nombreInstitucion}
                onChange={handleInputChange}
                placeholder="Ej: Universidad Nacional"
                className={errors.nombreInstitucion ? 'error' : ''}
              />
              {errors.nombreInstitucion && <span className="error-message">{errors.nombreInstitucion}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="tipoInstitucion">Tipo de Institución *</label>
              <select
                id="tipoInstitucion"
                name="tipoInstitucion"
                value={academicData.tipoInstitucion}
                onChange={handleInputChange}
                className={errors.tipoInstitucion ? 'error' : ''}
              >
                <option value="">Seleccionar tipo...</option>
                <option value="publica">Pública</option>
                <option value="privada">Privada</option>
              </select>
              {errors.tipoInstitucion && <span className="error-message">{errors.tipoInstitucion}</span>}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="carrera">Carrera/Profesión *</label>
              <input
                type="text"
                id="carrera"
                name="carrera"
                value={academicData.carrera}
                onChange={handleInputChange}
                placeholder="Ej: Ingeniería Civil"
                className={errors.carrera ? 'error' : ''}
              />
              {errors.carrera && <span className="error-message">{errors.carrera}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="anoEgreso">Año de Egreso *</label>
              <input
                type="number"
                id="anoEgreso"
                name="anoEgreso"
                value={academicData.anoEgreso}
                onChange={handleInputChange}
                min="1950"
                max={new Date().getFullYear() + 10}
                className={errors.anoEgreso ? 'error' : ''}
              />
              {errors.anoEgreso && <span className="error-message">{errors.anoEgreso}</span>}
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" onClick={onClose} className="btn btn-secondary">
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary">
              Guardar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AcademicModal;