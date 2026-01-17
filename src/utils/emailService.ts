// ============================================
// Email Service for InSuite Edu
// Using EmailJS for frontend email sending
// ============================================

// EmailJS configuration interface
export interface EmailSettings {
    serviceId: string;
    templateId: string;
    publicKey: string;
    enabled: boolean;
}

// Welcome email parameters
export interface WelcomeEmailParams {
    studentName: string;
    studentEmail: string;
    studentId: string;
    password: string;
    loginUrl: string;
    instituteName?: string;
}

// Generate a random password
export function generatePassword(length: number = 8): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
    let password = '';
    for (let i = 0; i < length; i++) {
        password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
}

// Load EmailJS script dynamically
let emailjsLoaded = false;
async function loadEmailJS(): Promise<boolean> {
    if (emailjsLoaded) return true;

    return new Promise((resolve) => {
        if ((window as any).emailjs) {
            emailjsLoaded = true;
            resolve(true);
            return;
        }

        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/@emailjs/browser@4/dist/email.min.js';
        script.onload = () => {
            emailjsLoaded = true;
            resolve(true);
        };
        script.onerror = () => {
            console.error('Failed to load EmailJS');
            resolve(false);
        };
        document.head.appendChild(script);
    });
}

// Send welcome email to new student
export async function sendWelcomeEmail(
    params: WelcomeEmailParams,
    settings: EmailSettings
): Promise<{ success: boolean; error?: string }> {
    // Check if email settings are configured
    if (!settings.enabled || !settings.serviceId || !settings.templateId || !settings.publicKey) {
        console.log('Email settings not configured, skipping welcome email');
        return { success: false, error: 'Email not configured' };
    }

    // Check if student has email
    if (!params.studentEmail) {
        return { success: false, error: 'No email address provided' };
    }

    try {
        // Load EmailJS
        const loaded = await loadEmailJS();
        if (!loaded) {
            return { success: false, error: 'Failed to load email service' };
        }

        const emailjs = (window as any).emailjs;

        // Initialize EmailJS
        emailjs.init(settings.publicKey);

        // Send email
        const response = await emailjs.send(
            settings.serviceId,
            settings.templateId,
            {
                to_email: params.studentEmail,
                to_name: params.studentName,
                student_id: params.studentId,
                password: params.password,
                login_url: params.loginUrl,
                institute_name: params.instituteName || 'InSuite Edu',
            }
        );

        console.log('Welcome email sent successfully:', response);
        return { success: true };
    } catch (error: any) {
        console.error('Failed to send welcome email:', error);
        return { success: false, error: error.text || error.message || 'Unknown error' };
    }
}

// Get the student login URL
export function getStudentLoginUrl(): string {
    // Get the current origin and add the login path
    const origin = window.location.origin;
    return `${origin}/#/login?mode=student`;
}

// Email template for manual sending (WhatsApp/SMS)
export function getWelcomeMessage(params: WelcomeEmailParams): string {
    return `🎓 *Welcome to ${params.instituteName || 'InSuite Edu'}!*

Dear ${params.studentName},

Your student account has been created. Here are your login credentials:

📝 *Student ID:* ${params.studentId}
🔑 *Password:* ${params.password}

🔗 *Login Link:* ${params.loginUrl}

Please keep these credentials safe. You can change your password after logging in.

If you have any questions, please contact the school office.

Best regards,
${params.instituteName || 'InSuite Edu'} Team`;
}
