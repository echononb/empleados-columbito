import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { EmployeeService, Employee } from '../services/employeeService';
import { EmployeeFormData, EmployeeUpdateData } from '../utils/validationSchemas';
import logger from '../utils/logger';

// Query keys for React Query
export const employeeKeys = {
  all: ['employees'] as const,
  lists: () => [...employeeKeys.all, 'list'] as const,
  list: (filters: Record<string, unknown>) => [...employeeKeys.lists(), filters] as const,
  details: () => [...employeeKeys.all, 'detail'] as const,
  detail: (id: string) => [...employeeKeys.details(), id] as const,
};

/**
 * Hook para obtener todos los empleados con caché y sincronización automática
 */
export const useEmployees = (filters?: { searchTerm?: string; showInactive?: boolean }) => {
  return useQuery({
    queryKey: employeeKeys.list(filters || {}),
    queryFn: async () => {
      logger.debug('Fetching employees from service', { filters });

      if (filters?.searchTerm) {
        return await EmployeeService.searchEmployees(filters.searchTerm);
      }

      return await EmployeeService.getAllEmployees();
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
    gcTime: 10 * 60 * 1000, // 10 minutos (antes era cacheTime)
    retry: (failureCount, error) => {
      // No reintentar errores de autenticación
      if (error instanceof Error && error.message.includes('auth')) {
        return false;
      }
      return failureCount < 3;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
};

/**
 * Hook para obtener un empleado específico por ID
 */
export const useEmployee = (id: string | undefined) => {
  return useQuery({
    queryKey: employeeKeys.detail(id!),
    queryFn: async () => {
      if (!id) throw new Error('Employee ID is required');

      logger.debug('Fetching employee by ID', { id });
      const employee = await EmployeeService.getEmployeeById(id);

      if (!employee) {
        throw new Error('Employee not found');
      }

      return employee;
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
};

/**
 * Hook para crear un nuevo empleado con optimista updates
 */
export const useCreateEmployee = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (employeeData: Omit<Employee, 'id'>) => {
      logger.info('Creating new employee', { employeeCode: employeeData.employeeCode });

      const id = await EmployeeService.createEmployee(employeeData);

      return { id, ...employeeData };
    },
    onMutate: async (newEmployee) => {
      // Cancelar queries salientes
      await queryClient.cancelQueries({ queryKey: employeeKeys.lists() });

      // Snapshot del valor anterior
      const previousEmployees = queryClient.getQueriesData({ queryKey: employeeKeys.lists() });

      // Optimistic update
      const tempEmployee: Employee = {
        id: `temp-${Date.now()}`,
        ...newEmployee,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      queryClient.setQueryData(employeeKeys.lists(), (old: Employee[] = []) => [
        tempEmployee,
        ...old
      ]);

      return { previousEmployees };
    },
    onError: (err, newEmployee, context) => {
      // Revertir optimistic update
      if (context?.previousEmployees) {
        context.previousEmployees.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }

      logger.error('Failed to create employee', err);
    },
    onSuccess: (data) => {
      // Invalidar y refetch
      queryClient.invalidateQueries({ queryKey: employeeKeys.lists() });

      logger.info('Employee created successfully', { id: data.id });
    },
    onSettled: () => {
      // Siempre refetch después de mutación
      queryClient.invalidateQueries({ queryKey: employeeKeys.lists() });
    }
  });
};

/**
 * Hook para actualizar un empleado
 */
export const useUpdateEmployee = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Employee> }) => {
      logger.info('Updating employee', { id, fields: Object.keys(data) });

      await EmployeeService.updateEmployee(id, data);

      return { id, data };
    },
    onMutate: async ({ id, data }) => {
      // Cancelar queries salientes
      await queryClient.cancelQueries({ queryKey: employeeKeys.detail(id) });
      await queryClient.cancelQueries({ queryKey: employeeKeys.lists() });

      // Snapshot del valor anterior
      const previousEmployee = queryClient.getQueryData(employeeKeys.detail(id));
      const previousEmployees = queryClient.getQueryData(employeeKeys.lists());

      // Optimistic update para el detalle
      queryClient.setQueryData(employeeKeys.detail(id), (old: Employee) => ({
        ...old,
        ...data,
        updatedAt: new Date().toISOString()
      }));

      // Optimistic update para la lista
      queryClient.setQueryData(employeeKeys.lists(), (old: Employee[] = []) =>
        old.map(emp => emp.id === id ? { ...emp, ...data, updatedAt: new Date().toISOString() } : emp)
      );

      return { previousEmployee, previousEmployees };
    },
    onError: (err, variables, context) => {
      // Revertir optimistic updates
      if (context?.previousEmployee) {
        queryClient.setQueryData(employeeKeys.detail(variables.id), context.previousEmployee);
      }
      if (context?.previousEmployees) {
        queryClient.setQueryData(employeeKeys.lists(), context.previousEmployees);
      }

      logger.error('Failed to update employee', err);
    },
    onSuccess: (data) => {
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: employeeKeys.detail(data.id) });
      queryClient.invalidateQueries({ queryKey: employeeKeys.lists() });

      logger.info('Employee updated successfully', { id: data.id });
    }
  });
};

/**
 * Hook para cambiar el estado de un empleado (activar/desactivar)
 */
export const useUpdateEmployeeStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      isActive,
      options
    }: {
      id: string;
      isActive: boolean;
      options?: {
        deactivationDate?: string;
        deactivationReason?: string;
        activationDate?: string;
        assignedProject?: string;
      }
    }) => {
      logger.info('Updating employee status', { id, isActive, options });

      await EmployeeService.updateEmployeeStatus(id, isActive, options);

      return { id, isActive, options };
    },
    onMutate: async ({ id, isActive }) => {
      // Cancelar queries salientes
      await queryClient.cancelQueries({ queryKey: employeeKeys.detail(id) });
      await queryClient.cancelQueries({ queryKey: employeeKeys.lists() });

      // Snapshot del valor anterior
      const previousEmployee = queryClient.getQueryData(employeeKeys.detail(id));
      const previousEmployees = queryClient.getQueryData(employeeKeys.lists());

      // Optimistic update
      const statusData = {
        isActive,
        updatedAt: new Date().toISOString(),
        ...(isActive ? {
          activationDate: new Date().toISOString().split('T')[0]
        } : {
          deactivationDate: new Date().toISOString().split('T')[0]
        })
      };

      queryClient.setQueryData(employeeKeys.detail(id), (old: Employee) => ({
        ...old,
        ...statusData
      }));

      queryClient.setQueryData(employeeKeys.lists(), (old: Employee[] = []) =>
        old.map(emp => emp.id === id ? { ...emp, ...statusData } : emp)
      );

      return { previousEmployee, previousEmployees };
    },
    onError: (err, variables, context) => {
      // Revertir optimistic updates
      if (context?.previousEmployee) {
        queryClient.setQueryData(employeeKeys.detail(variables.id), context.previousEmployee);
      }
      if (context?.previousEmployees) {
        queryClient.setQueryData(employeeKeys.lists(), context.previousEmployees);
      }

      logger.error('Failed to update employee status', err);
    },
    onSuccess: (data) => {
      // Invalidar queries
      queryClient.invalidateQueries({ queryKey: employeeKeys.detail(data.id) });
      queryClient.invalidateQueries({ queryKey: employeeKeys.lists() });

      logger.info('Employee status updated successfully', { id: data.id, isActive: data.isActive });
    }
  });
};

/**
 * Hook para eliminar un empleado
 */
export const useDeleteEmployee = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      logger.info('Deleting employee', { id });

      await EmployeeService.deleteEmployee(id);

      return { id };
    },
    onMutate: async (id) => {
      // Cancelar queries salientes
      await queryClient.cancelQueries({ queryKey: employeeKeys.detail(id) });
      await queryClient.cancelQueries({ queryKey: employeeKeys.lists() });

      // Snapshot del valor anterior
      const previousEmployee = queryClient.getQueryData(employeeKeys.detail(id));
      const previousEmployees = queryClient.getQueryData(employeeKeys.lists());

      // Optimistic update - remover de la lista
      queryClient.setQueryData(employeeKeys.lists(), (old: Employee[] = []) =>
        old.filter(emp => emp.id !== id)
      );

      return { previousEmployee, previousEmployees };
    },
    onError: (err, id, context) => {
      // Revertir optimistic update
      if (context?.previousEmployees) {
        queryClient.setQueryData(employeeKeys.lists(), context.previousEmployees);
      }

      logger.error('Failed to delete employee', err);
    },
    onSuccess: (data) => {
      // Invalidar queries
      queryClient.invalidateQueries({ queryKey: employeeKeys.lists() });
      queryClient.removeQueries({ queryKey: employeeKeys.detail(data.id) });

      logger.info('Employee deleted successfully', { id: data.id });
    }
  });
};

/**
 * Hook para búsqueda de empleados con debounce
 */
export const useEmployeeSearch = (initialSearchTerm = '') => {
  const [searchTerm, setSearchTerm] = React.useState(initialSearchTerm);

  const query = useEmployees({ searchTerm: searchTerm || undefined });

  // Debounced search term
  React.useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm !== initialSearchTerm) {
        logger.debug('Employee search term updated', { searchTerm });
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm, initialSearchTerm]);

  return {
    searchTerm,
    setSearchTerm,
    employees: query.data || [],
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch
  };
};