import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivateFn, Router } from '@angular/router';

export const roleGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const router = inject(Router);
  const userRaw = localStorage.getItem('user');
  if (!userRaw) {
    router.navigate(['/login']);
    return false;
  }
  const user = JSON.parse(userRaw) as { role: string };
  const roles = (route.data['roles'] || []) as string[];
  if (!roles.includes(user.role)) {
    router.navigate(['/app/dashboard']);
    return false;
  }
  return true;
};
