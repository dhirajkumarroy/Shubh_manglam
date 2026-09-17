import { Router } from 'express';
import { CategoryController } from './category.controller';

const router = Router();
const controller = new CategoryController();

// Public / Provider active categories
router.get('/', controller.listCategories);
router.get('/:id', controller.getCategory);

export default router;
