from fastapi import APIRouter, HTTPException, Depends, Query
from bson import ObjectId
from datetime import datetime
from typing import Optional, List
from config.database import get_db
from middleware.auth import get_current_user, require_admin
from models.client_project import (
    ClientProjectCreate, ClientProjectUpdate, ClientProjectResponse,
    ProjectFileCreate, ProjectFileResponse, NextStepItem, ClientOverview
)
import uuid

router = APIRouter(prefix="/api/client-projects", tags=["Client Projects"])

# CCC Admin email - only this email can access admin features
CCC_ADMIN_EMAIL = "crownccreative@gmail.com"

def require_ccc_admin(current_user: dict = Depends(get_current_user)):
    """Require the specific CCC admin email"""
    if current_user["email"].lower() != CCC_ADMIN_EMAIL.lower():
        raise HTTPException(status_code=403, detail="Access denied. CCC Admin only.")
    return current_user

# ============ ADMIN ENDPOINTS ============

@router.get("/admin/clients", response_model=List[ClientOverview])
async def get_all_clients(admin: dict = Depends(require_ccc_admin)):
    """Get all clients with their project status (CCC Admin only)"""
    db = get_db()
    
    # Get all client users
    users = await db.users.find({"role": "client"}).sort("created_at", -1).to_list(100)
    
    result = []
    for user in users:
        user_id = str(user["_id"])
        # Check if user has a project
        project = await db.client_projects.find_one({"user_id": user_id})
        
        result.append(ClientOverview(
            id=user_id,
            name=user["name"],
            email=user["email"],
            phone=user.get("phone"),
            status_text=project["status_text"] if project else None,
            progress_percentage=project["progress_percentage"] if project else None,
            has_project=project is not None,
            created_at=user["created_at"]
        ))
    
    return result

@router.get("/admin/client/{user_id}", response_model=ClientProjectResponse)
async def get_client_project_admin(user_id: str, admin: dict = Depends(require_ccc_admin)):
    """Get a specific client's project (CCC Admin only)"""
    db = get_db()
    
    # Verify user exists
    user = await db.users.find_one({"_id": ObjectId(user_id)})
    if not user:
        raise HTTPException(status_code=404, detail="Client not found")
    
    # Get or create project
    project = await db.client_projects.find_one({"user_id": user_id})
    
    if not project:
        # Create default project for this user
        project_doc = {
            "user_id": user_id,
            "status_text": "Not Started",
            "progress_percentage": 0,
            "next_steps": [],
            "notes": "",
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
        result = await db.client_projects.insert_one(project_doc)
        project = await db.client_projects.find_one({"_id": result.inserted_id})
    
    return ClientProjectResponse(
        id=str(project["_id"]),
        user_id=project["user_id"],
        user_name=user["name"],
        user_email=user["email"],
        status_text=project["status_text"],
        progress_percentage=project["progress_percentage"],
        next_steps=[NextStepItem(**step) for step in project.get("next_steps", [])],
        notes=project.get("notes"),
        created_at=project["created_at"],
        updated_at=project["updated_at"]
    )

@router.put("/admin/client/{user_id}", response_model=ClientProjectResponse)
async def update_client_project(user_id: str, update: ClientProjectUpdate, admin: dict = Depends(require_ccc_admin)):
    """Update a client's project status (CCC Admin only)"""
    db = get_db()
    
    # Verify user exists
    user = await db.users.find_one({"_id": ObjectId(user_id)})
    if not user:
        raise HTTPException(status_code=404, detail="Client not found")
    
    # Get or create project
    project = await db.client_projects.find_one({"user_id": user_id})
    
    if not project:
        # Create project first
        project_doc = {
            "user_id": user_id,
            "status_text": update.status_text or "Not Started",
            "progress_percentage": update.progress_percentage or 0,
            "next_steps": [step.model_dump() for step in (update.next_steps or [])],
            "notes": update.notes or "",
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
        result = await db.client_projects.insert_one(project_doc)
        project = await db.client_projects.find_one({"_id": result.inserted_id})
    else:
        # Update existing project
        update_data = {"updated_at": datetime.utcnow()}
        if update.status_text is not None:
            update_data["status_text"] = update.status_text
        if update.progress_percentage is not None:
            update_data["progress_percentage"] = update.progress_percentage
        if update.next_steps is not None:
            update_data["next_steps"] = [step.model_dump() for step in update.next_steps]
        if update.notes is not None:
            update_data["notes"] = update.notes
        
        await db.client_projects.update_one(
            {"_id": project["_id"]},
            {"$set": update_data}
        )
        project = await db.client_projects.find_one({"_id": project["_id"]})
    
    return ClientProjectResponse(
        id=str(project["_id"]),
        user_id=project["user_id"],
        user_name=user["name"],
        user_email=user["email"],
        status_text=project["status_text"],
        progress_percentage=project["progress_percentage"],
        next_steps=[NextStepItem(**step) for step in project.get("next_steps", [])],
        notes=project.get("notes"),
        created_at=project["created_at"],
        updated_at=project["updated_at"]
    )

@router.post("/admin/client/{user_id}/next-step")
async def add_next_step(user_id: str, text: str = Query(...), admin: dict = Depends(require_ccc_admin)):
    """Add a next step item for a client (CCC Admin only)"""
    db = get_db()
    
    project = await db.client_projects.find_one({"user_id": user_id})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    new_step = {
        "id": str(uuid.uuid4()),
        "text": text,
        "completed": False
    }
    
    await db.client_projects.update_one(
        {"_id": project["_id"]},
        {
            "$push": {"next_steps": new_step},
            "$set": {"updated_at": datetime.utcnow()}
        }
    )
    
    return {"message": "Next step added", "step": new_step}

@router.delete("/admin/client/{user_id}/next-step/{step_id}")
async def remove_next_step(user_id: str, step_id: str, admin: dict = Depends(require_ccc_admin)):
    """Remove a next step item (CCC Admin only)"""
    db = get_db()
    
    await db.client_projects.update_one(
        {"user_id": user_id},
        {
            "$pull": {"next_steps": {"id": step_id}},
            "$set": {"updated_at": datetime.utcnow()}
        }
    )
    
    return {"message": "Next step removed"}

# ============ CLIENT ENDPOINTS ============

@router.get("/my-project", response_model=ClientProjectResponse)
async def get_my_project(current_user: dict = Depends(get_current_user)):
    """Get the current user's project status"""
    db = get_db()
    
    project = await db.client_projects.find_one({"user_id": current_user["id"]})
    
    if not project:
        # Return default empty project
        return ClientProjectResponse(
            id="",
            user_id=current_user["id"],
            user_name=current_user["name"],
            user_email=current_user["email"],
            status_text="Welcome! Your project will be set up soon.",
            progress_percentage=0,
            next_steps=[],
            notes=None,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
    
    return ClientProjectResponse(
        id=str(project["_id"]),
        user_id=project["user_id"],
        user_name=current_user["name"],
        user_email=current_user["email"],
        status_text=project["status_text"],
        progress_percentage=project["progress_percentage"],
        next_steps=[NextStepItem(**step) for step in project.get("next_steps", [])],
        notes=project.get("notes"),
        created_at=project["created_at"],
        updated_at=project["updated_at"]
    )

@router.patch("/my-project/next-step/{step_id}")
async def toggle_next_step(step_id: str, completed: bool, current_user: dict = Depends(get_current_user)):
    """Toggle completion status of a next step (client can mark as done)"""
    db = get_db()
    
    # Update the specific step's completed status
    result = await db.client_projects.update_one(
        {"user_id": current_user["id"], "next_steps.id": step_id},
        {
            "$set": {
                "next_steps.$.completed": completed,
                "updated_at": datetime.utcnow()
            }
        }
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Step not found")
    
    return {"message": "Step updated"}

# ============ FILE ENDPOINTS (Two-way) ============

@router.post("/files/{user_id}", response_model=ProjectFileResponse)
async def upload_project_file(
    user_id: str,
    file_data: ProjectFileCreate,
    current_user: dict = Depends(get_current_user)
):
    """Upload a file to a project (admin can upload to any, client to their own)"""
    db = get_db()
    
    # Check permissions
    is_admin = current_user["email"].lower() == CCC_ADMIN_EMAIL.lower()
    is_owner = current_user["id"] == user_id
    
    if not is_admin and not is_owner:
        raise HTTPException(status_code=403, detail="Access denied")
    
    # Verify project exists
    project = await db.client_projects.find_one({"user_id": user_id})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # Create file record
    file_doc = {
        "project_id": str(project["_id"]),
        "user_id": user_id,
        "filename": file_data.filename,
        "url": file_data.url,
        "public_id": file_data.public_id,
        "mime_type": file_data.mime_type,
        "size": file_data.size,
        "uploaded_by": "admin" if is_admin else "client",
        "uploader_id": current_user["id"],
        "description": file_data.description,
        "created_at": datetime.utcnow()
    }
    
    result = await db.project_files.insert_one(file_doc)
    
    return ProjectFileResponse(
        id=str(result.inserted_id),
        project_id=file_doc["project_id"],
        user_id=user_id,
        filename=file_data.filename,
        url=file_data.url,
        public_id=file_data.public_id,
        mime_type=file_data.mime_type,
        size=file_data.size,
        uploaded_by=file_doc["uploaded_by"],
        uploader_name=current_user["name"],
        description=file_data.description,
        created_at=file_doc["created_at"]
    )

@router.get("/files/{user_id}", response_model=List[ProjectFileResponse])
async def get_project_files(user_id: str, current_user: dict = Depends(get_current_user)):
    """Get all files for a project"""
    db = get_db()
    
    # Check permissions
    is_admin = current_user["email"].lower() == CCC_ADMIN_EMAIL.lower()
    is_owner = current_user["id"] == user_id
    
    if not is_admin and not is_owner:
        raise HTTPException(status_code=403, detail="Access denied")
    
    files = await db.project_files.find({"user_id": user_id}).sort("created_at", -1).to_list(100)
    
    result = []
    for f in files:
        # Get uploader name
        uploader = await db.users.find_one({"_id": ObjectId(f["uploader_id"])})
        result.append(ProjectFileResponse(
            id=str(f["_id"]),
            project_id=f["project_id"],
            user_id=f["user_id"],
            filename=f["filename"],
            url=f["url"],
            public_id=f["public_id"],
            mime_type=f["mime_type"],
            size=f["size"],
            uploaded_by=f["uploaded_by"],
            uploader_name=uploader["name"] if uploader else "Unknown",
            description=f.get("description"),
            created_at=f["created_at"]
        ))
    
    return result

@router.delete("/files/{file_id}")
async def delete_project_file(file_id: str, current_user: dict = Depends(get_current_user)):
    """Delete a project file (admin can delete any, client can delete their own uploads)"""
    db = get_db()
    
    file = await db.project_files.find_one({"_id": ObjectId(file_id)})
    if not file:
        raise HTTPException(status_code=404, detail="File not found")
    
    is_admin = current_user["email"].lower() == CCC_ADMIN_EMAIL.lower()
    is_uploader = file["uploader_id"] == current_user["id"]
    
    if not is_admin and not is_uploader:
        raise HTTPException(status_code=403, detail="Access denied")
    
    await db.project_files.delete_one({"_id": ObjectId(file_id)})
    
    return {"message": "File deleted"}

# ============ AUTH CHECK ============

@router.get("/check-admin")
async def check_ccc_admin(current_user: dict = Depends(get_current_user)):
    """Check if current user is the CCC admin"""
    is_admin = current_user["email"].lower() == CCC_ADMIN_EMAIL.lower()
    return {"is_ccc_admin": is_admin, "email": current_user["email"]}
