/**
 * API Service Layer
 * Handles all API calls to the backend
 */

const API_URL = '/api';

// Get stored auth token
const getToken = () => localStorage.getItem('token');

// Default headers
const getHeaders = () => ({
    'Content-Type': 'application/json',
    ...(getToken() && { 'Authorization': `Bearer ${getToken()}` })
});

// Generic fetch wrapper
const apiCall = async (endpoint, options = {}) => {
    const response = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers: getHeaders()
    });

    const text = await response.text();
    let data;
    try {
        data = JSON.parse(text);
    } catch (e) {
        console.error('API Error: Non-JSON response received', text);
        throw new Error(`Server Error (${response.status}): The server returned an invalid response.`);
    }

    if (!response.ok) {
        throw new Error(data.error || 'Something went wrong');
    }

    return data;
};

// Auth API
export const authAPI = {
    login: (email, password) => apiCall('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
    }),
    changePassword: (currentPassword, newPassword) => apiCall('/auth/change-password', {
        method: 'POST',
        body: JSON.stringify({ currentPassword, newPassword })
    })
};

// User API
export const userAPI = {
    getProfile: () => apiCall('/users/profile'),
    updateProfile: (data) => apiCall('/users/profile', {
        method: 'PUT',
        body: JSON.stringify(data)
    }),
    getAll: () => apiCall('/users'),
    create: (data) => apiCall('/users', {
        method: 'POST',
        body: JSON.stringify(data)
    }),
    update: (id, data) => apiCall(`/users/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
    }),
    delete: (id) => apiCall(`/users/${id}`, { method: 'DELETE' }),
    getTeams: () => apiCall('/users/teams'),
    createTeam: (name) => apiCall('/users/teams', {
        method: 'POST',
        body: JSON.stringify({ name })
    })
};

// Leave API
export const leaveAPI = {
    apply: (data) => apiCall('/leaves', {
        method: 'POST',
        body: JSON.stringify(data)
    }),
    getMyLeaves: (status = 'all') => apiCall(`/leaves/my?status=${status}`),
    getTeamLeaves: (status = 'all', approval = '') =>
        apiCall(`/leaves/team?status=${status}&approval=${approval}`),
    getAllLeaves: (status = 'all', approval = '') =>
        apiCall(`/leaves/all?status=${status}&approval=${approval}`),
    getLeave: (id) => apiCall(`/leaves/${id}`),
    approve: (id, comment = '') => apiCall(`/leaves/${id}/approve`, {
        method: 'PUT',
        body: JSON.stringify({ comment })
    }),
    reject: (id, comment = '') => apiCall(`/leaves/${id}/reject`, {
        method: 'PUT',
        body: JSON.stringify({ comment })
    })
};

// Dashboard API
export const dashboardAPI = {
    get: () => apiCall('/dashboard')
};

// Notification API
export const notificationAPI = {
    getAll: (unreadOnly = false) => apiCall(`/notifications?unread=${unreadOnly}`),
    markAsRead: (id) => apiCall(`/notifications/${id}/read`, { method: 'PUT' })
};

// AI API
export const aiAPI = {
    chat: (message) => apiCall('/ai/chat', {
        method: 'POST',
        body: JSON.stringify({ message })
    }),
    autofill: (input) => apiCall('/ai/autofill', {
        method: 'POST',
        body: JSON.stringify({ input })
    }),
    getRecommendation: (leaveId) => apiCall(`/ai/recommend/${leaveId}`),
    detectConflicts: (fromDate, toDate, leaveType) => apiCall('/ai/conflicts', {
        method: 'POST',
        body: JSON.stringify({ fromDate, toDate, leaveType })
    })
};
