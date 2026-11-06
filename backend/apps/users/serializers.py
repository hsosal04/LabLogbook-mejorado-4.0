from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from .models import User


class UserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=False)

    class Meta:
        model = User
        fields = [
            'id', 'email', 'password', 'username', 'first_name', 'last_name',
            'institutional_email', 'alternate_email', 'student_code', 'role',
            'phone', 'is_active'
        ]
        read_only_fields = ['id']

    def create(self, validated_data):
        password = validated_data.pop('password', None)
        user = User.objects.create_user(password=password, **validated_data)
        return user

    def update(self, instance, validated_data):
        password = validated_data.pop('password', None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        if password:
            instance.set_password(password)
        instance.save()
        return instance


class RegisterSerializer(UserSerializer):
    def validate_role(self, value):
        request = self.context.get('request')
        if value in {User.Role.ADMIN, User.Role.PROFESSOR}:
            if not request or not request.user.is_authenticated or request.user.role != User.Role.ADMIN:
                raise serializers.ValidationError('Solo un administrador puede crear cuentas de administrador o profesor.')
        return value


class ProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = [
            'id', 'email', 'username', 'first_name', 'last_name', 'institutional_email',
            'alternate_email', 'student_code', 'role', 'phone'
        ]
        read_only_fields = ['id', 'email', 'role']


class EmailTokenObtainPairSerializer(TokenObtainPairSerializer):
    username_field = User.EMAIL_FIELD
