export interface ICategoryItemDto {
  id: number;
  name: string;
}

export interface ICategoriesListResponseDto {
  items: ICategoryItemDto[];
  canEdit: boolean;
}
