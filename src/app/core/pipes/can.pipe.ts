import { Pipe, PipeTransform, inject } from '@angular/core';
import { PermissionService } from '../services/permission.service';

@Pipe({
  name: 'can',
  standalone: true,
  pure: true  // le rôle est fixé à la connexion et ne change pas en cours de session
})
export class CanPipe implements PipeTransform {
  private permService = inject(PermissionService);

  transform(permission: string): boolean {
    return this.permService.can(permission);
  }
}