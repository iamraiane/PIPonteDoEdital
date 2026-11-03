import re
from urllib.request import urlopen

from bs4 import BeautifulSoup

from conn import conectar


def extrair_concursos_amapa():
    url_amapa = "https://concursosnobrasil.com/concursos/am/"

    pagina_html = urlopen(url_amapa)
    conteudo_soup = BeautifulSoup(pagina_html, "html.parser")

    conexao_banco, cursor_banco = conectar()

    comando_sql_upsert = """
        INSERT INTO notices (
            title,
            state,
            state_code,
            description,
            link,
            publication_date
        )
        VALUES (%s, %s, %s, %s, %s, %s)
        ON DUPLICATE KEY UPDATE
            title = VALUES(title),
            state = VALUES(state),
            state_code = VALUES(state_code),
            description = VALUES(description),
            publication_date = VALUES(publication_date);
    """

    estado_atual = "AMAPA"
    sigla = "AM"
    total_concursos = 0

    for linha in conteudo_soup.select("table tbody tr"):

        titulo_link = linha.find("a")
        if not titulo_link:
            continue

        titulo = titulo_link.get_text(strip=True)              # "ESUDPAM"
        link = titulo_link.get("href", "")
        descricao = titulo_link.get("title", "") or titulo     # "ESUDPAM abre novo processo..."

        busca_data = re.search(r"/(\d{4})/(\d{2})/(\d{2})/", link)
        data_formatada_banco = (
            "-".join(busca_data.groups()) if busca_data else None
        )

        cursor_banco.execute(
            comando_sql_upsert,
            (titulo, estado_atual, sigla, descricao, link, data_formatada_banco),
        )
        total_concursos += 1

    conexao_banco.commit()
    cursor_banco.close()
    conexao_banco.close()

    print(f"amapa: {total_concursos} concursos processados e salvos com sucesso!")


if __name__ == "__main__":
    extrair_concursos_amapa()