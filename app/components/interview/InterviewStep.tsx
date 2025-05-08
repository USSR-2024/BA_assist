'use client';

import React, { ReactNode } from 'react';

interface InterviewStepProps {
  title: string;
  description?: string;
  children: ReactNode;
  currentStep: number;
  stepNumber: number;
}

export const InterviewStep: React.FC<InterviewStepProps> = ({
  title,
  description,
  children,
  currentStep,
  stepNumber,
}) => {
  if (currentStep !== stepNumber) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6 max-w-3xl mx-auto">
      <h2 className="text-xl font-semibold mb-2">{title}</h2>
      {description && <p className="text-gray-600 mb-6">{description}</p>}
      <div className="space-y-4">{children}</div>
    </div>
  );
};

interface FormGroupProps {
  label: string;
  htmlFor: string;
  required?: boolean;
  helper?: string;
  children: ReactNode;
}

export const FormGroup: React.FC<FormGroupProps> = ({
  label,
  htmlFor,
  required = false,
  helper,
  children,
}) => {
  return (
    <div className="mb-4">
      <label htmlFor={htmlFor} className="block text-sm font-medium text-gray-700 mb-1">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      {children}
      {helper && <p className="mt-1 text-xs text-gray-500">{helper}</p>}
    </div>
  );
};

interface StepNavigationProps {
  currentStep: number;
  totalSteps: number;
  onPrevious: () => void;
  onNext: () => void;
  isNextDisabled?: boolean;
  isLastStep?: boolean;
}

export const StepNavigation: React.FC<StepNavigationProps> = ({
  currentStep,
  totalSteps,
  onPrevious,
  onNext,
  isNextDisabled = false,
  isLastStep = false,
}) => {
  return (
    <div className="mt-8">
      <div className="flex justify-between items-center mb-4">
        <div className="text-sm text-gray-500">
          Шаг {currentStep + 1} из {totalSteps}
        </div>
        <div className="h-2 bg-gray-200 rounded-full flex-grow mx-4">
          <div
            className="h-2 bg-blue-500 rounded-full"
            style={{ width: `${((currentStep + 1) / totalSteps) * 100}%` }}
          ></div>
        </div>
      </div>
      <div className="flex justify-between">
        <button
          type="button"
          onClick={onPrevious}
          disabled={currentStep === 0}
          className={`px-4 py-2 border rounded-md ${
            currentStep === 0
              ? 'border-gray-300 text-gray-300 cursor-not-allowed'
              : 'border-gray-300 text-gray-700 hover:bg-gray-50'
          }`}
        >
          Назад
        </button>
        <button
          type="button"
          onClick={onNext}
          disabled={isNextDisabled}
          className={`px-4 py-2 rounded-md ${
            isNextDisabled
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          {isLastStep ? 'Завершить' : 'Далее'}
        </button>
      </div>
    </div>
  );
};

export const RadioOption: React.FC<{
  id: string;
  name: string;
  value: string;
  label: string;
  checked: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}> = ({ id, name, value, label, checked, onChange }) => {
  return (
    <div className="flex items-center mb-2">
      <input
        id={id}
        type="radio"
        name={name}
        value={value}
        checked={checked}
        onChange={onChange}
        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
      />
      <label htmlFor={id} className="ml-2 block text-sm text-gray-700">
        {label}
      </label>
    </div>
  );
};

export const CheckboxOption: React.FC<{
  id: string;
  name: string;
  value: string;
  label: string;
  checked: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}> = ({ id, name, value, label, checked, onChange }) => {
  return (
    <div className="flex items-center mb-2">
      <input
        id={id}
        type="checkbox"
        name={name}
        value={value}
        checked={checked}
        onChange={onChange}
        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
      />
      <label htmlFor={id} className="ml-2 block text-sm text-gray-700">
        {label}
      </label>
    </div>
  );
};