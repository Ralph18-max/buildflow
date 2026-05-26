import { Injectable, signal } from '@angular/core';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id:      number;
  message: string;
  type:    ToastType;
}

@Injectable({ providedIn: 'root' })
export class ToastService {

  private _toasts = signal<Toast[]>([]);
  readonly toasts  = this._toasts.asReadonly();
  private _nextId  = 0;

  success(message: string)              { this._add(message, 'success', 4000); }
  error(message: string)                { this._add(message, 'error',   6000); }
  warning(message: string)              { this._add(message, 'warning', 5000); }
  info(message: string)                 { this._add(message, 'info',    4000); }

  dismiss(id: number): void {
    this._toasts.update(list => list.filter(t => t.id !== id));
  }

  private _add(message: string, type: ToastType, duration: number): void {
    const id = ++this._nextId;
    this._toasts.update(list => [...list, { id, message, type }]);
    setTimeout(() => this.dismiss(id), duration);
  }
}
