import os
import uuid
import shutil
from fastapi import APIRouter, File, UploadFile, HTTPException, Depends
from app.core.deps import get_current_user

router = APIRouter(prefix="/uploads", tags=["System Uploads"])

# Directory context
BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../.."))
UPLOAD_PATH = os.path.join(BASE_DIR, "static_uploads")

# Ensure it exists physically immediately on import
os.makedirs(UPLOAD_PATH, exist_ok=True)

@router.post("")
async def upload_asset(
    file: UploadFile = File(...),
    current_user = Depends(get_current_user)
):
    """Secured binary conduit to save rich dynamic media assets."""
    # Verify mime types
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Only rich media images allowed")
        
    ext = os.path.splitext(file.filename)[1]
    unique_name = f"{uuid.uuid4()}{ext}"
    save_to = os.path.join(UPLOAD_PATH, unique_name)
    
    try:
        with open(save_to, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to commit file stream: {str(e)}")
    finally:
        file.file.close()
        
    # We mount /static_uploads at backend root in main.py. 
    # Assuming user runs port 8000, this returns absolute-relative path 
    return {"url": f"/static_uploads/{unique_name}"}
