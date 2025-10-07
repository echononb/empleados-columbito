# 🚀 Guía de Desarrollo - Empleados Columbito

## 📋 Tabla de Contenidos

- [🏗️ Arquitectura del Proyecto](#️-arquitectura-del-proyecto)
- [🛠️ Estándares de Código](#️-estándares-de-código)
- [🔒 Seguridad](#-seguridad)
- [♿ Accesibilidad](#-accesibilidad)
- [📱 Responsive Design](#-responsive-design)
- [🧪 Testing](#-testing)
- [📝 Validación](#-validación)
- [🔍 Logging y Monitoreo](#-logging-y-monitoreo)
- [⚡ Performance](#-performance)
- [🚀 Deployment](#-deployment)

---

## 🏗️ Arquitectura del Proyecto

### **Estructura de Carpetas**

```
src/
├── components/          # Componentes React reutilizables
│   ├── modals/         # Modales especializados
│   └── __tests__/      # Tests de componentes
├── contexts/           # Context API para estado global
├── services/           # Lógica de negocio y API calls
│   └── __tests__/      # Tests de servicios
├── hooks/              # Custom hooks personalizados
├── utils/              # Utilidades y helpers
│   └── __tests__/      # Tests de utilidades
├── types/              # Definiciones de tipos TypeScript
└── styles/             # Archivos de estilos organizados
```

### **Patrones de Diseño**

#### **1. Component Composition**
```typescript
// ✅ Bueno: Composición de componentes pequeños
const EmployeeProfile = ({ employee }: EmployeeProps) => (
  <div className="employee-profile">
    <EmployeeHeader employee={employee} />
    <EmployeeDetails employee={employee} />
    <EmployeeActions employee={employee} />
  </div>
);

// ❌ Malo: Componente monolítico
const EmployeeProfile = ({ employee }: EmployeeProps) => (
  <div>
    {/* 200+ líneas de JSX mezclado */}
  </div>
);
```

#### **2. Custom Hooks para Lógica Compleja**
```typescript
// ✅ Bueno: Extraer lógica a custom hooks
const EmployeeForm = () => {
  const { validate, errors, isValidating } = useEmployeeValidation();
  const { saveEmployee, loading } = useEmployeeActions();

  const handleSubmit = async (data: EmployeeFormData) => {
    if (await validate(data)) {
      await saveEmployee(data);
    }
  };

  // ... resto del componente
};

// ❌ Malo: Lógica mezclada en el componente
const EmployeeForm = () => {
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const validateEmployee = (data) => {
    // 50+ líneas de validación aquí
  };

  // ... resto del componente
};
```

#### **3. Service Layer Pattern**
```typescript
// ✅ Bueno: Separar lógica de negocio en servicios
export class EmployeeService {
  static async getAllEmployees(): Promise<Employee[]> {
    // Lógica de obtención de datos
  }

  static async createEmployee(data: CreateEmployeeData): Promise<string> {
    // Lógica de creación con validación
  }
}

// ❌ Malo: Lógica de negocio en componentes
const EmployeeList = () => {
  const fetchEmployees = async () => {
    // Lógica de API directamente en componente
  };
};
```

---

## 🛠️ Estándares de Código

### **TypeScript**

#### **1. Interfaces vs Types**
```typescript
// ✅ Usar interfaces para objetos con métodos
interface Employee {
  id: string;
  name: string;
  calculateAge(): number; // Métodos permitidos
  update(data: Partial<Employee>): void;
}

// ✅ Usar types para uniones y utilidades
type EmployeeStatus = 'active' | 'inactive' | 'pending';
type EmployeeWithProjects = Employee & { projects: Project[] };
```

#### **2. Generic Constraints**
```typescript
// ✅ Bueno: Constraints específicos
function createEntity<T extends BaseEntity>(data: Omit<T, 'id' | 'createdAt'>): T {
  return { ...data, id: generateId(), createdAt: new Date() };
}

// ❌ Malo: Generic demasiado amplio
function createEntity<T>(data: T): T {
  return data;
}
```

#### **3. Utility Types**
```typescript
// ✅ Bueno: Usar utility types apropiados
type EmployeeFormData = Omit<Employee, 'id' | 'createdAt' | 'updatedAt'>;
type EmployeeUpdateData = Partial<EmployeeFormData>;
type RequiredEmployeeFields = Pick<Employee, 'dni' | 'nombres' | 'apellidoPaterno'>;
```

### **React**

#### **1. Functional Components con Hooks**
```typescript
// ✅ Bueno: Functional component moderno
const EmployeeCard: React.FC<EmployeeProps> = React.memo(({ employee, onEdit }) => {
  return (
    <div className="employee-card">
      <EmployeeInfo employee={employee} />
      <EmployeeActions employee={employee} onEdit={onEdit} />
    </div>
  );
});
```

#### **2. Custom Hooks**
```typescript
// ✅ Bueno: Custom hook bien tipado
export const useEmployeeSearch = (employees: Employee[]) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm] = useDebounce(searchTerm, 300);

  const filteredEmployees = useMemo(() =>
    employees.filter(emp =>
      emp.nombres.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
    ),
    [employees, debouncedSearchTerm]
  );

  return { searchTerm, setSearchTerm, filteredEmployees };
};
```

#### **3. Error Boundaries**
```typescript
// ✅ Bueno: Error boundary para cada sección crítica
<ErrorBoundary fallback={<ErrorFallback />}>
  <EmployeeList />
</ErrorBoundary>

<ErrorBoundary fallback={<ProjectErrorFallback />}>
  <ProjectList />
</ErrorBoundary>
```

---

## 🔒 Seguridad

### **1. Variables de Entorno**
```typescript
// ✅ Bueno: Validación estricta de variables de entorno
const getRequiredEnvVar = (name: string): string => {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
};

const firebaseConfig = {
  apiKey: getRequiredEnvVar('REACT_APP_FIREBASE_API_KEY'),
  // ... resto de configuración
};
```

### **2. Sanitización de Datos**
```typescript
// ✅ Bueno: Sanitizar datos antes de mostrar
const sanitizeHtml = (text: string): string => {
  return text.replace(/</g, '<').replace(/>/g, '>');
};

const EmployeeName = ({ name }: { name: string }) => (
  <span dangerouslySetInnerHTML={{ __html: sanitizeHtml(name) }} />
);
```

### **3. Validación de Props**
```typescript
// ✅ Bueno: Validar props con PropTypes o TypeScript
interface EmployeeCardProps {
  employee: Employee;
  onEdit?: (id: string) => void;
  className?: string;
}

const EmployeeCard: React.FC<EmployeeCardProps> = ({
  employee,
  onEdit,
  className = ''
}) => {
  // Componente implementation
};
```

---

## ♿ Accesibilidad

### **1. Atributos ARIA**
```typescript
// ✅ Bueno: Atributos ARIA apropiados
<div role="main" aria-label="Lista de empleados">
  <h1 id="employee-list-title">Empleados</h1>

  <input
    id="employee-search"
    type="text"
    aria-describedby="search-help"
    aria-label="Buscar empleados por nombre, DNI o código"
  />

  <table role="table" aria-label="Lista de empleados" aria-rowcount={count}>
    <thead>
      <tr role="row">
        <th role="columnheader" aria-sort="none">Nombre</th>
      </tr>
    </thead>
  </table>
</div>
```

### **2. Navegación por Teclado**
```typescript
// ✅ Bueno: Soporte completo para teclado
const EditableField = ({ value, onSave }: EditableFieldProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      setIsEditing(false);
    }
  };

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditing]);

  return (
    <div onKeyDown={handleKeyDown}>
      {isEditing ? (
        <input ref={inputRef} defaultValue={value} />
      ) : (
        <span onClick={() => setIsEditing(true)}>{value}</span>
      )}
    </div>
  );
};
```

### **3. Screen Reader Support**
```typescript
// ✅ Bueno: Contenido para screen readers
<div className="sr-only" aria-live="polite">
  Empleado {employee.name} ha sido {action} exitosamente
</div>

<button
  aria-label={`Eliminar empleado ${employee.name}. Esta acción no se puede deshacer`}
  onClick={() => handleDelete(employee.id)}
>
  🗑️
</button>
```

---

## 📱 Responsive Design

### **1. Mobile-First Approach**
```typescript
// ✅ Bueno: CSS Mobile-first
.employee-card {
  display: flex;
  flex-direction: column;
  padding: 16px;
  gap: 12px;
}

/* Tablet */
@media (min-width: 768px) {
  .employee-card {
    flex-direction: row;
    gap: 20px;
  }
}

/* Desktop */
@media (min-width: 1024px) {
  .employee-card {
    gap: 24px;
    padding: 20px;
  }
}
```

### **2. Touch Targets**
```typescript
// ✅ Bueno: Touch targets apropiados
@media (hover: none) and (pointer: coarse) {
  .btn {
    min-height: 44px; /* WCAG minimum */
    min-width: 44px;
    padding: 12px 16px;
  }

  .employee-table th,
  .employee-table td {
    padding: 12px 8px; /* Más espacio para touch */
  }
}
```

### **3. Responsive Tables**
```typescript
// ✅ Bueno: Tablas responsivas
.employee-table-container {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}

.employee-table {
  min-width: 800px; /* Garantiza estructura en móvil */
}

/* Esconder columnas menos importantes en móvil */
@media (max-width: 480px) {
  .employee-table .hide-mobile {
    display: none;
  }
}
```

---

## 🧪 Testing

### **1. Estructura de Tests**
```
src/
├── components/__tests__/
│   ├── EmployeeList.test.tsx
│   ├── EmployeeForm.test.tsx
│   └── Modal.test.tsx
├── services/__tests__/
│   ├── employeeService.test.ts
│   ├── projectService.test.ts
│   └── userService.test.ts
├── hooks/__tests__/
│   ├── useValidation.test.ts
│   └── useEmployeeSearch.test.ts
└── utils/__tests__/
    ├── logger.test.ts
    └── validationSchemas.test.ts
```

### **2. Testing Patterns**
```typescript
// ✅ Bueno: Tests descriptivos y bien estructurados
describe('EmployeeService', () => {
  describe('getAllEmployees', () => {
    it('should return employees from localStorage when Firebase unavailable', async () => {
      // Arrange
      const mockEmployees = [/* ... */];
      localStorageMock.getItem.mockReturnValue(JSON.stringify(mockEmployees));

      // Act
      const result = await EmployeeService.getAllEmployees();

      // Assert
      expect(result).toEqual(mockEmployees);
      expect(localStorageMock.getItem).toHaveBeenCalledWith('empleados-data');
    });

    it('should handle localStorage errors gracefully', async () => {
      // Arrange
      localStorageMock.getItem.mockImplementation(() => {
        throw new Error('localStorage error');
      });

      // Act & Assert
      await expect(EmployeeService.getAllEmployees()).resolves.toEqual([]);
    });
  });
});
```

### **3. Mocking Best Practices**
```typescript
// ✅ Bueno: Mocks apropiados y cleanup
describe('EmployeeList', () => {
  const mockEmployee = {
    id: '1',
    nombres: 'Juan',
    apellidoPaterno: 'Pérez',
    // ... resto de propiedades
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (EmployeeService.getAllEmployees as jest.Mock).mockResolvedValue([mockEmployee]);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('should render employee list', async () => {
    // Test implementation
  });
});
```

---

## 📝 Validación

### **1. Esquemas de Validación con Zod**
```typescript
// ✅ Bueno: Esquemas descriptivos y reutilizables
export const employeeSchema = z.object({
  nombres: z.string()
    .min(1, 'Nombres son requeridos')
    .max(150, 'Nombres máximo 150 caracteres')
    .regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/, 'Nombres solo pueden contener letras'),

  email: z.string()
    .email('Email no válido')
    .max(200, 'Email máximo 200 caracteres'),

  fechaNacimiento: z.string()
    .refine(validateAge, 'Empleado debe ser mayor de 18 años')
    .refine(validateDateString, 'Fecha de nacimiento no válida'),

  telefonoCelular: z.string()
    .regex(phoneRegex, 'Teléfono celular debe tener 7-9 dígitos')
});
```

### **2. Custom Hooks de Validación**
```typescript
// ✅ Bueno: Hooks de validación reutilizables
export const useEmployeeValidation = () => {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isValidating, setIsValidating] = useState(false);

  const validate = useCallback(async (data: EmployeeFormData) => {
    setIsValidating(true);

    const result = validateEmployee(data);
    if (result.success) {
      setErrors({});
      return true;
    } else {
      setErrors(formatValidationErrors(result.error));
      return false;
    }
  }, []);

  return { errors, isValidating, validate };
};
```

---

## 🔍 Logging y Monitoreo

### **1. Logger Centralizado**
```typescript
// ✅ Bueno: Logger con niveles y contexto
import logger, { logError, logAuthEvent } from '../utils/logger';

const handleEmployeeSave = async (employeeData: EmployeeFormData) => {
  try {
    await EmployeeService.createEmployee(employeeData);
    logger.info('Employee created successfully', { employeeId: result.id });
  } catch (error) {
    logError(error as Error, 'EmployeeForm - handleSave');
  }
};

const handleLogin = async (email: string, password: string) => {
  try {
    await auth.signInWithEmailAndPassword(email, password);
    logAuthEvent('User login successful', { email });
  } catch (error) {
    logError(error as Error, 'AuthContext - login');
  }
};
```

### **2. Error Boundaries**
```typescript
// ✅ Bueno: Error boundaries específicas
<ErrorBoundary
  fallback={<EmployeeErrorFallback />}
  onError={(error, errorInfo) => {
    logger.error('Employee section error', { error, errorInfo });
  }}
>
  <EmployeeList />
</ErrorBoundary>
```

---

## ⚡ Performance

### **1. Lazy Loading**
```typescript
// ✅ Bueno: Code splitting con lazy loading
const EmployeeWizard = lazy(() => import('./components/EmployeeWizard'));
const Reports = lazy(() => import('./components/Reports'));

<Suspense fallback={<LoadingSpinner />}>
  <Routes>
    <Route path="/employees/new" element={<EmployeeWizard />} />
    <Route path="/reports" element={<Reports />} />
  </Routes>
</Suspense>
```

### **2. Memoización**
```typescript
// ✅ Bueno: Memoización apropiada
const EmployeeCard = React.memo(({ employee, onEdit }) => {
  const handleEdit = useCallback(() => {
    onEdit(employee.id);
  }, [employee.id, onEdit]);

  return (
    <div>
      <EmployeeInfo employee={employee} />
      <button onClick={handleEdit}>Edit</button>
    </div>
  );
});
```

### **3. Virtualización para Listas Grandes**
```typescript
// ✅ Bueno: Virtualización para listas grandes
import { FixedSizeList as List } from 'react-window';

const EmployeeList = ({ employees }: { employees: Employee[] }) => (
  <List
    height={400}
    itemCount={employees.length}
    itemSize={50}
    itemData={employees}
  >
    {({ index, data }) => <EmployeeRow employee={data[index]} />}
  </List>
);
```

---

## 🚀 Deployment

### **1. Variables de Entorno**
```bash
# .env.production
REACT_APP_FIREBASE_API_KEY=your_production_key
REACT_APP_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your_project_id
# ... otras variables
```

### **2. Build Optimization**
```json
// vercel.json
{
  "build": {
    "env": {
      "NODE_ENV": "production"
    }
  },
  "headers": [
    {
      "source": "/static/(.*)",
      "headers": [
        { "key": "Cache-Control", "value": "public, max-age=31536000, immutable" }
      ]
    }
  ]
}
```

### **3. Monitoreo de Producción**
```typescript
// Configurar monitoreo en producción
if (process.env.NODE_ENV === 'production') {
  // Integrar con servicios de monitoreo
  logger.error('Production error occurred', error);
}
```

---

## 📋 Checklist de Code Review

### **Antes de hacer merge:**

- [ ] **Tipos**: ¿Están todos los tipos correctamente definidos?
- [ ] **Tests**: ¿Hay tests para la nueva funcionalidad?
- [ ] **Accesibilidad**: ¿Se incluyen atributos ARIA apropiados?
- [ ] **Responsive**: ¿Funciona correctamente en móvil y desktop?
- [ ] **Performance**: ¿Se optimizó para evitar renders innecesarios?
- [ ] **Seguridad**: ¿Se validan y sanitizan los datos?
- [ ] **Logging**: ¿Se agregaron logs apropiados para errores?
- [ ] **Documentación**: ¿Se documentó la nueva funcionalidad?

### **Comandos Útiles:**

```bash
# Ejecutar tests
npm test

# Verificar tipos TypeScript
npm run type-check

# Build de producción
npm run build

# Análisis de bundle
npm run analyze

# Ejecutar linter
npm run lint
```

---

## 🎯 Mejores Prácticas

### **1. Commits**
```
feat: add employee search functionality
fix: resolve memory leak in EmployeeList
docs: update API documentation
test: add unit tests for validation schemas
refactor: extract EmployeeCard component
```

### **2. Nombres de Variables**
```typescript
// ✅ Bueno
const employeeCount = employees.length;
const isLoadingEmployees = loading;
const handleEmployeeSave = () => {};

// ❌ Malo
const x = employees.length;
const loading = loading;
const save = () => {};
```

### **3. Imports**
```typescript
// ✅ Bueno: Imports organizados
import React from 'react';
import { useState, useCallback } from 'react';
import { EmployeeService } from '../services/employeeService';
import { Employee } from '../types/employee';
import { logger } from '../utils/logger';
import './EmployeeCard.css';
```

---

Este documento se mantiene actualizado con las mejores prácticas implementadas en el proyecto. Última actualización: Octubre 2025.