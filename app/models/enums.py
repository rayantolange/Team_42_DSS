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
    problem_statement = "problem_statement"
    decision_desc = "decision_desc"
    document_chunk = "document_chunk"
    outcome_desc = "outcome_desc"
    strategy_description = "strategy_description"
    constraint_description = "constraint_description"