'use client';

import { useTelegramNotify } from 'nextjs-telegram-notify';
import { useState } from 'react';
import Link from 'next/link';

export default function TypoReportPage() {
  const { send, loading, success, reset } = useTelegramNotify();
  const [selectedText, setSelectedText] = useState('');
  const [context, setContext] = useState('');
  const [suggestion, setSuggestion] = useState('');

  const handleSelectionDemo = () => {
    // Simulate text selection
    const demoText = 'This is a sampel text with a typo.';
    setSelectedText('sampel');
    setContext(demoText);
  };

  const reportTypo = async (e: React.FormEvent) => {
    e.preventDefault();

    const message = `
✏️ <b>Typo Report</b>

📍 <b>Page:</b> ${window.location.pathname}
📝 <b>Selected Text:</b> "${selectedText}"
🔍 <b>Context:</b> "${context}"
${suggestion ? `💡 <b>Suggestion:</b> "${suggestion}"` : ''}

🖥️ <b>User Agent:</b> ${navigator.userAgent}
⏰ <b>Time:</b> ${new Date().toLocaleString()}

<i>User reported a potential typo</i>
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
        <h1>✏️ Typo Reporter</h1>
        <p>
          Report typos found on the website. In a real implementation, users
          would select text on the page.
        </p>

        <button onClick={handleSelectionDemo} className="button button-secondary" style={{ marginBottom: '1.5rem' }}>
          📝 Demo: Simulate Text Selection
        </button>

        <form onSubmit={reportTypo}>
          <div className="form-group">
            <label htmlFor="selectedText">Selected Text *</label>
            <input
              id="selectedText"
              type="text"
              value={selectedText}
              onChange={(e) => setSelectedText(e.target.value)}
              required
              placeholder="The text with the typo"
            />
          </div>

          <div className="form-group">
            <label htmlFor="context">Context</label>
            <textarea
              id="context"
              value={context}
              onChange={(e) => setContext(e.target.value)}
              placeholder="Surrounding text for context (optional)"
              rows={3}
            />
          </div>

          <div className="form-group">
            <label htmlFor="suggestion">Your Suggestion (Optional)</label>
            <input
              id="suggestion"
              type="text"
              value={suggestion}
              onChange={(e) => setSuggestion(e.target.value)}
              placeholder="How it should be corrected"
            />
          </div>

          <button type="submit" className="button" disabled={loading}>
            {loading ? 'Sending...' : '✏️ Report Typo'}
          </button>

          {success && (
            <button
              type="button"
              className="button button-secondary"
              onClick={() => {
                reset();
                setSelectedText('');
                setContext('');
                setSuggestion('');
              }}
            >
              Report Another
            </button>
          )}
        </form>

        {success && (
          <div className="message success">
            <strong>Success!</strong> Typo report sent. Thank you for helping
            improve our content!
          </div>
        )}

        <div style={{ marginTop: '2rem', padding: '1rem', background: '#f9f9f9', borderRadius: '4px' }}>
          <h3 style={{ marginBottom: '0.5rem', fontSize: '1rem' }}>💡 Implementation Tip</h3>
          <p style={{ margin: 0, fontSize: '0.9rem', color: '#666' }}>
            In a real implementation, you can capture text selection with:
            <code style={{ display: 'block', marginTop: '0.5rem', padding: '0.5rem', background: 'white', borderRadius: '4px' }}>
              window.getSelection().toString()
            </code>
          </p>
        </div>
      </div>
    </div>
  );
}
