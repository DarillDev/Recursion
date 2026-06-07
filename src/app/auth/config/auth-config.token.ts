import { InjectionToken } from '@angular/core';
import type { IAuthConfig } from '../interfaces/auth-config.interface';

export const AUTH_CONFIG = new InjectionToken<IAuthConfig>('AUTH_CONFIG');
