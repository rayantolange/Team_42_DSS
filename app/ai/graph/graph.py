# app/ai/graph/graph.py

from functools import partial
from sqlalchemy.orm import Session
from langgraph.graph import StateGraph, END

from app.ai.graph.state import RAGState
from app.ai.graph.nodes import retrieve_vector , synthesize, rerank_results,query_graph

def build_rag_graph():
    graph = StateGraph(RAGState)
    graph.add_node("retrieve_vector", retrieve_vector)
    graph.add_node("rerank_results", rerank_results)
    graph.add_node("query_graph", query_graph)
    graph.add_node("synthesize", synthesize)
    graph.set_entry_point("retrieve_vector")
    graph.add_edge("retrieve_vector", "rerank_results")
    graph.add_edge("rerank_results", "query_graph")
    graph.add_edge("query_graph", "synthesize")
    graph.add_edge("synthesize", END)
    return graph.compile()