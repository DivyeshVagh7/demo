from channels.db import database_sync_to_async
from django.contrib.auth.models import AnonymousUser
from rest_framework_simplejwt.tokens import AccessToken
from authentication.models import User
from urllib.parse import parse_qs
from asgiref.sync import sync_to_async

@database_sync_to_async
def get_user_by_mongo_id(user_id):
    # MongoEngine access using .objects(id=...)
    return User.objects(id=user_id).first()

class TokenAuthMiddleware:
    def __init__(self, inner):
        self.inner = inner

    async def __call__(self, scope, receive, send):
        query_string = scope.get("query_string", b"").decode()
        query_params = parse_qs(query_string)

        token = query_params.get("token", [None])[0]

        if token:
            try:
                validated = AccessToken(token)
                mongo_user_id = validated["user_id"]

                user = await get_user_by_mongo_id(mongo_user_id)

                if user:
                    scope["user"] = user
                else:
                    scope["user"] = AnonymousUser()

            except Exception as e:
                print("Token error:", e)
                scope["user"] = AnonymousUser()
        else:
            scope["user"] = AnonymousUser()

        return await self.inner(scope, receive, send)
