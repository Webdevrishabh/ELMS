/**
 * Admin Dashboard
 */

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { dashboardAPI, leaveAPI } from '../../services/api';
import Sidebar from '../../components/Sidebar';
import {
    Users,
    Calendar,
    Clock,
    CheckCircle,
    XCircle,
    TrendingUp
} from 'lucide-react';
import '../employee/Dashboard.css';

const AdminDashboard = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(null);

    useEffect(() => {
        loadDashboard();
    }, []);

    const loadDashboard = async () => {
        try {
            const result = await dashboardAPI.get();
            setData(result);
        } catch (error) {
            console.error('Failed to load dashboard:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (leaveId) => {
        setActionLoading(leaveId);
        try {
            await leaveAPI.approve(leaveId);
            loadDashboard();
        } catch (error) {
            console.error('Failed to approve:', error);
        } finally {
            setActionLoading(null);
        }
    };

    const handleReject = async (leaveId) => {
        const comment = prompt('Rejection reason (optional):');
        setActionLoading(leaveId);
        try {
            await leaveAPI.reject(leaveId, comment);
            loadDashboard();
        } catch (error) {
            console.error('Failed to reject:', error);
        } finally {
            setActionLoading(null);
        }
    };

    if (loading) {
        return (
            <div className="app-layout">
                <Sidebar />
                <main className="main-content">
                    <div className="loading"><div className="spinner"></div></div>
                </main>
            </div>
        );
    }

    return (
        <div className="app-layout">
            <Sidebar />
            <main className="main-content">
                <div className="page-header">
                    <h1 className="page-title">Admin Dashboard</h1>
                    <p className="page-subtitle">System overview and leave management</p>
                </div>

                {/* Stats */}
                <div className="admin-stats">
                    <div className="admin-stat-card">
                        <div className="value">{data?.userCounts?.total || 0}</div>
                        <div className="label">Total Users</div>
                    </div>
                    <div className="admin-stat-card">
                        <div className="value" style={{ color: 'var(--warning)' }}>
                            {data?.pendingAdminApproval?.length || 0}
                        </div>
                        <div className="label">Pending Approvals</div>
                    </div>
                    <div className="admin-stat-card">
                        <div className="value" style={{ color: 'var(--success)' }}>
                            {data?.systemStats?.approved || 0}
                        </div>
                        <div className="label">Approved Leaves</div>
                    </div>
                    <div className="admin-stat-card">
                        <div className="value">{data?.systemStats?.totalLeaves || 0}</div>
                        <div className="label">Total Leaves</div>
                    </div>
                </div>

                {/* Pending Final Approvals */}
                <div className="card pending-card">
                    <div className="card-header">
                        <h3 className="card-title">🔔 Pending Final Approvals</h3>
                        <Link to="/admin/leaves?approval=pending" className="btn btn-sm btn-secondary">View All</Link>
                    </div>

                    {data?.pendingAdminApproval?.length > 0 ? (
                        <div>
                            {data.pendingAdminApproval.slice(0, 5).map(leave => (
                                <div key={leave.id} className="leave-request-item">
                                    <div className="request-info">
                                        <div className="request-user">
                                            {leave.user_name}
                                            <span className="badge" style={{ marginLeft: '0.5rem' }}>{leave.user_role?.replace('_', ' ')}</span>
                                        </div>
                                        <div className="request-details">
                                            <span className="capitalize">{leave.leave_type}</span> •
                                            {new Date(leave.from_date).toLocaleDateString()} - {new Date(leave.to_date).toLocaleDateString()} •
                                            {leave.total_days} day(s)
                                            {leave.team_name && ` • ${leave.team_name}`}
                                        </div>
                                    </div>
                                    <div className="request-actions">
                                        <button
                                            className="btn btn-sm btn-success"
                                            onClick={() => handleApprove(leave.id)}
                                            disabled={actionLoading === leave.id}
                                        >
                                            <CheckCircle size={14} /> Approve
                                        </button>
                                        <button
                                            className="btn btn-sm btn-danger"
                                            onClick={() => handleReject(leave.id)}
                                            disabled={actionLoading === leave.id}
                                        >
                                            <XCircle size={14} /> Reject
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="empty-state">
                            <CheckCircle size={48} />
                            <p>No pending approvals! 🎉</p>
                        </div>
                    )}
                </div>

                {/* Quick Links */}
                <div className="admin-quick-links">
                    <Link to="/admin/employees" className="card action-card">
                        <div className="icon-wrapper" style={{ background: 'rgba(99, 102, 241, 0.1)', color: '#6366f1' }}>
                            <Users size={32} />
                        </div>
                        <div className="content">
                            <h3 className="card-title" style={{ marginBottom: '0.25rem' }}>Employee Management</h3>
                            <p className="text-secondary" style={{ fontSize: '0.9rem' }}>Add, edit, or remove employees</p>
                        </div>
                    </Link>
                    <Link to="/admin/leaves" className="card action-card">
                        <div className="icon-wrapper" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>
                            <Calendar size={32} />
                        </div>
                        <div className="content">
                            <h3 className="card-title" style={{ marginBottom: '0.25rem' }}>Leave Management</h3>
                            <p className="text-secondary" style={{ fontSize: '0.9rem' }}>View and manage all leave requests</p>
                        </div>
                    </Link>
                </div>
            </main>
        </div>
    );
};

export default AdminDashboard;
