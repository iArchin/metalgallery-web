'use client';

import { useState } from 'react';

export default function LiveChat() {
  const [isOpen, setIsOpen] = useState(false);

  const handleChatClick = () => {
    setIsOpen(!isOpen);
  };

  return (
    <>
      <button
        onClick={handleChatClick}
        className="fixed bottom-6 right-6 bg-primary hover:bg-primary-hover text-primary-content p-4 rounded-full shadow-lg shadow-primary/30 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 z-50 group"
        aria-label="چت آنلاین"
      >
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
          />
        </svg>
      </button>

      {isOpen && (
        <div className="fixed bottom-20 right-6 w-80 h-96 bg-surface rounded-2xl shadow-xl z-50 border border-border overflow-hidden">
          <div className="bg-primary text-primary-content p-4 flex justify-between items-center">
            <h3 className="font-bold">چت آنلاین</h3>
            <button
              onClick={() => setIsOpen(false)}
              className="text-primary-content/80 hover:text-primary-content transition-colors"
              aria-label="بستن"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="p-4 h-64 overflow-y-auto">
            <div className="text-center text-content-muted mt-8">
              <p>سیستم چت آنلاین در حال راه‌اندازی است</p>
              <p className="text-sm mt-2">برای ارتباط با ما از طریق تلفن یا ایمیل استفاده کنید</p>
            </div>
          </div>
          <div className="p-4 border-t border-border">
            <p className="text-sm text-content-muted text-center">
              📞 ۰۲۱-۱۲۳۴۵۶۷۸ | ✉️ info@metalgallery.ir
            </p>
          </div>
        </div>
      )}
    </>
  );
}
