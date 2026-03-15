from langchain_google_genai import ChatGoogleGenerativeAI
from langchain.chains import LLMChain
from langchain.prompts import PromptTemplate
from src.config import settings


def get_llm() -> ChatGoogleGenerativeAI:
    """Initialize and return Gemini LLM instance."""
    return ChatGoogleGenerativeAI(
        model=settings.LLM_MODEL,
        google_api_key=settings.GEMINI_API_KEY,
        temperature=0.7,
    )


def get_llm_chain(prompt_template: str) -> LLMChain:
    """Create an LLM chain with the given prompt template."""
    llm = get_llm()
    prompt = PromptTemplate(
        input_variables=["input"],
        template=prompt_template,
    )
    return LLMChain(llm=llm, prompt=prompt)
