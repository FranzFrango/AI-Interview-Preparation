from django.contrib import admin
from django.contrib.auth.admin import UserAdmin

from .models import User


@admin.register(User)
class CustomUserAdmin(UserAdmin):
    fieldsets = UserAdmin.fieldsets + (
        (
            'Interview Profile',
            {
                'fields': (
                    'target_role',
                    'experience_level',
                )
            },
        ),
    )

    add_fieldsets = UserAdmin.add_fieldsets + (
        (
            'Interview Profile',
            {
                'fields': (
                    'target_role',
                    'experience_level',
                )
            },
        ),
    )