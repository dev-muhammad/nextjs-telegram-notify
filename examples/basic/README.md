# Next.js Telegram Notify Examples

This directory contains working examples of the `nextjs-telegram-notify` package.

## Setup

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Fill in your Telegram credentials in `.env`:
   - `TELEGRAM_BOT_TOKEN`: Get from [@BotFather](https://t.me/botfather)
   - `TELEGRAM_CHAT_ID`: Get from [@userinfobot](https://t.me/userinfobot)

3. Install dependencies:
   ```bash
   npm install
   ```

4. Run the development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000)

## Examples Included

### 📬 Contact Form (`/contact-form`)
Full contact form with name, email, and message fields. Demonstrates:
- Form state management
- Client-side validation
- Success/error handling
- Form reset on successful submission
- HTML formatted messages

### 🐛 Bug Report (`/bug-report`)
One-click bug reporting with automatic context capture. Shows:
- Capturing browser information (user agent, screen size)
- Current page URL
- Timestamp
- Simple button-based interaction

### ✏️ Typo Reporter (`/typo-report`)
Report typos with selected text and suggestions. Features:
- Text selection simulation
- Context capture
- Optional correction suggestions
- Helpful implementation tips

### ⭐ Feedback Widget (`/feedback`)
User ratings and feedback collection. Includes:
- Interactive 5-star rating system
- Category selection dropdown
- Optional email for follow-up
- Comprehensive feedback form

### 📸 File Upload (`/file-upload`)
Send files and attachments to Telegram. Demonstrates:
- Drag and drop file upload
- File type validation
- File size validation
- Visual file preview
- File attachment sending
- Support for images, PDFs, and documents

## How It Works

The examples use the `useTelegramNotify` hook to send notifications to your Telegram chat. The hook communicates with the `/api/telegram-notify` route which handles the server-side Telegram API calls.

### Key Features Demonstrated

- **Client-side Hook**: `useTelegramNotify()` for React components
- **Loading States**: Disable buttons during submission
- **Error Handling**: Display error messages to users
- **Success Feedback**: Show success messages and reset forms
- **File Uploads**: Send attachments with notifications
- **HTML Formatting**: Rich text formatting in Telegram messages
- **User Context**: Capture browser and page information

## Project Structure

```
app/
├── api/
│   └── telegram-notify/
│       └── route.ts           # API route handler
├── contact-form/
│   └── page.tsx               # Contact form example
├── bug-report/
│   └── page.tsx               # Bug report example
├── typo-report/
│   └── page.tsx               # Typo reporter example
├── feedback/
│   └── page.tsx               # Feedback widget example
├── file-upload/
│   └── page.tsx               # File upload example
├── layout.tsx                 # Root layout
├── page.tsx                   # Homepage
└── globals.css                # Global styles
```

## Customization

Feel free to modify these examples for your own use cases:
- Change the message formatting
- Add more form fields
- Customize the styling
- Add validation rules
- Implement rate limiting
- Add CAPTCHA protection
