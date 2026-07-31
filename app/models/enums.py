import enum


class DecisionStatusEnum(str, enum.Enum):
    draft = "draft"
    approved = "approved"
    implemented = "implemented"
    completed = "completed"
    cancelled = "cancelled"

class OutcomeStatusEnum(str, enum.Enum):
    successful = "successful"
    partially_successful = "partially_successful"
    failed = "failed"

class UserRoleEnum(str, enum.Enum):
    admin = "admin"
    principal = "principal"
    hod = "hod"
    faculty = "faculty"
    staff = "staff"

class SourceTypeEnum(str, enum.Enum):
    decision = "decision"
    strategy = "strategy"
    constraint = "constraint"
    outcome = "outcome"
    document_chunk = "document_chunk"

class ChatRoleEnum(str, enum.Enum):
    user = "user"
    assistant = "assistant"


class ChatModeEnum(str, enum.Enum):
    chat = "chat"
    rag_search = "rag_search"

class DocumentStatusEnum(str, enum.Enum):
    pending = "pending"
    processing = "processing"
    completed = "completed"
    failed = "failed"