from pymongo import MongoClient
from bson.objectid import ObjectId
from django.conf import settings
import datetime

def get_mongo_db():
    client = MongoClient(settings.MONGO_URI)
    return client[settings.MONGO_DB_NAME]

def get_comments_collection():
    db = get_mongo_db()
    return db.comments

def serialize_comment(comment):
    """
    Serializes a MongoDB comment document into a dictionary suitable for API response.
    Handles ObjectId conversion and ensures datetime objects are ISO formatted.
    """
    if not comment:
        return None
    
    serialized = {
        'id': str(comment['_id']),
        'document_id': comment.get('document_id'),
        'user': comment.get('user'),
        'content': comment.get('content'),
        'position': comment.get('position'),
        'created_at': comment.get('created_at').isoformat() if isinstance(comment.get('created_at'), datetime.datetime) else comment.get('created_at'),
        'parent_comment': str(comment['parent_comment']) if comment.get('parent_comment') else None,
        'replies': [] # Initialize replies list here, will be populated later
    }
    return serialized

def get_comments_for_document(document_id):
    """
    Retrieves all comments for a given document_id, structured with replies.
    """
    comments_collection = get_comments_collection()
    
    # Fetch all comments for the document and sort them
    all_raw_comments = list(comments_collection.find({'document_id': document_id}).sort('created_at', 1))
    
    # Serialize all comments first
    all_serialized_comments = [serialize_comment(comment) for comment in all_raw_comments]
    
    # Build a dictionary for quick lookup by ID
    comments_by_id = {comment['id']: comment for comment in all_serialized_comments}
    
    # Build the tree structure
    root_comments = []
    for comment in all_serialized_comments:
        if comment.get('parent_comment'):
            parent_id = comment['parent_comment']
            if parent_id in comments_by_id:
                comments_by_id[parent_id].setdefault('replies', []).append(comment)
            else:
                # If parent not found (e.g., parent was deleted), treat as a root comment
                root_comments.append(comment)
        else:
            root_comments.append(comment)
            
    return root_comments

def add_comment(document_id, user, content, position=None, parent_comment_id=None):
    """
    Adds a new comment to the MongoDB comments collection.
    """
    comments_collection = get_comments_collection()
    
    comment_data = {
        'document_id': document_id,
        'user': user,
        'content': content,
        'position': position,
        'created_at': datetime.datetime.now(datetime.timezone.utc),
        'parent_comment': ObjectId(parent_comment_id) if parent_comment_id else None
    }
    
    result = comments_collection.insert_one(comment_data)
    
    # Retrieve the newly created comment to return a fully formed object
    new_comment = comments_collection.find_one({'_id': result.inserted_id})
    return new_comment
