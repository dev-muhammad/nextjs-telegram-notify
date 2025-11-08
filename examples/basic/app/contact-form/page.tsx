'use client';

import { useTelegramNotify } from 'nextjs-telegram-notify';
import { useState } from 'react';
import Link from 'next/link';

export default function ContactFormPage() {
  const { send, loading, error, success, reset } = useTelegramNotify({
    onSuccess: () => {
      setFormData({ name: '', email: '', message: '' });
    },
  });

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const message = `
📬 <b>New Contact Form Submission</b>

👤 <b>Name:</b> ${formData.name}
📧 <b>Email:</b> ${formData.email}
💬 <b>Message:</b>
${formData.message}

⏰ ${new Date().toLocaleString()}
    `.trim();

    await send({
      message,
      parseMode: 'HTML',
    });
  };

  return (
    <div className="container">
      <div className="nav">
        <Link href="/">← Back to Home</Link>
      </div>

      <div className="example-card">
        <h1>📬 Contact Form</h1>
        <p>Fill out the form below to send a message via Telegram</p>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="name">Name *</label>
            <input
              id="name"
              type="text"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              required
              placeholder="John Doe"
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">Email *</label>
            <input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              required
              placeholder="john@example.com"
            />
          </div>

          <div className="form-group">
            <label htmlFor="message">Message *</label>
            <textarea
              id="message"
              value={formData.message}
              onChange={(e) =>
                setFormData({ ...formData, message: e.target.value })
              }
              required
              placeholder="Your message here..."
            />
          </div>

          <button type="submit" className="button" disabled={loading}>
            {loading ? 'Sending...' : 'Send Message'}
          </button>

          {success && (
            <button
              type="button"
              className="button button-secondary"
              onClick={reset}
            >
              Send Another
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
            <strong>Success!</strong> Your message has been sent to Telegram.
          </div>
        )}
      </div>
    </div>
  );
}
