from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Dict, Any

from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.system import SystemSettings
from app.schemas.system import GlobalSettingsUpdate
from app.core.redis import redis_service

router = APIRouter()

@router.get("")
async def get_all_settings(
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Get all system settings grouped by key."""
    result = await db.execute(select(SystemSettings))
    settings = result.scalars().all()
    
    # Format into a clean dict for frontend
    settings_dict = {s.key: s.value for s in settings}
    return settings_dict

@router.patch("")
async def update_settings(
    update_data: Dict[str, Any],
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Update multiple settings keys at once. Accepts object like {'seo': {...}, 'geo': {...}}"""
    for key, value in update_data.items():
        # Check if exists
        stmt = select(SystemSettings).where(SystemSettings.key == key)
        result = await db.execute(stmt)
        setting = result.scalar_one_or_none()
        
        if setting:
            # Merge or replace value? Let's replace for clean setting management.
            setting.value = value
        else:
            # Create new
            setting = SystemSettings(key=key, value=value)
            db.add(setting)
            
    await db.commit()
    
    try:
        await redis_service.redis.delete("storefront:homepage")
    except Exception:
        pass
    
    # Return fresh state
    result = await db.execute(select(SystemSettings))
    settings = result.scalars().all()
    return {s.key: s.value for s in settings}
