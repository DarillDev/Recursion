import type { ICategory } from './category.interface';

export interface ICategoriesListResult {
  items: ICategory[];
  canAdd: boolean;
}
