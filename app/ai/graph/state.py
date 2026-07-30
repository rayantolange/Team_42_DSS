# app/ai/graph/state.py

from typing import TypedDict, Optional, List


class CurrentUserInfo(TypedDict):
    user_id: int
    role: str
    department_id: int


class RAGState(TypedDict):
    query: str
    current_user: CurrentUserInfo
    vector_results: Optional[List[dict]]
    graph_result: Optional[dict]
    answer: Optional[str]
    citations: Optional[List[dict]]