import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import HRDashboard from './pages/HRDashboard';
import TrainingModule from './pages/TrainingModule';
import EmployeeManager from './pages/EmployeeManager';
import ShopfloorManager from './pages/ShopfloorManager';
import TrainingManager from './pages/TrainingManager';
import ShopfloorTrainingManager from './pages/ShopfloorTrainingManager';
import TrainingCatalog from './pages/TrainingCatalog';
import SettingsManager from './pages/SettingsManager';
import SkillMatrix from './pages/SkillMatrix';
import { useAuth } from './contexts/AuthContext';

export default function App() {
  const { user } = useAuth();

  if (!user) {
    return <Login />;
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/hr" element={<HRDashboard />} />
          <Route path="/training-staff" element={<TrainingModule />} />
          <Route path="/training-shopfloor" element={<ShopfloorTrainingManager />} />
          <Route path="/employees" element={<EmployeeManager />} />
          <Route path="/employees-shopfloor" element={<ShopfloorManager />} />
          <Route path="/skill-matrix" element={<SkillMatrix />} />
          <Route path="/training-manager" element={<TrainingManager />} />
          <Route path="/training-calendar" element={<TrainingManager defaultViewMode="calendar" />} />
          <Route path="/training-catalog" element={<TrainingCatalog />} />
          <Route path="/settings" element={<SettingsManager />} />
          {/* Fallbacks */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
