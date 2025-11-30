import React, { useState } from 'react';
import axios from '../../api/axios'; // Assuming axios is configured here

const CommentForm = ({ documentId, parentCommentId = null, onCommentAdded, placeholder = "Add a comment..." }) => {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const payload = {
        document_id: documentId,
        content: content,
        parent_comment: parentCommentId,
        // position: {} // Add position data if available from the document editor
      };
      await axios.post(`/api/documents/${documentId}/comments/`, payload);
      setContent('');
      if (onCommentAdded) {
        onCommentAdded();
      }
    } catch (err) {
      console.error('Error posting comment:', err);
      setError('Failed to post comment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mb-4">
      <textarea
        className="w-full p-2 border border-border/50 rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-input text-foreground placeholder-muted-foreground"
        rows="3"
        placeholder={placeholder}
        value={content}
        onChange={(e) => setContent(e.target.value)}
        disabled={loading}
      ></textarea>
      {error && <p className="text-destructive text-sm mt-1">{error}</p>}
      <button
        type="submit"
        className="mt-2 px-4 py-2 bg-primary text-primary-foreground font-semibold rounded-md hover:bg-primary/80 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
        disabled={loading}
      >
        {loading ? 'Posting...' : 'Post Comment'}
      </button>
    </form>
  );
};

export default CommentForm;
