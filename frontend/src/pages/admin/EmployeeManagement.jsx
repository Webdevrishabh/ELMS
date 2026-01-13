/**
 * Employee Management Page (Admin)
 */

import { useState, useEffect } from 'react';
import { userAPI } from '../../services/api';
import Sidebar from '../../components/Sidebar';
import { Users, Plus, Edit, Trash2, X, AlertCircle, CheckCircle } from 'lucide-react';

const EmployeeManagement = () => {
    const [users, setUsers] = useState([]);
    const [teams, setTeams] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [showNewTeamInput, setShowNewTeamInput] = useState(false);
    const [newTeamName, setNewTeamName] = useState('');
    const [formData, setFormData] = useState({
        email: '', password: '', name: '', role: 'employee', teamId: '', phone: ''
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [usersRes, teamsRes] = await Promise.all([
                userAPI.getAll(),
                userAPI.getTeams()
            ]);
            setUsers(usersRes.users || []);
            setTeams(teamsRes.teams || []);
        } catch (error) {
            console.error('Failed to load data:', error);
        } finally {
            setLoading(false);
        }
    };

    const openAddModal = () => {
        setEditingUser(null);
        setFormData({ email: '', password: '', name: '', role: 'employee', teamId: '', phone: '' });
        setShowModal(true);
        setShowNewTeamInput(false);
        setNewTeamName('');
        setError('');
    };

    const openEditModal = (user) => {
        setEditingUser(user);
        setFormData({
            email: user.email,
            password: '',
            name: user.name,
            role: user.role,
            teamId: user.team_id || '',
            phone: user.phone || ''
        });
        setShowModal(true);
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        try {
            if (editingUser) {
                await userAPI.update(editingUser.id, formData);
                setSuccess('User updated successfully');
            } else {
                await userAPI.create(formData);
                setSuccess('User created successfully');
            }
            setShowModal(false);
            loadData();
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            setError(err.message || 'Operation failed');
        }
    };

    const handleDelete = async (userId) => {
        if (!confirm('Are you sure you want to delete this user?')) return;

        try {
            await userAPI.delete(userId);
            loadData();
            setSuccess('User deleted successfully');
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            setError(err.message || 'Failed to delete user');
        }
    };

    return (
        <div className="app-layout">
            <Sidebar />
            <main className="main-content">
                <div className="page-header">
                    <h1 className="page-title">Employee Management</h1>
                    <button className="btn btn-primary" onClick={openAddModal}>
                        <Plus size={18} /> Add Employee
                    </button>
                </div>

                {success && (
                    <div className="alert alert-success">
                        <CheckCircle size={18} />
                        {success}
                    </div>
                )}

                <div className="card">
                    {loading ? (
                        <div className="loading"><div className="spinner"></div></div>
                    ) : (
                        <div className="table-container">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Name</th>
                                        <th>Email</th>
                                        <th>Role</th>
                                        <th>Team</th>
                                        <th>Leave Balance</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {users.map(user => (
                                        <tr key={user.id}>
                                            <td>{user.name}</td>
                                            <td>{user.email}</td>
                                            <td className="capitalize">{user.role?.replace('_', ' ')}</td>
                                            <td>{user.team_name || '-'}</td>
                                            <td>{user.leave_balance || 0}</td>
                                            <td>
                                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                    <button className="btn btn-sm btn-secondary" onClick={() => openEditModal(user)}>
                                                        <Edit size={14} />
                                                    </button>
                                                    {user.role !== 'admin' && (
                                                        <button className="btn btn-sm btn-danger" onClick={() => handleDelete(user.id)}>
                                                            <Trash2 size={14} />
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Add/Edit Modal */}
                {showModal && (
                    <div className="modal-overlay">
                        <div className="modal">
                            <div className="modal-header">
                                <h3 className="modal-title">{editingUser ? 'Edit User' : 'Add Employee'}</h3>
                                <button className="btn btn-secondary btn-sm" onClick={() => setShowModal(false)}>
                                    <X size={18} />
                                </button>
                            </div>

                            {error && (
                                <div className="alert alert-error">
                                    <AlertCircle size={18} />
                                    {error}
                                </div>
                            )}

                            <form onSubmit={handleSubmit}>
                                <div className="form-group">
                                    <label className="form-label">Full Name *</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Email *</label>
                                    <input
                                        type="email"
                                        className="form-input"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        required
                                        disabled={!!editingUser}
                                    />
                                </div>

                                {!editingUser && (
                                    <div className="form-group">
                                        <label className="form-label">Password *</label>
                                        <input
                                            type="password"
                                            className="form-input"
                                            value={formData.password}
                                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                            required={!editingUser}
                                        />
                                    </div>
                                )}

                                <div className="form-group">
                                    <label className="form-label">Role *</label>
                                    <select
                                        className="form-select"
                                        value={formData.role}
                                        onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                    >
                                        <option value="employee">Employee</option>
                                        <option value="team_lead">Team Lead</option>
                                        <option value="admin">Admin</option>
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Team</label>
                                    {!showNewTeamInput ? (
                                        <>
                                            <select
                                                className="form-select"
                                                value={formData.teamId}
                                                onChange={(e) => {
                                                    if (e.target.value === 'add_new') {
                                                        setShowNewTeamInput(true);
                                                    } else {
                                                        setFormData({ ...formData, teamId: e.target.value });
                                                    }
                                                }}
                                            >
                                                <option value="">No Team</option>
                                                {teams.map(team => (
                                                    <option key={team.id} value={team.id}>{team.name}</option>
                                                ))}
                                                <option value="add_new">➕ Add New Team...</option>
                                            </select>
                                        </>
                                    ) : (
                                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                            <input
                                                type="text"
                                                className="form-input"
                                                placeholder="Enter new team name"
                                                value={newTeamName}
                                                onChange={(e) => setNewTeamName(e.target.value)}
                                                autoFocus
                                            />
                                            <button
                                                type="button"
                                                className="btn btn-success btn-sm"
                                                onClick={async () => {
                                                    if (!newTeamName.trim()) return;
                                                    try {
                                                        const result = await userAPI.createTeam(newTeamName);
                                                        const newTeam = result.team;
                                                        setTeams([...teams, newTeam]);
                                                        setFormData({ ...formData, teamId: newTeam.id.toString() });
                                                        setShowNewTeamInput(false);
                                                        setNewTeamName('');
                                                    } catch (err) {
                                                        setError(err.message || 'Failed to create team');
                                                    }
                                                }}
                                            >
                                                Add
                                            </button>
                                            <button
                                                type="button"
                                                className="btn btn-secondary btn-sm"
                                                onClick={() => {
                                                    setShowNewTeamInput(false);
                                                    setNewTeamName('');
                                                }}
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    )}
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Phone</label>
                                    <input
                                        type="tel"
                                        className="form-input"
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    />
                                </div>

                                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
                                    <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                                        Cancel
                                    </button>
                                    <button type="submit" className="btn btn-primary">
                                        {editingUser ? 'Update' : 'Create'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

export default EmployeeManagement;
