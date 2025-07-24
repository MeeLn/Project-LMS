from rest_framework.decorators import api_view, parser_classes
from rest_framework.response import Response
from rest_framework import status
from .models import Student, Teacher, Notice, Course, Vote, Chapter, Assignment, Attendance, LostAndFound, StudentAssignmentSubmission
from .serializers import StudentAssignmentSubmissionSerializer, StudentSerializer, TeacherSerializer, CourseSerializer, VoteSerializer, NoticeSerializer, ChapterSerializer, AssignmentSerializer, AttendanceSerializer, CourseWithContentSerializer, LostAndFoundSerializer
from rest_framework.parsers import MultiPartParser, FormParser
from django.shortcuts import get_object_or_404
from django.db.models import Count
from django.utils import timezone
from django.http import JsonResponse
from django.db.models import Q


@api_view(['POST', 'GET'])
@parser_classes([MultiPartParser, FormParser])
def register_student(request):
    if request.method == 'POST':
        serializer = StudentSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    elif request.method == 'GET':
        students = Student.objects.all()
        serializer = StudentSerializer(students, many=True)
        return Response(serializer.data)


@api_view(['POST', 'GET'])
def register_teacher(request):
    if request.method == 'POST':
        serializer = TeacherSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    elif request.method == 'GET':
        teachers = Teacher.objects.all()
        serializer = TeacherSerializer(teachers, many=True)
        return Response(serializer.data)

@api_view(['POST'])
def login_user(request):
    print("Login data:", request.data)

    role = request.data.get('role')
    email = request.data.get('email')
    password = request.data.get('password')

    try:
        if role == 'student':
            user = Student.objects.get(email=email)
        elif role == 'teacher':
            user = Teacher.objects.get(email=email)
        elif role == 'admin':
            # Hardcoded credentials
            if email == "admin@admin.com" and password == "admin123":
                return Response({'message': 'Login successful', 'role': 'admin', 'user_id': 0})
            return Response({'error': 'Invalid admin credentials'}, status=401)
        else:
            return Response({'error': 'Invalid role'}, status=400)

        from django.contrib.auth.hashers import check_password
        if check_password(password, user.password):
            return Response({'message': 'Login successful', 'role': role, 'user_id': user.id})
        else:
            return Response({'error': 'Invalid credentials'}, status=401)

    except (Student.DoesNotExist, Teacher.DoesNotExist):
        return Response({'error': 'User not found'}, status=404)

@api_view(['POST'])
def add_course(request):
    serializer = CourseSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save()
        return Response({'message': 'Course added successfully', 'data': serializer.data}, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
def add_vote(request):
    serializer = VoteSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save()
        return Response({'message': 'Vote created successfully', 'data': serializer.data}, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
def add_notice(request):
    serializer = NoticeSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save()
        return Response({'message': 'Notice posted successfully', 'data': serializer.data}, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['DELETE'])
def delete_student(request, student_id):
    try:
        student = Student.objects.get(id=student_id)
        student.delete()
        return Response({'message': 'Student deleted successfully'})
    except Student.DoesNotExist:
        return Response({'error': 'Student not found'}, status=404)

@api_view(['DELETE'])
def delete_teacher(request, teacher_id):
    try:
        teacher = Teacher.objects.get(id=teacher_id)
        teacher.delete()
        return Response({'message': 'Teacher deleted successfully'})
    except Teacher.DoesNotExist:
        return Response({'error': 'Teacher not found'}, status=404)

@api_view(['GET'])
def get_students(request):
    students = Student.objects.all()
    serializer = StudentSerializer(students, many=True)
    return Response(serializer.data)

@api_view(['GET'])
def get_teachers(request):
    teachers = Teacher.objects.all()
    serializer = TeacherSerializer(teachers, many=True)
    return Response(serializer.data)

@api_view(['GET'])
def get_course(request):
    course = Course.objects.all()
    serializer = CourseSerializer(course, many=True)
    return Response(serializer.data)

@api_view(['GET'])
def get_vote(request):
    from datetime import timedelta
    from django.utils import timezone

    # Delete expired votes
    expired_votes = Vote.objects.filter(created_at__lt=timezone.now() - timedelta(days=2))
    expired_votes.delete()

    votes = Vote.objects.all()

    data = []
    for vote in votes:
        results = (
            VoteResult.objects
            .filter(vote=vote)
            .values('selected_option')
            .annotate(count=Count('id'))
        )
        data.append({
            "id": vote.id,
            "title": vote.title,
            "option1": vote.option1,
            "option2": vote.option2,
            "option3": vote.option3,
            "option4": vote.option4,
            "results": list(results),
        })

    return Response(data)


@api_view(['GET'])
def get_notice(request):
    from datetime import timedelta
    from django.utils import timezone

    # Filter expired notices
    notices = Notice.objects.filter(created_at__gte=timezone.now() - timedelta(days=2))
    serializer = NoticeSerializer(notices, many=True)
    return Response(serializer.data)


@api_view(['GET'])
def get_user_profile(request, role, user_id):
    try:
        if role == 'student':
            user = Student.objects.get(id=user_id)
            serializer = StudentSerializer(user)
        elif role == 'teacher':
            user = Teacher.objects.get(id=user_id)
            serializer = TeacherSerializer(user)
        else:
            return Response({'error': 'Invalid role'}, status=400)
        return Response(serializer.data)
    except (Student.DoesNotExist, Teacher.DoesNotExist):
        return Response({'error': 'User not found'}, status=404)

@api_view(['POST'])
@parser_classes([MultiPartParser, FormParser])
def upload_chapter(request):
    course_id = request.data.get('course_id')
    title = request.data.get('title')
    file = request.FILES.get('file')

    if not all([course_id, title, file]):
        return Response({'error': 'Missing fields'}, status=status.HTTP_400_BAD_REQUEST)

    course = get_object_or_404(Course, pk=course_id)

    chapter = Chapter.objects.create(course=course, title=title, file=file)
    serializer = ChapterSerializer(chapter)
    return Response(serializer.data, status=status.HTTP_201_CREATED)

@api_view(['POST'])
@parser_classes([MultiPartParser, FormParser])
def upload_assignment(request):
    course_id = request.data.get('course_id')
    title = request.data.get('title')
    description = request.data.get('description', '')
    file = request.FILES.get('file')

    if not all([course_id, title, file]):
        return Response({'error': 'Missing fields'}, status=status.HTTP_400_BAD_REQUEST)

    course = get_object_or_404(Course, pk=course_id)

    assignment = Assignment.objects.create(course=course, title=title, description=description, file=file)
    serializer = AssignmentSerializer(assignment)
    return Response(serializer.data, status=status.HTTP_201_CREATED)

from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from django.shortcuts import get_object_or_404
from .models import Attendance, Course, Student
from .serializers import AttendanceSerializer
from django.db.models import Q

@api_view(['GET'])
def attendance_search(request, course_id):
    query = request.GET.get('query', '').strip()
    if not query:
        return Response({'error': 'Query parameter is required'}, status=status.HTTP_400_BAD_REQUEST)

    course = get_object_or_404(Course, pk=course_id)

    # Search student by name or roll number
    students = Student.objects.filter(
        Q(first_name__icontains=query) |
        Q(last_name__icontains=query) |
        Q(roll_no__icontains=query)
    )

    if not students.exists():
        return Response({'error': 'No matching student found.'}, status=status.HTTP_404_NOT_FOUND)

    # Get attendance for those students in the selected course
    attendance_records = Attendance.objects.filter(
        student__in=students,
        course=course
    ).order_by('-date')

    serializer = AttendanceSerializer(attendance_records, many=True)
    return Response(serializer.data)


@api_view(['GET'])
def get_courses_with_content(request):
    courses = Course.objects.all()
    serializer = CourseWithContentSerializer(courses, many=True)
    return Response(serializer.data)

@api_view(['DELETE'])
def delete_chapter(request, chapter_id):
    try:
        chapter = Chapter.objects.get(id=chapter_id)
        chapter.delete()
        return Response({'message': 'Chapter deleted successfully'})
    except Chapter.DoesNotExist:
        return Response({'error': 'Chapter not found'}, status=404)

@api_view(['DELETE'])
def delete_assignment(request, assignment_id):
    try:
        assignment = Assignment.objects.get(id=assignment_id)
        assignment.delete()
        return Response({'message': 'Assignment deleted successfully'})
    except Assignment.DoesNotExist:
        return Response({'error': 'Assignment not found'}, status=404)

@api_view(['GET'])
def get_lost_items(request):
    items = LostAndFound.objects.order_by('-created_at')
    serializer = LostAndFoundSerializer(items, many=True, context={'request': request})
    return Response(serializer.data)

@api_view(['POST'])
@parser_classes([MultiPartParser, FormParser])
def upload_lost_item(request):
    serializer = LostAndFoundSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['DELETE'])
def delete_lost_item(request, pk):
    try:
        item = LostAndFound.objects.get(pk=pk)
        item.delete()
        return Response({'message': 'Deleted'}, status=status.HTTP_204_NO_CONTENT)
    except LostAndFound.DoesNotExist:
        return Response({'error': 'Item not found'}, status=status.HTTP_404_NOT_FOUND)
    
from .models import VoteResult

@api_view(['POST'])
def submit_vote(request):
    user_id = request.data.get('user_id')
    vote_id = request.data.get('vote')
    selected_option = request.data.get('selected_option')

    if not user_id or not vote_id or not selected_option:
        return Response({"error": "Missing data"}, status=status.HTTP_400_BAD_REQUEST)

    # Check
    if VoteResult.objects.filter(user_id=user_id, vote_id=vote_id).exists():
        return Response({"error": "You have already voted"}, status=status.HTTP_400_BAD_REQUEST)

    # Save
    VoteResult.objects.create(
        user_id=user_id,
        vote_id=vote_id,
        selected_option=selected_option
    )

    return Response({"success": "Vote submitted successfully."}, status=status.HTTP_201_CREATED)

@api_view(['GET'])
def get_vote_results(request):
    user_id = request.GET.get('user_id')
    print(f"Received user_id: {user_id}")  # DEBUG
    if not user_id:
        return Response({"error": "user_id is required"}, status=status.HTTP_400_BAD_REQUEST)

    vote_results = VoteResult.objects.filter(user_id=user_id)
    data = [{"vote": vr.vote_id, "selected_option": vr.selected_option} for vr in vote_results]

    return Response(data)


@api_view(['POST'])
def verify_attendance_key(request):
    key = request.data.get('attendance_key')
    course_id = request.data.get('course_id')
    student_id = request.data.get('student_id')

    if not key or not course_id or not student_id:
        return Response({"error": "Missing key, course ID or student ID"}, status=status.HTTP_400_BAD_REQUEST)

    course = get_object_or_404(Course, id=course_id)
    if key != course.attendance_key:
        return Response({"error": "Invalid attendance key"}, status=status.HTTP_403_FORBIDDEN)

    return Response({"success": "Key verified"})


from .face_recognition import compare_faces_from_urls  
import base64

@api_view(['POST'])
def take_attendance(request):
    key = request.data.get('attendance_key')
    course_id = request.data.get('course_id')
    student_id = request.data.get('student_id')
    image_data = request.data.get('image_data')  # base64-encoded current image

    if not key or not course_id or not student_id:
        return Response(
            {"error": "Missing key, course ID or student ID"},
            status=status.HTTP_400_BAD_REQUEST
        )

    course = get_object_or_404(Course, id=course_id)
    student = get_object_or_404(Student, id=student_id)

    if not student.profile_picture:
        return Response(
            {"error": "Student has no profile picture"},
            status=status.HTTP_400_BAD_REQUEST
        )

    # Check attendance key
    if key != course.attendance_key:
        return Response(
            {"error": "Invalid attendance key"},
            status=status.HTTP_402_FORBIDDEN
        )

    # Check image data presence
    if not image_data:
        return Response(
            {"error": "Image data required for face verification"},
            status=status.HTTP_400_BAD_REQUEST
        )

    # Construct full URL for profile picture
    profile_picture_url = request.build_absolute_uri(student.profile_picture.url)

    # Compare faces - updated to unpack tuple
    is_match, debug_info = compare_faces_from_urls(image_data, profile_picture_url)

    if not is_match:
        # Return error with debug info for frontend
        return Response(
            {
                "error": "Face does not match profile picture",
                "debug_info": debug_info
            },
            status=status.HTTP_403_FORBIDDEN
        )

    # Prevent duplicate attendance for today
    today = timezone.now().date()
    if Attendance.objects.filter(student=student, course=course, date=today).exists():
        return Response(
            {"error": "Attendance already marked for today"},
            status=status.HTTP_409_CONFLICT
        )

    # Mark attendance
    Attendance.objects.create(student=student, course=course, date=today, status='present')

    # Return success with debug info
    return Response(
        {
            "success": "Attendance marked successfully",
            "debug_info": debug_info
        }
    )



@api_view(['GET', 'POST'])
@parser_classes([MultiPartParser, FormParser])
def submit_assignment(request):
    if request.method == 'POST':
        serializer = StudentAssignmentSubmissionSerializer(data=request.data)
        if serializer.is_valid():
            # Prevent duplicate submission
            if StudentAssignmentSubmission.objects.filter(
                student=serializer.validated_data['student'],
                assignment=serializer.validated_data['assignment']
            ).exists():
                return Response({'error': 'You have already submitted this assignment.'}, status=400)

            submission = serializer.save()
            response_data = StudentAssignmentSubmissionSerializer(submission).data
            response_data['success'] = 'Assignment submitted successfully!'
            return Response(response_data)

        return Response(serializer.errors, status=400)
    
    # GET method: fetch all submissions
    student_id = request.GET.get('student')
    if student_id:
        submissions = StudentAssignmentSubmission.objects.filter(student_id=student_id)
        serializer = StudentAssignmentSubmissionSerializer(submissions, many=True)
        return Response(serializer.data)
    
    return Response({'error': 'Student ID required to view submissions.'}, status=400)


@api_view(['GET'])
def search_student_submissions(request):
    query = request.GET.get('query', '')

    submissions = StudentAssignmentSubmission.objects.select_related('student', 'assignment__course').filter(
        Q(student__roll_no__icontains=query) |
        Q(student__first_name__icontains=query) |
        Q(student__last_name__icontains=query)
    )

    data = [
        {
            "roll_no": s.student.roll_no,
            "student_name": f"{s.student.first_name} {s.student.last_name}",
            "assignment_title": s.assignment.title,
            "course_name": s.course_name, 
            "submitted_at": s.submitted_at,
            "file_url": s.file.url
        }
        for s in submissions
    ]
    return JsonResponse(data, safe=False)

@api_view(['GET'])
def get_submissions(request):
    student_id = request.GET.get('student')
    assignment_id = request.GET.get('assignment')

    submissions = StudentAssignmentSubmission.objects.all()

    if student_id:
        submissions = submissions.filter(student__id=student_id)
    if assignment_id:
        submissions = submissions.filter(assignment__id=assignment_id)

    serializer = StudentAssignmentSubmissionSerializer(submissions, many=True)
    return Response(serializer.data)