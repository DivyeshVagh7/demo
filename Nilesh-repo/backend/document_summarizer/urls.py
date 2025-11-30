from django.urls import path
from . import views

urlpatterns = [
    path('summarize/', views.summarize_document, name='summarize_document'),
    path('chat/', views.chat_message, name='chat_message'),
    path('sessions/', views.user_sessions, name='user_sessions'),
    path('sessions/<str:session_id>/', views.session_detail, name='session_detail'),
    path('sessions/<str:session_id>/history/', views.chat_history, name='chat_history'),
    path('sessions/<str:session_id>/status/', views.task_status, name='task_status'),
]