'use client'; // 🔹 这是客户端组件

import Link from "next/link";

export default function HomeButton() {
  return (
    <>
      <Link
        href="/"
        className="fixed top-4 left-4 z-50 w-12 h-12 flex items-center justify-center bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-100 rounded-full shadow hover:bg-gray-300 dark:hover:bg-gray-600 transition-transform duration-300 transform hover:scale-110 animate-bounce-slow"
        aria-label="回到首页"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-6 w-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
      </Link>

      {/* 🔹 自定义动画 */}
      <style jsx>{`
        @keyframes bounce-slow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-6px); }
        }
        .animate-bounce-slow {
          animation: bounce-slow 2s infinite;
        }
      `}</style>
    </>
  );
}