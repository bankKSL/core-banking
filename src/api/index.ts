import api from "./client";
import type {
    Campaign,
    Category,
    Product,
    ExecutionLog,
    AuditLog,
    LoanApplication,
    LoanProduct,
    Collateral,
    RepaymentSchedule,
    DepositAccount,
    DepositTransaction,
    FixedDeposit,
    RecurringDeposit,
    ExchangeRate,
    Customer,
} from "@/types";

// ─── Generic helpers ──────────────────────────────────────────
/** GET list wrapper – assumes `{ data }` shape in response */
async function getList<T>(url: string): Promise<T[]> {
    const { data } = await api.get<T[]>(url);
    return data;
}

/** GET single item by id */
async function getById<T>(url: string, id: string): Promise<T> {
    const { data } = await api.get<T>(`${url}/${id}`);
    return data;
}

/** POST create */
async function create<TRequest, TResponse>(url: string, payload: TRequest): Promise<TResponse> {
    const { data } = await api.post<TResponse>(url, payload);
    return data;
}

/** PUT update */
async function update<TRequest, TResponse>(url: string, id: string, payload: Partial<TRequest>): Promise<TResponse> {
    const { data } = await api.put<TResponse>(`${url}/${id}`, payload);
    return data;
}

/** DELETE remove */
async function remove(url: string, id: string): Promise<void> {
    await api.delete(`${url}/${id}`);
}

// ─── Campaigns ────────────────────────────────────────────────
const CAMPAIGNS = "/campaigns";
export const campaignApi = {
    list: () => getList<Campaign>(CAMPAIGNS),
    getById: (id: string) => getById<Campaign>(CAMPAIGNS, id),
    create: (payload: Partial<Campaign>) => create<Partial<Campaign>, Campaign>(CAMPAIGNS, payload),
    update: (id: string, payload: Partial<Campaign>) => update<Partial<Campaign>, Campaign>(CAMPAIGNS, id, payload),
    delete: (id: string) => remove(CAMPAIGNS, id),
};

// ─── Categories ───────────────────────────────────────────────
const CATEGORIES = "/categories";
export const categoryApi = {
    list: () => getList<Category>(CATEGORIES),
    getById: (id: string) => getById<Category>(CATEGORIES, id),
    create: (payload: Partial<Category>) => create<Partial<Category>, Category>(CATEGORIES, payload),
    update: (id: string, payload: Partial<Category>) => update<Partial<Category>, Category>(CATEGORIES, id, payload),
    delete: (id: string) => remove(CATEGORIES, id),
};

// ─── Products ─────────────────────────────────────────────────
const PRODUCTS = "/products";
export const productApi = {
    list: () => getList<Product>(PRODUCTS),
    getById: (id: string) => getById<Product>(PRODUCTS, id),
    create: (payload: Partial<Product>) => create<Partial<Product>, Product>(PRODUCTS, payload),
    update: (id: string, payload: Partial<Product>) => update<Partial<Product>, Product>(PRODUCTS, id, payload),
    delete: (id: string) => remove(PRODUCTS, id),
};

// ─── Execution Logs ───────────────────────────────────────────
const EXEC_LOGS = "/execution-logs";
export const executionLogApi = {
    list: () => getList<ExecutionLog>(EXEC_LOGS),
};

// ─── Audit Logs ───────────────────────────────────────────────
const AUDIT_LOGS = "/audit-logs";
export const auditLogApi = {
    list: () => getList<AuditLog>(AUDIT_LOGS),
};

// ─── Loan Applications ────────────────────────────────────────
const LOAN_APPS = "/loan-applications";
export const loanApplicationApi = {
    list: () => getList<LoanApplication>(LOAN_APPS),
    getById: (id: string) => getById<LoanApplication>(LOAN_APPS, id),
    create: (payload: Partial<LoanApplication>) => create<Partial<LoanApplication>, LoanApplication>(LOAN_APPS, payload),
    update: (id: string, payload: Partial<LoanApplication>) => update<Partial<LoanApplication>, LoanApplication>(LOAN_APPS, id, payload),
};
// ─── Loan Products ────────────────────────────────────────────
const LOAN_PRODUCTS = "/loan-products";
export const loanProductApi = {
    list: () => getList<LoanProduct>(LOAN_PRODUCTS),
    getById: (id: string) => getById<LoanProduct>(LOAN_PRODUCTS, id),
};

// ─── Collateral ───────────────────────────────────────────────
const COLLATERAL = "/collateral";
export const collateralApi = {
    list: () => getList<Collateral>(COLLATERAL),
    getById: (id: string) => getById<Collateral>(COLLATERAL, id),
};

// ─── Repayment Schedules ──────────────────────────────────────
const REPAYMENTS = "/repayment-schedules";
export const repaymentApi = {
    list: () => getList<RepaymentSchedule>(REPAYMENTS),
};

// ─── Deposit Accounts ─────────────────────────────────────────
const DEPOSIT_ACCOUNTS = "/deposit-accounts";
export const depositAccountApi = {
    list: () => getList<DepositAccount>(DEPOSIT_ACCOUNTS),
    getById: (id: string) => getById<DepositAccount>(DEPOSIT_ACCOUNTS, id),
    create: (payload: Partial<DepositAccount>) => create<Partial<DepositAccount>, DepositAccount>(DEPOSIT_ACCOUNTS, payload),
    update: (id: string, payload: Partial<DepositAccount>) =>
        update<Partial<DepositAccount>, DepositAccount>(DEPOSIT_ACCOUNTS, id, payload),
};

// ─── Deposit Transactions ─────────────────────────────────────
const DEPOSIT_TXNS = "/deposit-transactions";
export const depositTransactionApi = {
    list: () => getList<DepositTransaction>(DEPOSIT_TXNS),
};

// ─── Fixed Deposits ───────────────────────────────────────────
const FIXED_DEPOSITS = "/fixed-deposits";
export const fixedDepositApi = {
    list: () => getList<FixedDeposit>(FIXED_DEPOSITS),
};

// ─── Recurring Deposits ───────────────────────────────────────
const RECURRING_DEPOSITS = "/recurring-deposits";
export const recurringDepositApi = {
    list: () => getList<RecurringDeposit>(RECURRING_DEPOSITS),
};

// ─── Exchange Rates ───────────────────────────────────────────
const EXCHANGE_RATES = "/exchange-rates";
export const exchangeRateApi = {
    list: () => getList<ExchangeRate>(EXCHANGE_RATES),
    create: (payload: Partial<ExchangeRate>) => create<Partial<ExchangeRate>, ExchangeRate>(EXCHANGE_RATES, payload),
    update: (id: string, payload: Partial<ExchangeRate>) => update<Partial<ExchangeRate>, ExchangeRate>(EXCHANGE_RATES, id, payload),
    delete: (id: string) => remove(EXCHANGE_RATES, id),
};

// ─── Customers ────────────────────────────────────────────────
const CUSTOMERS = "/customers";
export const customerApi = {
    list: () => getList<Customer>(CUSTOMERS),
    getById: (id: string) => getById<Customer>(CUSTOMERS, id),
    create: (payload: Partial<Customer>) => create<Partial<Customer>, Customer>(CUSTOMERS, payload),
    update: (id: string, payload: Partial<Customer>) => update<Partial<Customer>, Customer>(CUSTOMERS, id, payload),
    delete: (id: string) => remove(CUSTOMERS, id),
};
