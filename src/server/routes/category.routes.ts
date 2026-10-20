/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Router } from 'express';
import { dataStore } from '../storage/dataStore.ts';
import { requireAuth, requireRole } from '../middleware/auth.middleware.ts';
import { CategorySchema } from '../validators/schemas.ts';

export const categoryRouter = Router();

// GET /api/categories (Any authenticated user can list active categories)
categoryRouter.get('/', requireAuth, async (req, res) => {
  try {
    const categories = await dataStore.getAllCategories();
    res.json(categories);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// POST /api/categories (ADMIN only)
categoryRouter.post('/', requireAuth, requireRole('ADMIN'), async (req, res) => {
  try {
    const parsed = CategorySchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.issues[0].message });
    }

    const newCategory = await dataStore.createCategory({
      name: parsed.data.name,
      description: parsed.data.description,
      color: parsed.data.color || '#2563eb',
      active: parsed.data.active ?? true,
      createdBy: req.user!.id,
    });

    await dataStore.createAuditLog({
      actor: { id: req.user!.id, name: req.user!.name, email: req.user!.email, role: req.user!.role },
      action: 'CATEGORY_CREATED',
      targetType: 'CATEGORY',
      targetId: newCategory.id,
      targetName: newCategory.name,
      ip: req.ip,
    });

    res.status(201).json(newCategory);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// PATCH /api/categories/:id (ADMIN only)
categoryRouter.patch('/:id', requireAuth, requireRole('ADMIN'), async (req, res) => {
  try {
    const parsed = CategorySchema.partial().safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.issues[0].message });
    }

    const updated = await dataStore.updateCategory(req.params.id, parsed.data);
    if (!updated) {
      return res.status(404).json({ error: 'Category not found.' });
    }

    await dataStore.createAuditLog({
      actor: { id: req.user!.id, name: req.user!.name, email: req.user!.email, role: req.user!.role },
      action: 'CATEGORY_UPDATED',
      targetType: 'CATEGORY',
      targetId: updated.id,
      targetName: updated.name,
      ip: req.ip,
    });

    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// DELETE /api/categories/:id (ADMIN only)
categoryRouter.delete('/:id', requireAuth, requireRole('ADMIN'), async (req, res) => {
  try {
    const category = await dataStore.findCategoryById(req.params.id);
    if (!category) return res.status(404).json({ error: 'Category not found.' });

    await dataStore.deleteCategory(req.params.id);

    await dataStore.createAuditLog({
      actor: { id: req.user!.id, name: req.user!.name, email: req.user!.email, role: req.user!.role },
      action: 'CATEGORY_DELETED',
      targetType: 'CATEGORY',
      targetId: req.params.id,
      targetName: category.name,
      ip: req.ip,
    });

    res.json({ message: 'Category removed successfully.' });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});
