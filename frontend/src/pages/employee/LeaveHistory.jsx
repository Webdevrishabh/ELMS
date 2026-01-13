/**
 * Leave History Page
 */

import { useState, useEffect } from 'react';
import { leaveAPI } from '../../services/api';
import Sidebar from '../../components/Sidebar';
import { Calendar, Filter } from 'lucide-react';

const LeaveHistory = () => {
    const [leaves, setLeaves] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');

    useEffect(() => {
        loadLeaves();
    }, [filter]);

    const loadLeaves = async () => {
        try {
            const result = await leaveAPI.getMyLeaves(filter);
            setLeaves(result.leaves || []);
        } catch (error) {
            console.error('Failed to load leaves:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="app-layout">
            <Sidebar />
            <main className="main-content">
                <div className="page-header">
                    <h1 className="page-title">Leave History</h1>
                    <p className="page-subtitle">View all your leave requests</p>
                </div>

                <div className="card">
                    <div className="card-header">
                        <h3 className="card-title">Your Leave Requests</h3>
                        <div className="filter-group">
                            <Filter size={16} />
                            <select
                                className="form-select"
                                style={{ width: 'auto' }}
                                value={filter}
                                onChange={(e) => setFilter(e.target.value)}
                            >
                                <option value="all">All</option>
                                <option value="pending">Pending</option>
                                <option value="approved">Approved</option>
                                <option value="rejected">Rejected</option>
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
                                        <th>Type</th>
                                        <th>From</th>
                                        <th>To</th>
                                        <th>Days</th>
                                        <th>Description</th>
                                        <th>TL Status</th>
                                        <th>Admin Status</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {leaves.map(leave => (
                                        <tr key={leave.id}>
                                            <td className="capitalize">{leave.leave_type}</td>
                                            <td>{new Date(leave.from_date).toLocaleDateString()}</td>
                                            <td>{new Date(leave.to_date).toLocaleDateString()}</td>
                                            <td>{leave.total_days}</td>
                                            <td>{leave.description?.substring(0, 30) || '-'}</td>
                                            <td>
                                                <span className={`badge badge-${leave.team_lead_approval}`}>
                                                    {leave.team_lead_approval === 'na' ? 'N/A' : leave.team_lead_approval}
                                                </span>
                                            </td>
                                            <td>
                                                <span className={`badge badge-${leave.admin_approval}`}>
                                                    {leave.admin_approval}
                                                </span>
                                            </td>
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
                            <p>No leave requests found</p>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default LeaveHistory;
