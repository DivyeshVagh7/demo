import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../api/axios';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { Card, CardContent } from "@/Components/ui/Card";
import { Button } from "@/Components/ui/button";
import { MessageSquare, ArrowRight, Clock } from 'lucide-react';

const ChatList = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAllItems();
    const interval = setInterval(loadAllItems, 5000);
    return () => clearInterval(interval);
  }, []);

  const loadAllItems = async () => {
    try {
      const [convResponse, reqResponse] = await Promise.all([
        axios.get('api/chat/conversations/'),
        axios.get('api/lawyer/connections/')
      ]);

      const conversations = (convResponse.data.results || []).map(c => ({ ...c, type: 'conversation' }));
      const requests = (reqResponse.data || []).map(r => ({ ...r, type: 'request' }));

      const combined = [...conversations, ...requests].sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));
      setItems(combined);
    } catch (err) {
      console.error('Failed to load items:', err);
      toast.error(err.response?.data?.error || 'Failed to load messages and requests.');
    } finally {
      setLoading(false);
    }
  };

  const handleWithdraw = async (connectionId) => {
    if (!window.confirm('Are you sure you want to withdraw this request?')) return;

    try {
      await axios.patch(`api/lawyer/connections/${connectionId}/withdraw/`);
      toast.success('Request withdrawn.');
      loadAllItems(); // Refresh the list
    } catch (err) {
      console.error('Failed to withdraw request:', err);
      toast.error(err.response?.data?.error || 'Failed to withdraw request.');
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto py-10 animate-fade-in">
        <div className="text-center text-gray-400">Loading...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10 animate-fade-in">
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 mb-3 px-3 py-1 bg-blue-500/10 rounded-full border border-blue-500/20">
          <span className="text-blue-400 text-xs font-medium">Messages & Requests</span>
        </div>
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-3">
          Your Communications
        </h1>
        <p className="text-gray-400 max-w-2xl mx-auto">
          Active chats and pending connection requests.
        </p>
      </div>

      {items.length === 0 ? (
        <Card className="bg-gray-800/40 backdrop-blur-sm border border-gray-700/50">
          <CardContent className="p-10 text-center">
            <MessageSquare className="w-16 h-16 text-gray-500 mx-auto mb-4" />
            <p className="text-gray-400">No items to show.</p>
            <p className="text-gray-500 text-sm mt-2">
              Connect with a lawyer to start a conversation.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {items.map((item) => {
            if (item.type === 'conversation') {
              const otherUser = item.client?.id === user?.id ? item.lawyer : item.client;
              return (
                <Card
                  key={`conv-${item.id}`}
                  className="bg-gray-800/40 backdrop-blur-sm border border-gray-700/50 hover:border-gray-600 transition-all duration-200 cursor-pointer"
                  onClick={() => navigate(`/chat/${item.id}`)}
                >
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      <div className="w-12 h-12 bg-blue-600/20 border border-blue-500/30 rounded-full flex items-center justify-center">
                        <span className="text-blue-400 font-semibold">
                          {otherUser?.name?.split(' ').map(n => n[0]).join('') || otherUser?.username?.slice(0, 2).toUpperCase() || 'U'}
                        </span>
                      </div>
                      <div className="flex-1">
                        <h3 className="text-white font-semibold">{otherUser?.name || otherUser?.username || 'Unknown User'}</h3>
                        <p className="text-gray-400 text-sm truncate">
                          {item.last_message ? (item.last_message.message_type === 'document' ? `📄 ${item.last_message.document_title || 'Document'}` : item.last_message.message) : 'No messages yet'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {item.unread_count > 0 && (
                        <span className="bg-blue-600 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
                          {item.unread_count}
                        </span>
                      )}
                      <ArrowRight className="w-5 h-5 text-gray-400" />
                    </div>
                  </CardContent>
                </Card>
              );
            } else if (item.type === 'request' && item.status === 'pending') {
              const lawyer = item.lawyer;
              return (
                <Card
                  key={`req-${item.id}`}
                  className="bg-gray-800/40 backdrop-blur-sm border border-gray-700/50"
                >
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      <div className="w-12 h-12 bg-yellow-600/20 border border-yellow-500/30 rounded-full flex items-center justify-center">
                        <Clock className="w-6 h-6 text-yellow-400" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-white font-semibold">Request to {lawyer?.name || lawyer?.username}</h3>
                        <p className="text-yellow-400 text-sm">Status: {item.status}</p>
                      </div>
                    </div>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleWithdraw(item.id);
                      }}
                    >
                      Withdraw
                    </Button>
                  </CardContent>
                </Card>
              );
            }
            return null;
          })}
        </div>
      )}
    </div>
  );
};

export default ChatList;