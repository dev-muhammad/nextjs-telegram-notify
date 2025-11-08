import { useState, useCallback } from 'react';
import type {
  NotifyOptions,
  UseTelegramNotifyReturn,
  TelegramNotifyConfig,
  TelegramNotifyRequest,
  TelegramNotifyResponse,
} from '../types';
import { fileToBase64 } from '../lib/formatter';

/**
 * React hook for sending Telegram notifications from client components
 * 
 * @example
 * ```tsx
 * 'use client';
 * 
 * import { useTelegramNotify } from 'nextjs-telegram-notify';
 * 
 * export default function MyForm() {
 *   const { send, loading, error } = useTelegramNotify();
 * 
 *   const handleSubmit = async (e) => {
 *     e.preventDefault();
 *     await send({
 *       message: 'Hello from Next.js!',
 *       parseMode: 'HTML'
 *     });
 *   };
 * 
 *   return (
 *     <form onSubmit={handleSubmit}>
 *       <button disabled={loading}>Send</button>
 *       {error && <p>{error.message}</p>}
 *     </form>
 *   );
 * }
 * ```
 */
export function useTelegramNotify(
  config: TelegramNotifyConfig = {}
): UseTelegramNotifyReturn {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [success, setSuccess] = useState(false);

  const endpoint = config.endpoint || '/api/telegram-notify';

  const send = useCallback(
    async (options: NotifyOptions) => {
      setLoading(true);
      setError(null);
      setSuccess(false);

      try {
        const { message, parseMode, chatId, disableNotification, threadId, files } = options;

        // Prepare request body
        const body: TelegramNotifyRequest = {
          message,
          parseMode,
          chatId,
          disableNotification,
          threadId,
        };

        // Convert files to base64 if provided
        if (files && files.length > 0) {
          const filePromises = (files as File[]).map(async (file) => ({
            name: file.name,
            type: file.type,
            data: await fileToBase64(file),
          }));

          body.files = await Promise.all(filePromises);
        }

        // Send request to API route
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(body),
        });

        const result: TelegramNotifyResponse = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(result.error || 'Failed to send notification');
        }

        setSuccess(true);
        
        // Call success callback
        if (config.onSuccess) {
          config.onSuccess();
        }
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Unknown error');
        setError(error);

        // Call error callback
        if (config.onError) {
          config.onError(error);
        }

        throw error;
      } finally {
        setLoading(false);
      }
    },
    [endpoint, config]
  );

  const reset = useCallback(() => {
    setLoading(false);
    setError(null);
    setSuccess(false);
  }, []);

  return {
    send,
    loading,
    error,
    success,
    reset,
  };
}
