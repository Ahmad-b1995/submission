import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useState } from 'react';
import { useInsuranceForms } from './hooks/useInsuranceForms';
import { DynamicForm } from './components/forms/DynamicForm';
import { SubmissionsTable } from './components/submissions/SubmissionsTable';
import { Button } from './components/ui/Button';
import { Toaster } from 'react-hot-toast';

const queryClient = new QueryClient();

function InsurancePortal() {
  const { data: forms, isLoading, error } = useInsuranceForms();
  const [selectedForm, setSelectedForm] = useState<string | null>(null);
  const [showSubmissions, setShowSubmissions] = useState(false);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-xl text-gray-600">Loading insurance forms...</div>
      </div>
    );
  }

  if (error || !forms) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-xl text-red-600">Failed to load insurance forms. Please try again later.</div>
      </div>
    );
  }

  const handleSubmit = async () => {
    await queryClient.invalidateQueries({ queryKey: ['submissions'] });
    setShowSubmissions(true);
  };

  const selectedFormData = forms.find(form => form.formId === selectedForm);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="space-y-8">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-gray-900">
              Smart Insurance Portal
            </h1>
            <Button
              onClick={() => {
                setShowSubmissions(!showSubmissions);
                setSelectedForm(null);
              }}
              variant="secondary"
            >
              {showSubmissions ? 'New Application' : 'View Submissions'}
            </Button>
          </div>

          {!showSubmissions ? (
            <div className="space-y-8">
              {!selectedForm ? (
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {forms.map((form) => (
                    <div
                      key={form.formId}
                      className="bg-white overflow-hidden shadow rounded-lg divide-y divide-gray-200 hover:shadow-lg transition-shadow duration-200"
                    >
                      <div className="px-4 py-5 sm:p-6">
                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                          {form.title}
                        </h3>
                        <p className="text-sm text-gray-500 mb-4">
                          {form.formId === 'health_insurance_application' && 
                            'Comprehensive health coverage for individuals and families'}
                          {form.formId === 'home_insurance_application' && 
                            'Protect your home and belongings with our coverage options'}
                          {form.formId === 'car_insurance_application' && 
                            'Auto insurance tailored to your driving needs'}
                        </p>
                        <Button
                          onClick={() => setSelectedForm(form.formId)}
                          className="w-full"
                        >
                          Start Application
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-white shadow rounded-lg p-6">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-semibold">
                      {selectedFormData?.title}
                    </h2>
                    <Button
                      variant="outline"
                      onClick={() => setSelectedForm(null)}
                    >
                      Back to Forms
                    </Button>
                  </div>
                  {selectedFormData && (
                    <DynamicForm
                      formId={selectedFormData.formId}
                      title={selectedFormData.title}
                      fields={selectedFormData.fields}
                      onSubmit={handleSubmit}
                    />
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white shadow rounded-lg p-6">
              <SubmissionsTable />
            </div>
          )}
        </div>
      </div>
      <Toaster position="top-right" />
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <InsurancePortal />
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}

export default App;