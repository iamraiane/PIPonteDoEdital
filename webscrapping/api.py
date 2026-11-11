import os
import threading

from fastapi import BackgroundTasks, FastAPI, Header, HTTPException

from app import rodar_todos

app = FastAPI()

API_KEY = os.getenv("SCRAPER_API_KEY")
estado = {"rodando": False}
trava = threading.Lock()


def executar():
    try:
        rodar_todos()
    finally:
        estado["rodando"] = False


@app.post("/scrape", status_code=202)
def iniciar(background_tasks: BackgroundTasks, x_api_key: str = Header(None)):
    if not API_KEY or x_api_key != API_KEY:
        raise HTTPException(status_code=401, detail="Não autorizado")

    with trava:
        if estado["rodando"]:
            raise HTTPException(status_code=409, detail="Já está em execução")
        estado["rodando"] = True

    background_tasks.add_task(executar)
    return {"message": "Scraper iniciado"}


@app.get("/status")
def status(x_api_key: str = Header(None)):
    if not API_KEY or x_api_key != API_KEY:
        raise HTTPException(status_code=401, detail="Não autorizado")
    return {"rodando": estado["rodando"]}