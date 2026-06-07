import { IAppEnvironment } from '../interfaces/app-environment.interface';

export class AppEnvironment implements IAppEnvironment {
  constructor(private readonly source: IAppEnvironment) {}

  public get apiUrl(): string {
    return this.source.apiUrl;
  }

  public get title(): string {
    return this.source.title;
  }
}
