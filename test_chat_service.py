# test_chat_service.py
# Run from your project root: python test_chat_service.py

from app.database import SessionLocal
from app.models.user import User
from app.models.enums import ChatModeEnum
from app.services.chat_service import get_chat_service

session = SessionLocal()

try:
    test_user = session.query(User).first()
    if not test_user:
        raise RuntimeError("No users in the DB — create one first.")

    print(f"Testing as: user_id={test_user.user_id}, "
          f"role={test_user.role}, department_id={test_user.department_id}")

    chat_service = get_chat_service(session)

    # -------------------------------------------------------
    # Step 1: create a thread
    # -------------------------------------------------------
    thread = chat_service.create_thread(
        user_id=test_user.user_id,
        title="Test thread — travel budget",
    )
    print(f"\nCreated thread_id={thread.thread_id}")

    # -------------------------------------------------------
    # Step 2: rag_search message
    # -------------------------------------------------------
    print("\n" + "=" * 60)
    print("Sending RAG SEARCH message...")
    print("=" * 60)

    search_query = "What did the finance committee decide about travel spending?"

    search_reply = chat_service.send_message(
        thread_id=thread.thread_id,
        content=search_query,
        mode=ChatModeEnum.rag_search,
        current_user=test_user,
    )

    print(f"\nUser:      {search_query}")
    print(f"Assistant: {search_reply.content}")
    print(f"\nCitations ({len(search_reply.citations)}):")
    for i, c in enumerate(search_reply.citations, 1):
        print(f"  --- Citation {i} ---")
        print(f"  source_type:  {c.source_type}")
        print(f"  reference_id: {c.reference_id}")
        print(f"  snippet:      {c.snippet[:80]}...")

    # -------------------------------------------------------
    # Step 3: chat (continue chatting) — should carry forward
    # the rag_search context without re-retrieving
    # -------------------------------------------------------
    print("\n" + "=" * 60)
    print("Sending CHAT (continue chatting) message...")
    print("=" * 60)

    followup = "What was the original percentage before it got revised?"

    chat_reply = chat_service.send_message(
        thread_id=thread.thread_id,
        content=followup,
        mode=ChatModeEnum.chat,
        current_user=test_user,
    )

    print(f"\nUser:      {followup}")
    print(f"Assistant: {chat_reply.content}")
    print(f"Citations: {chat_reply.citations}  (expected: [])")

    # -------------------------------------------------------
    # Step 4: reload thread history from scratch — confirms
    # citations correctly rehydrate from MessageCitation rows,
    # not just from in-memory state set during send_message
    # -------------------------------------------------------
    print("\n" + "=" * 60)
    print("Reloading thread history from DB...")
    print("=" * 60)

    history = chat_service.get_thread_messages(thread.thread_id, user_id=test_user.user_id)

    print(f"\n{len(history)} messages in thread:\n")
    for m in history:
        print(f"  [{m.role.value:9s}] ({m.mode.value:10s}) {m.content[:80]}")
        if m.citations:
            print(f"      -> {len(m.citations)} citation(s) rehydrated")

finally:
    session.close()