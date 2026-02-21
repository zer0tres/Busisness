import resend
import os

resend.api_key = os.environ.get('RESEND_API_KEY', 're_VwfJjHYr_5LVt9WtonYPGD5RbmfSHo4xG')

FROM_EMAIL = 'onboarding@resend.dev'


def send_booking_confirmation(customer_email: str, customer_name: str,
                               service_name: str, date: str, time: str,
                               company_name: str, company_phone: str = None):
    """Email de confirmação para o cliente"""
    try:
        resend.Emails.send({
            'from': f'Business Suite <{FROM_EMAIL}>',
            'to': [customer_email],
            'subject': f'Agendamento confirmado — {company_name}',
            'html': f"""
            <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:32px 24px;background:#f9fafb;border-radius:12px;">
              <div style="background:#3B82F6;border-radius:8px;padding:24px;text-align:center;margin-bottom:24px;">
                <h1 style="color:white;margin:0;font-size:22px;">{company_name}</h1>
              </div>
              <h2 style="color:#111827;margin:0 0 8px;">Olá, {customer_name}! 👋</h2>
              <p style="color:#6B7280;margin:0 0 24px;">Seu agendamento foi recebido e está aguardando confirmação.</p>
              <div style="background:white;border-radius:8px;padding:20px;border:1px solid #E5E7EB;margin-bottom:24px;">
                <table style="width:100%;border-collapse:collapse;">
                  <tr><td style="padding:8px 0;color:#6B7280;font-size:14px;">Serviço</td><td style="padding:8px 0;text-align:right;font-weight:600;color:#111827;">{service_name}</td></tr>
                  <tr style="border-top:1px solid #F3F4F6;"><td style="padding:8px 0;color:#6B7280;font-size:14px;">Data</td><td style="padding:8px 0;text-align:right;font-weight:600;color:#111827;">{date}</td></tr>
                  <tr style="border-top:1px solid #F3F4F6;"><td style="padding:8px 0;color:#6B7280;font-size:14px;">Horário</td><td style="padding:8px 0;text-align:right;font-weight:600;color:#111827;">{time}</td></tr>
                  {'<tr style="border-top:1px solid #F3F4F6;"><td style="padding:8px 0;color:#6B7280;font-size:14px;">Contato</td><td style="padding:8px 0;text-align:right;font-weight:600;color:#111827;">' + company_phone + '</td></tr>' if company_phone else ''}
                </table>
              </div>
              <div style="background:#FEF3C7;border-radius:8px;padding:16px;margin-bottom:24px;">
                <p style="margin:0;color:#92400E;font-size:14px;">⏳ Aguarde a confirmação do estabelecimento. Em caso de dúvidas, entre em contato diretamente.</p>
              </div>
              <p style="color:#9CA3AF;font-size:12px;text-align:center;margin:0;">Powered by <strong>Business Suite</strong></p>
            </div>
            """
        })
        return True
    except Exception as e:
        print(f'Erro ao enviar email para cliente: {e}')
        return False


def send_booking_notification(owner_email: str, company_name: str,
                               customer_name: str, customer_email: str,
                               customer_phone: str, service_name: str,
                               date: str, time: str):
    """Email de notificação para o dono do negócio"""
    try:
        resend.Emails.send({
            'from': f'Business Suite <{FROM_EMAIL}>',
            'to': [owner_email],
            'subject': f'Novo agendamento — {customer_name}',
            'html': f"""
            <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:32px 24px;background:#f9fafb;border-radius:12px;">
              <div style="background:#111827;border-radius:8px;padding:20px;text-align:center;margin-bottom:24px;">
                <h1 style="color:white;margin:0;font-size:18px;">📅 Novo Agendamento</h1>
                <p style="color:#9CA3AF;margin:4px 0 0;font-size:14px;">{company_name}</p>
              </div>
              <div style="background:white;border-radius:8px;padding:20px;border:1px solid #E5E7EB;">
                <table style="width:100%;border-collapse:collapse;">
                  <tr><td style="padding:8px 0;color:#6B7280;font-size:14px;">Cliente</td><td style="padding:8px 0;text-align:right;font-weight:600;color:#111827;">{customer_name}</td></tr>
                  <tr style="border-top:1px solid #F3F4F6;"><td style="padding:8px 0;color:#6B7280;font-size:14px;">Email</td><td style="padding:8px 0;text-align:right;color:#3B82F6;">{customer_email}</td></tr>
                  <tr style="border-top:1px solid #F3F4F6;"><td style="padding:8px 0;color:#6B7280;font-size:14px;">Telefone</td><td style="padding:8px 0;text-align:right;font-weight:600;color:#111827;">{customer_phone}</td></tr>
                  <tr style="border-top:1px solid #F3F4F6;"><td style="padding:8px 0;color:#6B7280;font-size:14px;">Serviço</td><td style="padding:8px 0;text-align:right;font-weight:600;color:#111827;">{service_name}</td></tr>
                  <tr style="border-top:1px solid #F3F4F6;"><td style="padding:8px 0;color:#6B7280;font-size:14px;">Data</td><td style="padding:8px 0;text-align:right;font-weight:600;color:#111827;">{date}</td></tr>
                  <tr style="border-top:1px solid #F3F4F6;"><td style="padding:8px 0;color:#6B7280;font-size:14px;">Horário</td><td style="padding:8px 0;text-align:right;font-weight:600;color:#111827;">{time}</td></tr>
                </table>
              </div>
              <p style="color:#9CA3AF;font-size:12px;text-align:center;margin:24px 0 0;">Powered by <strong>Business Suite</strong></p>
            </div>
            """
        })
        return True
    except Exception as e:
        print(f'Erro ao enviar email para lojista: {e}')
        return False