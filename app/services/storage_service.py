"""Storage service for file management"""
import os
import shutil
from pathlib import Path
from typing import Optional
from ..config import get_settings

settings = get_settings()


class StorageService:
    """Service for file storage operations"""
    
    def __init__(self):
        """Initialize storage service"""
        self.storage_dir = Path(settings.UPLOAD_DIR)
        self.storage_dir.mkdir(parents=True, exist_ok=True)
    
    @staticmethod
    def save_uploaded_file(file_path: str, destination: str) -> str:
        """
        Save uploaded file to storage
        
        Args:
            file_path: Source file path
            destination: Destination filename
        
        Returns:
            Saved file path
        """
        try:
            storage_path = Path(settings.UPLOAD_DIR) / destination
            shutil.copy(file_path, storage_path)
            return str(storage_path)
        except Exception as e:
            raise Exception(f"Failed to save file: {str(e)}")
    
    @staticmethod
    def get_file_url(file_name: str) -> str:
        """Get public URL for file"""
        return f"/audio/{file_name}"
    
    @staticmethod
    def delete_file(file_name: str) -> bool:
        """
        Delete file from storage
        
        Args:
            file_name: Name of file to delete
        
        Returns:
            True if deleted, False if not found
        """
        try:
            file_path = Path(settings.UPLOAD_DIR) / file_name
            if file_path.exists():
                file_path.unlink()
                return True
            return False
        except Exception as e:
            raise Exception(f"Failed to delete file: {str(e)}")
    
    @staticmethod
    def file_exists(file_name: str) -> bool:
        """Check if file exists"""
        file_path = Path(settings.UPLOAD_DIR) / file_name
        return file_path.exists()
    
    @staticmethod
    def get_file_size(file_name: str) -> Optional[int]:
        """Get file size in bytes"""
        try:
            file_path = Path(settings.UPLOAD_DIR) / file_name
            if file_path.exists():
                return file_path.stat().st_size
            return None
        except Exception:
            return None
    
    @staticmethod
    def cleanup_old_files(days: int = 7) -> int:
        """
        Delete files older than specified days
        
        Args:
            days: Number of days to keep
        
        Returns:
            Number of files deleted
        """
        import time
        
        try:
            storage_path = Path(settings.UPLOAD_DIR)
            cutoff_time = time.time() - (days * 24 * 60 * 60)
            deleted_count = 0
            
            for file_path in storage_path.glob("*"):
                if file_path.is_file():
                    if file_path.stat().st_mtime < cutoff_time:
                        file_path.unlink()
                        deleted_count += 1
            
            return deleted_count
        except Exception as e:
            raise Exception(f"Failed to cleanup files: {str(e)}")
