from django.urls import path

from .views import (
    InterviewCreateView,
    QuestionListView,
    GenerateQuestionsView,
    AnswerCreateView,
    EvaluateInterviewView,
    InterviewResultView,
    InterviewHistoryView,
    DeleteInterviewView,
    ResumeUploadView,
    ResumeAnalyzeView,
    ResumeHistoryView,
    ResumeDeleteView,
    ResumeQuizGenerateView,
    ResumeQuizEvaluateView,
    ResumeQuizResultListView,
)
urlpatterns = [
    path(
        "create/",
        InterviewCreateView.as_view(),
        name="interview-create",
    ),
    path(
        "<int:interview_id>/questions/",
        QuestionListView.as_view(),
        name="question-list",
    ),
    path(
        "<int:interview_id>/generate-questions/",
        GenerateQuestionsView.as_view(),
        name="generate-questions",
    ),
    path(
    "<int:interview_id>/answers/",
    AnswerCreateView.as_view(),
    name="answer-create",
    ),
    path(
    "<int:interview_id>/evaluate/",
    EvaluateInterviewView.as_view(),
    name="evaluate-interview",
    ),path(
    "<int:interview_id>/result/",
    InterviewResultView.as_view(),
    name="interview-result",
    ),
    path(
    "history/",
    InterviewHistoryView.as_view(),
    name="interview-history",
    ),
    path(
    "<int:interview_id>/delete/",
    DeleteInterviewView.as_view(),
    name="interview-delete",
    ),
    path(
    "resume/upload/",
    ResumeUploadView.as_view(),
    name="resume-upload",
    ),
    path(
    "resume/<int:resume_id>/analyze/",
    ResumeAnalyzeView.as_view(),
    name="resume-analyze",
    ),
    path(
    "resume/history/",
    ResumeHistoryView.as_view(),
),
    path(
    "resume-quiz/results/",
    ResumeQuizResultListView.as_view(),
    ),

    path(
    "resume/<int:resume_id>/delete/",
    ResumeDeleteView.as_view(),
    name="resume-delete",
    ),


    path(
    "resume-quiz/generate/",
    ResumeQuizGenerateView.as_view(),
    ),
    path(
    "resume-quiz/evaluate/",
    ResumeQuizEvaluateView.as_view(),
),




]