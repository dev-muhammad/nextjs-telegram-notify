'use client';

import { useTelegramNotify } from 'nextjs-telegram-notify';
import Link from 'next/link';

export default function BugReportPage() {
  const { send, loading, success } = useTelegramNotify();

  const reportBug = async () => {
    const bugInfo = {
      url: window.location.href,
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString(),
      screenSize: `${window.screen.width}x${window.screen.height}`,
    };

    const message = `
🐛 <b>Bug Report</b>

📄 <b>Page:</b> ${bugInfo.url}
🖥️ <b>User Agent:</b> ${bugInfo.userAgent}
📱 <b>Screen:</b> ${bugInfo.screenSize}
⏰ <b>Time:</b> ${bugInfo.timestamp}

<i>User reported a bug on this page</i>
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
        <h1>🐛 Bug Report</h1>
        <p>
          Click the button below to send a bug report with page context to
          Telegram
        </p>

        <button onClick={reportBug} className="button" disabled={loading}>
          {loading ? 'Sending...' : '🐛 Report Bug'}
        </button>

        {success && (
          <div className="message success">
            <strong>Success!</strong> Bug report sent to Telegram. Thank you!
          </div>
        )}
      </div>
    </div>
  );
}
