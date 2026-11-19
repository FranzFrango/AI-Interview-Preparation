import json
import re
import requests
import traceback

from django.contrib.auth import get_user_model

from rest_framework import generics, serializers, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework_simplejwt.authentication import JWTAuthentication

from pypdf import PdfReader
from docx import Document

from .models import Resume, ResumeQuizResult
from .serializers import ResumeSerializer

from .models import Interview, Question, Answer, InterviewResult
from .serializers import (
    InterviewSerializer,
    QuestionSerializer,
    AnswerSerializer,
    InterviewResultSerializer,
)

User = get_user_model()

class InterviewCreateView(generics.CreateAPIView):
    serializer_class = InterviewSerializer
    permission_classes = [IsAuthenticated]
    authentication_classes = [JWTAuthentication]

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class QuestionListView(generics.ListAPIView):
    serializer_class = QuestionSerializer
    permission_classes = [IsAuthenticated]
    authentication_classes = [JWTAuthentication]

    def get_queryset(self):
        interview_id = self.kwargs["interview_id"]

        return Question.objects.filter(
            interview_id=interview_id,
            interview__user=self.request.user,
        ).order_by("question_number")


class GenerateQuestionsView(generics.GenericAPIView):
    permission_classes = [IsAuthenticated]
    authentication_classes = [JWTAuthentication]

    def post(self, request, interview_id):

        interview = Interview.objects.filter(
            id=interview_id,
            user=request.user,
        ).first()

        if not interview:
            return Response(
                {"error": "Interview not found."},
                status=404,
            )

        prompt = f"""
You are an expert professional interview question generator.

Generate exactly {interview.number_of_questions} interview questions.

Job role: {interview.job_role}
Experience level: {interview.experience_level}
Interview type: {interview.interview_type}

IMPORTANT:
The interview type determines the kind of questions you MUST generate.

========================
TECHNICAL INTERVIEW
========================

If the interview type is "technical":

Generate questions that test the candidate's technical knowledge
and practical understanding related to the selected job role.

For a Python Developer, questions can cover:

- Python programming
- Data structures
- Algorithms
- Object-oriented programming
- Django
- REST APIs
- Databases
- SQL
- Git
- Debugging
- Software development concepts

Technical questions can ask the candidate to explain concepts,
compare technologies, solve technical problems, or describe
how something works.

DO NOT generate HR questions.
DO NOT generate behavioral questions.

========================
HR INTERVIEW
========================

If the interview type is "hr":

Generate ONLY HR, personal, career, motivation, and
general workplace questions.

Focus on topics such as:

- Tell me about yourself
- Career goals
- Career interests
- Motivation
- Why do you want this job?
- Why should we hire you?
- Strengths
- Weaknesses
- Career expectations
- Work preferences
- Communication
- Team collaboration
- Leadership
- Professional goals
- Company-related motivation

Even if the job role is technical, HR questions MUST remain
non-technical.

DO NOT ask:

- What is a list?
- What is a tuple?
- What is the difference between a list and tuple?
- What is OOP?
- What is an API?
- What is SQL?
- Explain Python.
- Explain Django.
- Explain a programming concept.

========================
BEHAVIORAL INTERVIEW
========================

If the interview type is "behavioral":

Generate ONLY behavioral and situational questions.

Focus on real workplace situations involving:

- Teamwork
- Conflict resolution
- Leadership
- Problem solving
- Working under pressure
- Handling failure
- Meeting deadlines
- Decision making
- Adaptability
- Communication
- Receiving criticism
- Giving feedback
- Difficult teammates
- Taking responsibility
- Learning from mistakes
- Managing multiple tasks

Prefer questions such as:

- Tell me about a time when...
- Describe a situation where...
- Give an example of...
- How did you handle...
- What would you do if...

DO NOT generate programming questions.
DO NOT generate technical concept questions.

DO NOT ask:

- What is a list?
- What is a tuple?
- What is OOP?
- What is an API?
- What is SQL?
- Explain Python.
- Explain Django.

========================
IMPORTANT DIFFERENCE
========================

Technical interview:
Tests technical knowledge and technical problem solving.

HR interview:
Tests personal background, motivation, career goals,
communication, and general workplace-related topics.

Behavioral interview:
Tests how the candidate handled or would handle
real-world workplace situations.

NEVER mix these categories.

The selected interview type is:

{interview.interview_type}

Generate questions ONLY from the selected interview type.

Additional rules:

- Generate exactly {interview.number_of_questions} questions.
- Questions must be relevant to the job role.
- Questions must match the experience level.
- Do not repeat questions.
- Do not mix interview categories.
- Return only the questions.
- Put exactly one question on each line.
- Do not number the questions.
- Do not add explanations.
"""

        try:

            ollama_response = requests.post(
                "http://localhost:11434/api/generate",
                json={
                    "model": "qwen2.5:3b",
                    "prompt": prompt,
                    "stream": False,
                },
                timeout=120,
            )

            ollama_response.raise_for_status()

            data = ollama_response.json()

            text = data.get(
                "response",
                ""
            ).strip()

            questions = [
                line.strip()
                for line in text.splitlines()
                if line.strip()
            ]

            questions = [
                question.lstrip(
                    "0123456789.-) "
                ).strip()
                for question in questions
            ]

            questions = [
                question
                for question in questions
                if question
            ]

            questions = questions[
                :interview.number_of_questions
            ]

            if not questions:
                return Response(
                    {
                        "error":
                            "Ollama did not generate any questions."
                    },
                    status=500,
                )

            Question.objects.filter(
                interview=interview
            ).delete()

            for number, question_text in enumerate(
                questions,
                start=1,
            ):
                Question.objects.create(
                    interview=interview,
                    question_text=question_text,
                    question_number=number,
                )

            return Response(
                {
                    "message":
                        "AI questions generated successfully.",
                    "questions": questions,
                },
                status=201,
            )

        except requests.exceptions.RequestException as error:

            return Response(
                {
                    "error":
                        "Unable to connect to Ollama.",
                    "details": str(error),
                },
                status=500,
            )

        except Exception as error:

            print(
                "\n========== QUESTION GENERATION ERROR =========="
            )

            traceback.print_exc()

            print(
                "===============================================\n"
            )

            return Response(
                {
                    "error":
                        "Question generation failed.",
                    "details": str(error),
                },
                status=500,
            )

class AnswerCreateView(generics.CreateAPIView):
    serializer_class = AnswerSerializer
    permission_classes = [IsAuthenticated]
    authentication_classes = [JWTAuthentication]

    def create(self, request, *args, **kwargs):
        interview_id = self.kwargs["interview_id"]

        interview = Interview.objects.filter(
            id=interview_id,
            user=request.user,
        ).first()

        if not interview:
            return Response(
                {"error": "Interview not found."},
                status=404,
            )

        serializer = self.get_serializer(
            data=request.data
        )

        serializer.is_valid(
            raise_exception=True
        )

        question = serializer.validated_data["question"]

        if question.interview_id != interview.id:
            return Response(
                {
                    "error": (
                        "Question does not belong "
                        "to this interview."
                    )
                },
                status=400,
            )

        answer_text = (
            serializer.validated_data["answer_text"]
            .strip()
        )

        answer, created = Answer.objects.update_or_create(
            interview=interview,
            question=question,
            defaults={
                "answer_text": answer_text,
            },
        )

        response_serializer = self.get_serializer(
            answer
        )

        return Response(
            response_serializer.data,
            status=201,
        )
class EvaluateInterviewView(generics.GenericAPIView):
    permission_classes = [IsAuthenticated]
    authentication_classes = [JWTAuthentication]

    def is_obviously_nonsense(self, text):
        """
        Detect empty, extremely short, or obvious random/gibberish answers.
        """

        text = (text or "").strip()

        if not text:
            return True

        normalized = re.sub(
            r"[^a-zA-Z0-9]",
            "",
            text.lower(),
        )

        if not normalized:
            return True

        if len(normalized) <= 2:
            return True

        nonsense_patterns = [
            "asdf",
            "asdfgh",
            "asdfghjkl",
            "qwerty",
            "qwertyuiop",
            "zxcv",
            "zxcvbn",
            "ffgegerg",
            "ggrrgrsgsgs",
            "fhfjg",
            "fhfjgsg",
            "gjgnnf",
            "sffnsfnsf",
            "jfnsfjksfnf",
            "kjef",
        ]

        for pattern in nonsense_patterns:
            if pattern in normalized:
                return True

        if len(normalized) >= 5 and len(set(normalized)) == 1:
            return True

        return False

    def post(self, request, interview_id):

        # =====================================================
        # FIND INTERVIEW
        # =====================================================

        interview = Interview.objects.filter(
            id=interview_id,
            user=request.user,
        ).first()

        if not interview:
            return Response(
                {"error": "Interview not found."},
                status=404,
            )

        # =====================================================
        # GET QUESTIONS
        # =====================================================

        questions = list(
            Question.objects.filter(
                interview=interview
            ).order_by("question_number")
        )

        if not questions:
            return Response(
                {"error": "No questions found."},
                status=400,
            )

        # =====================================================
        # GET ANSWERS
        # =====================================================

        answer_map = {}

        answers = Answer.objects.filter(
            interview=interview
        ).order_by("question_id")

        for answer in answers:
            answer_map[answer.question_id] = (
                answer.answer_text or ""
            ).strip()

        print("========== ANSWERS ==========")

        for question in questions:
            print(
                "QUESTION ID:",
                question.id,
                "ANSWER:",
                answer_map.get(question.id, ""),
            )

        print("==============================")

        # =====================================================
        # BUILD INTERVIEW TEXT
        # =====================================================

        interview_text = ""

        for question in questions:

            answer = answer_map.get(
                question.id,
                "",
            )

            interview_text += f"""
QUESTION {question.question_number}:
{question.question_text}

CANDIDATE ANSWER:
{answer if answer else "[NO ANSWER]"}

--------------------------------
"""

        # =====================================================
        # AI EVALUATION PROMPT
        # =====================================================

        prompt = f"""
You are an objective professional interview evaluator.

Evaluate the candidate's answers based ONLY on the actual content
and meaning of the candidate's answers.

==================================================
INTERVIEW INFORMATION
==================================================

Job Role:
{interview.job_role}

Experience Level:
{interview.experience_level}

Interview Type:
{interview.interview_type}

==================================================
MOST IMPORTANT RULE
==================================================

The candidate's answer DOES NOT need to match a reference answer.

There is NO single required wording for an interview answer.

Do NOT compare the candidate's answer word-for-word with an expected
answer.

Do NOT require the same keywords.

Do NOT require the same sentence structure.

Do NOT give a score of 0 simply because the candidate used different
words, examples, explanations, or ideas.

Judge whether the candidate's own answer reasonably answers the
question.

A candidate can receive a high score even when their answer is
completely different from a possible model answer.

==================================================
INTERVIEW TYPE
==================================================

The interview type is:

{interview.interview_type}

For a TECHNICAL interview:

Evaluate technical correctness, understanding, practical knowledge,
problem solving, relevance, completeness, and clarity.

For an HR interview:

Do NOT require programming or technical knowledge.

Evaluate relevance, communication, career motivation,
professional attitude, self-awareness, completeness, and clarity.

For a BEHAVIORAL interview:

Evaluate understanding of the situation, actions taken,
problem solving, responsibility, communication, relevance,
completeness, and clarity.

Different reasonable answers can receive good scores.

==================================================
SCORING
==================================================

Use these four component scores:

technical_correctness: 0-50
relevance: 0-20
completeness: 0-15
grammar_clarity: 0-15

The total score is:

technical_correctness + relevance + completeness + grammar_clarity

IMPORTANT:

For TECHNICAL interviews:

technical_correctness means technical accuracy.

For HR interviews:

technical_correctness does NOT mean programming knowledge.

Instead, use this score to represent the quality and appropriateness
of the candidate's answer.

For BEHAVIORAL interviews:

technical_correctness does NOT mean programming knowledge.

Instead, use this score to represent the quality of reasoning,
understanding, and problem solving shown in the answer.

==================================================
ZERO SCORE RULE
==================================================

Give all scores 0 only when the answer is:

- Empty
- Completely meaningless
- Obvious gibberish
- Completely unrelated to the question

For example:

"g j j"

or

"rgbb gr bg bf b"

should receive 0.

However, a normal meaningful answer must NOT receive 0 merely because
it is different from a possible reference answer.

==================================================
REFERENCE ANSWERS
==================================================

Do NOT require a reference answer.

Do NOT generate a reference answer for comparison.

The candidate must be evaluated based on their own answer.

For example:

Question:
"Tell me about yourself."

Candidate answer:
"My name is Franz. I completed BTech in Computer Science.
I am interested in Python and full-stack development. I have worked
on academic projects using Django and React."

This can receive a good score because it directly answers the question.

It does NOT need to match another answer.

==================================================
QUESTIONS AND CANDIDATE ANSWERS
==================================================

{interview_text}

==================================================
FINAL INSTRUCTIONS
==================================================

There are exactly {len(questions)} questions.

You MUST return exactly {len(questions)} evaluation objects.

The question_number values MUST be:

{", ".join(str(q.question_number) for q in questions)}

Do not skip any question.

Evaluate every answer independently.

Do not invent information about the candidate.

Do not assume experience that the candidate did not mention.

Do not penalize different wording.

Do not require exact answers.

Return ONLY valid JSON.

Use exactly this structure:

{{
    "questions": [
        {{
            "question_number": 1,
            "technical_correctness": 0,
            "relevance": 0,
            "completeness": 0,
            "grammar_clarity": 0,
            "feedback": "Brief feedback based on the candidate's actual answer.",
            "correct_answer": "",
            "improvement": "Specific suggestion for improving the answer."
        }}
    ]
}}
"""

        # =====================================================
        # GET AI EVALUATION
        # =====================================================

        question_results = []

        try:

            ollama_response = requests.post(
                "http://localhost:11434/api/generate",
                json={
                    "model": "qwen2.5:3b",
                    "prompt": prompt,
                    "stream": False,
                    "format": "json",
                },
                timeout=180,
            )

            ollama_response.raise_for_status()

            data = ollama_response.json()

            ai_text = data.get(
                "response",
                "",
            ).strip()

            print("========== OLLAMA RESPONSE ==========")
            print(ai_text)
            print("======================================")

            if ai_text:

                try:

                    evaluation = json.loads(ai_text)

                    question_results = evaluation.get(
                        "questions",
                        [],
                    )

                    if not isinstance(
                        question_results,
                        list,
                    ):
                        question_results = []

                except json.JSONDecodeError:

                    print(
                        "Ollama returned invalid JSON."
                    )

                    question_results = []

        except requests.exceptions.RequestException as error:

            print(
                "========== OLLAMA ERROR =========="
            )

            print(str(error))

            print(
                "==================================="
            )

            question_results = []

        # =====================================================
        # CREATE LOOKUP FOR AI RESULTS
        # =====================================================

        ai_result_map = {}

        for item in question_results:

            if not isinstance(item, dict):
                continue

            question_number = item.get(
                "question_number"
            )

            try:

                question_number = int(
                    question_number
                )

            except (TypeError, ValueError):

                continue

            ai_result_map[question_number] = item

        # =====================================================
        # EVALUATE EVERY QUESTION
        # =====================================================

        scores = []

        feedback_items = []

        question_score_details = []

        for question in questions:

            question_number = question.question_number

            answer = answer_map.get(
                question.id,
                "",
            ).strip()

            ai_result = ai_result_map.get(
                question_number,
                {},
            )

            # =================================================
            # EMPTY ANSWER
            # =================================================

            if not answer:

                technical_correctness = 0
                relevance = 0
                completeness = 0
                grammar_clarity = 0
                score = 0

                feedback = (
                    "No answer was provided."
                )

                correct_answer = ""

                improvement = (
                    "Try to provide an answer that "
                    "directly addresses the question."
                )

                status = "skipped"

            # =================================================
            # GIBBERISH ANSWER
            # =================================================

            elif self.is_obviously_nonsense(answer):

                technical_correctness = 0
                relevance = 0
                completeness = 0
                grammar_clarity = 0
                score = 0

                feedback = (
                    "The answer contains meaningless "
                    "or random text and does not address "
                    "the interview question."
                )

                correct_answer = ""

                improvement = (
                    "Replace the random text with a clear "
                    "answer that directly addresses the "
                    "interview question."
                )

                status = "invalid"

            # =================================================
            # AI DID NOT RETURN RESULT
            # =================================================

            elif not ai_result:

                technical_correctness = 0
                relevance = 0
                completeness = 0
                grammar_clarity = 0
                score = 0

                feedback = (
                    "The AI evaluator did not return "
                    "a result for this question."
                )

                correct_answer = ""

                improvement = (
                    "Try answering this question again "
                    "in a future interview."
                )

                status = "evaluation_unavailable"

                print(
                    f"WARNING: Missing AI evaluation "
                    f"for question {question_number}"
                )

            # =================================================
            # NORMAL AI EVALUATION
            # =================================================

            else:

                try:

                    technical_correctness = int(
                        ai_result.get(
                            "technical_correctness",
                            0,
                        )
                    )

                except (TypeError, ValueError):

                    technical_correctness = 0

                try:

                    relevance = int(
                        ai_result.get(
                            "relevance",
                            0,
                        )
                    )

                except (TypeError, ValueError):

                    relevance = 0

                try:

                    completeness = int(
                        ai_result.get(
                            "completeness",
                            0,
                        )
                    )

                except (TypeError, ValueError):

                    completeness = 0

                try:

                    grammar_clarity = int(
                        ai_result.get(
                            "grammar_clarity",
                            0,
                        )
                    )

                except (TypeError, ValueError):

                    grammar_clarity = 0

                # Protect score ranges

                technical_correctness = max(
                    0,
                    min(
                        technical_correctness,
                        50,
                    ),
                )

                relevance = max(
                    0,
                    min(
                        relevance,
                        20,
                    ),
                )

                completeness = max(
                    0,
                    min(
                        completeness,
                        15,
                    ),
                )

                grammar_clarity = max(
                    0,
                    min(
                        grammar_clarity,
                        15,
                    ),
                )

                score = (
                    technical_correctness
                    + relevance
                    + completeness
                    + grammar_clarity
                )

                feedback = ai_result.get(
                    "feedback",
                    "No specific feedback provided.",
                )

                correct_answer = ai_result.get(
                    "correct_answer",
                    "",
                )

                improvement = ai_result.get(
                    "improvement",
                    "Continue practicing your interview answers.",
                )

                status = "evaluated"

            # =================================================
            # STORE SCORE
            # =================================================

            scores.append(score)

            question_score_details.append(
                {
                    "question_number": question_number,
                    "question": question.question_text,
                    "answer": answer,
                    "score": score,
                    "technical_correctness": technical_correctness,
                    "relevance": relevance,
                    "completeness": completeness,
                    "grammar_clarity": grammar_clarity,
                    "feedback": feedback,
                    "correct_answer": correct_answer,
                    "improvement": improvement,
                    "status": status,
                }
            )

            feedback_items.append(
                f"QUESTION {question_number} "
                f"SCORE: {score}/100\n"
                f"Technical correctness: "
                f"{technical_correctness}/50\n"
                f"Relevance: "
                f"{relevance}/20\n"
                f"Completeness: "
                f"{completeness}/15\n"
                f"Grammar & clarity: "
                f"{grammar_clarity}/15\n\n"
                f"Feedback:\n"
                f"{feedback}\n\n"
                f"Improvement:\n"
                f"{improvement}"
            )

        # =====================================================
        # CALCULATE OVERALL SCORE
        # =====================================================

        if scores:

            overall_score = round(
                sum(scores) / len(scores)
            )

        else:

            overall_score = 0

        feedback_text = "\n\n".join(
            feedback_items
        )

        # =====================================================
        # SAVE RESULT
        # =====================================================

        InterviewResult.objects.update_or_create(
            interview=interview,
            defaults={
                "score": overall_score,
                "feedback": feedback_text,
            },
        )

        # =====================================================
        # RETURN RESULT
        # =====================================================

        return Response(
            {
                "message": (
                    "Interview evaluated successfully."
                ),
                "score": overall_score,
                "feedback": feedback_text,
                "question_scores": question_score_details,
            },
            status=200,
        )
class InterviewResultView(generics.RetrieveAPIView):
    serializer_class = InterviewResultSerializer
    permission_classes = [IsAuthenticated]
    authentication_classes = [JWTAuthentication]

    def get_object(self):
        interview_id = self.kwargs["interview_id"]

        result = InterviewResult.objects.filter(
            interview_id=interview_id,
            interview__user=self.request.user,
        ).first()

        if not result:
            raise serializers.ValidationError(
                {"error": "Interview result not found."}
            )

        return result
class InterviewHistoryView(generics.ListAPIView):
    permission_classes = [IsAuthenticated]
    authentication_classes = [JWTAuthentication]

    def get(self, request):
        interviews = (
            Interview.objects
            .filter(user=request.user)
            .select_related("result")
            .order_by("-created_at")
        )

        history = []

        for interview in interviews:
            result = getattr(interview, "result", None)

            history.append({
                "id": interview.id,
                "job_role": interview.job_role,
                "experience_level": interview.experience_level,
                "interview_type": interview.interview_type,
                "number_of_questions": interview.number_of_questions,
                "created_at": interview.created_at,
                "score": result.score if result else None,
                "has_result": result is not None,
            })

        return Response(history)
class DeleteInterviewView(generics.DestroyAPIView):
    permission_classes = [IsAuthenticated]
    authentication_classes = [JWTAuthentication]

    def delete(self, request, interview_id):
        interview = Interview.objects.filter(
            id=interview_id,
            user=request.user,
        ).first()

        if not interview:
            return Response(
                {"error": "Interview not found."},
                status=404,
            )

        interview.delete()

        return Response(
            {
                "message": "Interview deleted successfully."
            },
            status=200,
        )
class ResumeUploadView(generics.CreateAPIView):
    serializer_class = ResumeSerializer
    permission_classes = [IsAuthenticated]
    authentication_classes = [JWTAuthentication]

    def create(self, request, *args, **kwargs):

        file = request.FILES.get("file")

        if not file:
            return Response(
                {"error": "Please upload a resume file."},
                status=400,
            )

        file_name = file.name.lower()

        # Check file type
        if not (
            file_name.endswith(".pdf")
            or file_name.endswith(".docx")
        ):
            return Response(
                {
                    "error": (
                        "Only PDF and DOCX files "
                        "are supported."
                    )
                },
                status=400,
            )

        try:
            extracted_text = ""

            # PDF
            if file_name.endswith(".pdf"):

                reader = PdfReader(file)

                for page in reader.pages:
                    page_text = page.extract_text()

                    if page_text:
                        extracted_text += page_text + "\n"

            # DOCX
            elif file_name.endswith(".docx"):

                document = Document(file)

                for paragraph in document.paragraphs:
                    if paragraph.text.strip():
                        extracted_text += (
                            paragraph.text + "\n"
                        )

            extracted_text = extracted_text.strip()

            if not extracted_text:
                return Response(
                    {
                        "error": (
                            "Could not extract text "
                            "from the resume."
                        )
                    },
                    status=400,
                )

            # Save resume
            resume = Resume.objects.create(
                user=request.user,
                file=file,
                extracted_text=extracted_text,
            )

            serializer = ResumeSerializer(resume)

            return Response(
                {
                    "message": "Resume uploaded successfully.",
                    "resume": serializer.data,
                    "extracted_text": extracted_text,
                },
                status=201,
            )

        except Exception as error:

            print(
                "Resume processing error:",
                error,
            )

            return Response(
                {
                    "error": "Unable to process resume.",
                    "details": str(error),
                },
                status=500,
            )
class ResumeAnalyzeView(generics.GenericAPIView):
    permission_classes = [IsAuthenticated]
    authentication_classes = [JWTAuthentication]

    def post(self, request, resume_id):
        # Find resume belonging to logged-in user
        resume = Resume.objects.filter(
            id=resume_id,
            user=request.user,
        ).first()

        if not resume:
            return Response(
                {"error": "Resume not found."},
                status=404,
            )

        # Make sure extracted text exists
        if not resume.extracted_text.strip():
            return Response(
                {
                    "error": (
                        "No extracted text is available "
                        "for this resume."
                    )
                },
                status=400,
            )

        # AI prompt
        prompt = f"""
You are an expert professional resume analyzer.

Analyze the following resume carefully.

RESUME:
{resume.extracted_text}

Provide a professional analysis using the following sections:

1. Overall Resume Score
Give a score from 0 to 100.

2. Professional Summary
Give a short assessment of the candidate's profile.

3. Technical Skills
List the technical skills found in the resume.

4. Soft Skills
List the soft skills found in the resume if available.

5. Education
Summarize the education information.

6. Projects
Summarize the important projects and technologies used.

7. Strengths
List the major strengths of the resume.

8. Areas for Improvement
List weaknesses or areas that can be improved.

9. ATS Suggestions
Give practical suggestions to improve ATS compatibility.

10. Recommended Job Roles
Suggest suitable job roles based only on the skills and experience
present in the resume.

Important rules:
- Analyze only the information present in the resume.
- Do not invent qualifications, skills, experience, or projects.
- If information is missing, clearly say that it is not mentioned.
- Keep the analysis professional and useful for job seekers.
- Use simple and clear language.
"""

        try:
            # Send resume to Ollama
            ollama_response = requests.post(
                "http://localhost:11434/api/generate",
                json={
                    "model": "qwen2.5:3b",
                    "prompt": prompt,
                    "stream": False,
                },
                timeout=180,
            )

            ollama_response.raise_for_status()

            data = ollama_response.json()

            analysis = data.get(
                "response",
                "",
            ).strip()

            if not analysis:
                return Response(
                    {
                        "error": (
                            "Ollama returned an empty "
                            "resume analysis."
                        )
                    },
                    status=500,
                )

            # Save AI analysis in database
            resume.ai_analysis = analysis
            resume.save(
                update_fields=["ai_analysis"]
            )

            return Response(
                {
                    "message": (
                        "Resume analyzed successfully."
                    ),
                    "resume_id": resume.id,
                    "analysis": analysis,
                },
                status=200,
            )

        except requests.exceptions.RequestException as error:
            print(
                "Resume AI error:",
                error,
            )

            return Response(
                {
                    "error": (
                        "Unable to connect to Ollama."
                    ),
                    "details": str(error),
                },
                status=500,
            )

        except Exception as error:
            print(
                "Resume analysis error:",
                error,
            )

            return Response(
                {
                    "error": (
                        "Resume analysis failed."
                    ),
                    "details": str(error),
                },
                status=500,
            )
class ResumeHistoryView(generics.ListAPIView):
    permission_classes = [IsAuthenticated]
    authentication_classes = [JWTAuthentication]
    serializer_class = ResumeSerializer

    def get_queryset(self):
        resumes = Resume.objects.filter(
            user=self.request.user
        ).order_by("-created_at")

        print("====================================")
        print("CURRENT USER:", self.request.user)
        print("RESUME COUNT:", resumes.count())

        for resume in resumes:
            print(
                "RESUME:",
                resume.id,
                resume.file.name
            )

        print("====================================")

        return resumes
class ResumeDeleteView(generics.DestroyAPIView):
    permission_classes = [IsAuthenticated]
    authentication_classes = [JWTAuthentication]

    def delete(self, request, resume_id):
        resume = Resume.objects.filter(
            id=resume_id,
            user=request.user
        ).first()

        if not resume:
            return Response(
                {"error": "Resume not found."},
                status=404
            )

        resume.delete()

        return Response(
            {"message": "Resume deleted successfully."},
            status=200
        )

class ResumeQuizGenerateView(generics.GenericAPIView):
    permission_classes = [IsAuthenticated]
    authentication_classes = [JWTAuthentication]

    def post(self, request):
        resume_id = request.data.get("resume_id")
        number_of_questions = request.data.get("number_of_questions", 10)

        if not resume_id:
            return Response(
                {"error": "resume_id is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            number_of_questions = int(number_of_questions)
        except (TypeError, ValueError):
            return Response(
                {"error": "number_of_questions must be a number."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if number_of_questions not in [5, 10, 15, 20]:
            return Response(
                {"error": "Number of questions must be 5, 10, 15, or 20."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        resume = Resume.objects.filter(
            id=resume_id,
            user=request.user,
        ).first()

        if not resume:
            return Response(
                {"error": "Resume not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        resume_text = (resume.extracted_text or "").strip()

        if not resume_text:
            return Response(
                {"error": "This resume does not contain extracted text."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        prompt = f"""
You are an AI Resume Quiz Generator.

Create exactly {number_of_questions} interview-style quiz questions
based ONLY on the candidate's resume below.

==================================================
CANDIDATE RESUME
==================================================

{resume_text}

==================================================
IMPORTANT RULES
==================================================

1. Every question must be based on information actually present
   in the resume.

2. Ask about things such as:
   - Projects
   - Technologies
   - Programming languages
   - Frameworks
   - Databases
   - Skills
   - Education
   - Experience
   - Responsibilities
   - Achievements

3. Do NOT invent:
   - Projects
   - Companies
   - Technologies
   - Skills
   - Qualifications
   - Experience
   - Achievements

4. Do NOT ask generic questions that are unrelated to the resume.

5. Questions should test whether the candidate actually understands
   the things mentioned in their resume.

6. If the resume mentions a project, ask questions about that project.

7. If the resume mentions a technology, ask how or why it was used
   when the resume provides enough context.

8. Do not make every question about the same project or technology.
   Cover different parts of the resume when possible.

9. Generate exactly {number_of_questions} questions.

10. Return ONLY the questions.

11. Put one question on each line.

12. Do NOT number the questions.

Example format:

What was the main purpose of your AI Interview Preparation Platform?
Why did you choose Django REST Framework for the project?
How did PostgreSQL fit into your application?

Now generate the questions.
"""

        try:
            ollama_response = requests.post(
                "http://localhost:11434/api/generate",
                json={
                    "model": "qwen2.5:3b",
                    "prompt": prompt,
                    "stream": False,
                },
                timeout=120,
            )

            if ollama_response.status_code != 200:
                return Response(
                    {
                        "error": "Ollama returned an error.",
                        "details": ollama_response.text,
                    },
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR,
                )

            result = ollama_response.json()
            generated_text = result.get("response", "").strip()

            questions = [
                line.strip()
                for line in generated_text.splitlines()
                if line.strip()
            ]

            if len(questions) < number_of_questions:
                return Response(
                    {
                        "error": "AI did not generate enough questions.",
                        "generated_questions": questions,
                    },
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR,
                )

            questions = questions[:number_of_questions]

            return Response(
                {
                    "resume_id": resume.id,
                    "questions": questions,
                },
                status=status.HTTP_200_OK,
            )

        except requests.exceptions.RequestException as error:
            return Response(
                {
                    "error": "Unable to connect to Ollama.",
                    "details": str(error),
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )
class ResumeQuizEvaluateView(generics.GenericAPIView):
    permission_classes = [IsAuthenticated]
    authentication_classes = [JWTAuthentication]

    def post(self, request):
        resume_id = request.data.get("resume_id")
        questions = request.data.get("questions", [])
        answers = request.data.get("answers", [])

        if not resume_id:
            return Response(
                {"error": "resume_id is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not questions or not answers:
            return Response(
                {"error": "Questions and answers are required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        resume = Resume.objects.filter(
            id=resume_id,
            user=request.user,
        ).first()

        if not resume:
            return Response(
                {"error": "Resume not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        resume_text = (resume.extracted_text or "").strip()

        if not resume_text:
            return Response(
                {"error": "Resume text is not available."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if len(questions) != len(answers):
            return Response(
                {"error": "Questions and answers count do not match."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        interview_text = ""

        for index, question in enumerate(questions):
            answer = answers[index]

            interview_text += f"""
QUESTION {index + 1}:
{question}

CANDIDATE ANSWER:
{answer if answer else "[NO ANSWER]"}

--------------------------------
"""

        prompt = f"""
You are an objective Resume Quiz evaluator.

The candidate is answering questions generated specifically
from their resume.

Evaluate each answer based on:
- Whether it answers the question
- Understanding of the resume information
- Relevance
- Completeness
- Clarity
- Whether the answer is consistent with the resume

==================================================
CANDIDATE RESUME
==================================================

{resume_text}

==================================================
QUESTIONS AND ANSWERS
==================================================

{interview_text}

==================================================
IMPORTANT RULES
==================================================

The candidate does NOT need to use the exact wording from the resume.

Do NOT require an exact match.

Do NOT compare answers word-for-word.

Different reasonable explanations should receive good scores.

If the candidate explains a project, technology, skill,
education, or experience correctly in their own words,
give appropriate credit.

Do not invent information that is not present in the resume
or candidate answer.

Give 0 only when an answer is:
- Empty
- Meaningless
- Obvious gibberish
- Completely unrelated to the question

==================================================
SCORING
==================================================

Score each answer from 0 to 100.

Consider:

Relevance
Understanding
Completeness
Clarity

==================================================
OUTPUT
==================================================

Return ONLY valid JSON.

Use exactly this format:

{{
    "questions": [
        {{
            "question_number": 1,
            "score": 85,
            "feedback": "The answer demonstrates a good understanding of the project.",
            "improvement": "Explain your specific contribution in more detail."
        }}
    ]
}}

There are exactly {len(questions)} questions.

Return exactly {len(questions)} result objects.
"""

        try:
            ollama_response = requests.post(
                "http://localhost:11434/api/generate",
                json={
                    "model": "qwen2.5:3b",
                    "prompt": prompt,
                    "stream": False,
                    "format": "json",
                },
                timeout=180,
            )

            ollama_response.raise_for_status()

            data = ollama_response.json()

            ai_text = data.get("response", "").strip()

            if not ai_text:
                return Response(
                    {"error": "AI returned an empty evaluation."},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR,
                )

            try:
                evaluation = json.loads(ai_text)
            except json.JSONDecodeError:
                return Response(
                    {"error": "AI returned invalid evaluation JSON."},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR,
                )

            results = evaluation.get("questions", [])

            if not isinstance(results, list):
                results = []

            total_score = 0
            question_results = []

            for index, question in enumerate(questions):

                answer = answers[index]

                result = (
                    results[index]
                    if index < len(results)
                    and isinstance(results[index], dict)
                    else {}
                )

                try:
                    score = int(result.get("score", 0))
                except (TypeError, ValueError):
                    score = 0

                score = max(0, min(score, 100))

                total_score += score

                question_results.append(
                    {
                        "question_number": index + 1,
                        "question": question,
                        "answer": answer,
                        "score": score,
                        "feedback": result.get(
                            "feedback",
                            "No feedback provided.",
                        ),
                        "improvement": result.get(
                            "improvement",
                            "Try to give a clearer and more detailed answer.",
                        ),
                    }
                )

            overall_score = round(
                total_score / len(questions)
            )

            ResumeQuizResult.objects.create(
                user=request.user,
                resume=resume,
                score=overall_score,
                total_questions=len(questions),
            )

            return Response(
                {
                    "message": "Resume quiz evaluated successfully.",
                    "score": overall_score,
                    "question_results": question_results,
                },
                status=status.HTTP_200_OK,
            )

        except requests.exceptions.RequestException as error:
            return Response(
                {
                    "error": "Unable to connect to Ollama.",
                    "details": str(error),
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )
class ResumeQuizResultListView(generics.ListAPIView):
    permission_classes = [IsAuthenticated]
    authentication_classes = [JWTAuthentication]

    def get(self, request):
        results = ResumeQuizResult.objects.filter(
            user=request.user
        ).order_by("-created_at")

        data = []

        for result in results:
            data.append(
                {
                    "id": result.id,
                    "resume_id": result.resume.id,
                    "score": result.score,
                    "total_questions": result.total_questions,
                    "created_at": result.created_at,
                }
            )

        return Response(data, status=status.HTTP_200_OK)