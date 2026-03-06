from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
from google.auth.transport.requests import Request
import requests as http_requests
from datetime import datetime, timedelta
from app.models.company import Company
from app import db
import os

def _get_credentials(company: Company):
    """Monta credenciais OAuth a partir do refresh_token salvo na empresa."""
    if not company.google_refresh_token:
        return None
    
    creds = Credentials(
        token=None,
        refresh_token=company.google_refresh_token,
        token_uri='https://oauth2.googleapis.com/token',
        client_id=os.environ.get('GOOGLE_CLIENT_ID'),
        client_secret=os.environ.get('GOOGLE_CLIENT_SECRET'),
        scopes=['https://www.googleapis.com/auth/calendar'],
    )
    
    # Renovar token automaticamente
    try:
        creds.refresh(Request())
    except Exception as e:
        print(f"[Calendar] Erro ao renovar token: {e}")
        return None
    
    return creds


def create_calendar_event(appointment, company: Company, customer_name: str, customer_email: str = None):
    """Cria um evento no Google Calendar quando um agendamento é criado."""
    creds = _get_credentials(company)
    if not creds:
        return None

    try:
        service = build('calendar', 'v3', credentials=creds)

        # Montar data/hora de início e fim
        start_dt = datetime.combine(appointment.appointment_date, appointment.appointment_time)
        end_dt = start_dt + timedelta(minutes=appointment.duration_minutes or 60)

        event = {
            'summary': f'{appointment.service_name} - {customer_name}',
            'description': appointment.notes or '',
            'start': {
                'dateTime': start_dt.isoformat(),
                'timeZone': 'America/Sao_Paulo',
            },
            'end': {
                'dateTime': end_dt.isoformat(),
                'timeZone': 'America/Sao_Paulo',
            },
            'reminders': {
                'useDefault': False,
                'overrides': [
                    {'method': 'popup', 'minutes': 30},
                ],
            },
        }

        # Adicionar email do cliente como convidado se disponível
        if customer_email:
            event['attendees'] = [{'email': customer_email}]

        created = service.events().insert(calendarId='primary', body=event).execute()
        print(f"[Calendar] Evento criado: {created.get('id')}")
        return created.get('id')

    except Exception as e:
        print(f"[Calendar] Erro ao criar evento: {e}")
        return None


def update_calendar_event(appointment, company: Company, customer_name: str):
    """Atualiza evento no Google Calendar quando agendamento é editado."""
    if not appointment.google_event_id:
        return
    
    creds = _get_credentials(company)
    if not creds:
        return

    try:
        service = build('calendar', 'v3', credentials=creds)

        start_dt = datetime.combine(appointment.appointment_date, appointment.appointment_time)
        end_dt = start_dt + timedelta(minutes=appointment.duration_minutes or 60)

        event = {
            'summary': f'{appointment.service_name} - {customer_name}',
            'description': appointment.notes or '',
            'start': {'dateTime': start_dt.isoformat(), 'timeZone': 'America/Sao_Paulo'},
            'end': {'dateTime': end_dt.isoformat(), 'timeZone': 'America/Sao_Paulo'},
        }

        # Marcar como cancelado se status for cancelled
        if appointment.status == 'cancelled':
            event['status'] = 'cancelled'

        service.events().update(
            calendarId='primary',
            eventId=appointment.google_event_id,
            body=event
        ).execute()
        print(f"[Calendar] Evento atualizado: {appointment.google_event_id}")

    except Exception as e:
        print(f"[Calendar] Erro ao atualizar evento: {e}")


def delete_calendar_event(google_event_id: str, company: Company):
    """Remove evento do Google Calendar."""
    if not google_event_id:
        return
    
    creds = _get_credentials(company)
    if not creds:
        return

    try:
        service = build('calendar', 'v3', credentials=creds)
        service.events().delete(calendarId='primary', eventId=google_event_id).execute()
        print(f"[Calendar] Evento deletado: {google_event_id}")
    except Exception as e:
        print(f"[Calendar] Erro ao deletar evento: {e}")