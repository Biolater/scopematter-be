import { updateProject } from "../project.service";
import { mockPrisma } from "../../__tests__/setup";
import { ServiceError } from "../../utils/service-error";
import { ServiceErrorCodes } from "../../utils/service-error-codes";

describe('updateProject', () => {
  const projectId = 'project123';
  const userId = 'user456';
  const clientId = 'client789';

  beforeEach(() => {
    jest.clearAllMocks();
    mockPrisma.$transaction.mockImplementation((fn: any) => fn(mockPrisma));
  });

  const mockExistingProject = {
    id: projectId,
    userId: userId,
    name: 'Old Project Name',
    description: 'Old Description',
    clientId: clientId,
    createdAt: new Date(),
    updatedAt: new Date(),
    client: {
      id: clientId,
      name: 'Old Client Name',
      email: 'old@example.com',
      company: 'Old Company',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
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
    expect(result.name).toBe(mockExistingProject.name); // Project name should not change
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

});