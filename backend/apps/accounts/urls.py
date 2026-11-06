from django.urls import path
from .views import (
    ChangePasswordView,
    ForgotPasswordView,
    LoginView,
    MeView,
    PasswordStrengthView,
    RefreshView,
    RegisterView,
    ResetPasswordView,
)

urlpatterns = [
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', LoginView.as_view(), name='login'),
    path('refresh/', RefreshView.as_view(), name='token_refresh'),
    path('me/', MeView.as_view(), name='me'),
    path('change-password/', ChangePasswordView.as_view(), name='change_password'),
    path('password-strength/', PasswordStrengthView.as_view(), name='password_strength'),
    path('forgot-password/', ForgotPasswordView.as_view(), name='forgot_password'),
    path('reset-password/', ResetPasswordView.as_view(), name='reset_password'),
]
