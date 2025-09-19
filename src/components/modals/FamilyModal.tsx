import React, { useState, useEffect } from 'react';

interface SpouseData {
  apellidosNombres: string;
  dni: string;
  fechaNacimiento: string;
  telefono: string;
  documentoVinculo: string;
}

interface ChildData {
  dni: string;
  apellidos: string;
  nombres: string;
}

interface FamilyData {
  conyuge: SpouseData;
  tieneHijos: boolean;
  hijos: ChildData[];
}

interface FamilyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: FamilyData) => void;
  initialData?: FamilyData;
}

const FamilyModal: React.FC<FamilyModalProps> = ({ isOpen, onClose, onSave, initialData }) => {
  const [familyData, setFamilyData] = useState<FamilyData>({
    conyuge: {
      apellidosNombres: '',
      dni: '',
      fechaNacimiento: '',
      telefono: '',
      documentoVinculo: ''
    },
    tieneHijos: false,
    hijos: []
  });

  const [errors, setErrors] = useState<{[key: string]: string}>({});

  useEffect(() => {
    if (initialData) {
      setFamilyData(initialData);
    } else {
      setFamilyData({
        conyuge: {
          apellidosNombres: '',
          dni: '',
          fechaNacimiento: '',
          telefono: '',
          documentoVinculo: ''
        },
        tieneHijos: false,
        hijos: []
      });
    }
  }, [initialData, isOpen]);

  const validateForm = (): boolean => {
    const newErrors: {[key: string]: string} = {};

    // Validate spouse data if any field is filled
    const spouse = familyData.conyuge;
    if (spouse.apellidosNombres || spouse.dni || spouse.fechaNacimiento) {
      if (!spouse.apellidosNombres) {
        newErrors['conyuge.apellidosNombres'] = 'Apellidos y nombres del cónyuge son requeridos';
      }
      if (!spouse.dni || spouse.dni.length !== 8) {
        newErrors['conyuge.dni'] = 'DNI del cónyuge debe tener 8 dígitos';
      }
      if (!spouse.fechaNacimiento) {
        newErrors['conyuge.fechaNacimiento'] = 'Fecha de nacimiento del cónyuge es requerida';
      }
      if (!spouse.documentoVinculo) {
        newErrors['conyuge.documentoVinculo'] = 'Documento que acredita vínculo es requerido';
      }
    }

    // Validate children data
    familyData.hijos.forEach((child, index) => {
      if (!child.dni || child.dni.length !== 8) {
        newErrors[`hijo${index}.dni`] = `DNI del hijo ${index + 1} debe tener 8 dígitos`;
      }
      if (!child.apellidos) {
        newErrors[`hijo${index}.apellidos`] = `Apellidos del hijo ${index + 1} son requeridos`;
      }
      if (!child.nombres) {
        newErrors[`hijo${index}.nombres`] = `Nombres del hijo ${index + 1} son requeridos`;
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    onSave(familyData);
    onClose();
  };

  const handleSpouseChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFamilyData(prev => ({
      ...prev,
      conyuge: {
        ...prev.conyuge,
        [name]: value
      }
    }));

    // Clear error when user starts typing
    if (errors[`conyuge.${name}`]) {
      setErrors(prev => ({ ...prev, [`conyuge.${name}`]: '' }));
    }
  };

  const handleTieneHijosChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const checked = e.target.checked;
    setFamilyData(prev => ({
      ...prev,
      tieneHijos: checked,
      hijos: checked ? prev.hijos : []
    }));
  };

  const addChild = () => {
    setFamilyData(prev => ({
      ...prev,
      hijos: [...prev.hijos, { dni: '', apellidos: '', nombres: '' }]
    }));
  };

  const removeChild = (index: number) => {
    setFamilyData(prev => ({
      ...prev,
      hijos: prev.hijos.filter((_, i) => i !== index)
    }));
  };

  const handleChildChange = (index: number, field: keyof ChildData, value: string) => {
    setFamilyData(prev => ({
      ...prev,
      hijos: prev.hijos.map((child, i) =>
        i === index ? { ...child, [field]: value } : child
      )
    }));

    // Clear error when user starts typing
    if (errors[`hijo${index}.${field}`]) {
      setErrors(prev => ({ ...prev, [`hijo${index}.${field}`]: '' }));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h3>Información Familiar</h3>
          <button type="button" onClick={onClose} className="modal-close">
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-body">
          {/* Spouse Information */}
          <div className="form-section">
            <h4>Cónyuge/Concubina</h4>

            <div className="form-group">
              <label htmlFor="conyuge.apellidosNombres">Apellidos y Nombres</label>
              <input
                type="text"
                id="conyuge.apellidosNombres"
                name="apellidosNombres"
                value={familyData.conyuge.apellidosNombres}
                onChange={handleSpouseChange}
                placeholder="Ej: López García, Ana María"
                className={errors['conyuge.apellidosNombres'] ? 'error' : ''}
              />
              {errors['conyuge.apellidosNombres'] && <span className="error-message">{errors['conyuge.apellidosNombres']}</span>}
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="conyuge.dni">DNI</label>
                <input
                  type="text"
                  id="conyuge.dni"
                  name="dni"
                  value={familyData.conyuge.dni}
                  onChange={handleSpouseChange}
                  maxLength={8}
                  placeholder="12345678"
                  className={errors['conyuge.dni'] ? 'error' : ''}
                />
                {errors['conyuge.dni'] && <span className="error-message">{errors['conyuge.dni']}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="conyuge.fechaNacimiento">Fecha de Nacimiento</label>
                <input
                  type="date"
                  id="conyuge.fechaNacimiento"
                  name="fechaNacimiento"
                  value={familyData.conyuge.fechaNacimiento}
                  onChange={handleSpouseChange}
                  className={errors['conyuge.fechaNacimiento'] ? 'error' : ''}
                />
                {errors['conyuge.fechaNacimiento'] && <span className="error-message">{errors['conyuge.fechaNacimiento']}</span>}
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="conyuge.telefono">Teléfono</label>
                <input
                  type="tel"
                  id="conyuge.telefono"
                  name="telefono"
                  value={familyData.conyuge.telefono}
                  onChange={handleSpouseChange}
                  placeholder="987654321"
                />
              </div>

              <div className="form-group">
                <label htmlFor="conyuge.documentoVinculo">Documento que Acredita Vínculo</label>
                <input
                  type="text"
                  id="conyuge.documentoVinculo"
                  name="documentoVinculo"
                  value={familyData.conyuge.documentoVinculo}
                  onChange={handleSpouseChange}
                  placeholder="Ej: Certificado de matrimonio"
                  className={errors['conyuge.documentoVinculo'] ? 'error' : ''}
                />
                {errors['conyuge.documentoVinculo'] && <span className="error-message">{errors['conyuge.documentoVinculo']}</span>}
              </div>
            </div>
          </div>

          {/* Children Information */}
          <div className="form-section">
            <div className="form-group checkbox-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={familyData.tieneHijos}
                  onChange={handleTieneHijosChange}
                />
                ¿Tiene hijos?
              </label>
            </div>

            {familyData.tieneHijos && (
              <div className="children-section">
                <h4>Hijos</h4>
                {familyData.hijos.map((child, index) => (
                  <div key={index} className="child-item">
                    <div className="child-header">
                      <h5>Hijo {index + 1}</h5>
                      <button
                        type="button"
                        onClick={() => removeChild(index)}
                        className="btn btn-danger btn-small"
                      >
                        Eliminar
                      </button>
                    </div>

                    <div className="form-row">
                      <div className="form-group">
                        <label>DNI</label>
                        <input
                          type="text"
                          value={child.dni}
                          onChange={(e) => handleChildChange(index, 'dni', e.target.value)}
                          maxLength={8}
                          placeholder="12345678"
                          className={errors[`hijo${index}.dni`] ? 'error' : ''}
                        />
                        {errors[`hijo${index}.dni`] && <span className="error-message">{errors[`hijo${index}.dni`]}</span>}
                      </div>

                      <div className="form-group">
                        <label>Apellidos</label>
                        <input
                          type="text"
                          value={child.apellidos}
                          onChange={(e) => handleChildChange(index, 'apellidos', e.target.value)}
                          placeholder="Ej: García López"
                          className={errors[`hijo${index}.apellidos`] ? 'error' : ''}
                        />
                        {errors[`hijo${index}.apellidos`] && <span className="error-message">{errors[`hijo${index}.apellidos`]}</span>}
                      </div>
                    </div>

                    <div className="form-group">
                      <label>Nombres</label>
                      <input
                        type="text"
                        value={child.nombres}
                        onChange={(e) => handleChildChange(index, 'nombres', e.target.value)}
                        placeholder="Ej: Carlos Alberto"
                        className={errors[`hijo${index}.nombres`] ? 'error' : ''}
                      />
                      {errors[`hijo${index}.nombres`] && <span className="error-message">{errors[`hijo${index}.nombres`]}</span>}
                    </div>
                  </div>
                ))}

                <button type="button" onClick={addChild} className="btn btn-secondary">
                  Agregar Hijo
                </button>
              </div>
            )}
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

export default FamilyModal;