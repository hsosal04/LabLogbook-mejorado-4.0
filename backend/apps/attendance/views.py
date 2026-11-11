from django.utils import timezone
from rest_framework import permissions, status, viewsets
from rest_framework.exceptions import PermissionDenied
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Attendance
from .serializers import AttendanceSerializer


class AttendanceViewSet(viewsets.ModelViewSet):
    queryset = Attendance.objects.select_related('user', 'lab', 'created_by').all()
    serializer_class = AttendanceSerializer

    def get_queryset(self):
        user = self.request.user
        qs = self.queryset.order_by('-entry_time')
        if user.role == 'STUDENT':
            return qs.filter(user=user)
        if user.role == 'PROFESSOR':
            return qs.filter(user=user)
        if user.role == 'SUPERVISOR':
            return qs.filter(lab__supervisors=user)
        return qs

    def perform_create(self, serializer):
        request_user = self.request.user
        target_user = serializer.validated_data.get('user')
        lab = serializer.validated_data.get('lab')
        entry_time = serializer.validated_data.get('entry_time', timezone.now())

        if request_user.role in {'STUDENT', 'PROFESSOR'}:
            serializer.save(
                user=request_user,
                created_by=request_user,
                status=Attendance.Status.REGISTERED,
                entry_time=entry_time,
            )
            return

        if request_user.role == 'SUPERVISOR' and not lab.supervisors.filter(id=request_user.id).exists():
            raise PermissionDenied('Solo puede registrar asistencias en laboratorios que tenga asignados.')

        serializer.save(
            user=target_user,
            created_by=request_user,
            status=Attendance.Status.REGISTERED,
            entry_time=entry_time,
        )

    @action(detail=True, methods=['patch'])
    def close(self, request, pk=None):
        attendance = self.get_object()
        if attendance.exit_time or attendance.status == Attendance.Status.CLOSED:
            return Response({'detail': 'El registro de asistencia ya se encuentra cerrado.'}, status=status.HTTP_400_BAD_REQUEST)

        exit_time = request.data.get('exit_time') or timezone.now()
        serializer = self.get_serializer(
        attendance,
        data={'user': attendance.user_id, 'exit_time': exit_time, 'status': Attendance.Status.CLOSED},
        partial=True,
        )
        serializer.is_valid(raise_exception=True)
        serializer.save(status=Attendance.Status.CLOSED)
        return Response(serializer.data)
