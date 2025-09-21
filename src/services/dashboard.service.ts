import prisma from "../lib/prisma";
import { DashboardActivity, GetDashboardInput, GetDashboardOutput } from "../lib/types/dashboard";
import { getStartOfMonth, getStartOfWeek } from "../utils/date";



export const getDashboard = async ({ userId }: GetDashboardInput): Promise<GetDashboardOutput> => {
    const startOfMonth = getStartOfMonth();
    const startOfWeek = getStartOfWeek();

    // ===== Metrics (totals, growth, breakdowns) =====
    const [
        totalProjects,
        newProjectsThisMonth,
        completedProjects,
        totalScopeItems,
        newScopeThisWeek,
        totalRequests,
        newRequestsThisWeek,
        pendingRequests,
        totalChangeOrders,
        newChangeOrdersThisMonth,
        approvedChangeOrders,
        rejectedChangeOrders,
        pendingChangeOrders,
    ] = await Promise.all([
        prisma.project.count({ where: { userId } }),
        prisma.project.count({ where: { userId, createdAt: { gte: startOfMonth } } }),
        prisma.project.count({ where: { userId, status: "COMPLETED" } }),

        prisma.scopeItem.count({ where: { project: { userId } } }),
        prisma.scopeItem.count({ where: { project: { userId }, createdAt: { gte: startOfWeek } } }),

        prisma.request.count({ where: { project: { userId } } }),
        prisma.request.count({ where: { project: { userId }, createdAt: { gte: startOfWeek } } }),
        prisma.request.count({ where: { project: { userId }, status: "OUT_OF_SCOPE" } }),

        prisma.changeOrder.count({ where: { project: { userId } } }),
        prisma.changeOrder.count({ where: { project: { userId }, createdAt: { gte: startOfMonth } } }),
        prisma.changeOrder.count({ where: { project: { userId }, status: "APPROVED" } }),
        prisma.changeOrder.count({ where: { project: { userId }, status: "REJECTED" } }),
        prisma.changeOrder.count({ where: { project: { userId }, status: "PENDING" } }),
    ]);

    // ===== Recent Activity =====
    const [recentProjects, recentRequests, recentChangeOrders] = await Promise.all([
        prisma.project.findMany({
            where: { userId },
            orderBy: { createdAt: "desc" },
            take: 5,
        }),
        prisma.request.findMany({
            where: { project: { userId } },
            orderBy: { createdAt: "desc" },
            take: 5,
        }),
        prisma.changeOrder.findMany({
            where: { project: { userId } },
            orderBy: { updatedAt: "desc" },
            take: 5,
        }),
    ]);

    const recentActivity: DashboardActivity[] = [
        ...recentProjects.map((p) => ({
            id: p.id,
            type: "PROJECT_CREATED" as const,
            message: `New project created: ${p.name}`,
            createdAt: p.createdAt,
        })),
        ...recentRequests.map((r) => ({
            id: r.id,
            type: "REQUEST_SUBMITTED" as const,
            message: `Scope request submitted: ${r.description}`,
            createdAt: r.createdAt,
        })),
        ...recentChangeOrders.map((c) => ({
            id: c.id,
            type: `CHANGE_ORDER_${c.status}` as const,
            message: `Change order ${c.status.toLowerCase()}`,
            createdAt: c.updatedAt,
        })),
    ].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
        .slice(0, 5);


    // ===== Quick Stats =====
    const quickStats = {
        projectsCompleted: { value: completedProjects, total: totalProjects }, // adjust if you add "completed" status
        pendingRequests: { value: pendingRequests, total: totalRequests },
        changeOrders: {
            total: totalChangeOrders,
            breakdown: `${approvedChangeOrders} approved, ${pendingChangeOrders} pending, ${rejectedChangeOrders} rejected`,
        },
    };

    // ===== Final Response =====
    return {
        metrics: {
            projects: { total: totalProjects, growth: newProjectsThisMonth, growthPeriod: "month" },
            scopeItems: { total: totalScopeItems, growth: newScopeThisWeek, growthPeriod: "week" },
            requests: {
                total: totalRequests,
                pending: pendingRequests,
                growth: newRequestsThisWeek,
                growthPeriod: "week",
            },
            changeOrders: {
                total: totalChangeOrders,
                approved: approvedChangeOrders,
                pending: pendingChangeOrders,
                rejected: rejectedChangeOrders,
                growth: newChangeOrdersThisMonth,
                growthPeriod: "month",
            },
        },
        recentActivity,
        quickStats,
    };
};
