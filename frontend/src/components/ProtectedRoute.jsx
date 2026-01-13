/**
 * Protected Route Component
 * Guards routes based on authentication and role
 */

import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children, roles = [] }) => {
    const { user, loading, isAuthenticated } = useAuth();

    if (loading) {
        return (
            <div className="loading">
                <div className="spinner"></div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    // Check role access
    if (roles.length > 0 && !roles.includes(user.role)) {
        // Redirect to appropriate dashboard
        const dashboardPath = user.role === 'admin' ? '/admin'
            : user.role === 'team_lead' ? '/team-lead'
                : '/employee';
        return <Navigate to={dashboardPath} replace />;
    }

    return children;
};

export default ProtectedRoute;
