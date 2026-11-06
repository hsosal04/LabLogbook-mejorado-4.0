import re
from django.contrib.auth import authenticate, password_validation
from django.contrib.auth.tokens import default_token_generator
from django.core.validators import EmailValidator
from django.db.models import Q
from django.utils.encoding import force_bytes, force_str
from django.utils.http import urlsafe_base64_decode, urlsafe_base64_encode
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from .models import User

USERNAME_RE = re.compile(r'^[A-Za-z0-9._-]{3,30}$')
NAME_RE = re.compile(r"^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ' -]+$")
DEPARTMENT_RE = re.compile(r'^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ0-9().,&/ -]*$')
STUDENT_CODE_RE = re.compile(r'^\d{9}$')
PHONE_RE = re.compile(r'^\d{10}$')
email_validator = EmailValidator()


def evaluate_password_strength(password: str, user: User | None = None) -> str:
    score = 0
    if len(password) >= 8:
        score += 1
    if re.search(r'[A-Z]', password):
        score += 1
    if re.search(r'[a-z]', password):
        score += 1
    if re.search(r'\d', password):
        score += 1
    if re.search(r'[^A-Za-z0-9]', password):
        score += 1
    if user and user.student_code and user.student_code not in password:
        score += 1
    if score <= 2:
        return 'DEBIL'
    if score <= 4:
        return 'MEDIA'
    return 'ALTA'


class BaseUserValidationMixin:
    def _validate_optional_name(self, value: str, field_label: str) -> str:
        value = (value or '').strip()
        if not value:
            return value
        if not NAME_RE.fullmatch(value):
            raise serializers.ValidationError(f'{field_label} solo puede contener letras, espacios, apóstrofes y guiones.')
        return value

    def _validate_username(self, value: str) -> str:
        value = (value or '').strip()
        if not USERNAME_RE.fullmatch(value):
            raise serializers.ValidationError(
                'El usuario solo puede contener letras, números, puntos, guiones y guion bajo, con una longitud de 3 a 30 caracteres.'
            )
        return value

    def _validate_department(self, value: str) -> str:
        value = (value or '').strip()
        if value and not DEPARTMENT_RE.fullmatch(value):
            raise serializers.ValidationError('El departamento contiene caracteres no permitidos.')
        return value

    def _validate_student_code(self, value: str) -> str:
        value = (value or '').strip()
        if not STUDENT_CODE_RE.fullmatch(value):
            raise serializers.ValidationError('La matrícula debe contener exactamente 9 dígitos numéricos.')
        return value

    def _validate_phone(self, value: str) -> str:
        value = (value or '').strip()
        if value and not PHONE_RE.fullmatch(value):
            raise serializers.ValidationError('El teléfono debe contener exactamente 10 dígitos numéricos.')
        return value

    def _validate_email_field(self, value: str | None, field_label: str) -> str | None:
        if value in {None, ''}:
            return None if value is None else ''
        value = value.strip().lower()
        try:
            email_validator(value)
        except Exception as exc:
            raise serializers.ValidationError(f'{field_label} no es válido.') from exc
        return value

    def _validate_distinct_emails(self, attrs: dict) -> dict:
        instance = getattr(self, 'instance', None)
        institutional_email = attrs.get('institutional_email', getattr(instance, 'institutional_email', '') or '')
        alternate_email = attrs.get('alternate_email', getattr(instance, 'alternate_email', '') or '')

        normalized = [value for value in [institutional_email, alternate_email] if value]
        if len(normalized) != len(set(normalized)):
            raise serializers.ValidationError('Los correos capturados no deben repetirse entre sí.')

        for field_name, value in [('institutional_email', institutional_email), ('alternate_email', alternate_email)]:
            if not value:
                continue
            query = Q(institutional_email=value) | Q(alternate_email=value) | Q(email=value)
            duplicates = User.objects.filter(query)
            if instance:
                duplicates = duplicates.exclude(pk=instance.pk)
            if duplicates.exists():
                raise serializers.ValidationError({field_name: 'Ese correo ya se encuentra registrado en otra cuenta.'})

        return attrs

    def validate_first_name(self, value: str) -> str:
        return self._validate_optional_name(value, 'El nombre')

    def validate_last_name(self, value: str) -> str:
        return self._validate_optional_name(value, 'Los apellidos')

    def validate_department(self, value: str) -> str:
        return self._validate_department(value)

    def validate_student_code(self, value: str) -> str:
        return self._validate_student_code(value)

    def validate_institutional_email(self, value: str) -> str:
        validated = self._validate_email_field(value, 'El correo institucional')
        return validated or ''

    def validate_alternate_email(self, value: str | None) -> str | None:
        return self._validate_email_field(value, 'El correo alterno')

    def validate_phone(self, value: str) -> str:
        return self._validate_phone(value)

    def validate(self, attrs: dict) -> dict:
        return self._validate_distinct_emails(attrs)


class UserSerializer(serializers.ModelSerializer):
    password_strength = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            'id', 'username', 'first_name', 'last_name', 'institutional_email',
            'alternate_email', 'student_code', 'department', 'phone', 'role', 'status',
            'photo_url', 'password_strength'
        ]
        read_only_fields = ['id', 'password_strength']

    def get_password_strength(self, obj):
        return None


class ProfessorOptionSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'first_name', 'last_name', 'student_code', 'role', 'status']


class UserCreateSerializer(BaseUserValidationMixin, serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)
    password_strength = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = User
        fields = [
            'password', 'password_strength', 'first_name', 'last_name', 'institutional_email',
            'alternate_email', 'student_code', 'department', 'phone', 'role', 'status'
        ]
        extra_kwargs = {'status': {'required': False}}

    def get_password_strength(self, obj):
        return None

    def validate_role(self, value: str) -> str:
        value = (value or '').upper()
        allowed_roles = {'SUPERVISOR', 'STUDENT', 'PROFESSOR'}
        if value not in allowed_roles:
            raise serializers.ValidationError('Rol no válido. En el registro solo se permiten los roles Alumno, Supervisor y Profesor.')
        return value

    def validate_password(self, value: str) -> str:
        dummy_user = User(
            username=self.initial_data.get('student_code', ''),
            student_code=self.initial_data.get('student_code', ''),
            first_name=self.initial_data.get('first_name', ''),
            last_name=self.initial_data.get('last_name', ''),
            institutional_email=self.initial_data.get('institutional_email', ''),
        )
        password_validation.validate_password(value, dummy_user)
        if evaluate_password_strength(value, dummy_user) == 'DEBIL':
            raise serializers.ValidationError(
                'La contraseña es débil. Debe incluir mayúsculas, minúsculas, números y símbolos.'
            )
        return value

    def validate(self, attrs: dict) -> dict:
        attrs = super().validate(attrs)
        student_code = (attrs.get('student_code') or '').strip()
        duplicate_username = User.objects.filter(username__iexact=student_code)
        if self.instance:
            duplicate_username = duplicate_username.exclude(pk=self.instance.pk)
        if duplicate_username.exists():
            raise serializers.ValidationError({'student_code': 'La matrícula ya está asignada como usuario en otra cuenta.'})
        attrs['username'] = student_code
        attrs['email'] = attrs.get('alternate_email') or attrs.get('institutional_email')
        return attrs

    def create(self, validated_data):
        password = validated_data.pop('password')
        user = User(**validated_data)
        user.set_password(password)
        user.is_active = validated_data.get('status', User.Status.ACTIVE) == User.Status.ACTIVE
        user.save()
        return user


class ProfileUpdateSerializer(BaseUserValidationMixin, serializers.ModelSerializer):
    class Meta:
        model = User
        fields = [
            'first_name', 'last_name', 'student_code', 'institutional_email',
            'alternate_email', 'department', 'phone', 'photo_url'
        ]

    def validate(self, attrs: dict) -> dict:
        attrs = super().validate(attrs)
        instance = getattr(self, 'instance', None)
        student_code = (attrs.get('student_code', getattr(instance, 'student_code', '') or '') or '').strip()

        duplicate_student_code = User.objects.filter(student_code__iexact=student_code)
        duplicate_username = User.objects.filter(username__iexact=student_code)
        if instance:
            duplicate_student_code = duplicate_student_code.exclude(pk=instance.pk)
            duplicate_username = duplicate_username.exclude(pk=instance.pk)

        if duplicate_student_code.exists() or duplicate_username.exists():
            raise serializers.ValidationError({'student_code': 'La matrícula ya se encuentra registrada en otra cuenta.'})

        return attrs

    def update(self, instance, validated_data):
        updated = super().update(instance, validated_data)
        updated.username = updated.student_code
        updated.email = updated.alternate_email or updated.institutional_email
        updated.save(update_fields=['username', 'email'])
        return updated


class AdminUserUpdateSerializer(BaseUserValidationMixin, serializers.ModelSerializer):
    def validate_role(self, value: str) -> str:
        value = (value or '').upper()
        if value not in {'SUPERVISOR', 'STUDENT', 'PROFESSOR'}:
            raise serializers.ValidationError('Rol no válido. Desde la aplicación solo se muestran Alumno, Supervisor y Profesor.')
        return value

    def validate(self, attrs: dict) -> dict:
        instance = getattr(self, 'instance', None)
        requested_role = (attrs.get('role') or getattr(instance, 'role', '') or '').upper()
        if instance and instance.role == User.Role.ADMIN:
            # La cuenta administradora conserva su rol; no debe editarse desde el módulo de usuarios.
            attrs['role'] = User.Role.ADMIN
        elif requested_role == User.Role.ADMIN:
            raise serializers.ValidationError({'role': 'No se puede asignar el rol Administrador desde la aplicación.'})
        return super().validate(attrs)

    class Meta:
        model = User
        fields = [
            'first_name', 'last_name', 'institutional_email', 'alternate_email',
            'student_code', 'department', 'phone', 'role', 'status', 'photo_url'
        ]

    def update(self, instance, validated_data):
        updated = super().update(instance, validated_data)
        updated.username = updated.student_code
        updated.email = updated.alternate_email or updated.institutional_email
        updated.is_active = updated.status == User.Status.ACTIVE
        updated.save(update_fields=['username', 'email', 'is_active'])
        return updated


class PasswordStrengthSerializer(serializers.Serializer):
    password = serializers.CharField(required=True)

    def validate(self, attrs):
        user = self.context.get('user')
        attrs['strength'] = evaluate_password_strength(attrs['password'], user)
        return attrs


class ChangePasswordSerializer(serializers.Serializer):
    current_password = serializers.CharField(required=True)
    new_password = serializers.CharField(required=True)
    confirm_password = serializers.CharField(required=True)

    def validate(self, attrs):
        user = self.context['request'].user
        if not user.check_password(attrs['current_password']):
            raise serializers.ValidationError({'current_password': 'La contraseña actual no es correcta.'})
        if attrs['new_password'] != attrs['confirm_password']:
            raise serializers.ValidationError({'confirm_password': 'La confirmación de la nueva contraseña no coincide.'})
        password_validation.validate_password(attrs['new_password'], user)
        if evaluate_password_strength(attrs['new_password'], user) == 'DEBIL':
            raise serializers.ValidationError({'new_password': 'La nueva contraseña es débil.'})
        return attrs


class ForgotPasswordSerializer(serializers.Serializer):
    identifier = serializers.CharField(required=True)

    def validate(self, attrs):
        identifier = (attrs['identifier'] or '').strip().lower()
        attrs['user'] = User.objects.filter(
            Q(username__iexact=identifier)
            | Q(student_code=identifier)
            | Q(institutional_email__iexact=identifier)
            | Q(alternate_email__iexact=identifier)
            | Q(email__iexact=identifier)
        ).first()
        return attrs


class ResetPasswordSerializer(serializers.Serializer):
    uid = serializers.CharField(required=True)
    token = serializers.CharField(required=True)
    new_password = serializers.CharField(required=True)
    confirm_password = serializers.CharField(required=True)

    def validate(self, attrs):
        try:
            uid = force_str(urlsafe_base64_decode(attrs['uid']))
            user = User.objects.get(pk=uid)
        except Exception as exc:
            raise serializers.ValidationError({'uid': 'El identificador de recuperación no es válido.'}) from exc

        if not default_token_generator.check_token(user, attrs['token']):
            raise serializers.ValidationError({'token': 'El token de recuperación no es válido o ya expiró.'})
        if attrs['new_password'] != attrs['confirm_password']:
            raise serializers.ValidationError({'confirm_password': 'La confirmación de la nueva contraseña no coincide.'})
        password_validation.validate_password(attrs['new_password'], user)
        if evaluate_password_strength(attrs['new_password'], user) == 'DEBIL':
            raise serializers.ValidationError({'new_password': 'La nueva contraseña es débil.'})
        attrs['user'] = user
        return attrs


class PasswordResetTokenSerializer(serializers.Serializer):
    uid = serializers.CharField(read_only=True)
    token = serializers.CharField(read_only=True)

    @staticmethod
    def build_for_user(user: User) -> dict:
        return {
            'uid': urlsafe_base64_encode(force_bytes(user.pk)),
            'token': default_token_generator.make_token(user),
        }


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    default_error_messages = {
        'no_active_account': 'No se encontró una cuenta activa con las credenciales proporcionadas.',
    }

    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token['role'] = user.role
        token['institutional_email'] = user.institutional_email
        token['full_name'] = user.get_full_name() or user.username
        return token

    def validate(self, attrs):
        identifier = (attrs.get('username') or '').strip()
        password = attrs.get('password') or ''

        if not identifier or not password:
            raise serializers.ValidationError({'detail': 'Debe capturar correo o matrícula, además de la contraseña.'})

        query = (
            Q(username__iexact=identifier)
            | Q(email__iexact=identifier)
            | Q(institutional_email__iexact=identifier)
            | Q(alternate_email__iexact=identifier)
            | Q(student_code=identifier)
        )
        candidate = User.objects.filter(query).first()
        if not candidate:
            raise serializers.ValidationError({'detail': 'No existe una cuenta asociada con el correo o la matrícula proporcionados.'})

        authenticated_user = authenticate(
            request=self.context.get('request'),
            username=candidate.username,
            password=password,
        )
        if not authenticated_user:
            raise serializers.ValidationError({'detail': 'Las credenciales proporcionadas no son válidas.'})
        if authenticated_user.status != User.Status.ACTIVE or not authenticated_user.is_active:
            raise serializers.ValidationError({'detail': 'La cuenta se encuentra inactiva. Contacte al administrador.'})

        refresh = self.get_token(authenticated_user)
        self.user = authenticated_user
        return {
            'refresh': str(refresh),
            'access': str(refresh.access_token),
            'user': UserSerializer(authenticated_user).data,
        }
