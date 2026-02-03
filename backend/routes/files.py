from fastapi import APIRouter, HTTPException, Depends, Query
from bson import ObjectId
from datetime import datetime
from typing import Optional, List
import time
import os
import cloudinary
import cloudinary.utils
import cloudinary.uploader
from config.database import get_db
from config.settings import settings
from middleware.auth import get_current_user, require_admin
from models.file import (
    FileUploadCreate, FileUploadResponse,
    PortfolioItemCreate, PortfolioItemResponse,
    CloudinarySignatureResponse
)

router = APIRouter(prefix="/api/files", tags=["Files"])

# Initialize Cloudinary
cloudinary.config(
    cloud_name=settings.CLOUDINARY_CLOUD_NAME,
    api_key=settings.CLOUDINARY_API_KEY,
    api_secret=settings.CLOUDINARY_API_SECRET,
    secure=True
)

ALLOWED_FOLDERS = ("uploads/", "portfolio/", "users/", "projects/")

@router.get("/signature", response_model=CloudinarySignatureResponse)
async def get_upload_signature(
    resource_type: str = Query("image", pattern="^(image|video)$"),
    folder: str = Query("uploads/"),
    current_user: dict = Depends(get_current_user)
):
    """Generate signed upload parameters for Cloudinary"""
    if not settings.CLOUDINARY_API_SECRET:
        raise HTTPException(status_code=500, detail="Cloudinary not configured")
    
    # Validate folder
    if not any(folder.startswith(f) for f in ALLOWED_FOLDERS):
        raise HTTPException(status_code=400, detail="Invalid folder path")
    
    timestamp = int(time.time())
    params = {
        "timestamp": timestamp,
        "folder": folder
    }
    
    signature = cloudinary.utils.api_sign_request(
        params,
        settings.CLOUDINARY_API_SECRET
    )
    
    return CloudinarySignatureResponse(
        signature=signature,
        timestamp=timestamp,
        cloud_name=settings.CLOUDINARY_CLOUD_NAME,
        api_key=settings.CLOUDINARY_API_KEY,
        folder=folder,
        resource_type=resource_type
    )

@router.post("", response_model=FileUploadResponse)
async def register_file_upload(
    file_data: FileUploadCreate,
    current_user: dict = Depends(get_current_user)
):
    """Register a file upload after successful Cloudinary upload"""
    db = get_db()
    
    file_doc = {
        "user_id": current_user["id"],
        "filename": file_data.filename,
        "url": file_data.url,
        "public_id": file_data.public_id,
        "mime_type": file_data.mime_type,
        "size": file_data.size,
        "order_id": file_data.order_id,
        "project_id": file_data.project_id,
        "created_at": datetime.utcnow()
    }
    
    result = await db.files.insert_one(file_doc)
    
    return FileUploadResponse(
        id=str(result.inserted_id),
        user_id=current_user["id"],
        filename=file_data.filename,
        url=file_data.url,
        public_id=file_data.public_id,
        mime_type=file_data.mime_type,
        size=file_data.size,
        order_id=file_data.order_id,
        project_id=file_data.project_id,
        created_at=file_doc["created_at"]
    )

@router.get("", response_model=List[FileUploadResponse])
async def get_files(
    project_id: Optional[str] = None,
    order_id: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    """Get files - admin gets all, client gets own"""
    db = get_db()
    
    query = {}
    if current_user["role"] != "admin":
        query["user_id"] = current_user["id"]
    if project_id:
        query["project_id"] = project_id
    if order_id:
        query["order_id"] = order_id
    
    files = await db.files.find(query).sort("created_at", -1).to_list(100)
    
    return [
        FileUploadResponse(
            id=str(f["_id"]),
            user_id=f["user_id"],
            filename=f["filename"],
            url=f["url"],
            public_id=f["public_id"],
            mime_type=f["mime_type"],
            size=f["size"],
            order_id=f.get("order_id"),
            project_id=f.get("project_id"),
            created_at=f["created_at"]
        ) for f in files
    ]

@router.delete("/{file_id}")
async def delete_file(file_id: str, current_user: dict = Depends(get_current_user)):
    """Delete a file"""
    db = get_db()
    
    file = await db.files.find_one({"_id": ObjectId(file_id)})
    if not file:
        raise HTTPException(status_code=404, detail="File not found")
    
    # Check ownership
    if file["user_id"] != current_user["id"] and current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Access denied")
    
    # Delete from Cloudinary if configured
    if settings.CLOUDINARY_API_SECRET and file.get("public_id"):
        try:
            cloudinary.uploader.destroy(file["public_id"], invalidate=True)
        except Exception as e:
            print(f"Cloudinary delete error: {e}")
    
    # Delete from DB
    await db.files.delete_one({"_id": ObjectId(file_id)})
    
    return {"message": "File deleted successfully"}

# ============ PORTFOLIO (Admin Only) ============

@router.post("/portfolio", response_model=PortfolioItemResponse)
async def add_portfolio_item(item: PortfolioItemCreate, admin: dict = Depends(require_admin)):
    """Add item to portfolio (admin only)"""
    db = get_db()
    
    item_doc = {
        "title": item.title,
        "url": item.url,
        "public_id": item.public_id,
        "mime_type": item.mime_type,
        "size": item.size,
        "order_index": item.order_index,
        "created_at": datetime.utcnow()
    }
    
    result = await db.portfolio.insert_one(item_doc)
    
    return PortfolioItemResponse(
        id=str(result.inserted_id),
        **item.model_dump(),
        created_at=item_doc["created_at"]
    )

@router.get("/portfolio", response_model=List[PortfolioItemResponse])
async def get_portfolio():
    """Get portfolio items (public)"""
    db = get_db()
    
    items = await db.portfolio.find().sort("order_index", 1).to_list(100)
    
    return [
        PortfolioItemResponse(
            id=str(item["_id"]),
            title=item.get("title"),
            url=item["url"],
            public_id=item["public_id"],
            mime_type=item["mime_type"],
            size=item["size"],
            order_index=item.get("order_index", 0),
            created_at=item["created_at"]
        ) for item in items
    ]

@router.delete("/portfolio/{item_id}")
async def delete_portfolio_item(item_id: str, admin: dict = Depends(require_admin)):
    """Delete portfolio item (admin only)"""
    db = get_db()
    
    item = await db.portfolio.find_one({"_id": ObjectId(item_id)})
    if not item:
        raise HTTPException(status_code=404, detail="Portfolio item not found")
    
    # Delete from Cloudinary
    if settings.CLOUDINARY_API_SECRET and item.get("public_id"):
        try:
            cloudinary.uploader.destroy(item["public_id"], invalidate=True)
        except Exception as e:
            print(f"Cloudinary delete error: {e}")
    
    await db.portfolio.delete_one({"_id": ObjectId(item_id)})
    
    return {"message": "Portfolio item deleted"}

@router.put("/portfolio/reorder")
async def reorder_portfolio(order: List[dict], admin: dict = Depends(require_admin)):
    """Reorder portfolio items (admin only)"""
    db = get_db()
    
    for item in order:
        await db.portfolio.update_one(
            {"_id": ObjectId(item["id"])},
            {"$set": {"order_index": item["order_index"]}}
        )
    
    return {"message": "Portfolio reordered"}
