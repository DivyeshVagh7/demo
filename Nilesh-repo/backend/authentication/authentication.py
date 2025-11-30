"""
Custom JWT Authentication for MongoEngine
"""
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import InvalidToken
from .models import User

class MongoEngineJWTAuthentication(JWTAuthentication):
    """
    Custom JWT authentication that works with MongoEngine User model
    """
    
    def get_user(self, validated_token):
        """
        Get user from MongoEngine using the user_id from JWT token
        """
        try:
            user_id = validated_token.get('user_id')
            if not user_id:
                raise InvalidToken('Token contained no recognizable user identification')
            
            user = User.objects(id=user_id).first()
            if not user:
                raise InvalidToken('User not found')
            
            return user
        except Exception as e:
            raise InvalidToken(f'Invalid user: {str(e)}')
