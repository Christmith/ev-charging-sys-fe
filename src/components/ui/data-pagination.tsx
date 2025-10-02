import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
} from "@/components/ui/pagination";

interface DataPaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  startIndex: number;
  endIndex: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  pageNumbers: number[];
  showEllipsisStart: boolean;
  showEllipsisEnd: boolean;
  onPageChange: (page: number) => void;
  onItemsPerPageChange?: (itemsPerPage: number) => void;
  onNextPage: () => void;
  onPreviousPage: () => void;
  onFirstPage: () => void;
  onLastPage: () => void;
  showItemsPerPage?: boolean;
  itemsPerPageOptions?: number[];
}

export function DataPagination({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  startIndex,
  endIndex,
  hasNextPage,
  hasPreviousPage,
  pageNumbers,
  showEllipsisStart,
  showEllipsisEnd,
  onPageChange,
  onItemsPerPageChange,
  onNextPage,
  onPreviousPage,
  onFirstPage,
  onLastPage,
  showItemsPerPage = true,
  itemsPerPageOptions = [5, 10, 20, 50],
}: DataPaginationProps) {
  if (totalPages <= 1) {
    return null;
  }

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      {/* Items info and per-page selector */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
        <div className="text-sm text-muted-foreground">
          Showing {startIndex}-{endIndex} of {totalItems} items
        </div>
        
        {showItemsPerPage && onItemsPerPageChange && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Items per page:</span>
            <Select
              value={itemsPerPage.toString()}
              onValueChange={(value) => onItemsPerPageChange(parseInt(value))}
            >
              <SelectTrigger className="h-8 w-16">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {itemsPerPageOptions.map((option) => (
                  <SelectItem key={option} value={option.toString()}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {/* Pagination controls */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-2">
        {/* Mobile-first: Simple prev/next */}
        <div className="flex items-center justify-center gap-1 sm:hidden">
          <Button
            variant="outline"
            size="sm"
            onClick={onPreviousPage}
            disabled={!hasPreviousPage}
            className="gap-1"
          >
            <ChevronLeft className="w-4 h-4" />
            Previous
          </Button>
          
          <span className="px-4 text-sm text-muted-foreground">
            Page {currentPage} of {totalPages}
          </span>
          
          <Button
            variant="outline"
            size="sm"
            onClick={onNextPage}
            disabled={!hasNextPage}
            className="gap-1"
          >
            Next
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>

        {/* Desktop: Full pagination */}
        <Pagination className="hidden sm:flex">
          <PaginationContent>
            {/* First page button */}
            {currentPage > 2 && (
              <PaginationItem>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onFirstPage}
                  disabled={!hasPreviousPage}
                  className="gap-1"
                >
                  <ChevronsLeft className="w-4 h-4" />
                  <span className="hidden lg:inline">First</span>
                </Button>
              </PaginationItem>
            )}
            
            {/* Previous button */}
            <PaginationItem>
              <Button
                variant="outline"
                size="sm"
                onClick={onPreviousPage}
                disabled={!hasPreviousPage}
                className="gap-1"
              >
                <ChevronLeft className="w-4 h-4" />
                <span className="hidden lg:inline">Previous</span>
              </Button>
            </PaginationItem>

            {/* Start ellipsis */}
            {showEllipsisStart && (
              <PaginationItem>
                <PaginationEllipsis />
              </PaginationItem>
            )}

            {/* Page numbers */}
            {pageNumbers.map((pageNumber) => (
              <PaginationItem key={pageNumber}>
                <PaginationLink
                  onClick={() => onPageChange(pageNumber)}
                  isActive={currentPage === pageNumber}
                  className="cursor-pointer"
                >
                  {pageNumber}
                </PaginationLink>
              </PaginationItem>
            ))}

            {/* End ellipsis */}
            {showEllipsisEnd && (
              <PaginationItem>
                <PaginationEllipsis />
              </PaginationItem>
            )}

            {/* Next button */}
            <PaginationItem>
              <Button
                variant="outline"
                size="sm"
                onClick={onNextPage}
                disabled={!hasNextPage}
                className="gap-1"
              >
                <span className="hidden lg:inline">Next</span>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </PaginationItem>

            {/* Last page button */}
            {currentPage < totalPages - 1 && (
              <PaginationItem>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onLastPage}
                  disabled={!hasNextPage}
                  className="gap-1"
                >
                  <span className="hidden lg:inline">Last</span>
                  <ChevronsRight className="w-4 h-4" />
                </Button>
              </PaginationItem>
            )}
          </PaginationContent>
        </Pagination>
      </div>
    </div>
  );
}