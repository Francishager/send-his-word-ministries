import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async

# NOTE: This is a minimal prototype for chat and prayer queue.
# In production, add authentication, permissions, rate limiting, and persistence.


class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.service_id = self.scope['url_route']['kwargs'].get('service_id')
        self.room_group_name = f"chat_{self.service_id}"
        await self.channel_layer.group_add(self.room_group_name, self.channel_name)
        await self.accept()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(self.room_group_name, self.channel_name)

    async def receive(self, text_data=None, bytes_data=None):
        try:
            data = json.loads(text_data or '{}')
        except Exception:
            data = {}
        msg_type = data.get('type')
        user = self.scope.get('user')
        if msg_type == 'chat.send':
            if not getattr(user, 'is_authenticated', False):
                await self.send(text_data=json.dumps({'type': 'error', 'detail': 'auth_required'}))
                return
            text = data.get('text', '')
            if not text:
                return
            # Broadcast message to room
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'chat.message',
                    'user': getattr(user, 'email', None) or 'Anon',
                    'text': text,
                }
            )

    async def chat_message(self, event):
        await self.send(text_data=json.dumps({
            'type': 'chat.message',
            'user': event.get('user'),
            'text': event.get('text'),
        }))


# In-memory prayer queue (per-process). Consider redis/persistence for multi-worker setups.
_PRAYER_QUEUE = []


class PrayerQueueConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.group_name = 'prayer_queue'
        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()
        # Send snapshot
        await self.send(text_data=json.dumps({'type': 'queue.snapshot', 'items': _PRAYER_QUEUE}))

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(self.group_name, self.channel_name)

    async def receive(self, text_data=None, bytes_data=None):
        try:
            data = json.loads(text_data or '{}')
        except Exception:
            data = {}
        msg_type = data.get('type')
        user = self.scope.get('user')
        if msg_type == 'queue.request':
            if not getattr(user, 'is_authenticated', False):
                await self.send(text_data=json.dumps({'type': 'error', 'detail': 'auth_required'}))
                return
            item = {
                'id': str(len(_PRAYER_QUEUE) + 1),
                'user': getattr(user, 'email', None) or 'Anon',
                'status': 'waiting',
            }
            _PRAYER_QUEUE.append(item)
            await self.channel_layer.group_send(
                self.group_name,
                {'type': 'queue.joined', 'item': item}
            )

    async def queue_joined(self, event):
        await self.send(text_data=json.dumps({'type': 'queue.joined', 'item': event.get('item')}))

    async def queue_updated(self, event):
        await self.send(text_data=json.dumps({'type': 'queue.updated', 'item': event.get('item')}))
