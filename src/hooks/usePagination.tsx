import { useState, useMemo } from "react";

export interface PaginationOptions {
  itemsPerPage?: number;
  initialPage?: number;
}

export function usePagination<T>(
  items: T[], 
  options: PaginationOptions = {}
) {
  const { itemsPerPage = 10, initialPage = 1 } = options;
  
  const [currentPage, setCurrentPage] = useState(initialPage);
  
  const paginatedData = useMemo(() => {
    const totalItems = items.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    
    // Calculate start and end indices
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    
    // Get current page items
    const currentItems = items.slice(startIndex, endIndex);
    
    // Calculate page numbers for pagination display
    const getPageNumbers = () => {
      const pageNumbers = [];
      const showPages = 5; // Show 5 page numbers at a time
      
      let startPage = Math.max(1, currentPage - Math.floor(showPages / 2));
      let endPage = Math.min(totalPages, startPage + showPages - 1);
      
      // Adjust start page if we're near the end
      if (endPage - startPage + 1 < showPages) {
        startPage = Math.max(1, endPage - showPages + 1);
      }
      
      for (let i = startPage; i <= endPage; i++) {
        pageNumbers.push(i);
      }
      
      return pageNumbers;
    };

    return {
      currentItems,
      totalItems,
      totalPages,
      currentPage,
      itemsPerPage,
      hasNextPage: currentPage < totalPages,
      hasPreviousPage: currentPage > 1,
      startIndex: startIndex + 1,
      endIndex: Math.min(endIndex, totalItems),
      pageNumbers: getPageNumbers(),
      showEllipsisStart: currentPage > 3,
      showEllipsisEnd: currentPage < totalPages - 2,
    };
  }, [items, currentPage, itemsPerPage]);

  const goToPage = (page: number) => {
    const totalPages = Math.ceil(items.length / itemsPerPage);
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const goToNextPage = () => {
    goToPage(currentPage + 1);
  };

  const goToPreviousPage = () => {
    goToPage(currentPage - 1);
  };

  const goToFirstPage = () => {
    goToPage(1);
  };

  const goToLastPage = () => {
    const totalPages = Math.ceil(items.length / itemsPerPage);
    goToPage(totalPages);
  };

  const resetToFirstPage = () => {
    setCurrentPage(1);
  };

  return {
    ...paginatedData,
    goToPage,
    goToNextPage,
    goToPreviousPage,
    goToFirstPage,
    goToLastPage,
    resetToFirstPage,
  };
}