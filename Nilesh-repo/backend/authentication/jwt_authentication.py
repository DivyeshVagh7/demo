from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.settings import api_settings
from authentication.models import User
from mongoengine import DoesNotExist
from bson import ObjectId

class MongoEngineJWTAuthentication(JWTAuthentication):
    def get_user(self, validated_token):
        """
        Attempts to find and return a user using the given validated token.
        """
        try:
            user_id = validated_token[api_settings.USER_ID_CLAIM]
        except KeyError:
            return None

        try:
            # Assuming user_id is a string representation of ObjectId
            # Query MongoEngine User model directly
            user = User.objects(id=user_id).first()
            if user:
                return user
        except DoesNotExist:
            return None
        except Exception as e:
            # Log the exception for debugging
            print(f"Error retrieving user with ID {user_id}: {e}")
            return None
        return None
