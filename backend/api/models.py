from django.db import models
from django.utils import timezone
from datetime import timedelta

FACULTY_CHOICES = [
    ('BEIT', 'BEIT'),
    ('Computer', 'Computer'),
    ('Software', 'Software'),
    ('Civil', 'Civil'),
]

class Student(models.Model):
    roll_no = models.CharField(max_length=20, unique=True)
    first_name = models.CharField(max_length=50)
    last_name = models.CharField(max_length=50)
    email = models.EmailField(unique=True)
    phone = models.CharField(max_length=15)
    address = models.TextField()
    faculty = models.CharField(max_length=20, choices=FACULTY_CHOICES)
    password = models.CharField(max_length=128)
    profile_picture = models.ImageField(upload_to='student_pictures/', null=True, blank=True)  # 👈 new field

    def __str__(self):
        return f"{self.first_name} {self.last_name} ({self.roll_no})"


class Teacher(models.Model):
    id = models.CharField(primary_key=True, max_length=10, editable=False)
    first_name = models.CharField(max_length=50)
    last_name = models.CharField(max_length=50)
    email = models.EmailField(unique=True)
    phone = models.CharField(max_length=15)
    address = models.TextField()
    password = models.CharField(max_length=128)

    def __str__(self):
        return f"{self.first_name} {self.last_name}"
    
    def save(self, *args, **kwargs):
        if not self.id:
            last_teacher = Teacher.objects.filter(id__startswith='t').order_by('-id').first()
            if last_teacher:
                last_id = int(last_teacher.id[1:])
                self.id = f"t{last_id + 1}"
            else:
                self.id = "t1"
        super().save(*args, **kwargs)

class Course(models.Model):
    name = models.CharField(max_length=100)
    description = models.TextField()
    attendance_key = models.CharField(max_length=50)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name


class Vote(models.Model):
    title = models.CharField(max_length=255)
    option1 = models.CharField(max_length=100, blank=True)
    option2 = models.CharField(max_length=100, blank=True)
    option3 = models.CharField(max_length=100, blank=True)
    option4 = models.CharField(max_length=100, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def is_expired(self):
        return timezone.now() > self.created_at + timedelta(days=2)


class Notice(models.Model):
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    def is_expired(self):
        return timezone.now() > self.created_at + timedelta(days=2)
    
class Chapter(models.Model):
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='chapters')
    title = models.CharField(max_length=255)
    file = models.FileField(upload_to='chapters/')

    def __str__(self):
        return f"{self.title} ({self.course.name})"

class Assignment(models.Model):
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='assignments')
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    file = models.FileField(upload_to='assignments/')

    def __str__(self):
        return f"{self.title} ({self.course.name})"
    
class Attendance(models.Model):
    student = models.ForeignKey(Student, on_delete=models.CASCADE)
    course = models.ForeignKey(Course, on_delete=models.CASCADE)
    date = models.DateField(auto_now_add=True)
    status = models.CharField(max_length=20, choices=[('present', 'Present'), ('absent', 'Absent')])

    class Meta:
        unique_together = ('student', 'course', 'date') # Duplicates prevention at DB level

    def __str__(self):
        return f"{self.student} - {self.course} - {self.date} - {self.status}"
    
class LostAndFound(models.Model):
    description = models.TextField()
    found_location = models.CharField(max_length=255)
    retrieving_place = models.CharField(max_length=255)
    photo = models.ImageField(upload_to='lost_items/', null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.description[:50]
    
class VoteResult(models.Model):
    vote = models.ForeignKey(Vote, on_delete=models.CASCADE)
    selected_option = models.CharField(max_length=100)
    user_id = models.CharField(max_length=20)  # You can replace this with ForeignKey to Student/Teacher if needed
    submitted_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Vote {self.vote.id} - Option: {self.selected_option} - User: {self.user_id}"

class StudentAssignmentSubmission(models.Model):
    assignment = models.ForeignKey(Assignment, on_delete=models.CASCADE, related_name='submissions')
    student = models.ForeignKey(Student, on_delete=models.CASCADE)
    file = models.FileField(upload_to='student_submissions/')
    submitted_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('assignment', 'student')  # Prevent duplicate submissions

    def __str__(self):
        return f"{self.student.first_name} - {self.assignment.title}"
    @property
    def course_name(self):
        return self.assignment.course.name