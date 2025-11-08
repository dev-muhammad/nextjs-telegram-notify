'use client';

import { useState } from 'react';
import { useTelegramNotify } from 'nextjs-telegram-notify';
import Link from 'next/link';

/**
 * Security Testing Page
 * 
 * Demonstrates:
 * - Rate limiting behavior
 * - CORS protection
 * - Error handling
 */
export default function SecurityTestPage() {
  const { send, loading } = useTelegramNotify({
    endpoint: '/api/telegram-notify-secure',
  });
  
  const [log, setLog] = useState<string[]>([]);
  const [testCount, setTestCount] = useState(0);
  
  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLog(prev => [...prev, `[${timestamp}] ${message}`]);
  };

  const testRateLimit = async () => {
    addLog('🔄 Starting rate limit test (sending 15 requests)...');
    setTestCount(0);
    
    for (let i = 1; i <= 15; i++) {
      setTestCount(i);
      try {
        await send({
          message: `Rate limit test #${i}`,
          disableNotification: true,
        });
        addLog(`✅ Request ${i} succeeded`);
      } catch (error: any) {
        if (error.message?.includes('Rate limit exceeded')) {
          addLog(`⛔ Request ${i} rate limited: ${error.message}`);
        } else {
          addLog(`❌ Request ${i} failed: ${error.message}`);
        }
      }
      
      // Small delay between requests
      await new Promise(resolve => setTimeout(resolve, 200));
    }
    
    addLog('🏁 Rate limit test completed');
  };

  const testSingleRequest = async () => {
    addLog('📤 Sending single test notification...');
    try {
      await send({
        message: `Single test at ${new Date().toLocaleString()}`,
      });
      addLog('✅ Single request succeeded');
    } catch (error: any) {
      addLog(`❌ Single request failed: ${error.message}`);
    }
  };

  const clearLog = () => {
    setLog([]);
    setTestCount(0);
  };

  return (
    <div className="container">
      <div className="nav">
        <Link href="/">← Back to Home</Link>
      </div>

      <div className="example-card">
        <h1>🔒 Security Testing</h1>
        <p>Test rate limiting and security features</p>

        {/* Configuration Info */}
        <div style={{ 
          background: '#f9f9f9', 
          border: '1px solid #e0e0e0',
          borderRadius: '8px', 
          padding: '1.5rem', 
          marginBottom: '1.5rem' 
        }}>
          <h2 style={{ marginBottom: '1rem', fontSize: '1.25rem' }}>Configuration</h2>
          <div style={{ color: '#555' }}>
            <p style={{ marginBottom: '0.5rem' }}>• <strong>Rate Limit:</strong> 10 requests per minute per IP</p>
            <p style={{ marginBottom: '0.5rem' }}>• <strong>CORS:</strong> Restricted to {process.env.NEXT_PUBLIC_APP_URL || 'localhost:3000'}</p>
            <p>• <strong>Global Limit:</strong> 30 requests per second (Telegram API)</p>
          </div>
        </div>

        {/* Test Controls */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
          gap: '1rem', 
          marginBottom: '1.5rem' 
        }}>
          <button
            onClick={testSingleRequest}
            disabled={loading}
            className="button"
          >
            📤 Single Request
          </button>
          
          <button
            onClick={testRateLimit}
            disabled={loading}
            className="button"
            style={{ background: '#ff9500' }}
          >
            🔄 Test Rate Limit (15x)
          </button>
          
          <button
            onClick={clearLog}
            disabled={loading}
            className="button button-secondary"
          >
            🗑️ Clear Log
          </button>
        </div>

        {/* Progress */}
        {testCount > 0 && (
          <div style={{ marginBottom: '1.5rem' }}>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              marginBottom: '0.5rem',
              color: '#333'
            }}>
              <span>Progress: {testCount}/15</span>
              <span>{Math.round((testCount / 15) * 100)}%</span>
            </div>
            <div style={{ 
              width: '100%', 
              background: '#e0e0e0', 
              borderRadius: '4px', 
              height: '10px',
              overflow: 'hidden'
            }}>
              <div 
                style={{ 
                  background: '#0070f3',
                  height: '100%', 
                  transition: 'width 0.3s',
                  width: `${(testCount / 15) * 100}%`
                }}
              />
            </div>
          </div>
        )}

        {/* Log Display */}
        <div style={{ 
          background: '#f9f9f9', 
          border: '1px solid #e0e0e0',
          borderRadius: '8px', 
          padding: '1.5rem'
        }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            marginBottom: '1rem' 
          }}>
            <h2 style={{ margin: 0, fontSize: '1.25rem' }}>Activity Log</h2>
            <span style={{ color: '#999', fontSize: '0.875rem' }}>{log.length} events</span>
          </div>
          
          <div style={{ 
            background: '#fff',
            border: '1px solid #ddd',
            borderRadius: '4px', 
            padding: '1rem', 
            height: '400px', 
            overflowY: 'auto',
            fontFamily: 'monospace',
            fontSize: '0.875rem'
          }}>
            {log.length === 0 ? (
              <p style={{ color: '#999', textAlign: 'center', padding: '2rem 0' }}>
                No activity yet. Run a test to see results.
              </p>
            ) : (
              <div>
                {log.map((entry, i) => (
                  <div 
                    key={i}
                    style={{
                      marginBottom: '0.25rem',
                      color: entry.includes('✅') ? '#0a0' :
                             entry.includes('⛔') ? '#c00' :
                             entry.includes('❌') ? '#c44' :
                             entry.includes('🔄') || entry.includes('🏁') ? '#0070f3' :
                             '#333',
                      fontWeight: (entry.includes('🔄') || entry.includes('🏁')) ? 'bold' : 'normal'
                    }}
                  >
                    {entry}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Info Box */}
        <div style={{ 
          marginTop: '1.5rem',
          background: '#e6f2ff',
          border: '1px solid #99ccff',
          borderRadius: '8px',
          padding: '1rem'
        }}>
          <h3 style={{ color: '#0051cc', marginBottom: '0.5rem' }}>💡 What to observe:</h3>
          <ul style={{ 
            color: '#0070f3',
            fontSize: '0.875rem',
            marginLeft: '1.25rem'
          }}>
            <li style={{ marginBottom: '0.25rem' }}>First 10 requests should succeed</li>
            <li style={{ marginBottom: '0.25rem' }}>Requests 11-15 will be rate limited (429 status)</li>
            <li style={{ marginBottom: '0.25rem' }}>Wait 60 seconds for rate limit to reset</li>
            <li>Check rate limit headers in Network tab</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
