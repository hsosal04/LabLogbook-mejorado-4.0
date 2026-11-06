from django.db.models import Count, Q, Sum
from rest_framework import permissions, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from apps.users.models import User
from apps.users.permissions import IsAdministrator, IsAdministratorOrSupervisor
from .models import Activity, Attendance, ClassroomUsage
from .serializers import (
    ActivitySerializer,
    AttendanceSerializer,
    ClassroomUsageSerializer,
)


class AttendanceViewSet(viewsets.ModelViewSet):
    queryset = Attendance.objects.select_related('user', 'laboratory', 'created_by').all()
    serializer_class = AttendanceSerializer

    def get_permissions(self):
        if self.action in {'list', 'retrieve'}:
            return [permissions.IsAuthenticated()]
        return [IsAdministratorOrSupervisor()]

    def get_queryset(self):
        queryset = super().get_queryset()
        request = self.request
        if request.user.role == User.Role.STUDENT:
            queryset = queryset.filter(user=request.user)
        elif request.user.role == User.Role.SUPERVISOR:
            queryset = queryset.filter(laboratory__supervisor_assignments__supervisor=request.user).distinct()

        user_id = request.query_params.get('user')
        laboratory_id = request.query_params.get('laboratory')
        status = request.query_params.get('status')
        if user_id:
            queryset = queryset.filter(user_id=user_id)
        if laboratory_id:
            queryset = queryset.filter(laboratory_id=laboratory_id)
        if status:
            queryset = queryset.filter(status=status)
        return queryset

    @action(detail=True, methods=['patch'])
    def close(self, request, pk=None):
        attendance = self.get_object()
        serializer = self.get_serializer(attendance, data={
            'check_out': request.data.get('check_out'),
            'status': Attendance.Status.CLOSED,
            'user': attendance.user.id,
            'laboratory': attendance.laboratory.id,
        }, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)


class ActivityViewSet(viewsets.ModelViewSet):
    queryset = Activity.objects.select_related('laboratory', 'attendance', 'created_by').all()
    serializer_class = ActivitySerializer

    def get_permissions(self):
        if self.action in {'list', 'retrieve'}:
            return [permissions.IsAuthenticated()]
        return [IsAdministratorOrSupervisor()]

    def get_queryset(self):
        queryset = super().get_queryset()
        request = self.request
        if request.user.role == User.Role.SUPERVISOR:
            queryset = queryset.filter(laboratory__supervisor_assignments__supervisor=request.user).distinct()
        if request.user.role == User.Role.STUDENT:
            queryset = queryset.filter(Q(attendance__user=request.user) | Q(created_by=request.user)).distinct()

        laboratory_id = request.query_params.get('laboratory')
        if laboratory_id:
            queryset = queryset.filter(laboratory_id=laboratory_id)
        return queryset


class ClassroomUsageViewSet(viewsets.ModelViewSet):
    queryset = ClassroomUsage.objects.select_related('classroom', 'requested_by').all()
    serializer_class = ClassroomUsageSerializer

    def get_permissions(self):
        if self.action in {'list', 'retrieve', 'create'}:
            return [permissions.IsAuthenticated()]
        return [IsAdministratorOrSupervisor()]

    def get_queryset(self):
        queryset = super().get_queryset()
        request = self.request
        if request.user.role in {User.Role.STUDENT, User.Role.PROFESSOR}:
            queryset = queryset.filter(requested_by=request.user)

        classroom = request.query_params.get('classroom')
        if classroom:
            queryset = queryset.filter(classroom_id=classroom)
        return queryset


class StudentAttendanceReportView(APIView):
    permission_classes = [IsAdministratorOrSupervisor]

    def get(self, request):
        queryset = Attendance.objects.select_related('user', 'laboratory').all()
        student_id = request.query_params.get('user')
        laboratory_id = request.query_params.get('laboratory')
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')

        if student_id:
            queryset = queryset.filter(user_id=student_id)
        if laboratory_id:
            queryset = queryset.filter(laboratory_id=laboratory_id)
        if start_date:
            queryset = queryset.filter(check_in__date__gte=start_date)
        if end_date:
            queryset = queryset.filter(check_in__date__lte=end_date)

        data = AttendanceSerializer(queryset, many=True).data
        return Response(data)


class LaboratoryUtilizationReportView(APIView):
    permission_classes = [IsAdministratorOrSupervisor]

    def get(self, request):
        queryset = Attendance.objects.filter(status=Attendance.Status.CLOSED)
        laboratory_id = request.query_params.get('laboratory')
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')

        if laboratory_id:
            queryset = queryset.filter(laboratory_id=laboratory_id)
        if start_date:
            queryset = queryset.filter(check_in__date__gte=start_date)
        if end_date:
            queryset = queryset.filter(check_in__date__lte=end_date)

        data = queryset.values('laboratory_id', 'laboratory__code').annotate(
            total_sessions=Count('id'),
            total_minutes=Sum('activities__duration_minutes')
        )
        normalized = [
            {
                'laboratory_id': row['laboratory_id'],
                'laboratory_code': row['laboratory__code'],
                'total_sessions': row['total_sessions'],
                'total_minutes': row['total_minutes'] or 0,
            }
            for row in data
        ]
        return Response(normalized)
