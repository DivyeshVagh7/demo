import json
from channels.generic.websocket import AsyncWebsocketConsumer
from asgiref.sync import sync_to_async
from .comment_mongo_client import get_comments_for_document
from ai_generator.utils import get_gemini_response_stream
from documents.mongo_client import get_conversation_by_id, update_conversation

class DocumentConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.document_id = self.scope['url_route']['kwargs']['document_id']
        self.document_group_name = f'document_{self.document_id}'

        # Join document group
        await self.channel_layer.group_add(
            self.document_group_name,
            self.channel_name
        )

        await self.accept()

    async def disconnect(self, close_code):
        # Leave document group
        await self.channel_layer.group_discard(
            self.document_group_name,
            self.channel_name
        )

    async def receive(self, text_data):
        data = json.loads(text_data)
        message_type = data.get('type')
        # print(f"Backend: Received WebSocket message: {data}") # Debug log

        if message_type == 'new_comment':
            # Comments are handled via HTTP POST and broadcasted, 
            # but we keep this if we want to switch to pure WS later.
            pass
        elif message_type == 'fetch_comments':
            # Send existing comments to the newly connected client
            comments = await sync_to_async(get_comments_for_document)(self.document_id)
            await self.send(text_data=json.dumps({
                'type': 'comments_list',
                'comments': comments
            }))
        elif message_type == 'document_content_change':
            # Broadcast the document content change to other clients in the group
            await self.channel_layer.group_send(
                self.document_group_name,
                {
                    'type': 'document_content_change',
                    'content': data['content'],
                    'sender_channel_name': self.channel_name
                }
            )
        elif message_type == 'chat_message':
            await self.handle_chat_message(data)

    async def handle_chat_message(self, data):
        user_message = data.get('message')
        document_content = data.get('document_content')
        
        # 1. Stream the AI response
        full_ai_response = ""
        try:
            # Use sync_to_async for the generator if needed, but since it yields, 
            # we might iterate directly if get_gemini_response_stream is synchronous generator.
            # However, running blocking code in async consumer is bad.
            # Ideally, get_gemini_response_stream should be async or run in a thread.
            # For simplicity in this setup, we'll iterate the synchronous generator.
            # In production, use run_in_executor or async generator.
            
            iterator = await sync_to_async(lambda: list(get_gemini_response_stream(user_message, document_content)))()
            
            for chunk in iterator:
                full_ai_response += chunk
                await self.send(text_data=json.dumps({
                    'type': 'chat_stream',
                    'chunk': chunk
                }))
            
            # 2. Process the full response (extract JSON if present)
            ai_response_content = ""
            if '```json' in full_ai_response:
                try:
                    json_str = full_ai_response.split('```json')[1].split('```')[0]
                    document_data = json.loads(json_str)
                    ai_response_content = document_data.get('text', '')
                except:
                    ai_response_content = full_ai_response # Fallback
            else:
                ai_response_content = full_ai_response

            # 3. Update the conversation in the database
            await self.save_conversation_update(user_message, full_ai_response, ai_response_content)

            # 4. Send completion message
            await self.send(text_data=json.dumps({
                'type': 'chat_complete',
                'full_response': full_ai_response,
                'updated_document_content': ai_response_content
            }))

        except Exception as e:
            print(f"Error in chat stream: {e}")
            await self.send(text_data=json.dumps({
                'type': 'chat_error',
                'error': str(e)
            }))

    @sync_to_async
    def save_conversation_update(self, user_message, ai_raw_response, ai_response_content):
        conversation = get_conversation_by_id(self.document_id)
        if conversation:
            updated_messages = conversation.get('messages', [])
            updated_messages.append({'sender': 'user', 'text': user_message})
            updated_messages.append({'sender': 'bot', 'text': ai_raw_response})
            
            # Only update document content if AI actually generated new content (not just chat)
            # Logic: if ai_response_content is significantly different or structured
            new_content = ai_response_content if ai_response_content else conversation.get('document_content')

            update_conversation(
                self.document_id,
                conversation.get('title'),
                updated_messages,
                new_content,
                uploaded_by=conversation.get('owner'), # Preserve owner
                notes='Document update via chat (WebSocket)'
            )

    async def new_comment(self, event):
        comment = event['comment']
        await self.send(text_data=json.dumps({
            'type': 'new_comment',
            'comment': comment
        }))

    async def document_content_change(self, event):
        if self.channel_name != event['sender_channel_name']:
            await self.send(text_data=json.dumps({
                'type': 'document_content_change',
                'content': event['content']
            }))
