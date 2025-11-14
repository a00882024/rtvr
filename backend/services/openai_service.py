import os
from openai import OpenAI
from typing import Optional

class OpenAIService:
    """
    Service for interacting with OpenAI API to generate document summaries
    """

    def __init__(self):
        """
        Initialize OpenAI client with API key from environment
        """
        api_key = os.getenv('OPENAI_API_KEY')
        if not api_key:
            raise ValueError("OPENAI_API_KEY environment variable is not set")

        self.client = OpenAI(api_key=api_key)
        self.model = "gpt-4o-mini"

    def generate_summary(self, content: str, max_tokens: int = 500) -> Optional[str]:
        """
        Generate a summary of the provided content using OpenAI API

        param content: The text content to summarize
        param max_tokens: Maximum tokens for the summary (default: 500 for a couple paragraphs)

        return: Generated summary text or None if generation fails
        """
        if not content or not content.strip():
            raise ValueError("Content cannot be empty")

        # Check if content is too short to summarize
        if len(content.strip()) < 100:
            return "Document is too short to generate a meaningful summary."

        try:
            system_prompt = (
                "You are a helpful assistant that creates concise but informative summaries. "
                "Generate a summary that captures the main points and key information from the document. "
                "The summary should be 2-3 paragraphs long."
            )

            user_prompt = f"Please summarize the following document:\n\n{content}"

            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                max_tokens=max_tokens,
                temperature=0.5,  # Balanced between creativity and consistency
                timeout=30  # 30 seconds timeout
            )

            summary = response.choices[0].message.content
            return summary.strip() if summary else None

        except Exception as e:
            # Log the error and re-raise with more context
            print(f"Error generating summary with OpenAI: {str(e)}")
            raise Exception(f"Failed to generate summary: {str(e)}")

# Singleton instance
openai_service = OpenAIService()
