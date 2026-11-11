# Web Scraping — editais

Coletor em Python que extrai editais de concursos públicos e grava na tabela `notices` do mesmo banco MySQL usado pelo backend (ver [`../Back`](../Back)).

As fontes são:

- **pciconcursos.com.br** — uma página por região do país (`PciConcursos/`)
- **concursosnobrasil.com** — uma página por estado (`ConcursosNoBrasil/`)

A escrita é um **upsert** (`INSERT ... ON DUPLICATE KEY UPDATE`), então rodar de novo não duplica editais.

## Tecnologias

- Python 3.12
- BeautifulSoup4 (parse do HTML)
- mysql-connector-python (MySQL)
- python-dotenv (variáveis de ambiente)

## Como rodar

```bash
cd webscrapping

# ambiente virtual
python -m venv venv
venv\Scripts\activate          # Windows
# source venv/bin/activate     # Linux/Mac

pip install -r requirements.txt

# copie e preencha as credenciais do banco (mesmas do Back/.env)
cp .env.example .env

python app.py
```

`app.py` executa todos os coletores em sequência (regiões e estados).

uvicorn api:app --reload = serve para deixar o servidor local ligado

cloudflared tunnel --url http://localhost:8000 = para o servidor "local" rodar na web para funcionar com meu back que está rodando na web

## Variáveis de ambiente (`.env`)

| Variável | Descrição |
|---|---|
| `DB_HOST` | Host do MySQL |
| `DB_PORT` | Porta do MySQL (usada por `conn.py`; adicione ao seu `.env`) |
| `DB_USER` | Usuário do MySQL |
| `DB_PASSWORD` | Senha do MySQL |
| `DB_NAME` | Banco de dados (o mesmo do backend) |

O arquivo `conn.py` centraliza a conexão (`conectar()`), que todos os scripts usam.

## Estrutura

```
webscrapping/
├── app.py                  # orquestra: chama todos os coletores
├── conn.py                 # conexão com o MySQL (usa o .env)
├── requirements.txt
├── PciConcursos/           # pciconcursos.com.br
│   ├── norte.py  nordeste.py  centro_oeste.py  sul.py  sudeste.py
└── ConcursosNoBrasil/      # concursosnobrasil.com (uma pasta por região)
    ├── norte/  nordeste/  centro_oeste/  sul/  sudeste/
    │   └── <estado>.py     # ex.: sul/parana.py
```

## Agendamento (GitHub Actions)

O workflow [`.github/workflows/Disparador.yml`](.github/workflows/Disparador.yml) roda o coletor automaticamente:

- **Todo dia às 6h** (cron `0 6 * * *`, horário UTC)
- **Manualmente** pela aba *Actions* → *Run workflow*

Ele instala o Python 3.12, as dependências e executa `python app.py`, injetando as credenciais do banco pelos **secrets** do repositório: `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `DB_PORT`.

## Nota

A tabela `notices` é definida pela entidade do TypeORM no backend (`synchronize: true`), então o banco precisa existir e estar acessível antes da primeira execução.
