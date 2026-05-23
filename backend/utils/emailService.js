// Email Service using SendGrid
const sgMail = require('@sendgrid/mail');

class EmailService {
    constructor() {
        this.initialized = false;
        this.fromEmail = process.env.SENDGRID_FROM_EMAIL || process.env.SENDGRID_SENDER_EMAIL || '';
        this.configError = '';
        this.initializeSendGrid();
    }

    initializeSendGrid() {
        try {
            // Check if SendGrid API key is configured
            if (!process.env.SENDGRID_API_KEY) {
                this.configError = 'SENDGRID_API_KEY is not configured';
                if (process.env.NODE_ENV === 'production') {
                    console.error('❌ ' + this.configError);
                } else {
                    console.log('📧 SendGrid not configured - Running in DEVELOPMENT MODE');
                    console.log('   Email notifications will be logged to console instead of being sent');
                }
                this.initialized = false;
                return;
            }

            if (!this.fromEmail) {
                this.configError = 'SENDGRID_FROM_EMAIL is not configured or not set to a verified sender';
                if (process.env.NODE_ENV === 'production') {
                    console.error('❌ ' + this.configError);
                } else {
                    console.log('📧 SendGrid sender email is not configured - Running in DEVELOPMENT MODE');
                    console.log('   Set SENDGRID_FROM_EMAIL to a verified sender address in Render');
                }
                this.initialized = false;
                return;
            }

            // Set SendGrid API key
            sgMail.setApiKey(process.env.SENDGRID_API_KEY);
            this.initialized = true;
            console.log('✅ SendGrid email service initialized successfully');

        } catch (error) {
            console.error('❌ SendGrid initialization error:', error.message);
            this.initialized = false;
        }
    }

    async sendOTP(email, otp, name = 'User') {
        const subject = 'Your TRACKIFY OTP Code';
        const html = `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
                    .otp-box { background: white; border: 2px dashed #667eea; padding: 20px; text-align: center; margin: 20px 0; border-radius: 8px; }
                    .otp-code { font-size: 32px; font-weight: bold; color: #667eea; letter-spacing: 5px; }
                    .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>🎯 TRACKIFY</h1>
                        <p>Visitor Management System</p>
                    </div>
                    <div class="content">
                        <h2>Hello ${name},</h2>
                        <p>Your One-Time Password (OTP) for TRACKIFY verification is:</p>
                        <div class="otp-box">
                            <div class="otp-code">${otp}</div>
                        </div>
                        <p><strong>Important:</strong></p>
                        <ul>
                            <li>This OTP is valid for 10 minutes</li>
                            <li>Do not share this code with anyone</li>
                            <li>If you didn't request this, please ignore this email</li>
                        </ul>
                    </div>
                    <div class="footer">
                        <p>This is an automated email from TRACKIFY Visitor Management System</p>
                    </div>
                </div>
            </body>
            </html>
        `;

        return this.sendEmail(email, subject, html);
    }

    async sendVisitorApprovalEmail(email, name, purpose, approvedBy) {
        const subject = '✅ Your Visit Request has been Approved';
        const html = `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
                    .status-box { background: white; border-left: 5px solid #38ef7d; padding: 20px; margin: 20px 0; border-radius: 5px; }
                    .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>✅ Visit Approved</h1>
                        <p>TRACKIFY Visitor Management</p>
                    </div>
                    <div class="content">
                        <h2>Good News, ${name}!</h2>
                        <p>Your visit request has been approved.</p>
                        <div class="status-box">
                            <p><strong>Visit Details:</strong></p>
                            <ul>
                                <li><strong>Purpose:</strong> ${purpose}</li>
                                <li><strong>Approved By:</strong> ${approvedBy}</li>
                                <li><strong>Status:</strong> <span style="color: #38ef7d;">Approved ✓</span></li>
                            </ul>
                        </div>
                        <p>Please proceed to the entrance. Have a pleasant visit!</p>
                    </div>
                    <div class="footer">
                        <p>This is an automated email from TRACKIFY Visitor Management System</p>
                    </div>
                </div>
            </body>
            </html>
        `;

        return this.sendEmail(email, subject, html);
    }

    async sendVisitorRejectionEmail(email, name, purpose, rejectedBy, reason = 'Not specified') {
        const subject = '❌ Your Visit Request has been Declined';
        const html = `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: linear-gradient(135deg, #eb3349 0%, #f45c43 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
                    .status-box { background: white; border-left: 5px solid #f45c43; padding: 20px; margin: 20px 0; border-radius: 5px; }
                    .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>❌ Visit Declined</h1>
                        <p>TRACKIFY Visitor Management</p>
                    </div>
                    <div class="content">
                        <h2>Dear ${name},</h2>
                        <p>We regret to inform you that your visit request has been declined.</p>
                        <div class="status-box">
                            <p><strong>Visit Details:</strong></p>
                            <ul>
                                <li><strong>Purpose:</strong> ${purpose}</li>
                                <li><strong>Declined By:</strong> ${rejectedBy}</li>
                                <li><strong>Reason:</strong> ${reason}</li>
                                <li><strong>Status:</strong> <span style="color: #f45c43;">Declined ✗</span></li>
                            </ul>
                        </div>
                        <p>If you have any questions, please contact the administration.</p>
                    </div>
                    <div class="footer">
                        <p>This is an automated email from TRACKIFY Visitor Management System</p>
                    </div>
                </div>
            </body>
            </html>
        `;

        return this.sendEmail(email, subject, html);
    }

    async sendStaffNotification(email, name, visitorName, visitorPurpose, acceptanceTime) {
        // Use the actual acceptance timestamp from database with IST timezone
        // Format: MM/DD/YYYY, HH:MM:SS AM/PM in Asia/Kolkata timezone
        let timeToShow;
        if (acceptanceTime) {
            const timestamp = new Date(acceptanceTime);
            timeToShow = timestamp.toLocaleString('en-IN', { 
                timeZone: 'Asia/Kolkata',
                year: 'numeric', 
                month: '2-digit', 
                day: '2-digit',
                hour: '2-digit', 
                minute: '2-digit', 
                second: '2-digit',
                hour12: true 
            });
        } else {
            timeToShow = new Date().toLocaleString('en-IN', { 
                timeZone: 'Asia/Kolkata',
                year: 'numeric', 
                month: '2-digit', 
                day: '2-digit',
                hour: '2-digit', 
                minute: '2-digit', 
                second: '2-digit',
                hour12: true 
            });
        }
        
        const subject = '🔔 Visitor Notification - Someone is here to meet you';
        const html = `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
                    .notification-box { background: white; border-left: 5px solid #667eea; padding: 20px; margin: 20px 0; border-radius: 5px; }
                    .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>🔔 Visitor Alert</h1>
                        <p>TRACKIFY Visitor Management</p>
                    </div>
                    <div class="content">
                        <h2>Hello ${name},</h2>
                        <p>You have a visitor waiting to meet you.</p>
                        <div class="notification-box">
                            <p><strong>Visitor Information:</strong></p>
                            <ul>
                                <li><strong>Name:</strong> ${visitorName}</li>
                                <li><strong>Purpose:</strong> ${visitorPurpose}</li>
                                <li><strong>Approval Time:</strong> ${timeToShow}</li>
                            </ul>
                        </div>
                        <p>Please check with reception for more details.</p>
                    </div>
                    <div class="footer">
                        <p>This is an automated email from TRACKIFY Visitor Management System</p>
                    </div>
                </div>
            </body>
            </html>
        `;

        return this.sendEmail(email, subject, html);
    }

    async sendEmail(to, subject, html) {
        if (!this.initialized) {
            if (process.env.NODE_ENV === 'production') {
                return { success: false, error: this.configError || 'SendGrid is not configured' };
            }

            console.log('\n📧 EMAIL (Development Mode):');
            console.log(`To: ${to}`);
            console.log(`Subject: ${subject}`);
            console.log('Email would be sent in production\n');
            return { success: true, message: 'Development mode - email logged' };
        }

        try {
            const msg = {
                to: to,
                from: this.fromEmail,
                subject: subject,
                html: html
            };

            await sgMail.send(msg);
            console.log('✅ Email sent successfully to:', to);
            return { success: true };
        } catch (error) {
            console.error('❌ Email sending failed:', error.message);
            if (error.response) {
                console.error('SendGrid Error:', error.response.body);
            }
            const sendGridMessage = error.response?.body?.errors?.[0]?.message;
            const responseBody = error.response?.body ? JSON.stringify(error.response.body) : '';
            return {
                success: false,
                error: sendGridMessage || error.message,
                details: responseBody
            };
        }
    }
}

// Export singleton instance
module.exports = new EmailService();
