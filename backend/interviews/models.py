from django.conf import settings
from django.db import models


class Resume(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="resumes",
    )

    file = models.FileField(
        upload_to="resumes/"
    )

    extracted_text = models.TextField(
        blank=True
    )

    ai_analysis = models.TextField(
        blank=True
    )

    created_at = models.DateTimeField(
        auto_now_add=True
    )

    def __str__(self):
        return f"Resume - {self.user.username}"


class Interview(models.Model):
    INTERVIEW_TYPES = [
        ("technical", "Technical"),
        ("hr", "HR"),
        ("behavioral", "Behavioral"),
    ]

    EXPERIENCE_LEVELS = [
        ("beginner", "Beginner"),
        ("intermediate", "Intermediate"),
        ("advanced", "Advanced"),
    ]

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="interviews",
    )

    resume = models.ForeignKey(
        Resume,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="interviews",
    )

    job_role = models.CharField(
        max_length=100
    )

    experience_level = models.CharField(
        max_length=20,
        choices=EXPERIENCE_LEVELS,
    )

    interview_type = models.CharField(
        max_length=20,
        choices=INTERVIEW_TYPES,
    )

    number_of_questions = models.PositiveIntegerField(
        default=10
    )

    created_at = models.DateTimeField(
        auto_now_add=True
    )

    def __str__(self):
        return f"{self.job_role} - {self.interview_type}"


class Question(models.Model):
    interview = models.ForeignKey(
        Interview,
        on_delete=models.CASCADE,
        related_name="questions",
    )

    question_text = models.TextField()

    question_number = models.PositiveIntegerField()

    created_at = models.DateTimeField(
        auto_now_add=True
    )

    def __str__(self):
        return (
            f"Question {self.question_number} "
            f"- {self.interview}"
        )


class Answer(models.Model):
    interview = models.ForeignKey(
        Interview,
        on_delete=models.CASCADE,
        related_name="answers",
    )

    question = models.ForeignKey(
        Question,
        on_delete=models.CASCADE,
        related_name="answers",
    )

    answer_text = models.TextField()

    created_at = models.DateTimeField(
        auto_now_add=True
    )

    def __str__(self):
        return (
            f"Answer - Interview {self.interview.id} "
            f"- Question {self.question.question_number}"
        )


class InterviewResult(models.Model):
    interview = models.OneToOneField(
        Interview,
        on_delete=models.CASCADE,
        related_name="result",
    )

    score = models.PositiveIntegerField()

    feedback = models.TextField()

    created_at = models.DateTimeField(
        auto_now_add=True
    )

    def __str__(self):
        return f"Result - Interview {self.interview.id}"
class ResumeQuizResult(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="resume_quiz_results",
    )

    resume = models.ForeignKey(
        Resume,
        on_delete=models.CASCADE,
        related_name="quiz_results",
    )

    score = models.PositiveIntegerField()
    total_questions = models.PositiveIntegerField()

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Resume Quiz - {self.user.username} - {self.score}%"