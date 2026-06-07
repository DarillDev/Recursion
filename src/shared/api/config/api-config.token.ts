import { InjectionToken } from '@angular/core';
import type { IApiConfig } from './api-config.interface';

export const API_CONFIG = new InjectionToken<IApiConfig>('api config');
