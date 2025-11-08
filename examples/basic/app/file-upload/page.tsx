'use client';

import { useTelegramNotify, validateFileSize, validateFileType } from 'nextjs-telegram-notify';
import { useState } from 'react';
import Link from 'next/link';

export default function FileUploadPage() {
  const { send, loading, success, reset, error } = useTelegramNotify();
  const [file, setFile] = useState<File | null>(null);
  const [description, setDescription] = useState('');
  const [fileError, setFileError] = useState('');
  const [dragActive, setDragActive] = useState(false);

  const allowedTypes = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
  ];

  const maxSize = 10 * 1024 * 1024; // 10MB (Telegram supports up to 50MB, but we'll limit to 10MB for demo)

  const validateFile = (selectedFile: File): boolean => {
    setFileError('');

    if (!validateFileSize(selectedFile, maxSize)) {
      setFileError(`File size must be less than ${maxSize / 1024 / 1024}MB`);
      return false;
    }

    if (!validateFileType(selectedFile, allowedTypes)) {
      setFileError('File type not supported. Please upload an image, PDF, or document.');
      return false;
    }

    return true;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (validateFile(selectedFile)) {
        setFile(selectedFile);
      } else {
        setFile(null);
      }
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) {
      if (validateFile(droppedFile)) {
        setFile(droppedFile);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!file) {
      setFileError('Please select a file');
      return;
    }

    const message = `
📎 <b>File Upload</b>

📄 <b>File Name:</b> ${file.name}
📦 <b>File Size:</b> ${(file.size / 1024).toFixed(2)} KB
📋 <b>File Type:</b> ${file.type}

${description ? `💬 <b>Description:</b>\n${description}\n` : ''}
⏰ <b>Time:</b> ${new Date().toLocaleString()}
    `.trim();

    await send({
      message,
      files: [file],
      parseMode: 'HTML',
    });
  };

  const handleReset = () => {
    reset();
    setFile(null);
    setDescription('');
    setFileError('');
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / 1024 / 1024).toFixed(2) + ' MB';
  };

  return (
    <div className="container">
      <div className="nav">
        <Link href="/">← Back to Home</Link>
      </div>

      <div className="example-card">
        <h1>📸 File Upload</h1>
        <p>Upload files and send them to Telegram</p>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>File Upload *</label>
            
            {/* Drag and Drop Area */}
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              style={{
                border: `2px dashed ${dragActive ? '#0070f3' : '#ddd'}`,
                borderRadius: '8px',
                padding: '2rem',
                textAlign: 'center',
                background: dragActive ? '#f0f7ff' : '#fafafa',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              <input
                type="file"
                id="fileInput"
                onChange={handleFileChange}
                accept={allowedTypes.join(',')}
                style={{ display: 'none' }}
              />
              
              <label
                htmlFor="fileInput"
                style={{
                  cursor: 'pointer',
                  display: 'block',
                }}
              >
                {file ? (
                  <div>
                    <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>
                      {file.type.startsWith('image/') ? '🖼️' : '📄'}
                    </div>
                    <p style={{ margin: 0, fontWeight: 'bold', color: '#333' }}>
                      {file.name}
                    </p>
                    <p style={{ margin: '0.25rem 0 0 0', color: '#666', fontSize: '0.9rem' }}>
                      {formatFileSize(file.size)}
                    </p>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        setFile(null);
                        setFileError('');
                      }}
                      style={{
                        marginTop: '1rem',
                        padding: '0.5rem 1rem',
                        background: '#f44336',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                      }}
                    >
                      ✕ Remove File
                    </button>
                  </div>
                ) : (
                  <div>
                    <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>
                      📁
                    </div>
                    <p style={{ margin: 0, color: '#333' }}>
                      <strong>Click to upload</strong> or drag and drop
                    </p>
                    <p style={{ margin: '0.5rem 0 0 0', color: '#666', fontSize: '0.85rem' }}>
                      Images, PDF, Documents (max {maxSize / 1024 / 1024}MB)
                    </p>
                  </div>
                )}
              </label>
            </div>

            {fileError && (
              <p style={{ color: '#f44336', marginTop: '0.5rem', fontSize: '0.9rem' }}>
                ⚠️ {fileError}
              </p>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="description">Description (Optional)</label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add a description for this file..."
              rows={4}
            />
          </div>

          <button
            type="submit"
            className="button"
            disabled={loading || !file}
          >
            {loading ? 'Uploading...' : '📤 Upload to Telegram'}
          </button>

          {success && (
            <button
              type="button"
              className="button button-secondary"
              onClick={handleReset}
            >
              Upload Another File
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
            <strong>Success!</strong> File uploaded and sent to Telegram.
          </div>
        )}

        <div style={{ marginTop: '2rem', padding: '1rem', background: '#f9f9f9', borderRadius: '4px' }}>
          <h3 style={{ marginBottom: '0.5rem', fontSize: '1rem' }}>📌 Supported File Types</h3>
          <ul style={{ margin: '0.5rem 0 0 1.5rem', fontSize: '0.9rem', color: '#666' }}>
            <li>Images: JPEG, PNG, GIF, WebP</li>
            <li>Documents: PDF, DOC, DOCX, TXT</li>
            <li>Maximum size: {maxSize / 1024 / 1024}MB</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
