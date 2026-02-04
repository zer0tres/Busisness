from datetime import datetime, date, time

class AppointmentSchema:
    """Schema para validar dados de agendamento"""
    
    @staticmethod
    def validate(data, is_update=False):
        errors = {}
        
        # Data obrigatória (apenas em criação)
        if not is_update and not data.get('appointment_date'):
            errors['appointment_date'] = 'Data do agendamento é obrigatória'
        elif data.get('appointment_date'):
            try:
                appointment_date = datetime.fromisoformat(data['appointment_date']).date()
                # Verificar se a data não é no passado
                if appointment_date < date.today():
                    errors['appointment_date'] = 'Data não pode ser no passado'
            except (ValueError, TypeError):
                errors['appointment_date'] = 'Data inválida. Use formato YYYY-MM-DD'
        
        # Hora obrigatória (apenas em criação)
        if not is_update and not data.get('appointment_time'):
            errors['appointment_time'] = 'Hora do agendamento é obrigatória'
        elif data.get('appointment_time'):
            try:
                time.fromisoformat(data['appointment_time'])
            except (ValueError, TypeError):
                errors['appointment_time'] = 'Hora inválida. Use formato HH:MM'
        
        # Cliente obrigatório (apenas em criação)
        if not is_update and not data.get('customer_id'):
            errors['customer_id'] = 'Cliente é obrigatório'
        
        # Serviço obrigatório (apenas em criação)
        if not is_update and not data.get('service_name'):
            errors['service_name'] = 'Nome do serviço é obrigatório'
        elif data.get('service_name') and len(data['service_name']) < 3:
            errors['service_name'] = 'Nome do serviço deve ter pelo menos 3 caracteres'
        
        # Validar duração se fornecida
        if data.get('duration_minutes'):
            try:
                duration = int(data['duration_minutes'])
                if duration < 15 or duration > 480:  # Entre 15 min e 8 horas
                    errors['duration_minutes'] = 'Duração deve estar entre 15 e 480 minutos'
            except (ValueError, TypeError):
                errors['duration_minutes'] = 'Duração deve ser um número'
        
        # Validar status se fornecido
        valid_statuses = ['pending', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show']
        if data.get('status') and data['status'] not in valid_statuses:
            errors['status'] = f'Status inválido. Use: {", ".join(valid_statuses)}'
        
        return errors