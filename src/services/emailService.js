// Email Notification Service
// Note: Requires email API key (Resend/SendGrid) to be configured in Cloud Functions

/**
 * Email Templates
 * These are used by Cloud Functions when sending emails
 */
export const EMAIL_TEMPLATES = {
    welcome: {
        subject: 'Welcome to RFPgrep!',
        template: `
            <h1>Welcome to RFPgrep! 🎉</h1>
            <p>Hi {{name}},</p>
            <p>Thanks for signing up! You're now ready to revolutionize how you respond to RFPs.</p>
            <p>Here's what you can do:</p>
            <ul>
                <li>📄 Upload your first RFP</li>
                <li>📚 Build your Knowledge Library</li>
                <li>✨ Generate AI-powered responses</li>
            </ul>
            <p>Your 14-day free trial of Professional features is active!</p>
            <a href="https://responceai.web.app/dashboard">Go to Dashboard →</a>
        `
    },
    teamInvite: {
        subject: '{{inviter}} invited you to join their team on RFPgrep',
        template: `
            <h1>You've been invited! 👋</h1>
            <p>{{inviter}} has invited you to join their team on RFPgrep.</p>
            <p>RFPgrep helps teams respond to RFPs faster with AI-powered assistance.</p>
            <a href="https://responceai.web.app/signup">Accept Invitation →</a>
        `
    },
    deadlineReminder: {
        subject: 'RFP Deadline Reminder: {{projectName}}',
        template: `
            <h1>Deadline Approaching ⏰</h1>
            <p>Hi {{name}},</p>
            <p>The deadline for <strong>{{projectName}}</strong> is in {{daysRemaining}} days.</p>
            <p>You have {{questionsRemaining}} questions remaining to answer.</p>
            <a href="https://responceai.web.app/editor?projectId={{projectId}}">Continue Working →</a>
        `
    }
};

/**
 * Format email template with variables
 */
export const formatEmailTemplate = (template, variables) => {
    let result = template;
    Object.entries(variables).forEach(([key, value]) => {
        result = result.replace(new RegExp(`{{${key}}}`, 'g'), value);
    });
    return result;
};

/**
 * Check if email notifications are enabled
 * Placeholder - would check user preferences in production
 */
export const isEmailEnabled = (userData) => {
    return userData?.preferences?.emailNotifications !== false;
};

/**
 * Notification preferences defaults
 */
export const DEFAULT_EMAIL_PREFERENCES = {
    welcomeEmail: true,
    teamInvites: true,
    deadlineReminders: true,
    weeklySummary: false
};
