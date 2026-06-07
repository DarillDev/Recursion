export type { ICategoriesListResponseDto } from './dtos/categories-list-response-dto.interface';
export type { ICreateCategoryDto } from './dtos/create-category-dto.interface';
export type { IUpdateCategoryDto } from './dtos/update-category-dto.interface';

export type { ICategory } from './interfaces/category.interface';
export type { ICategoriesSearchParams } from './interfaces/categories-search-params.interface';
export type { INameExistsParams } from './interfaces/name-exists-params.interface';

export { CategoriesApiService } from './services/categories-api/categories-api.service';
export { CategoriesService } from './services/categories/categories.service';
