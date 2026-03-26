import './globals.css';

export const metadata = {
  title: {
    default: 'HuRui.dev',
    template: '%s | HuRui.dev',
  },
  description: '记录前端知识体系与工程化实践',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh">
      <body className="bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors duration-300">
        {children}
      </body>
    </html>
  );
}
