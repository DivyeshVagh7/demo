import os

from channels.auth import AuthMiddlewareStack
from channels.routing import ProtocolTypeRouter, URLRouter
from django.core.asgi import get_asgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'legal_doc_generator.settings')

# Get the Django ASGI application early to ensure the AppRegistry is populated
django_asgi_app = get_asgi_application()

from documents.routing import websocket_urlpatterns # Now this import should be safe
from authentication.middleware import TokenAuthMiddleware # Import your custom middleware

application = ProtocolTypeRouter({
    "http": django_asgi_app,
    "websocket": TokenAuthMiddleware( # Use your custom middleware
        AuthMiddlewareStack(
            URLRouter(
                websocket_urlpatterns
            )
        )
    ),
})
