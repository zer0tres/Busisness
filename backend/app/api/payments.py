from flask import jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.api import api_bp
from app.models.user import User
from app.models.company import Company
from app.models.subscription import Subscription
from app import db
import mercadopago
import os
from datetime import datetime, timedelta

MP_ACCESS_TOKEN = os.environ.get('MP_ACCESS_TOKEN', 'APP_USR-7357147419427238-022207-f35f6ba349e3b228418c4709936d3fc9-434116104')

PLANS = {
    'premium': {
        'name': 'Premium',
        'price': 49.90,
        'description': 'Acesso completo a todas as funcionalidades',
        'features': [
            'Clientes ilimitados',
            'Agendamentos ilimitados',
            'Controle financeiro',
            'Estoque e produtos',
            'Pagina publica de agendamento',
            'Notificacoes por email',
            'Suporte prioritario',
        ],
    },
}

def get_user_company():
    user_id = get_jwt_identity()
    user = User.query.get(int(user_id))
    if not user or not user.company_id:
        return None, None
    company = Company.query.get(user.company_id)
    return user, company


@api_bp.route('/payments/plans', methods=['GET'])
def list_plans():
    """Listar planos disponíveis"""
    return jsonify({'plans': PLANS}), 200


@api_bp.route('/payments/subscription', methods=['GET'])
@jwt_required()
def get_subscription():
    """Retorna a assinatura atual da empresa"""
    _, company = get_user_company()
    if not company:
        return jsonify({'error': 'Empresa não encontrada'}), 404

    sub = Subscription.query.filter_by(company_id=company.id).first()
    if not sub:
        return jsonify({'subscription': None, 'plan': 'trial'}), 200

    return jsonify({'subscription': sub.to_dict()}), 200


@api_bp.route('/payments/create-checkout', methods=['POST'])
@jwt_required()
def create_checkout():
    """Cria um link de pagamento no Mercado Pago"""
    user, company = get_user_company()
    if not company:
        return jsonify({'error': 'Empresa não encontrada'}), 404

    data = request.get_json()
    plan_key = data.get('plan')

    if plan_key not in PLANS:
        return jsonify({'error': 'Plano inválido'}), 400

    plan = PLANS[plan_key]

    sdk = mercadopago.SDK(MP_ACCESS_TOKEN)

    preference_data = {
        'items': [{
            'title': f'Business Suite — Plano {plan["name"]}',
            'description': plan['description'],
            'quantity': 1,
            'currency_id': 'BRL',
            'unit_price': plan['price'],
        }],
        'payer': {
            'email': user.email,
            'name': user.name,
        },
        'back_urls': {
            'success': 'https://www.sahjo.com.br/dashboard?payment=success',
            'failure': 'https://www.sahjo.com.br/dashboard?payment=failure',
            'pending': 'https://www.sahjo.com.br/dashboard?payment=pending',
        },
        'auto_return': 'approved',
        'external_reference': f'{company.id}:{plan_key}',
        'notification_url': 'https://www.sahjo.com.br/api/payments/webhook',
        'statement_descriptor': 'BUSINESS SUITE',
    }

    result = sdk.preference().create(preference_data)

    if result['status'] == 201:
        preference = result['response']
        return jsonify({
            'checkout_url': preference['init_point'],
            'sandbox_url': preference['sandbox_init_point'],
            'preference_id': preference['id'],
        }), 200
    else:
        return jsonify({'error': 'Erro ao criar checkout', 'details': result}), 500


@api_bp.route('/payments/webhook', methods=['POST'])
def mp_webhook():
    """Webhook do Mercado Pago para confirmar pagamentos"""
    data = request.get_json(silent=True) or {}
    topic = data.get('type') or request.args.get('topic')
    resource_id = data.get('data', {}).get('id') or request.args.get('id')

    if topic == 'payment' and resource_id:
        try:
            sdk = mercadopago.SDK(MP_ACCESS_TOKEN)
            payment = sdk.payment().get(resource_id)

            if payment['status'] == 200:
                payment_data = payment['response']
                status = payment_data.get('status')
                external_ref = payment_data.get('external_reference', '')

                if ':' in external_ref and status == 'approved':
                    company_id, plan_key = external_ref.split(':', 1)
                    company_id = int(company_id)

                    sub = Subscription.query.filter_by(company_id=company_id).first()
                    if not sub:
                        sub = Subscription(company_id=company_id)
                        db.session.add(sub)

                    sub.plan = plan_key
                    sub.status = 'active'
                    sub.mp_payer_id = str(payment_data.get('payer', {}).get('id', ''))
                    sub.current_period_start = datetime.utcnow()
                    sub.current_period_end = datetime.utcnow() + timedelta(days=30)

                    # Atualizar subscription_status na Company
                    company = Company.query.get(company_id)
                    if company:
                        company.subscription_status = 'active'

                    db.session.commit()

        except Exception as e:
            print(f'Erro no webhook MP: {e}')

    return jsonify({'status': 'ok'}), 200


@api_bp.route('/payments/cancel', methods=['POST'])
@jwt_required()
def cancel_subscription():
    """Cancelar assinatura"""
    _, company = get_user_company()
    if not company:
        return jsonify({'error': 'Empresa não encontrada'}), 404

    sub = Subscription.query.filter_by(company_id=company.id).first()
    if not sub:
        return jsonify({'error': 'Assinatura não encontrada'}), 404

    sub.status = 'cancelled'
    sub.cancelled_at = datetime.utcnow()
    company.subscription_status = 'cancelled'
    db.session.commit()

    return jsonify({'message': 'Assinatura cancelada'}), 200