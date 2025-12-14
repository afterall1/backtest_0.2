/**
 * API Service - Centralized Backend Communication
 * =================================================
 * ⚠️ ZERO MOCK DATA POLICY: All data comes from real Binance API
 * 
 * This module handles all communication with the FastAPI backend.
 * Type-safe requests and responses matching backend Pydantic models.
 */
import type { BacktestRequest, BacktestResult, SymbolsResponse } from './types';

// ============================================================
// CONFIGURATION
// ============================================================

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// ============================================================
// ERROR CLASSES
// ============================================================

export class ApiError extends Error {
    constructor(
        message: string,
        public status: number,
        public code: string
    ) {
        super(message);
        this.name = 'ApiError';
    }
}

export class BackendUnavailableError extends ApiError {
    constructor() {
        super('Backend server is unavailable. Please ensure the FastAPI server is running.', 503, 'BACKEND_UNAVAILABLE');
    }
}

export class StrategyRejectedError extends ApiError {
    constructor(reason: string) {
        super(`Strategy rejected: ${reason}`, 400, 'STRATEGY_REJECTED');
    }
}

export class InsufficientDataError extends ApiError {
    constructor(symbol: string) {
        super(`Insufficient data available for ${symbol}`, 404, 'INSUFFICIENT_DATA');
    }
}

// ============================================================
// GENERIC FETCH WRAPPER
// ============================================================

async function apiFetch<T>(
    endpoint: string,
    options: RequestInit = {}
): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;

    const defaultHeaders: HeadersInit = {
        'Content-Type': 'application/json',
    };

    try {
        const response = await fetch(url, {
            ...options,
            headers: {
                ...defaultHeaders,
                ...options.headers,
            },
        });

        // Handle non-OK responses
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            const detail = errorData.detail || response.statusText;

            // Map specific errors
            if (response.status === 404) {
                throw new InsufficientDataError(detail);
            }
            if (response.status === 400) {
                throw new StrategyRejectedError(detail);
            }
            if (response.status >= 500) {
                throw new ApiError(detail, response.status, 'SERVER_ERROR');
            }

            throw new ApiError(detail, response.status, 'REQUEST_FAILED');
        }

        return await response.json();
    } catch (error) {
        // Network errors (backend not running)
        if (error instanceof TypeError && error.message.includes('fetch')) {
            throw new BackendUnavailableError();
        }

        // Re-throw our custom errors
        if (error instanceof ApiError) {
            throw error;
        }

        // Unknown errors
        throw new ApiError(
            error instanceof Error ? error.message : 'Unknown error occurred',
            0,
            'UNKNOWN_ERROR'
        );
    }
}

// ============================================================
// API ENDPOINTS
// ============================================================

/**
 * Fetch available USDT trading symbols from Binance.
 * 
 * @returns Array of symbol strings (e.g., ["BTC/USDT", "ETH/USDT"])
 */
export async function getSymbols(): Promise<string[]> {
    const response = await apiFetch<SymbolsResponse>('/api/symbols');
    return response.symbols;
}

/**
 * Run backtest with the given strategy configuration.
 * 
 * @param request - Backtest parameters including 3-prompt structure
 * @returns Complete backtest results with metrics and trades
 */
export async function runBacktest(request: BacktestRequest): Promise<BacktestResult> {
    return apiFetch<BacktestResult>('/api/backtest', {
        method: 'POST',
        body: JSON.stringify(request),
    });
}

/**
 * Health check endpoint.
 * 
 * @returns True if backend is healthy
 */
export async function healthCheck(): Promise<boolean> {
    try {
        await apiFetch<{ status: string }>('/health');
        return true;
    } catch {
        return false;
    }
}

// ============================================================
// UTILITY FUNCTIONS
// ============================================================

/**
 * Convert ISO date string to Unix timestamp (seconds).
 */
export function isoToUnix(isoDate: string): number {
    return Math.floor(new Date(isoDate).getTime() / 1000);
}

/**
 * Convert Unix timestamp (seconds) to ISO date string.
 */
export function unixToIso(unix: number): string {
    return new Date(unix * 1000).toISOString().split('T')[0];
}

// ============================================================
// ❌ FORBIDDEN PATTERNS
// ============================================================
// const mockSymbols = ["BTC/USDT", "ETH/USDT"];  // NEVER
// const fakeResult = { metrics: { ... } };  // NEVER
// Math.random() for price data  // NEVER
// ============================================================
