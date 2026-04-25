'use client'
import React from 'react'
import { useRouter } from 'next/navigation'

export default function Banner() {
  const [isOpen, setIsOpen] = React.useState(true);
  const router = useRouter();

  const handleCreateStore = () => {
    setIsOpen(false);
    router.push('/create-store');
  };

  return isOpen && (
    <div className="w-full px-4 sm:px-6 py-2 font-medium text-sm text-white bg-gradient-to-r from-green-600 via-green-500 to-green-400">
      <div className='flex items-center justify-between gap-3 max-w-7xl mx-auto'>
        <p className="text-left sm:text-center text-xs sm:text-sm">
          Start selling on ABOABO today. Open your store in minutes.
        </p>
        
        <div className="flex items-center space-x-3 sm:space-x-6 shrink-0">
          <button
            onClick={handleCreateStore}
            type="button"
            className="font-normal text-green-700 bg-white px-4 sm:px-7 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm"
          >
            Create Store
          </button>

          <button
            onClick={() => setIsOpen(false)}
            type="button"
            className="font-normal text-gray-800 py-2 rounded-full"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <rect y="12.532" width="17.498" height="2.1" rx="1.05" transform="rotate(-45.74 0 12.532)" fill="#fff" />
              <rect x="12.533" y="13.915" width="17.498" height="2.1" rx="1.05" transform="rotate(-135.74 12.533 13.915)" fill="#fff" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
