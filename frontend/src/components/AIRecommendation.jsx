/**
 * AI Recommendation Component
 * Shows AI suggestions for leave approval
 */

import { Sparkles, X, CheckCircle, XCircle, AlertTriangle, Info } from 'lucide-react';
import './AIRecommendation.css';

const AIRecommendation = ({ recommendation, onClose, onApprove, onReject }) => {
    const getRiskColor = (level) => {
        switch (level) {
            case 'low': return '#22c55e';
            case 'medium': return '#f59e0b';
            case 'high': return '#ef4444';
            default: return '#64748b';
        }
    };

    const getSuggestionIcon = (suggestion) => {
        switch (suggestion) {
            case 'approve': return <CheckCircle size={24} color="#22c55e" />;
            case 'reject': return <XCircle size={24} color="#ef4444" />;
            default: return <AlertTriangle size={24} color="#f59e0b" />;
        }
    };

    return (
        <div className="modal-overlay">
            <div className="modal ai-modal">
                <div className="modal-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <Sparkles size={20} color="#6366f1" />
                        <h3 className="modal-title">AI Recommendation</h3>
                    </div>
                    <button className="btn btn-secondary btn-sm" onClick={onClose}>
                        <X size={18} />
                    </button>
                </div>

                <div className="ai-suggestion">
                    <div className="suggestion-icon">
                        {getSuggestionIcon(recommendation.suggestion)}
                    </div>
                    <div className="suggestion-text">
                        <span className="suggestion-label">Suggested Action</span>
                        <span className={`suggestion-value ${recommendation.suggestion}`}>
                            {recommendation.suggestion?.toUpperCase()}
                        </span>
                    </div>
                </div>

                <div className="ai-risk">
                    <span className="risk-label">Risk Level</span>
                    <span
                        className="risk-badge"
                        style={{ background: `${getRiskColor(recommendation.riskLevel)}20`, color: getRiskColor(recommendation.riskLevel) }}
                    >
                        {recommendation.riskLevel?.toUpperCase()}
                    </span>
                </div>

                <div className="ai-reason">
                    <Info size={16} />
                    <p>{recommendation.reason}</p>
                </div>

                {recommendation.considerations?.length > 0 && (
                    <div className="ai-considerations">
                        <h4>Considerations:</h4>
                        <ul>
                            {recommendation.considerations.map((item, i) => (
                                <li key={i}>{item}</li>
                            ))}
                        </ul>
                    </div>
                )}

                <div className="ai-disclaimer">
                    <AlertTriangle size={14} />
                    <span>This is an AI suggestion. The final decision is yours.</span>
                </div>

                <div className="ai-actions">
                    <button className="btn btn-success" onClick={onApprove}>
                        <CheckCircle size={18} /> Approve
                    </button>
                    <button className="btn btn-danger" onClick={onReject}>
                        <XCircle size={18} /> Reject
                    </button>
                    <button className="btn btn-secondary" onClick={onClose}>
                        Decide Later
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AIRecommendation;
