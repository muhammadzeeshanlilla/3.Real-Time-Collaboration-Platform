import uuid

from django.contrib.auth.models import User
from django.db import models


class Workspace(models.Model):
    name = models.CharField(max_length=150)
    description = models.TextField(blank=True)
    created_by = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="created_workspaces"
    )
    invite_code = models.CharField(
        max_length=20,
        unique=True,
        editable=False
    )
    created_at = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        if not self.invite_code:
            self.invite_code = str(uuid.uuid4())[:8].upper()

        super().save(*args, **kwargs)

    def __str__(self):
        return self.name


class WorkspaceMember(models.Model):
    ROLE_CHOICES = (
        ("OWNER", "Owner"),
        ("MEMBER", "Member"),
    )

    workspace = models.ForeignKey(
        Workspace,
        on_delete=models.CASCADE,
        related_name="members"
    )
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="workspace_memberships"
    )
    role = models.CharField(
        max_length=20,
        choices=ROLE_CHOICES,
        default="MEMBER"
    )
    joined_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("workspace", "user")

    def __str__(self):
        return f"{self.user.username} - {self.workspace.name}"