import { useQuery } from '@tanstack/react-query';
import { insuranceApi } from '../services/api';
import type { InsuranceForm, SubmissionsResponse } from '../types/api';

export function useInsuranceForms() {
  return useQuery<InsuranceForm[], Error>({
    queryKey: ['insuranceForms'],
    queryFn: insuranceApi.getForms,
  });
}

export function useInsuranceSubmissions() {
  return useQuery<SubmissionsResponse, Error>({
    queryKey: ['submissions'],
    queryFn: insuranceApi.getSubmissions,
  });
}

export function useStates(country: string) {
  return useQuery<string[], Error>({
    queryKey: ['states', country],
    queryFn: () => insuranceApi.getStates(country),
    enabled: !!country,
    staleTime: 5 * 60 * 1000, 
    gcTime: 30 * 60 * 1000   
  });
}