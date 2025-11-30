from rest_framework import serializers
from authentication.models import User
from .models import ChatMessage, ChatConversation

class ChatMessageSerializer(serializers.Serializer):
    """Serializer for chat messages"""
    id = serializers.CharField(read_only=True)
    sender = serializers.SerializerMethodField()
    message = serializers.CharField()
    message_type = serializers.CharField()
    document_id = serializers.CharField(allow_blank=True)
    document_title = serializers.CharField(allow_blank=True)
    is_read = serializers.BooleanField()
    created_at = serializers.DateTimeField()
    
    def get_sender(self, obj):
        try:
            # Try to get sender from the object
            if hasattr(obj, 'sender') and obj.sender:
                sender = obj.sender
                # If it's a reference, fetch it
                if hasattr(sender, 'id'):
                    return {
                        'id': str(sender.id),
                        'name': sender.name or sender.username or 'Unknown',
                        'username': sender.username or 'unknown',
                    }
            # Fallback: try to get by ID if sender is stored as ID
            if hasattr(obj, 'sender_id') and obj.sender_id:
                sender = User.objects(id=obj.sender_id).first()
                if sender:
                    return {
                        'id': str(sender.id),
                        'name': sender.name or sender.username or 'Unknown',
                        'username': sender.username or 'unknown',
                    }
        except Exception as e:
            print(f"Error getting sender: {e}")
        return {'id': 'unknown', 'name': 'Unknown', 'username': 'unknown'}
    
    def to_representation(self, instance):
        """Ensure all keys are strings and properly serialize data"""
        data = super().to_representation(instance)
        # Ensure all keys are strings and handle datetime serialization
        result = {}
        for k, v in data.items():
            key = str(k)
            # Handle datetime objects that might not be serialized
            if hasattr(v, 'isoformat'):
                result[key] = v.isoformat() if v else None
            elif isinstance(v, dict):
                # Recursively ensure nested dict keys are strings
                result[key] = {str(k2): v2 for k2, v2 in v.items()}
            else:
                result[key] = v
        return result


class ChatConversationSerializer(serializers.Serializer):
    """Serializer for chat conversations"""
    id = serializers.CharField(read_only=True)
    connection_request_id = serializers.SerializerMethodField()
    client = serializers.SerializerMethodField()
    lawyer = serializers.SerializerMethodField()
    created_at = serializers.DateTimeField()
    updated_at = serializers.DateTimeField()
    last_message = serializers.SerializerMethodField()
    unread_count = serializers.SerializerMethodField()
    
    def get_connection_request_id(self, obj):
        if hasattr(obj, 'connection_request') and obj.connection_request:
            return str(obj.connection_request.id)
        return None
    
    def get_client(self, obj):
        client = obj.client if hasattr(obj, 'client') else User.objects(id=obj.client).first()
        if client:
            return {
                'id': str(client.id),
                'name': client.name or client.username,
                'username': client.username,
            }
        return None
    
    def get_lawyer(self, obj):
        lawyer = obj.lawyer if hasattr(obj, 'lawyer') else User.objects(id=obj.lawyer).first()
        if lawyer:
            return {
                'id': str(lawyer.id),
                'name': lawyer.name or lawyer.username,
                'username': lawyer.username,
            }
        return None
    
    def get_last_message(self, obj):
        last_msg = ChatMessage.objects(conversation=obj).order_by('-created_at').first()
        if last_msg:
            serializer = ChatMessageSerializer(last_msg)
            return serializer.data
        return None
    
    def get_unread_count(self, obj):
        request = self.context.get('request')

        if request and request.user:
            unread = ChatMessage.objects(
                conversation=obj,
                is_read=False,
                sender__ne=request.user
            ).count()
            return unread

        return 0

    
    def to_representation(self, instance):
        """Ensure all keys are strings and handle nested structures"""
        data = super().to_representation(instance)
        # Ensure all keys are strings and handle nested structures
        result = {}
        for k, v in data.items():
            key = str(k)
            # Handle datetime objects
            if hasattr(v, 'isoformat'):
                result[key] = v.isoformat() if v else None
            elif isinstance(v, dict):
                # Recursively ensure nested dict keys are strings
                result[key] = {str(k2): v2 for k2, v2 in v.items()}
            elif isinstance(v, list):
                # Handle lists that might contain dicts
                result[key] = [
                    {str(k2): v2 for k2, v2 in item.items()} if isinstance(item, dict) else item
                    for item in v
                ]
            else:
                result[key] = v
        return result
