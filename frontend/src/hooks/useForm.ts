'use client';

import { useState, useCallback, useRef, useMemo, FormEvent } from 'react';

// Validation rule types
export type ValidationRule<T> = {
  validate: (value: T, formValues?: Record<string, unknown>) => boolean;
  message: string;
};

export type FieldValidation<T> = ValidationRule<T>[];

export type FormValidation<T extends Record<string, unknown>> = {
  [K in keyof T]?: FieldValidation<T[K]>;
};

// Field state
export interface FieldState {
  value: unknown;
  error: string | null;
  touched: boolean;
  dirty: boolean;
}

// Form state
export interface FormState<T extends Record<string, unknown>> {
  values: T;
  errors: Partial<Record<keyof T, string>>;
  touched: Partial<Record<keyof T, boolean>>;
  isValid: boolean;
  isDirty: boolean;
  isSubmitting: boolean;
}

// Hook options
interface UseFormOptions<T extends Record<string, unknown>> {
  initialValues: T;
  validation?: FormValidation<T>;
  validateOnChange?: boolean;
  validateOnBlur?: boolean;
  onSubmit?: (values: T) => void | Promise<void>;
}

// Hook return type
interface UseFormReturn<T extends Record<string, unknown>> {
  // State
  values: T;
  errors: Partial<Record<keyof T, string>>;
  touched: Partial<Record<keyof T, boolean>>;
  isValid: boolean;
  isDirty: boolean;
  isSubmitting: boolean;

  // Field helpers
  getFieldProps: (name: keyof T) => {
    name: string;
    value: T[keyof T];
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
    onBlur: () => void;
  };
  getFieldMeta: (name: keyof T) => {
    error: string | null;
    touched: boolean;
    dirty: boolean;
  };

  // Actions
  setValue: (name: keyof T, value: T[keyof T]) => void;
  setValues: (values: Partial<T>) => void;
  setError: (name: keyof T, error: string | null) => void;
  setTouched: (name: keyof T, touched?: boolean) => void;
  validateField: (name: keyof T) => boolean;
  validateForm: () => boolean;
  handleSubmit: (e?: FormEvent) => Promise<void>;
  reset: (values?: T) => void;
  resetField: (name: keyof T) => void;
}

export function useForm<T extends Record<string, unknown>>({
  initialValues,
  validation = {},
  validateOnChange = true,
  validateOnBlur = true,
  onSubmit,
}: UseFormOptions<T>): UseFormReturn<T> {
  const initialValuesRef = useRef(initialValues);

  const [values, setValuesState] = useState<T>(initialValues);
  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({});
  const [touched, setTouchedState] = useState<Partial<Record<keyof T, boolean>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Validate a single field
  const validateField = useCallback(
    (name: keyof T): boolean => {
      const fieldValidation = validation[name];
      if (!fieldValidation) return true;

      const value = values[name];

      for (const rule of fieldValidation) {
        if (!rule.validate(value, values as Record<string, unknown>)) {
          setErrors((prev) => ({ ...prev, [name]: rule.message }));
          return false;
        }
      }

      setErrors((prev) => ({ ...prev, [name]: undefined }));
      return true;
    },
    [validation, values]
  );

  // Validate entire form
  const validateForm = useCallback((): boolean => {
    let isValid = true;
    const newErrors: Partial<Record<keyof T, string>> = {};

    for (const key of Object.keys(validation) as Array<keyof T>) {
      const fieldValidation = validation[key];
      if (!fieldValidation) continue;

      const value = values[key];

      for (const rule of fieldValidation) {
        if (!rule.validate(value, values as Record<string, unknown>)) {
          newErrors[key] = rule.message;
          isValid = false;
          break;
        }
      }
    }

    setErrors(newErrors);
    return isValid;
  }, [validation, values]);

  // Check if form is valid
  const isValid = useMemo(() => {
    return Object.values(errors).every((error) => !error);
  }, [errors]);

  // Check if form is dirty
  const isDirty = useMemo(() => {
    return Object.keys(values).some(
      (key) => values[key as keyof T] !== initialValuesRef.current[key as keyof T]
    );
  }, [values]);

  // Set a single value
  const setValue = useCallback(
    (name: keyof T, value: T[keyof T]) => {
      setValuesState((prev) => ({ ...prev, [name]: value }));

      if (validateOnChange) {
        // Defer validation to after state update
        setTimeout(() => validateField(name), 0);
      }
    },
    [validateOnChange, validateField]
  );

  // Set multiple values
  const setValuesBatch = useCallback((newValues: Partial<T>) => {
    setValuesState((prev) => ({ ...prev, ...newValues }));
  }, []);

  // Set error for a field
  const setError = useCallback((name: keyof T, error: string | null) => {
    setErrors((prev) => ({ ...prev, [name]: error ?? undefined }));
  }, []);

  // Set touched for a field
  const setTouched = useCallback(
    (name: keyof T, isTouched: boolean = true) => {
      setTouchedState((prev) => ({ ...prev, [name]: isTouched }));

      if (validateOnBlur && isTouched) {
        validateField(name);
      }
    },
    [validateOnBlur, validateField]
  );

  // Get props for a field
  const getFieldProps = useCallback(
    (name: keyof T) => ({
      name: name as string,
      value: values[name],
      onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const value = e.target.type === 'checkbox'
          ? (e.target as HTMLInputElement).checked
          : e.target.value;
        setValue(name, value as T[keyof T]);
      },
      onBlur: () => setTouched(name, true),
    }),
    [values, setValue, setTouched]
  );

  // Get meta for a field
  const getFieldMeta = useCallback(
    (name: keyof T) => ({
      error: errors[name] ?? null,
      touched: touched[name] ?? false,
      dirty: values[name] !== initialValuesRef.current[name],
    }),
    [errors, touched, values]
  );

  // Handle form submission
  const handleSubmit = useCallback(
    async (e?: FormEvent) => {
      e?.preventDefault();

      // Touch all fields
      const allTouched = Object.keys(values).reduce(
        (acc, key) => ({ ...acc, [key]: true }),
        {} as Partial<Record<keyof T, boolean>>
      );
      setTouchedState(allTouched);

      // Validate
      const formIsValid = validateForm();
      if (!formIsValid) return;

      // Submit
      setIsSubmitting(true);
      try {
        await onSubmit?.(values);
      } finally {
        setIsSubmitting(false);
      }
    },
    [values, validateForm, onSubmit]
  );

  // Reset form
  const reset = useCallback((newValues?: T) => {
    const resetValues = newValues ?? initialValuesRef.current;
    setValuesState(resetValues);
    setErrors({});
    setTouchedState({});
    setIsSubmitting(false);

    if (newValues) {
      initialValuesRef.current = newValues;
    }
  }, []);

  // Reset a single field
  const resetField = useCallback((name: keyof T) => {
    setValuesState((prev) => ({
      ...prev,
      [name]: initialValuesRef.current[name],
    }));
    setErrors((prev) => ({ ...prev, [name]: undefined }));
    setTouchedState((prev) => ({ ...prev, [name]: false }));
  }, []);

  return {
    values,
    errors,
    touched,
    isValid,
    isDirty,
    isSubmitting,
    getFieldProps,
    getFieldMeta,
    setValue,
    setValues: setValuesBatch,
    setError,
    setTouched,
    validateField,
    validateForm,
    handleSubmit,
    reset,
    resetField,
  };
}

// Common validation rules
export const validators = {
  required: (message = 'This field is required'): ValidationRule<unknown> => ({
    validate: (value) => {
      if (value === null || value === undefined) return false;
      if (typeof value === 'string') return value.trim().length > 0;
      if (Array.isArray(value)) return value.length > 0;
      return true;
    },
    message,
  }),

  minLength: (min: number, message?: string): ValidationRule<string> => ({
    validate: (value) => !value || value.length >= min,
    message: message ?? `Must be at least ${min} characters`,
  }),

  maxLength: (max: number, message?: string): ValidationRule<string> => ({
    validate: (value) => !value || value.length <= max,
    message: message ?? `Must be at most ${max} characters`,
  }),

  email: (message = 'Invalid email address'): ValidationRule<string> => ({
    validate: (value) => !value || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
    message,
  }),

  url: (message = 'Invalid URL'): ValidationRule<string> => ({
    validate: (value) => {
      if (!value) return true;
      try {
        new URL(value);
        return true;
      } catch {
        return false;
      }
    },
    message,
  }),

  pattern: (regex: RegExp, message = 'Invalid format'): ValidationRule<string> => ({
    validate: (value) => !value || regex.test(value),
    message,
  }),

  min: (min: number, message?: string): ValidationRule<number> => ({
    validate: (value) => value === undefined || value === null || value >= min,
    message: message ?? `Must be at least ${min}`,
  }),

  max: (max: number, message?: string): ValidationRule<number> => ({
    validate: (value) => value === undefined || value === null || value <= max,
    message: message ?? `Must be at most ${max}`,
  }),

  matches: (field: string, message?: string): ValidationRule<unknown> => ({
    validate: (value, formValues) => value === formValues?.[field],
    message: message ?? 'Fields do not match',
  }),

  custom: <T>(
    validator: (value: T, formValues?: Record<string, unknown>) => boolean,
    message: string
  ): ValidationRule<T> => ({
    validate: validator,
    message,
  }),
};
