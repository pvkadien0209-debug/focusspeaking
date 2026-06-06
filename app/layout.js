import './globals.css';

export const metadata = {
  title: 'FocusSpeaking – Học tiếng Anh bằng giọng nói',
  description: 'Phương pháp học tiếng Anh tập trung vào nói – trả lời trắc nghiệm bằng giọng nói',
};

export default function RootLayout({ children }) {
  return (
    <html lang="vi">
      <body>{children}</body>
    </html>
  );
}
