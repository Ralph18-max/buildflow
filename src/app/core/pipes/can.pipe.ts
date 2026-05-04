import { Pipe, PipeTransform, inject } from '@angular/core';
import { PermissionService } from '../services/permission.service';

@Pipe({
  name: 'can',
  standalone: true,
  pure: false  // impure pour réagir aux changements de rôle
})
export class CanPipe implements PipeTransform {
  private permService = inject(PermissionService);

  transform(permission: string): boolean {
    return this.permService.can(permission);
  }
}