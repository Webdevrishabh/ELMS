/**
 * Main App Component with Routing
 */

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

// Auth Pages
import LoginPage from './pages/auth/LoginPage';
import AdminLoginPage from './pages/auth/AdminLoginPage';

// Employee Pages
import EmployeeDashboard from './pages/employee/EmployeeDashboard';
import ApplyLeave from './pages/employee/ApplyLeave';
import LeaveHistory from './pages/employee/LeaveHistory';
import Profile from './pages/employee/Profile';
import ChangePassword from './pages/employee/ChangePassword';

// Team Lead Pages
import TeamLeadDashboard from './pages/teamlead/TeamLeadDashboard';
import TeamLeaveManagement from './pages/teamlead/TeamLeaveManagement';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import EmployeeManagement from './pages/admin/EmployeeManagement';
import AdminLeaveManagement from './pages/admin/AdminLeaveManagement';

// Root redirect based on role
const RootRedirect = () => {
    const { user, isAuthenticated } = useAuth();

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    if (user?.role === 'admin') {
        return <Navigate to="/admin" replace />;
    } else if (user?.role === 'team_lead') {
        return <Navigate to="/team-lead" replace />;
    } else {
        return <Navigate to="/employee" replace />;
    }
};

function App() {
    return (
        <AuthProvider>
            <BrowserRouter>
                <Routes>
                    {/* Root */}
                    <Route path="/" element={<RootRedirect />} />

                    {/* Auth Routes */}
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/admin/login" element={<AdminLoginPage />} />

                    {/* Employee Routes */}
                    <Route path="/employee" element={
                        <ProtectedRoute roles={['employee']}>
                            <EmployeeDashboard />
                        </ProtectedRoute>
                    } />
                    <Route path="/employee/apply-leave" element={
                        <ProtectedRoute roles={['employee']}>
                            <ApplyLeave />
                        </ProtectedRoute>
                    } />
                    <Route path="/employee/leave-history" element={
                        <ProtectedRoute roles={['employee']}>
                            <LeaveHistory />
                        </ProtectedRoute>
                    } />
                    <Route path="/employee/profile" element={
                        <ProtectedRoute roles={['employee']}>
                            <Profile />
                        </ProtectedRoute>
                    } />
                    <Route path="/employee/change-password" element={
                        <ProtectedRoute roles={['employee']}>
                            <ChangePassword />
                        </ProtectedRoute>
                    } />

                    {/* Team Lead Routes */}
                    <Route path="/team-lead" element={
                        <ProtectedRoute roles={['team_lead']}>
                            <TeamLeadDashboard />
                        </ProtectedRoute>
                    } />
                    <Route path="/team-lead/team-leaves" element={
                        <ProtectedRoute roles={['team_lead']}>
                            <TeamLeaveManagement />
                        </ProtectedRoute>
                    } />
                    <Route path="/team-lead/apply-leave" element={
                        <ProtectedRoute roles={['team_lead']}>
                            <ApplyLeave />
                        </ProtectedRoute>
                    } />
                    <Route path="/team-lead/leave-history" element={
                        <ProtectedRoute roles={['team_lead']}>
                            <LeaveHistory />
                        </ProtectedRoute>
                    } />
                    <Route path="/team-lead/change-password" element={
                        <ProtectedRoute roles={['team_lead']}>
                            <ChangePassword />
                        </ProtectedRoute>
                    } />

                    {/* Admin Routes */}
                    <Route path="/admin" element={
                        <ProtectedRoute roles={['admin']}>
                            <AdminDashboard />
                        </ProtectedRoute>
                    } />
                    <Route path="/admin/employees" element={
                        <ProtectedRoute roles={['admin']}>
                            <EmployeeManagement />
                        </ProtectedRoute>
                    } />
                    <Route path="/admin/leaves" element={
                        <ProtectedRoute roles={['admin']}>
                            <AdminLeaveManagement />
                        </ProtectedRoute>
                    } />

                    {/* Catch all */}
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </BrowserRouter>
        </AuthProvider>
    );
}

export default App;
