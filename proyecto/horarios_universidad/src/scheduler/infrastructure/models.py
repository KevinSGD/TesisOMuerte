# src/scheduler/infrastructure/models.py
from sqlalchemy import Column, Integer, String, Float, ForeignKey, create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship

Base = declarative_base()


class Materia(Base):
    __tablename__ = "materias"

    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String, unique=True, index=True, nullable=False)
    creditos = Column(Integer, nullable=False, default=1)
    grupos = Column(Integer, nullable=False, default=1)
    categoria = Column(String, nullable=False)

    # Relación con profesores
    profesores = relationship("Profesor", back_populates="materia")

    def to_dict(self):
        return {
            "id": self.id,
            "nombre": self.nombre,
            "creditos": self.creditos,
            "grupos": self.grupos,
            "categoria": self.categoria,
        }


class Profesor(Base):
    __tablename__ = "profesores"

    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String, nullable=False)
    codigo = Column(String, unique=True, index=True, nullable=False)
    materia_id = Column(Integer, ForeignKey("materias.id"), nullable=False)

    # Relación con materia
    materia = relationship("Materia", back_populates="profesores")

    def to_dict(self):
        return {
            "id": self.id,
            "nombre": self.nombre,
            "codigo": self.codigo,
            "materia_id": self.materia_id,
        }
