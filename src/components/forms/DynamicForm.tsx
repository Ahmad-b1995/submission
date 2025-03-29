import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '../ui/Button';
import { useStates } from '../../hooks/useInsuranceForms';
import { toast } from 'react-hot-toast';
import { insuranceApi } from '../../services/api';
import type { InsuranceField, FormSubmissionRequest } from '../../types/api';
import get from 'lodash.get';

interface DynamicFormProps {
  formId: string;
  title: string;
  fields: InsuranceField[];
  onSubmit: (data: FormSubmissionRequest) => void;
}

export function DynamicForm({ fields, onSubmit }: DynamicFormProps) {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
    reset,
  } = useForm();

  const watchAllFields = watch();

  const getCountryStateRelations = (fields: InsuranceField[], parentKey = ''): Record<string, string> => {
    let relations: Record<string, string> = {};
    fields.forEach(field => {
      const fieldKey = parentKey ? `${parentKey}.${field.id}` : field.id;
      if (field.type === 'group' && field.fields) {
        const stateField = field.fields.find(f => 
          f.type === 'select' && f.dynamicOptions?.dependsOn === 'country'
        );
        if (stateField) {
          const stateKey = `${fieldKey}.${stateField.id}`;
          const countryKey = `${fieldKey}.country`;
          relations[stateKey] = countryKey;
        }
        const nestedRelations = getCountryStateRelations(field.fields, fieldKey);
        relations = { ...relations, ...nestedRelations };
      }
    });
    return relations;
  };

  const countryStateRelations = getCountryStateRelations(fields);

  const countryValues: Record<string, string> = {};
  Object.values(countryStateRelations).forEach(countryField => {
    countryValues[countryField] = watch(countryField) || '';
  });

  const stateQueries = Object.entries(countryValues).map(([countryField, countryValue]) => ({
    countryField,
    ...useStates(countryValue)
  }));

  useEffect(() => {
    Object.entries(countryStateRelations).forEach(([stateField, countryField]) => {
      if (watchAllFields[countryField]) {
        setValue(stateField, '');
      }
    });
  }, [Object.values(countryValues).join(','), setValue, countryStateRelations]);

  const shouldShowField = (field: InsuranceField, parentKey = '') => {
    if (!field.visibility) return true;
    const { dependsOn, condition, value } = field.visibility;
    const dependentKey = parentKey ? `${parentKey}.${dependsOn}` : dependsOn;
    const dependentValue = watchAllFields[dependentKey];
    if (condition === 'equals') {
      return dependentValue === value;
    }
    return true;
  };

  const getValidationRules = (field: InsuranceField) => {
    const rules: any = {};
    if (field.required) {
      rules.required = 'This field is required';
    }
    if (field.validation) {
      if (field.validation.min !== undefined) {
        rules.min = {
          value: field.validation.min,
          message: `Minimum value is ${field.validation.min}`
        };
      }
      if (field.validation.max !== undefined) {
        rules.max = {
          value: field.validation.max,
          message: `Maximum value is ${field.validation.max}`
        };
      }
      if (field.validation.pattern) {
        rules.pattern = {
          value: new RegExp(field.validation.pattern),
          message: field.id === 'zip_code' ? 'ZIP code format is wrong' : (field.validation.message || 'Invalid format')
        };
      }
    }
    if (field.type === 'email') {
      rules.pattern = {
        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
        message: 'Invalid email address'
      };
    }
    return rules;
  };

  const handleFormSubmit = async (formData: any) => {
    try {
      const submissionData: FormSubmissionRequest = {
        formId: "home_insurance_application",
        data: formData
      };
      await insuranceApi.submitForm(submissionData);
      toast.success('Application submitted successfully!');
      reset();
      onSubmit(submissionData);
    } catch (error) {
      console.error('Form submission error:', error);
      toast.error('Failed to submit application. Please try again.');
    }
  };

  const getFieldError = (fieldKey: string) => {
    const error = get(errors, fieldKey);
    if (!error) return null;
    if (typeof error === 'string') return error;
    if (error.message) return error.message;
    if (typeof error === 'object') {
      const nestedError = Object.values(error)[0];
      if (nestedError && typeof nestedError === 'object' && 'message' in nestedError) {
        return nestedError.message;
      }
    }
    return "This field is required";
  };

  const renderField = (field: InsuranceField, parentKey = '') => {
    if (!shouldShowField(field, parentKey)) return null;
    const fieldKey = parentKey ? `${parentKey}.${field.id}` : field.id;
    if (field.type === 'group') {
      return (
        <div key={fieldKey} className="space-y-4 p-4 bg-gray-50 rounded-lg">
          <h3 className="text-lg font-medium">{field.label}</h3>
          <div className="space-y-4">
            {field.fields?.map(f => {
              // If this is a state field with dynamic options, ensure there's a country field before it
              if (f.type === 'select' && f.dynamicOptions?.dependsOn === 'country') {
                const hasCountryField = field.fields?.some(ff => ff.id === 'country');
                if (!hasCountryField) {
                  const countryField: InsuranceField = {
                    id: 'country',
                    label: 'Country',
                    type: 'select',
                    required: true,
                    options: ['USA', 'Canada', 'Germany', 'France']
                  };
                  return (
                    <div key={`${fieldKey}-country-state`} className="space-y-4">
                      {renderField(countryField, field.id)}
                      {renderField(f, field.id)}
                    </div>
                  );
                }
              }
              return renderField(f, field.id);
            })}
          </div>
        </div>
      );
    }

    const getStatesForField = (): string[] => {
      if (field.type === 'select' && field.dynamicOptions?.dependsOn === 'country') {
        const countryField = countryStateRelations[fieldKey];
        const stateQuery = stateQueries.find(q => q.countryField === countryField);
        return (stateQuery?.data as string[]) ?? [];
      }
      return field.options ?? [];
    };

    const isLoadingStates = () => {
      if (field.type === 'select' && field.dynamicOptions?.dependsOn === 'country') {
        const countryField = countryStateRelations[fieldKey];
        const stateQuery = stateQueries.find(q => q.countryField === countryField);
        return stateQuery?.isLoading || false;
      }
      return false;
    };

    const isStateField = field.type === 'select' && field.dynamicOptions?.dependsOn === 'country';
    const stateOptions = getStatesForField();

    const validateCheckboxGroup = (values: Record<string, boolean>) => {
      const selectedCount = Object.values(values).filter(Boolean).length;
      return selectedCount >= 1 || 'Please select at least one option';
    };

    const fieldError = getFieldError(fieldKey);

    return (
      <div key={fieldKey} className="space-y-2">
        <label htmlFor={fieldKey} className="block text-sm font-medium text-gray-700">
          {field.label}
          {field.required && <span className="text-red-500">*</span>}
        </label>
        
        {field.type === 'text' && (
          <input
            type="text"
            id={fieldKey}
            {...register(fieldKey, getValidationRules(field))}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        )}
        
        {field.type === 'date' && (
          <input
            type="date"
            id={fieldKey}
            {...register(fieldKey, { 
              ...getValidationRules(field),
              validate: (value) => {
                if (!value) return true;
                const date = new Date(value);
                const today = new Date();
                const minDate = new Date();
                minDate.setFullYear(today.getFullYear() - 100); // 100 years ago
                return date <= today && date >= minDate || "Please enter a valid date";
              }
            })}
            max={new Date().toISOString().split('T')[0]}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        )}
        
        {field.type === 'number' && (
          <input
            type="number"
            id={fieldKey}
            {...register(fieldKey, getValidationRules(field))}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        )}
        
        {field.type === 'select' && (
          <div>
            <select
              id={fieldKey}
              {...register(fieldKey, getValidationRules(field))}
              className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 ${
                isStateField && (!stateOptions.length || isLoadingStates()) ? 'bg-gray-100' : ''
              }`}
              disabled={isStateField && (!stateOptions.length || isLoadingStates())}
            >
              <option value="">Select an option</option>
              {stateOptions.map((option: string) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
            {isLoadingStates() && (
              <p className="mt-1 text-sm text-gray-500">Loading states...</p>
            )}
          </div>
        )}
        
        {field.type === 'radio' && (
          <div className="space-y-2">
            {field.options?.map((option) => (
              <div key={option} className="flex items-center">
                <input
                  type="radio"
                  id={`${fieldKey}-${option}`}
                  value={option}
                  {...register(fieldKey, getValidationRules(field))}
                  className="h-4 w-4 border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label
                  htmlFor={`${fieldKey}-${option}`}
                  className="ml-2 block text-sm text-gray-700"
                >
                  {option}
                </label>
              </div>
            ))}
          </div>
        )}

        {field.type === 'checkbox' && field.options && (
          <div className="space-y-2">
            {field.options.map((option) => (
              <div key={option} className="flex items-center">
                <input
                  type="checkbox"
                  id={`${fieldKey}_${option}`}
                  {...register(`${fieldKey}_${option}`, {
                    validate: {
                      singleSelection: () => {
                        const formValues = watchAllFields;
                        const checkboxValues = field.options?.reduce((acc, opt) => ({
                          ...acc,
                          [`${fieldKey}_${opt}`]: formValues[`${fieldKey}_${opt}`] || false
                        }), {} as Record<string, boolean>);
                        return validateCheckboxGroup(checkboxValues || {});
                      }
                    }
                  })}
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label
                  htmlFor={`${fieldKey}_${option}`}
                  className="ml-2 block text-sm text-gray-700"
                >
                  {option}
                </label>
              </div>
            ))}
            {Object.keys(errors).some(key => key.startsWith(`${fieldKey}_`)) && (
              <p className="mt-1 text-sm text-red-600">
                Please select at least one option
              </p>
            )}
          </div>
        )}
        
        {fieldError && (
          <p className="mt-1 text-sm text-red-600">
            {fieldError}
          </p>
        )}
      </div>
    );
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      <div className="space-y-6">
        {fields.map(field => renderField(field))}
      </div>
      <div className="flex justify-end">
        <Button
          type="submit"
          disabled={isSubmitting}
          className={isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}
        >
          {isSubmitting ? 'Submitting...' : 'Submit Application'}
        </Button>
      </div>
    </form>
  );
}