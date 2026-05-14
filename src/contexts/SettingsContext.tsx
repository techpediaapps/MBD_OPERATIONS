import React, { createContext, useContext, useState, ReactNode } from 'react';

interface SettingsContextType {
  departments: string[];
  setDepartments: React.Dispatch<React.SetStateAction<string[]>>;
  addDepartment: (dept: string) => void;
  removeDepartment: (dept: string) => void;

  trainingTypes: string[];
  setTrainingTypes: React.Dispatch<React.SetStateAction<string[]>>;
  addTrainingType: (type: string) => void;
  removeTrainingType: (type: string) => void;

  businessUnits: string[];
  setBusinessUnits: React.Dispatch<React.SetStateAction<string[]>>;
  addBusinessUnit: (unit: string) => void;
  removeBusinessUnit: (unit: string) => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

const initialDepartments = ['INJ', 'ASM', 'QC', 'PRT', 'MNT', 'WH', 'HR'];
const initialTrainingTypes = ['Classroom', 'Soft Skills', 'Compliance', 'On-the-job', 'Safety'];
const initialBusinessUnits = ['Plant A', 'Plant B', 'HQ'];

export const SettingsProvider = ({ children }: { children: ReactNode }) => {
  const [departments, setDepartments] = useState<string[]>(initialDepartments);
  const [trainingTypes, setTrainingTypes] = useState<string[]>(initialTrainingTypes);
  const [businessUnits, setBusinessUnits] = useState<string[]>(initialBusinessUnits);

  const addDepartment = (dept: string) => setDepartments(prev => [...prev, dept]);
  const removeDepartment = (dept: string) => setDepartments(prev => prev.filter(d => d !== dept));

  const addTrainingType = (type: string) => setTrainingTypes(prev => [...prev, type]);
  const removeTrainingType = (type: string) => setTrainingTypes(prev => prev.filter(t => t !== type));

  const addBusinessUnit = (unit: string) => setBusinessUnits(prev => [...prev, unit]);
  const removeBusinessUnit = (unit: string) => setBusinessUnits(prev => prev.filter(u => u !== unit));

  return (
    <SettingsContext.Provider value={{
      departments, setDepartments, addDepartment, removeDepartment,
      trainingTypes, setTrainingTypes, addTrainingType, removeTrainingType,
      businessUnits, setBusinessUnits, addBusinessUnit, removeBusinessUnit
    }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) throw new Error('useSettings must be used within SettingsProvider');
  return context;
};
