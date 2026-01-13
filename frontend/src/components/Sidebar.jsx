/**
 * Sidebar Navigation Component
 * Role-based navigation menu
 */

import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
    LayoutDashboard,
    CalendarPlus,
    History,
    Users,
    ClipboardList,
    User,
    Key,
    LogOut,
    Bell,
    Settings
} from 'lucide-react';
import './Sidebar.css';

const Sidebar = () => {
    const { user, logout, isAdmin, isTeamLead } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const basePath = isAdmin ? '/admin' : isTeamLead ? '/team-lead' : '/employee';

    const employeeLinks = [
        { path: `${basePath}`, icon: LayoutDashboard, label: 'Dashboard', end: true },
        { path: `${basePath}/apply-leave`, icon: CalendarPlus, label: 'Apply Leave' },
        { path: `${basePath}/leave-history`, icon: History, label: 'Leave History' },
        { path: `${basePath}/profile`, icon: User, label: 'My Profile' },
        { path: `${basePath}/change-password`, icon: Key, label: 'Change Password' }
    ];

    const teamLeadLinks = [
        { path: '/team-lead', icon: LayoutDashboard, label: 'Dashboard', end: true },
        { path: '/team-lead/team-leaves', icon: ClipboardList, label: 'Team Leaves' },
        { path: '/team-lead/apply-leave', icon: CalendarPlus, label: 'Apply Leave' },
        { path: '/team-lead/leave-history', icon: History, label: 'Leave History' },
        { path: '/team-lead/change-password', icon: Key, label: 'Change Password' }
    ];

    const adminLinks = [
        { path: '/admin', icon: LayoutDashboard, label: 'Dashboard', end: true },
        { path: '/admin/employees', icon: Users, label: 'Employees' },
        { path: '/admin/leaves', icon: ClipboardList, label: 'Leave Management' }
    ];

    const links = isAdmin ? adminLinks : isTeamLead ? teamLeadLinks : employeeLinks;

    return (
        <aside className="sidebar">
            <div className="sidebar-header">
                <div className="logo">
                    <div className="logo-icon">E</div>
                    <span className="logo-text">ELMS</span>
                </div>
            </div>

            <div className="sidebar-user">
                <div className="user-avatar">{user?.name?.charAt(0) || 'U'}</div>
                <div className="user-info">
                    <div className="user-name">{user?.name}</div>
                    <div className="user-role">{user?.role?.replace('_', ' ')}</div>
                </div>
            </div>

            <nav className="sidebar-nav">
                {links.map(link => (
                    <NavLink
                        key={link.path}
                        to={link.path}
                        end={link.end}
                        className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                    >
                        <link.icon size={20} />
                        <span>{link.label}</span>
                    </NavLink>
                ))}
            </nav>

            <div className="sidebar-footer">
                <button className="nav-link logout-btn" onClick={handleLogout}>
                    <LogOut size={20} />
                    <span>Sign Out</span>
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;
