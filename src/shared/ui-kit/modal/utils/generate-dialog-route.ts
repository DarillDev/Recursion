import type { ResolveData, Route } from '@angular/router';
import type { Type } from '@angular/core';
import { RoutableDialogComponent } from '../components/routable-dialog/routable-dialog.component';

export function generateDialogRoute(
  component: Type<unknown>,
  path: string,
  resolve?: ResolveData,
): Route {
  return {
    path,
    component: RoutableDialogComponent,
    data: { dialog: component },
    resolve: resolve ?? {},
  };
}
