from fastapi import APIRouter, Depends, HTTPException, Query
import httpx
from app.core.deps import get_current_user
from app.models.user import User

router = APIRouter(prefix="/translate", tags=["Translation"])

@router.get("")
async def translate_text(
    text: str = Query(...),
    sl: str = "en",
    tl: str = "ar",
    current_user: User = Depends(get_current_user)
):
    if not text.strip():
        return {"translated_text": ""}
    try:
        async with httpx.AsyncClient() as client:
            url = "https://translate.googleapis.com/translate_a/single"
            params = {
                "client": "gtx",
                "sl": sl,
                "tl": tl,
                "dt": "t",
                "q": text
            }
            response = await client.get(url, params=params)
            response.raise_for_status()
            data = response.json()
            translated_text = ""
            if data and isinstance(data, list) and len(data) > 0 and data[0]:
                for item in data[0]:
                    if item and isinstance(item, list) and len(item) > 0 and item[0]:
                        translated_text += item[0]
            return {"translated_text": translated_text}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Translation failed: {str(e)}")
