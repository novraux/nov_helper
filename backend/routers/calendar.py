from fastapi import APIRouter, HTTPException
import json
import os

router = APIRouter(prefix="/research/calendar", tags=["Research"])

DATA_PATH = os.path.join(os.path.dirname(__file__), "..", "data", "calendar.json")

@router.get("")
def get_calendar():
    """
    Fetch the list of POD-relevant seasonal events and holidays.
    """
    try:
        if not os.path.exists(DATA_PATH):
            return []
        with open(DATA_PATH, "r") as f:
            return json.load(f)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error reading calendar data: {e}")
