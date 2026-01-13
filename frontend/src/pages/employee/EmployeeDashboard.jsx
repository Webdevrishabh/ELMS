/**
 * Employee Dashboard
 * Shows leave balances, stats, and AI chatbot
 */

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { dashboardAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import ChatBot from '../../components/ChatBot';
import Sidebar from '../../components/Sidebar';
import {
    Calendar,
    Clock,
    CheckCircle,
    XCircle,
    CalendarPlus,
    TrendingUp
} from 'lucide-react';
import './Dashboard.css';

const EmployeeDashboard = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
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
                    <h1 className="page-title">Welcome back, {user?.name?.split(' ')[0]}! 👋</h1>
                    <p className="page-subtitle">Here's your leave summary at a glance</p>
                </div>

                {/* Leave Balances */}
                <div className="grid grid-cols-3 balance-cards">
                    <div className="stat-card balance-annual">
                        <div className="icon" style={{ background: 'rgba(99, 102, 241, 0.2)' }}>
                            <Calendar size={24} color="#6366f1" />
                        </div>
                        <div className="value">{data?.balances?.annual || 0}</div>
                        <div className="label">Annual Leave Days</div>
                    </div>
                    <div className="stat-card balance-sick">
                        <div className="icon" style={{ background: 'rgba(239, 68, 68, 0.2)' }}>
                            <Clock size={24} color="#ef4444" />
                        </div>
                        <div className="value">{data?.balances?.sick || 0}</div>
                        <div className="label">Sick Leave Days</div>
                    </div>
                    <div className="stat-card balance-casual">
                        <div className="icon" style={{ background: 'rgba(16, 185, 129, 0.2)' }}>
                            <TrendingUp size={24} color="#10b981" />
                        </div>
                        <div className="value">{data?.balances?.casual || 0}</div>
                        <div className="label">Casual Leave Days</div>
                    </div>
                </div>

                {/* Stats and Quick Actions */}
                <div className="grid grid-cols-2 section-spacing">
                    {/* Leave Stats */}
                    <div className="card">
                        <div className="card-header">
                            <h3 className="card-title">Leave Statistics</h3>
                        </div>
                        <div className="stats-grid">
                            <div className="stat-item">
                                <span className="stat-value">{data?.stats?.total || 0}</span>
                                <span className="stat-label">Total Leaves</span>
                            </div>
                            <div className="stat-item pending">
                                <span className="stat-value">{data?.stats?.pending || 0}</span>
                                <span className="stat-label">Pending</span>
                            </div>
                            <div className="stat-item approved">
                                <span className="stat-value">{data?.stats?.approved || 0}</span>
                                <span className="stat-label">Approved</span>
                            </div>
                            <div className="stat-item rejected">
                                <span className="stat-value">{data?.stats?.rejected || 0}</span>
                                <span className="stat-label">Rejected</span>
                            </div>
                        </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="card">
                        <div className="card-header">
                            <h3 className="card-title">Quick Actions</h3>
                        </div>
                        <div className="quick-actions">
                            <Link to="/employee/apply-leave" className="action-btn primary">
                                <CalendarPlus size={20} />
                                <span>Apply for Leave</span>
                            </Link>
                            <Link to="/employee/leave-history" className="action-btn secondary">
                                <Clock size={20} />
                                <span>View History</span>
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Recent Leaves */}
                <div className="card">
                    <div className="card-header">
                        <h3 className="card-title">Recent Leave Requests</h3>
                        <Link to="/employee/leave-history" className="btn btn-sm btn-secondary">View All</Link>
                    </div>
                    {data?.recentLeaves?.length > 0 ? (
                        <div className="table-container">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Type</th>
                                        <th>From</th>
                                        <th>To</th>
                                        <th>Days</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {data.recentLeaves.map(leave => (
                                        <tr key={leave.id}>
                                            <td className="capitalize">{leave.leave_type}</td>
                                            <td>{new Date(leave.from_date).toLocaleDateString()}</td>
                                            <td>{new Date(leave.to_date).toLocaleDateString()}</td>
                                            <td>{leave.total_days}</td>
                                            <td>
                                                <span className={`badge badge-${leave.status}`}>
                                                    {leave.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="empty-state">
                            <Calendar size={48} />
                            <p>No leave requests yet</p>
                        </div>
                    )}
                </div>

                {/* AI Chatbot */}
                <ChatBot />
            </main>
        </div>
    );
};

export default EmployeeDashboard;
