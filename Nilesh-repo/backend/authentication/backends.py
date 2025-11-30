from django.contrib.auth.backends import BaseBackend
from .models import User
from mongoengine import DoesNotExist
from bson import ObjectId

class EmailBackend(BaseBackend):
    """Custom authentication backend that uses email with MongoEngine"""
    
    def authenticate(self, request, email=None, password=None, **kwargs):
        try:
            user = User.objects(email=email).first()
            if user and user.check_password(password):
                return user
        except DoesNotExist:
            return None
        return None
    
    def get_user(self, user_id):
        try:
            # Convert string ID to ObjectId for MongoDB
            return User.objects(id=user_id).first()
        except (DoesNotExist, Exception):
            return None
