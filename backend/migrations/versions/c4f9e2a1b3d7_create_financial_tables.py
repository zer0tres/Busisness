"""Create financial tables

Revision ID: c4f9e2a1b3d7
Revises: b0b804b79a75
Create Date: 2026-02-18 16:46:00.000000
"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = 'c4f9e2a1b3d7'
down_revision = 'b0b804b79a75'
branch_labels = None
depends_on = None

def upgrade():
    # Tabela de Categorias Financeiras
    op.create_table(
        'financial_categories',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('company_id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(100), nullable=False),
        sa.Column('type', sa.String(20), nullable=False),
        sa.Column('color', sa.String(7), nullable=True),
        sa.Column('icon', sa.String(50), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=True, server_default='1'),
        sa.Column('created_at', sa.DateTime(), nullable=True, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(), nullable=True, onupdate=sa.func.now()),
        sa.ForeignKeyConstraint(['company_id'], ['companies.id']),
        sa.PrimaryKeyConstraint('id')
    )

    # Tabela de Transações (Caixa/Vendas)
    op.create_table(
        'transactions',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('company_id', sa.Integer(), nullable=False),
        sa.Column('category_id', sa.Integer(), nullable=True),
        sa.Column('customer_id', sa.Integer(), nullable=True),
        sa.Column('appointment_id', sa.Integer(), nullable=True),
        sa.Column('type', sa.String(20), nullable=False),
        sa.Column('amount', sa.Numeric(10, 2), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('payment_method', sa.String(50), nullable=True),
        sa.Column('transaction_date', sa.Date(), nullable=False),
        sa.Column('status', sa.String(20), nullable=True, server_default='completed'),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(), nullable=True, onupdate=sa.func.now()),
        sa.ForeignKeyConstraint(['company_id'], ['companies.id']),
        sa.ForeignKeyConstraint(['category_id'], ['financial_categories.id']),
        sa.ForeignKeyConstraint(['customer_id'], ['customers.id']),
        sa.ForeignKeyConstraint(['appointment_id'], ['appointments.id']),
        sa.PrimaryKeyConstraint('id')
    )

    # Tabela de Contas a Pagar
    op.create_table(
        'accounts_payable',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('company_id', sa.Integer(), nullable=False),
        sa.Column('category_id', sa.Integer(), nullable=True),
        sa.Column('supplier_name', sa.String(200), nullable=False),
        sa.Column('description', sa.Text(), nullable=False),
        sa.Column('amount', sa.Numeric(10, 2), nullable=False),
        sa.Column('due_date', sa.Date(), nullable=False),
        sa.Column('payment_date', sa.Date(), nullable=True),
        sa.Column('status', sa.String(20), nullable=True, server_default='pending'),
        sa.Column('payment_method', sa.String(50), nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('recurrence', sa.String(20), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(), nullable=True, onupdate=sa.func.now()),
        sa.ForeignKeyConstraint(['company_id'], ['companies.id']),
        sa.ForeignKeyConstraint(['category_id'], ['financial_categories.id']),
        sa.PrimaryKeyConstraint('id')
    )

    # Tabela de Contas a Receber
    op.create_table(
        'accounts_receivable',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('company_id', sa.Integer(), nullable=False),
        sa.Column('customer_id', sa.Integer(), nullable=True),
        sa.Column('category_id', sa.Integer(), nullable=True),
        sa.Column('description', sa.Text(), nullable=False),
        sa.Column('amount', sa.Numeric(10, 2), nullable=False),
        sa.Column('due_date', sa.Date(), nullable=False),
        sa.Column('payment_date', sa.Date(), nullable=True),
        sa.Column('status', sa.String(20), nullable=True, server_default='pending'),
        sa.Column('payment_method', sa.String(50), nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('recurrence', sa.String(20), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(), nullable=True, onupdate=sa.func.now()),
        sa.ForeignKeyConstraint(['company_id'], ['companies.id']),
        sa.ForeignKeyConstraint(['customer_id'], ['customers.id']),
        sa.ForeignKeyConstraint(['category_id'], ['financial_categories.id']),
        sa.PrimaryKeyConstraint('id')
    )

    # Tabela de Notas Fiscais
    op.create_table(
        'invoices',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('company_id', sa.Integer(), nullable=False),
        sa.Column('customer_id', sa.Integer(), nullable=True),
        sa.Column('transaction_id', sa.Integer(), nullable=True),
        sa.Column('invoice_number', sa.String(100), nullable=False),
        sa.Column('invoice_type', sa.String(50), nullable=False),
        sa.Column('status', sa.String(50), nullable=False),
        sa.Column('issue_date', sa.Date(), nullable=False),
        sa.Column('amount', sa.Numeric(10, 2), nullable=False),
        sa.Column('tax_amount', sa.Numeric(10, 2), nullable=True),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('access_key', sa.String(100), nullable=True),
        sa.Column('file_path', sa.String(500), nullable=True),
        sa.Column('file_name', sa.String(255), nullable=True),
        sa.Column('validation_date', sa.Date(), nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(), nullable=True, onupdate=sa.func.now()),
        sa.ForeignKeyConstraint(['company_id'], ['companies.id']),
        sa.ForeignKeyConstraint(['customer_id'], ['customers.id']),
        sa.ForeignKeyConstraint(['transaction_id'], ['transactions.id']),
        sa.PrimaryKeyConstraint('id')
    )

    # Índices para performance
    op.create_index('idx_transactions_date', 'transactions', ['transaction_date'])
    op.create_index('idx_transactions_company', 'transactions', ['company_id'])
    op.create_index('idx_payable_due_date', 'accounts_payable', ['due_date'])
    op.create_index('idx_receivable_due_date', 'accounts_receivable', ['due_date'])
    op.create_index('idx_invoices_number', 'invoices', ['invoice_number'])
    op.create_index('idx_invoices_access_key', 'invoices', ['access_key'])

def downgrade():
    op.drop_index('idx_invoices_access_key')
    op.drop_index('idx_invoices_number')
    op.drop_index('idx_receivable_due_date')
    op.drop_index('idx_payable_due_date')
    op.drop_index('idx_transactions_company')
    op.drop_index('idx_transactions_date')
    op.drop_table('invoices')
    op.drop_table('accounts_receivable')
    op.drop_table('accounts_payable')
    op.drop_table('transactions')
    op.drop_table('financial_categories')