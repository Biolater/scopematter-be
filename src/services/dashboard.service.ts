import prisma from "../lib/prisma";
import { DashboardActivity, GetDashboardInput, GetDashboardOutput } from "../lib/types/dashboard";
import { getStartOfMonth, getStartOfWeek } from "../utils/date";

export const getDashboard = async ({ userId }: GetDashboardInput): Promise<GetDashboardOutput> => {
  const startOfMonth = getStartOfMonth();
  const startOfWeek = getStartOfWeek();

  // ===== All data in single transaction =====
  const result = await prisma.$transaction(async (tx) => {
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
      recentProjects,
      recentRequests,
      recentChangeOrders,
    ] = await Promise.all([
      tx.project.count({ where: { userId } }),
      tx.project.count({ where: { userId, createdAt: { gte: startOfMonth } } }),
      tx.project.count({ where: { userId, status: "COMPLETED" } }),

      tx.scopeItem.count({ where: { project: { userId } } }),
      tx.scopeItem.count({ where: { project: { userId }, createdAt: { gte: startOfWeek } } }),

      tx.request.count({ where: { project: { userId } } }),
      tx.request.count({ where: { project: { userId }, createdAt: { gte: startOfWeek } } }),
      tx.request.count({ where: { project: { userId }, status: "OUT_OF_SCOPE" } }),

      tx.changeOrder.count({ where: { project: { userId } } }),
      tx.changeOrder.count({ where: { project: { userId }, createdAt: { gte: startOfMonth } } }),
      tx.changeOrder.count({ where: { project: { userId }, status: "APPROVED" } }),
      tx.changeOrder.count({ where: { project: { userId }, status: "REJECTED" } }),
      tx.changeOrder.count({ where: { project: { userId }, status: "PENDING" } }),
      
      // Recent Activity
      tx.project.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
      tx.request.findMany({
        where: { project: { userId } },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
      tx.changeOrder.findMany({
        where: { project: { userId } },
        orderBy: { updatedAt: "desc" },
        take: 5,
      }),
    ]);

    return {
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
      recentProjects,
      recentRequests,
      recentChangeOrders,
    };
  });

  const {
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
    recentProjects,
    recentRequests,
    recentChangeOrders,
  } = result;

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
  ]
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, 5);

  // ===== Quick Stats =====
  const quickStats = {
    projectsCompleted: { value: completedProjects, total: totalProjects },
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
