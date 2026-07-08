"""Email sending utility (used for forgot-password notifications)."""
import smtplib
import logging
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

from ..config import get_settings

logger = logging.getLogger(__name__)


def send_email(to_email: str, subject: str, html_body: str, text_body: str = "") -> bool:
    """Send an email via SMTP. Returns True on success, False on failure."""
    settings = get_settings()

    if not settings.SMTP_USERNAME or not settings.SMTP_PASSWORD:
        logger.warning(
            "SMTP_USERNAME/SMTP_PASSWORD not configured — email not sent. "
            "Set them in your .env file to enable real email delivery."
        )
        return False

    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = f"{settings.SMTP_FROM_NAME} <{settings.SMTP_FROM_EMAIL}>"
        msg["To"] = to_email

        if text_body:
            msg.attach(MIMEText(text_body, "plain"))
        msg.attach(MIMEText(html_body, "html"))

        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=10) as server:
            if settings.SMTP_USE_TLS:
                server.starttls()
            server.login(settings.SMTP_USERNAME, settings.SMTP_PASSWORD)
            server.sendmail(settings.SMTP_FROM_EMAIL, [to_email], msg.as_string())

        return True

    except Exception as exc:
        logger.error(f"Failed to send email to {to_email}: {exc}")
        return False


def send_new_password_email(to_email: str, name: str, new_password: str) -> bool:
    """Send the newly generated password after a forgot-password request."""
    subject = "Your VoxForge AI password has been reset"

    html_body = f"""
    <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto;">
        <h2 style="color: #f27d26;">VoxForge AI — Password Reset</h2>
        <p>Hi {name},</p>
        <p>We received a request to reset your password. Here is your new temporary password:</p>
        <div style="background:#111; color:#fff; padding: 14px 18px; border-radius: 8px;
                    font-family: monospace; font-size: 16px; letter-spacing: 1px; margin: 16px 0;">
            {new_password}
        </div>
        <p>Please log in with this password and change it right away from your account settings.</p>
        <p style="color:#888; font-size: 12px;">
            If you did not request this, please contact support immediately.
        </p>
    </div>
    """

    text_body = (
        f"Hi {name},\n\n"
        f"Your VoxForge AI password has been reset.\n"
        f"New temporary password: {new_password}\n\n"
        f"Please log in and change this password right away.\n"
        f"If you did not request this, contact support immediately."
    )

    return send_email(to_email, subject, html_body, text_body)