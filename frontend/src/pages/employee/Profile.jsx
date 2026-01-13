/**
 * Profile Page
 */

import { useState, useEffect } from 'react';
import { userAPI } from '../../services/api';
import Sidebar from '../../components/Sidebar';
import { User, Save, AlertCircle, CheckCircle } from 'lucide-react';

const Profile = () => {
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [formData, setFormData] = useState({
        name: '',
        phone: ''
    });

    useEffect(() => {
        loadProfile();
    }, []);

    const loadProfile = async () => {
        try {
            const result = await userAPI.getProfile();
            setProfile(result.user);
            setFormData({
                name: result.user.name || '',
                phone: result.user.phone || ''
            });
        } catch (error) {
            console.error('Failed to load profile:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setError('');
        setSuccess('');

        try {
            await userAPI.updateProfile(formData);
            setSuccess('Profile updated successfully!');
        } catch (err) {
            setError(err.message || 'Failed to update profile');
        } finally {
            setSaving(false);
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
                    <h1 className="page-title">My Profile</h1>
                    <p className="page-subtitle">View and update your profile information</p>
                </div>

                <div className="grid grid-cols-3">
                    {/* Profile Card */}
                    <div className="card" style={{ gridColumn: 'span 1' }}>
                        <div style={{ textAlign: 'center' }}>
                            <div className="profile-avatar">
                                {profile?.name?.charAt(0) || 'U'}
                            </div>
                            <h3 style={{ marginTop: '1rem' }}>{profile?.name}</h3>
                            <p className="text-secondary capitalize">{profile?.role?.replace('_', ' ')}</p>
                            <p className="text-muted">{profile?.email}</p>
                            {profile?.team_name && (
                                <span className="badge" style={{ marginTop: '0.5rem' }}>
                                    {profile.team_name}
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Edit Form */}
                    <div className="card" style={{ gridColumn: 'span 2' }}>
                        <h3 className="card-title" style={{ marginBottom: '1.5rem' }}>Edit Profile</h3>

                        {error && (
                            <div className="alert alert-error">
                                <AlertCircle size={18} />
                                {error}
                            </div>
                        )}

                        {success && (
                            <div className="alert alert-success">
                                <CheckCircle size={18} />
                                {success}
                            </div>
                        )}

                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label className="form-label">Full Name</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Email</label>
                                <input
                                    type="email"
                                    className="form-input"
                                    value={profile?.email || ''}
                                    disabled
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Phone</label>
                                <input
                                    type="tel"
                                    className="form-input"
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    placeholder="Enter phone number"
                                />
                            </div>

                            <button type="submit" className="btn btn-primary" disabled={saving}>
                                <Save size={18} />
                                {saving ? 'Saving...' : 'Save Changes'}
                            </button>
                        </form>
                    </div>
                </div>

                {/* Leave Balances */}
                <div className="card" style={{ marginTop: '1.5rem' }}>
                    <h3 className="card-title" style={{ marginBottom: '1rem' }}>Leave Balances</h3>
                    <div className="grid grid-cols-3">
                        <div className="stat-item">
                            <span className="stat-value">{profile?.leave_balance || 0}</span>
                            <span className="stat-label">Annual Leave</span>
                        </div>
                        <div className="stat-item">
                            <span className="stat-value">{profile?.sick_leave_balance || 0}</span>
                            <span className="stat-label">Sick Leave</span>
                        </div>
                        <div className="stat-item">
                            <span className="stat-value">{profile?.casual_leave_balance || 0}</span>
                            <span className="stat-label">Casual Leave</span>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default Profile;
