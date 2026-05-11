"""first migration

Revision ID: f3fcfe68391c
Revises:
Create Date: 2026-05-03 20:17:24.501825

"""
from __future__ import annotations
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'f3fcfe68391c'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'users',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('email', sa.String(255), nullable=False),
        sa.Column('name', sa.String(255), nullable=False),
        sa.Column('hashed_password', sa.String(), nullable=False),
        sa.Column('base_currency', sa.String(3), nullable=True),
        sa.Column('location', sa.String(255), nullable=True),
        sa.Column('risk_tolerance', sa.Enum('low', 'medium', 'high', name='risktolerance'), nullable=True),
        sa.Column('role', sa.Enum('user', 'admin', name='userrole'), server_default='user', nullable=True),
        sa.Column('email_verified', sa.Boolean(), server_default='false', nullable=False),
        sa.Column('last_login', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_users_email', 'users', ['email'], unique=True)

    op.create_table(
        'categories',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('user_id', sa.String(), nullable=False),
        sa.Column('name', sa.String(100), nullable=False),
        sa.Column('icon', sa.String(10), nullable=True),
        sa.Column('color', sa.String(7), nullable=True),
        sa.Column('type', sa.Enum('income', 'expense', 'both', name='categorytype'), nullable=True),
        sa.Column('frequency', sa.Enum('daily', 'weekly', 'monthly', 'quarterly', 'annual', name='frequencytype'), nullable=True),
        sa.Column('is_default', sa.Boolean(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('user_id', 'name', name='uq_categories_user_name'),
    )
    op.create_index('ix_categories_user_id', 'categories', ['user_id'])

    op.create_table(
        'budgets',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('user_id', sa.String(), nullable=False),
        sa.Column('category_id', sa.String(), nullable=False),
        sa.Column('amount', sa.Numeric(14, 2), nullable=False),
        sa.Column('currency', sa.String(3), nullable=False),
        sa.Column('period', sa.Enum('daily', 'weekly', 'monthly', 'quarterly', 'annual', name='budgetperiod'), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.ForeignKeyConstraint(['category_id'], ['categories.id']),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_budgets_user_id', 'budgets', ['user_id'])
    op.create_index('ix_budgets_category_id', 'budgets', ['category_id'])

    op.create_table(
        'goals',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('user_id', sa.String(), nullable=False),
        sa.Column('name', sa.String(255), nullable=False),
        sa.Column('target_amount', sa.Numeric(14, 2), nullable=False),
        sa.Column('current_amount', sa.Numeric(14, 2), nullable=True),
        sa.Column('currency', sa.String(3), nullable=False),
        sa.Column('deadline', sa.DateTime(timezone=True), nullable=True),
        sa.Column('type', sa.Enum('savings', 'debt', 'emergency', 'investment', 'custom', name='goaltype'), nullable=True),
        sa.Column('is_completed', sa.Boolean(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_goals_user_id', 'goals', ['user_id'])

    op.create_table(
        'transactions',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('user_id', sa.String(), nullable=False),
        sa.Column('type', sa.Enum('income', 'expense', name='transactiontype'), nullable=False),
        sa.Column('amount', sa.Numeric(14, 2), nullable=False),
        sa.Column('currency', sa.String(3), nullable=False),
        sa.Column('base_amount', sa.Numeric(14, 2), nullable=False),
        sa.Column('base_currency', sa.String(3), nullable=False),
        sa.Column('category_id', sa.String(), nullable=True),
        sa.Column('description', sa.String(500), nullable=True),
        sa.Column('note', sa.Text(), nullable=True),
        sa.Column('voice_input', sa.Text(), nullable=True),
        sa.Column('idempotency_key', sa.String(64), nullable=True),
        sa.Column('transaction_date', sa.DateTime(timezone=True), nullable=False),
        sa.Column('deleted_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.ForeignKeyConstraint(['category_id'], ['categories.id']),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('user_id', 'idempotency_key', name='uq_transactions_user_idempotency'),
    )
    op.create_index('ix_transactions_user_id', 'transactions', ['user_id'])
    op.create_index('ix_transactions_user_date', 'transactions', ['user_id', 'transaction_date'])
    op.create_index('ix_transactions_user_category', 'transactions', ['user_id', 'category_id'])


def downgrade() -> None:
    op.drop_index('ix_transactions_user_category', table_name='transactions')
    op.drop_index('ix_transactions_user_date', table_name='transactions')
    op.drop_index('ix_transactions_user_id', table_name='transactions')
    op.drop_table('transactions')

    op.drop_index('ix_goals_user_id', table_name='goals')
    op.drop_table('goals')

    op.drop_index('ix_budgets_category_id', table_name='budgets')
    op.drop_index('ix_budgets_user_id', table_name='budgets')
    op.drop_table('budgets')

    op.drop_index('ix_categories_user_id', table_name='categories')
    op.drop_table('categories')

    op.drop_index('ix_users_email', table_name='users')
    op.drop_table('users')

    sa.Enum(name='transactiontype').drop(op.get_bind())
    sa.Enum(name='goaltype').drop(op.get_bind())
    sa.Enum(name='budgetperiod').drop(op.get_bind())
    sa.Enum(name='frequencytype').drop(op.get_bind())
    sa.Enum(name='categorytype').drop(op.get_bind())
    sa.Enum(name='userrole').drop(op.get_bind())
    sa.Enum(name='risktolerance').drop(op.get_bind())
