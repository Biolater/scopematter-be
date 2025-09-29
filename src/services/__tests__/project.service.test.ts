import { 
  createProject, 
  getProjects, 
  getProject, 
  deleteProject, 
  updateProject 
} from "../project.service";
import { mockPrisma } from "../../__tests__/setup";
import { ServiceError } from "../../utils/service-error";
import { ServiceErrorCodes } from "../../utils/service-error-codes";
import { ProjectStatus } from "@prisma/client";

describe('project.service', () => {
  const projectId = 'project123';
  const userId = 'user456';
  const clientId = 'client789';
  const now = new Date();

  beforeEach(() => {
    jest.clearAllMocks();
    mockPrisma.$transaction.mockImplementation((fn: any) => fn(mockPrisma));
  });

  const mockClient = {
    id: clientId,
    name: 'Test Client',
    email: 'client@example.com',
    company: 'Test Company',
    createdAt: now,
    updatedAt: now,
  };

  const mockProject = {
    id: projectId,
    userId: userId,
    name: 'Test Project',
    description: 'Test Description',
    status: ProjectStatus.PENDING,
    clientId: clientId,
    createdAt: now,
    updatedAt: now,
    client: mockClient,
  };

  // ---------------------------
  // createProject
  // ---------------------------
  describe('createProject', () => {
    it('should create project with client successfully', async () => {
      const createData = {
        userId,
        name: 'New Project',
        description: 'New Description',
        client: {
          name: 'New Client',
          email: 'new@example.com',
          company: 'New Company',
        },
      };

      mockPrisma.client.create.mockResolvedValue(mockClient);
      mockPrisma.project.create.mockResolvedValue(mockProject);

      const result = await createProject(createData);

      expect(mockPrisma.client.create).toHaveBeenCalledWith({
        data: {
          name: 'New Client',
          email: 'new@example.com',
          company: 'New Company',
        },
      });
      expect(mockPrisma.project.create).toHaveBeenCalledWith({
        data: {
          name: 'New Project',
          description: 'New Description',
          userId,
          clientId: clientId,
        },
      });
      expect(result).toEqual(mockProject);
    });

    it('should create project with minimal client data', async () => {
      const createData = {
        userId,
        name: 'New Project',
        description: undefined,
        client: {
          name: 'New Client',
        },
      };

      const minimalClient = { ...mockClient, email: null, company: null };
      const minimalProject = { ...mockProject, description: null };

      mockPrisma.client.create.mockResolvedValue(minimalClient);
      mockPrisma.project.create.mockResolvedValue(minimalProject);

      const result = await createProject(createData);

      expect(mockPrisma.client.create).toHaveBeenCalledWith({
        data: {
          name: 'New Client',
          email: undefined,
          company: undefined,
        },
      });
      expect(result).toEqual(minimalProject);
    });

    it('should handle transaction rollback on client creation failure', async () => {
      const createData = {
        userId,
        name: 'New Project',
        description: 'New Description',
        client: {
          name: 'New Client',
          email: 'new@example.com',
          company: 'New Company',
        },
      };

      mockPrisma.client.create.mockRejectedValue(new Error('Database error'));

      await expect(createProject(createData)).rejects.toThrow('Database error');
      expect(mockPrisma.project.create).not.toHaveBeenCalled();
    });

    it('should handle transaction rollback on project creation failure', async () => {
      const createData = {
        userId,
        name: 'New Project',
        description: 'New Description',
        client: {
          name: 'New Client',
          email: 'new@example.com',
          company: 'New Company',
        },
      };

      mockPrisma.client.create.mockResolvedValue(mockClient);
      mockPrisma.project.create.mockRejectedValue(new Error('Database error'));

      await expect(createProject(createData)).rejects.toThrow('Database error');
    });
  });

  // ---------------------------
  // getProjects
  // ---------------------------
  describe('getProjects', () => {
    it('should return projects with client info and counts', async () => {
      const projectsWithCounts = [
        {
          ...mockProject,
          client: {
            id: clientId,
            name: 'Test Client',
            email: 'client@example.com',
          },
          _count: {
            scopeItems: 5,
            requests: 3,
            changeOrders: 2,
          },
        },
      ];

      mockPrisma.project.findMany.mockResolvedValue(projectsWithCounts);

      const result = await getProjects({ userId });

      expect(mockPrisma.project.findMany).toHaveBeenCalledWith({
        where: { userId },
        include: {
          client: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          _count: {
            select: {
              scopeItems: true,
              requests: true,
              changeOrders: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });
      expect(result).toEqual(projectsWithCounts);
    });

    it('should return empty array when no projects exist', async () => {
      mockPrisma.project.findMany.mockResolvedValue([]);

      const result = await getProjects({ userId });

      expect(result).toEqual([]);
      expect(Array.isArray(result)).toBe(true);
    });

    it('should handle database errors', async () => {
      mockPrisma.project.findMany.mockRejectedValue(new Error('Database connection failed'));

      await expect(getProjects({ userId })).rejects.toThrow('Database connection failed');
    });
  });

  // ---------------------------
  // getProject
  // ---------------------------
  describe('getProject', () => {
    it('should return project with full details', async () => {
      const fullProject = {
        ...mockProject,
        client: {
          id: clientId,
          name: 'Test Client',
          email: 'client@example.com',
          company: 'Test Company',
        },
        scopeItems: [
          { id: 'item1', description: 'Item 1', createdAt: now },
          { id: 'item2', description: 'Item 2', createdAt: now },
        ],
        requests: [
          {
            id: 'req1',
            description: 'Request 1',
            status: 'PENDING',
            createdAt: now,
            changeOrder: null,
          },
        ],
        changeOrders: [
          {
            id: 'co1',
            priceUsd: 1000,
            extraDays: 5,
            status: 'PENDING',
            createdAt: now,
          },
        ],
      };

      mockPrisma.project.findFirst.mockResolvedValue(fullProject);

      const result = await getProject({ id: projectId, userId });

      expect(mockPrisma.project.findFirst).toHaveBeenCalledWith({
        where: { id: projectId, userId },
        include: {  
          client: {
            select: { id: true, name: true, email: true, company: true },
          },
          scopeItems: {
            select: { id: true, description: true, createdAt: true, name: true, status: true },
            orderBy: [
              { createdAt: 'desc' },
              { id: 'desc' },
            ]
          },
          requests: {
            select: {
              id: true,
              description: true,
              status: true,
              createdAt: true,
              changeOrder: {
                select: { id: true, priceUsd: true, extraDays: true, status: true },
              },
            },
            orderBy: [
              { createdAt: 'desc' },
              { id: 'desc' },
            ],
          },
          changeOrders: {
            select: {
              id: true,
              request: {
                select: {
                  id: true,
                  description: true,
                  status: true,
                  createdAt: true,
                }
              },
              priceUsd: true,
              extraDays: true,
              status: true,
              createdAt: true,
            },
            orderBy: [
              { createdAt: 'desc' },
              { id: 'desc' },
            ],
          },
          _count: {
            select: {
              scopeItems: true,
              requests: true,
              changeOrders: true,
            },
          },
        },
      });
      expect(result).toEqual(fullProject);
    });

    it('should throw PROJECT_NOT_FOUND when project does not exist', async () => {
      mockPrisma.project.findFirst.mockResolvedValue(null);

      await expect(getProject({ id: projectId, userId })).rejects.toThrow(ServiceError);
      await expect(getProject({ id: projectId, userId })).rejects.toHaveProperty(
        'code',
        ServiceErrorCodes.PROJECT_NOT_FOUND,
      );
    });

    it('should throw PROJECT_NOT_FOUND when project belongs to different user', async () => {
      mockPrisma.project.findFirst.mockResolvedValue(null);

      await expect(getProject({ id: projectId, userId: 'different-user' })).rejects.toThrow(ServiceError);
      await expect(getProject({ id: projectId, userId: 'different-user' })).rejects.toHaveProperty(
        'code',
        ServiceErrorCodes.PROJECT_NOT_FOUND,
      );
    });

    it('should handle database errors', async () => {
      mockPrisma.project.findFirst.mockRejectedValue(new Error('Database error'));

      await expect(getProject({ id: projectId, userId })).rejects.toThrow('Database error');
    });
  });

  // ---------------------------
  // deleteProject
  // ---------------------------
  describe('deleteProject', () => {
    it('should delete project successfully', async () => {
      mockPrisma.project.findFirst.mockResolvedValue(mockProject);
      mockPrisma.project.delete.mockResolvedValue(mockProject);

      const result = await deleteProject({ id: projectId, userId });

      expect(mockPrisma.project.findFirst).toHaveBeenCalledWith({
        where: { id: projectId, userId },
      });
      expect(mockPrisma.project.delete).toHaveBeenCalledWith({
        where: { id: projectId },
      });
      expect(result).toEqual(mockProject);
    });

    it('should throw PROJECT_NOT_FOUND when project does not exist', async () => {
      mockPrisma.project.findFirst.mockResolvedValue(null);

      await expect(deleteProject({ id: projectId, userId })).rejects.toThrow(ServiceError);
      await expect(deleteProject({ id: projectId, userId })).rejects.toHaveProperty(
        'code',
        ServiceErrorCodes.PROJECT_NOT_FOUND,
      );
      expect(mockPrisma.project.delete).not.toHaveBeenCalled();
    });

    it('should throw PROJECT_NOT_FOUND when project belongs to different user', async () => {
      mockPrisma.project.findFirst.mockResolvedValue(null);

      await expect(deleteProject({ id: projectId, userId: 'different-user' })).rejects.toThrow(ServiceError);
      await expect(deleteProject({ id: projectId, userId: 'different-user' })).rejects.toHaveProperty(
        'code',
        ServiceErrorCodes.PROJECT_NOT_FOUND,
      );
      expect(mockPrisma.project.delete).not.toHaveBeenCalled();
    });

    it('should handle database errors during find', async () => {
      mockPrisma.project.findFirst.mockRejectedValue(new Error('Database error'));

      await expect(deleteProject({ id: projectId, userId })).rejects.toThrow('Database error');
      expect(mockPrisma.project.delete).not.toHaveBeenCalled();
    });

    it('should handle database errors during delete', async () => {
      mockPrisma.project.findFirst.mockResolvedValue(mockProject);
      mockPrisma.project.delete.mockRejectedValue(new Error('Delete failed'));

      await expect(deleteProject({ id: projectId, userId })).rejects.toThrow('Delete failed');
    });
  });

  // ---------------------------
  // updateProject
  // ---------------------------
  describe('updateProject', () => {
    const mockExistingProject = {
      ...mockProject,
      client: mockClient,
    };

    it('should successfully update project name and description', async () => {
      mockPrisma.project.findFirst.mockResolvedValue(mockExistingProject);
      mockPrisma.project.update.mockResolvedValue({ ...mockExistingProject, name: 'New Project Name', description: 'New Description' });

      const data = {
        name: 'New Project Name',
        description: 'New Description',
      };

      const result = await updateProject({ id: projectId, userId, data });

      expect(mockPrisma.project.findFirst).toHaveBeenCalledWith({
        where: { id: projectId, userId },
        include: { client: true },
      });
      expect(mockPrisma.project.update).toHaveBeenCalledWith({
        where: { id: projectId },
        data: { name: 'New Project Name', description: 'New Description' },
      });
      expect(mockPrisma.client.update).not.toHaveBeenCalled();
      expect(result.name).toBe('New Project Name');
      expect(result.description).toBe('New Description');
    });

    it('should successfully update client name and email', async () => {
      mockPrisma.project.findFirst.mockResolvedValue(mockExistingProject);
      mockPrisma.project.update.mockResolvedValue(mockExistingProject);
      mockPrisma.client.update.mockResolvedValue({ ...mockExistingProject.client, name: 'Updated Client', email: 'updated@example.com' });

      const data = {
        client: {
          name: 'Updated Client',
          email: 'updated@example.com',
        },
      };

      const result = await updateProject({ id: projectId, userId, data });

      expect(mockPrisma.project.findFirst).toHaveBeenCalledWith({
        where: { id: projectId, userId },
        include: { client: true },
      });
      expect(mockPrisma.project.update).toHaveBeenCalledWith({
        where: { id: projectId },
        data: {},
      });
      expect(mockPrisma.client.update).toHaveBeenCalledWith({
        where: { id: clientId },
        data: { name: 'Updated Client', email: 'updated@example.com' },
      });
      expect(result.name).toBe(mockExistingProject.name);
    });

    it('should handle partial updates for project and client', async () => {
      mockPrisma.project.findFirst.mockResolvedValue(mockExistingProject);
      mockPrisma.project.update.mockResolvedValue({ ...mockExistingProject, name: 'Only Name Changed' });
      mockPrisma.client.update.mockResolvedValue({ ...mockExistingProject.client, company: 'New Company' });

      const data = {
        name: 'Only Name Changed',
        client: {
          company: 'New Company',
        },
      };

      const result = await updateProject({ id: projectId, userId, data });

      expect(mockPrisma.project.update).toHaveBeenCalledWith({
        where: { id: projectId },
        data: { name: 'Only Name Changed' },
      });
      expect(mockPrisma.client.update).toHaveBeenCalledWith({
        where: { id: clientId },
        data: { company: 'New Company' },
      });
      expect(result.name).toBe('Only Name Changed');
    });

    it('should throw ServiceError if project not found', async () => {
      mockPrisma.project.findFirst.mockResolvedValue(null);

      const data = { name: 'New Project Name' };
      await expect(updateProject({ id: projectId, userId, data })).rejects.toThrow(ServiceError);
      await expect(updateProject({ id: projectId, userId, data })).rejects.toHaveProperty('code', ServiceErrorCodes.PROJECT_NOT_FOUND);
    });

    it('should handle empty strings for project fields by setting them to undefined', async () => {
      mockPrisma.project.findFirst.mockResolvedValue(mockExistingProject);
      mockPrisma.project.update.mockResolvedValue({ ...mockExistingProject, name: '', description: '' });

      const data = {
        name: '',
        description: '',
      };

      await updateProject({ id: projectId, userId, data });

      expect(mockPrisma.project.update).toHaveBeenCalledWith({
        where: { id: projectId },
        data: { name: undefined, description: undefined },
      });
    });

    it('should handle empty strings for client fields by setting them to undefined', async () => {
      mockPrisma.project.findFirst.mockResolvedValue(mockExistingProject);
      mockPrisma.project.update.mockResolvedValue(mockExistingProject);
      mockPrisma.client.update.mockResolvedValue({ ...mockExistingProject.client, name: '', email: '', company: '' });

      const data = {
        client: {
          name: '',
          email: '',
          company: '',
        },
      };

      await updateProject({ id: projectId, userId, data });

      expect(mockPrisma.client.update).toHaveBeenCalledWith({
        where: { id: clientId },
        data: { name: undefined, email: undefined, company: undefined },
      });
    });

    it('should not attempt client update if no client data is provided', async () => {
      mockPrisma.project.findFirst.mockResolvedValue(mockExistingProject);
      mockPrisma.project.update.mockResolvedValue({ ...mockExistingProject, name: 'Only Project Name' });

      const data = {
        name: 'Only Project Name',
      };

      await updateProject({ id: projectId, userId, data });

      expect(mockPrisma.project.update).toHaveBeenCalled();
      expect(mockPrisma.client.update).not.toHaveBeenCalled();
    });

    it('should not attempt client update if client object is empty', async () => {
      mockPrisma.project.findFirst.mockResolvedValue(mockExistingProject);
      mockPrisma.project.update.mockResolvedValue(mockExistingProject);

      const data = {
        client: {},
      };

      await updateProject({ id: projectId, userId, data });

      expect(mockPrisma.project.update).toHaveBeenCalled();
      expect(mockPrisma.client.update).not.toHaveBeenCalled();
    });

    it('should handle undefined values correctly', async () => {
      mockPrisma.project.findFirst.mockResolvedValue(mockExistingProject);
      mockPrisma.project.update.mockResolvedValue(mockExistingProject);

      const data = {
        name: undefined,
        description: undefined,
        client: {
          name: undefined,
          email: undefined,
          company: undefined,
        },
      };

      await updateProject({ id: projectId, userId, data });

      expect(mockPrisma.project.update).toHaveBeenCalledWith({
        where: { id: projectId },
        data: {},
      });
      expect(mockPrisma.client.update).not.toHaveBeenCalled();
    });

    it('should handle mixed undefined and defined values', async () => {
      mockPrisma.project.findFirst.mockResolvedValue(mockExistingProject);
      mockPrisma.project.update.mockResolvedValue({ ...mockExistingProject, name: 'New Name' });
      mockPrisma.client.update.mockResolvedValue({ ...mockExistingProject.client, email: 'new@example.com' });

      const data = {
        name: 'New Name',
        description: undefined,
        client: {
          name: undefined,
          email: 'new@example.com',
          company: undefined,
        },
      };

      await updateProject({ id: projectId, userId, data });

      expect(mockPrisma.project.update).toHaveBeenCalledWith({
        where: { id: projectId },
        data: { name: 'New Name' },
      });
      expect(mockPrisma.client.update).toHaveBeenCalledWith({
        where: { id: clientId },
        data: { email: 'new@example.com' },
      });
    });

    it('should handle database errors during find', async () => {
      mockPrisma.project.findFirst.mockRejectedValue(new Error('Database error'));

      const data = { name: 'New Project Name' };
      await expect(updateProject({ id: projectId, userId, data })).rejects.toThrow('Database error');
    });

    it('should handle database errors during project update', async () => {
      mockPrisma.project.findFirst.mockResolvedValue(mockExistingProject);
      mockPrisma.project.update.mockRejectedValue(new Error('Update failed'));

      const data = { name: 'New Project Name' };
      await expect(updateProject({ id: projectId, userId, data })).rejects.toThrow('Update failed');
    });

    it('should handle database errors during client update', async () => {
      mockPrisma.project.findFirst.mockResolvedValue(mockExistingProject);
      mockPrisma.project.update.mockResolvedValue(mockExistingProject);
      mockPrisma.client.update.mockRejectedValue(new Error('Client update failed'));

      const data = {
        client: {
          name: 'Updated Client',
        },
      };

      await expect(updateProject({ id: projectId, userId, data })).rejects.toThrow('Client update failed');
    });

    it('should handle transaction rollback on any error', async () => {
      mockPrisma.project.findFirst.mockResolvedValue(mockExistingProject);
      mockPrisma.project.update.mockRejectedValue(new Error('Transaction error'));

      const data = { name: 'New Project Name' };
      await expect(updateProject({ id: projectId, userId, data })).rejects.toThrow('Transaction error');
    });
  });
});