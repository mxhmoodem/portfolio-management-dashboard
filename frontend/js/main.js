document.addEventListener('DOMContentLoaded', function () {
  const checkbox = document.getElementById('checkbox');
  const navItems = document.querySelectorAll('.nav-item');
  const mainContent = document.querySelector('.main');
  const greeting = document.querySelector('.greeting');
  const loginSection = document.getElementById('login-section');
  const registerSection = document.getElementById('register-section');
  const dashboardSection = document.getElementById('dashboard-section');
  const dashboardApp = document.querySelector('.dashboard-app');
  const sidebarToggleBtn = document.getElementById('sidebar-toggle-btn');
  const resultsContainer = document.getElementById('stocks-results');
  const tableBody = document.getElementById('stocks-table-body');
  const transactionsTableBody = document.getElementById(
    'transactions-table-body'
  );
  const resultsCount = document.getElementById('results-count');

  // Global chart instances for dynamic theme switching
  let portfolioChart = null;
  let allocationChart = null;

  // Theme Toggle Functionality
  if (checkbox) {
    const currentTheme = localStorage.getItem('theme') || 'light';
    if (currentTheme === 'dark') {
      document.body.setAttribute('data-theme', 'dark');
      checkbox.checked = true;
    }
    updateThemeImages();

    checkbox.addEventListener('change', () => {
      if (checkbox.checked) {
        document.body.setAttribute('data-theme', 'dark');
        localStorage.setItem('theme', 'dark');
      } else {
        document.body.removeAttribute('data-theme');
        localStorage.setItem('theme', 'light');
      }
      updateThemeImages();
      requestAnimationFrame(() => {
        reinitializeCharts();
      });
    });
  }

  // Sidebar Toggle Functionality
  if (dashboardApp && sidebarToggleBtn) {
    const isCollapsed = localStorage.getItem('sidebar-collapsed') === 'true';
    if (isCollapsed) {
      dashboardApp.classList.add('is-collapsed');
      sidebarToggleBtn.setAttribute('aria-expanded', 'false');
    } else {
      sidebarToggleBtn.setAttribute('aria-expanded', 'true');
    }

    sidebarToggleBtn.addEventListener('click', function () {
      const nowCollapsed = dashboardApp.classList.toggle('is-collapsed');
      localStorage.setItem('sidebar-collapsed', String(nowCollapsed));
      sidebarToggleBtn.setAttribute(
        'aria-expanded',
        nowCollapsed ? 'false' : 'true'
      );
    });
  }

  /////////////////////////////////////////////////////////////////////////////////////
  ///////////////////////////////    DYNAMIC PAGES    /////////////////////////////////
  /////////////////////////////////////////////////////////////////////////////////////

  // Page templates
  const pageTemplates = {
    dashboard: `
      <div class="dashboard-content">
        <div class="dashboard-grid">
          <!-- Portfolio Value Card -->
          <div class="portfolio-overview-card">
            <div class="portfolio-header">
              <h2>Total Portfolio Value</h2>
              <div class="portfolio-period">
                <select id="portfolio-period" class="period-selector">
                  <option value="1D">1D</option>
                  <option value="1W">1W</option>
                  <option value="1M">1M</option>
                  <option value="3M">3M</option>
                  <option value="1Y" selected>1Y</option>
                </select>
              </div>
            </div>
            <div class="portfolio-value">
              <div class="main-value" id="total-portfolio-value">$0.00</div>
              <div class="value-change" id="portfolio-change">
                <span class="change-amount" id="change-amount">+$0.00</span>
                <span class="change-percent" id="change-percent">(+0.00%)</span>
              </div>
            </div>
            <div class="portfolio-stats-dashboard">
              <div class="stat-item">
                <span class="stat-label">Available Cash</span>
                <span class="stat-value" id="available-balance-val">$0.00</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">Total Invested</span>
                <span class="stat-value" id="total-invested-val">$0.00</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">Total Deposited</span>
                <span class="stat-value" id="total-deposited-val">$0.00</span>
              </div>
            </div>
          </div>

          <!-- Portfolio Performance Chart -->
          <div class="chart-card">
            <div class="chart-header">
              <div class="chart-title-section">
                <h3>Annual Portfolio Growth</h3>
                <div class="chart-subtitle">Portfolio performance over the last 12 months</div>
                <div class="chart-legend">
                  <div class="legend-item">
                    <div class="legend-color portfolio-line"></div>
                    <span>Portfolio Value</span>
                  </div>
                </div>
              </div>
              <div class="chart-period-controls">
                <select id="chart-period">
                  <option value="1Y">This year</option>
                  <option value="6M">6 months</option>
                  <option value="3M">3 months</option>
                  <option value="1M">1 month</option>
                </select>
              </div>
            </div>
            <div class="chart-container">
              <canvas id="portfolio-chart"></canvas>
            </div>
            <div class="chart-stats">
              <div class="chart-stat">
                <div class="chart-stat-label">Total Return</div>
                <div class="chart-stat-value" id="chart-total-return">+15.2%</div>
              </div>
              <div class="chart-stat">
                <div class="chart-stat-label">Best Month</div>
                <div class="chart-stat-value" id="chart-best-month">+8.4%</div>
              </div>
              <div class="chart-stat">
                <div class="chart-stat-label">Worst Month</div>
                <div class="chart-stat-value" id="chart-worst-month">-3.2%</div>
              </div>
              <div class="chart-stat">
                <div class="chart-stat-label">Volatility</div>
                <div class="chart-stat-value" id="chart-volatility">12.5%</div>
              </div>
            </div>
          </div>

          <!-- Funds Management Card -->
          <div class="funds-card">
            <div class="funds-header">
              <h3>Your Funds</h3>
              <div class="funds-actions">
                <button class="btn-primary finance-btn" id="open-deposit-modal">Deposit</button>
                <button class="btn-secondary finance-btn" id="open-withdraw-modal">Withdraw</button>
              </div>
            </div>
            <div class="funds-summary">
              <div class="balance-display">
                <div class="balance-amount" id="main-balance-display">$0.00</div>
                <div class="balance-label">Available to Invest</div>
              </div>
            </div>
          </div>

          <!-- Portfolio Allocation Pie Chart -->
          <div class="allocation-card">
            <div class="allocation-header">
              <h3>Portfolio Allocation</h3>
              <div class="allocation-total">
                <span class="allocation-label">Total Holdings</span>
                <span class="allocation-value" id="total-holdings-value">$0.00</span>
              </div>
            </div>
            <div class="allocation-content">
              <div class="pie-chart-container">
                <canvas id="allocation-chart"></canvas>
              </div>
              <div class="allocation-legend" id="allocation-legend">
                <!-- Legend items will be dynamically generated -->
              </div>
            </div>
          </div>

          <!-- News Feed -->
          <div class="news-card">
            <div class="news-header">
              <h3>Market News</h3>
              <button class="refresh-btn" id="refresh-news" title="Refresh News">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M23 4v6h-6"></path>
                  <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path>
                </svg>
              </button>
            </div>
            <div class="news-list" id="news-list">
              <div class="news-loading">Loading latest market news...</div>
            </div>
          </div>
        </div>

        <!-- Deposit Modal -->
        <div class="modal-overlay" id="deposit-modal-overlay" style="display: none;">
          <div class="modal">
            <div class="modal-header">
              <h3>Deposit Funds</h3>
              <button class="modal-close-btn" id="deposit-close">&times;</button>
            </div>
            <form class="modal-form" id="deposit-form">
              <div class="form-group">
                <label for="deposit-amount">Amount</label>
                <input type="number" id="deposit-amount" min="0" step="0.01" placeholder="0.00" required />
              </div>
              <div class="modal-actions">
                <button type="button" class="btn-secondary" id="deposit-cancel">Cancel</button>
                <button type="submit" class="btn-primary" id="deposit-submit">Deposit</button>
              </div>
            </form>
          </div>
        </div>

        <!-- Withdraw Modal -->
        <div class="modal-overlay" id="withdraw-modal-overlay" style="display: none;">
          <div class="modal">
            <div class="modal-header">
              <h3>Withdraw Funds</h3>
              <button class="modal-close-btn" id="withdraw-close">&times;</button>
            </div>
            <form class="modal-form" id="withdraw-form">
              <div class="form-group">
                <label for="withdraw-amount">Amount</label>
                <input type="number" id="withdraw-amount" min="0" step="0.01" placeholder="0.00" required />
              </div>
              <div class="modal-actions">
                <button type="button" class="btn-secondary" id="withdraw-cancel">Cancel</button>
                <button type="submit" class="btn-primary" id="withdraw-submit">Withdraw</button>
              </div>
            </form>
          </div>
        </div>
      </div>
    `,

    portfolios: `
      <div class="portfolios-page">
        <div class="portfolios-header">
          <div class="header-content">
            <h2 class="page-title">Portfolios</h2>
            <p class="page-description">Manage and track your investment portfolios</p>
          </div>
          <button class="add-portfolio-btn" id="add-portfolio-btn">
            <span class="add-icon">+</span>
            <span class="btn-text">Add Portfolio</span>
          </button>
        </div>
        
        <div class="portfolios-grid" id="portfolios-grid">
          <!-- Portfolio cards will be dynamically generated here -->
        </div>
      </div>

      <!-- Add Portfolio Modal -->
      <div class="modal-overlay" id="portfolio-modal-overlay" style="display: none;">
        <div class="modal" id="portfolio-modal">
          <div class="modal-header">
            <h3>Create New Portfolio</h3>
            <button class="modal-close-btn" id="modal-close-btn">&times;</button>
          </div>
          <form class="modal-form" id="portfolio-form">
            <div class="form-group">
              <label for="portfolio-name">Portfolio Name *</label>
              <input 
                type="text" 
                id="portfolio-name" 
                name="name" 
                placeholder="e.g., Tech Growth Portfolio"
                required
              />
            </div>
            <div class="form-group">
              <label for="portfolio-description">Description</label>
              <textarea 
                id="portfolio-description" 
                name="description" 
                placeholder="Brief description of your portfolio strategy (optional)"
                rows="3"
              ></textarea>
            </div>
            <div class="form-group">
              <label for="portfolio-risk">Risk Profile</label>
              <select id="portfolio-risk" name="riskProfile">
                <option value="">Select risk level (optional)</option>
                <option value="Conservative">Conservative - Lower risk, stable returns</option>
                <option value="Moderate">Moderate - Balanced risk and growth</option>
                <option value="Aggressive">Aggressive - Higher risk, growth potential</option>
              </select>
            </div>

            <div class="form-group">
              <label for="portfolio-initial">Initial Cash Amount (Optional)</label>
              <input 
                type="number" 
                id="portfolio-initial" 
                name="initialCash" 
                placeholder="0.00"
                min="0"
                step="0.01"
              />
              <small class="form-help">Starting cash balance for this portfolio</small>
            </div>

            <div class="modal-actions">
              <button type="button" class="btn-secondary" id="cancel-portfolio-btn">Cancel</button>
              <button type="submit" class="btn-primary">Create Portfolio</button>
            </div>
          </form>
        </div>
      </div>

      <!-- Edit Portfolio Modal -->
      <div class="modal-overlay" id="edit-portfolio-modal-overlay" style="display: none;">
        <div class="modal" id="edit-portfolio-modal">
          <div class="modal-header">
            <h3>Edit Portfolio</h3>
            <button class="modal-close-btn" id="edit-modal-close-btn">&times;</button>
          </div>
          <form class="modal-form" id="edit-portfolio-form">
            <div class="form-group">
              <label for="edit-portfolio-name">Portfolio Name *</label>
              <input 
                type="text" 
                id="edit-portfolio-name" 
                name="name" 
                placeholder="e.g., Tech Growth Portfolio"
                required
              />
            </div>
            <div class="form-group">
              <label class="checkbox-label">
                <input 
                  type="checkbox" 
                  id="edit-portfolio-default" 
                  name="isDefault"
                />
                <span class="checkbox-text">Set as default portfolio</span>
              </label>
              <small class="form-help">New transactions will use this portfolio by default</small>
            </div>
            <div class="modal-actions">
              <button type="button" class="btn-secondary" id="cancel-edit-btn">Cancel</button>
              <button type="submit" class="btn-primary">Update Portfolio</button>
            </div>
          </form>
        </div>
      </div>

      <!-- Delete Portfolio Confirmation Modal -->
      <div class="modal-overlay" id="delete-modal-overlay" style="display: none;">
        <div class="modal" id="delete-modal">
          <div class="modal-header">
            <h3>Delete Portfolio</h3>
            <button class="modal-close-btn" id="delete-modal-close-btn">&times;</button>
          </div>
          <div class="modal-body">
            <div class="delete-warning">
              <div class="warning-icon"><img id="warning-icon-img" src="/images/warning-icon-light.png" alt="Warning"></div>
              <p>Are you sure you want to delete "<span id="delete-portfolio-name"></span>"?</p>
              <p class="warning-text">This action cannot be undone. The portfolio must be empty (no holdings) to be deleted.</p>
            </div>
          </div>
          <div class="modal-actions">
            <button type="button" class="btn-secondary" id="cancel-delete-btn">Cancel</button>
            <button type="button" class="btn-danger" id="confirm-delete-btn">Delete Portfolio</button>
          </div>
        </div>
      </div>
    `,
    holdings: `
      <div class="holdings-page">
        <div class="holdings-header">
          <div class="header-left">
            <h2 class="page-title">Current Holdings</h2>
            <select id="portfolio-filter" class="portfolio-dropdown">
              <option value="">All Portfolios</option>
            </select>
          </div>
        </div>

        <div class="holdings-grid">
          <div class="holdings-left">
            <div class="holdings-table" id="holdings-table">
              <div class="table-header">
                <span>Stock</span>
                <span>Portfolio</span>
                <span>Amount</span>
                <span>Avg Cost</span>
                <span>Current Price</span>
                <span>Total Value</span>
                <span>Return</span>
                <span>Created</span>
                <span>Actions</span>
              </div>
              <div class="table-body" id="holdings-list"></div>
              <div class="table-empty" id="holdings-empty" style="display:none;">
                <div class="empty-state">
                  <div class="empty-icon">
                    <img id="bar-chart-icon-img" src="/images/bar-chart-icon-light.png" alt="No Holdings">
                  </div>
                  <h3 class="empty-title">No Holdings Yet</h3>
                  <p class="empty-description">Create your first investment holding to start tracking your investments</p>
                  <button class="btn-primary empty-action-btn" id="add-first-holding-btn">Add Your First Holding</button>
                </div>
              </div>
            </div>
          </div>
          <div class="holdings-right">
            <div class="stock-search-panel">
              <div class="panel-search">
                <input type="text" id="holdings-stock-search-input" class="stock-search-input" placeholder="Search stocks (e.g., AAPL)" />
                <button class="stock-search-btn" id="holdings-stock-search-btn"><img src="/images/search-icon.png" alt="Search" /></button>
              </div>
              <div class="panel-results" id="holdings-search-results">
                <div class="search-help">
                  <div class="help-icon"><img src="/images/search-icon.png" alt="Search" /></div>
                  <h4>Search for stocks to add to your portfolio</h4>
                  <p>Enter a stock symbol or company name</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="modal-overlay" id="buy-modal-overlay" style="display:none;">
          <div class="modal" id="buy-modal">
            <div class="modal-header">
              <h3 id="buy-modal-title">Buy</h3>
              <button class="modal-close-btn" id="buy-close">&times;</button>
            </div>
            <form class="modal-form" id="buy-form">
              <div class="form-group">
                <label>Symbol</label>
                <input type="text" id="buy-symbol" readonly />
              </div>
              <div class="form-group">
                <label>Price (ask)</label>
                <input type="text" id="buy-price" readonly />
              </div>
              <div class="form-group">
                <label for="buy-portfolio">Portfolio</label>
                <select id="buy-portfolio" required>
                  <option value="">Select a portfolio...</option>
                </select>
              </div>
              <div class="form-group">
                <label for="buy-amount">Shares to buy</label>
                <input type="number" id="buy-amount" min="0" step="0.0001" placeholder="0.0000" required />
                <small class="form-help" id="buy-cost-help">Cost: $0.00</small>
              </div>
              <div class="modal-actions">
                <button type="button" class="btn-secondary" id="buy-cancel">Cancel</button>
                <button type="submit" class="btn-primary" id="buy-submit" disabled>Buy</button>
              </div>
            </form>
          </div>
        </div>

        <!-- Edit/Sell Modal -->
        <div class="modal-overlay" id="edit-holding-modal-overlay" style="display:none;">
          <div class="modal" id="edit-holding-modal">
            <div class="modal-header">
              <h3 id="edit-holding-modal-title">Edit Holding</h3>
              <button class="modal-close-btn" id="edit-holding-close">&times;</button>
            </div>
            <form class="modal-form" id="edit-holding-form">
              <div class="form-group">
                <label>Symbol</label>
                <input type="text" id="edit-holding-symbol" readonly />
              </div>
              <div class="form-group">
                <label>Current Holdings</label>
                <input type="text" id="edit-holding-current" readonly />
              </div>
              <div class="form-group">
                <label>Price (ask/bid)</label>
                <input type="text" id="edit-holding-price" readonly />
              </div>
              <div class="form-group">
                <label for="edit-holding-portfolio">Portfolio</label>
                <select id="edit-holding-portfolio" required>
                  <option value="">Select a portfolio...</option>
                </select>
              </div>
              <div class="form-group">
                <label for="edit-holding-action">Action</label>
                <select id="edit-holding-action" required>
                  <option value="">Select action...</option>
                  <option value="buy">Buy More</option>
                  <option value="sell">Sell</option>
                </select>
              </div>
              <div class="form-group">
                <label for="edit-holding-amount">Shares</label>
                <input type="number" id="edit-holding-amount" min="0" step="0.0001" placeholder="0.0000" required />
                <small class="form-help" id="edit-holding-cost-help">Cost: $0.00</small>
              </div>
              <div class="modal-actions">
                <button type="button" class="btn-secondary" id="edit-holding-cancel">Cancel</button>
                <button type="submit" class="btn-primary" id="edit-holding-submit" disabled>Execute</button>
              </div>
            </form>
          </div>
        </div>
      </div>
    `,
    transactions: `
      <div class="transactions-page">
        <div class="transactions-header">
          <div class="header-left">
            <h2 class="page-title">Transaction History</h2>
          </div>
        </div>

        <div class="transactions-table" id="transactions-table">
          <div class="table-header">
            <span>Date</span>
            <span>Type</span>
            <span>Asset</span>
            <span>Quantity</span>
            <span>Price</span>
            <span>Total Value</span>
            <span>Fees</span>
            <span>Portfolio</span>
          </div>
          <div class="table-body" id="transactions-list"></div>
          <div class="table-empty" id="transactions-empty" style="display:none;">
            <div class="empty-state">
              <div class="empty-icon">
                <img id="transaction-icon-img" src="/images/transaction-icon.png" alt="No Transactions">
              </div>
              <h3 class="empty-title">No Transactions Yet</h3>
              <p class="empty-description">Your transaction history will appear here once you start trading</p>
            </div>
          </div>
        </div>
      </div>
    `,
  };

  /*
    Fetches transactions from the backend
    @returns {Promise<Array>} - An array of transactions
  */
  async function fetchTransactions() {
    try {
      const response = await authenticatedFetch(`${API_BASE}/user/logs`);

      if (!response.ok) {
        throw new Error('Failed to fetch transactions');
      }

      const transactions = await response.json().catch(() => []);

      return Array.isArray(transactions) ? transactions : [];
    } catch (error) {
      return [];
    }
  }

  /*
    Renders the transactions table
    @returns {void} - Renders the transactions table
  */
  async function renderTransactions() {
    const transactionsList = document.getElementById('transactions-list');
    const transactionsEmpty = document.getElementById('transactions-empty');

    if (transactionsList && transactionsEmpty) {
      try {
        const [transactions, portfolios] = await Promise.all([
          fetchTransactions(),
          fetchPortfolios(),
        ]);

        // Create portfolio lookup map
        const portfolioMap = {};
        if (Array.isArray(portfolios)) {
          portfolios.forEach(portfolio => {
            portfolioMap[portfolio.uuid] = portfolio.name;
          });
        }

        // Create stock info cache for company names
        const stockInfoCache = {};

        // Helper function to get stock info with caching
        const getStockInfo = async symbol => {
          if (stockInfoCache[symbol]) {
            return stockInfoCache[symbol];
          }

          try {
            const results = await searchStocksFinancial(symbol);
            const stockInfo = results.find(item => item.symbol === symbol);
            const info = {
              symbol: symbol,
              name: stockInfo
                ? stockInfo.displayName || stockInfo.shortName || symbol
                : symbol,
            };
            stockInfoCache[symbol] = info;
            return info;
          } catch (error) {
            const fallback = { symbol: symbol, name: symbol };
            stockInfoCache[symbol] = fallback;
            return fallback;
          }
        };

        // Check if there are no transactions; if none, show empty state. Otherwise, populate the table with transaction data.
        if (transactions.length === 0) {
          transactionsList.style.display = 'none';
          transactionsEmpty.style.display = 'flex';
        } else {
          transactionsEmpty.style.display = 'none';
          transactionsList.style.display = 'block';

          // Sort transactions by date (most recent first)
          const sortedTransactions = transactions.sort((a, b) => {
            const dateA = new Date(a.createdAt || a.timestamp || 0);
            const dateB = new Date(b.createdAt || b.timestamp || 0);
            return dateB - dateA; // Descending order (newest first)
          });

          // Get stock info for all unique symbols first
          const uniqueSymbols = [
            ...new Set(
              sortedTransactions.map(t => t.stock_tag).filter(Boolean)
            ),
          ];
          await Promise.all(uniqueSymbols.map(symbol => getStockInfo(symbol)));

          transactionsList.innerHTML = sortedTransactions
            .map(transaction => {
              // Map backend fields to display values
              const transactionType = transaction.buy_sell || 'unknown';
              const date = transaction.createdAt
                ? formatTimestamp(transaction.createdAt)
                : transaction.timestamp
                  ? formatTimestamp(transaction.timestamp)
                  : 'Today';
              const stockSymbol = transaction.stock_tag || 'N/A';
              const stockInfo = stockInfoCache[stockSymbol] || {
                symbol: stockSymbol,
                name: stockSymbol,
              };
              const quantity = transaction.stock_traded || 0;
              const price = transaction.price_per || 0;
              const totalValue = transaction.amount || quantity * price;
              const fees = 0; // Backend doesn't store fees yet
              const portfolioName =
                portfolioMap[transaction.portfolio_uuid] || 'N/A';

              return `
                <div class="table-row">
                  <span class="timestamp-cell">${date}</span>
                  <span class="transaction-type-pill ${transactionType}">
                    ${transactionType.charAt(0).toUpperCase() + transactionType.slice(1)}
                  </span>
                  <span class="asset-info">
                    <div class="asset-symbol">${stockInfo.symbol}</div>
                    <div class="asset-name">${stockInfo.name}</div>
                  </span>
                  <span>${Number(quantity).toFixed(4)}</span>
                  <span>$${Number(price).toFixed(2)}</span>
                  <span>$${Number(totalValue).toFixed(2)}</span>
                  <span>$${Number(fees).toFixed(2)}</span>
                  <span>${portfolioName}</span>
                </div>
              `;
            })
            .join('');
        }
      } catch (error) {
        transactionsList.style.display = 'none';
        transactionsEmpty.style.display = 'flex';
        transactionsEmpty.innerHTML = `
          <div class="empty-state">
            <div class="empty-icon">
              <img src="/images/warning-icon-light.png" alt="Error">
            </div>
            <h3 class="empty-title">Failed to Load Transactions</h3>
            <p class="empty-description">Please try refreshing the page</p>
          </div>
        `;
      }
    }
  }

  // State for portfolios data
  let portfoliosData = [];
  let portfoliosLoading = false;
  let portfoliosError = null;
  let portfoliosLastFetch = 0;
  const PORTFOLIOS_CACHE_DURATION = 60000;
  const holdingsCache = new Map();
  const HOLDINGS_CACHE_DURATION = 60000;

  /*
    Invalidates the portfolios cache by clearing the portfolios data and setting the last fetch time to 0
    @returns {void} - Invalidates the portfolios cache
  */
  function invalidatePortfoliosCache() {
    portfoliosData = [];
    portfoliosLastFetch = 0;
  }

  /*
    Invalidates the holdings cache by clearing the holdings data for a specific portfolio or all portfolios
    @param {string} portfolioUuid - The UUID of the portfolio to invalidate the cache for
    @returns {void} - Invalidates the holdings cache
  */
  function invalidateHoldingsCache(portfolioUuid = null) {
    if (portfolioUuid) {
      holdingsCache.delete(portfolioUuid);
    } else {
      holdingsCache.clear();
    }
  }

  /*
    Invalidates all caches by clearing the portfolios and holdings data
    @returns {void} - Invalidates all caches
  */
  function invalidateAllCaches() {
    invalidatePortfoliosCache();
    invalidateHoldingsCache();
  }

  // Background update system
  let backgroundUpdateInterval = null;
  const BACKGROUND_UPDATE_INTERVAL = 60000; 

  /*
    Performs a background update of the portfolios
    @returns {void} - Performs a background update of the portfolios
  */
  async function performBackgroundUpdate() {
    try {
      // Only update if user is authenticated and on dashboard
      const currentView = getCurrentView();
      if (currentView === 'dashboard') {
        // Call backend to update portfolio values
        await authenticatedFetch(`${API_BASE}/user/update-portfolios`, {
          method: 'POST',
        });

        // Invalidate caches to force fresh data on next request
        invalidateAllCaches();

        console.log('Background portfolio update completed');
      }
    } catch (error) {
      console.warn('Background update failed:', error);
    }
  }
  
  /*
    Starts the background updates by setting up an interval to perform the background update
    @returns {void} - Starts the background updates
  */
  function startBackgroundUpdates() {
    if (backgroundUpdateInterval) {
      clearInterval(backgroundUpdateInterval);
    }
    backgroundUpdateInterval = setInterval(
      performBackgroundUpdate,
      BACKGROUND_UPDATE_INTERVAL
    );
  }

  function stopBackgroundUpdates() {
    if (backgroundUpdateInterval) {
      clearInterval(backgroundUpdateInterval);
      backgroundUpdateInterval = null;
    }
  }

  /*
    Update the page title greeting with the users first name
    @param {string} page - The page to update the title for
  */
  function updatePageTitle(page) {
    const firstName = getDisplayFirstName();
    greeting.textContent = firstName ? `Hello ${firstName}` : 'Hello';
  }

  /*
    Updates theme-specific images based on current dark/light mode
  */
  function updateThemeImages() {
    const isDark = document.body.getAttribute('data-theme') === 'dark';

    // Update delete modal warning icon
    const warningIcon = document.getElementById('warning-icon-img');
    if (warningIcon) {
      warningIcon.src = isDark
        ? '/images/warning-icon-dark.png'
        : '/images/warning-icon-light.png';
    }

    // Update empty portfolios bar chart state icon
    const barChartIcon = document.getElementById('bar-chart-icon-img');
    if (barChartIcon) {
      barChartIcon.src = isDark
        ? '/images/bar-chart-icon-dark.png'
        : '/images/bar-chart-icon-light.png';
    }
  }

  /*
    Reinitialises all charts with updated theme colors
  */
  function reinitializeCharts() {
    // Destroy existing portfolio chart if it exists
    if (portfolioChart) {
      portfolioChart.destroy();
      portfolioChart = null;
    }

    // Destroy existing allocation chart if it exists
    if (allocationChart) {
      allocationChart.destroy();
      allocationChart = null;
    }

    // Reinitialize charts if we're on the dashboard
    const currentView = getCurrentView();
    if (currentView === 'dashboard') {
      initializePortfolioChart();
      initializeAllocationChart();
    }
  }

  /*
    Gets the current active view/page
    @return {string} - Current view name
  */
  function getCurrentView() {
    const activeNavItem = document.querySelector('.nav-item.active');
    if (activeNavItem) {
      const navText = activeNavItem.querySelector('.nav-text');
      if (navText) {
        return navText.textContent.toLowerCase();
      }
    }
    return 'dashboard'; // default
  }

  /*
    Formats a currency amount to two decimal places
    @param {number} amount - The amount to format
    @returns {string} - The formatted currency amount
  */
  function formatCurrency(amount) {
    const value = Number(amount || 0);
    return `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  async function fetchBalance() {
    const res = await authenticatedFetch(`${API_BASE}/user/balance`);

    if (!res.ok) throw new Error(`Failed to load balance (${res.status})`);
    const data = await res.json().catch(() => 0);

    // Handle both formats: array from old version and number from new version
    let balance;
    if (Array.isArray(data) && data.length > 0 && data[0].money !== undefined) {
      // Old format: array with money property
      balance = Number(data[0].money);
    } else if (typeof data === 'number') {
      // New format: direct number
      balance = data;
    } else {
      // Fallback
      balance = 0;
    }

    return balance;
  }

  /*
    Ensures that the portfolios data is loaded by fetching the portfolios if they are not already loaded
    @returns {void} - Ensures that the portfolios data is loaded
  */
  async function ensurePortfoliosLoaded() {
    if (!Array.isArray(portfoliosData) || portfoliosData.length === 0) {
      await fetchPortfolios();
    }
  }

  /*
    Gets the default portfolio UUID
    @returns {string} - The default portfolio UUID
  */
  async function getDefaultPortfolioUuid() {
    await ensurePortfoliosLoaded();
    const def = portfoliosData.find(p => p.isDefault);
    return (def || portfoliosData[0])?.uuid || null;
  }

  /*
    Fetches the holdings for a specific portfolio
    @param {string} portfolioUuid - The UUID of the portfolio to fetch the holdings for
    @param {boolean} forceRefresh - Whether to force a refresh of the holdings
    @returns {Promise<Array>} - An array of holdings
  */
  async function fetchHoldings(portfolioUuid, forceRefresh = false) {
    const now = Date.now();
    const cacheKey = portfolioUuid;
    const cached = holdingsCache.get(cacheKey);

    if (
      !forceRefresh &&
      cached &&
      now - cached.timestamp < HOLDINGS_CACHE_DURATION
    ) {
      return cached.data;
    }

    const res = await authenticatedFetch(
      `${API_BASE}/user/shares/${portfolioUuid}`
    );

    if (!res.ok) {
      const errorText = await res.text();

      throw new Error(`Failed to load holdings (${res.status}): ${errorText}`);
    }

    const data = await res.json().catch(e => {
      return [];
    });

    // Normalize to array
    const normalizedData = Array.isArray(data) ? data : data ? [data] : [];

    // Cache the result
    holdingsCache.set(cacheKey, {
      data: normalizedData,
      timestamp: now,
    });

    return normalizedData;
  }

  /*
    Searches for stocks financial information
    @param {string} query - The query to search for
    @returns {Promise<Array>} - An array of stocks financial information
  */
  async function searchStocksFinancial(query) {
    const res = await fetch(
      `${API_BASE}/search/financial/${encodeURIComponent(query)}`
    );
    if (!res.ok) throw new Error(`Search failed (${res.status})`);
    const items = await res.json().catch(() => []);
    return (Array.isArray(items) ? items : []).filter(
      i => i.symbol && (i.displayName || i.shortName)
    );
  }

  /*
    Fetches the stock price for a specific stock
    @param {string} tag - The tag of the stock to fetch the price for
    @returns {Promise<Object>} - An object containing the stock price and currency
  */
  async function fetchStockPrice(tag) {
    const res = await fetch(`${API_BASE}/price/${encodeURIComponent(tag)}`);

    if (!res.ok) {
      const errorText = await res.text();

      throw new Error(`Price fetch failed (${res.status}): ${errorText}`);
    }
    const data = await res.json().catch(e => {
      return {};
    });

    return {
      ask: Number(data.ask || 0),
      bid: Number(data.bid || 0),
      currency: data.currency || 'usd',
    };
  }

  /*
    Triggers a backend sync to update all stock prices in the database
    @returns {Promise<boolean>} - Whether the sync was successful
  */
  async function syncStockPrices() {
    try {
      const res = await fetch(`${API_BASE}/sync`);
      if (!res.ok) {
        return false;
      }
      const result = await res.json().catch(() => null);

      return true;
    } catch (error) {
      return false;
    }
  }

  /*
    Fetches the transaction logs for the user
    @returns {Promise<Array>} - An array of transaction logs
  */
  async function fetchTransactionLogs() {
    try {
      const res = await authenticatedFetch(`${API_BASE}/user/logs`);
      if (!res.ok) {
        return [];
      }
      const logs = await res.json().catch(() => []);

      return Array.isArray(logs) ? logs : [];
    } catch (error) {
      return [];
    }
  }

  /*
    Gets the latest transaction timestamp for a holding
    @param {string} symbol - The symbol of the holding
    @param {string} portfolioUuid - The UUID of the portfolio
    @param {Array} transactionLogs - An array of transaction logs
    @returns {string} - The latest transaction timestamp
  */
  function getLatestTransactionTimestamp(
    symbol,
    portfolioUuid,
    transactionLogs
  ) {
    if (!Array.isArray(transactionLogs) || transactionLogs.length === 0) {
      return null;
    }

    const relevantLogs = transactionLogs.filter(
      log => log.stock_tag === symbol && log.portfolio_uuid === portfolioUuid
    );

    if (relevantLogs.length === 0) {
      return null;
    }

    const latestLog = relevantLogs.reduce((latest, current) => {
      const currentDate = new Date(current.createdAt);
      const latestDate = new Date(latest.createdAt);
      return currentDate > latestDate ? current : latest;
    });

    return latestLog.createdAt;
  }

  /*
    Formats a timestamp for display
    @param {string} timestamp - The timestamp to format
    @returns {string} - The formatted timestamp
  */
  function formatTimestamp(timestamp) {
    if (!timestamp) return 'N/A';
    try {
      const date = new Date(timestamp);
      if (isNaN(date.getTime())) return 'N/A';

      const now = new Date();
      const diffMs = now - date;
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      // If within last 7 days, show relative time
      if (diffDays === 0) {
        return 'Today';
      } else if (diffDays === 1) {
        return 'Yesterday';
      } else if (diffDays < 7) {
        return `${diffDays}d ago`;
      } else {
        // Format as "MMM DD" for older dates
        return date.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
        });
      }
    } catch (error) {
      return 'N/A';
    }
  }

  /*
    Refreshes the funds card
    @returns {Promise<void>} - Refreshes the funds card
  */
  async function refreshFundsCard() {
    try {
      const [balance] = await Promise.all([fetchBalance()]);
      await ensurePortfoliosLoaded();
      const totalInvested = portfoliosData.reduce(
        (sum, p) => sum + Number(p.invested || 0),
        0
      );
      const totalDeposited = balance + totalInvested;

      const balanceEl = document.getElementById('available-balance-val');
      const investedEl = document.getElementById('total-invested-val');
      const depositedEl = document.getElementById('total-deposited-val');
      const noteEl = document.getElementById('funds-note');
      if (balanceEl) balanceEl.textContent = formatCurrency(balance);
      if (investedEl) investedEl.textContent = formatCurrency(totalInvested);
      if (depositedEl) depositedEl.textContent = formatCurrency(totalDeposited);
      if (noteEl)
        noteEl.textContent =
          balance > 0
            ? `You have ${formatCurrency(balance)} available to invest in stocks.`
            : `No funds available. Please deposit money to start investing.`;
    } catch (e) {
      // Show error state in UI
      const balanceEl = document.getElementById('available-balance-val');
      const investedEl = document.getElementById('total-invested-val');
      const depositedEl = document.getElementById('total-deposited-val');
      if (balanceEl) balanceEl.textContent = 'Error';
      if (investedEl) investedEl.textContent = 'Error';
      if (depositedEl) depositedEl.textContent = 'Error';
    }
  }

  /*
    Sets up the funds card
    @returns {Promise<void>} - Sets up the funds card
  */
  async function setupFundsCard() {
    const openDepositBtn = document.getElementById('open-deposit-modal');
    const openWithdrawBtn = document.getElementById('open-withdraw-modal');
    const depositOverlay = document.getElementById('deposit-modal-overlay');
    const withdrawOverlay = document.getElementById('withdraw-modal-overlay');
    const depositClose = document.getElementById('deposit-close');
    const withdrawClose = document.getElementById('withdraw-close');
    const depositCancel = document.getElementById('deposit-cancel');
    const withdrawCancel = document.getElementById('withdraw-cancel');
    const depositForm = document.getElementById('deposit-form');
    const withdrawForm = document.getElementById('withdraw-form');

    function openOverlay(overlay) {
      if (!overlay) return;
      overlay.style.display = 'flex';
      document.body.style.overflow = 'hidden';
    }
    function closeOverlay(overlay) {
      if (!overlay) return;
      overlay.style.display = 'none';
      document.body.style.overflow = 'auto';
      const form = overlay.querySelector('form');
      if (form) form.reset();
      const err = overlay.querySelector('.form-error');
      if (err) err.remove();
    }

    openDepositBtn?.addEventListener('click', () =>
      openOverlay(depositOverlay)
    );
    openWithdrawBtn?.addEventListener('click', () =>
      openOverlay(withdrawOverlay)
    );
    depositClose?.addEventListener('click', () => closeOverlay(depositOverlay));
    withdrawClose?.addEventListener('click', () =>
      closeOverlay(withdrawOverlay)
    );
    depositCancel?.addEventListener('click', () =>
      closeOverlay(depositOverlay)
    );
    withdrawCancel?.addEventListener('click', () =>
      closeOverlay(withdrawOverlay)
    );

    depositOverlay?.addEventListener('click', e => {
      if (e.target === depositOverlay) closeOverlay(depositOverlay);
    });
    withdrawOverlay?.addEventListener('click', e => {
      if (e.target === withdrawOverlay) closeOverlay(withdrawOverlay);
    });

    depositForm?.addEventListener('submit', async e => {
      e.preventDefault();
      const amount = Number(document.getElementById('deposit-amount').value);
      if (!(amount > 0)) {
        showFormError(depositForm, 'Enter a valid amount');
        return;
      }
      const btn = document.getElementById('deposit-submit');
      if (btn) btn.disabled = true;
      try {
        const res = await authenticatedFetch(`${API_BASE}/user/deposit`, {
          method: 'POST',
          body: JSON.stringify({ amount }),
          headers: {
            'Content-Type': 'application/json',
          },
        });

        const payload = await res.json().catch(() => ({}));

        if (!res.ok)
          throw new Error(payload.error || payload.message || 'Deposit failed');

        await refreshFundsCard();
        invalidateAllCaches(); // Invalidate cache after deposit
        closeOverlay(depositOverlay);
      } catch (err) {
        showFormError(depositForm, err.message || 'Deposit failed');
      } finally {
        if (btn) btn.disabled = false;
      }
    });

    withdrawForm?.addEventListener('submit', async e => {
      e.preventDefault();
      const amount = Number(document.getElementById('withdraw-amount').value);
      if (!(amount > 0)) {
        showFormError(withdrawForm, 'Enter a valid amount');
        return;
      }
      const btn = document.getElementById('withdraw-submit');
      if (btn) btn.disabled = true;
      try {
        const res = await authenticatedFetch(`${API_BASE}/user/withdraw`, {
          method: 'POST',
          body: JSON.stringify({ amount }),
        });
        const payload = await res.json().catch(() => ({}));
        if (!res.ok)
          throw new Error(
            payload.error || payload.message || 'Withdraw failed'
          );
        await refreshFundsCard();
        invalidateAllCaches(); // Invalidate cache after withdrawal
        closeOverlay(withdrawOverlay);
      } catch (err) {
        showFormError(withdrawForm, err.message || 'Withdraw failed');
      } finally {
        if (btn) btn.disabled = false;
      }
    });

    await refreshFundsCard();
  }

  /*
    Sets up the holdings page
    @returns {Promise<void>} - Sets up the holdings page
  */
  async function setupHoldingsPage() {
    const listEl = document.getElementById('holdings-list');
    const emptyEl = document.getElementById('holdings-empty');

    if (listEl) {
      listEl.innerHTML =
        '<div style="padding: 20px; text-align: center; color: var(--color-muted);">Loading holdings...</div>';
    }
    const searchInput = document.getElementById('holdings-stock-search-input');
    const searchBtn = document.getElementById('holdings-stock-search-btn');
    const resultsEl = document.getElementById('holdings-search-results');
    const addFirstHoldingBtn = document.getElementById('add-first-holding-btn');

    let defaultPortfolioUuid = await getDefaultPortfolioUuid();
    if (!defaultPortfolioUuid) return;

    async function setupPortfolioDropdown() {
      await ensurePortfoliosLoaded();
      const dropdown = document.getElementById('portfolio-filter');
      if (dropdown) {
        dropdown.innerHTML = '<option value="">All Portfolios</option>';
        portfoliosData.forEach(p => {
          dropdown.innerHTML += `<option value="${p.uuid}">${p.name}${p.isDefault ? ' (Default)' : ''}</option>`;
        });
        dropdown.addEventListener('change', async () => {
          await refreshHoldings();
        });
      }
    }
    
    /*
      Renders the holdings table
      @param {Array} holdings - An array of holdings
      @returns {void} - Renders the holdings table
    */
    async function renderHoldings(holdings) {
      if (!listEl) return;
      if (!holdings || holdings.length === 0) {
        listEl.innerHTML = '';
        if (emptyEl) emptyEl.style.display = 'block';
        return;
      }
      if (emptyEl) emptyEl.style.display = 'none';

      const transactionLogs = await fetchTransactionLogs();

      const holdingsWithPrices = await Promise.all(
        holdings.map(async h => {
          const symbol = h.tag || h.symbol || '';
          let realTimeBidPrice = 0;
          let realTimeAskPrice = 0;

          try {
            const priceData = await fetchStockPrice(symbol);
            realTimeBidPrice = priceData.bid || 0;
            realTimeAskPrice = priceData.ask || 0;
          } catch (error) {
            const dbAsk = Number(h.current_ask || 0);
            const dbBid = Number(h.current_bid || 0);
            const totalValue = Number(h.total_value || 0);
            const amountOwned = Number(h.amount_owned || 0);

            if (dbBid > 0) {
              realTimeBidPrice = dbBid;
            } else if (totalValue > 0 && amountOwned > 0) {
              realTimeBidPrice = totalValue / amountOwned;
            }

            if (dbAsk > 0) {
              realTimeAskPrice = dbAsk;
            } else if (realTimeBidPrice > 0) {
              realTimeAskPrice = realTimeBidPrice * 1.001;
            }
          }

          return { ...h, realTimeBidPrice, realTimeAskPrice };
        })
      );

      listEl.innerHTML = holdingsWithPrices
        .map(h => {
          const amount = Number(h.amount_owned || 0);
          const invested = Number(h.total_invested || 0);
          const currentBidPrice = h.realTimeBidPrice;
          const currentValue = amount * currentBidPrice;
          const avg = amount > 0 ? invested / amount : 0;
          const returnAmount = currentValue - invested;
          const returnPercent =
            invested > 0 ? (returnAmount / invested) * 100 : 0;
          const name = h.name || h.tag || h.symbol || '';
          const symbol = h.tag || h.symbol || '';

          const returnClass = returnAmount >= 0 ? 'positive' : 'negative';
          const returnSign = returnAmount >= 0 ? '+' : '';

          const portfolio = portfoliosData.find(
            p => p.uuid === h.portfolio_uuid
          );
          const portfolioName = portfolio ? portfolio.name : 'Unknown';

          const displayReturn =
            currentBidPrice > 0
              ? `${returnSign}${formatCurrency(returnAmount)}`
              : 'N/A';
          const displayReturnPercent =
            currentBidPrice > 0
              ? `${returnSign}${returnPercent.toFixed(2)}%`
              : '';

          const priceDisplay =
            currentBidPrice > 0 ? formatCurrency(currentBidPrice) : 'N/A';
          const valueDisplay =
            currentBidPrice > 0 ? formatCurrency(currentValue) : 'N/A';

          const latestTimestamp = getLatestTransactionTimestamp(
            symbol,
            h.portfolio_uuid,
            transactionLogs
          );
          const timestampDisplay = formatTimestamp(latestTimestamp);

          return `
          <div class="table-row">
            <span>${symbol} <span class="muted">${name}</span></span>
            <span class="portfolio-cell">${portfolioName}</span>
            <span>${amount.toFixed(4)}</span>
            <span>${formatCurrency(avg)}</span>
            <span title="Bid price (sell price)">${priceDisplay}</span>
            <span>${valueDisplay}</span>
            <span>
              ${
                currentBidPrice > 0
                  ? `
                <span class="return-chip ${returnClass}">
                  <img class="return-icon" src="/images/${returnClass === 'positive' ? 'increase-icon' : 'decrease-icon'}.png" alt="${returnClass === 'positive' ? 'Increase' : 'Decrease'}" />
                  <span class="return-text">
                    <span class="return-amount ${returnClass}">${displayReturn}</span>
                    <span class="return-percent ${returnClass}" style="font-size: 12px;">${displayReturnPercent}</span>
                  </span>
                </span>
              `
                  : 'N/A'
              }
            </span>
            <span class="timestamp-cell" title="Transaction created date">${timestampDisplay}</span>
            <span class="actions-cell">
              <button class="btn-edit-holding" data-symbol="${symbol}" data-name="${name}" data-current="${amount.toFixed(4)}" data-price="${currentBidPrice}" data-portfolio="${h.portfolio_uuid || ''}" data-holding-data='${JSON.stringify(h)}'>Edit</button>
            </span>
          </div>
        `;
        })
        .join('');

      /*
      Add event listeners to edit buttons
      @param {HTMLElement} btn - The edit button
      @returns {void} - Adds event listeners to the edit button
    */
      listEl.querySelectorAll('.btn-edit-holding').forEach(btn => {
        btn.addEventListener('click', e => {
          e.preventDefault();
          const symbol = btn.getAttribute('data-symbol');
          const name = btn.getAttribute('data-name');
          const current = btn.getAttribute('data-current');
          const price = Number(btn.getAttribute('data-price') || 0);
          const portfolioUuid = btn.getAttribute('data-portfolio');
          const holdingData = JSON.parse(
            btn.getAttribute('data-holding-data') || '{}'
          );

          openEditHoldingModal({
            symbol,
            name,
            current,
            price,
            portfolioUuid,
            holdingData,
            onSuccess: async () => {
              await refreshHoldings();
            },
          });
        });
      });
    }

    /*
      Refreshes the holdings
      @returns {Promise<void>} - Refreshes the holdings
    */
    async function refreshHoldings() {
      try {
        await ensurePortfoliosLoaded();

        const dropdown = document.getElementById('portfolio-filter');
        const selectedPortfolio = dropdown?.value || '';

        const allHoldings = [];
        const portfoliosToFetch = selectedPortfolio
          ? portfoliosData.filter(p => p.uuid === selectedPortfolio)
          : portfoliosData;

        const results = await Promise.allSettled(
          portfoliosToFetch.map(async portfolio => {
            const holdings = await fetchHoldings(portfolio.uuid);
            // Add portfolio_uuid to each holding for reference
            holdings.forEach(h => (h.portfolio_uuid = portfolio.uuid));
            return { portfolio, holdings };
          })
        );

        for (const r of results) {
          if (r.status === 'fulfilled') {
            const { portfolio, holdings } = r.value;

            allHoldings.push(...holdings);
          } else {
          }
        }

        await renderHoldings(allHoldings);
      } catch (e) {}
    }

    /*
      Renders the search results
      @param {Array} items - An array of items
      @returns {void} - Renders the search results
    */
    function renderSearchResults(items) {
      if (!resultsEl) return;
      if (!items || items.length === 0) {
        resultsEl.innerHTML = '<div class="panel-empty">No results</div>';
        return;
      }
      resultsEl.innerHTML = items
        .slice(0, 10)
        .map(i => {
          const name = i.displayName || i.shortName || i.longName || i.symbol;
          const price = Number(i.regularMarketPrice || 0);
          return `
          <button class="result-item" data-symbol="${i.symbol}" data-name="${name}" data-price="${price}">
            <div class="result-symbol">${i.symbol}</div>
            <div class="result-name">${name}</div>
            <div class="result-price">${price ? formatCurrency(price) : ''}</div>
          </button>
        `;
        })
        .join('');

      resultsEl.querySelectorAll('.result-item').forEach(btn => {
        btn.addEventListener('click', async () => {
          const symbol = btn.getAttribute('data-symbol');
          const name = btn.getAttribute('data-name');
          const priceHint = Number(btn.getAttribute('data-price') || 0);
          openBuyModal({
            symbol,
            name,
            priceHint,
            portfolioUuid: defaultPortfolioUuid,
            onSuccess: async () => {
              await refreshHoldings();
            },
          });
        });
      });
    }

    /*
      Performs a search
      @returns {Promise<void>} - Performs a search
    */
    async function doSearch() {
      const q = (searchInput?.value || '').trim();
      if (!q) return;
      try {
        resultsEl.innerHTML = '<div class="panel-loading">Searching...</div>';
        const items = await searchStocksFinancial(q);
        renderSearchResults(items);
      } catch (e) {
        resultsEl.innerHTML = '<div class="panel-error">Search failed</div>';
      }
    }

    searchBtn?.addEventListener('click', doSearch);
    searchInput?.addEventListener('keypress', e => {
      if (e.key === 'Enter') doSearch();
    });

    /*
      Sets up the add first holding button
      @returns {void} - Sets up the add first holding button
    */
    addFirstHoldingBtn?.addEventListener('click', () => {
      // Focus on search input to encourage user to search
      if (searchInput) {
        searchInput.focus();
        searchInput.placeholder =
          'Try searching for a stock like AAPL or Tesla';
      }
    });

    await setupPortfolioDropdown();
    await refreshHoldings();
    setTimeout(updateThemeImages, 100);
  }

  /*
    Opens the buy modal
    @param {Object} params - The parameters for the buy modal
    @returns {void} - Opens the buy modal
  */
  function openBuyModal({
    symbol,
    name,
    priceHint = 0,
    portfolioUuid,
    onSuccess,
  }) {
    const overlay = document.getElementById('buy-modal-overlay');
    const closeBtn = document.getElementById('buy-close');
    const cancelBtn = document.getElementById('buy-cancel');
    const form = document.getElementById('buy-form');
    const symEl = document.getElementById('buy-symbol');
    const priceEl = document.getElementById('buy-price');
    const portfolioEl = document.getElementById('buy-portfolio');
    const amountEl = document.getElementById('buy-amount');
    const costHelp = document.getElementById('buy-cost-help');
    const submitBtn = document.getElementById('buy-submit');

    let askPrice = 0;
    let currentBalance = 0;

    function close() {
      if (overlay) overlay.style.display = 'none';
      document.body.style.overflow = 'auto';
      if (form) form.reset();
      const err = form?.querySelector('.form-error');
      if (err) err.remove();
    }

    async function init() {
      if (!overlay) return;
      overlay.style.display = 'flex';
      document.body.style.overflow = 'hidden';
      symEl.value = symbol;
      priceEl.value = 'Loading...';
      submitBtn.disabled = true;

      // Populate portfolio dropdown
      await ensurePortfoliosLoaded();
      portfolioEl.innerHTML = '<option value="">Select a portfolio...</option>';
      portfoliosData.forEach(p => {
        const selected = p.uuid === portfolioUuid ? 'selected' : '';
        portfolioEl.innerHTML += `<option value="${p.uuid}" ${selected}>${p.name}${p.isDefault ? ' (Default)' : ''}</option>`;
      });

      try {
        currentBalance = await fetchBalance();
        const price = await fetchStockPrice(symbol).catch(() => ({ ask: 0 }));
        askPrice = Number(price.ask || priceHint || 0);
        priceEl.value = askPrice
          ? formatCurrency(askPrice)
          : priceHint
            ? formatCurrency(priceHint)
            : 'N/A';
      } catch {
        priceEl.value = priceHint ? formatCurrency(priceHint) : 'N/A';
      }
    }

    function recalc() {
      const qty = Number(amountEl.value || 0);
      const cost = qty * (askPrice || 0);
      const selectedPortfolio = portfolioEl.value;
      if (costHelp) costHelp.textContent = `Cost: ${formatCurrency(cost)}`;
      submitBtn.disabled = !(qty > 0 && askPrice > 0 && selectedPortfolio);
    }

    amountEl?.addEventListener('input', recalc);
    portfolioEl?.addEventListener('change', recalc);
    closeBtn?.addEventListener('click', close);
    cancelBtn?.addEventListener('click', close);
    overlay?.addEventListener('click', e => {
      if (e.target === overlay) close();
    });

    form?.addEventListener('submit', async e => {
      e.preventDefault();
      const qty = Number(amountEl.value || 0);
      const selectedPortfolio = portfolioEl.value;
      if (!(qty > 0)) {
        showFormError(form, 'Enter a valid amount');
        return;
      }
      if (!selectedPortfolio) {
        showFormError(form, 'Please select a portfolio');
        return;
      }
      submitBtn.disabled = true;
      try {
        const payload = {
          stockAmount: qty,
          currency: 'usd',
          portfolio_uuid: selectedPortfolio,
        };
        const res = await authenticatedFetch(
          `${API_BASE}/buy/${encodeURIComponent(symbol)}`,
          { method: 'POST', body: JSON.stringify(payload) }
        );
        const data = await res.json().catch(() => ({}));
        if (!res.ok)
          throw new Error(data.error || data.message || 'Buy failed');
        close();
        await refreshFundsCard();
        if (typeof onSuccess === 'function') await onSuccess();
      } catch (err) {
        showFormError(form, err.message || 'Buy failed');
      } finally {
        submitBtn.disabled = false;
      }
    });

    init();
  }

  /*
    Opens the edit holding modal
    @param {Object} params - The parameters for the edit holding modal
    @returns {void} - Opens the edit holding modal
  */
  function openEditHoldingModal({
    symbol,
    name,
    current,
    price,
    portfolioUuid,
    holdingData,
    onSuccess,
  }) {
    const overlay = document.getElementById('edit-holding-modal-overlay');
    const closeBtn = document.getElementById('edit-holding-close');
    const cancelBtn = document.getElementById('edit-holding-cancel');
    const form = document.getElementById('edit-holding-form');
    const symEl = document.getElementById('edit-holding-symbol');
    const currentEl = document.getElementById('edit-holding-current');
    const priceEl = document.getElementById('edit-holding-price');
    const portfolioEl = document.getElementById('edit-holding-portfolio');
    const actionEl = document.getElementById('edit-holding-action');
    const amountEl = document.getElementById('edit-holding-amount');
    const costHelp = document.getElementById('edit-holding-cost-help');
    const submitBtn = document.getElementById('edit-holding-submit');

    let askPrice = 0;
    let bidPrice = 0;
    let currentBalance = 0;

    function close() {
      if (overlay) overlay.style.display = 'none';
      document.body.style.overflow = 'auto';
      if (form) form.reset();
      const err = form?.querySelector('.form-error');
      if (err) err.remove();
    }

    async function init() {
      if (!overlay) return;
      overlay.style.display = 'flex';
      document.body.style.overflow = 'hidden';
      symEl.value = symbol;
      currentEl.value = `${current} shares`;
      priceEl.value = 'Loading...';
      submitBtn.disabled = true;

      /*
        Populate portfolio dropdown
        @returns {Promise<void>} - Populates the portfolio dropdown
      */
      await ensurePortfoliosLoaded();
      portfolioEl.innerHTML = '<option value="">Select a portfolio...</option>';
      portfoliosData.forEach(p => {
        const selected = p.uuid === portfolioUuid ? 'selected' : '';
        portfolioEl.innerHTML += `<option value="${p.uuid}" ${selected}>${p.name}${p.isDefault ? ' (Default)' : ''}</option>`;
      });

      try {
        currentBalance = await fetchBalance();
        const priceData = await fetchStockPrice(symbol).catch(() => ({
          ask: 0,
          bid: 0,
        }));
        askPrice = Number(priceData.ask || price || 0);
        bidPrice = Number(priceData.bid || price || 0);
        priceEl.value = `Ask: ${askPrice ? formatCurrency(askPrice) : 'N/A'} | Bid: ${bidPrice ? formatCurrency(bidPrice) : 'N/A'}`;
      } catch {
        priceEl.value = price ? `~${formatCurrency(price)}` : 'N/A';
      }
    }

    function recalc() {
      const qty = Number(amountEl.value || 0);
      const action = actionEl.value;
      const selectedPortfolio = portfolioEl.value;

      let cost = 0;
      let priceUsed = 0;

      if (action === 'buy') {
        priceUsed = askPrice;
        cost = qty * priceUsed;
        if (costHelp) costHelp.textContent = `Cost: ${formatCurrency(cost)}`;
      } else if (action === 'sell') {
        priceUsed = bidPrice;
        cost = qty * priceUsed;
        const maxSell = Number(current || 0);
        if (costHelp)
          costHelp.textContent = `Proceeds: ${formatCurrency(cost)} (Max: ${maxSell.toFixed(4)} shares)`;
        if (qty > maxSell) {
          if (costHelp)
            costHelp.textContent += ` - Warning: Cannot sell more than you own!`;
        }
      }

      /*
        Enable submit if all required fields are filled and valid
        @returns {void} - Enables the submit button
      */
      const isValid = qty > 0 && action && selectedPortfolio && priceUsed > 0;
      const sellValid = action !== 'sell' || qty <= Number(current || 0);
      submitBtn.disabled = !(isValid && sellValid);
    }

    amountEl?.addEventListener('input', recalc);
    portfolioEl?.addEventListener('change', recalc);
    actionEl?.addEventListener('change', recalc);
    closeBtn?.addEventListener('click', close);
    cancelBtn?.addEventListener('click', close);
    overlay?.addEventListener('click', e => {
      if (e.target === overlay) close();
    });

    form?.addEventListener('submit', async e => {
      e.preventDefault();
      const qty = Number(amountEl.value || 0);
      const action = actionEl.value;
      const selectedPortfolio = portfolioEl.value;

      if (!(qty > 0)) {
        showFormError(form, 'Enter a valid amount');
        return;
      }
      if (!action) {
        showFormError(form, 'Please select an action');
        return;
      }
      if (!selectedPortfolio) {
        showFormError(form, 'Please select a portfolio');
        return;
      }

      if (action === 'sell' && qty > Number(current || 0)) {
        showFormError(form, 'Cannot sell more shares than you own');
        return;
      }

      submitBtn.disabled = true;
      try {
        let endpoint = '';
        let payload = {};

        if (action === 'buy') {
          endpoint = `${API_BASE}/buy/${encodeURIComponent(symbol)}`;
          payload = {
            stockAmount: qty,
            currency: 'usd',
            portfolio_uuid: selectedPortfolio,
          };
        } else if (action === 'sell') {
          endpoint = `${API_BASE}/sell/${encodeURIComponent(symbol)}`;
          payload = {
            stockAmount: qty,
            currency: 'usd',
            portfolio_uuid: selectedPortfolio,
          };
        }

        const res = await authenticatedFetch(endpoint, {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok)
          throw new Error(data.error || data.message || `${action} failed`);
        close();
          /*
          Refresh funds card to show updated balance
          @returns {Promise<void>} - Refreshes the funds card
        */
        await refreshFundsCard();
        if (typeof onSuccess === 'function') await onSuccess();
      } catch (err) {
        showFormError(form, err.message || `${action} failed`);
      } finally {
        submitBtn.disabled = false;
      }
    });

    init();
  }

  /////////////////////////////////////////////////////////////////////////////////////
  //////////////////////////////    DASHBOARD CHARTS    //////////////////////////////
  /////////////////////////////////////////////////////////////////////////////////////

  /*
    Initializes the dashboard with charts and data loading
    @return {void} - Initializes the dashboard
  */
  async function initializeDashboard() {
    try {
      await Promise.all([
        loadDashboardData(),
        initializePortfolioChart(),
        initializeAllocationChart(),
        loadNewsData(),
      ]);
    } catch (error) {
      console.error('Error initializing dashboard:', error);
    }
  }

  /*
    Loads all dashboard data including balance, portfolios, and holdings
    @return {void} - Loads dashboard data
  */
  async function loadDashboardData() {
    try {
      // Fetch user balance
      const balance = await fetchBalance();

      // Update balance displays
      const availableBalanceEl = document.getElementById(
        'available-balance-val'
      );
      const mainBalanceDisplayEl = document.getElementById(
        'main-balance-display'
      );

      if (availableBalanceEl) {
        availableBalanceEl.textContent = formatCurrency(balance);
      }
      if (mainBalanceDisplayEl) {
        mainBalanceDisplayEl.textContent = formatCurrency(balance);
      }

      // Fetch portfolios and calculate total values
      await ensurePortfoliosLoaded();

      // Calculate total portfolio value and invested amount
      let totalInvested = 0;
      let totalPortfolioValue = 0;
      let totalDeposited = balance; // Start with current balance

      for (const portfolio of portfoliosData) {
        try {
          const holdings = await fetchHoldings(portfolio.uuid);
          if (holdings && holdings.length > 0) {
            for (const holding of holdings) {
              const investedAmount =
                Number(holding.amount_owned || 0) *
                Number(holding.buy_price || 0);
              const currentValue = Number(holding.total_value || 0);

              totalInvested += investedAmount;
              totalPortfolioValue += currentValue;
            }
          }
        } catch (error) {
          console.warn(
            `Error fetching holdings for portfolio ${portfolio.uuid}:`,
            error
          );
        }
      }

      totalDeposited += totalInvested;

      /*
        Update dashboard values
        @returns {void} - Updates the dashboard values
      */
      const totalPortfolioEl = document.getElementById('total-portfolio-value');
      const totalInvestedEl = document.getElementById('total-invested-val');
      const totalDepositedEl = document.getElementById('total-deposited-val');
      const changeAmountEl = document.getElementById('change-amount');
      const changePercentEl = document.getElementById('change-percent');
      const portfolioChangeEl = document.getElementById('portfolio-change');
      const totalHoldingsValueEl = document.getElementById(
        'total-holdings-value'
      );

      const totalValue = balance + totalPortfolioValue;
      const changeAmount = totalPortfolioValue - totalInvested;
      const changePercent =
        totalInvested > 0 ? (changeAmount / totalInvested) * 100 : 0;

      if (totalPortfolioEl) {
        totalPortfolioEl.textContent = formatCurrency(totalValue);
      }
      if (totalInvestedEl) {
        totalInvestedEl.textContent = formatCurrency(totalInvested);
      }
      if (totalDepositedEl) {
        totalDepositedEl.textContent = formatCurrency(totalDeposited);
      }
      if (totalHoldingsValueEl) {
        totalHoldingsValueEl.textContent = formatCurrency(totalPortfolioValue);
      }

      // Update change indicators
      if (changeAmountEl && changePercentEl && portfolioChangeEl) {
        const isPositive = changeAmount >= 0;
        changeAmountEl.textContent = `${isPositive ? '+' : ''}${formatCurrency(Math.abs(changeAmount))}`;
        changePercentEl.textContent = `(${isPositive ? '+' : ''}${changePercent.toFixed(2)}%)`;

        portfolioChangeEl.className = `value-change ${isPositive ? 'positive' : 'negative'}`;
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    }
  }

  /*
    Initializes the portfolio performance chart with dummy data
    @return {void} - Initializes the chart
  */
  function initializePortfolioChart() {
    const chartCanvas = document.getElementById('portfolio-chart');
    if (!chartCanvas) return;

    /*
      Destroy existing portfolio chart if it exists
      @returns {void} - Destroys the portfolio chart
    */
    if (portfolioChart) {
      portfolioChart.destroy();
      portfolioChart = null;
    }

    const ctx = chartCanvas.getContext('2d');

    /*
      Generate dummy data for the past year
      @returns {void} - Generates the dummy data
    */
    const labels = [];
    const data = [];
    const monthlyChanges = [];
    const startDate = new Date();
    startDate.setFullYear(startDate.getFullYear() - 1);

    let currentValue = 10000;
    const initialValue = currentValue;

    for (let i = 0; i < 12; i++) {
      const date = new Date(startDate);
      date.setMonth(date.getMonth() + i);
      labels.push(date.toLocaleDateString('en-US', { month: 'short' }));

      /*
        Add some realistic variance
        @returns {void} - Adds the realistic variance
      */
      const changePercent = (Math.random() - 0.4) * 0.15; // -6% to +9% monthly change
      monthlyChanges.push(changePercent * 100);
      currentValue *= 1 + changePercent;
      data.push(Math.round(currentValue));
    }

    /*
      Calculate stats
      @returns {void} - Calculates the stats
    */
    const totalReturn = (
      ((currentValue - initialValue) / initialValue) *
      100
    ).toFixed(1);
    const bestMonth = Math.max(...monthlyChanges).toFixed(1);
    const worstMonth = Math.min(...monthlyChanges).toFixed(1);
    const volatility =
      (monthlyChanges.reduce((sum, change, index, arr) => {
        const mean = arr.reduce((a, b) => a + b) / arr.length;
        return sum + Math.pow(change - mean, 2);
      }, 0) /
        monthlyChanges.length) **
      0.5;

    /*
      Update chart stats
      @returns {void} - Updates the chart stats
    */
    const totalReturnEl = document.getElementById('chart-total-return');
    const bestMonthEl = document.getElementById('chart-best-month');
    const worstMonthEl = document.getElementById('chart-worst-month');
    const volatilityEl = document.getElementById('chart-volatility');

    if (totalReturnEl)
      totalReturnEl.textContent = `${totalReturn >= 0 ? '+' : ''}${totalReturn}%`;
    if (bestMonthEl) bestMonthEl.textContent = `+${bestMonth}%`;
    if (worstMonthEl) worstMonthEl.textContent = `${worstMonth}%`;
    if (volatilityEl) volatilityEl.textContent = `${volatility.toFixed(1)}%`;

    /*
      Get theme colors
      @returns {void} - Gets the theme colors
    */
    const isDark = document.body.getAttribute('data-theme') === 'dark';
    const brandColor = isDark ? '#9c80ff' : '#299d91'; // Purple for dark mode, teal for light mode
    const textColor = isDark ? '#ffffff' : '#191919';
    const gridColor = isDark ? '#333333' : '#e5e5e5';

    portfolioChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Portfolio Value',
            data: data,
            borderColor: brandColor,
            backgroundColor: `${brandColor}20`,
            borderWidth: 3,
            fill: true,
            tension: 0.4,
            pointBackgroundColor: brandColor,
            pointBorderColor: brandColor,
            pointBorderWidth: 2,
            pointRadius: 4,
            pointHoverRadius: 6,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false,
          },
        },
        scales: {
          y: {
            beginAtZero: false,
            ticks: {
              color: textColor,
              callback: function (value) {
                return formatCurrency(value);
              },
            },
            grid: {
              color: gridColor,
            },
          },
          x: {
            ticks: {
              color: textColor,
            },
            grid: {
              color: gridColor,
            },
          },
        },
        elements: {
          point: {
            hoverBorderWidth: 3,
          },
        },
      },
    });
  }

  /*
    Initializes the portfolio allocation pie chart
    @return {void} - Initializes the allocation chart
  */
  let allocationChartRequestIdCounter = 0;                

  async function initializeAllocationChart() {
    const myRequestId = ++allocationChartRequestIdCounter;
    const chartCanvas = document.getElementById('allocation-chart');
    const legendContainer = document.getElementById('allocation-legend');
    if (!chartCanvas || !legendContainer) return;

    // Destroy existing allocation chart if it exists
    if (allocationChart) {
      allocationChart.destroy();
      allocationChart = null;
    }

    try {
      await ensurePortfoliosLoaded();
      if (myRequestId !== allocationChartRequestIdCounter) return;

      const allHoldings = [];

      // Collect all holdings from all portfolios
      for (const portfolio of portfoliosData) {
        try {
          const holdings = await fetchHoldings(portfolio.uuid);
          if (myRequestId !== allocationChartRequestIdCounter) return;
          if (holdings && holdings.length > 0) {
            allHoldings.push(
              ...holdings.map(h => ({
                ...h,
                portfolioName: portfolio.name,
              }))
            );
          }
        } catch (error) {
          console.warn(`Error fetching holdings for allocation chart:`, error);
        }
      }

      if (myRequestId !== allocationChartRequestIdCounter) return;
      if (allHoldings.length === 0) {
        // Show empty state
        chartCanvas.style.display = 'none';
        legendContainer.innerHTML =
          '<div style="text-align: center; color: var(--color-muted); padding: 20px;">No holdings to display</div>';
        return;
      }

      // Aggregate holdings by stock symbol
      const stockTotals = {};
      allHoldings.forEach(holding => {
        const symbol = holding.tag || holding.symbol || 'Unknown';
        const value = Number(holding.total_value || 0);

        if (stockTotals[symbol]) {
          stockTotals[symbol] += value;
        } else {
          stockTotals[symbol] = value;
        }
      });

      // Convert to arrays for chart
      const symbols = Object.keys(stockTotals);
      const values = Object.values(stockTotals);
      const totalValue = values.reduce((sum, val) => sum + val, 0);

      // Generate colors for each stock
      const colors = generateChartColors(symbols.length);

      // Ensure canvas and legend are visible when we have data
      chartCanvas.style.display = 'block';
      legendContainer.style.display = 'block';

      const ctx = chartCanvas.getContext('2d');

      allocationChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
          labels: symbols,
          datasets: [
            {
              data: values,
              backgroundColor: colors,
              borderWidth: 2,
              borderColor:
                document.body.getAttribute('data-theme') === 'dark'
                  ? '#0f0f0f'
                  : '#ffffff',
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: false,
            },
          },
          cutout: '60%',
        },
      });

      // Generate custom legend
      let legendHTML = '';
      symbols.forEach((symbol, index) => {
        const value = values[index];
        const percentage =
          totalValue > 0 ? ((value / totalValue) * 100).toFixed(1) : 0;

        legendHTML += `
          <div class="allocation-legend-item">
            <div class="legend-stock-info">
              <div class="legend-stock-color" style="background-color: ${colors[index]}"></div>
              <div class="legend-stock-details">
                <div class="legend-stock-symbol">${symbol}</div>
                <div class="legend-stock-percentage">${percentage}%</div>
              </div>
            </div>
            <div class="legend-stock-value">${formatCurrency(value)}</div>
          </div>
        `;
      });

      legendContainer.innerHTML = legendHTML;
    } catch (error) {
      console.error('Error initializing allocation chart:', error);
      legendContainer.innerHTML =
        '<div style="text-align: center; color: var(--color-negative); padding: 20px;">Error loading chart data</div>';
    }
  }

  /*
    Generates an array of colors for chart data
    @param {number} count - Number of colors needed
    @return {Array} - Array of color strings
  */
  function generateChartColors(count) {
    const isDark = document.body.getAttribute('data-theme') === 'dark';

    const lightColors = [
      '#299d91',
      '#3b82f6',
      '#8b5cf6',
      '#ef4444',
      '#f59e0b',
      '#10b981',
      '#f97316',
      '#ec4899',
      '#6366f1',
      '#84cc16',
    ];

    const darkColors = [
      '#299d91',
      '#60a5fa',
      '#a78bfa',
      '#f87171',
      '#fbbf24',
      '#34d399',
      '#fb923c',
      '#f472b6',
      '#818cf8',
      '#a3e635',
    ];

    const colors = isDark ? darkColors : lightColors;

    if (count <= colors.length) {
      return colors.slice(0, count);
    }

    // Generate additional colors if needed
    const result = [...colors];
    while (result.length < count) {
      result.push(
        `hsl(${Math.floor(Math.random() * 360)}, 70%, ${isDark ? 60 : 50}%)`
      );
    }

    return result;
  }

  /*
    Loads news data from the API
    @return {void} - Loads and displays news
  */
  async function loadNewsData() {
    const newsList = document.getElementById('news-list');
    const refreshBtn = document.getElementById('refresh-news');

    if (!newsList) return;

    // Set up refresh button
    if (refreshBtn) {
      refreshBtn.addEventListener('click', loadNewsData);
    }

    try {
      newsList.innerHTML =
        '<div class="news-loading">Loading latest market news...</div>';

      // Use a general financial news search term
      const response = await authenticatedFetch(
        `${API_BASE}/search/news/financial markets`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch news');
      }

      const newsData = await response.json();

      if (!newsData || newsData.length === 0) {
        newsList.innerHTML =
          '<div class="news-loading">No news available at the moment.</div>';
        return;
      }

      // Take only the first 5 articles and format them
      const articles = newsData.slice(0, 5);

      let newsHTML = '';
      articles.forEach(article => {
        const title = article.title || 'No title available';
        const source = article.publisher || 'Unknown source';
        const link = article.link || '#';
        const timestamp = article.providerPublishTime
          ? new Date(article.providerPublishTime * 1000).toLocaleDateString()
          : 'Recent';

        newsHTML += `
          <a href="${link}" target="_blank" class="news-item">
            <div class="news-title">${title}</div>
            <div class="news-meta">
              <span class="news-source">${source}</span>
              <span class="news-time">${timestamp}</span>
            </div>
          </a>
        `;
      });

      newsList.innerHTML = newsHTML;
    } catch (error) {
      console.error('Error loading news:', error);
      newsList.innerHTML =
        '<div class="news-error">Unable to load news at this time.</div>';
    }
  }

  /*
    Fetches portfolios from the API and poulates them with data
    @return {Promise<Array>} - Array of populated portfolio objects
  */
  async function fetchPortfolios(forceRefresh = false) {
    // Check cache first
    const now = Date.now();
    if (
      !forceRefresh &&
      portfoliosData.length > 0 &&
      now - portfoliosLastFetch < PORTFOLIOS_CACHE_DURATION
    ) {
      return portfoliosData;
    }

    // Prevent multiple concurrent requests
    if (portfoliosLoading) {
      // Wait for existing request to complete
      while (portfoliosLoading) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      return portfoliosData;
    }

    portfoliosLoading = true;
    portfoliosError = null;

    try {
      const response = await authenticatedFetch(`${API_BASE}/user/portfolio`);

      if (!response.ok) {
        throw new Error(`Failed to fetch portfolios: ${response.status}`);
      }

      const portfolios = await response.json();

      // Keep it fast: compute only lightweight fields; avoid per-holding price lookups
      const mapped = await Promise.all(
        portfolios.map(async portfolio => {
          const holdingsCount = await getHoldingsCount(portfolio.uuid);
          const totalValue = Number(
            portfolio.value || portfolio.totalValue || 0
          );
          const invested = Number(
            portfolio.inputValue || portfolio.invested || 0
          );
          const returnAmount = totalValue - invested;
          const returnPercent =
            invested > 0 ? (returnAmount / invested) * 100 : 0;
          return {
            id: portfolio.uuid,
            uuid: portfolio.uuid,
            name: portfolio.name,
            description: portfolio.description || '',
            totalValue,
            invested,
            returnAmount,
            returnPercent,
            riskProfile:
              portfolio.riskProfile || portfolio.risk_profile || 'Moderate',
            holdings: holdingsCount,
            lastUpdated: new Date().toISOString().split('T')[0],
            isDefault: portfolio.is_default,
            currency:
              portfolio.prefered_currency || portfolio.currency || 'USD',
            initialCash: portfolio.initialCash || portfolio.initial_cash || 0,
          };
        })
      );

      portfoliosData = mapped;
      portfoliosLastFetch = now;
      return mapped;
    } catch (error) {
      portfoliosError = error.message;
      throw error;
    } finally {
      portfoliosLoading = false;
    }
  }

  /*
    Gets the count of holdings for a specific portfolio
    @param {string} portfolioUuid - The unique identifier of the portfolio
    @return {Promise<number>} - The number of holdings in the portfolio
  */
  async function getHoldingsCount(portfolioUuid) {
    try {
      // Use the shares endpoint to get actual holdings count
      const response = await authenticatedFetch(
        `${API_BASE}/user/shares/${portfolioUuid}`
      );

      if (response.ok) {
        const shares = await response.json();
        return Array.isArray(shares) ? shares.length : 0;
      }
      return 0;
    } catch (error) {
      return 0;
    }
  }

  /*
    Creates a new portfolio via the API endpoint - POST /user/portfolio
    @param {object} portfolioData - The data for the new portfolio
    @return {Promise<object>} - The created portfolio
  */
  async function createPortfolioAPI(portfolioData) {
    try {
      const response = await authenticatedFetch(
        `${API_BASE}/user/portfolio/create`,
        {
          method: 'POST',
          body: JSON.stringify({
            name: portfolioData.name,
            isDefault: portfolioData.isDefault || false,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error || `Failed to create portfolio: ${response.status}`
        );
      }

      return await response.json();
    } catch (error) {
      throw error;
    }
  }

  /*
    Updates a portfolio via the API endpoint - PATCH /user/portfolio/update
    @param {string} portfolioUuid - The unique identifier of the portfolio
    @param {object} portfolioData - The data for the updated portfolio
    @return {Promise<object>} - The updated portfolio
  */
  async function updatePortfolioAPI(portfolioUuid, portfolioData) {
    try {
      const response = await authenticatedFetch(
        `${API_BASE}/user/portfolio/update`,
        {
          method: 'PATCH',
          body: JSON.stringify({
            name: portfolioData.name,
            isDefault: portfolioData.isDefault || false,
            portfolio_uuid: portfolioUuid,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error || `Failed to update portfolio: ${response.status}`
        );
      }

      return await response.json();
    } catch (error) {
      throw error;
    }
  }

  /*
    Deletes a portfolio via the API endpoint - DELETE /user/portfolio/:portfolio_uuid
    @param {string} portfolioUuid - The unique identifier of the portfolio
    @return {Promise<object>} - The deleted portfolio
  */
  async function deletePortfolioAPI(portfolioUuid) {
    try {
      const response = await authenticatedFetch(
        `${API_BASE}/user/portfolio/${portfolioUuid}`,
        {
          method: 'DELETE',
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        if (
          response.status === 400 &&
          errorData.message?.includes('not empty')
        ) {
          throw new Error(
            'Cannot delete portfolio with holdings. Please sell all stocks first.'
          );
        }
        throw new Error(
          errorData.error ||
            errorData.message ||
            `Failed to delete portfolio: ${response.status}`
        );
      }

      return await response.json();
    } catch (error) {
      throw error;
    }
  }

  /*
    Renders the portfolios page with laoding, error, empty or populated portfolio cards
    @return {void} - Renders the portfolios page
  */
  function renderPortfolios() {
    const portfoliosGrid = document.getElementById('portfolios-grid');
    if (!portfoliosGrid) return;

    // Show loading state if portfolios are still loading
    if (portfoliosLoading) {
      portfoliosGrid.innerHTML = `
        <div class="portfolios-loading">
          <div class="loading-skeleton">
            <div class="skeleton-card"></div>
            <div class="skeleton-card"></div>
            <div class="skeleton-card"></div>
          </div>
          <p>Loading your portfolios...</p>
        </div>
      `;
      return;
    }

    // Show error state if there is an error loading the portfolios
    if (portfoliosError) {
      portfoliosGrid.innerHTML = `
        <div class="portfolios-error">
          <p>Error loading portfolios: ${portfoliosError}</p>
          <button onclick="loadPortfoliosData()" class="btn-secondary">Try Again</button>
        </div>
      `;
      return;
    }

    // Show empty state if there are no portfolios
    if (portfoliosData.length === 0) {
      portfoliosGrid.innerHTML = `
        <div class="portfolios-empty">
          <div class="bar-chart-icon"><img id="bar-chart-icon-img" src="/images/bar-chart-icon-light.png" alt="Empty"></div>
          <h3>No Portfolios Yet</h3>
          <p>Create your first investment portfolio to start tracking your investments</p>
          <button onclick="document.getElementById('add-portfolio-btn').click()" class="btn-primary">Create Your First Portfolio</button>
        </div>
      `;
      return;
    }

    // Render portfolios with simplified stats
    const cards = portfoliosData
      .map(portfolio => {
        return `
        <div class="portfolio-card" data-portfolio-id="${portfolio.id}">
          <div class="portfolio-card-header">
            <div class="portfolio-info">
              <h3 class="portfolio-name">${portfolio.name}</h3>
              ${portfolio.isDefault ? '<span class="default-badge">Default</span>' : ''}
            </div>
          </div>
          <div class="portfolio-stats">
            <div class="stat-item">
              <span class="stat-label">Holdings</span>
              <span class="stat-value">${portfolio.holdings}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">Portfolio Value</span>
              <span class="stat-value">$${(portfolio.totalValue || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">Invested</span>
              <span class="stat-value">$${(portfolio.invested || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">Returned</span>
              <span class="stat-value">$${(portfolio.returnAmount || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
          </div>
          <div class="portfolio-actions">
            <button class="btn-view" onclick="redirectToHoldings('${portfolio.uuid}')">View</button>
            <button class="btn-edit" onclick="openEditModal('${portfolio.uuid}')">Edit</button>
            <button class="btn-delete" onclick="showDeleteConfirmation('${portfolio.uuid}', '${portfolio.name.replace(/'/g, "\\'")}')">Delete</button>
          </div>
        </div>`;
      })
      .join('');

    portfoliosGrid.innerHTML = cards;
  }

  /*
    Loads the portfolios data from the API and renders the portfolios page
    @return {void} - Loads the portfolios data from the API and renders the portfolios page
  */
  async function loadPortfoliosData() {
    // Show loading state
    const portfoliosList = document.getElementById('portfolios-list');
    const totalValueEl = document.getElementById('total-value');
    const totalInvestedEl = document.getElementById('total-invested');
    const totalReturnEl = document.getElementById('total-return');
    const totalReturnPercentEl = document.getElementById(
      'total-return-percent'
    );

    if (portfoliosList) {
      portfoliosList.innerHTML =
        '<div style="padding: 40px; text-align: center; color: var(--color-muted);">Loading portfolios...</div>';
    }
    if (totalValueEl) totalValueEl.textContent = 'Loading...';
    if (totalInvestedEl) totalInvestedEl.textContent = 'Loading...';
    if (totalReturnEl) totalReturnEl.textContent = 'Loading...';
    if (totalReturnPercentEl) totalReturnPercentEl.textContent = '';

    try {
      await fetchPortfolios();
      renderPortfolios();
      updateThemeImages(); // Update theme images after rendering
    } catch (error) {
      renderPortfolios();
      updateThemeImages(); // Update theme images after rendering error state
    }
  }

  /*
    Redirects to the holdings page by triggering the holdings nav item
    @param {string} portfolioUuid - The unique identifier of the portfolio
    @return {void} - Redirects to the holdings page
  */
  window.redirectToHoldings = function (portfolioUuid) {
    const holdingsNavItem = document.querySelector('.nav-item:nth-child(3)'); // Holdings is the 3rd nav item
    if (holdingsNavItem) {
      holdingsNavItem.click();
    }
  };

  /*
    Opens the edit modal
    @param {string} portfolioUuid - The unique identifier of the portfolio
    @return {void} - Opens the edit modal
  */
  window.openEditModal = function (portfolioUuid) {
    const portfolio = portfoliosData.find(p => p.uuid === portfolioUuid);
    if (!portfolio) {
      return;
    }

    const editModal = document.getElementById('edit-portfolio-modal-overlay');
    const editForm = document.getElementById('edit-portfolio-form');

    if (!editModal || !editForm) return;

    // Populate form with current portfolio data
    document.getElementById('edit-portfolio-name').value = portfolio.name || '';
    document.getElementById('edit-portfolio-default').checked =
      portfolio.isDefault || false;

    // Store the portfolio UUID for form submission
    editForm.dataset.portfolioUuid = portfolioUuid;

    // Show modal
    editModal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
  };

  /*
    Shows the delete modal
    @param {string} portfolioUuid - The unique identifier of the portfolio
    @param {string} portfolioName - The name of the portfolio
    @return {void} - Shows the delete modal
  */
  window.showDeleteConfirmation = function (portfolioUuid, portfolioName) {
    const deleteModal = document.getElementById('delete-modal-overlay');
    const portfolioNameSpan = document.getElementById('delete-portfolio-name');
    const confirmBtn = document.getElementById('confirm-delete-btn');

    if (!deleteModal || !portfolioNameSpan || !confirmBtn) return;

    portfolioNameSpan.textContent = portfolioName;
    confirmBtn.onclick = () =>
      handleDeleteConfirmation(portfolioUuid, portfolioName);

    deleteModal.style.display = 'flex';
    document.body.style.overflow = 'hidden';

    // Update theme images when modal is shown
    updateThemeImages();
  };

  /*
    Handles the delete confirmation
    @param {string} portfolioUuid - The unique identifier of the portfolio
    @param {string} portfolioName - The name of the portfolio
    @return {void} - Handles the delete confirmation
  */
  async function handleDeleteConfirmation(portfolioUuid, portfolioName) {
    const confirmBtn = document.getElementById('confirm-delete-btn');
    const originalText = confirmBtn.textContent;

    try {
      // Update button state
      confirmBtn.disabled = true;
      confirmBtn.textContent = 'Deleting...';

      // Clear any existing error messages
      const existingError = document.querySelector('#delete-modal .form-error');
      if (existingError) existingError.remove();

      // Call delete API
      await deletePortfolioAPI(portfolioUuid);

      // Hide modal
      hideDeleteModal();

      // Refresh portfolios list
      await loadPortfoliosData();
    } catch (error) {
      showDeleteError(
        error.message || 'Failed to delete portfolio. Please try again.'
      );

      // Reset button state
      confirmBtn.disabled = false;
      confirmBtn.textContent = originalText;
    }
  }

  /*
    Hides the delete modal by hiding the modal overlay and resetting the button state
    @return {void} - Hides the delete modal
  */
  function hideDeleteModal() {
    const deleteModal = document.getElementById('delete-modal-overlay');
    if (deleteModal) {
      deleteModal.style.display = 'none';
      document.body.style.overflow = 'auto';

      // Clear any error messages from the modal
      const errorMsg = deleteModal.querySelector('.form-error');
      if (errorMsg) errorMsg.remove();

      // Reset button state to allow for future deletions
      const confirmBtn = document.getElementById('confirm-delete-btn');
      if (confirmBtn) {
        confirmBtn.disabled = false;
        confirmBtn.textContent = 'Delete Portfolio';
      }
    }
  }

  /*
    Shows an error message in the delete modal
    @param {string} message - The message to show
    @return {void} - Shows an error message in the delete modal
  */
  function showDeleteError(message) {
    const deleteModal = document.getElementById('delete-modal');
    const existingError = deleteModal.querySelector('.form-error');
    if (existingError) existingError.remove();

    const errorDiv = document.createElement('div');
    errorDiv.className = 'form-error';
    errorDiv.style.color = '#e74c3c';
    errorDiv.style.marginTop = '10px';
    errorDiv.style.fontSize = '14px';
    errorDiv.textContent = message;

    const actions = deleteModal.querySelector('.modal-actions');
    if (actions) {
      actions.parentNode.insertBefore(errorDiv, actions);
    }
  }

  /*
    Sets up the portfolio modal by adding event listeners to the modal and form
    @return {void} - Sets up the portfolio modal
  */
  function setupPortfolioModal() {
    const addPortfolioBtn = document.getElementById('add-portfolio-btn');
    const modalOverlay = document.getElementById('portfolio-modal-overlay');
    const modalCloseBtn = document.getElementById('modal-close-btn');
    const cancelBtn = document.getElementById('cancel-portfolio-btn');
    const portfolioForm = document.getElementById('portfolio-form');

    if (!addPortfolioBtn || !modalOverlay) return;

    // Show modal by displaying the modal overlay and setting the body overflow to hidden
    addPortfolioBtn.addEventListener('click', () => {
      modalOverlay.style.display = 'flex';
      document.body.style.overflow = 'hidden';
    });

    /*
      Hides the portfolio modal by hiding the modal overlay and resetting the form and button state
      @return {void} - Hides the portfolio modal
    */
    function hideModal() {
      modalOverlay.style.display = 'none';
      document.body.style.overflow = 'auto';
      portfolioForm.reset();
      // Clear any error messages from the form
      const errorMsg = portfolioForm.querySelector('.form-error');
      if (errorMsg) errorMsg.remove();
      // Re-enable submit button to allow for future submissions
      const submitBtn = portfolioForm.querySelector('button[type="submit"]');
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Create Portfolio';
      }
    }

    modalCloseBtn?.addEventListener('click', hideModal);
    cancelBtn?.addEventListener('click', hideModal);

    modalOverlay.addEventListener('click', e => {
      if (e.target === modalOverlay) {
        hideModal();
      }
    });

    // Handle form submission by creating a new portfolio via the API
    portfolioForm?.addEventListener('submit', async e => {
      e.preventDefault();

      const formData = new FormData(portfolioForm);
      const portfolioData = {
        name: formData.get('name')?.trim(),
        description: formData.get('description')?.trim(),
        riskProfile: formData.get('riskProfile'),
        initialCash: parseFloat(formData.get('initialCash')) || 0,
        isDefault: portfoliosData.length === 0, // First portfolio is default
      };

      // Validate required fields
      if (!portfolioData.name) {
        showFormError(portfolioForm, 'Portfolio name is required');
        return;
      }

      if (portfolioData.name.length < 2) {
        showFormError(
          portfolioForm,
          'Portfolio name must be at least 2 characters long'
        );
        return;
      }

      if (portfolioData.name.length > 100) {
        showFormError(
          portfolioForm,
          'Portfolio name must be less than 100 characters'
        );
        return;
      }

      if (portfolioData.description && portfolioData.description.length > 500) {
        showFormError(
          portfolioForm,
          'Description must be less than 500 characters'
        );
        return;
      }

      const submitBtn = portfolioForm.querySelector('button[type="submit"]');
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Creating...';
      }

      try {
        // Clear any previous error messages from the form
        const errorMsg = portfolioForm.querySelector('.form-error');
        if (errorMsg) errorMsg.remove();

        // Create portfolio via API and refresh portfolios list
        await createPortfolioAPI(portfolioData);
        invalidatePortfoliosCache(); // Invalidate cache after creating portfolio
        await loadPortfoliosData();
        hideModal();
      } catch (error) {
        showFormError(
          portfolioForm,
          error.message || 'Failed to create portfolio. Please try again.'
        );

        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = 'Create Portfolio';
        }
      }
    });
  }

  /*
    Sets up the edit modal by adding event listeners to the modal and form
    @return {void} - Sets up the edit modal
  */
  function setupEditModal() {
    const editModalOverlay = document.getElementById(
      'edit-portfolio-modal-overlay'
    );
    const editModalCloseBtn = document.getElementById('edit-modal-close-btn');
    const cancelEditBtn = document.getElementById('cancel-edit-btn');
    const editForm = document.getElementById('edit-portfolio-form');

    if (!editModalOverlay || !editForm) return;

    /*
      Hides the edit modal by hiding the modal overlay and resetting the form and button state
      @return {void} - Hides the edit modal
    */
    function hideEditModal() {
      editModalOverlay.style.display = 'none';
      document.body.style.overflow = 'auto';
      editForm.reset();
      delete editForm.dataset.portfolioUuid;
      // Clear any error messages from the form
      const errorMsg = editForm.querySelector('.form-error');
      if (errorMsg) errorMsg.remove();
      // Re-enable submit button to allow for future submissions
      const submitBtn = editForm.querySelector('button[type="submit"]');
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Update Portfolio';
      }
    }

    // Close modal handlers
    editModalCloseBtn?.addEventListener('click', hideEditModal);
    cancelEditBtn?.addEventListener('click', hideEditModal);

    editModalOverlay.addEventListener('click', e => {
      if (e.target === editModalOverlay) {
        hideEditModal();
      }
    });

    // Handle form submission
    editForm?.addEventListener('submit', async e => {
      e.preventDefault();

      const portfolioUuid = editForm.dataset.portfolioUuid;
      if (!portfolioUuid) {
        return;
      }

      const formData = new FormData(editForm);
      const portfolioData = {
        name: formData.get('name')?.trim(),
        isDefault: formData.get('isDefault') === 'on',
      };

      // Validate required fields
      if (!portfolioData.name) {
        showFormError(editForm, 'Portfolio name is required');
        return;
      }

      if (portfolioData.name.length < 2) {
        showFormError(
          editForm,
          'Portfolio name must be at least 2 characters long'
        );
        return;
      }

      if (portfolioData.name.length > 100) {
        showFormError(
          editForm,
          'Portfolio name must be less than 100 characters'
        );
        return;
      }

      const submitBtn = editForm.querySelector('button[type="submit"]');
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Updating...';
      }

      try {
        // Clear any previous error messages
        const errorMsg = editForm.querySelector('.form-error');
        if (errorMsg) errorMsg.remove();

        // Update portfolio via API
        await updatePortfolioAPI(portfolioUuid, portfolioData);

        // Refresh portfolios list
        await loadPortfoliosData();

        hideEditModal();
      } catch (error) {
        showFormError(
          editForm,
          error.message || 'Failed to update portfolio. Please try again.'
        );

        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = 'Update Portfolio';
        }
      }
    });
  }

  /*
    Sets up the delete modal by adding event listeners to the modal and form
    @return {void} - Sets up the delete modal
  */
  function setupDeleteModal() {
    const deleteModalOverlay = document.getElementById('delete-modal-overlay');
    const deleteModalCloseBtn = document.getElementById(
      'delete-modal-close-btn'
    );
    const cancelDeleteBtn = document.getElementById('cancel-delete-btn');

    if (!deleteModalOverlay) return;

    // Close modal handlers by hiding the modal overlay and resetting the button state
    deleteModalCloseBtn?.addEventListener('click', hideDeleteModal);
    cancelDeleteBtn?.addEventListener('click', hideDeleteModal);

    deleteModalOverlay.addEventListener('click', e => {
      if (e.target === deleteModalOverlay) {
        hideDeleteModal();
      }
    });
  }

  /*
    Shows an error message in the form
    @param {object} form - The form to show the error message in
    @param {string} message - The message to show
    @return {void} - Shows an error message in the form
  */
  function showFormError(form, message) {
    // Remove any existing error message from the form
    const existingError = form.querySelector('.form-error');
    if (existingError) existingError.remove();

    // Create and insert error message into the form
    const errorDiv = document.createElement('div');
    errorDiv.className = 'form-error';
    errorDiv.style.color = '#e74c3c';
    errorDiv.style.marginTop = '10px';
    errorDiv.style.fontSize = '14px';
    errorDiv.textContent = message;

    const actions = form.querySelector('.modal-actions');
    if (actions) {
      actions.parentNode.insertBefore(errorDiv, actions);
    }
  }

  /*
    Loads and displays a specific page content
    @param {string} page - The page to load
    @return {void} - Loads the page
  */
  function loadPage(page) {
    if (pageTemplates[page]) {
      mainContent.innerHTML = pageTemplates[page];
      updatePageTitle(page);

      if (page === 'transactions') {
        renderTransactions();
      }

      // If portfolios page, set up portfolio functionality
      if (page === 'portfolios') {
        setupPortfolioModal();
        setupEditModal();
        setupDeleteModal();
        loadPortfoliosData(); // Load portfolios from API
        // Update theme images after a short delay to ensure DOM is ready
        setTimeout(updateThemeImages, 100);
      }

      // If dashboard, wire funds card and modals
      if (page === 'dashboard') {
        setupFundsCard();
        initializeDashboard();
        startBackgroundUpdates(); // Start background updates for dashboard
      } else {
        stopBackgroundUpdates(); // Stop background updates when not on dashboard
      }

      // If holdings, wire summary, list, search and buy
      if (page === 'holdings') {
        setupHoldingsPage();
      }
    }
  }

  // Set up navigation
  navItems.forEach(item => {
    item.addEventListener('click', function (e) {
      e.preventDefault();

      navItems.forEach(nav => nav.classList.remove('active'));

      this.classList.add('active');

      const pageText =
        this.querySelector('.nav-text').textContent.toLowerCase();
      loadPage(pageText);
    });
  });

  /*
    Shows a specific view - login, register, dashboard
    @param {string} view - The view to show
    @return {void} - Shows the view
  */
  function showView(view) {
    if (loginSection)
      loginSection.style.display = view === 'login' ? 'block' : 'none';
    if (registerSection)
      registerSection.style.display = view === 'register' ? 'block' : 'none';
    if (dashboardSection)
      dashboardSection.style.display = view === 'dashboard' ? 'block' : 'none';

    if (view === 'login' || view === 'register') {
      document.body.classList.add('auth-page');
    } else {
      document.body.classList.remove('auth-page');
    }
  }

  const API_BASE =
    location.port === '5500' || location.port === '5173'
      ? 'http://localhost:3000'
      : '';

  // Authentication
  const AUTH_TOKEN_KEY = 'auth_token';
  const USER_DATA_KEY = 'user_data';

  /*
    Checks if the user is authenticated
    @return {boolean} - True if the user is authenticated, false otherwise
  */
  function isAuthenticated() {
    const token = sessionStorage.getItem(AUTH_TOKEN_KEY);
    if (!token) return false;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Date.now() / 1000;
      return payload.exp > currentTime;
    } catch {
      return false;
    }
  }

  /*
    Stores authentication data
    @param {string} token - The authentication token
    @param {object} userData - The user data
    @return {void} - Stores the authentication data
  */
  function storeAuthData(token, userData = null) {
    sessionStorage.setItem(AUTH_TOKEN_KEY, token);
    if (userData) {
      sessionStorage.setItem(USER_DATA_KEY, JSON.stringify(userData));
    }
  }

  /*
    Clears all authentication data from session storage
    @return {void} - Clears the authentication data
  */
  function clearAuthData() {
    sessionStorage.removeItem(AUTH_TOKEN_KEY);
    sessionStorage.removeItem(USER_DATA_KEY);
  }

  /*
    Gets stored user data from session storage
    @return {object} - The user data object or null if no user data is found
  */
  function getUserData() {
    const userData = sessionStorage.getItem(USER_DATA_KEY);
    return userData ? JSON.parse(userData) : null;
  }

  /*
    Capitalises the first letter of a word
    @param {string} str - The word to capitalise
    @return {string} - The capitalised word
  */
  function capitalizeWord(str) {
    if (!str || typeof str !== 'string') return '';
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  }

  /*
    Formats a full name by capitalising the first letter of the first and last name
    @param {string} firstName - The first name
    @param {string} lastName - The last name
    @return {string} - The formatted full name
  */
  function formatFullName(firstName, lastName) {
    const parts = [];
    if (firstName) parts.push(capitalizeWord(firstName));
    if (lastName) parts.push(capitalizeWord(lastName));
    return parts.join(' ');
  }

  /*
    Gets the display first name from the user data - fname, username or empty string if no user data is found
    @return {string} - The display first name
  */
  function getDisplayFirstName() {
    const userData = getUserData();
    if (!userData) return '';
    const first = userData.fname || userData.username || '';
    return capitalizeWord(first);
  }

  /*
    Gets the authentication token for API requests from session storage
    @return {string} - The authentication token
  */
  function getAuthToken() {
    return sessionStorage.getItem(AUTH_TOKEN_KEY);
  }

  /*
    Makes an authenticated API request with the authentication token from session storage
    @param {string} url - The URL to make the request to
    @param {object} options - The options for the request
    @return {Promise<Response>} - The response from the API
  */
  async function authenticatedFetch(url, options = {}) {
    const token = getAuthToken();
    if (!token) {
      throw new Error('No authentication token');
    }

    const headers = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...options.headers,
    };

    return fetch(url, { ...options, headers });
  }

  /*
    Updates the user display in the dashboard
    @return {void} - Updates the user display
  */
  function updateUserDisplay() {
    const userData = getUserData();
    if (userData) {
      const greeting = document.querySelector('.greeting');
      if (greeting) {
        const firstName = getDisplayFirstName();
        greeting.textContent = firstName ? `Hello ${firstName}` : 'Hello';
      }

      // Update profile name
      const profileName = document.querySelector('.profile-name');
      if (profileName) {
        const firstName =
          userData.firstName || userData.fName || userData.fname;
        const lastName = userData.lastName || userData.lName || userData.lname;
        const hasAnyName = Boolean(firstName) || Boolean(lastName);
        const fullName = hasAnyName
          ? formatFullName(firstName, lastName)
          : capitalizeWord(userData.username);
        profileName.textContent = fullName;
      }

      // Update avatar initial
      const avatar = document.querySelector('.avatar');
      if (avatar) {
        const firstName =
          userData.firstName || userData.fName || userData.fname;
        const initial = firstName
          ? firstName.charAt(0).toUpperCase()
          : userData.username.charAt(0).toUpperCase();
        avatar.textContent = initial;
      }
    }
  }

  /*
    Checks the authentication status on page load and periodically
    @return {void} - Checks the authentication status
  */
  function checkAuthStatus() {
    if (!isAuthenticated()) {
      clearAuthData();
      if (
        document.getElementById('dashboard-section').style.display !== 'none'
      ) {
        showView('login');
      }
    }
  }

  // Check authentication status every 5 minutes
  setInterval(checkAuthStatus, 5 * 60 * 1000);

  // Sync stock prices with backend every minute (if authenticated)
  setInterval(async () => {
    if (isAuthenticated()) {
      await syncStockPrices();
      // Refresh current view if it's holdings or portfolios
      const currentView = document.querySelector('.view.active')?.id;
      if (currentView === 'holdings' || currentView === 'portfolios') {
        await showView(currentView);
      }
    }
  }, 60 * 1000); // Every 60 seconds

  const isAuthed = isAuthenticated();

  // Sync stock prices on initial load if authenticated
  if (isAuthed) {
    syncStockPrices().catch(() => {});
  }

  showView(isAuthed ? 'dashboard' : 'login');
  if (isAuthed) {
    loadPage('dashboard');
  }

  const goToRegister = document.getElementById('go-to-register');
  if (goToRegister)
    goToRegister.addEventListener('click', e => {
      e.preventDefault();
      showView('register');
    });

  const goToLogin = document.getElementById('go-to-login');
  if (goToLogin)
    goToLogin.addEventListener('click', e => {
      e.preventDefault();
      showView('login');
    });

  // Login submit
  const loginForm = document.getElementById('loginForm');
  const loginErrorEl = document.getElementById('loginError');
  if (loginForm) {
    loginForm.addEventListener('submit', async e => {
      e.preventDefault();
      loginErrorEl.hidden = true;
      loginErrorEl.textContent = '';

      const data = {
        username: loginForm.username.value.trim(),
        password: loginForm.password.value,
      };

      if (!data.username || !data.password) {
        loginErrorEl.textContent = 'Please enter username and password.';
        loginErrorEl.hidden = false;
        return;
      }

      const btn = loginForm.querySelector('button[type="submit"]');
      btn.disabled = true;
      try {
        const res = await fetch(`${API_BASE}/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
        const payload = await res.json().catch(() => ({}));
        if (!res.ok)
          throw new Error(payload.error || payload.message || 'Login failed');

        if (payload.token) {
          // Store user data for display
          const userData = { username: data.username };
          storeAuthData(payload.token, userData);
          showView('dashboard');
          loadPage('dashboard');
          updateUserDisplay();
        } else {
          throw new Error('No token received');
        }
      } catch (err) {
        loginErrorEl.textContent = err.message || 'Login failed';
        loginErrorEl.hidden = false;
      } finally {
        btn.disabled = false;
      }
    });
  }

  // Register submit
  const registerForm = document.getElementById('registerForm');
  const registerErrorEl = document.getElementById('registerError');
  if (registerForm) {
    registerForm.addEventListener('submit', async e => {
      e.preventDefault();
      registerErrorEl.hidden = true;
      registerErrorEl.textContent = '';

      // Collect form data
      const firstName = registerForm.firstName.value.trim();
      const lastName = registerForm.lastName.value.trim();
      const username = registerForm.username.value.trim();
      const password = registerForm.password.value;
      const confirmPassword = registerForm.confirmPassword.value;

      // Validation
      if (
        !firstName ||
        !lastName ||
        !username ||
        !password ||
        !confirmPassword
      ) {
        registerErrorEl.textContent = 'All fields are required.';
        registerErrorEl.hidden = false;
        return;
      }
      if (password.length < 6) {
        registerErrorEl.textContent = 'Password must be at least 6 characters.';
        registerErrorEl.hidden = false;
        return;
      }
      if (password !== confirmPassword) {
        registerErrorEl.textContent = 'Passwords do not match.';
        registerErrorEl.hidden = false;
        return;
      }

      const data = {
        username: username,
        password: password,
        fname: firstName,
        lname: lastName,
      };

      const btn = registerForm.querySelector('button[type="submit"]');
      btn.disabled = true;
      try {
        const res = await fetch(`${API_BASE}/auth/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
        const payload = await res.json().catch(() => ({}));
        if (!res.ok)
          throw new Error(
            payload.error || payload.message || 'Registration failed'
          );

        // After successful registration, automatically log in
        const loginData = { username: username, password: password };
        const loginRes = await fetch(`${API_BASE}/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(loginData),
        });
        const loginPayload = await loginRes.json().catch(() => ({}));

        if (loginRes.ok && loginPayload.token) {
          // Store user data including firstName/lastName for future use
          const userData = {
            username: username,
            firstName: firstName,
            lastName: lastName,
          };
          storeAuthData(loginPayload.token, userData);
          showView('dashboard');
          loadPage('dashboard');
          updateUserDisplay();
        } else {
          // Registration successful but auto-login failed, redirect to login
          showView('login');
        }
      } catch (err) {
        registerErrorEl.textContent = err.message || 'Registration failed';
        registerErrorEl.hidden = false;
      } finally {
        btn.disabled = false;
      }
    });
  }

  // Logout
  const logoutLink = document.querySelector('.logout-item');
  if (logoutLink) {
    logoutLink.addEventListener('click', e => {
      e.preventDefault();
      clearAuthData();
      showView('login');
    });
  }

  // Initial setup
  if (isAuthed) {
    updateUserDisplay();
  }
});
