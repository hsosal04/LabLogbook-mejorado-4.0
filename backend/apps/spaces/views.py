from rest_framework import permissions, viewsets
from apps.users.models import User
from apps.users.permissions import IsAdministrator, IsAdministratorOrSupervisor
from .models import Classroom, ClassSchedule, Laboratory, SupervisorAssignment
from .serializers import ClassroomSerializer, ClassScheduleSerializer, LaboratorySerializer, SupervisorAssignmentSerializer


class LaboratoryViewSet(viewsets.ModelViewSet):
    queryset = Laboratory.objects.all().order_by('code')
    serializer_class = LaboratorySerializer

    def get_permissions(self):
        if self.action in {'list', 'retrieve'}:
            return [permissions.IsAuthenticated()]
        return [IsAdministrator()]

    def get_queryset(self):
        user = self.request.user
        if user.role == User.Role.SUPERVISOR:
            return Laboratory.objects.filter(supervisor_assignments__supervisor=user).distinct().order_by('code')
        return super().get_queryset()


class ClassroomViewSet(viewsets.ModelViewSet):
    queryset = Classroom.objects.all().order_by('code')
    serializer_class = ClassroomSerializer

    def get_permissions(self):
        if self.action in {'list', 'retrieve'}:
            return [permissions.IsAuthenticated()]
        return [IsAdministrator()]


class SupervisorAssignmentViewSet(viewsets.ModelViewSet):
    queryset = SupervisorAssignment.objects.select_related('supervisor', 'laboratory').all()
    serializer_class = SupervisorAssignmentSerializer
    permission_classes = [IsAdministrator]


class ClassScheduleViewSet(viewsets.ModelViewSet):
    queryset = ClassSchedule.objects.select_related('classroom').all()
    serializer_class = ClassScheduleSerializer

    def get_permissions(self):
        if self.action in {'list', 'retrieve'}:
            return [permissions.IsAuthenticated()]
        return [IsAdministratorOrSupervisor()]

    def get_queryset(self):
        queryset = super().get_queryset()
        classroom = self.request.query_params.get('classroom')
        period = self.request.query_params.get('period')
        if classroom:
            queryset = queryset.filter(classroom_id=classroom)
        if period:
            queryset = queryset.filter(academic_period=period)
        return queryset
