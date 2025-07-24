from rest_framework import serializers
from django.contrib.auth.hashers import make_password
from .models import Student, Teacher, Notice, Vote, Course, Chapter, Assignment, Attendance, LostAndFound, VoteResult, StudentAssignmentSubmission

class StudentSerializer(serializers.ModelSerializer):
    rollNo = serializers.CharField(source='roll_no')
    firstName = serializers.CharField(source='first_name')
    lastName = serializers.CharField(source='last_name')
    confirmPassword = serializers.CharField(write_only=True)
    profile_picture = serializers.ImageField(required=False)  # 👈 new field

    class Meta:
        model = Student
        fields = [
            'id', 'rollNo', 'firstName', 'lastName', 'email',
            'phone', 'address', 'faculty', 'password', 'confirmPassword', 'profile_picture'
        ]

    def validate(self, data):
        if data['password'] != data['confirmPassword']:
            raise serializers.ValidationError("Passwords do not match")
        return data

    def create(self, validated_data):
        validated_data.pop('confirmPassword') # removing extra
        validated_data['password'] = make_password(validated_data['password']) #hashing password
        return Student.objects.create(**validated_data)


class TeacherSerializer(serializers.ModelSerializer):
    firstName = serializers.CharField(source='first_name')
    lastName = serializers.CharField(source='last_name')
    confirmPassword = serializers.CharField(write_only=True)

    class Meta:
        model = Teacher
        fields = [
            'id', 'firstName', 'lastName', 'email',
            'phone', 'address', 'password', 'confirmPassword'
        ]

    def validate(self, data):
        if data['password'] != data['confirmPassword']:
            raise serializers.ValidationError("Passwords do not match")
        return data

    def create(self, validated_data):
        validated_data.pop('confirmPassword')  # Remove confirmPassword before saving
        validated_data['password'] = make_password(validated_data['password'])  # Hash password
        return Teacher.objects.create(**validated_data)

class CourseSerializer(serializers.ModelSerializer):
    class Meta:
        model = Course
        fields = ['id', 'name', 'description', 'attendance_key', 'created_at']

class VoteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Vote
        fields = ['id', 'title', 'option1', 'option2', 'option3', 'option4', 'created_at']

class NoticeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notice
        fields = ['id', 'content', 'created_at']

class ChapterSerializer(serializers.ModelSerializer):
    class Meta:
        model = Chapter
        fields = ['id', 'course', 'title', 'file']

class AssignmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Assignment
        fields = ['id', 'course', 'title', 'description', 'file']

class AttendanceSerializer(serializers.ModelSerializer):
    student = StudentSerializer()
    course_name = serializers.CharField(source='course.name', read_only=True)

    class Meta:
        model = Attendance
        fields = ['id', 'student', 'course_name', 'date', 'status']

class CourseWithContentSerializer(serializers.ModelSerializer):
    chapters = ChapterSerializer(many=True, read_only=True)
    assignments = AssignmentSerializer(many=True, read_only=True)

    class Meta:
        model = Course
        fields = ['id', 'name', 'description', 'chapters', 'assignments']

class LostAndFoundSerializer(serializers.ModelSerializer):
    class Meta:
        model = LostAndFound
        fields = '__all__'

class VoteResultSerializer(serializers.ModelSerializer):
    class Meta:
        model = VoteResult
        fields = '__all__'

class StudentAssignmentSubmissionSerializer(serializers.ModelSerializer):
    course_name = serializers.CharField(source='assignment.course.name', read_only=True)
    class Meta:
        model = StudentAssignmentSubmission
        fields = ['id', 'assignment', 'student', 'file', 'submitted_at', 'course_name']
