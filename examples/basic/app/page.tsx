import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="container">
      <div className="header">
        <h1>📱 Next.js Telegram Notify</h1>
        <p>Examples for sending notifications to Telegram</p>
      </div>

      <div className="examples">
        <div className="example-card">
          <h2>📬 Contact Form</h2>
          <p>Send contact form submissions to Telegram</p>
          <Link href="/contact-form">
            <button className="button">View Example</button>
          </Link>
        </div>

        <div className="example-card">
          <h2>🐛 Bug Report</h2>
          <p>Allow users to report bugs with context</p>
          <Link href="/bug-report">
            <button className="button">View Example</button>
          </Link>
        </div>

        <div className="example-card">
          <h2>✏️ Typo Reporter</h2>
          <p>Report typos on your website</p>
          <Link href="/typo-report">
            <button className="button">View Example</button>
          </Link>
        </div>

        <div className="example-card">
          <h2>⭐ Feedback Widget</h2>
          <p>Collect user feedback and ratings</p>
          <Link href="/feedback">
            <button className="button">View Example</button>
          </Link>
        </div>

        <div className="example-card">
          <h2>📸 File Upload</h2>
          <p>Send files and attachments</p>
          <Link href="/file-upload">
            <button className="button">View Example</button>
          </Link>
        </div>

        <div className="example-card">
          <h2>🔒 Security Test</h2>
          <p>Test rate limiting and security features</p>
          <Link href="/security-test">
            <button className="button">View Example</button>
          </Link>
        </div>
      </div>
    </div>
  );
}
