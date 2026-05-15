# src/scheduler/interfaces/api/schemas.py
from pydantic import BaseModel, Field
from typing import Any, Dict, List, Optional, Union


class MateriaCreate(BaseModel):
    nombre: str = Field(..., min_length=1)
    creditos: int = Field(..., ge=1, le=4)
    grupos: int = Field(..., ge=1)
    categoria: str = Field(..., min_length=1)


class MateriaResponse(MateriaCreate):
    id: int

    class Config:
        from_attributes = True


class ProfesorCreate(BaseModel):
    nombre: str = Field(..., min_length=1)
    codigo: str = Field(..., min_length=1)
    # materia_id kept for backwards compatibility
    materia_id: Optional[Union[int, str]] = Field(default=None)
    # materia_ids: list of materia names or IDs (new, multi-materia support)
    materia_ids: List[Union[int, str]] = Field(default_factory=list)


class ProfesorResponse(BaseModel):
    id: int
    nombre: str
    codigo: str
    materia_id: Optional[int] = None
    materia_ids_json: Optional[str] = None

    class Config:
        from_attributes = True


class DataSaveRequest(BaseModel):
    materias: List[MateriaCreate] = Field(default_factory=list)
    profesores: List[ProfesorCreate] = Field(default_factory=list)
    clear_existing: bool = False


class EventoItem(BaseModel):
    id: str
    materiaId: Optional[Any] = None
    profesorId: Optional[Any] = None
    salon: Optional[str] = ""
    grupo: Optional[int] = 1
    dayIndex: int
    hourIndex: int


class VerifyRequest(BaseModel):
    eventos: List[EventoItem] = Field(default_factory=list)
