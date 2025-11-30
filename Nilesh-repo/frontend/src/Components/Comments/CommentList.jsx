import React, { useState, useEffect, useCallback } from 'react';
import axios from '../../api/axios'; // Assuming axios is configured here
import CommentItem from './CommentItem';
import CommentForm from './CommentForm';
import { useLocation } from 'react-router-dom'; // Import useLocation

const CommentList = ({ documentId }) => {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const location = useLocation(); // Get location object
  const [highlightCommentId, setHighlightCommentId] = useState(null); // State to store comment ID to highlight

  const fetchComments = useCallback(async (silent = false) => {
    console.log('Fetching comments for documentId:', documentId);
    if (!silent) setLoading(true);
    try {
      const response = await axios.get(`/api/documents/${documentId}/comments/`);
      setComments(response.data);
      console.log('Comments fetched successfully:', response.data);
    } catch (err) {
      console.error('Error fetching comments:', err);
      setError('Failed to load comments.');
    } finally {
      if (!silent) setLoading(false);
      console.log('Finished fetching comments.');
    }
  }, [documentId]);

  useEffect(() => {
    fetchComments();

    // Extract comment ID from URL query parameter
    const queryParams = new URLSearchParams(location.search);
    const commentIdFromUrl = queryParams.get('comment');
    if (commentIdFromUrl) {
      setHighlightCommentId(commentIdFromUrl);
    }

    // WebSocket setup
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const accessToken = localStorage.getItem('access_token');
    const hostname = window.location.hostname;
    const port = '8000'; // Assuming backend is on port 8000
    let wsUrl = `${protocol}//${hostname}:${port}/ws/document/${documentId}/`;
    if (accessToken) {
      wsUrl += `?token=${accessToken}`;
    }
    const newWs = new WebSocket(wsUrl);

    newWs.onopen = () => {
      console.log('WebSocket connected for document:', documentId);
    };

    newWs.onmessage = (event) => {
      console.log('WebSocket message received:', event.data);
      const data = JSON.parse(event.data);
      if (data.type === 'new_comment') {
        console.log('New comment received via WebSocket:', data.comment);

        setComments((prevComments) => {
          const newComment = data.comment;

          // Helper to check if comment exists in tree
          const commentExists = (list, id) => {
            return list.some(c => {
              if (c.id === id) return true;
              if (c.replies && c.replies.length > 0) {
                return commentExists(c.replies, id);
              }
              return false;
            });
          };

          if (commentExists(prevComments, newComment.id)) {
            console.log('Comment already exists, skipping:', newComment.id);
            return prevComments;
          }

          // Helper to add comment to tree
          const addCommentToTree = (list, comment) => {
            if (!comment.parent_comment) {
              return [...list, comment];
            }
            return list.map(c => {
              if (c.id === comment.parent_comment) {
                return {
                  ...c,
                  replies: [...(c.replies || []), comment]
                };
              } else if (c.replies && c.replies.length > 0) {
                return {
                  ...c,
                  replies: addCommentToTree(c.replies, comment)
                };
              }
              return c;
            });
          };

          const updated = addCommentToTree(prevComments, newComment);
          return updated;
        });
      }
    };

    newWs.onclose = () => {
      console.log('WebSocket disconnected for document:', documentId);
    };

    newWs.onerror = (err) => {
      console.error('WebSocket error for document:', documentId, err);
    };

    return () => {
      console.log('Cleaning up WebSocket for document:', documentId);
      newWs.close();
    };
  }, [documentId, fetchComments, location.search]);

  if (!documentId) {
    return <div className="text-center py-4 text-gray-600">Save the document to enable comments.</div>;
  }

  if (loading) return <div className="text-center py-4">Loading comments...</div>;
  if (error) return <div className="text-center py-4 text-red-500">{error}</div>;

  return (
    <div className="comment-section bg-card/40 p-4 rounded-lg shadow-md">
      <h3 className="text-xl font-bold mb-4 text-foreground">Comments</h3>
      <CommentForm documentId={documentId} onCommentAdded={() => fetchComments(true)} />
      <div className="comments-list mt-6 overflow-y-auto custom-scrollbar">
        {comments.length === 0 ? (
          <p className="text-muted-foreground">No comments.</p>
        ) : (
          comments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              documentId={documentId}
              onCommentAdded={() => fetchComments(true)}
              highlightCommentId={highlightCommentId} // Pass highlight ID
            />
          ))
        )}
      </div>
    </div>
  );
};

export default CommentList;