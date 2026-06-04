from pydantic import BaseModel
from typing import Dict, Any

class SystemSettingsBase(BaseModel):
    key: str
    value: Dict[str, Any]

class SystemSettingsUpdate(BaseModel):
    value: Dict[str, Any]

class SystemSettingsOut(SystemSettingsBase):
    pass

class GlobalSettingsUpdate(BaseModel):
    settings: Dict[str, Any] # Key is the setting identifier, value is the dict value.
