# WalletLens Technical Report

## 1. Project Overview

**WalletLens** is a frontend-only Bitcoin testnet wallet explorer built as a React single-page application. Its purpose is to let a user inspect a Bitcoin testnet address and review:

- Chain balance
- Total received
- Total sent
- Transaction history
- Transaction-level fee and confirmation metadata
- UTXO inventory for spendable outputs

The application is designed to feel closer to a lightweight Bitcoin developer tool than a generic crypto dashboard.

## 2. Current Scope

WalletLens currently operates as a **client-side explorer dashboard** with no custom backend. All live blockchain data comes directly from the **Blockstream Esplora testnet API**.

Primary explorer surfaces:

- Address search and validation
- Wallet summary cards
- Transaction list with direction inference
- Transaction details modal
- UTXO panel
- Demo address bootstrap flow
- Copy-to-clipboard utilities

## 3. Tech Stack

### Runtime and Build

- **React 18.3.1**
- **React DOM 18.3.1**
- **Vite 5.4.10**
- **@vitejs/plugin-react 4.3.3**

Reference: `frontend/package.json`  
Source: [package.json](/Users/jaydroid/Projects/wellet-lens/frontend/package.json#L1)

### Styling and Motion

- **Tailwind CSS 3.4.14**
- **PostCSS 8.4.47**
- **Autoprefixer 10.4.20**
- **Framer Motion 11.11.17**

### UI and Icons

- **lucide-react 0.462.0**

## 4. High-Level Architecture

WalletLens follows a fairly clean frontend architecture:

- **Pages** own composition and page-level orchestration.
- **Hooks** own async state, request lifecycle, and UI-facing data state.
- **Services** own Esplora API requests and response normalization.
- **Components** render reusable UI pieces and domain views.
- **Utilities** format or transform raw values for display.

This keeps network/data concerns away from presentational components and prevents the page component from becoming a monolith.

## 5. Project Structure

```text
frontend/
  src/
    components/
      UI/
        Badge.jsx
        Card.jsx
        CopyButton.jsx
        EmptyState.jsx
        Loader.jsx
      AddressSearch.jsx
      Navbar.jsx
      SummaryCards.jsx
      TransactionCard.jsx
      TransactionDetailsModal.jsx
      TransactionList.jsx
      UtxoPanel.jsx
    hooks/
      useAddressData.js
      useTxDetails.js
    pages/
      Home.jsx
    services/
      bitcoinApi.js
      demoAddress.js
      mockWalletData.js
    utils/
      cn.js
      formatBTC.js
      formatDate.js
      shortenTxid.js
```

Reference: [Home.jsx](/Users/jaydroid/Projects/wellet-lens/frontend/src/pages/Home.jsx#L1)

## 6. Entry Points

### `main.jsx`

Bootstraps the React app and mounts the root component.

Source: [main.jsx](/Users/jaydroid/Projects/wellet-lens/frontend/src/main.jsx)

### `App.jsx`

Thin application shell that renders the home page.

Source: [App.jsx](/Users/jaydroid/Projects/wellet-lens/frontend/src/App.jsx)

### `Home.jsx`

This is the page-level orchestrator. It composes:

- Navbar
- Hero section
- Address search panel
- Dataset metadata strip
- Summary cards
- Transaction list
- UTXO panel
- Transaction details modal

It wires together the two main domain hooks:

- `useAddressData`
- `useTxDetails`

Source: [Home.jsx](/Users/jaydroid/Projects/wellet-lens/frontend/src/pages/Home.jsx#L56)

## 7. Data Sources

WalletLens uses the Blockstream Esplora testnet API:

- `/address/:address`
- `/address/:address/txs`
- `/address/:address/utxo`
- `/tx/:txid`
- `/blocks/tip/height`

Base URL:

```text
https://blockstream.info/testnet/api
```

The app also defines a known working demo address to make the product usable even before a user pastes an address.

Source: [bitcoinApi.js](/Users/jaydroid/Projects/wellet-lens/frontend/src/services/bitcoinApi.js#L1)  
Source: [demoAddress.js](/Users/jaydroid/Projects/wellet-lens/frontend/src/services/demoAddress.js#L1)

## 8. API Service Layer

### `bitcoinApi.js`

This is the core integration layer. It handles:

- Esplora base URL configuration
- Testnet address validation
- Request lifecycle
- Network error normalization
- Confirmation calculation
- Wallet summary normalization
- Transaction normalization
- Fee-rate calculation

Source: [bitcoinApi.js](/Users/jaydroid/Projects/wellet-lens/frontend/src/services/bitcoinApi.js#L1)

### Important behaviors

#### 8.1 Address Validation

The validator currently only accepts **Bech32 testnet addresses beginning with `tb1`**.

```js
/^tb1[qpzry9x8gf2tvdw0s3jn54khce6mua7l]{11,71}$/i
```

This intentionally enforces the product requirement to validate `tb1` addresses before any network call.

Source: [bitcoinApi.js](/Users/jaydroid/Projects/wellet-lens/frontend/src/services/bitcoinApi.js#L2)

#### 8.2 Network Error Mapping

The `request()` helper converts fetch failures into structured errors with:

- `message`
- `status`
- `path`
- `kind`

If `fetch()` throws outside an abort case, the app maps it to:

```text
Unable to fetch data from network.
```

Source: [bitcoinApi.js](/Users/jaydroid/Projects/wellet-lens/frontend/src/services/bitcoinApi.js#L13)

#### 8.3 Wallet Summary Math

The wallet summary is normalized from Esplora address stats.

Current formulas:

- `balance = chain_stats.funded_txo_sum - chain_stats.spent_txo_sum`
- `totalReceived = chain_stats.funded_txo_sum`
- `totalSent = chain_stats.spent_txo_sum`
- `transactionCount = chain_stats.tx_count + mempool_stats.tx_count`
- `pendingDelta = mempool_stats.funded_txo_sum - mempool_stats.spent_txo_sum`

This means the headline balance is explicitly the **chain balance**, while mempool delta is shown separately.

Source: [bitcoinApi.js](/Users/jaydroid/Projects/wellet-lens/frontend/src/services/bitcoinApi.js#L150)

#### 8.4 Transaction Direction Inference

Transaction direction is not inferred from raw net sign alone. Instead:

- If the searched address appears in transaction inputs, WalletLens treats it as **outgoing**
- Else if the searched address appears in transaction outputs, WalletLens treats it as **incoming**
- Else it is marked **neutral**

This mirrors the user-facing explorer requirement more closely.

Source: [bitcoinApi.js](/Users/jaydroid/Projects/wellet-lens/frontend/src/services/bitcoinApi.js#L73)

#### 8.5 Display Amount Strategy

WalletLens keeps multiple transaction value concepts:

- `sentValue`
- `receivedValue`
- `netValue`
- `displayAmount`

Display rules:

- Incoming transactions show the amount received by the address
- Outgoing transactions show the magnitude of the spend from the address

Source: [bitcoinApi.js](/Users/jaydroid/Projects/wellet-lens/frontend/src/services/bitcoinApi.js#L99)

#### 8.6 Transaction Detail Normalization

Transaction details fetched from `/tx/:txid` are normalized into the same shape as list transactions, including:

- `vsize`
- `feeRate`
- `direction`
- `confirmations`
- address-aware flow metadata

This keeps the modal rendering logic consistent with the list view.

Source: [bitcoinApi.js](/Users/jaydroid/Projects/wellet-lens/frontend/src/services/bitcoinApi.js#L197)

## 9. Hooks and State Management

### `useAddressData`

This hook owns the address-search state machine.

Responsibilities:

- store the currently requested address
- validate before API calls
- trigger wallet snapshot fetches
- manage loading state
- expose user-facing message state
- distinguish between invalid address, no history, and network error cases
- abort in-flight address requests when a new search starts

Key public API:

- `wallet`
- `requestedAddress`
- `loading`
- `hasSearched`
- `message`
- `searchAddress(address)`
- `demoAddress`

Source: [useAddressData.js](/Users/jaydroid/Projects/wellet-lens/frontend/src/hooks/useAddressData.js#L5)

### `useTxDetails`

This hook owns selected transaction state independently from address search.

Responsibilities:

- store selected transaction
- fetch expanded transaction details on demand
- cache tx detail responses by `txid`
- abort stale detail requests
- expose selected transaction id for list highlighting
- reset modal state when the active wallet address changes

Key public API:

- `selectedTransaction`
- `selectedTransactionId`
- `transactionDetails`
- `detailsLoading`
- `detailsError`
- `openTransaction(transaction)`
- `closeTransaction()`

Source: [useTxDetails.js](/Users/jaydroid/Projects/wellet-lens/frontend/src/hooks/useTxDetails.js#L4)

## 10. UI Composition

### `Navbar`

Provides product identity and the always-visible **Testnet** badge.

Source: [Navbar.jsx](/Users/jaydroid/Projects/wellet-lens/frontend/src/components/Navbar.jsx)

### `AddressSearch`

Primary search panel. Behaviors:

- user input for a testnet address
- disabled search button during loading
- `Try demo address` button
- explicit validation messaging

Source: [AddressSearch.jsx](/Users/jaydroid/Projects/wellet-lens/frontend/src/components/AddressSearch.jsx#L5)

### `SummaryCards`

Renders the four summary metrics:

- Balance
- Total Received
- Total Sent
- Transaction Count

It displays chain balance and mempool delta separately in the Balance helper text.

Source: [SummaryCards.jsx](/Users/jaydroid/Projects/wellet-lens/frontend/src/components/SummaryCards.jsx#L19)

### `TransactionList`

Renders the address transaction timeline and contains:

- transaction count badge
- inline loading spinner
- empty state for no history
- animated card staggering
- selected-transaction highlighting

Source: [TransactionList.jsx](/Users/jaydroid/Projects/wellet-lens/frontend/src/components/TransactionList.jsx#L9)

### `TransactionCard`

This is the main explorer row/card for each transaction.

Features:

- incoming/outgoing/neutral iconography
- green plus sign for incoming
- red minus sign for outgoing
- fee and fee-rate display
- shortened txid
- copy-to-clipboard button
- clickable card interaction
- selected-card styling

Source: [TransactionCard.jsx](/Users/jaydroid/Projects/wellet-lens/frontend/src/components/TransactionCard.jsx#L27)

### `TransactionDetailsModal`

Detailed transaction drilldown surface. Displays:

- full txid
- fee in sats
- sat/vB if available
- confirmations
- size / weight / vsize
- wallet-relative flow
- separate Inputs and Outputs sections
- block metadata
- copy full txid action

Source: [TransactionDetailsModal.jsx](/Users/jaydroid/Projects/wellet-lens/frontend/src/components/TransactionDetailsModal.jsx#L45)

### `UtxoPanel`

Displays spendable outputs for the current address.

Features:

- shortened txid
- vout index
- amount in BTC
- amount in sats
- confirmation count
- explanatory copy for what UTXOs mean
- empty state for no spendable outputs

Source: [UtxoPanel.jsx](/Users/jaydroid/Projects/wellet-lens/frontend/src/components/UtxoPanel.jsx#L8)

## 11. Shared UI Primitives

### `Card`

Reusable panel container with glassy dark styling and consistent rounded corners.

Source: [Card.jsx](/Users/jaydroid/Projects/wellet-lens/frontend/src/components/UI/Card.jsx)

### `Badge`

Badge primitive with semantic variants:

- neutral
- subtle
- success
- warning
- danger
- accent
- testnet

Source: [Badge.jsx](/Users/jaydroid/Projects/wellet-lens/frontend/src/components/UI/Badge.jsx)

### `Loader`

Used for primary loading states and transaction-detail loading.

### `Skeleton`

Used for dashboard card skeleton placeholders.

### `InlineSpinner`

Used for smaller inline loading indicators, especially transaction list activity.

Source: [Loader.jsx](/Users/jaydroid/Projects/wellet-lens/frontend/src/components/UI/Loader.jsx)

### `EmptyState`

Generic empty/error visual state component.

Source: [EmptyState.jsx](/Users/jaydroid/Projects/wellet-lens/frontend/src/components/UI/EmptyState.jsx)

### `CopyButton`

Encapsulates copy-to-clipboard behavior and transient copied state.

Features:

- compact and full-size variants
- clipboard API integration
- 1.8s copied feedback state

Source: [CopyButton.jsx](/Users/jaydroid/Projects/wellet-lens/frontend/src/components/UI/CopyButton.jsx#L5)

## 12. Utility Layer

### `formatBTC`

Converts sats to BTC using:

```js
amount / 100000000
```

Also supports:

- optional sign prefix
- min/max decimal control

Source: [formatBTC.js](/Users/jaydroid/Projects/wellet-lens/frontend/src/utils/formatBTC.js#L3)

### `formatSats`

Formats satoshi counts with locale separators.

Source: [formatBTC.js](/Users/jaydroid/Projects/wellet-lens/frontend/src/utils/formatBTC.js#L17)

### `formatFeeRate`

Formats fee rates in `sat/vB`.

Source: [formatBTC.js](/Users/jaydroid/Projects/wellet-lens/frontend/src/utils/formatBTC.js#L21)

### `shortenTxid`

Shortens txids for readable list rendering.

Source: [shortenTxid.js](/Users/jaydroid/Projects/wellet-lens/frontend/src/utils/shortenTxid.js)

### `formatDate` and `formatDateTime`

Formats block timestamps into:

- list-friendly short format
- full detail format

Pending transactions are mapped to explicit non-time messages.

Source: [formatDate.js](/Users/jaydroid/Projects/wellet-lens/frontend/src/utils/formatDate.js#L17)

### `cn`

Very small class name concatenation helper.

Source: [cn.js](/Users/jaydroid/Projects/wellet-lens/frontend/src/utils/cn.js)

## 13. UX and State Behavior

### Address Input Behavior

- Empty input produces **Invalid testnet address**
- Non-`tb1` input produces **Invalid testnet address**
- Search button disables during active fetch
- Demo address button also disables during active fetch

Source: [useAddressData.js](/Users/jaydroid/Projects/wellet-lens/frontend/src/hooks/useAddressData.js#L23)  
Source: [AddressSearch.jsx](/Users/jaydroid/Projects/wellet-lens/frontend/src/components/AddressSearch.jsx#L39)

### Empty States

Current explicit empty-state copy:

- **No transaction history found**
- **This address has no transaction history yet**
- **No spendable outputs found**
- **UTXOs are unspent outputs that can be used to build new transactions**

Source: [TransactionList.jsx](/Users/jaydroid/Projects/wellet-lens/frontend/src/components/TransactionList.jsx#L31)  
Source: [UtxoPanel.jsx](/Users/jaydroid/Projects/wellet-lens/frontend/src/components/UtxoPanel.jsx#L26)

### Error States

Current explicit error-state copy:

- **Invalid testnet address**
- **Network error**
- **Unable to fetch data from network**

Source: [useAddressData.js](/Users/jaydroid/Projects/wellet-lens/frontend/src/hooks/useAddressData.js#L64)  
Source: [useTxDetails.js](/Users/jaydroid/Projects/wellet-lens/frontend/src/hooks/useTxDetails.js#L53)

### Loading States

Current loading system:

- dashboard skeleton cards while loading with no prior wallet
- inline transaction spinner
- modal loader for tx detail fetch
- disabled submit and demo buttons during address lookup

Source: [Home.jsx](/Users/jaydroid/Projects/wellet-lens/frontend/src/pages/Home.jsx#L18)  
Source: [TransactionList.jsx](/Users/jaydroid/Projects/wellet-lens/frontend/src/components/TransactionList.jsx#L25)

### Selection Behavior

Selected transaction cards receive a highlighted border, background tint, and halo shadow.

Source: [TransactionCard.jsx](/Users/jaydroid/Projects/wellet-lens/frontend/src/components/TransactionCard.jsx#L38)

## 14. Visual System

The app uses a dark technical theme with:

- muted blue/amber accents
- large rounded cards
- subtle panel gradients
- grid-like background texture
- premium mono + sans typography pairing
- restrained Framer Motion transitions

The visual system is defined globally in:

- CSS variables
- background gradients
- typography imports
- scrollbar styling

Source: [index.css](/Users/jaydroid/Projects/wellet-lens/frontend/src/index.css#L1)

## 15. Demo Address Support

WalletLens includes a one-click demo address:

```text
tb1p03642h5pm56uu0lvjvv3jk7ld5ycuq02m6unmkxhmhttq58xe7zq4m02rk
```

Purpose:

- makes the UI usable immediately
- gives reviewers a known working explorer path
- reduces friction during demos and portfolio reviews

Source: [demoAddress.js](/Users/jaydroid/Projects/wellet-lens/frontend/src/services/demoAddress.js#L1)

## 16. Build and Run

### Scripts

```bash
npm run dev
npm run build
npm run preview
```

Source: [package.json](/Users/jaydroid/Projects/wellet-lens/frontend/package.json#L6)

### Verified Build Status

The current production build succeeds with Vite.

Most recent verified command:

```bash
cd frontend && npm run build
```

## 17. Notable Engineering Strengths

- Good separation between page, data hook, tx-detail hook, and services
- Accurate explorer-focused wallet summary math
- Direction inference based on address presence instead of naive value sign
- Clean reusable UI primitives
- Explicit UX copy for invalid, empty, and network states
- Copy-to-clipboard support for operational convenience
- Dedicated demo address for zero-friction testing

## 18. Current Limitations

- No pagination for large address histories
- No optimistic caching across sessions
- No server-side proxy, so rate limits and CORS behavior depend entirely on Esplora
- No automated test suite yet
- `mockWalletData.js` remains in the codebase but is not part of the active runtime flow
- Address validation is intentionally limited to `tb1` Bech32 format only

## 19. Recommended Next Technical Steps

1. Add automated tests for:
   - address validation
   - transaction direction inference
   - summary normalization
   - empty/error state rendering

2. Add transaction pagination or infinite scrolling for high-activity addresses.

3. Add explorer deep links to Blockstream for txid and address inspection.

4. Add persisted search history in local storage.

5. Add lightweight analytics or telemetry only if the product becomes user-facing beyond local/demo use.

6. Remove or formally reintroduce `mockWalletData.js` so the runtime story stays unambiguous.

## 20. Conclusion

WalletLens is currently a solid frontend explorer for Bitcoin testnet addresses. Its architecture is already good enough for a portfolio-quality developer tool and provides a clean base for additional explorer behaviors such as pagination, richer address analytics, or wallet-integration-specific workflows.

The strongest parts of the implementation are:

- clear separation of concerns
- strong data normalization
- explorer-style transaction intelligence
- intentional empty/error handling
- polished, technically oriented UI behavior
