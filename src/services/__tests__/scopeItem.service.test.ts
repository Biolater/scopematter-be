// services/__tests__/scopeItem.service.test.ts
import {
    createScopeItem,
    getScopeItems,
    deleteScopeItem,
    updateScopeItem,
  } from '../scopeItem.service';
  import { mockPrisma } from '../../__tests__/setup';
  import { ServiceError } from '../../utils/service-error';
  import { ServiceErrorCodes } from '../../utils/service-error-codes';
  
  describe('scopeItem.service', () => {
    const projectId = 'proj_123';
    const userId = 'user_456';
    const scopeItemId = 'item_789';
    const now = new Date();
  
    beforeEach(() => {
      jest.clearAllMocks();
      mockPrisma.$transaction.mockImplementation((cb: (...args: any[]) => any) => cb(mockPrisma));
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
  
        mockPrisma.project.findFirst.mockResolvedValue({ id: projectId, userId });
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
  
        mockPrisma.project.findFirst.mockResolvedValue({ id: projectId, userId });
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
  
      it('returns empty list when no items exist', async () => {
        mockPrisma.project.findFirst.mockResolvedValue({ id: projectId, userId });
        mockPrisma.scopeItem.findMany.mockResolvedValue([]);
  
        const result = await getScopeItems({ projectId, userId });
  
        expect(Array.isArray(result)).toBe(true);
        expect(result).toHaveLength(0);
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
    });
  
    // ---------------------------
    // deleteScopeItem
    // ---------------------------
    describe('deleteScopeItem', () => {
      it('deletes item scoped to the project and returns minimal payload', async () => {
        mockPrisma.project.findFirst.mockResolvedValue({ id: projectId, userId });
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
  
      it('throws SCOPE_ITEM_NOT_FOUND when item does not belong to project or missing', async () => {
        mockPrisma.project.findFirst.mockResolvedValue({ id: projectId, userId });
        mockPrisma.scopeItem.deleteMany.mockResolvedValue({ count: 0 });
  
        await expect(
          deleteScopeItem({ projectId, id: scopeItemId, userId }),
        ).rejects.toThrow(ServiceError);
  
        await expect(
          deleteScopeItem({ projectId, id: scopeItemId, userId }),
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
  
        mockPrisma.project.findFirst.mockResolvedValue({ id: projectId, userId });
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
  
      it('throws SCOPE_ITEM_NOT_FOUND when update count is 0', async () => {
        mockPrisma.project.findFirst.mockResolvedValue({ id: projectId, userId });
        mockPrisma.scopeItem.updateMany.mockResolvedValue({ count: 0 });
  
        await expect(
          updateScopeItem({ projectId, id: scopeItemId, userId, description: 'No-op' }),
        ).rejects.toThrow(ServiceError);
  
        await expect(
          updateScopeItem({ projectId, id: scopeItemId, userId, description: 'No-op' }),
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
    });
  });
  