"""
Email service for sending notifications
"""
from fastapi_mail import FastMail, MessageSchema, ConnectionConfig
from typing import Dict, Any
import os
from pathlib import Path


# Configuration email
conf = ConnectionConfig(
    MAIL_USERNAME=os.getenv("MAIL_USERNAME", ""),
    MAIL_PASSWORD=os.getenv("MAIL_PASSWORD", ""),
    MAIL_FROM=os.getenv("MAIL_FROM", "noreply@sabc-optimization.com"),
    MAIL_PORT=int(os.getenv("MAIL_PORT", 587)),
    MAIL_SERVER=os.getenv("MAIL_SERVER", "smtp.gmail.com"),
    MAIL_STARTTLS=True,
    MAIL_SSL_TLS=False,
    USE_CREDENTIALS=True,
    VALIDATE_CERTS=True
)


async def send_new_request_notification_to_admin(user_data: Dict[str, Any]):
    """
    Envoyer notification à l'admin pour une nouvelle demande d'accès

    Args:
        user_data: Dictionnaire contenant les infos du demandeur
    """
    admin_email = os.getenv("ADMIN_EMAIL", "admin@sabc.com")
    admin_dashboard_url = os.getenv("ADMIN_DASHBOARD_URL", "http://localhost:3000")

    html = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body {{
                font-family: Arial, sans-serif;
                line-height: 1.6;
                color: #333;
            }}
            .container {{
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
                background-color: #f9f9f9;
                border-radius: 10px;
            }}
            .header {{
                background-color: #2563eb;
                color: white;
                padding: 20px;
                border-radius: 10px 10px 0 0;
                text-align: center;
            }}
            .content {{
                background-color: white;
                padding: 30px;
                border-radius: 0 0 10px 10px;
            }}
            .info-row {{
                margin: 10px 0;
                padding: 10px;
                background-color: #f3f4f6;
                border-left: 4px solid #2563eb;
            }}
            .label {{
                font-weight: bold;
                color: #1f2937;
            }}
            .button {{
                display: inline-block;
                padding: 12px 24px;
                background-color: #2563eb;
                color: white;
                text-decoration: none;
                border-radius: 5px;
                margin-top: 20px;
            }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h2>🔔 Nouvelle demande d'accès</h2>
            </div>
            <div class="content">
                <p>Une nouvelle demande d'accès à la plateforme Optimisation SABC a été soumise.</p>

                <div class="info-row">
                    <span class="label">Nom:</span> {user_data.get('full_name', 'N/A')}
                </div>

                <div class="info-row">
                    <span class="label">Email:</span> {user_data.get('email', 'N/A')}
                </div>

                <div class="info-row">
                    <span class="label">Poste:</span> {user_data.get('poste', 'N/A')}
                </div>

                <div class="info-row">
                    <span class="label">Entreprise:</span> {user_data.get('entreprise', 'N/A')}
                </div>

                <div class="info-row">
                    <span class="label">Téléphone:</span> {user_data.get('telephone', 'N/A')}
                </div>

                <div class="info-row">
                    <span class="label">Raison de la demande:</span><br>
                    {user_data.get('raison_demande', 'Non spécifiée')}
                </div>

                <a href="{admin_dashboard_url}/admin/pending-requests" class="button">
                    Voir les demandes pendantes
                </a>
            </div>
        </div>
    </body>
    </html>
    """

    message = MessageSchema(
        subject="Nouvelle demande d'accès - Optimisation SABC",
        recipients=[admin_email],
        body=html,
        subtype="html"
    )

    fm = FastMail(conf)
    await fm.send_message(message)


async def send_approval_email_with_otp(email: str, full_name: str, otp: str):
    """
    Envoyer email d'approbation avec code OTP

    Args:
        email: Email de l'utilisateur
        full_name: Nom complet de l'utilisateur
        otp: Code OTP à 6 chiffres
    """
    frontend_url = os.getenv("FRONTEND_URL", "http://localhost:3000")

    html = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body {{
                font-family: Arial, sans-serif;
                line-height: 1.6;
                color: #333;
            }}
            .container {{
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
                background-color: #f9f9f9;
                border-radius: 10px;
            }}
            .header {{
                background-color: #10b981;
                color: white;
                padding: 20px;
                border-radius: 10px 10px 0 0;
                text-align: center;
            }}
            .content {{
                background-color: white;
                padding: 30px;
                border-radius: 0 0 10px 10px;
            }}
            .otp-box {{
                background-color: #f3f4f6;
                border: 2px dashed #10b981;
                padding: 20px;
                text-align: center;
                border-radius: 10px;
                margin: 20px 0;
            }}
            .otp-code {{
                font-size: 32px;
                font-weight: bold;
                color: #10b981;
                letter-spacing: 5px;
                font-family: 'Courier New', monospace;
            }}
            .button {{
                display: inline-block;
                padding: 12px 24px;
                background-color: #10b981;
                color: white;
                text-decoration: none;
                border-radius: 5px;
                margin-top: 20px;
            }}
            .warning {{
                background-color: #fef3c7;
                border-left: 4px solid #f59e0b;
                padding: 15px;
                margin-top: 20px;
            }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h2>🎉 Votre compte a été approuvé !</h2>
            </div>
            <div class="content">
                <p>Bonjour <strong>{full_name}</strong>,</p>

                <p>Nous avons le plaisir de vous informer que votre demande d'accès à la plateforme <strong>Optimisation SABC</strong> a été approuvée.</p>

                <div class="otp-box">
                    <p style="margin: 0; font-size: 14px; color: #6b7280;">Votre code d'activation</p>
                    <div class="otp-code">{otp}</div>
                </div>

                <p>Pour activer votre compte, veuillez :</p>
                <ol>
                    <li>Cliquer sur le bouton ci-dessous</li>
                    <li>Entrer votre adresse email</li>
                    <li>Saisir le code OTP ci-dessus</li>
                    <li>Définir votre mot de passe</li>
                </ol>

                <a href="{frontend_url}/activate" class="button">
                    Activer mon compte
                </a>

                <div class="warning">
                    <strong>⚠️ Important:</strong> Ce code est valide pendant <strong>24 heures</strong>.
                </div>

                <p style="margin-top: 30px; color: #6b7280; font-size: 12px;">
                    Si vous n'avez pas fait cette demande, veuillez ignorer cet email.
                </p>
            </div>
        </div>
    </body>
    </html>
    """

    message = MessageSchema(
        subject="✅ Votre compte a été approuvé - Code OTP",
        recipients=[email],
        body=html,
        subtype="html"
    )

    fm = FastMail(conf)
    await fm.send_message(message)


async def send_rejection_email(email: str, full_name: str, reason: str):
    """
    Envoyer email de rejet de demande

    Args:
        email: Email de l'utilisateur
        full_name: Nom complet de l'utilisateur
        reason: Raison du rejet
    """
    admin_email = os.getenv("ADMIN_EMAIL", "admin@sabc.com")

    html = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body {{
                font-family: Arial, sans-serif;
                line-height: 1.6;
                color: #333;
            }}
            .container {{
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
                background-color: #f9f9f9;
                border-radius: 10px;
            }}
            .header {{
                background-color: #ef4444;
                color: white;
                padding: 20px;
                border-radius: 10px 10px 0 0;
                text-align: center;
            }}
            .content {{
                background-color: white;
                padding: 30px;
                border-radius: 0 0 10px 10px;
            }}
            .reason-box {{
                background-color: #fee2e2;
                border-left: 4px solid #ef4444;
                padding: 15px;
                margin: 20px 0;
            }}
            .contact-box {{
                background-color: #f3f4f6;
                padding: 15px;
                border-radius: 5px;
                margin-top: 20px;
            }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h2>Demande d'accès refusée</h2>
            </div>
            <div class="content">
                <p>Bonjour <strong>{full_name}</strong>,</p>

                <p>Nous regrettons de vous informer que votre demande d'accès à la plateforme Optimisation SABC a été refusée.</p>

                <div class="reason-box">
                    <strong>Raison:</strong><br>
                    {reason}
                </div>

                <div class="contact-box">
                    <p style="margin: 0;"><strong>Besoin d'aide ?</strong></p>
                    <p style="margin: 5px 0 0 0;">Pour plus d'informations ou si vous pensez qu'il s'agit d'une erreur, veuillez contacter:</p>
                    <p style="margin: 5px 0 0 0;"><a href="mailto:{admin_email}">{admin_email}</a></p>
                </div>
            </div>
        </div>
    </body>
    </html>
    """

    message = MessageSchema(
        subject="Demande d'accès refusée - Optimisation SABC",
        recipients=[email],
        body=html,
        subtype="html"
    )

    fm = FastMail(conf)
    await fm.send_message(message)


async def send_welcome_email(email: str, full_name: str):
    """
    Envoyer email de bienvenue après activation

    Args:
        email: Email de l'utilisateur
        full_name: Nom complet de l'utilisateur
    """
    frontend_url = os.getenv("FRONTEND_URL", "http://localhost:3000")

    html = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body {{
                font-family: Arial, sans-serif;
                line-height: 1.6;
                color: #333;
            }}
            .container {{
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
                background-color: #f9f9f9;
                border-radius: 10px;
            }}
            .header {{
                background-color: #2563eb;
                color: white;
                padding: 20px;
                border-radius: 10px 10px 0 0;
                text-align: center;
            }}
            .content {{
                background-color: white;
                padding: 30px;
                border-radius: 0 0 10px 10px;
            }}
            .button {{
                display: inline-block;
                padding: 12px 24px;
                background-color: #2563eb;
                color: white;
                text-decoration: none;
                border-radius: 5px;
                margin-top: 20px;
            }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h2>🎉 Bienvenue sur Optimisation SABC !</h2>
            </div>
            <div class="content">
                <p>Bonjour <strong>{full_name}</strong>,</p>

                <p>Votre compte a été activé avec succès ! Vous pouvez maintenant accéder à la plateforme.</p>

                <p><strong>Que pouvez-vous faire ?</strong></p>
                <ul>
                    <li>📊 Consulter l'état des lieux et profil énergétique</li>
                    <li>💰 Reconstituer vos factures</li>
                    <li>🎯 Simuler différents tarifs</li>
                    <li>📄 Accéder à la documentation</li>
                </ul>

                <a href="{frontend_url}/login" class="button">
                    Se connecter
                </a>
            </div>
        </div>
    </body>
    </html>
    """

    message = MessageSchema(
        subject="🎉 Bienvenue sur Optimisation SABC",
        recipients=[email],
        body=html,
        subtype="html"
    )

    fm = FastMail(conf)
    await fm.send_message(message)
