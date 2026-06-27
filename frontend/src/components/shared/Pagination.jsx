/**
 * Pagination.jsx
 * Reusable pagination control used across all admin tables.
 *
 * Props:
 *   currentPage  {number}   - 1-based current page
 *   totalPages   {number}   - total number of pages
 *   onPageChange {function} - callback(newPage: number)
 */

import React from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';

function getPageNumbers(current, total) {
  if (total <= 5) return Array.from({ length: total }, (_, i) => i + 1);
  if (current <= 3) return [1, 2, 3, 4, 5];
  if (current >= total - 2) return [total - 4, total - 3, total - 2, total - 1, total];
  return [current - 2, current - 1, current, current + 1, current + 2];
}

export default function Pagination({ currentPage, totalPages, onPageChange }) {
  if (!totalPages || totalPages <= 1) return null;

  const pages = getPageNumbers(currentPage, totalPages);

  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-[#dfc0b7]/30 bg-gray-50/50">
      {/* Prev */}
      <button
        onClick={() => onPageChange(Math.max(currentPage - 1, 1))}
        disabled={currentPage === 1}
        className={`flex items-center gap-1 text-[10px] font-black px-3 py-1 rounded-full border border-[#dfc0b7]/50 transition-colors ${
          currentPage === 1
            ? 'text-gray-400 bg-gray-100 cursor-not-allowed border-gray-200'
            : 'text-[#8c3315] hover:bg-[#8c3315] hover:text-white bg-white'
        }`}
      >
        <ArrowLeft size={10} /> Trước
      </button>

      {/* Page numbers */}
      <div className="flex items-center gap-1">
        {pages.map((page) => (
          <button
            key={page}
            onClick={() => onPageChange(page)}
            className={`w-7 h-7 rounded-full text-[10px] font-black transition-colors ${
              page === currentPage
                ? 'bg-[#8c3315] text-white'
                : 'text-[#57423b] hover:bg-[#fff3f0] hover:text-[#8c3315]'
            }`}
          >
            {page}
          </button>
        ))}
      </div>

      {/* Next */}
      <button
        onClick={() => onPageChange(Math.min(currentPage + 1, totalPages))}
        disabled={currentPage === totalPages}
        className={`flex items-center gap-1 text-[10px] font-black px-3 py-1 rounded-full border border-[#dfc0b7]/50 transition-colors ${
          currentPage === totalPages
            ? 'text-gray-400 bg-gray-100 cursor-not-allowed border-gray-200'
            : 'text-[#8c3315] hover:bg-[#8c3315] hover:text-white bg-white'
        }`}
      >
        Sau <ArrowRight size={10} />
      </button>
    </div>
  );
}
