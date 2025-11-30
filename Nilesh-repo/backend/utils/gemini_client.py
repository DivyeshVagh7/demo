import google.generativeai as genai
from django.conf import settings
import logging

logger = logging.getLogger(__name__)

def get_gemini_client():
    """
    Initializes and returns the Google Gemini Generative AI client.
    Uses settings.GEMINI_API_KEY for configuration.
    Returns a mock client if GEMINI_API_KEY is not set.
    """
    if not settings.GEMINI_API_KEY or settings.GEMINI_API_KEY == '':
        logger.warning("GEMINI_API_KEY is not configured. Returning mock Gemini client.")
        class MockPart:
            def __init__(self, text):
                self.text = text
        class MockContent:
            def __init__(self, text):
                self.parts = [MockPart(text)]
        class MockCandidate:
            def __init__(self, text):
                self.content = MockContent(text)
        class MockGenerateContentResponse:
            def __init__(self, text="This is a mock response from the AI."):
                self.candidates = [MockCandidate(text)]
        class MockGenerativeModel:
            def generate_content(self, contents, **kwargs):
                return MockGenerateContentResponse()
        class MockGenai:
            def __init__(self):
                self.GenerativeModel = MockGenerativeModel
                class MockTypes: # Add MockTypes class
                    class GenerationConfig:
                        def __init__(self, **kwargs):
                            pass
                self.types = MockTypes() # Assign MockTypes to .types
        return MockGenai()
        
    genai.configure(api_key=settings.GEMINI_API_KEY)
    return genai

def _get_llm_model_name() -> str:
    return getattr(settings, 'GEMINI_MODEL', 'gemini-1.5-flash-latest')