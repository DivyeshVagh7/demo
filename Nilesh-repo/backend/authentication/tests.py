from django.test import TestCase
from authentication.models import User, LawyerProfile, LawyerConnectionRequest
from django.core.exceptions import ValidationError
from mongoengine import connect, disconnect
from django.conf import settings
from pymongo import MongoClient


class UserModelTest(TestCase):

    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        # Ensure MongoDB is connected for tests
        
        # Disconnect any existing connections
        disconnect()
        
        # Connect to a test database
        cls.db_name = 'test_legal_document_navigator_db'
        connect(cls.db_name, host=settings.MONGO_URI, alias='default')

    @classmethod
    def tearDownClass(cls):
        from mongoengine import disconnect
        from pymongo import MongoClient

        # Clean up the test database
        client = MongoClient(settings.MONGO_URI) # Use the URI from settings
        client.drop_database(cls.db_name)
        client.close()
        
        # Disconnect from MongoDB
        disconnect()
        super().tearDownClass()

    def setUp(self):
        # Clear all collections before each test
        User.objects.all().delete()
        LawyerProfile.objects.all().delete() # Clear other models if necessary
        LawyerConnectionRequest.objects.all().delete() # Clear other models if necessary

    def test_create_user(self):
        """
        Test creating a regular user with email and username.
        """
        user = User.create_user(
            email='test@example.com',
            username='testuser',
            password='password123'
        )
        self.assertIsNotNone(user.id)
        self.assertEqual(user.email, 'test@example.com')
        self.assertEqual(user.username, 'testuser')
        self.assertTrue(user.check_password('password123'))
        self.assertFalse(user.is_staff)
        self.assertFalse(user.is_superuser)

    def test_create_superuser(self):
        """
        Test creating a superuser with email and username.
        """
        admin_user = User.create_superuser(
            email='admin@example.com',
            username='adminuser',
            password='adminpassword'
        )
        self.assertIsNotNone(admin_user.id)
        self.assertEqual(admin_user.email, 'admin@example.com')
        self.assertEqual(admin_user.username, 'adminuser')
        self.assertTrue(admin_user.check_password('adminpassword'))
        self.assertTrue(admin_user.is_staff)
        self.assertTrue(admin_user.is_superuser)

    def test_set_and_check_password(self):
        """
        Test setting and checking a user's password.
        """
        user = User.create_user(
            email='passwordtest@example.com',
            username='passwordtestuser',
            password='oldpassword'
        )
        self.assertTrue(user.check_password('oldpassword'))
        user.set_password('newpassword')
        user.save()
        self.assertTrue(user.check_password('newpassword'))
        self.assertFalse(user.check_password('oldpassword'))

    def test_create_user_no_email(self):
        """
        Test that creating a user without an email raises a ValueError.
        """
        with self.assertRaises(ValueError):
            User.create_user(email='', username='nouser')

    def test_create_user_no_username(self):
        """
        Test that creating a user without a username raises a ValueError.
        """
        with self.assertRaises(ValueError):
            User.create_user(email='no@user.com', username='')

    def test_duplicate_email(self):
        """
        Test that creating a user with a duplicate email raises an error.
        """
        User.create_user(email='duplicate@example.com', username='user1', password='password123')
        with self.assertRaises(Exception): # MongoEngine might raise different exception
            User.create_user(email='duplicate@example.com', username='user2', password='password123')

    def test_duplicate_username(self):
        """
        Test that creating a user with a duplicate username raises an error.
        """
        User.create_user(email='user1@example.com', username='duplicateuser', password='password123')
        with self.assertRaises(Exception): # MongoEngine might raise different exception
            User.create_user(email='user2@example.com', username='duplicateuser', password='password123')
