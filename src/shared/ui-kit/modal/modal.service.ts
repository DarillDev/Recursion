import { inject, Injectable } from '@angular/core';
import { ComponentType } from '@angular/cdk/overlay';
import { Dialog } from '@angular/cdk/dialog';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ModalService {
  private readonly dialog = inject(Dialog);

  open<TResult, TData = unknown>(
    component: ComponentType<unknown>,
    data?: TData,
  ): Observable<TResult | undefined> {
    return this.dialog.open<TResult>(component, { data }).closed;
  }
}
