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
