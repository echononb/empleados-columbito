import React, { useState, useEffect } from 'react';

interface EPPData {
  tallaCalzado: string;
  tallaVestimenta: string;
}

interface EPPModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: EPPData) => void;
  initialData?: EPPData;
}

const EPPModal: React.FC<EPPModalProps> = ({ isOpen, onClose, onSave, initialData }) => {
  const [eppData, setEppData] = useState<EPPData>({
    tallaCalzado: '',
    tallaVestimenta: ''
  });

  const [errors, setErrors] = useState<{[key: string]: string}>({});

  useEffect(() => {
    if (initialData) {
      setEppData(initialData);
    } else {
      setEppData({
        tallaCalzado: '',
        tallaVestimenta: ''
      });
    }
  }, [initialData, isOpen]);

  const validateForm = (): boolean => {
    const newErrors: {[key: string]: string} = {};

    if (!eppData.tallaCalzado) {
      newErrors.tallaCalzado = 'Talla de calzado es requerida';
    }
    if (!eppData.tallaVestimenta) {
      newErrors.tallaVestimenta = 'Talla de vestimenta es requerida';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    onSave(eppData);
    onClose();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setEppData(prev => ({
      ...prev,
      [name]: value
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
          <h3>Información de EPP (Equipo de Protección Personal)</h3>
          <button type="button" onClick={onClose} className="modal-close">
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-body">
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="tallaCalzado">Talla de Calzado *</label>
              <select
                id="tallaCalzado"
                name="tallaCalzado"
                value={eppData.tallaCalzado}
                onChange={handleInputChange}
                className={errors.tallaCalzado ? 'error' : ''}
              >
                <option value="">Seleccionar talla...</option>
                <option value="35">35</option>
                <option value="36">36</option>
                <option value="37">37</option>
                <option value="38">38</option>
                <option value="39">39</option>
                <option value="40">40</option>
                <option value="41">41</option>
                <option value="42">42</option>
                <option value="43">43</option>
                <option value="44">44</option>
                <option value="45">45</option>
                <option value="46">46</option>
              </select>
              {errors.tallaCalzado && <span className="error-message">{errors.tallaCalzado}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="tallaVestimenta">Talla de Vestimenta *</label>
              <select
                id="tallaVestimenta"
                name="tallaVestimenta"
                value={eppData.tallaVestimenta}
                onChange={handleInputChange}
                className={errors.tallaVestimenta ? 'error' : ''}
              >
                <option value="">Seleccionar talla...</option>
                <option value="XS">XS (Extra Small)</option>
                <option value="S">S (Small)</option>
                <option value="M">M (Medium)</option>
                <option value="L">L (Large)</option>
                <option value="XL">XL (Extra Large)</option>
                <option value="XXL">XXL (Extra Extra Large)</option>
              </select>
              {errors.tallaVestimenta && <span className="error-message">{errors.tallaVestimenta}</span>}
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

export default EPPModal;