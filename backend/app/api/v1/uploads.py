import os
import uuid
import io
from fastapi import APIRouter, File, UploadFile, HTTPException, Depends
from app.core.deps import get_current_user
from PIL import Image

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
    """Secured binary conduit to save rich dynamic media assets with auto-compression."""
    # Verify mime types
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Only rich media images allowed")
        
    ext = os.path.splitext(file.filename)[1].lower()
    if not ext:
        ext = ".jpg"
    unique_name = f"{uuid.uuid4()}{ext}"
    save_to = os.path.join(UPLOAD_PATH, unique_name)
    
    try:
        file_content = await file.read()
        img = Image.open(io.BytesIO(file_content))
        
        # Max resolution for Ultra-HD / 4K banners & Retina displays (2560px max width/height)
        max_size = 2560
        if img.width > max_size or img.height > max_size:
            img.thumbnail((max_size, max_size), Image.Resampling.LANCZOS)
            
        if ext in ('.jpg', '.jpeg'):
            if img.mode in ('RGBA', 'P'):
                img = img.convert('RGB')
            img.save(save_to, 'JPEG', quality=95, optimize=True)
        elif ext == '.png':
            img.save(save_to, 'PNG', optimize=True)
        elif ext == '.webp':
            img.save(save_to, 'WEBP', quality=95)
        else:
            with open(save_to, "wb") as f:
                f.write(file_content)
    except Exception as e:
        try:
            with open(save_to, "wb") as f:
                f.write(file_content)
        except Exception:
            raise HTTPException(status_code=500, detail=f"Failed to process and save file stream: {str(e)}")
    finally:
        file.file.close()
        
    return {"url": f"/static_uploads/{unique_name}"}
