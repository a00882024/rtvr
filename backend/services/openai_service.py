import os
import json
import tiktoken
from openai import OpenAI
from typing import Optional, List, Dict

class OpenAIService:
    """
    Service for interacting with OpenAI API to generate document summaries and questions
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

        # Get encoding for token counting
        # gpt-4o-mini doesn't have direct mapping yet, so use fallback
        try:
            self.encoding = tiktoken.encoding_for_model(self.model)
        except KeyError:
            # Fallback to cl100k_base encoding (used by GPT-4 and compatible models)
            self.encoding = tiktoken.get_encoding("cl100k_base")

        self.max_tokens_per_chunk = 3500  # Safe limit for chunking (leaves room for response)

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

    def count_tokens(self, text: str) -> int:
        """
        Count the number of tokens in a text string

        param text: The text to count tokens for
        return: Number of tokens
        """
        return len(self.encoding.encode(text))

    def chunk_content(self, content: str) -> List[str]:
        """
        Split content into chunks that fit within token limits

        param content: The text content to chunk
        return: List of text chunks
        """
        # Split content into paragraphs
        paragraphs = content.split('\n\n')

        chunks = []
        current_chunk = []
        current_tokens = 0

        for paragraph in paragraphs:
            paragraph_tokens = self.count_tokens(paragraph)

            # If single paragraph exceeds limit, split by sentences
            if paragraph_tokens > self.max_tokens_per_chunk:
                # If we have accumulated content, save it first
                if current_chunk:
                    chunks.append('\n\n'.join(current_chunk))
                    current_chunk = []
                    current_tokens = 0

                # Split long paragraph by sentences
                sentences = paragraph.split('. ')
                sentence_chunk = []
                sentence_tokens = 0

                for sentence in sentences:
                    sentence_token_count = self.count_tokens(sentence)
                    if sentence_tokens + sentence_token_count > self.max_tokens_per_chunk:
                        if sentence_chunk:
                            chunks.append('. '.join(sentence_chunk) + '.')
                        sentence_chunk = [sentence]
                        sentence_tokens = sentence_token_count
                    else:
                        sentence_chunk.append(sentence)
                        sentence_tokens += sentence_token_count

                if sentence_chunk:
                    chunks.append('. '.join(sentence_chunk) + '.')

            # Normal paragraph processing
            elif current_tokens + paragraph_tokens > self.max_tokens_per_chunk:
                # Save current chunk and start new one
                if current_chunk:
                    chunks.append('\n\n'.join(current_chunk))
                current_chunk = [paragraph]
                current_tokens = paragraph_tokens
            else:
                current_chunk.append(paragraph)
                current_tokens += paragraph_tokens

        # Add remaining content
        if current_chunk:
            chunks.append('\n\n'.join(current_chunk))

        return chunks if chunks else [content]

    def generate_questions_for_chunk(self, content: str, num_questions: int, chunk_index: int = 0) -> List[Dict]:
        """
        Generate multiple choice questions for a single chunk of content

        param content: The text content to generate questions from
        param num_questions: Number of questions to generate
        param chunk_index: Index of this chunk (for tracking)
        return: List of question dictionaries
        """
        if not content or not content.strip():
            raise ValueError("Content cannot be empty")

        system_prompt = """You are an expert educator creating high-quality multiple choice questions.
Generate questions that test understanding and comprehension of the material.
Ensure that:
- Questions are clear and unambiguous
- All 4 answer options are plausible
- Only one option is clearly correct
- Distractors (wrong answers) are reasonable but definitively incorrect
- Questions test understanding, not just recall of facts
- Each question includes a brief explanation of why the correct answer is right

Return your response as a JSON object with this exact structure:
{
  "questions": [
    {
      "question_text": "The question here?",
      "option_a": "First option",
      "option_b": "Second option",
      "option_c": "Third option",
      "option_d": "Fourth option",
      "correct_answer": "A",
      "explanation": "Brief explanation of why this answer is correct"
    }
  ]
}"""

        user_prompt = f"""Based on the following content, generate {num_questions} multiple choice questions.

Content:
{content}

Generate exactly {num_questions} questions in JSON format."""

        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                response_format={"type": "json_object"},
                temperature=0.7,
                timeout=60
            )

            result = json.loads(response.choices[0].message.content)
            questions = result.get('questions', [])

            # Add chunk_index to each question
            for question in questions:
                question['chunk_index'] = chunk_index

            return questions

        except Exception as e:
            print(f"Error generating questions with OpenAI: {str(e)}")
            raise Exception(f"Failed to generate questions: {str(e)}")

    def generate_questions(self, content: str, num_questions: int = 5) -> List[Dict]:
        """
        Generate multiple choice questions from content, handling chunking if necessary

        param content: The text content to generate questions from
        param num_questions: Number of questions to generate (default: 5)
        return: List of question dictionaries
        """
        if not content or not content.strip():
            raise ValueError("Content cannot be empty")

        if len(content.strip()) < 100:
            raise ValueError("Document is too short to generate meaningful questions")

        # Count tokens and determine if chunking is needed
        token_count = self.count_tokens(content)

        if token_count <= self.max_tokens_per_chunk:
            # Content fits in one chunk, generate all questions at once
            return self.generate_questions_for_chunk(content, num_questions, 0)

        # Content needs to be chunked
        chunks = self.chunk_content(content)
        num_chunks = len(chunks)

        print(f"Content split into {num_chunks} chunks for question generation")

        # Distribute questions across chunks proportionally
        questions_per_chunk = [num_questions // num_chunks] * num_chunks
        remainder = num_questions % num_chunks

        # Distribute remainder questions to first chunks
        for i in range(remainder):
            questions_per_chunk[i] += 1

        # Generate questions for each chunk
        all_questions = []
        for i, chunk in enumerate(chunks):
            if questions_per_chunk[i] > 0:
                try:
                    chunk_questions = self.generate_questions_for_chunk(
                        chunk,
                        questions_per_chunk[i],
                        i
                    )
                    all_questions.extend(chunk_questions)
                except Exception as e:
                    print(f"Error generating questions for chunk {i}: {str(e)}")
                    # Continue with other chunks even if one fails

        # Deduplicate questions based on similarity of question text
        deduped_questions = self._deduplicate_questions(all_questions)

        # If we have more than requested due to deduplication issues, trim
        if len(deduped_questions) > num_questions:
            deduped_questions = deduped_questions[:num_questions]

        return deduped_questions

    def _deduplicate_questions(self, questions: List[Dict]) -> List[Dict]:
        """
        Remove duplicate or very similar questions

        param questions: List of question dictionaries
        return: Deduplicated list of questions
        """
        if not questions:
            return []

        unique_questions = []
        seen_texts = set()

        for question in questions:
            # Normalize question text for comparison
            normalized_text = question.get('question_text', '').lower().strip()

            # Simple deduplication based on exact text match
            # Could be enhanced with similarity metrics if needed
            if normalized_text and normalized_text not in seen_texts:
                seen_texts.add(normalized_text)
                unique_questions.append(question)

        return unique_questions

# Singleton instance
openai_service = OpenAIService()
