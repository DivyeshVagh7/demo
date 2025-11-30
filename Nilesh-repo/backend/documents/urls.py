from django.urls import path
from . import views

urlpatterns = [
    path('conversations/', views.conversation_list, name='conversation-list'),
    path('conversations/chat/', views.create_conversation_with_chat, name='create-conversation-with-chat'), # New endpoint for initial chat
    path('conversations/<str:pk>/chat/', views.send_chat_message, name='send-chat-message'), # New endpoint for ongoing chat
    path('conversations/<str:pk>/share-with-user/', views.share_document_with_user, name='share-document-with-user'), # New endpoint for user-specific sharing
    path('conversations/<str:pk>/', views.conversation_detail, name='conversation-detail'),
    path('conversations/<str:pk>/versions/<int:version_number>/content/', views.get_version_content, name='get-version-content'),
    path('conversations/<str:pk>/versions/<int:version_number>/', views.version_detail, name='version-detail'),
    path('<str:document_id>/comments/', views.document_comments, name='document-comments'),
    path('generate-share-link/', views.generate_share_link, name='generate-share-link'),
]
