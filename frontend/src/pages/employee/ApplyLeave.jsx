/**
 * Apply Leave Page with AI Auto-fill
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { leaveAPI, aiAPI } from '../../services/api';
import Sidebar from '../../components/Sidebar';
import {
    Sparkles,
    Calendar,
    Send,
    AlertCircle,
    CheckCircle,
    Loader
} from 'lucide-react';
import './ApplyLeave.css';

const ApplyLeave = () => {
    const navigate = useNavigate();
    const [aiInput, setAiInput] = useState('');
    const [aiLoading, setAiLoading] = useState(false);
    const [formData, setFormData] = useState({
        leaveType: '',
        fromDate: '',
        toDate: '',
        description: ''
    });
    const [conflicts, setConflicts] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // AI Auto-fill handler
    const handleAiAutofill = async () => {
        if (!aiInput.trim()) return;

        setAiLoading(true);
        setError('');

        try {
            const result = await aiAPI.autofill(aiInput);
            if (result.success && result.data) {
                setFormData({
                    leaveType: result.data.leaveType || '',
                    fromDate: result.data.fromDate || '',
                    toDate: result.data.toDate || '',
                    description: result.data.description || aiInput
                });

                // Check for conflicts
                if (result.data.fromDate && result.data.toDate) {
                    checkConflicts(result.data.fromDate, result.data.toDate, result.data.leaveType);
                }
            } else {
                setError('Could not parse your request. Please fill the form manually.');
            }
        } catch (err) {
            setError('AI service unavailable. Please fill the form manually.');
        } finally {
            setAiLoading(false);
        }
    };

    // Check conflicts
    const checkConflicts = async (fromDate, toDate, leaveType) => {
        try {
            const result = await aiAPI.detectConflicts(fromDate, toDate, leaveType);
            if (result.success && result.conflicts?.hasConflicts) {
                setConflicts(result.conflicts);
            }
        } catch (err) {
            console.error('Conflict check failed:', err);
        }
    };

    // Form change handler
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    // Submit handler
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            await leaveAPI.apply(formData);
            setSuccess('Leave application submitted successfully!');
            setTimeout(() => navigate(-1), 2000);
        } catch (err) {
            setError(err.message || 'Failed to submit leave application');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="app-layout">
            <Sidebar />
            <main className="main-content">
                <div className="page-header">
                    <h1 className="page-title">Apply for Leave</h1>
                    <p className="page-subtitle">Use AI to auto-fill or enter details manually</p>
                </div>

                {/* AI Auto-fill Section */}
                <div className="card ai-card">
                    <div className="ai-header">
                        <Sparkles size={24} className="ai-icon" />
                        <div>
                            <h3>AI-Powered Auto-fill</h3>
                            <p>Describe your leave in natural language</p>
                        </div>
                    </div>
                    <div className="ai-input-wrapper">
                        <input
                            type="text"
                            className="form-input ai-input"
                            placeholder="e.g., I need sick leave tomorrow for a doctor's appointment"
                            value={aiInput}
                            onChange={(e) => setAiInput(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleAiAutofill()}
                        />
                        <button
                            className="btn btn-primary ai-btn"
                            onClick={handleAiAutofill}
                            disabled={aiLoading || !aiInput.trim()}
                        >
                            {aiLoading ? <Loader size={18} className="spin" /> : <Sparkles size={18} />}
                            Auto-fill
                        </button>
                    </div>
                </div>

                {/* Conflict Warnings */}
                {conflicts?.warnings?.length > 0 && (
                    <div className="alert alert-warning">
                        <AlertCircle size={18} />
                        <div>
                            <strong>Potential Conflicts Detected:</strong>
                            <ul>
                                {conflicts.warnings.map((w, i) => (
                                    <li key={i}>{w.message}</li>
                                ))}
                            </ul>
                        </div>
                    </div>
                )}

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

                {/* Leave Form */}
                <div className="card">
                    <form onSubmit={handleSubmit}>
                        <div className="grid grid-cols-2">
                            <div className="form-group">
                                <label className="form-label">Leave Type *</label>
                                <select
                                    name="leaveType"
                                    className="form-select"
                                    value={formData.leaveType}
                                    onChange={handleChange}
                                    required
                                >
                                    <option value="">Select leave type</option>
                                    <option value="annual">Annual Leave</option>
                                    <option value="sick">Sick Leave</option>
                                    <option value="casual">Casual Leave</option>
                                    <option value="unpaid">Unpaid Leave</option>
                                    <option value="maternity">Maternity Leave</option>
                                    <option value="paternity">Paternity Leave</option>
                                </select>
                            </div>

                            <div></div>

                            <div className="form-group">
                                <label className="form-label">From Date *</label>
                                <input
                                    type="date"
                                    name="fromDate"
                                    className="form-input"
                                    value={formData.fromDate}
                                    onChange={handleChange}
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">To Date *</label>
                                <input
                                    type="date"
                                    name="toDate"
                                    className="form-input"
                                    value={formData.toDate}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="form-label">Reason / Description</label>
                            <textarea
                                name="description"
                                className="form-textarea"
                                placeholder="Provide additional details about your leave request..."
                                value={formData.description}
                                onChange={handleChange}
                                rows={4}
                            />
                        </div>

                        <div className="form-actions">
                            <button type="button" className="btn btn-secondary" onClick={() => navigate(-1)}>
                                Cancel
                            </button>
                            <button type="submit" className="btn btn-primary" disabled={loading}>
                                {loading ? <Loader size={18} className="spin" /> : <Send size={18} />}
                                Submit Application
                            </button>
                        </div>
                    </form>
                </div>
            </main>
        </div>
    );
};

export default ApplyLeave;
