import time
from ortools.sat.python import cp_model
from core.model_builder import build_model

def solve(cfg, data):
    model, meta = build_model(cfg, data)

    solver = cp_model.CpSolver()
    solver.parameters.max_time_in_seconds = cfg["max_time_seconds"]

    t0 = time.time()
    status = solver.Solve(model)
    t1 = time.time()

    return {
        "solver": solver,
        "status": status,
        "elapsed": round(t1 - t0, 3),
        "meta": meta,
        "num_vars": len(model.Proto().variables),
        "num_constraints": len(model.Proto().constraints),
    }