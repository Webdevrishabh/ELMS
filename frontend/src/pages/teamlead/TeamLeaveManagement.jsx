/**
 * Team Leave Management Page
 */

import { useState, useEffect } from 'react';
import { leaveAPI, aiAPI } from '../../services/api';
import Sidebar from '../../components/Sidebar';
import AIRecommendation from '../../components/AIRecommendation';
import { Filter, CheckCircle, XCircle } from 'lucide-react';

const TeamLeaveManagement = () => {
    const [leaves, setLeaves] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [approvalFilter, setApprovalFilter] = useState('');
    const [recommendation, setRecommendation] = useState(null);
    const [selectedLeave, setSelectedLeave] = useState(null);

    useEffect(() => {
        loadLeaves();
    }, [filter, approvalFilter]);

    const loadLeaves = async () => {
        try {
            const result = await leaveAPI.getTeamLeaves(filter, approvalFilter);
            setLeaves(result.leaves || []);
        } catch (error) {
            console.error('Failed to load leaves:', error);
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
        try {
            await leaveAPI.approve(leaveId);
            loadLeaves();
        } catch (error) {
            console.error('Failed to approve:', error);
        }
        setRecommendation(null);
        setSelectedLeave(null);
    };

    const handleReject = async (leaveId) => {
        const comment = prompt('Rejection reason (optional):');
        try {
            await leaveAPI.reject(leaveId, comment);
            loadLeaves();
        } catch (error) {
            console.error('Failed to reject:', error);
        }
        setRecommendation(null);
        setSelectedLeave(null);
    };

    return (
        <div className="app-layout">
            <Sidebar />
            <main className="main-content">
                <div className="page-header">
                    <h1 className="page-title">Team Leave Management</h1>
                    <p className="page-subtitle">Review and manage your team's leave requests</p>
                </div>

                <div className="card">
                    <div className="card-header">
                        <h3 className="card-title">Team Leave Requests</h3>
                        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                            <Filter size={16} />
                            <select
                                className="form-select"
                                style={{ width: 'auto' }}
                                value={filter}
                                onChange={(e) => setFilter(e.target.value)}
                            >
                                <option value="all">All Status</option>
                                <option value="pending">Pending</option>
                                <option value="approved">Approved</option>
                                <option value="rejected">Rejected</option>
                            </select>
                            <select
                                className="form-select"
                                style={{ width: 'auto' }}
                                value={approvalFilter}
                                onChange={(e) => setApprovalFilter(e.target.value)}
                            >
                                <option value="">All Approvals</option>
                                <option value="pending">Needs My Approval</option>
                            </select>
                        </div>
                    </div>

                    {loading ? (
                        <div className="loading"><div className="spinner"></div></div>
                    ) : leaves.length > 0 ? (
                        <div className="table-container">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Employee</th>
                                        <th>Type</th>
                                        <th>From</th>
                                        <th>To</th>
                                        <th>Days</th>
                                        <th>My Approval</th>
                                        <th>Status</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {leaves.map(leave => (
                                        <tr key={leave.id}>
                                            <td>{leave.user_name}</td>
                                            <td className="capitalize">{leave.leave_type}</td>
                                            <td>{new Date(leave.from_date).toLocaleDateString()}</td>
                                            <td>{new Date(leave.to_date).toLocaleDateString()}</td>
                                            <td>{leave.total_days}</td>
                                            <td>
                                                <span className={`badge badge-${leave.team_lead_approval}`}>
                                                    {leave.team_lead_approval}
                                                </span>
                                            </td>
                                            <td>
                                                <span className={`badge badge-${leave.status}`}>
                                                    {leave.status}
                                                </span>
                                            </td>
                                            <td>
                                                {leave.team_lead_approval === 'pending' && (
                                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                        <button
                                                            className="btn btn-sm btn-secondary"
                                                            onClick={() => getRecommendation(leave.id)}
                                                        >
                                                            AI
                                                        </button>
                                                        <button
                                                            className="btn btn-sm btn-success"
                                                            onClick={() => handleApprove(leave.id)}
                                                        >
                                                            <CheckCircle size={14} />
                                                        </button>
                                                        <button
                                                            className="btn btn-sm btn-danger"
                                                            onClick={() => handleReject(leave.id)}
                                                        >
                                                            <XCircle size={14} />
                                                        </button>
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="empty-state">
                            <p>No leave requests found</p>
                        </div>
                    )}
                </div>

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
            </main>
        </div>
    );
};

export default TeamLeaveManagement;
