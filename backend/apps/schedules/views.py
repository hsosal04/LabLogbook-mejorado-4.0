from rest_framework import permissions, viewsets
from rest_framework.exceptions import PermissionDenied
from .models import ClassScheduleEntry
from .serializers import ClassScheduleEntrySerializer


class ClassScheduleEntryViewSet(viewsets.ModelViewSet):
    queryset = ClassScheduleEntry.objects.select_related('lab', 'created_by', 'updated_by').all()
    serializer_class = ClassScheduleEntrySerializer

    def get_permissions(self):
        if self.action in {'list', 'retrieve'}:
            return [permissions.IsAuthenticated()]
        return [permissions.IsAuthenticated()]

    def get_queryset(self):
        qs = self.queryset.order_by('term', 'lab__code', 'weekday', 'time_slot')
        lab_id = self.request.query_params.get('lab')
        term = self.request.query_params.get('term')
        if lab_id:
            qs = qs.filter(lab_id=lab_id)
        if term:
            qs = qs.filter(term=term)
        return qs

    def _assert_editor_role(self):
        user = self.request.user
        if user.role not in {'ADMIN', 'SUPERVISOR'}:
            raise PermissionDenied('Only administrators and supervisors may modify class schedules.')

    def perform_create(self, serializer):
        self._assert_editor_role()
        serializer.save(created_by=self.request.user, updated_by=self.request.user)

    def perform_update(self, serializer):
        self._assert_editor_role()
        serializer.save(updated_by=self.request.user)

    def perform_destroy(self, instance):
        self._assert_editor_role()
        instance.delete()
