import resend
import os

resend.api_key = os.environ.get('RESEND_API_KEY', 're_VwfJjHYr_5LVt9WtonYPGD5RbmfSHo4xG')

FROM_EMAIL = os.environ.get('FROM_EMAIL', 'noreply@sahjo.com.br')


def _appointment_card(service, date, time, extra_rows=''):
    return f"""
    <div style="background:white;border-radius:8px;padding:20px;border:1px solid #E5E7EB;margin-bottom:24px;">
      <table style="width:100%;border-collapse:collapse;">
        <tr><td style="padding:8px 0;color:#6B7280;font-size:14px;">Serviço</td><td style="padding:8px 0;text-align:right;font-weight:600;color:#111827;">{service}</td></tr>
        <tr style="border-top:1px solid #F3F4F6;"><td style="padding:8px 0;color:#6B7280;font-size:14px;">Data</td><td style="padding:8px 0;text-align:right;font-weight:600;color:#111827;">{date}</td></tr>
        <tr style="border-top:1px solid #F3F4F6;"><td style="padding:8px 0;color:#6B7280;font-size:14px;">Horário</td><td style="padding:8px 0;text-align:right;font-weight:600;color:#111827;">{time}</td></tr>
        {extra_rows}
      </table>
    </div>
    """


def _base_html(header_color, header_text, header_sub, body, footer_note=''):
    return f"""
    <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:32px 24px;background:#f9fafb;border-radius:12px;">
      <div style="background:{header_color};border-radius:8px;padding:24px;text-align:center;margin-bottom:24px;">
        <h1 style="color:white;margin:0;font-size:20px;">{header_text}</h1>
        {'<p style="color:rgba(255,255,255,0.8);margin:4px 0 0;font-size:14px;">'+header_sub+'</p>' if header_sub else ''}
      </div>
      {body}
      {('<p style="color:#92400E;font-size:13px;background:#FEF3C7;border-radius:8px;padding:14px;margin-bottom:16px;">'+footer_note+'</p>') if footer_note else ''}
      <p style="color:#9CA3AF;font-size:11px;text-align:center;margin:16px 0 0;">Enviado por <strong>Sahjo</strong> · sahjo.com.br</p>
    </div>
    """


def send_booking_confirmation(customer_email, customer_name, service_name,
                               date, time, company_name, company_phone=None):
    """Confirmação de agendamento para o cliente"""
    try:
        extra = f'<tr style="border-top:1px solid #F3F4F6;"><td style="padding:8px 0;color:#6B7280;font-size:14px;">Contato</td><td style="padding:8px 0;text-align:right;font-weight:600;color:#111827;">{company_phone}</td></tr>' if company_phone else ''
        body = f'<h2 style="color:#111827;margin:0 0 8px;">Olá, {customer_name}! 👋</h2><p style="color:#6B7280;margin:0 0 20px;">Seu agendamento foi recebido com sucesso.</p>' + _appointment_card(service_name, date, time, extra)
        html = _base_html('#3B82F6', f'📅 {company_name}', '', body, '⏳ Aguarde a confirmação do estabelecimento. Em caso de dúvidas, entre em contato diretamente.')
        resend.Emails.send({
            'from': f'Sahjo <{FROM_EMAIL}>',
            'to': [customer_email],
            'subject': f'Agendamento confirmado — {company_name}',
            'html': html
        })
        return True
    except Exception as e:
        print(f'[Email] Erro confirmação cliente: {e}')
        return False


def send_booking_notification(owner_email, company_name, customer_name,
                               customer_email, customer_phone, service_name,
                               date, time):
    """Notificação de novo agendamento para o lojista"""
    try:
        extra = f'''
        <tr style="border-top:1px solid #F3F4F6;"><td style="padding:8px 0;color:#6B7280;font-size:14px;">Cliente</td><td style="padding:8px 0;text-align:right;font-weight:600;color:#111827;">{customer_name}</td></tr>
        <tr style="border-top:1px solid #F3F4F6;"><td style="padding:8px 0;color:#6B7280;font-size:14px;">Email</td><td style="padding:8px 0;text-align:right;color:#3B82F6;">{customer_email}</td></tr>
        <tr style="border-top:1px solid #F3F4F6;"><td style="padding:8px 0;color:#6B7280;font-size:14px;">Telefone</td><td style="padding:8px 0;text-align:right;font-weight:600;color:#111827;">{customer_phone}</td></tr>
        '''
        card = _appointment_card(service_name, date, time, extra)
        body = f'<p style="color:#6B7280;margin:0 0 20px;">Um novo agendamento foi criado.</p>' + card
        html = _base_html('#111827', '📅 Novo Agendamento', company_name, body)
        resend.Emails.send({
            'from': f'Sahjo <{FROM_EMAIL}>',
            'to': [owner_email],
            'subject': f'Novo agendamento — {customer_name}',
            'html': html
        })
        return True
    except Exception as e:
        print(f'[Email] Erro notificação lojista: {e}')
        return False


def send_reminder(recipient_email, recipient_name, service_name,
                  date, time, company_name, is_owner=False, customer_name=None):
    """Lembrete D-1 para cliente ou lojista"""
    try:
        if is_owner:
            extra = f'<tr style="border-top:1px solid #F3F4F6;"><td style="padding:8px 0;color:#6B7280;font-size:14px;">Cliente</td><td style="padding:8px 0;text-align:right;font-weight:600;color:#111827;">{customer_name}</td></tr>'
            body = f'<p style="color:#6B7280;margin:0 0 20px;">Lembrete: você tem um atendimento <strong>amanhã</strong>.</p>' + _appointment_card(service_name, date, time, extra)
            subject = f'Lembrete de amanhã — {customer_name}'
        else:
            body = f'<h2 style="color:#111827;margin:0 0 8px;">Olá, {recipient_name}! 👋</h2><p style="color:#6B7280;margin:0 0 20px;">Lembrete: você tem um agendamento <strong>amanhã</strong>.</p>' + _appointment_card(service_name, date, time)
            subject = f'Lembrete de amanhã — {company_name}'
        html = _base_html('#8B5CF6', '🔔 Lembrete de Agendamento', company_name, body)
        resend.Emails.send({
            'from': f'Sahjo <{FROM_EMAIL}>',
            'to': [recipient_email],
            'subject': subject,
            'html': html
        })
        return True
    except Exception as e:
        print(f'[Email] Erro lembrete: {e}')
        return False
