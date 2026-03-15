# Gemini LLM Integration Module

This module provides easy-to-use Gemini API integration for the KSE Hackathon project.

## Setup

1. Add your Google Gemini API key to `.env`:
```bash
GEMINI_API_KEY=your-google-genai-api-key
```

2. The default model is `gemini-1.5-pro`. To change it, update `.env`:
```bash
LLM_MODEL=gemini-2.0-flash  # or another supported model
```

## Usage

### Basic LLM Instance

```python
from src.llm import get_llm

# Get LLM instance
llm = get_llm()

# Invoke directly
response = await llm.ainvoke("Hello, how are you?")
print(response.content)
```

### Using LLM Chains with Prompts

```python
from src.llm import get_llm_chain

# Create a chain with a prompt template
chain = get_llm_chain("Analyze this text: {input}")

# Use it
result = await chain.ainvoke({"input": "Some user-provided text"})
print(result["text"])
```

### Real-World Examples in Code

#### Example 1: Email Validation (AuthService)
```python
# backend/src/auth/services.py
async def _validate_email_with_gemini(self, email: str) -> dict:
    chain = get_llm_chain(
        "Analyze this email address and provide brief validation feedback: {input}"
    )
    result = await chain.ainvoke({"input": email})
    return {"email": email, "validation": result.get("text", "")}
```

Usage in registration:
```python
await self._validate_email_with_gemini(user_dto.email)
```

#### Example 2: Content Analysis
```python
from src.llm import get_llm_chain

# Analyze user-generated content
chain = get_llm_chain(
    "Classify this content as safe/warning/unsafe: {input}"
)
result = await chain.ainvoke({"input": user_content})
```

#### Example 3: Custom Prompt with Multiple Variables
```python
from langchain.prompts import PromptTemplate
from src.llm import get_llm

llm = get_llm()

# For complex prompts with multiple variables
prompt = PromptTemplate(
    input_variables=["topic", "context"],
    template="Generate content about {topic} in this context: {context}"
)

chain = prompt | llm
response = await chain.ainvoke({
    "topic": "user engagement",
    "context": "social platform"
})
```

## Configuration

See `backend/src/config.py` for configuration options:
- `GEMINI_API_KEY` - Your Google API key (required)
- `LLM_MODEL` - Model name (default: "gemini-1.5-pro")

## Error Handling

The module includes error handling. Always wrap calls in try-except:

```python
try:
    result = await chain.ainvoke({"input": data})
except Exception as e:
    logger.error(f"LLM call failed: {e}")
    # Handle gracefully - don't break user flow
```

## Performance Notes

- Async operations are used for non-blocking calls
- Default temperature is 0.7 (can be adjusted in `gemini.py`)
- Gemini API has rate limits - implement caching/throttling if needed

## Extending the Module

To add new prompt templates, create them in the `llm/` directory and export them:

```python
# backend/src/llm/prompts.py
MODERATION_PROMPT = "Analyze this for harmful content: {input}"
SUMMARY_PROMPT = "Summarize this text in 2 sentences: {input}"

# backend/src/llm/__init__.py
from .prompts import MODERATION_PROMPT, SUMMARY_PROMPT
```
