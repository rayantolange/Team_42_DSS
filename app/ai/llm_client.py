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

def generate_chat_completion(messages: list[dict]) -> str:
    """
    Like generate_answer, but takes a full messages list (system + real
    multi-turn history) instead of a single system/user pair. Needed for
    chat mode, which has actual conversational history to send — unlike
    synthesis, which is a single-shot grounded Q&A with no prior turns.
    """
    client = get_client()

    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=messages,
        temperature=0.4,  # a bit higher than synthesis's 0.2 — conversational
                          # replies are allowed some natural looseness; still
                          # low enough to stay grounded when context is present
    )

    return response.choices[0].message.content