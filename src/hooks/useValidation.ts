import { useState, useCallback } from 'react';
import { z } from 'zod';
import {
  validateEmployee,
  validateEmployeeUpdate,
  validateEmployeeStatusChange,
  formatValidationErrors,
  EmployeeFormData,
  EmployeeUpdateData,
  EmployeeStatusChangeData
} from '../utils/validationSchemas';
import logger from '../utils/logger';

interface ValidationState {
  errors: Record<string, string>;
  isValid: boolean;
  isValidating: boolean;
}

interface UseValidationReturn<T> extends ValidationState {
  validate: (data: T) => Promise<boolean>;
  clearErrors: () => void;
  setError: (field: string, message: string) => void;
  validateField: (field: keyof T, value: any) => boolean;
}

export const useEmployeeValidation = (): UseValidationReturn<EmployeeFormData> => {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isValidating, setIsValidating] = useState(false);

  const validate = useCallback(async (data: EmployeeFormData): Promise<boolean> => {
    setIsValidating(true);
    setErrors({});

    try {
      const result = validateEmployee(data);

      if (result.success) {
        setErrors({});
        logger.debug('Employee validation successful');
        return true;
      } else {
        const formattedErrors = formatValidationErrors(result.error);
        setErrors(formattedErrors);
        logger.warn('Employee validation failed', { errors: formattedErrors });
        return false;
      }
    } catch (error) {
      logger.error('Error during employee validation', error);
      setErrors({ general: 'Error interno de validación' });
      return false;
    } finally {
      setIsValidating(false);
    }
  }, []);

  const validateField = useCallback((field: keyof EmployeeFormData, value: any): boolean => {
    try {
      // Create a partial data object with just this field
      const fieldSchema = z.object({
        [field]: z.any() // We'll validate the specific field type
      });

      fieldSchema.parse({ [field]: value });
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field as string];
        return newErrors;
      });
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldError = error.issues.find(issue => issue.path[0] === field);
        if (fieldError) {
          setErrors(prev => ({
            ...prev,
            [field as string]: fieldError.message
          }));
        }
      }
      return false;
    }
  }, []);

  const clearErrors = useCallback(() => {
    setErrors({});
  }, []);

  const setError = useCallback((field: string, message: string) => {
    setErrors(prev => ({ ...prev, [field]: message }));
  }, []);

  return {
    errors,
    isValid: Object.keys(errors).length === 0,
    isValidating,
    validate,
    clearErrors,
    setError,
    validateField
  };
};

export const useEmployeeUpdateValidation = (): UseValidationReturn<EmployeeUpdateData> => {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isValidating, setIsValidating] = useState(false);

  const validate = useCallback(async (data: EmployeeUpdateData): Promise<boolean> => {
    setIsValidating(true);
    setErrors({});

    try {
      const result = validateEmployeeUpdate(data);

      if (result.success) {
        setErrors({});
        logger.debug('Employee update validation successful');
        return true;
      } else {
        const formattedErrors = formatValidationErrors(result.error);
        setErrors(formattedErrors);
        logger.warn('Employee update validation failed', { errors: formattedErrors });
        return false;
      }
    } catch (error) {
      logger.error('Error during employee update validation', error);
      setErrors({ general: 'Error interno de validación' });
      return false;
    } finally {
      setIsValidating(false);
    }
  }, []);

  const validateField = useCallback((field: keyof EmployeeUpdateData, value: any): boolean => {
    try {
      const fieldSchema = z.object({
        [field]: z.any()
      });

      fieldSchema.parse({ [field]: value });
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field as string];
        return newErrors;
      });
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldError = error.issues.find(issue => issue.path[0] === field);
        if (fieldError) {
          setErrors(prev => ({
            ...prev,
            [field as string]: fieldError.message
          }));
        }
      }
      return false;
    }
  }, []);

  const clearErrors = useCallback(() => {
    setErrors({});
  }, []);

  const setError = useCallback((field: string, message: string) => {
    setErrors(prev => ({ ...prev, [field]: message }));
  }, []);

  return {
    errors,
    isValid: Object.keys(errors).length === 0,
    isValidating,
    validate,
    clearErrors,
    setError,
    validateField
  };
};

export const useEmployeeStatusValidation = (): UseValidationReturn<EmployeeStatusChangeData> => {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isValidating, setIsValidating] = useState(false);

  const validate = useCallback(async (data: EmployeeStatusChangeData): Promise<boolean> => {
    setIsValidating(true);
    setErrors({});

    try {
      const result = validateEmployeeStatusChange(data);

      if (result.success) {
        setErrors({});
        logger.debug('Employee status change validation successful');
        return true;
      } else {
        const formattedErrors = formatValidationErrors(result.error);
        setErrors(formattedErrors);
        logger.warn('Employee status change validation failed', { errors: formattedErrors });
        return false;
      }
    } catch (error) {
      logger.error('Error during employee status change validation', error);
      setErrors({ general: 'Error interno de validación' });
      return false;
    } finally {
      setIsValidating(false);
    }
  }, []);

  const validateField = useCallback((field: keyof EmployeeStatusChangeData, value: any): boolean => {
    try {
      const fieldSchema = z.object({
        [field]: z.any()
      });

      fieldSchema.parse({ [field]: value });
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field as string];
        return newErrors;
      });
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldError = error.issues.find(issue => issue.path[0] === field);
        if (fieldError) {
          setErrors(prev => ({
            ...prev,
            [field as string]: fieldError.message
          }));
        }
      }
      return false;
    }
  }, []);

  const clearErrors = useCallback(() => {
    setErrors({});
  }, []);

  const setError = useCallback((field: string, message: string) => {
    setErrors(prev => ({ ...prev, [field]: message }));
  }, []);

  return {
    errors,
    isValid: Object.keys(errors).length === 0,
    isValidating,
    validate,
    clearErrors,
    setError,
    validateField
  };
};