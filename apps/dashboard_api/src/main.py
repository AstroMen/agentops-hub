from fastapi import FastAPI

from src.api.audit import router as audit_router
from src.api.runs import router as runs_router
from src.api.tickets import router as tickets_router
from src.core.config import settings

app = FastAPI(title=settings.app_name, version=settings.version)


@app.get('/health')
def health():
    return {'status': 'ok'}


@app.get('/version')
def version():
    return {'version': settings.version}


app.include_router(tickets_router)
app.include_router(runs_router)
app.include_router(audit_router)
