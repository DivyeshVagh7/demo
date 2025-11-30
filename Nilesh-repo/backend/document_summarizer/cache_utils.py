"""
Cache utilities with LRU eviction and TTL management
"""
import hashlib
from typing import Any, Dict, Optional
from django.core.cache import cache
import logging

logger = logging.getLogger(__name__)

# Cache TTL settings (in seconds)
CHUNK_CACHE_TTL = 86400  # 24 hours
FOCUS_CACHE_TTL = 86400  # 24 hours
TASK_STATUS_TTL = 3600   # 1 hour

# Cache key prefixes
CHUNK_CACHE_PREFIX = "doc_chunk:"
FOCUS_CACHE_PREFIX = "doc_focus:"
TASK_STATUS_PREFIX = "task_status:"


def get_chunk_cache_key(chunk_text: str) -> str:
    """Generate a cache key for a document chunk."""
    hash_value = hashlib.sha256(chunk_text.encode('utf-8')).hexdigest()
    return f"{CHUNK_CACHE_PREFIX}{hash_value}"


def get_focus_cache_key(focus_text: str) -> str:
    """Generate a cache key for focus snippets."""
    hash_value = hashlib.sha256(focus_text.encode('utf-8')).hexdigest()
    return f"{FOCUS_CACHE_PREFIX}{hash_value}"


def get_task_status_key(session_id: str) -> str:
    """Generate a cache key for task status."""
    return f"{TASK_STATUS_PREFIX}{session_id}"


def get_cached_chunk_analysis(chunk_text: str) -> Optional[Dict[str, Any]]:
    """
    Retrieve cached chunk analysis result.
    
    Args:
        chunk_text: The text of the chunk to look up
        
    Returns:
        Cached analysis dict or None if not found
    """
    try:
        cache_key = get_chunk_cache_key(chunk_text)
        result = cache.get(cache_key)
        if result:
            logger.debug(f"Cache hit for chunk analysis: {cache_key[:16]}...")
        return result
    except Exception as exc:
        logger.warning(f"Error retrieving chunk cache: {exc}")
        return None


def set_cached_chunk_analysis(chunk_text: str, analysis: Dict[str, Any]) -> None:
    """
    Store chunk analysis result in cache with TTL.
    
    Args:
        chunk_text: The text of the chunk
        analysis: The analysis results to cache
    """
    try:
        cache_key = get_chunk_cache_key(chunk_text)
        cache.set(cache_key, analysis, timeout=CHUNK_CACHE_TTL)
        logger.debug(f"Cached chunk analysis: {cache_key[:16]}...")
    except Exception as exc:
        logger.warning(f"Error setting chunk cache: {exc}")


def get_cached_focus_analysis(focus_text: str) -> Optional[Dict[str, Any]]:
    """
    Retrieve cached focus snippet analysis result.
    
    Args:
        focus_text: The focus text to look up
        
    Returns:
        Cached analysis dict or None if not found
    """
    try:
        cache_key = get_focus_cache_key(focus_text)
        result = cache.get(cache_key)
        if result:
            logger.debug(f"Cache hit for focus analysis: {cache_key[:16]}...")
        return result
    except Exception as exc:
        logger.warning(f"Error retrieving focus cache: {exc}")
        return None


def set_cached_focus_analysis(focus_text: str, analysis: Dict[str, Any]) -> None:
    """
    Store focus snippet analysis result in cache with TTL.
    
    Args:
        focus_text: The focus text
        analysis: The analysis results to cache
    """
    try:
        cache_key = get_focus_cache_key(focus_text)
        cache.set(cache_key, analysis, timeout=FOCUS_CACHE_TTL)
        logger.debug(f"Cached focus analysis: {cache_key[:16]}...")
    except Exception as exc:
        logger.warning(f"Error setting focus cache: {exc}")


def get_task_status(session_id: str) -> Optional[Dict[str, Any]]:
    """
    Get the status of an async task.
    
    Args:
        session_id: The session ID
        
    Returns:
        Status dict with 'status', 'progress', 'message' or None
    """
    try:
        cache_key = get_task_status_key(session_id)
        return cache.get(cache_key)
    except Exception as exc:
        logger.warning(f"Error retrieving task status: {exc}")
        return None


def set_task_status(session_id: str, status: str, progress: int, message: str) -> None:
    """
    Update the status of an async task.
    
    Args:
        session_id: The session ID
        status: Status string ('pending', 'processing', 'completed', 'failed')
        progress: Progress percentage (0-100)
        message: Human-readable status message
    """
    try:
        cache_key = get_task_status_key(session_id)
        cache.set(cache_key, {
            'status': status,
            'progress': progress,
            'message': message
        }, timeout=TASK_STATUS_TTL)
    except Exception as exc:
        logger.warning(f"Error setting task status: {exc}")


def clear_task_status(session_id: str) -> None:
    """Clear task status from cache."""
    try:
        cache_key = get_task_status_key(session_id)
        cache.delete(cache_key)
    except Exception as exc:
        logger.warning(f"Error clearing task status: {exc}")
