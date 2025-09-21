import {
    createScopeItem,
    getScopeItems,
    deleteScopeItem,
    updateScopeItem,
  } from '../scopeItem.service';
  import { mockPrisma } from '../../__tests__/setup';
  import { ServiceError } from '../../utils/service-error';
  import { ServiceErrorCodes } from '../../utils/service-error-codes';
  import { ProjectStatus } from '@prisma/client';
  
  describe('scopeItem.service', () => {
    const projectId = 'proj_123';
    const userId = 'user_456';
    const scopeItemId = 'item_789';
    const now = new Date();

    const mockProject = {
        id: projectId, 
        userId, 
        name: 'Test Project',
        description: 'Test Description',
        status: ProjectStatus.PENDING,
        clientId: 'client123',
        createdAt: now,
        updatedAt: now
    };
  
    beforeEach(() => {
      jest.clearAllMocks();
      mockPrisma.$transaction.mockImplementation((fn: any) => fn(mockPrisma));
    });
  
    // ---------------------------
    // createScopeItem
    // ---------------------------
    describe('createScopeItem', () => {
      it('creates a scope item when project is owned by user', async () => {
        const created = {
          id: scopeItemId,
          projectId,
          description: 'Homepage redesign',
          createdAt: now,
          updatedAt: now,
        };
  
        mockPrisma.project.findFirst.mockResolvedValue(mockProject);
        mockPrisma.scopeItem.create.mockResolvedValue(created);
  
        const result = await createScopeItem({
          projectId,
          userId,
          description: created.description,
        });
  
        expect(mockPrisma.project.findFirst).toHaveBeenCalledWith({
          where: { id: projectId, userId },
        });
        expect(mockPrisma.scopeItem.create).toHaveBeenCalledWith({
          data: { description: created.description, projectId },
        });
        expect(result).toEqual(created);
      });

      it('creates scope item with minimal description', async () => {
        const created = {
          id: scopeItemId,
          projectId,
          description: 'A',
          createdAt: now,
          updatedAt: now,
        };

        mockPrisma.project.findFirst.mockResolvedValue(mockProject);
        mockPrisma.scopeItem.create.mockResolvedValue(created);

        const result = await createScopeItem({
          projectId,
          userId,
          description: 'A',
        });

        expect(mockPrisma.scopeItem.create).toHaveBeenCalledWith({
          data: { description: 'A', projectId },
        });
        expect(result).toEqual(created);
      });

      it('creates scope item with long description', async () => {
        const longDescription = 'A'.repeat(1000);
        const created = {
          id: scopeItemId,
          projectId,
          description: longDescription,
          createdAt: now,
          updatedAt: now,
        };

        mockPrisma.project.findFirst.mockResolvedValue(mockProject);
        mockPrisma.scopeItem.create.mockResolvedValue(created);

        const result = await createScopeItem({
          projectId,
          userId,
          description: longDescription,
        });

        expect(mockPrisma.scopeItem.create).toHaveBeenCalledWith({
          data: { description: longDescription, projectId },
        });
        expect(result).toEqual(created);
      });
  
      it('throws PROJECT_NOT_FOUND when project is missing or not owned', async () => {
        mockPrisma.project.findFirst.mockResolvedValue(null);
  
        await expect(
          createScopeItem({ projectId, userId, description: 'New item' }),
        ).rejects.toThrow(ServiceError);
  
        await expect(
          createScopeItem({ projectId, userId, description: 'New item' }),
        ).rejects.toHaveProperty('code', ServiceErrorCodes.PROJECT_NOT_FOUND);
  
        expect(mockPrisma.scopeItem.create).not.toHaveBeenCalled();
      });

      it('throws PROJECT_NOT_FOUND when project belongs to different user', async () => {
        mockPrisma.project.findFirst.mockResolvedValue(null);

        await expect(
          createScopeItem({ projectId, userId: 'different-user', description: 'New item' }),
        ).rejects.toThrow(ServiceError);

        await expect(
          createScopeItem({ projectId, userId: 'different-user', description: 'New item' }),
        ).rejects.toHaveProperty('code', ServiceErrorCodes.PROJECT_NOT_FOUND);

        expect(mockPrisma.scopeItem.create).not.toHaveBeenCalled();
      });

      it('handles database errors during project lookup', async () => {
        mockPrisma.project.findFirst.mockRejectedValue(new Error('Database connection failed'));

        await expect(
          createScopeItem({ projectId, userId, description: 'New item' }),
        ).rejects.toThrow('Database connection failed');

        expect(mockPrisma.scopeItem.create).not.toHaveBeenCalled();
      });

      it('handles database errors during scope item creation', async () => {
        mockPrisma.project.findFirst.mockResolvedValue(mockProject);
        mockPrisma.scopeItem.create.mockRejectedValue(new Error('Creation failed'));

        await expect(
          createScopeItem({ projectId, userId, description: 'New item' }),
        ).rejects.toThrow('Creation failed');
      });
    });
  
    // ---------------------------
    // getScopeItems
    // ---------------------------
    describe('getScopeItems', () => {
      it('returns items for owned project', async () => {
        const items = [
          { id: 'i1', projectId, description: 'A', createdAt: now, updatedAt: now },
          { id: 'i2', projectId, description: 'B', createdAt: now, updatedAt: now },
        ];
  
        mockPrisma.project.findFirst.mockResolvedValue(mockProject);
        mockPrisma.scopeItem.findMany.mockResolvedValue(items);
  
        const result = await getScopeItems({ projectId, userId });
  
        expect(mockPrisma.project.findFirst).toHaveBeenCalledWith({
          where: { id: projectId, userId },
        });
        expect(mockPrisma.scopeItem.findMany).toHaveBeenCalledWith({
          where: { projectId },
        });
        expect(result).toEqual(items);
      });

      it('returns items in correct order (creation order)', async () => {
        const items = [
          { id: 'i1', projectId, description: 'First', createdAt: new Date('2023-01-01'), updatedAt: now },
          { id: 'i2', projectId, description: 'Second', createdAt: new Date('2023-01-02'), updatedAt: now },
          { id: 'i3', projectId, description: 'Third', createdAt: new Date('2023-01-03'), updatedAt: now },
        ];

        mockPrisma.project.findFirst.mockResolvedValue(mockProject);
        mockPrisma.scopeItem.findMany.mockResolvedValue(items);

        const result = await getScopeItems({ projectId, userId });

        expect(result).toEqual(items);
        expect(result[0].description).toBe('First');
        expect(result[1].description).toBe('Second');
        expect(result[2].description).toBe('Third');
      });
  
      it('returns empty list when no items exist', async () => {
        mockPrisma.project.findFirst.mockResolvedValue(mockProject);
        mockPrisma.scopeItem.findMany.mockResolvedValue([]);
  
        const result = await getScopeItems({ projectId, userId });
  
        expect(Array.isArray(result)).toBe(true);
        expect(result).toHaveLength(0);
      });

      it('returns large number of items correctly', async () => {
        const items = Array.from({ length: 100 }, (_, i) => ({
          id: `item_${i}`,
          projectId,
          description: `Item ${i}`,
          createdAt: now,
          updatedAt: now,
        }));

        mockPrisma.project.findFirst.mockResolvedValue(mockProject);
        mockPrisma.scopeItem.findMany.mockResolvedValue(items);

        const result = await getScopeItems({ projectId, userId });

        expect(result).toEqual(items);
        expect(result).toHaveLength(100);
      });
  
      it('throws PROJECT_NOT_FOUND if project is not owned', async () => {
        mockPrisma.project.findFirst.mockResolvedValue(null);
  
        await expect(getScopeItems({ projectId, userId })).rejects.toThrow(ServiceError);
        await expect(getScopeItems({ projectId, userId })).rejects.toHaveProperty(
          'code',
          ServiceErrorCodes.PROJECT_NOT_FOUND,
        );
        expect(mockPrisma.scopeItem.findMany).not.toHaveBeenCalled();
      });

      it('throws PROJECT_NOT_FOUND if project belongs to different user', async () => {
        mockPrisma.project.findFirst.mockResolvedValue(null);

        await expect(getScopeItems({ projectId, userId: 'different-user' })).rejects.toThrow(ServiceError);
        await expect(getScopeItems({ projectId, userId: 'different-user' })).rejects.toHaveProperty(
          'code',
          ServiceErrorCodes.PROJECT_NOT_FOUND,
        );
        expect(mockPrisma.scopeItem.findMany).not.toHaveBeenCalled();
      });

      it('handles database errors during project lookup', async () => {
        mockPrisma.project.findFirst.mockRejectedValue(new Error('Database error'));

        await expect(getScopeItems({ projectId, userId })).rejects.toThrow('Database error');
        expect(mockPrisma.scopeItem.findMany).not.toHaveBeenCalled();
      });

      it('handles database errors during scope items fetch', async () => {
        mockPrisma.project.findFirst.mockResolvedValue(mockProject);
        mockPrisma.scopeItem.findMany.mockRejectedValue(new Error('Fetch failed'));

        await expect(getScopeItems({ projectId, userId })).rejects.toThrow('Fetch failed');
      });
    });
  
    // ---------------------------
    // deleteScopeItem
    // ---------------------------
    describe('deleteScopeItem', () => {
      it('deletes item scoped to the project and returns minimal payload', async () => {
        mockPrisma.project.findFirst.mockResolvedValue(mockProject);
        mockPrisma.scopeItem.deleteMany.mockResolvedValue({ count: 1 });
  
        const result = await deleteScopeItem({ projectId, id: scopeItemId, userId });
  
        expect(mockPrisma.project.findFirst).toHaveBeenCalledWith({
          where: { id: projectId, userId },
        });
        expect(mockPrisma.scopeItem.deleteMany).toHaveBeenCalledWith({
          where: { id: scopeItemId, projectId },
        });
        expect(result).toEqual({ id: scopeItemId });
      });

      it('deletes item with different project and item IDs', async () => {
        const differentProjectId = 'proj_999';
        const differentItemId = 'item_999';

        const differentProject = { ...mockProject, id: differentProjectId };

        mockPrisma.project.findFirst.mockResolvedValue(differentProject);
        mockPrisma.scopeItem.deleteMany.mockResolvedValue({ count: 1 });

        const result = await deleteScopeItem({ 
          projectId: differentProjectId, 
          id: differentItemId, 
          userId 
        });

        expect(mockPrisma.scopeItem.deleteMany).toHaveBeenCalledWith({
          where: { id: differentItemId, projectId: differentProjectId },
        });
        expect(result).toEqual({ id: differentItemId });
      });
  
      it('throws SCOPE_ITEM_NOT_FOUND when item does not belong to project or missing', async () => {
        mockPrisma.project.findFirst.mockResolvedValue(mockProject);
        mockPrisma.scopeItem.deleteMany.mockResolvedValue({ count: 0 });
  
        await expect(
          deleteScopeItem({ projectId, id: scopeItemId, userId }),
        ).rejects.toThrow(ServiceError);
  
        await expect(
          deleteScopeItem({ projectId, id: scopeItemId, userId }),
        ).rejects.toHaveProperty('code', ServiceErrorCodes.SCOPE_ITEM_NOT_FOUND);
      });

      it('throws SCOPE_ITEM_NOT_FOUND when item belongs to different project', async () => {
        mockPrisma.project.findFirst.mockResolvedValue(mockProject);
        mockPrisma.scopeItem.deleteMany.mockResolvedValue({ count: 0 });

        await expect(
          deleteScopeItem({ projectId, id: 'item-from-different-project', userId }),
        ).rejects.toThrow(ServiceError);

        await expect(
          deleteScopeItem({ projectId, id: 'item-from-different-project', userId }),
        ).rejects.toHaveProperty('code', ServiceErrorCodes.SCOPE_ITEM_NOT_FOUND);
      });
  
      it('throws PROJECT_NOT_FOUND when user does not own the project', async () => {
        mockPrisma.project.findFirst.mockResolvedValue(null);
  
        await expect(
          deleteScopeItem({ projectId, id: scopeItemId, userId }),
        ).rejects.toThrow(ServiceError);
  
        await expect(
          deleteScopeItem({ projectId, id: scopeItemId, userId }),
        ).rejects.toHaveProperty('code', ServiceErrorCodes.PROJECT_NOT_FOUND);
  
        expect(mockPrisma.scopeItem.deleteMany).not.toHaveBeenCalled();
      });

      it('throws PROJECT_NOT_FOUND when project belongs to different user', async () => {
        mockPrisma.project.findFirst.mockResolvedValue(null);

        await expect(
          deleteScopeItem({ projectId, id: scopeItemId, userId: 'different-user' }),
        ).rejects.toThrow(ServiceError);

        await expect(
          deleteScopeItem({ projectId, id: scopeItemId, userId: 'different-user' }),
        ).rejects.toHaveProperty('code', ServiceErrorCodes.PROJECT_NOT_FOUND);

        expect(mockPrisma.scopeItem.deleteMany).not.toHaveBeenCalled();
      });

      it('handles database errors during project lookup', async () => {
        mockPrisma.project.findFirst.mockRejectedValue(new Error('Database error'));

        await expect(
          deleteScopeItem({ projectId, id: scopeItemId, userId }),
        ).rejects.toThrow('Database error');

        expect(mockPrisma.scopeItem.deleteMany).not.toHaveBeenCalled();
      });

      it('handles database errors during deletion', async () => {
        mockPrisma.project.findFirst.mockResolvedValue(mockProject);
        mockPrisma.scopeItem.deleteMany.mockRejectedValue(new Error('Delete failed'));

        await expect(
          deleteScopeItem({ projectId, id: scopeItemId, userId }),
        ).rejects.toThrow('Delete failed');
      });
    });
  
    // ---------------------------
    // updateScopeItem
    // ---------------------------
    describe('updateScopeItem', () => {
      it('updates item description when item belongs to project', async () => {
        const updatedItem = {
          id: scopeItemId,
          projectId,
          description: 'Updated copy',
          createdAt: now,
          updatedAt: now,
        };
  
        mockPrisma.project.findFirst.mockResolvedValue(mockProject);
        mockPrisma.scopeItem.updateMany.mockResolvedValue({ count: 1 });
        mockPrisma.scopeItem.findUnique.mockResolvedValue(updatedItem);
  
        const result = await updateScopeItem({
          projectId,
          id: scopeItemId,
          userId,
          description: 'Updated copy',
        });
  
        expect(mockPrisma.project.findFirst).toHaveBeenCalledWith({
          where: { id: projectId, userId },
        });
        expect(mockPrisma.scopeItem.updateMany).toHaveBeenCalledWith({
          where: { id: scopeItemId, projectId },
          data: { description: 'Updated copy' },
        });
        expect(mockPrisma.scopeItem.findUnique).toHaveBeenCalledWith({
          where: { id: scopeItemId },
        });
        expect(result).toEqual(updatedItem);
      });

      it('updates item with minimal description', async () => {
        const updatedItem = {
          id: scopeItemId,
          projectId,
          description: 'A',
          createdAt: now,
          updatedAt: now,
        };

        mockPrisma.project.findFirst.mockResolvedValue(mockProject);
        mockPrisma.scopeItem.updateMany.mockResolvedValue({ count: 1 });
        mockPrisma.scopeItem.findUnique.mockResolvedValue(updatedItem);

        const result = await updateScopeItem({
          projectId,
          id: scopeItemId,
          userId,
          description: 'A',
        });

        expect(mockPrisma.scopeItem.updateMany).toHaveBeenCalledWith({
          where: { id: scopeItemId, projectId },
          data: { description: 'A' },
        });
        expect(result).toEqual(updatedItem);
      });

      it('updates item with long description', async () => {
        const longDescription = 'A'.repeat(1000);
        const updatedItem = {
          id: scopeItemId,
          projectId,
          description: longDescription,
          createdAt: now,
          updatedAt: now,
        };

        mockPrisma.project.findFirst.mockResolvedValue(mockProject);
        mockPrisma.scopeItem.updateMany.mockResolvedValue({ count: 1 });
        mockPrisma.scopeItem.findUnique.mockResolvedValue(updatedItem);

        const result = await updateScopeItem({
          projectId,
          id: scopeItemId,
          userId,
          description: longDescription,
        });

        expect(mockPrisma.scopeItem.updateMany).toHaveBeenCalledWith({
          where: { id: scopeItemId, projectId },
          data: { description: longDescription },
        });
        expect(result).toEqual(updatedItem);
      });

      it('handles update with same description (no-op)', async () => {
        const updatedItem = {
          id: scopeItemId,
          projectId,
          description: 'Same description',
          createdAt: now,
          updatedAt: now,
        };

        mockPrisma.project.findFirst.mockResolvedValue(mockProject);
        mockPrisma.scopeItem.updateMany.mockResolvedValue({ count: 1 });
        mockPrisma.scopeItem.findUnique.mockResolvedValue(updatedItem);

        const result = await updateScopeItem({
          projectId,
          id: scopeItemId,
          userId,
          description: 'Same description',
        });

        expect(result).toEqual(updatedItem);
      });
  
      it('throws SCOPE_ITEM_NOT_FOUND when update count is 0', async () => {
        mockPrisma.project.findFirst.mockResolvedValue(mockProject);
        mockPrisma.scopeItem.updateMany.mockResolvedValue({ count: 0 });
  
        await expect(
          updateScopeItem({ projectId, id: scopeItemId, userId, description: 'No-op' }),
        ).rejects.toThrow(ServiceError);
  
        await expect(
          updateScopeItem({ projectId, id: scopeItemId, userId, description: 'No-op' }),
        ).rejects.toHaveProperty('code', ServiceErrorCodes.SCOPE_ITEM_NOT_FOUND);
  
        expect(mockPrisma.scopeItem.findUnique).not.toHaveBeenCalled();
      });

      it('throws SCOPE_ITEM_NOT_FOUND when item belongs to different project', async () => {
        mockPrisma.project.findFirst.mockResolvedValue(mockProject);
        mockPrisma.scopeItem.updateMany.mockResolvedValue({ count: 0 });

        await expect(
          updateScopeItem({ projectId, id: 'item-from-different-project', userId, description: 'Update' }),
        ).rejects.toThrow(ServiceError);

        await expect(
          updateScopeItem({ projectId, id: 'item-from-different-project', userId, description: 'Update' }),
        ).rejects.toHaveProperty('code', ServiceErrorCodes.SCOPE_ITEM_NOT_FOUND);

        expect(mockPrisma.scopeItem.findUnique).not.toHaveBeenCalled();
      });
  
      it('throws PROJECT_NOT_FOUND when user does not own the project', async () => {
        mockPrisma.project.findFirst.mockResolvedValue(null);
  
        await expect(
          updateScopeItem({ projectId, id: scopeItemId, userId, description: 'X' }),
        ).rejects.toThrow(ServiceError);
  
        await expect(
          updateScopeItem({ projectId, id: scopeItemId, userId, description: 'X' }),
        ).rejects.toHaveProperty('code', ServiceErrorCodes.PROJECT_NOT_FOUND);
  
        expect(mockPrisma.scopeItem.updateMany).not.toHaveBeenCalled();
        expect(mockPrisma.scopeItem.findUnique).not.toHaveBeenCalled();
      });

      it('throws PROJECT_NOT_FOUND when project belongs to different user', async () => {
        mockPrisma.project.findFirst.mockResolvedValue(null);

        await expect(
          updateScopeItem({ projectId, id: scopeItemId, userId: 'different-user', description: 'X' }),
        ).rejects.toThrow(ServiceError);

        await expect(
          updateScopeItem({ projectId, id: scopeItemId, userId: 'different-user', description: 'X' }),
        ).rejects.toHaveProperty('code', ServiceErrorCodes.PROJECT_NOT_FOUND);

        expect(mockPrisma.scopeItem.updateMany).not.toHaveBeenCalled();
        expect(mockPrisma.scopeItem.findUnique).not.toHaveBeenCalled();
      });

      it('handles database errors during project lookup', async () => {
        mockPrisma.project.findFirst.mockRejectedValue(new Error('Database error'));

        await expect(
          updateScopeItem({ projectId, id: scopeItemId, userId, description: 'Update' }),
        ).rejects.toThrow('Database error');

        expect(mockPrisma.scopeItem.updateMany).not.toHaveBeenCalled();
        expect(mockPrisma.scopeItem.findUnique).not.toHaveBeenCalled();
      });

      it('handles database errors during update', async () => {
        mockPrisma.project.findFirst.mockResolvedValue(mockProject);
        mockPrisma.scopeItem.updateMany.mockRejectedValue(new Error('Update failed'));

        await expect(
          updateScopeItem({ projectId, id: scopeItemId, userId, description: 'Update' }),
        ).rejects.toThrow('Update failed');

        expect(mockPrisma.scopeItem.findUnique).not.toHaveBeenCalled();
      });

      it('handles database errors during findUnique', async () => {
        mockPrisma.project.findFirst.mockResolvedValue(mockProject);
        mockPrisma.scopeItem.updateMany.mockResolvedValue({ count: 1 });
        mockPrisma.scopeItem.findUnique.mockRejectedValue(new Error('Find failed'));

        await expect(
          updateScopeItem({ projectId, id: scopeItemId, userId, description: 'Update' }),
        ).rejects.toThrow('Find failed');
      });

      it('handles case when findUnique returns null after successful update', async () => {
        mockPrisma.project.findFirst.mockResolvedValue(mockProject);
        mockPrisma.scopeItem.updateMany.mockResolvedValue({ count: 1 });
        mockPrisma.scopeItem.findUnique.mockResolvedValue(null);

        const result = await updateScopeItem({
          projectId,
          id: scopeItemId,
          userId,
          description: 'Update',
        });

        expect(result).toBeNull();
      });
    });
  });
  