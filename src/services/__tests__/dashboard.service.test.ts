import { getDashboard } from "../dashboard.service";
import { mockPrisma } from "../../__tests__/setup";
import { ProjectStatus, RequestStatus, ChangeOrderStatus } from "@prisma/client";
import { Decimal } from "@prisma/client/runtime/library";

describe('dashboard.service', () => {
  const userId = 'user_123';
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfWeek = new Date(now.getTime() - now.getDay() * 24 * 60 * 60 * 1000);

  beforeEach(() => {
    jest.clearAllMocks();
    mockPrisma.$transaction.mockImplementation((fn: any) => fn(mockPrisma));
    // Mock the date utilities to return predictable values
    jest.spyOn(require('../../utils/date'), 'getStartOfMonth').mockReturnValue(startOfMonth);
    jest.spyOn(require('../../utils/date'), 'getStartOfWeek').mockReturnValue(startOfWeek);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  const mockProjects = [
    { 
      id: 'proj_1', 
      name: 'Project 1', 
      description: null,
      status: 'PENDING' as ProjectStatus,
      userId,
      clientId: 'client_1',
      createdAt: now,
      updatedAt: now
    },
    { 
      id: 'proj_2', 
      name: 'Project 2', 
      description: null,
      status: 'PENDING' as ProjectStatus,
      userId,
      clientId: 'client_2',
      createdAt: now,
      updatedAt: now
    },
  ];

  const mockRequests = [
    { 
      id: 'req_1', 
      description: 'Request 1', 
      status: 'PENDING' as RequestStatus,
      projectId: 'proj_1',
      createdAt: now,
      updatedAt: now
    },
    { 
      id: 'req_2', 
      description: 'Request 2', 
      status: 'PENDING' as RequestStatus,
      projectId: 'proj_2',
      createdAt: now,
      updatedAt: now
    },
  ];

  const mockChangeOrders = [
    { 
      id: 'co_1', 
      status: 'APPROVED' as ChangeOrderStatus,
      userId,
      projectId: 'proj_1',
      requestId: 'req_1',
      priceUsd: new Decimal(1000),
      extraDays: null,
      createdAt: now,
      updatedAt: now
    },
    { 
      id: 'co_2', 
      status: 'PENDING' as ChangeOrderStatus,
      userId,
      projectId: 'proj_2',
      requestId: 'req_2',
      priceUsd: new Decimal(500),
      extraDays: null,
      createdAt: now,
      updatedAt: now
    },
  ];

  describe('getDashboard', () => {
    it('should return complete dashboard data with metrics, activity, and quick stats', async () => {
      // Mock all the count queries
      mockPrisma.project.count
        .mockResolvedValueOnce(10) // totalProjects
        .mockResolvedValueOnce(3)  // newProjectsThisMonth
        .mockResolvedValueOnce(5); // completedProjects

      mockPrisma.scopeItem.count
        .mockResolvedValueOnce(25) // totalScopeItems
        .mockResolvedValueOnce(7); // newScopeThisWeek

      mockPrisma.request.count
        .mockResolvedValueOnce(15) // totalRequests
        .mockResolvedValueOnce(4)  // newRequestsThisWeek
        .mockResolvedValueOnce(8); // pendingRequests

      mockPrisma.changeOrder.count
        .mockResolvedValueOnce(12) // totalChangeOrders
        .mockResolvedValueOnce(2)  // newChangeOrdersThisMonth
        .mockResolvedValueOnce(6)  // approvedChangeOrders
        .mockResolvedValueOnce(3)  // rejectedChangeOrders
        .mockResolvedValueOnce(3); // pendingChangeOrders

      // Mock the recent activity queries
      mockPrisma.project.findMany.mockResolvedValue(mockProjects);
      mockPrisma.request.findMany.mockResolvedValue(mockRequests);
      mockPrisma.changeOrder.findMany.mockResolvedValue(mockChangeOrders);

      const result = await getDashboard({ userId });

      // Verify metrics
      expect(result.metrics.projects).toEqual({
        total: 10,
        growth: 3,
        growthPeriod: 'month',
      });

      expect(result.metrics.scopeItems).toEqual({
        total: 25,
        growth: 7,
        growthPeriod: 'week',
      });

      expect(result.metrics.requests).toEqual({
        total: 15,
        pending: 8,
        growth: 4,
        growthPeriod: 'week',
      });

      expect(result.metrics.changeOrders).toEqual({
        total: 12,
        approved: 6,
        pending: 3,
        rejected: 3,
        growth: 2,
        growthPeriod: 'month',
      });

      // Verify quick stats
      expect(result.quickStats.projectsCompleted).toEqual({
        value: 5,
        total: 10,
      });

      expect(result.quickStats.pendingRequests).toEqual({
        value: 8,
        total: 15,
      });

      expect(result.quickStats.changeOrders).toEqual({
        total: 12,
        breakdown: '6 approved, 3 pending, 3 rejected',
      });

      // Verify recent activity structure
      expect(result.recentActivity).toHaveLength(5);
      expect(result.recentActivity[0]).toHaveProperty('id');
      expect(result.recentActivity[0]).toHaveProperty('type');
      expect(result.recentActivity[0]).toHaveProperty('message');
      expect(result.recentActivity[0]).toHaveProperty('createdAt');
    });

    it('should handle zero values correctly', async () => {
      // Mock all counts as zero
      mockPrisma.project.count.mockResolvedValue(0);
      mockPrisma.scopeItem.count.mockResolvedValue(0);
      mockPrisma.request.count.mockResolvedValue(0);
      mockPrisma.changeOrder.count.mockResolvedValue(0);

      // Mock empty arrays for recent activity
      mockPrisma.project.findMany.mockResolvedValue([]);
      mockPrisma.request.findMany.mockResolvedValue([]);
      mockPrisma.changeOrder.findMany.mockResolvedValue([]);

      const result = await getDashboard({ userId });

      expect(result.metrics.projects.total).toBe(0);
      expect(result.metrics.scopeItems.total).toBe(0);
      expect(result.metrics.requests.total).toBe(0);
      expect(result.metrics.changeOrders.total).toBe(0);

      expect(result.quickStats.projectsCompleted.value).toBe(0);
      expect(result.quickStats.pendingRequests.value).toBe(0);
      expect(result.quickStats.changeOrders.total).toBe(0);

      expect(result.recentActivity).toHaveLength(0);
    });

    it('should correctly query with userId filter', async () => {
      // Mock minimal responses
      mockPrisma.project.count.mockResolvedValue(1);
      mockPrisma.scopeItem.count.mockResolvedValue(1);
      mockPrisma.request.count.mockResolvedValue(1);
      mockPrisma.changeOrder.count.mockResolvedValue(1);

      mockPrisma.project.findMany.mockResolvedValue([]);
      mockPrisma.request.findMany.mockResolvedValue([]);
      mockPrisma.changeOrder.findMany.mockResolvedValue([]);

      await getDashboard({ userId });

      // Verify that all queries include userId filter
      expect(mockPrisma.project.count).toHaveBeenCalledWith({
        where: { userId },
      });

      expect(mockPrisma.scopeItem.count).toHaveBeenCalledWith({
        where: { project: { userId } },
      });

      expect(mockPrisma.request.count).toHaveBeenCalledWith({
        where: { project: { userId } },
      });

      expect(mockPrisma.changeOrder.count).toHaveBeenCalledWith({
        where: { project: { userId } },
      });
    });

    it('should correctly apply date filters for growth metrics', async () => {
      mockPrisma.project.count.mockResolvedValue(1);
      mockPrisma.scopeItem.count.mockResolvedValue(1);
      mockPrisma.request.count.mockResolvedValue(1);
      mockPrisma.changeOrder.count.mockResolvedValue(1);

      mockPrisma.project.findMany.mockResolvedValue([]);
      mockPrisma.request.findMany.mockResolvedValue([]);
      mockPrisma.changeOrder.findMany.mockResolvedValue([]);

      await getDashboard({ userId });

      // Verify date filters for growth metrics
      expect(mockPrisma.project.count).toHaveBeenCalledWith({
        where: { userId, createdAt: { gte: startOfMonth } },
      });

      expect(mockPrisma.scopeItem.count).toHaveBeenCalledWith({
        where: { project: { userId }, createdAt: { gte: startOfWeek } },
      });

      expect(mockPrisma.request.count).toHaveBeenCalledWith({
        where: { project: { userId }, createdAt: { gte: startOfWeek } },
      });

      expect(mockPrisma.changeOrder.count).toHaveBeenCalledWith({
        where: { project: { userId }, createdAt: { gte: startOfMonth } },
      });
    });

    it('should correctly apply status filters', async () => {
      mockPrisma.project.count.mockResolvedValue(1);
      mockPrisma.scopeItem.count.mockResolvedValue(1);
      mockPrisma.request.count.mockResolvedValue(1);
      mockPrisma.changeOrder.count.mockResolvedValue(1);

      mockPrisma.project.findMany.mockResolvedValue([]);
      mockPrisma.request.findMany.mockResolvedValue([]);
      mockPrisma.changeOrder.findMany.mockResolvedValue([]);

      await getDashboard({ userId });

      // Verify status filters
      expect(mockPrisma.project.count).toHaveBeenCalledWith({
        where: { userId, status: 'COMPLETED' },
      });

      expect(mockPrisma.request.count).toHaveBeenCalledWith({
        where: { project: { userId }, status: 'OUT_OF_SCOPE' },
      });

      expect(mockPrisma.changeOrder.count).toHaveBeenCalledWith({
        where: { project: { userId }, status: 'APPROVED' },
      });

      expect(mockPrisma.changeOrder.count).toHaveBeenCalledWith({
        where: { project: { userId }, status: 'REJECTED' },
      });

      expect(mockPrisma.changeOrder.count).toHaveBeenCalledWith({
        where: { project: { userId }, status: 'PENDING' },
      });
    });

    it('should limit recent activity queries to 5 items each', async () => {
      mockPrisma.project.count.mockResolvedValue(1);
      mockPrisma.scopeItem.count.mockResolvedValue(1);
      mockPrisma.request.count.mockResolvedValue(1);
      mockPrisma.changeOrder.count.mockResolvedValue(1);

      mockPrisma.project.findMany.mockResolvedValue([]);
      mockPrisma.request.findMany.mockResolvedValue([]);
      mockPrisma.changeOrder.findMany.mockResolvedValue([]);

      await getDashboard({ userId });

      // Verify recent activity queries
      expect(mockPrisma.project.findMany).toHaveBeenCalledWith({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 5,
      });

      expect(mockPrisma.request.findMany).toHaveBeenCalledWith({
        where: { project: { userId } },
        orderBy: { createdAt: 'desc' },
        take: 5,
      });

      expect(mockPrisma.changeOrder.findMany).toHaveBeenCalledWith({
        where: { project: { userId } },
        orderBy: { updatedAt: 'desc' },
        take: 5,
      });
    });

    it('should generate correct activity messages for projects', async () => {
      mockPrisma.project.count.mockResolvedValue(0);
      mockPrisma.scopeItem.count.mockResolvedValue(0);
      mockPrisma.request.count.mockResolvedValue(0);
      mockPrisma.changeOrder.count.mockResolvedValue(0);

      const projects = [
        { 
          id: 'proj_1', 
          name: 'Website Redesign', 
          description: null,
          status: 'PENDING' as ProjectStatus,
          userId,
          clientId: 'client_1',
          createdAt: now,
          updatedAt: now
        },
        { 
          id: 'proj_2', 
          name: 'Mobile App', 
          description: null,
          status: 'PENDING' as ProjectStatus,
          userId,
          clientId: 'client_2',
          createdAt: now,
          updatedAt: now
        },
      ];

      mockPrisma.project.findMany.mockResolvedValue(projects);
      mockPrisma.request.findMany.mockResolvedValue([]);
      mockPrisma.changeOrder.findMany.mockResolvedValue([]);

      const result = await getDashboard({ userId });

      expect(result.recentActivity).toHaveLength(2);
      expect(result.recentActivity[0]).toEqual({
        id: 'proj_1',
        type: 'PROJECT_CREATED',
        message: 'New project created: Website Redesign',
        createdAt: now,
      });
      expect(result.recentActivity[1]).toEqual({
        id: 'proj_2',
        type: 'PROJECT_CREATED',
        message: 'New project created: Mobile App',
        createdAt: now,
      });
    });

    it('should generate correct activity messages for requests', async () => {
      mockPrisma.project.count.mockResolvedValue(0);
      mockPrisma.scopeItem.count.mockResolvedValue(0);
      mockPrisma.request.count.mockResolvedValue(0);
      mockPrisma.changeOrder.count.mockResolvedValue(0);

      const requests = [
        { 
          id: 'req_1', 
          description: 'Add contact form', 
          status: 'PENDING' as RequestStatus,
          projectId: 'proj_1',
          createdAt: now,
          updatedAt: now
        },
        { 
          id: 'req_2', 
          description: 'Update footer', 
          status: 'PENDING' as RequestStatus,
          projectId: 'proj_2',
          createdAt: now,
          updatedAt: now
        },
      ];

      mockPrisma.project.findMany.mockResolvedValue([]);
      mockPrisma.request.findMany.mockResolvedValue(requests);
      mockPrisma.changeOrder.findMany.mockResolvedValue([]);

      const result = await getDashboard({ userId });

      expect(result.recentActivity).toHaveLength(2);
      expect(result.recentActivity[0]).toEqual({
        id: 'req_1',
        type: 'REQUEST_SUBMITTED',
        message: 'Scope request submitted: Add contact form',
        createdAt: now,
      });
      expect(result.recentActivity[1]).toEqual({
        id: 'req_2',
        type: 'REQUEST_SUBMITTED',
        message: 'Scope request submitted: Update footer',
        createdAt: now,
      });
    });

    it('should generate correct activity messages for change orders with different statuses', async () => {
      mockPrisma.project.count.mockResolvedValue(0);
      mockPrisma.scopeItem.count.mockResolvedValue(0);
      mockPrisma.request.count.mockResolvedValue(0);
      mockPrisma.changeOrder.count.mockResolvedValue(0);

      const changeOrders = [
        { 
          id: 'co_1', 
          status: 'APPROVED' as ChangeOrderStatus,
          userId,
          projectId: 'proj_1',
          requestId: 'req_1',
          priceUsd: new Decimal(1000),
          extraDays: null,
          createdAt: now,
          updatedAt: now
        },
        { 
          id: 'co_2', 
          status: 'PENDING' as ChangeOrderStatus,
          userId,
          projectId: 'proj_2',
          requestId: 'req_2',
          priceUsd: new Decimal(500),
          extraDays: null,
          createdAt: now,
          updatedAt: now
        },
        { 
          id: 'co_3', 
          status: 'REJECTED' as ChangeOrderStatus,
          userId,
          projectId: 'proj_3',
          requestId: 'req_3',
          priceUsd: new Decimal(750),
          extraDays: null,
          createdAt: now,
          updatedAt: now
        },
      ];

      mockPrisma.project.findMany.mockResolvedValue([]);
      mockPrisma.request.findMany.mockResolvedValue([]);
      mockPrisma.changeOrder.findMany.mockResolvedValue(changeOrders);

      const result = await getDashboard({ userId });

      expect(result.recentActivity).toHaveLength(3);
      expect(result.recentActivity[0]).toEqual({
        id: 'co_1',
        type: 'CHANGE_ORDER_APPROVED',
        message: 'Change order approved',
        createdAt: now,
      });
      expect(result.recentActivity[1]).toEqual({
        id: 'co_2',
        type: 'CHANGE_ORDER_PENDING',
        message: 'Change order pending',
        createdAt: now,
      });
      expect(result.recentActivity[2]).toEqual({
        id: 'co_3',
        type: 'CHANGE_ORDER_REJECTED',
        message: 'Change order rejected',
        createdAt: now,
      });
    });

    it('should sort recent activity by date descending and limit to 5 items', async () => {
      mockPrisma.project.count.mockResolvedValue(0);
      mockPrisma.scopeItem.count.mockResolvedValue(0);
      mockPrisma.request.count.mockResolvedValue(0);
      mockPrisma.changeOrder.count.mockResolvedValue(0);

      const oldDate = new Date(now.getTime() - 24 * 60 * 60 * 1000); // 1 day ago
      const veryOldDate = new Date(now.getTime() - 48 * 60 * 60 * 1000); // 2 days ago

      const projects = [
        { 
          id: 'proj_1', 
          name: 'Project 1', 
          description: null,
          status: 'PENDING' as ProjectStatus,
          userId,
          clientId: 'client_1',
          createdAt: oldDate,
          updatedAt: oldDate
        },
        { 
          id: 'proj_2', 
          name: 'Project 2', 
          description: null,
          status: 'PENDING' as ProjectStatus,
          userId,
          clientId: 'client_2',
          createdAt: veryOldDate,
          updatedAt: veryOldDate
        },
      ];

      const requests = [
        { 
          id: 'req_1', 
          description: 'Request 1', 
          status: 'PENDING' as RequestStatus,
          projectId: 'proj_1',
          createdAt: now,
          updatedAt: now
        },
        { 
          id: 'req_2', 
          description: 'Request 2', 
          status: 'PENDING' as RequestStatus,
          projectId: 'proj_2',
          createdAt: oldDate,
          updatedAt: oldDate
        },
      ];

      const changeOrders = [
        { 
          id: 'co_1', 
          status: 'APPROVED' as ChangeOrderStatus,
          userId,
          projectId: 'proj_1',
          requestId: 'req_1',
          priceUsd: new Decimal(1000),
          extraDays: null,
          createdAt: now,
          updatedAt: now
        },
        { 
          id: 'co_2', 
          status: 'PENDING' as ChangeOrderStatus,
          userId,
          projectId: 'proj_2',
          requestId: 'req_2',
          priceUsd: new Decimal(500),
          extraDays: null,
          createdAt: veryOldDate,
          updatedAt: veryOldDate
        },
      ];

      mockPrisma.project.findMany.mockResolvedValue(projects);
      mockPrisma.request.findMany.mockResolvedValue(requests);
      mockPrisma.changeOrder.findMany.mockResolvedValue(changeOrders);

      const result = await getDashboard({ userId });

      expect(result.recentActivity).toHaveLength(5);
      
      // Should be sorted by date descending
      expect(result.recentActivity[0].createdAt).toEqual(now);
      expect(result.recentActivity[1].createdAt).toEqual(now);
      expect(result.recentActivity[2].createdAt).toEqual(oldDate);
      expect(result.recentActivity[3].createdAt).toEqual(oldDate);
      expect(result.recentActivity[4].createdAt).toEqual(veryOldDate);
    });

    it('should handle mixed activity types and maintain chronological order', async () => {
      mockPrisma.project.count.mockResolvedValue(0);
      mockPrisma.scopeItem.count.mockResolvedValue(0);
      mockPrisma.request.count.mockResolvedValue(0);
      mockPrisma.changeOrder.count.mockResolvedValue(0);

      const recentDate = new Date(now.getTime() + 60 * 1000); // 1 minute in future
      const projects = [{ 
        id: 'proj_1', 
        name: 'Project 1', 
        description: null,
        status: 'PENDING' as ProjectStatus,
        userId,
        clientId: 'client_1',
        createdAt: now,
        updatedAt: now
      }];
      const requests = [{ 
        id: 'req_1', 
        description: 'Request 1', 
        status: 'PENDING' as RequestStatus,
        projectId: 'proj_1',
        createdAt: recentDate,
        updatedAt: recentDate
      }];
      const changeOrders = [{ 
        id: 'co_1', 
        status: 'APPROVED' as ChangeOrderStatus,
        userId,
        projectId: 'proj_1',
        requestId: 'req_1',
        priceUsd: new Decimal(1000),
        extraDays: null,
        createdAt: now,
        updatedAt: now
      }];

      mockPrisma.project.findMany.mockResolvedValue(projects);
      mockPrisma.request.findMany.mockResolvedValue(requests);
      mockPrisma.changeOrder.findMany.mockResolvedValue(changeOrders);

      const result = await getDashboard({ userId });

      expect(result.recentActivity).toHaveLength(3);
      expect(result.recentActivity[0].type).toBe('REQUEST_SUBMITTED');
      expect(result.recentActivity[0].createdAt).toEqual(recentDate);
      expect(result.recentActivity[1].type).toBe('PROJECT_CREATED');
      expect(result.recentActivity[2].type).toBe('CHANGE_ORDER_APPROVED');
    });

    it('should handle database errors gracefully', async () => {
      mockPrisma.$transaction.mockRejectedValue(new Error('Database connection failed'));

      await expect(getDashboard({ userId })).rejects.toThrow('Database connection failed');
    });

    it('should handle partial database failures', async () => {
      // Mock transaction to throw error
      mockPrisma.$transaction.mockRejectedValue(new Error('Database error'));

      await expect(getDashboard({ userId })).rejects.toThrow('Database error');
    });

    it('should handle large numbers correctly', async () => {
      const largeNumber = 999999;
      
      mockPrisma.project.count.mockResolvedValue(largeNumber);
      mockPrisma.scopeItem.count.mockResolvedValue(largeNumber);
      mockPrisma.request.count.mockResolvedValue(largeNumber);
      mockPrisma.changeOrder.count.mockResolvedValue(largeNumber);

      mockPrisma.project.findMany.mockResolvedValue([]);
      mockPrisma.request.findMany.mockResolvedValue([]);
      mockPrisma.changeOrder.findMany.mockResolvedValue([]);

      const result = await getDashboard({ userId });

      expect(result.metrics.projects.total).toBe(largeNumber);
      expect(result.metrics.scopeItems.total).toBe(largeNumber);
      expect(result.metrics.requests.total).toBe(largeNumber);
      expect(result.metrics.changeOrders.total).toBe(largeNumber);
    });

    it('should correctly format change orders breakdown string', async () => {
      mockPrisma.project.count.mockResolvedValue(1);
      mockPrisma.scopeItem.count.mockResolvedValue(1);
      mockPrisma.request.count.mockResolvedValue(1);
      
      // Test different combinations of change order statuses
      mockPrisma.changeOrder.count
        .mockResolvedValueOnce(100) // total
        .mockResolvedValueOnce(10)  // new this month
        .mockResolvedValueOnce(60)  // approved
        .mockResolvedValueOnce(25)  // rejected
        .mockResolvedValueOnce(15); // pending

      mockPrisma.project.findMany.mockResolvedValue([]);
      mockPrisma.request.findMany.mockResolvedValue([]);
      mockPrisma.changeOrder.findMany.mockResolvedValue([]);

      const result = await getDashboard({ userId });

      expect(result.quickStats.changeOrders.breakdown).toBe('60 approved, 15 pending, 25 rejected');
    });

    it('should handle different user IDs correctly', async () => {
      const differentUserId = 'different_user_456';
      
      mockPrisma.project.count.mockResolvedValue(1);
      mockPrisma.scopeItem.count.mockResolvedValue(1);
      mockPrisma.request.count.mockResolvedValue(1);
      mockPrisma.changeOrder.count.mockResolvedValue(1);

      mockPrisma.project.findMany.mockResolvedValue([]);
      mockPrisma.request.findMany.mockResolvedValue([]);
      mockPrisma.changeOrder.findMany.mockResolvedValue([]);

      await getDashboard({ userId: differentUserId });

      // Verify that all queries use the correct userId
      expect(mockPrisma.project.count).toHaveBeenCalledWith({
        where: { userId: differentUserId },
      });

      expect(mockPrisma.project.findMany).toHaveBeenCalledWith({
        where: { userId: differentUserId },
        orderBy: { createdAt: 'desc' },
        take: 5,
      });
    });
  });
});
