import React, { useState, useRef, useEffect } from 'react';
import CommentForm from './CommentForm';



const CommentItem = ({ comment, documentId, onCommentAdded, highlightCommentId }) => {
  const [showReplyForm, setShowReplyForm] = useState(false);
  const commentRef = useRef(null); // Ref for this comment item

  useEffect(() => {
    if (highlightCommentId && comment.id === highlightCommentId && commentRef.current) {
      commentRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      // Add a temporary highlight class
      commentRef.current.classList.add('highlight-comment');
      const timer = setTimeout(() => {
        commentRef.current.classList.remove('highlight-comment');
      }, 3000); // Remove highlight after 3 seconds
      return () => clearTimeout(timer);
    }
  }, [highlightCommentId, comment.id]);

  const handleReplyAdded = () => {
    setShowReplyForm(false);
    onCommentAdded(); // Refresh comments after a reply is added
  };



  return (
    <div
      ref={commentRef}
      id={`comment-${comment.id}`} // Add ID for direct linking
      className={`mb-4 p-3 border border-border/50 rounded-lg shadow-lg shadow-primary/10 transition-all duration-300 ${
        highlightCommentId === comment.id ? 'ring-2 ring-primary ring-offset-2' : ''
      }`}
    >
      <div className="flex justify-between items-center mb-2">
        <p className="font-semibold text-foreground">{comment.user}</p>
        <p className="text-sm text-muted-foreground">{new Date(comment.created_at).toLocaleString()}</p>
      </div>
      <p className="text-foreground mb-3" style={{wordBreak: 'break-word'}}>{comment.content}</p>
      <div className="flex items-center gap-3">
        <button
          onClick={() => setShowReplyForm(!showReplyForm)}
          className="text-primary hover:text-primary-foreground text-sm font-medium"
        >
          {showReplyForm ? 'Cancel Reply' : 'Reply'}
        </button>

      </div>

      {showReplyForm && (
        <div className="mt-3 pl-4 border-l-2 border-primary/50">
          <CommentForm
            documentId={documentId}
            parentCommentId={comment.id}
            onCommentAdded={handleReplyAdded}
            placeholder={`Replying to ${comment.user}...`}
          />
        </div>
      )}

      {comment.replies && comment.replies.length > 0 && (
        <div className="ml-6 mt-4 border-l-2 border-border/50 pl-4">
          {comment.replies.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              documentId={documentId}
              onCommentAdded={onCommentAdded}
              highlightCommentId={highlightCommentId} // Pass highlight ID to replies
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default CommentItem;