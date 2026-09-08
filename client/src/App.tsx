import React from 'react';
import { useCustomerApproval } from './hooks/useCustomerApproval';
import { Header } from './components/common/Header';
import { CustomerTable } from './components/customer/CustomerTable';
import { FeedbackBanner } from './components/customer/FeedbackBanner';
import { AlertCircle, Search, RefreshCw } from 'lucide-react';

const App: React.FC = () => {
  const {
    customers,
    isLoadingList,
    error,
    lastFeedback,
    page,
    limit,
    totalCount,
    totalPages,
    hasNextPage,
    hasPrevPage,
    search,
    setPage,
    setLimit,
    setSearch,
    handleProcessNotification,
    refreshCustomers,
  } = useCustomerApproval();

  return (
    <div className="app-container">
      <Header />

      <main className="main-content">
        <div className="page-header">
          <h2 className="page-title">Müşteri Onay ve Ürün Listesi</h2>
          
          <div className="header-actions">
            <div className="search-box">
              <Search size={14} className="search-icon" />
              <input
                type="text"
                className="search-input"
                placeholder="Müşteri No, İsim veya TCKN ara..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <button
              type="button"
              className="btn-refresh"
              onClick={refreshCustomers}
              disabled={isLoadingList}
            >
              <><RefreshCw size={14} className={isLoadingList ? "animate-spin" : ""} /><span>{isLoadingList ? 'Yenileniyor...' : 'Yenile'}</span></>
            </button>
          </div>
        </div>

        {error && (
          <div className="alert-error">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <CustomerTable
          customers={customers}
          onProcessNotification={handleProcessNotification}
          isLoadingList={isLoadingList}
          pagination={{
            page,
            limit,
            totalCount,
            totalPages,
            hasNextPage,
            hasPrevPage,
            onPageChange: setPage,
            onLimitChange: setLimit,
          }}
        />

        <FeedbackBanner feedback={lastFeedback} />
      </main>
    </div>
  );
};

export default App;
