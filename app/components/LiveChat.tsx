'use client';

import { useState } from 'react';

export default function LiveChat() {
  const [isOpen, setIsOpen] = useState(false);

  const handleChatClick = () => {
    // Here you can integrate with your preferred chat service
    // For example: Intercom, Zendesk, Tidio, etc.
    // For now, we'll just toggle a simple chat window
    setIsOpen(!isOpen);

    // Example integration with Intercom (if you have it installed):
    // if (window.Intercom) {
    //   window.Intercom('show');
    // }
  };

  return (
    <>
      <button
        onClick={handleChatClick}
        className="fixed bottom-6 right-6 bg-teal-600 hover:bg-teal-700 text-white p-4 rounded-full shadow-lg transition-all duration-300 z-50 group"
        aria-label="Live chat"
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

      {/* Simple chat window placeholder - you can replace this with your actual chat widget */}
      {isOpen && (
        <div className="fixed bottom-20 right-6 w-80 h-96 bg-white rounded-lg shadow-xl z-50 border border-gray-200">
          <div className="bg-teal-600 text-white p-4 rounded-t-lg flex justify-between items-center">
            <h3 className="font-semibold">چت آنلاین</h3>
            <button
              onClick={() => setIsOpen(false)}
              className="text-white hover:text-gray-200"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="p-4 h-64 overflow-y-auto">
            <div className="text-center text-gray-500 mt-8">
              <p>سیستم چت آنلاین در حال راه‌اندازی است</p>
              <p className="text-sm mt-2">برای ارتباط با ما از طریق تلفن یا ایمیل استفاده کنید</p>
            </div>
          </div>
          <div className="p-4 border-t">
            <p className="text-sm text-gray-600 text-center">
              📞 ۰۲۱-۱۲۳۴۵۶۷۸ | ✉️ info@bebimart.ir
            </p>
          </div>
        </div>
      )}
    </>
  );
}
