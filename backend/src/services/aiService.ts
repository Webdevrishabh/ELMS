/**
 * Gemini AI Service
 * Handles all AI operations with Google's Gemini API
 * Includes data masking and logging
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import sql from '../config/database';

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

/**
 * Mask personal data before sending to AI
 */
export const maskData = (data: any): any => {
    if (typeof data === 'string') {
        // Mask email
        data = data.replace(/[\w.-]+@[\w.-]+\.\w+/g, '[EMAIL]');
        // Mask phone
        data = data.replace(/\b\d{10,}\b/g, '[PHONE]');
        // Mask names (simple approach - mask capitalized words)
        // In production, use a more sophisticated approach
        return data;
    }
    if (typeof data === 'object' && data !== null) {
        const masked: any = Array.isArray(data) ? [] : {};
        for (const key of Object.keys(data)) {
            if (['email', 'phone', 'password', 'password_hash'].includes(key.toLowerCase())) {
                masked[key] = '[MASKED]';
            } else if (key === 'name') {
                masked[key] = 'Employee';
            } else {
                masked[key] = maskData(data[key]);
            }
        }
        return masked;
    }
    return data;
};

/**
 * Log AI request/response
 */
const logAICall = async (userId: number, actionType: string, request: string, response: string) => {
    try {
        await sql`
            INSERT INTO ai_logs (user_id, action_type, request_masked, response_data)
            VALUES (${userId}, ${actionType}, ${request}, ${response})
        `;
    } catch (error) {
        console.error('AI log error:', error);
    }
};

/**
 * Smart Leave Assistant - Chatbot
 */
export const chatAssistant = async (userId: number, message: string, context: any) => {
    const maskedContext = maskData(context);

    const prompt = `You are a helpful Leave Management System assistant. Answer questions about leave policies, balances, and status.

CONTEXT (User's leave data):
- Annual Leave Balance: ${maskedContext.balances?.annual || 0} days
- Sick Leave Balance: ${maskedContext.balances?.sick || 0} days
- Casual Leave Balance: ${maskedContext.balances?.casual || 0} days
- Pending Leaves: ${maskedContext.stats?.pending || 0}
- Approved Leaves: ${maskedContext.stats?.approved || 0}

COMPANY POLICY:
- Annual leave: 20 days per year
- Sick leave: 10 days per year
- Casual leave: 5 days per year
- Leave requests need Team Lead + Admin approval
- Apply leaves at least 3 days in advance for planned leaves
- Sick leave can be applied on same day with medical certificate

USER MESSAGE: ${message}

Provide a helpful, concise response. If asked about specific dates or calculations, be accurate. If unsure, say so.`;

    try {
        const result = await model.generateContent(prompt);
        const response = result.response.text();

        logAICall(userId, 'chat', message, response);

        return { success: true, message: response };
    } catch (error) {
        console.error('AI Chat error:', error);
        return {
            success: false,
            message: 'I apologize, but I\'m having trouble processing your request. Please try again or contact HR directly.'
        };
    }
};

/**
 * Auto-fill Leave Form from natural language
 */
export const autoFillLeave = async (userId: number, input: string) => {
    const today = new Date().toISOString().split('T')[0];

    const prompt = `Parse the following leave request and extract structured data.

TODAY'S DATE: ${today}

USER INPUT: "${input}"

Extract the following fields and respond ONLY with a valid JSON object (no markdown, no explanation):
{
    "leaveType": "annual" | "sick" | "casual" | "unpaid" | "maternity" | "paternity",
    "fromDate": "YYYY-MM-DD",
    "toDate": "YYYY-MM-DD", 
    "description": "Brief description"
}

Rules:
- If "tomorrow" is mentioned, calculate the date
- If only one day mentioned, fromDate = toDate
- Default leave type is "casual" if unclear
- Sick leave for illness/fever/doctor
- Annual leave for vacation/holiday
- Be smart about date interpretations`;

    try {
        const result = await model.generateContent(prompt);
        let response = result.response.text().trim();

        // Clean up response (remove markdown code blocks if present)
        response = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

        const parsed = JSON.parse(response);

        logAICall(userId, 'autofill', input, JSON.stringify(parsed));

        return { success: true, data: parsed };
    } catch (error) {
        console.error('AI AutoFill error:', error);
        return {
            success: false,
            error: 'Could not parse leave request. Please fill in the form manually.',
            data: null
        };
    }
};

/**
 * AI Leave Recommendation for approval
 */
export const getLeaveRecommendation = async (userId: number, leaveData: any, teamContext: any) => {
    const maskedLeave = maskData(leaveData);
    const maskedTeam = maskData(teamContext);

    const prompt = `As an HR AI assistant, analyze this leave request and provide a recommendation.

LEAVE REQUEST:
- Type: ${maskedLeave.leave_type}
- From: ${maskedLeave.from_date}
- To: ${maskedLeave.to_date}
- Duration: ${maskedLeave.total_days} days
- Reason: ${maskedLeave.description || 'Not provided'}

TEAM CONTEXT:
- Team members on leave during this period: ${maskedTeam.overlapping || 0}
- Total team size: ${maskedTeam.teamSize || 'Unknown'}
- Employee's remaining balance: ${maskedTeam.balance || 'Unknown'}

Analyze and respond ONLY with a valid JSON object:
{
    "suggestion": "approve" | "review" | "reject",
    "riskLevel": "low" | "medium" | "high",
    "reason": "Brief explanation",
    "considerations": ["List", "of", "factors"]
}

NOTE: This is advisory only. A human manager will make the final decision.`;

    try {
        const result = await model.generateContent(prompt);
        let response = result.response.text().trim();
        response = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

        const parsed = JSON.parse(response);

        logAICall(userId, 'recommendation', JSON.stringify(maskedLeave), JSON.stringify(parsed));

        return { success: true, recommendation: parsed };
    } catch (error) {
        console.error('AI Recommendation error:', error);
        return {
            success: false,
            recommendation: {
                suggestion: 'review',
                riskLevel: 'medium',
                reason: 'AI analysis unavailable. Please review manually.',
                considerations: []
            }
        };
    }
};

/**
 * Conflict Detection
 */
export const detectConflicts = async (userId: number, leaveData: any, existingLeaves: any[]) => {
    const maskedLeaves = maskData(existingLeaves);

    const prompt = `Analyze potential conflicts for this leave request.

NEW LEAVE REQUEST:
- From: ${leaveData.from_date}
- To: ${leaveData.to_date}
- Type: ${leaveData.leave_type}

EXISTING TEAM LEAVES DURING THIS PERIOD:
${JSON.stringify(maskedLeaves.map((l: any) => ({ from: l.from_date, to: l.to_date, type: l.leave_type })))}

Identify conflicts and respond ONLY with valid JSON:
{
    "hasConflicts": true | false,
    "warnings": [
        {
            "type": "overlap" | "team_coverage" | "skill_gap",
            "severity": "low" | "medium" | "high",
            "message": "Description of the issue"
        }
    ]
}`;

    try {
        const result = await model.generateContent(prompt);
        let response = result.response.text().trim();
        response = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

        const parsed = JSON.parse(response);

        logAICall(userId, 'conflict_detection', JSON.stringify(leaveData), JSON.stringify(parsed));

        return { success: true, conflicts: parsed };
    } catch (error) {
        console.error('AI Conflict Detection error:', error);
        return {
            success: false,
            conflicts: { hasConflicts: false, warnings: [] }
        };
    }
};
