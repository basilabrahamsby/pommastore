"""add_gallery_images_to_products

Revision ID: b8c4c794a081
Revises: aba13e5cfc27
Create Date: 2026-06-23 13:30:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = 'b8c4c794a081'
down_revision: Union[str, None] = 'aba13e5cfc27'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    columns = [col['name'] for col in inspector.get_columns('products')]
    
    if 'gallery_images' not in columns:
        op.add_column('products', sa.Column('gallery_images', postgresql.JSONB(astext_type=sa.Text()), server_default=sa.text("'[]'::jsonb"), nullable=False))


def downgrade() -> None:
    op.drop_column('products', 'gallery_images')
