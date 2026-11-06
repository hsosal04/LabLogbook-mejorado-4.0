from rest_framework.permissions import BasePermission
from .models import User


class IsAdministrator(BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role == User.Role.ADMIN)


class IsAdministratorOrSupervisor(BasePermission):
    def has_permission(self, request, view):
        return bool(
            request.user and request.user.is_authenticated and request.user.role in {User.Role.ADMIN, User.Role.SUPERVISOR}
        )
