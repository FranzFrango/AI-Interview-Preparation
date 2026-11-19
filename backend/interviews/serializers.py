from rest_framework import serializers
from .models import (
    Interview,
    Question,
    Answer,
    InterviewResult,
    Resume,
)
class InterviewSerializer(serializers.ModelSerializer):
    class Meta:
        model = Interview

        fields = [
            "id",
            "resume",
            "job_role",
            "experience_level",
            "interview_type",
            "number_of_questions",
            "created_at",
        ]

        read_only_fields = [
            "id",
            "created_at",
        ]
class QuestionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Question
        fields = [
            "id",
            "interview",
            "question_text",
            "question_number",
            "created_at",
        ]
        read_only_fields = ["id", "created_at"]
class AnswerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Answer
        fields = [
            "id",
            "interview",
            "question",
            "answer_text",
            "created_at",
        ]
        read_only_fields = [
            "id",
            "interview",
            "created_at",
        ]
class InterviewResultSerializer(serializers.ModelSerializer):
    class Meta:
        model = InterviewResult
        fields = [
            "id",
            "interview",
            "score",
            "feedback",
            "created_at",
        ]
        read_only_fields = [
            "id",
            "interview",
            "created_at",
        ]
class ResumeSerializer(serializers.ModelSerializer):

    class Meta:
        model = Resume

        fields = [
            "id",
            "file",
            "extracted_text",
            "ai_analysis",
            "created_at",
        ]

        read_only_fields = [
            "id",
            "extracted_text",
            "ai_analysis",
            "created_at",
        ]