from enum import Enum


class Status(str, Enum):
    TODO = "TODO"
    IN_PROGRESS = "IN-PROGRESS"
    DONE = "DONE"
    ERROR = "ERROR"
