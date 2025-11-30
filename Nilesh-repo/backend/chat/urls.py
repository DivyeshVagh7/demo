from django.urls import path
from .views import (
    chat_conversations_list_view,
    chat_messages_view,
)

urlpatterns = [
    path('conversations/', chat_conversations_list_view, name='chat_conversations'),
    path('conversations/<str:conversation_id>/messages/', chat_messages_view, name='chat_messages'),
]
