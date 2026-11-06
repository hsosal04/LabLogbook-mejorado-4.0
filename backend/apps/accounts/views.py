from django.conf import settings
from django.contrib.auth.tokens import default_token_generator
from django.core.mail import send_mail
from django.db.models import Q
from django.urls import reverse
from rest_framework import generics, permissions, status, viewsets
from rest_framework.exceptions import PermissionDenied
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from apps.common.permissions import IsAdminRole
from .models import User
from .fcc_professors import PROFESSOR_NAMES
from .serializers import (
    AdminUserUpdateSerializer,
    ChangePasswordSerializer,
    CustomTokenObtainPairSerializer,
    ForgotPasswordSerializer,
    PasswordResetTokenSerializer,
    PasswordStrengthSerializer,
    ProfileUpdateSerializer,
    ProfessorOptionSerializer,
    ResetPasswordSerializer,
    UserCreateSerializer,
    UserSerializer,
)


class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = UserCreateSerializer
    permission_classes = [permissions.AllowAny]

    def perform_create(self, serializer):
        # El administrador se reserva para Django Admin y para la gestión interna del sistema.
        # En el registro público solo se permiten Alumno, Supervisor y Profesor.
        serializer.save()


class LoginView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer


class RefreshView(TokenRefreshView):
    permission_classes = [permissions.AllowAny]


class MeView(APIView):
    def get(self, request):
        return Response(UserSerializer(request.user).data)

    def patch(self, request):
        serializer = ProfileUpdateSerializer(instance=request.user, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(UserSerializer(request.user).data)


class ChangePasswordView(APIView):
    def post(self, request):
        serializer = ChangePasswordSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        user = request.user
        user.set_password(serializer.validated_data['new_password'])
        user.save(update_fields=['password'])
        return Response({'detail': 'La contraseña se actualizó correctamente.'})


class PasswordStrengthView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = PasswordStrengthSerializer(data=request.data, context={'user': request.user if request.user.is_authenticated else None})
        serializer.is_valid(raise_exception=True)
        return Response({'strength': serializer.validated_data['strength']})


class ForgotPasswordView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = ForgotPasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data.get('user')
        if user:
            token_data = PasswordResetTokenSerializer.build_for_user(user)
            reset_link = request.build_absolute_uri(
                f"/reset-password?uid={token_data['uid']}&token={token_data['token']}"
            )
            send_mail(
                subject='Recuperación de contraseña - LabLogbook',
                message=(
                    f'Hola {user.get_full_name() or user.username}.\n\n'
                    f'Para recuperar su contraseña utilice el siguiente enlace:\n{reset_link}\n\n'
                    f'Si no solicitó este cambio, ignore este mensaje.'
                ),
                from_email=getattr(settings, 'DEFAULT_FROM_EMAIL', 'noreply@lablogbook.local'),
                recipient_list=[user.alternate_email or user.institutional_email],
                fail_silently=True,
            )
            return Response({
                'detail': 'Si la cuenta existe, se envió un correo de recuperación.',
                'debug_reset': token_data,
            })
        return Response({'detail': 'Si la cuenta existe, se envió un correo de recuperación.'})


class ResetPasswordView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = ResetPasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data['user']
        user.set_password(serializer.validated_data['new_password'])
        user.save(update_fields=['password'])
        return Response({'detail': 'La contraseña se restableció correctamente.'})


class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all().order_by('id')
    serializer_class = UserSerializer

    def get_permissions(self):
        if self.action in {'list', 'retrieve', 'professors'}:
            return [permissions.IsAuthenticated()]
        return [IsAdminRole()]

    def get_queryset(self):
        user = self.request.user
        qs = User.objects.all().order_by('first_name', 'last_name', 'username')
        visible_roles = ['STUDENT', 'PROFESSOR', 'SUPERVISOR']
        if user.role == 'ADMIN':
            # El administrador puede gestionar cuentas operativas, pero no se muestra como opción/registro operativo.
            base_qs = qs.filter(role__in=visible_roles)
        elif user.role == 'SUPERVISOR':
            base_qs = qs.filter(role__in=visible_roles)
        else:
            return qs.none()

        search = (self.request.query_params.get('search') or '').strip()
        role = (self.request.query_params.get('role') or '').strip().upper()
        status_value = (self.request.query_params.get('status') or '').strip().upper()

        if search:
            base_qs = base_qs.filter(
                Q(first_name__icontains=search)
                | Q(last_name__icontains=search)
                | Q(username__icontains=search)
                | Q(student_code__icontains=search)
                | Q(institutional_email__icontains=search)
                | Q(alternate_email__icontains=search)
            )
        if role:
            base_qs = base_qs.filter(role=role)
        if status_value:
            base_qs = base_qs.filter(status=status_value)
        return base_qs

    def get_serializer_class(self):
        if self.action == 'create':
            return UserCreateSerializer
        if self.action in {'update', 'partial_update'}:
            return AdminUserUpdateSerializer
        return UserSerializer

    @action(detail=False, methods=['get'])
    def professors(self, request):
        # Catálogo para captura de horarios: incluye nombres institucionales sin correos.
        # Si algún profesor ya registró cuenta, se conserva también, evitando duplicados por nombre.
        registered_professors = User.objects.filter(role='PROFESSOR', status='ACTIVE').order_by('first_name', 'last_name', 'username')

        options = []
        seen_names = set()

        for professor in registered_professors:
            full_name = (professor.get_full_name() or professor.first_name or professor.username).strip()
            normalized = full_name.casefold()
            if normalized in seen_names:
                continue
            seen_names.add(normalized)
            options.append({
                'id': professor.id,
                'first_name': full_name,
                'last_name': '',
                'student_code': professor.student_code,
                'role': 'PROFESSOR',
                'status': professor.status,
            })

        for index, name in enumerate(PROFESSOR_NAMES, start=1):
            full_name = name.strip()
            normalized = full_name.casefold()
            if not full_name or normalized in seen_names:
                continue
            seen_names.add(normalized)
            options.append({
                'id': f'directory-{index}',
                'first_name': full_name,
                'last_name': '',
                'student_code': '',
                'role': 'PROFESSOR',
                'status': 'DIRECTORY',
            })

        options.sort(key=lambda item: item['first_name'].casefold())
        return Response(options)

    @action(detail=True, methods=['patch'])
    def toggle_status(self, request, pk=None):
        user = self.get_object()
        user.status = 'INACTIVE' if user.status == 'ACTIVE' else 'ACTIVE'
        user.is_active = user.status == 'ACTIVE'
        user.save(update_fields=['status', 'is_active'])
        return Response(UserSerializer(user).data)
