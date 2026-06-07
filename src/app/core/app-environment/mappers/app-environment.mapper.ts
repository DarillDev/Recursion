import { IAppEnvironment } from '../interfaces/app-environment.interface';
import { AppEnvironment } from '../models/app-environment';

export class AppEnvironmentMapper {
  public static fromDto<T extends IAppEnvironment>(dto: Partial<T>): AppEnvironment {
    if (!dto.apiUrl) {
      throw new Error('environment.json does NOT have - apiUrl');
    }

    if (!dto.authUrl) {
      throw new Error('environment.json does NOT have - authUrl');
    }

    if (!dto.title) {
      throw new Error('environment.json does NOT have - title');
    }

    return new AppEnvironment(dto as IAppEnvironment);
  }
}
