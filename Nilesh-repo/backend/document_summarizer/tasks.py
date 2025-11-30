"""
Celery tasks for asynchronous document processing
"""
import logging
from celery import shared_task
from django.core.cache import cache
from .models import DocumentSession
from .views import generate_document_analysis

logger = logging.getLogger(__name__)


@shared_task(bind=True, max_retries=3, default_retry_delay=60)
def analyze_document_async(self, session_id, document_text):
    """
    Asynchronously analyze a document and update the session with results.
    
    Args:
        session_id: ID of the DocumentSession to update
        document_text: Full text of the document to analyze
        
    Returns:
        dict: Analysis results with summary and clauses
    """
    try:
        # Update task status to processing
        cache.set(f'task_status:{session_id}', {
            'status': 'processing',
            'progress': 10,
            'message': 'Starting analysis...'
        }, timeout=3600)
        
        logger.info(f"Starting async analysis for session {session_id}")
        
        # Update progress
        cache.set(f'task_status:{session_id}', {
            'status': 'processing',
            'progress': 30,
            'message': 'Analyzing document...'
        }, timeout=3600)
        
        # Perform the analysis
        analysis = generate_document_analysis(document_text)
        
        # Update progress
        cache.set(f'task_status:{session_id}', {
            'status': 'processing',
            'progress': 80,
            'message': 'Saving results...'
        }, timeout=3600)
        
        # Update the session with results
        session = DocumentSession.objects(id=session_id).first()
        if not session:
            raise ValueError(f"Session {session_id} not found")
        
        session.summary = analysis.get('summary', '')
        session.highlighted_preview = analysis.get('highlighted_preview', '')
        session.high_risk_clauses = analysis.get('high_risk_clauses', [])
        session.save()
        
        # Mark task as complete
        cache.set(f'task_status:{session_id}', {
            'status': 'completed',
            'progress': 100,
            'message': 'Analysis complete'
        }, timeout=3600)
        
        logger.info(f"Completed async analysis for session {session_id}")
        
        return {
            'session_id': str(session_id),
            'status': 'completed',
            'summary': analysis.get('summary', ''),
            'high_risk_clause_count': len(analysis.get('high_risk_clauses', []))
        }
        
    except Exception as exc:
        logger.error(f"Error in async analysis for session {session_id}: {exc}", exc_info=True)
        
        # Update task status to failed
        cache.set(f'task_status:{session_id}', {
            'status': 'failed',
            'progress': 0,
            'message': f'Analysis failed: {str(exc)}'
        }, timeout=3600)
        
        # Retry the task if not exceeded max retries
        try:
            raise self.retry(exc=exc)
        except self.MaxRetriesExceededError:
            logger.error(f"Max retries exceeded for session {session_id}")
            # Update session with error state
            try:
                session = DocumentSession.objects(id=session_id).first()
                if session:
                    session.summary = f"Analysis failed after multiple attempts: {str(exc)}"
                    session.save()
            except Exception as save_exc:
                logger.error(f"Failed to update session with error: {save_exc}")
            raise
