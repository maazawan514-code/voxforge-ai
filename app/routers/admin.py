from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from ..database import get_db
from ..models.user import User
from ..models.voice import Voice, Job, AudioGeneration
from ..schemas.admin import (
    VoiceCreateRequest,
    VoiceUpdateRequest,
    UserManagementResponse,
    JobStatusResponse,
)
from ..utils.security import get_current_admin_user

router = APIRouter()


# Voice Management

@router.post("/voices", response_model=dict, status_code=status.HTTP_201_CREATED)
async def create_voice(
    request: VoiceCreateRequest,
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db),
):
    """Create a new voice (admin only)"""
    
    # Check if voice with same name exists
    existing = db.query(Voice).filter(Voice.name == request.name).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Voice with this name already exists"
        )
    
    voice = Voice(
        name=request.name,
        model_name=request.model_name,
        voice_type=request.voice_type,
        preview_url=request.preview_url,
        is_active=True,
    )
    
    db.add(voice)
    db.commit()
    db.refresh(voice)
    
    return {
        "message": "Voice created successfully",
        "voice_id": voice.id,
        "name": voice.name,
    }


@router.put("/voices/{voice_id}", response_model=dict)
async def update_voice(
    voice_id: int,
    request: VoiceUpdateRequest,
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db),
):
    """Update a voice (admin only)"""
    
    voice = db.query(Voice).filter(Voice.id == voice_id).first()
    if not voice:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Voice not found"
        )
    
    # Update fields
    if request.name is not None:
        voice.name = request.name
    if request.voice_type is not None:
        voice.voice_type = request.voice_type
    if request.preview_url is not None:
        voice.preview_url = request.preview_url
    if request.is_active is not None:
        voice.is_active = request.is_active
    
    db.commit()
    db.refresh(voice)
    
    return {
        "message": "Voice updated successfully",
        "voice_id": voice.id,
    }


@router.delete("/voices/{voice_id}")
async def delete_voice(
    voice_id: int,
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db),
):
    """Delete a voice (admin only)"""
    
    voice = db.query(Voice).filter(Voice.id == voice_id).first()
    if not voice:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Voice not found"
        )
    
    db.delete(voice)
    db.commit()
    
    return {"message": "Voice deleted successfully"}


# User Management

@router.get("/users", response_model=list[UserManagementResponse])
async def list_users(
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db),
    limit: int = 100,
    offset: int = 0,
):
    """Get list of all users (admin only)"""
    
    users = db.query(User).offset(offset).limit(limit).all()
    
    return [
        UserManagementResponse(
            id=u.id,
            name=u.name,
            email=u.email,
            role=u.role,
            is_active=u.is_active,
            created_at=u.created_at.isoformat() if u.created_at else "",
            generations_count=len(u.audio_generations) if u.audio_generations else 0,
        )
        for u in users
    ]


@router.put("/users/{user_id}/role")
async def update_user_role(
    user_id: int,
    role: str,
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db),
):
    """Update user role (admin only)"""
    
    if role not in ["user", "admin"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid role. Must be 'user' or 'admin'"
        )
    
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    user.role = role
    db.commit()
    
    return {"message": "User role updated successfully", "user_id": user.id}


@router.put("/users/{user_id}/active")
async def toggle_user_active(
    user_id: int,
    is_active: bool,
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db),
):
    """Toggle user active status (admin only)"""
    
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    user.is_active = is_active
    db.commit()
    
    return {"message": "User status updated successfully", "user_id": user.id}


# Job Management

@router.get("/jobs", response_model=list[JobStatusResponse])
async def get_jobs_status(
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db),
    limit: int = 100,
    offset: int = 0,
):
    """Get list of all background jobs (admin only)"""
    
    jobs = db.query(Job).order_by(Job.created_at.desc()).offset(offset).limit(limit).all()
    
    return [
        JobStatusResponse(
            id=j.id,
            user_id=j.user_id,
            job_type=j.job_type,
            status=j.status,
            progress=j.progress,
            error_message=j.error_message,
            created_at=j.created_at.isoformat() if j.created_at else "",
        )
        for j in jobs
    ]


@router.get("/jobs/{job_id}", response_model=JobStatusResponse)
async def get_job_details(
    job_id: int,
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db),
):
    """Get specific job details (admin only)"""
    
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job not found"
        )
    
    return JobStatusResponse(
        id=job.id,
        user_id=job.user_id,
        job_type=job.job_type,
        status=job.status,
        progress=job.progress,
        error_message=job.error_message,
        created_at=job.created_at.isoformat() if job.created_at else "",
    )


# Statistics

@router.get("/stats", response_model=dict)
async def get_statistics(
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db),
):
    """Get system statistics (admin only)"""
    
    total_users = db.query(User).count()
    active_users = db.query(User).filter(User.is_active == True).count()
    total_generations = db.query(AudioGeneration).count()
    total_voices = db.query(Voice).filter(Voice.is_active == True).count()
    pending_jobs = db.query(Job).filter(Job.status == "pending").count()
    failed_jobs = db.query(Job).filter(Job.status == "failed").count()
    
    return {
        "total_users": total_users,
        "active_users": active_users,
        "total_generations": total_generations,
        "total_voices": total_voices,
        "pending_jobs": pending_jobs,
        "failed_jobs": failed_jobs,
    }
