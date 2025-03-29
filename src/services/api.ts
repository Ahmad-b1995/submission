import axios from 'axios';
import type { 
  InsuranceForm, 
  SubmissionsResponse, 
  StatesResponse,
  FormSubmissionRequest,
  FormSubmissionResponse
} from '../types/api';

const BASE_URL = 'https://assignment.devotel.io';

export const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const insuranceApi = {
  getForms: async (): Promise<InsuranceForm[]> => {
    const { data } = await api.get<InsuranceForm[]>('/api/insurance/forms');
    return data;
  },
  
  submitForm: async (formData: FormSubmissionRequest): Promise<FormSubmissionResponse> => {
    try {
      const { data } = await api.post<FormSubmissionResponse>('/api/insurance/forms/submit', formData);
      return data;
    } catch (error: any) {
      console.error('Error submitting form:', error.response?.data || error.message);
      throw error;
    }
  },
  
  getSubmissions: async (): Promise<SubmissionsResponse> => {
    const { data } = await api.get<SubmissionsResponse>('/api/insurance/forms/submissions');
    return data;
  },

  getStates: async (country: string): Promise<string[]> => {
    if (!country) return [];
    
    try {
      const { data } = await api.get<StatesResponse>(`/api/getStates?country=${encodeURIComponent(country)}`);
      return data.states || [];
    } catch (error) {
      console.error('Error fetching states:', error);
      return [];
    }
  },
};