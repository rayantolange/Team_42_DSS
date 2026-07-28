# app/ai/llm_client.py

import os
from groq import Groq

_client: Groq | None = None


def get_client() -> Groq:
    """
    Loads the Groq client once and caches it at module level.
    """
    global _client
    if _client is None:
        _client = Groq(api_key=os.getenv("GROQ_API_KEY"))
    return _client


def generate_answer(system_prompt: str, user_prompt: str) -> str:
    client = get_client()

    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
        temperature=0.2,  # low temperature — grounded factual answers, not creative
    )

    return response.choices[0].message.content