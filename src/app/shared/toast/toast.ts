import { Component } from '@angular/core';
import { NgFor, NgClass } from '@angular/common';
import { ToastService, Toast } from '../../core/services/toast.service';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [NgFor, NgClass],
  templateUrl: './toast.html',
  styleUrl:    './toast.scss',
})
export class ToastComponent {
  constructor(public toast: ToastService) {}

  icon(type: Toast['type']): string {
    return { success: 'check_circle', error: 'error_outline', warning: 'warning_amber', info: 'info' }[type];
  }
}
