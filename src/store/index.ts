// ─── Auth Store ──────────────────────────────────────────────
export interface AuthUser {
    name: string;
    email: string;
    role: string;
}

interface AuthState {
    isAuthenticated: boolean;
    user: AuthUser | null;
    /** Base64-encoded "username:password" for Basic Auth */
    basicAuth: string | null;
    loginError: string | null;
    isLoggingIn: boolean;
    resetPasswordSent: boolean;
    isSendingReset: boolean;
    resetError: string | null;
    login: (email: string, password: string) => Promise<boolean>;
    logout: () => void;
    clearLoginError: () => void;
    forgotPassword: (email: string) => Promise<boolean>;
    clearResetState: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
    isAuthenticated: false,
    user: null,
    basicAuth: null,
    loginError: null,
    isLoggingIn: false,
    resetPasswordSent: false,
    isSendingReset: false,
    resetError: null,
    login: async (username, password) => {
        set({ isLoggingIn: true, loginError: null });
        try {
            const basic = btoa(`${username}:${password}`);
            // Verify credentials against Fineract via existing axios client
            const { default: api } = await import("@/api/client");
            await api.get("/offices?limit=1", {
                headers: {
                    Authorization: `Basic ${basic}`,
                    "Fineract-Platform-TenantId": "default",
                },
            });
            set({
                isAuthenticated: true,
                isLoggingIn: false,
                loginError: null,
                basicAuth: basic,
                user: { name: username, email: username, role: "User" },
            });
            return true;
        } catch {
            set({ isLoggingIn: false, loginError: "Invalid credentials. Please try again." });
            return false;
        }
    },
    logout: () => set({ isAuthenticated: false, user: null, basicAuth: null, loginError: null }),
    clearLoginError: () => set({ loginError: null }),
    forgotPassword: async (email) => {
        set({ isSendingReset: true, resetError: null });
        await new Promise((r) => setTimeout(r, 1200));
        // Mock: any valid-looking email triggers a success
        if (email.includes("@") && email.includes(".")) {
            set({ isSendingReset: false, resetPasswordSent: true, resetError: null });
            return true;
        }
        set({ isSendingReset: false, resetError: "Please enter a valid email address." });
        return false;
    },
    clearResetState: () => set({ resetPasswordSent: false, resetError: null }),
}));


import { create } from "zustand";
import type {
    Campaign,
    Category,
    Product,
    EligibilityRule,
    CampaignAction,
    SimulationInput,
    SimulationResult,
    SimulationStep,
    LoanApplication,
    LoanProduct,
    Collateral,
    RepaymentSchedule,
    LoanStatus,
    DepositAccount,
    DepositTransaction,
    FixedDeposit,
    RecurringDeposit,
    ExchangeRate,
    Customer,
} from "../types";

// ─── Campaign Store ──────────────────────────────────────────
interface CampaignState {
    selectedCampaign: Campaign | null;
    draftCampaign: Partial<Campaign> | null;
    setSelectedCampaign: (campaign: Campaign | null) => void;
    updateDraft: (data: Partial<Campaign>) => void;
    resetDraft: () => void;
}

export const useCampaignStore = create<CampaignState>((set) => ({
    selectedCampaign: null,
    draftCampaign: null,
    setSelectedCampaign: (campaign) => set({ selectedCampaign: campaign }),
    updateDraft: (data) =>
        set((state) => ({
            draftCampaign: { ...state.draftCampaign, ...data },
        })),
    resetDraft: () => set({ draftCampaign: null }),
}));

// ─── Rule Builder Store ──────────────────────────────────────
interface RuleBuilderState {
    rules: EligibilityRule[];
    addRule: (rule: EligibilityRule) => void;
    updateRule: (id: string, data: Partial<EligibilityRule>) => void;
    removeRule: (id: string) => void;
    setRules: (rules: EligibilityRule[]) => void;
    resetRules: () => void;
}

export const useRuleBuilderStore = create<RuleBuilderState>((set) => ({
    rules: [],
    addRule: (rule) => set((state) => ({ rules: [...state.rules, rule] })),
    updateRule: (id, data) =>
        set((state) => ({
            rules: state.rules.map((r) => (r.id === id ? { ...r, ...data } : r)),
        })),
    removeRule: (id) =>
        set((state) => ({
            rules: state.rules.filter((r) => r.id !== id),
        })),
    setRules: (rules) => set({ rules }),
    resetRules: () => set({ rules: [] }),
}));

// ─── Formula Store ───────────────────────────────────────────
interface FormulaState {
    formula: string;
    setFormula: (formula: string) => void;
    resetFormula: () => void;
}

export const useFormulaStore = create<FormulaState>((set) => ({
    formula: "",
    setFormula: (formula) => set({ formula }),
    resetFormula: () => set({ formula: "" }),
}));

// ─── Actions Store ───────────────────────────────────────────
interface ActionsState {
    actions: CampaignAction[];
    addAction: (action: CampaignAction) => void;
    updateAction: (id: string, data: Partial<CampaignAction>) => void;
    removeAction: (id: string) => void;
    setActions: (actions: CampaignAction[]) => void;
    resetActions: () => void;
}

export const useActionsStore = create<ActionsState>((set) => ({
    actions: [],
    addAction: (action) => set((state) => ({ actions: [...state.actions, action] })),
    updateAction: (id, data) =>
        set((state) => ({
            actions: state.actions.map((a) => (a.id === id ? { ...a, ...data } : a)),
        })),
    removeAction: (id) =>
        set((state) => ({
            actions: state.actions.filter((a) => a.id !== id),
        })),
    setActions: (actions) => set({ actions }),
    resetActions: () => set({ actions: [] }),
}));

// ─── Category Store ──────────────────────────────────────────
interface CategoryState {
    categories: Category[];
    setCategories: (categories: Category[]) => void;
    addCategory: (category: Category) => void;
    updateCategory: (id: string, data: Partial<Category>) => void;
    removeCategory: (id: string) => void;
}

export const useCategoryStore = create<CategoryState>((set) => ({
    categories: [],
    setCategories: (categories) => set({ categories }),
    addCategory: (category) => set((state) => ({ categories: [...state.categories, category] })),
    updateCategory: (id, data) =>
        set((state) => ({
            categories: state.categories.map((c) => (c.id === id ? { ...c, ...data } : c)),
        })),
    removeCategory: (id) =>
        set((state) => ({
            categories: state.categories.filter((c) => c.id !== id),
        })),
}));

// ─── Product Store ───────────────────────────────────────────
interface ProductState {
    products: Product[];
    setProducts: (products: Product[]) => void;
    addProduct: (product: Product) => void;
    updateProduct: (id: string, data: Partial<Product>) => void;
    removeProduct: (id: string) => void;
}

export const useProductStore = create<ProductState>((set) => ({
    products: [],
    setProducts: (products) => set({ products }),
    addProduct: (product) => set((state) => ({ products: [...state.products, product] })),
    updateProduct: (id, data) =>
        set((state) => ({
            products: state.products.map((p) => (p.id === id ? { ...p, ...data } : p)),
        })),
    removeProduct: (id) =>
        set((state) => ({
            products: state.products.filter((p) => p.id !== id),
        })),
}));

// ─── UI Store ────────────────────────────────────────────────
export interface BreadcrumbItem {
    label: string;
    path: string;
    active?: boolean;
}

interface UIState {
    sidebarCollapsed: boolean;
    mobileDrawerOpen: boolean;
    theme: "light" | "dark";
    breadcrumbs: BreadcrumbItem[];
    toggleSidebar: () => void;
    setSidebarCollapsed: (collapsed: boolean) => void;
    toggleMobileDrawer: () => void;
    setMobileDrawerOpen: (open: boolean) => void;
    toggleTheme: () => void;
    setTheme: (theme: "light" | "dark") => void;
    setBreadcrumb: (crumbs: BreadcrumbItem[]) => void;
}

export const useUIStore = create<UIState>((set) => ({
    sidebarCollapsed: false,
    mobileDrawerOpen: false,
    theme: "light",
    breadcrumbs: [],
    toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
    setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
    toggleMobileDrawer: () => set((state) => ({ mobileDrawerOpen: !state.mobileDrawerOpen })),
    setMobileDrawerOpen: (open) => set({ mobileDrawerOpen: open }),
    toggleTheme: () =>
        set((state) => ({
            theme: state.theme === "light" ? "dark" : "light",
        })),
    setTheme: (theme) => set({ theme }),
    setBreadcrumb: (breadcrumbs) => set({ breadcrumbs }),
}));

// ─── Simulation Store ────────────────────────────────────────
type SimulationInputPatch = {
    [K in keyof SimulationInput]?: SimulationInput[K];
};

interface SimulationState {
    input: SimulationInput;
    result: SimulationResult | null;
    logs: SimulationStep[];
    isRunning: boolean;
    setInput: (input: SimulationInputPatch) => void;
    runSimulation: () => Promise<void>;
    clearLogs: () => void;
    resetSimulation: () => void;
}

const defaultSimulationInput: SimulationInput = {
    balance: 0,
    amount: 0,
    interestRate: 0,
    tenor: 0,
    transactionCount: 0,
    accountAge: 0,
    customerScore: 0,
    currency: "USD",
    customerType: "standard",
    channel: "mobile",
};

export const useSimulationStore = create<SimulationState>((set) => ({
    input: { ...defaultSimulationInput },
    result: null,
    logs: [],
    isRunning: false,
    setInput: (input) =>
        set((state) => {
            const next: SimulationInput = { ...state.input };
            (Object.keys(input) as Array<keyof SimulationInput>).forEach((k) => {
                const v = input[k];
                if (v !== undefined) {
                    // Cast is safe: SimulationInput keys map to string|number.
                    (next as Record<string, string | number>)[k] = v;
                }
            });
            return { input: next };
        }),
    runSimulation: async () => {
        set({ isRunning: true });
        try {
            // Placeholder: real implementation will call services/simulation.ts
            // and populate `result` and `logs`. Keeping it side-effect-free for now.
            await Promise.resolve();
        } finally {
            set({ isRunning: false });
        }
    },
    clearLogs: () => set({ logs: [], result: null }),
    resetSimulation: () =>
        set({
            input: { ...defaultSimulationInput },
            result: null,
            logs: [],
            isRunning: false,
        }),
}));

// ─── Lending Store ───────────────────────────────────────────
interface LendingState {
    applications: LoanApplication[];
    selectedApplication: LoanApplication | null;
    filteredStatus: LoanStatus | "all";
    searchQuery: string;
    setApplications: (list: LoanApplication[]) => void;
    setSelectedApplication: (app: LoanApplication | null) => void;
    updateApplicationStatus: (id: string, status: LoanStatus) => void;
    updateApplication: (id: string, data: Partial<LoanApplication>) => void;
    addApplication: (app: LoanApplication) => void;
    setFilteredStatus: (status: LoanStatus | "all") => void;
    setSearchQuery: (q: string) => void;
}

export const useLendingStore = create<LendingState>((set) => ({
    applications: [],
    selectedApplication: null,
    filteredStatus: "all",
    searchQuery: "",
    setApplications: (list) => set({ applications: list }),
    setSelectedApplication: (app) => set({ selectedApplication: app }),
    updateApplicationStatus: (id, status) =>
        set((state) => ({
            applications: state.applications.map((a) =>
                a.id === id ? { ...a, status, updatedAt: new Date().toISOString() } : a
            ),
        })),
    updateApplication: (id, data) =>
        set((state) => ({
            applications: state.applications.map((a) =>
                a.id === id ? { ...a, ...data, updatedAt: new Date().toISOString() } : a
            ),
        })),
    addApplication: (app) =>
        set((state) => ({ applications: [...state.applications, app] })),
    setFilteredStatus: (status) => set({ filteredStatus: status }),
    setSearchQuery: (q) => set({ searchQuery: q }),
}));

// ─── Loan Product Store ──────────────────────────────────────
interface LoanProductState {
    products: LoanProduct[];
    setProducts: (list: LoanProduct[]) => void;
    addProduct: (product: LoanProduct) => void;
    updateProduct: (id: string, data: Partial<LoanProduct>) => void;
    toggleActive: (id: string) => void;
    removeProduct: (id: string) => void;
}

export const useLoanProductStore = create<LoanProductState>((set) => ({
    products: [],
    setProducts: (list) => set({ products: list }),
    addProduct: (product) =>
        set((state) => ({ products: [...state.products, product] })),
    updateProduct: (id, data) =>
        set((state) => ({
            products: state.products.map((p) => (p.id === id ? { ...p, ...data, updatedAt: new Date().toISOString() } : p)),
        })),
    toggleActive: (id) =>
        set((state) => ({
            products: state.products.map((p) =>
                p.id === id ? { ...p, isActive: !p.isActive, updatedAt: new Date().toISOString() } : p
            ),
        })),
    removeProduct: (id) =>
        set((state) => ({ products: state.products.filter((p) => p.id !== id) })),
}));

// ─── Collateral Store ────────────────────────────────────────
interface CollateralState {
    items: Collateral[];
    setItems: (list: Collateral[]) => void;
    addItem: (item: Collateral) => void;
    updateItem: (id: string, data: Partial<Collateral>) => void;
    removeItem: (id: string) => void;
}

export const useCollateralStore = create<CollateralState>((set) => ({
    items: [],
    setItems: (list) => set({ items: list }),
    addItem: (item) => set((state) => ({ items: [...state.items, item] })),
    updateItem: (id, data) =>
        set((state) => ({
            items: state.items.map((c) => (c.id === id ? { ...c, ...data, updatedAt: new Date().toISOString() } : c)),
        })),
    removeItem: (id) =>
        set((state) => ({ items: state.items.filter((c) => c.id !== id) })),
}));

// ─── Deposit Store ───────────────────────────────────────────
interface DepositState {
    accounts: DepositAccount[];
    transactions: DepositTransaction[];
    selectedAccount: DepositAccount | null;
    setAccounts: (list: DepositAccount[]) => void;
    setTransactions: (list: DepositTransaction[]) => void;
    setSelectedAccount: (account: DepositAccount | null) => void;
    updateAccountBalance: (id: string, newBalance: number) => void;
    addTransaction: (txn: DepositTransaction) => void;
}

export const useDepositStore = create<DepositState>((set) => ({
    accounts: [],
    transactions: [],
    selectedAccount: null,
    setAccounts: (list) => set({ accounts: list }),
    setTransactions: (list) => set({ transactions: list }),
    setSelectedAccount: (account) => set({ selectedAccount: account }),
    updateAccountBalance: (id, newBalance) =>
        set((state) => ({
            accounts: state.accounts.map((a) =>
                a.id === id
                    ? { ...a, balance: newBalance, lastTransactionDate: new Date().toISOString(), updatedAt: new Date().toISOString() }
                    : a
            ),
        })),
    addTransaction: (txn) =>
        set((state) => ({ transactions: [...state.transactions, txn] })),
}));

// ─── Fixed Deposit Store ─────────────────────────────────────
interface FixedDepositState {
    fixedDeposits: FixedDeposit[];
    recurringDeposits: RecurringDeposit[];
    setFixedDeposits: (list: FixedDeposit[]) => void;
    setRecurringDeposits: (list: RecurringDeposit[]) => void;
    addFixedDeposit: (fd: FixedDeposit) => void;
    updateFixedDeposit: (id: string, data: Partial<FixedDeposit>) => void;
    addRecurringDeposit: (rd: RecurringDeposit) => void;
    updateRecurringDeposit: (id: string, data: Partial<RecurringDeposit>) => void;
}

export const useFixedDepositStore = create<FixedDepositState>((set) => ({
    fixedDeposits: [],
    recurringDeposits: [],
    setFixedDeposits: (list) => set({ fixedDeposits: list }),
    setRecurringDeposits: (list) => set({ recurringDeposits: list }),
    addFixedDeposit: (fd) => set((s) => ({ fixedDeposits: [...s.fixedDeposits, fd] })),
    updateFixedDeposit: (id, data) =>
        set((s) => ({
            fixedDeposits: s.fixedDeposits.map((f) =>
                f.id === id ? { ...f, ...data, updatedAt: new Date().toISOString() } : f
            ),
        })),
    addRecurringDeposit: (rd) => set((s) => ({ recurringDeposits: [...s.recurringDeposits, rd] })),
    updateRecurringDeposit: (id, data) =>
        set((s) => ({
            recurringDeposits: s.recurringDeposits.map((r) =>
                r.id === id ? { ...r, ...data, updatedAt: new Date().toISOString() } : r
            ),
        })),
}));

// ─── Exchange Rate Store ─────────────────────────────────────
interface ExchangeRateState {
    rates: ExchangeRate[];
    setRates: (list: ExchangeRate[]) => void;
    addRate: (rate: ExchangeRate) => void;
    updateRate: (id: string, data: Partial<ExchangeRate>) => void;
    removeRate: (id: string) => void;
}

export const useExchangeRateStore = create<ExchangeRateState>((set) => ({
    rates: [],
    setRates: (list) => set({ rates: list }),
    addRate: (rate) => set((s) => ({ rates: [...s.rates, rate] })),
    updateRate: (id, data) =>
        set((s) => ({
            rates: s.rates.map((r) =>
                r.id === id ? { ...r, ...data, lastUpdated: new Date().toISOString() } : r
            ),
        })),
    removeRate: (id) => set((s) => ({ rates: s.rates.filter((r) => r.id !== id) })),
}));

// ─── Customer Store ──────────────────────────────────────────
interface CustomerState {
    customers: Customer[];
    setCustomers: (list: Customer[]) => void;
    addCustomer: (c: Customer) => void;
    updateCustomer: (id: string, data: Partial<Customer>) => void;
    removeCustomer: (id: string) => void;
}

export const useCustomerStore = create<CustomerState>((set) => ({
    customers: [],
    setCustomers: (list) => set({ customers: list }),
    addCustomer: (c) => set((s) => ({ customers: [...s.customers, c] })),
    updateCustomer: (id, data) =>
        set((s) => ({
            customers: s.customers.map((c) =>
                c.id === id ? { ...c, ...data, updatedAt: new Date().toISOString() } : c
            ),
        })),
    removeCustomer: (id) => set((s) => ({ customers: s.customers.filter((c) => c.id !== id) })),
}));
