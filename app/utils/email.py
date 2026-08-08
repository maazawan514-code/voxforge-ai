"""Email sending utility (used for forgot-password notifications)."""
import logging
import requests
from ..config import get_settings

logger = logging.getLogger(__name__)


def send_email(to_email: str, subject: str, html_body: str, text_body: str = "") -> bool:
    """Send an email via Resend's HTTP API. Returns True on success, False on failure."""
    settings = get_settings()
    api_key = getattr(settings, "RESEND_API_KEY", None)
    if not api_key:
        logger.warning("RESEND_API_KEY not configured — email not sent.")
        return False
    try:
        response = requests.post(
            "https://api.resend.com/emails",
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
            },
            json={
                "from": f"{settings.SMTP_FROM_NAME} <onboarding@resend.dev>",
                "to": [to_email],
                "subject": subject,
                "html": html_body,
                "text": text_body,
            },
            timeout=10,
        )
        if response.status_code in (200, 201):
            return True
        logger.error(f"Resend API error {response.status_code}: {response.text}")
        return False
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
