# src/scheduler/infrastructure/models.py
from sqlalchemy import Column, Integer, String, Text, ForeignKey
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
    # Primary materia FK (first assigned materia)
    materia_id = Column(Integer, ForeignKey("materias.id"), nullable=True)
    # All assigned materias stored as JSON string: '["Materia A","Materia B"]'
    materia_ids_json = Column(Text, nullable=True)

    materia = relationship("Materia", back_populates="profesores")

    def to_dict(self):
        return {
            "id": self.id,
            "nombre": self.nombre,
            "codigo": self.codigo,
            "materia_id": self.materia_id,
            "materia_ids_json": self.materia_ids_json,
        }
