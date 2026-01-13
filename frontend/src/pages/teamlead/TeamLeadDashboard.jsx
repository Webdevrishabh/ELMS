/**
 * Team Lead Dashboard
 */

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { dashboardAPI, leaveAPI, aiAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import Sidebar from '../../components/Sidebar';
import ChatBot from '../../components/ChatBot';
import AIRecommendation from '../../components/AIRecommendation';
import {
    Users,
    Clock,
    CheckCircle,
    XCircle,
    Calendar,
    AlertCircle
} from 'lucide-react';
import '../employee/Dashboard.css';

const TeamLeadDashboard = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(null);
    const [recommendation, setRecommendation] = useState(null);
    const [selectedLeave, setSelectedLeave] = useState(null);
    const { user } = useAuth();

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

    const getRecommendation = async (leaveId) => {
        setSelectedLeave(leaveId);
        try {
            const result = await aiAPI.getRecommendation(leaveId);
            setRecommendation(result.recommendation);
        } catch (error) {
            console.error('Failed to get recommendation:', error);
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
            setRecommendation(null);
            setSelectedLeave(null);
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
                    <h1 className="page-title">Team Lead Dashboard</h1>
                    <p className="page-subtitle">Manage your team's leave requests</p>
                </div>

                {/* Stats */}
                <div className="admin-stats">
                    <div className="admin-stat-card">
                        <div className="value" style={{ color: 'var(--warning)' }}>
                            {data?.pendingTeamLeaves?.length || 0}
                        </div>
                        <div className="label">Pending Approvals</div>
                    </div>
                    <div className="admin-stat-card">
                        <div className="value">{data?.teamStats?.total || 0}</div>
                        <div className="label">Team Leave Requests</div>
                    </div>
                    <div className="admin-stat-card">
                        <div className="value" style={{ color: 'var(--success)' }}>
                            {data?.teamStats?.approved || 0}
                        </div>
                        <div className="label">Approved</div>
                    </div>
                    <div className="admin-stat-card">
                        <div className="value">{data?.balances?.annual || 0}</div>
                        <div className="label">Your Leave Balance</div>
                    </div>
                </div>

                {/* Pending Leaves */}
                <div className="card pending-card">
                    <div className="card-header">
                        <h3 className="card-title">🔔 Pending Leave Requests</h3>
                        <Link to="/team-lead/team-leaves" className="btn btn-sm btn-secondary">View All</Link>
                    </div>

                    {data?.pendingTeamLeaves?.length > 0 ? (
                        <div>
                            {data.pendingTeamLeaves.map(leave => (
                                <div key={leave.id} className="leave-request-item">
                                    <div className="request-info">
                                        <div className="request-user">{leave.user_name}</div>
                                        <div className="request-details">
                                            <span className="capitalize">{leave.leave_type}</span> •
                                            {new Date(leave.from_date).toLocaleDateString()} - {new Date(leave.to_date).toLocaleDateString()} •
                                            {leave.total_days} day(s)
                                        </div>
                                        {leave.description && (
                                            <div className="request-desc">{leave.description}</div>
                                        )}
                                    </div>
                                    <div className="request-actions">
                                        <button
                                            className="btn btn-sm btn-secondary"
                                            onClick={() => getRecommendation(leave.id)}
                                        >
                                            AI Suggest
                                        </button>
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
                            <p>No pending requests! 🎉</p>
                        </div>
                    )}
                </div>

                {/* AI Recommendation Modal */}
                {recommendation && selectedLeave && (
                    <AIRecommendation
                        recommendation={recommendation}
                        onClose={() => {
                            setRecommendation(null);
                            setSelectedLeave(null);
                        }}
                        onApprove={() => handleApprove(selectedLeave)}
                        onReject={() => handleReject(selectedLeave)}
                    />
                )}

                <ChatBot />
            </main>
        </div>
    );
};

export default TeamLeadDashboard;
