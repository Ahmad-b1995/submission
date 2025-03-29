export interface InsuranceField {
  id: string;
  label: string;
  type: string;
  required?: boolean;
  options?: string[];
  visibility?: {
    dependsOn: string;
    condition: string;
    value: string;
  };
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    message?: string;
  };
  fields?: InsuranceField[];
  dynamicOptions?: {
    dependsOn: string;
    endpoint: string;
    method: string;
  };
}

export interface InsuranceForm {
  formId: string;
  title: string;
  fields: InsuranceField[];
}

export interface FormSubmission {
  id: string;
  formId: string;
  data: Record<string, any>;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  updatedAt: string;
  [key: string]: string | number | Record<string, any> | 'pending' | 'approved' | 'rejected';
}

export interface SubmissionsResponse {
  columns: string[];
  data: FormSubmission[];
}

export interface StatesResponse {
  states: string[];
}

export interface FormSubmissionRequest {
  formId: string;
  data: Record<string, any>;
}

export interface FormSubmissionResponse {
  success: boolean;
  message: string;
  submissionId: string;
}