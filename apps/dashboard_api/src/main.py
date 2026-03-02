from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from src.api.agents import router as agents_router
from src.api.audit import router as audit_router
from src.api.runs import router as runs_router
from src.api.tickets import router as tickets_router
from src.core.config import settings

app = FastAPI(title=settings.app_name, version=settings.version)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get('/health')
def health():
    return {'status': 'ok'}


@app.get('/version')
def version():
    return {'version': settings.version}


app.include_router(tickets_router)
app.include_router(agents_router)
app.include_router(runs_router)
app.include_router(audit_router)
