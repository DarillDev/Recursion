export interface INameExistsParams {
  name: string;
  /** id текущей записи, null при создании новой. */
  id?: string | null;
}
