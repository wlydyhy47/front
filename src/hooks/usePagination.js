// src/hooks/usePagination.js

import { useState, useMemo } from 'react';

export function usePagination(totalItems, initialPageSize = 20) {
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(initialPageSize);

  const totalPages = useMemo(() => Math.ceil(totalItems / pageSize), [totalItems, pageSize]);

  // إضافة Math.max(0, ...) لمنع القيم السالبة عندما تكون القائمة فارغة
  const maxPageIndex = Math.max(0, totalPages - 1);

  const nextPage = () => setPage((prev) => Math.min(prev + 1, maxPageIndex));
  
  const prevPage = () => setPage((prev) => Math.max(prev - 1, 0));
  
  const goToPage = (pageNum) => setPage(Math.max(0, Math.min(pageNum, maxPageIndex)));

  const resetPagination = () => {
    setPage(0);
    setPageSize(initialPageSize);
  };

  return {
    page,
    pageSize,
    totalPages,
    setPage,
    setPageSize,
    nextPage,
    prevPage,
    goToPage,
    resetPagination,
  };
}