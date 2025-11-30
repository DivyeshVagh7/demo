from rest_framework import serializers
from .models import DocumentSession

class SummarizationSessionSerializer(serializers.Serializer):
    """
    Serializer for listing DocumentSession objects.
    """
    id = serializers.CharField(read_only=True)
    summary = serializers.CharField(read_only=True)
    document_type = serializers.CharField(read_only=True, allow_blank=True)
    created_at = serializers.DateTimeField(read_only=True)

    def to_representation(self, instance):
        """
        Convert `DocumentSession` instance to representation.
        Make it robust against missing optional fields.
        """
        return {
            "id": str(instance.id),
            "summary": getattr(instance, 'summary', 'No summary available'),
            "document_type": getattr(instance, 'document_type', ''),
            "created_at": instance.created_at,
        }
