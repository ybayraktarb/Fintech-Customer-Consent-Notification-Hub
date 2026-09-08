import React from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

interface PaginationProps {
  page: number;
  limit: number;
  totalCount: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
  onPageChange: (newPage: number) => void;
  onLimitChange: (newLimit: number) => void;
}

export const Pagination: React.FC<PaginationProps> = ({
  page,
  limit,
  totalCount,
  totalPages,
  hasNextPage,
  hasPrevPage,
  onPageChange,
  onLimitChange,
}) => {
  if (totalCount === 0) {
    return null;
  }

  const startRecord = (page - 1) * limit + 1;
  const endRecord = Math.min(page * limit, totalCount);

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisiblePages = 5;

    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (page <= 3) {
        pages.push(1, 2, 3, 4, '...', totalPages);
      } else if (page >= totalPages - 2) {
        pages.push(1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, '...', page - 1, page, page + 1, '...', totalPages);
      }
    }
    return pages;
  };

  return (
    <div className="pagination-container">
      <div className="pagination-info-group">
        <div className="pagination-limit-selector">
          <label htmlFor="page-limit-select" className="pagination-limit-label">
            Sayfa Başına:
          </label>
          <select
            id="page-limit-select"
            className="pagination-select"
            value={limit}
            onChange={(e) => onLimitChange(Number(e.target.value))}
          >
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
        </div>

        <span className="pagination-info-text">
          Toplam <strong>{totalCount.toLocaleString('tr-TR')}</strong> kayıttan{' '}
          <strong>{startRecord}-{endRecord}</strong> arası gösteriliyor
        </span>
      </div>

      <div className="pagination-nav-group">
        <button
          type="button"
          className="pagination-btn pagination-btn-nav"
          disabled={!hasPrevPage}
          onClick={() => onPageChange(1)}
          title="İlk Sayfa"
          aria-label="İlk Sayfa"
        >
          <ChevronsLeft size={16} />
        </button>

        <button
          type="button"
          className="pagination-btn pagination-btn-nav"
          disabled={!hasPrevPage}
          onClick={() => onPageChange(page - 1)}
          title="Önceki Sayfa"
          aria-label="Önceki Sayfa"
        >
          <ChevronLeft size={16} />
        </button>

        <div className="pagination-pages">
          {getPageNumbers().map((pageNum, idx) => {
            if (pageNum === '...') {
              return (
                <span key={`ellipsis-${idx}`} className="pagination-ellipsis">
                  ...
                </span>
              );
            }

            const isCurrent = pageNum === page;
            return (
              <button
                key={`page-${pageNum}`}
                type="button"
                className={`pagination-btn pagination-btn-page ${isCurrent ? 'active' : ''}`}
                onClick={() => onPageChange(pageNum as number)}
                aria-current={isCurrent ? 'page' : undefined}
              >
                {pageNum}
              </button>
            );
          })}
        </div>

        <button
          type="button"
          className="pagination-btn pagination-btn-nav"
          disabled={!hasNextPage}
          onClick={() => onPageChange(page + 1)}
          title="Sonraki Sayfa"
          aria-label="Sonraki Sayfa"
        >
          <ChevronRight size={16} />
        </button>

        <button
          type="button"
          className="pagination-btn pagination-btn-nav"
          disabled={!hasNextPage}
          onClick={() => onPageChange(totalPages)}
          title="Son Sayfa"
          aria-label="Son Sayfa"
        >
          <ChevronsRight size={16} />
        </button>
      </div>
    </div>
  );
};
