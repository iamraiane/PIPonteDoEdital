import re
from datetime import datetime
from urllib.request import urlopen

from bs4 import BeautifulSoup

from conn import conectar

def extrair_concursos_regiao_sudeste():
    url_regiao_sudeste = "https://www.pciconcursos.com.br/concursos/sudeste/"

    pagina_html = urlopen(url_regiao_sudeste)
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

    elementos = conteudo_soup.find_all(
        "div",
        class_=("ua", "na", "da")
    )

    estado_atual = None
    total_concursos = 0

    for elemento in elementos:

        classes = elemento.get("class", [])

# Identifica o estado
        if "ua" in classes:
            div_uf = elemento.find("div", class_="uf")
            if div_uf:
                estado_atual = div_uf.get_text(strip=True)
            else:
                estado_atual = elemento.get("id", "")
            continue

        # Identifica o concurso
        if "na" in classes or "da" in classes:

            titulo_div = elemento.find("div", class_="ca")
            sigla_div = elemento.find("div", class_="cc")
            descricao_div = elemento.find("div", class_="cd")
            data_div = elemento.find("div", class_="ce")

            titulo = (
                titulo_div.get_text(" ", strip=True)
                if titulo_div
                else ""
            )

            sigla = (
                sigla_div.get_text(" ", strip=True)
                if sigla_div
                else ""
            )

            descricao = (
                descricao_div.get_text(" ", strip=True)
                if descricao_div
                else ""
            )

            link = elemento.get("data-url", "")

            data_publicacao_texto = (
                data_div.get_text(" ", strip=True)
                if data_div
                else ""
            )

            # Extrai a data
            busca_data = re.search(
                r"\d{2}/\d{2}/\d{4}",
                data_publicacao_texto
            )

            if busca_data:
                data_extraida = busca_data.group(0)

                data_formatada_banco = datetime.strptime(
                    data_extraida,
                    "%d/%m/%Y"
                ).strftime("%Y-%m-%d")
            else:
                data_formatada_banco = None

            # Dados que serão enviados ao MySQL
            dados_noticia = (
                titulo,
                estado_atual,
                sigla,
                descricao,
                link,
                data_formatada_banco
            )

            # Insere ou atualiza no banco
            cursor_banco.execute(
                comando_sql_upsert,
                dados_noticia
            )

            total_concursos += 1

    # Confirma todas as alterações
    conexao_banco.commit()

    # Fecha a conexão
    cursor_banco.close()
    conexao_banco.close()

    print(
        f"Região Sudeste: {total_concursos} concursos "
        "processados e salvos com sucesso!"
    )

