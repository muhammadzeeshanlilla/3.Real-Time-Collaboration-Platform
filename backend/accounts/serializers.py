from django.contrib.auth.models import User
from rest_framework import serializers


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=6)
    confirm_password = serializers.CharField(write_only=True, min_length=6)

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'password', 'confirm_password']

    def validate(self, data):
        """
        This function checks password and confirm_password.
        """
        if data['password'] != data['confirm_password']:
            raise serializers.ValidationError({
                "confirm_password": "Password and confirm password do not match."
            })

        if User.objects.filter(email=data['email']).exists():
            raise serializers.ValidationError({
                "email": "User with this email already exists."
            })

        return data

    def create(self, validated_data):
        """
        This function creates a new user.
        """
        validated_data.pop('confirm_password')

        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password']
        )

        return user


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email']