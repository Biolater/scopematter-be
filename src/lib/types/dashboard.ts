import { ProjectStatus, RequestStatus, ChangeOrderStatus } from "@prisma/client";


export interface GetDashboardInput {
    userId: string;
}

export interface DashboardMetrics {
    projects: {
        total: number;
        growth: number;
        growthPeriod: "month" | "week";
    };
    scopeItems: {
        total: number;
        growth: number;
        growthPeriod: "month" | "week";
    };
    requests: {
        total: number;
        pending: number;
        growth: number;
        growthPeriod: "month" | "week";
    };
    changeOrders: {
        total: number;
        approved: number;
        pending: number;
        rejected: number;
        growth: number;
        growthPeriod: "month" | "week";
    };
}

export type DashboardActivityType =
    | "PROJECT_CREATED"
    | "REQUEST_SUBMITTED"
    | `CHANGE_ORDER_${ChangeOrderStatus}`; // e.g. "CHANGE_ORDER_APPROVED"

export interface DashboardActivity {
    id: string;
    type: DashboardActivityType;
    message: string;
    createdAt: Date;
}

export interface DashboardQuickStats {
    projectsCompleted: {
        value: number;
        total: number;
    };
    pendingRequests: {
        value: number;
        total: number;
    };
    changeOrders: {
        total: number;
        breakdown: string;
    };
}

export interface GetDashboardOutput {
    metrics: DashboardMetrics;
    recentActivity: DashboardActivity[];
    quickStats: DashboardQuickStats;
}