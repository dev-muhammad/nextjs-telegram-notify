'use client';

import { useTelegramNotify } from 'nextjs-telegram-notify';
import { useState } from 'react';
import Link from 'next/link';

export default function FeedbackPage() {
  const { send, loading, success, reset, error } = useTelegramNotify();
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [category, setCategory] = useState('');
  const [comment, setComment] = useState('');
  const [email, setEmail] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const ratingStars = '⭐'.repeat(rating);
    const message = `
⭐ <b>User Feedback</b>

${ratingStars} <b>Rating:</b> ${rating}/5
📁 <b>Category:</b> ${category}
💬 <b>Comment:</b>
${comment}

${email ? `📧 <b>Email:</b> ${email}` : ''}

📍 <b>Page:</b> ${window.location.pathname}
⏰ <b>Time:</b> ${new Date().toLocaleString()}
    `.trim();

    await send({
      message,
      parseMode: 'HTML',
    });
  };

  const handleReset = () => {
    reset();
    setRating(0);
    setCategory('');
    setComment('');
    setEmail('');
  };

  return (
    <div className="container">
      <div className="nav">
        <Link href="/">← Back to Home</Link>
      </div>

      <div className="example-card">
        <h1>⭐ Feedback Widget</h1>
        <p>Share your feedback and help us improve</p>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Rating *</label>
            <div style={{ display: 'flex', gap: '0.5rem', fontSize: '2rem' }}>
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '0.25rem',
                    transition: 'transform 0.2s',
                  }}
                  onMouseDown={(e) => {
                    e.currentTarget.style.transform = 'scale(1.2)';
                  }}
                  onMouseUp={(e) => {
                    e.currentTarget.style.transform = 'scale(1)';
                  }}
                >
                  {star <= (hoverRating || rating) ? '⭐' : '☆'}
                </button>
              ))}
            </div>
            {rating > 0 && (
              <p style={{ marginTop: '0.5rem', color: '#666', fontSize: '0.9rem' }}>
                You selected {rating} star{rating !== 1 ? 's' : ''}
              </p>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="category">Category *</label>
            <select
              id="category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              required
            >
              <option value="">Select a category</option>
              <option value="Bug Report">🐛 Bug Report</option>
              <option value="Feature Request">💡 Feature Request</option>
              <option value="User Experience">🎨 User Experience</option>
              <option value="Performance">⚡ Performance</option>
              <option value="Documentation">📚 Documentation</option>
              <option value="Other">📌 Other</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="comment">Your Feedback *</label>
            <textarea
              id="comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              required
              placeholder="Tell us what you think..."
              rows={5}
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">Email (Optional)</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
            />
            <p style={{ fontSize: '0.85rem', color: '#666', marginTop: '0.25rem' }}>
              Provide your email if you'd like us to follow up
            </p>
          </div>

          <button
            type="submit"
            className="button"
            disabled={loading || rating === 0}
          >
            {loading ? 'Sending...' : '📤 Submit Feedback'}
          </button>

          {success && (
            <button
              type="button"
              className="button button-secondary"
              onClick={handleReset}
            >
              Submit More Feedback
            </button>
          )}
        </form>

        {error && (
          <div className="message error">
            <strong>Error:</strong> {error.message}
          </div>
        )}

        {success && (
          <div className="message success">
            <strong>Thank you!</strong> Your feedback has been sent. We
            appreciate your input!
          </div>
        )}
      </div>
    </div>
  );
}
