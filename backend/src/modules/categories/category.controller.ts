import { Request, Response, NextFunction } from 'express';
import { CategoryService } from './category.service';
import { ResponseDto } from '../../common/dto/api-response.dto';

export class CategoryController {
  private categoryService: CategoryService;

  constructor() {
    this.categoryService = new CategoryService();
  }

  listCategories = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const categories = await this.categoryService.listActiveCategories();
      res.status(200).json(ResponseDto.success('Categories retrieved successfully.', categories));
    } catch (error) {
      next(error);
    }
  };

  getCategory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const category = await this.categoryService.getCategoryById(id);
      res.status(200).json(ResponseDto.success('Category retrieved successfully.', category));
    } catch (error) {
      next(error);
    }
  };
}

export default CategoryController;
