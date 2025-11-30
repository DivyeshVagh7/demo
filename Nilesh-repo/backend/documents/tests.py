from django.test import TestCase, Client
from rest_framework import status
from unittest.mock import patch, MagicMock
from bson.objectid import ObjectId
from authentication.models import User

class ShareLinkAPITestCase(TestCase):
    def setUp(self):
        self.client = Client()
        self.user = User.create_user(email='test@example.com', username='testuser', password='password')
        self.client.force_login(self.user)

    @patch('documents.views.update_share_permissions')
    def test_generate_share_link_existing_document_success(self, mock_update_share_permissions):
        # Mock the database function to simulate success
        mock_update_share_permissions.return_value = True
        
        document_id = '60d5ec49e8b4f6f3e6d3c5a8'
        response = self.client.post('/api/documents/generate-share-link/', {
            'document_id': document_id,
            'permission_level': 'view'
        }, content_type='application/json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('share_url', response.json())
        self.assertEqual(response.json()['share_url'], f'/documentShare/{document_id}')
        mock_update_share_permissions.assert_called_once_with(document_id, {'permission_level': 'view'})

    @patch('documents.views.update_share_permissions')
    def test_generate_share_link_existing_document_failure(self, mock_update_share_permissions):
        # Mock the database function to simulate failure
        mock_update_share_permissions.return_value = False
        
        document_id = '60d5ec49e8b4f6f3e6d3c5a8'
        response = self.client.post('/api/documents/generate-share-link/', {
            'document_id': document_id,
            'permission_level': 'edit'
        }, content_type='application/json')
        
        self.assertEqual(response.status_code, status.HTTP_500_INTERNAL_SERVER_ERROR)
        self.assertIn('error', response.json())
        mock_update_share_permissions.assert_called_once_with(document_id, {'permission_level': 'edit'})

    @patch('documents.views.save_conversation')
    def test_generate_share_link_new_document_success(self, mock_save_conversation):
        # Mock the database function to simulate successful creation
        new_doc_id = ObjectId()
        mock_save_conversation.return_value = str(new_doc_id)
        
        response = self.client.post('/api/documents/generate-share-link/', {
            'document_content': 'This is a new document.',
            'title': 'New Shared Doc',
            'permission_level': 'view'
        }, content_type='application/json')
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn('share_url', response.json())
        self.assertEqual(response.json()['share_url'], f'/documentShare/{new_doc_id}')
        mock_save_conversation.assert_called_once()

    def test_generate_share_link_new_document_no_content(self):
        response = self.client.post('/api/documents/generate-share-link/', {
            'title': 'Incomplete Doc'
        }, content_type='application/json')
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('error', response.json())