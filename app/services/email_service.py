"""
Email service for sending password reset and notification emails.

Uses Resend API for reliable email delivery.
Fallback to console logging if Resend is not configured (development mode).
"""

import resend
from typing import Optional
from loguru import logger
from app.core.config import settings


class EmailService:
    """
    Service for sending emails via Resend API.

    Features:
    - Password reset emails with secure tokens
    - Graceful fallback to console logging in development
    - HTML email templates
    - Error handling and logging
    """

    def __init__(self):
        """Initialize email service with Resend API key."""
        self.resend_api_key = settings.RESEND_API_KEY
        self.from_email = settings.EMAIL_FROM
        self.frontend_url = settings.FRONTEND_URL

        if self.resend_api_key and self.resend_api_key != "your-resend-api-key-here":
            resend.api_key = self.resend_api_key
            self.email_enabled = True
            logger.info("Email service initialized with Resend API")
        else:
            self.email_enabled = False
            logger.warning(
                "Email service running in DEVELOPMENT MODE - "
                "Emails will be logged to console instead of sent. "
                "Set RESEND_API_KEY in .env to enable email sending."
            )

    async def send_password_reset_email(
        self,
        to_email: str,
        reset_token: str,
        username: str
    ) -> bool:
        """
        Send password reset email to user.

        Args:
            to_email: Recipient email address
            reset_token: Password reset token
            username: User's display name

        Returns:
            bool: True if email sent successfully, False otherwise
        """
        reset_link = f"{self.frontend_url}/reset-password?token={reset_token}"

        subject = "Reset Your ELEVATE Password"

        # HTML email template
        html_content = f"""
<!DOCTYPE html>
<html>
<head>
    <style>
        body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
        .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
        .header {{ background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }}
        .content {{ background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }}
        .button {{ display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }}
        .footer {{ text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }}
        .token-box {{ background: #e5e7eb; padding: 15px; border-radius: 6px; font-family: monospace; word-break: break-all; margin: 20px 0; }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🔐 Password Reset Request</h1>
        </div>
        <div class="content">
            <p>Hi <strong>{username}</strong>,</p>

            <p>We received a request to reset your password for your ELEVATE account. Click the button below to create a new password:</p>

            <div style="text-align: center;">
                <a href="{reset_link}" class="button">Reset Password</a>
            </div>

            <p>Or copy and paste this link into your browser:</p>
            <div class="token-box">{reset_link}</div>

            <p><strong>⏰ This link will expire in 1 hour</strong> for security reasons.</p>

            <p>If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.</p>

            <div class="footer">
                <p>This is an automated email from ELEVATE Task Manager</p>
                <p>Need help? Contact support or visit our documentation</p>
            </div>
        </div>
    </div>
</body>
</html>
"""

        # Plain text fallback
        text_content = f"""
Hi {username},

We received a request to reset your password for your ELEVATE account.

Click this link to reset your password:
{reset_link}

⏰ This link will expire in 1 hour for security reasons.

If you didn't request a password reset, you can safely ignore this email.

---
ELEVATE Task Manager
"""

        # Send email or log to console
        if self.email_enabled:
            try:
                params = {
                    "from": self.from_email,
                    "to": [to_email],
                    "subject": subject,
                    "html": html_content,
                    "text": text_content,
                }

                response = resend.Emails.send(params)

                logger.info(
                    f"Password reset email sent successfully",
                    extra={
                        "to_email": to_email,
                        "username": username,
                        "email_id": response.get("id")
                    }
                )
                return True

            except Exception as e:
                logger.error(
                    f"Failed to send password reset email: {str(e)}",
                    extra={
                        "to_email": to_email,
                        "username": username,
                        "error": str(e)
                    }
                )
                # Fallback to console logging if email fails
                self._log_reset_token_to_console(to_email, reset_token, reset_link)
                return False
        else:
            # Development mode - log to console
            self._log_reset_token_to_console(to_email, reset_token, reset_link)
            return True

    def _log_reset_token_to_console(
        self,
        to_email: str,
        reset_token: str,
        reset_link: str
    ) -> None:
        """
        Log password reset token to console (development mode).

        Args:
            to_email: Recipient email
            reset_token: Reset token
            reset_link: Full reset link
        """
        logger.warning(
            "\n" + "="*80 + "\n"
            "📧 PASSWORD RESET EMAIL (Development Mode - Console Output)\n"
            "="*80 + "\n"
            f"To: {to_email}\n"
            f"Subject: Reset Your ELEVATE Password\n"
            "\n"
            f"Reset Link: {reset_link}\n"
            "\n"
            f"Token: {reset_token}\n"
            "\n"
            "⏰ Expires in: 1 hour\n"
            "="*80 + "\n"
            "💡 TIP: Set RESEND_API_KEY in .env to send real emails\n"
            "="*80
        )

    async def send_welcome_email(
        self,
        to_email: str,
        username: str
    ) -> bool:
        """
        Send welcome email to new users (optional - for future use).

        Args:
            to_email: User's email
            username: User's name

        Returns:
            bool: True if sent successfully
        """
        if not self.email_enabled:
            logger.info(f"Welcome email skipped (development mode): {to_email}")
            return True

        subject = "Welcome to ELEVATE!"

        html_content = f"""
<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif; line-height: 1.6;">
    <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #667eea;">Welcome to ELEVATE, {username}! 🚀</h1>
        <p>Thanks for joining ELEVATE Task Manager. We're excited to help you boost your productivity!</p>

        <h2>Get Started:</h2>
        <ul>
            <li>✅ Create your first task</li>
            <li>📊 Explore the Priority Matrix</li>
            <li>📈 Track your productivity with Analytics</li>
            <li>🤖 Try our AI Task Parser</li>
        </ul>

        <p>Login now: <a href="{self.frontend_url}/login">{self.frontend_url}/login</a></p>

        <p>Happy organizing!</p>
        <p><em>The ELEVATE Team</em></p>
    </div>
</body>
</html>
"""

        try:
            params = {
                "from": self.from_email,
                "to": [to_email],
                "subject": subject,
                "html": html_content,
            }

            resend.Emails.send(params)
            logger.info(f"Welcome email sent to {to_email}")
            return True

        except Exception as e:
            logger.error(f"Failed to send welcome email: {str(e)}")
            return False


# Singleton instance
email_service = EmailService()
