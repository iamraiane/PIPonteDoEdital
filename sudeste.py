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

    elementos_titulo = conteudo_soup.find_all("div", class_="cc")
    elementos_descricao = conteudo_soup.find_all("div", class_="cd")
    elementos_link = conteudo_soup.find_all("div", class_="da")
    elementos_data_publicacao = conteudo_soup.find_all("div", class_="ce")

    lista_titulos = [titulo.get_text(strip=True) for titulo in elementos_titulo]
    lista_descricoes = [descricao.get_text(strip=True) for descricao in elementos_descricao]
    lista_links = [link.get_text(strip=True) for link in elementos_link]
    lista_datas_publicacao = [data.get_text(strip=True) for data in elementos_data_publicacao]

    print("Total de títulos encontrados:", len(lista_titulos))
    print("Total de descrições encontradas:", len(lista_descricoes))
    print("Total de links encontrados:", len(lista_links))
    print("Total de datas de publicação encontradas:", len(lista_datas_publicacao))

    comando_sql_upsert = """
        INSERT INTO notices (title, description, link, publication_date)
        VALUES (%s, %s, %s, %s)
        ON DUPLICATE KEY UPDATE
            title = VALUES(title),
            description = VALUES(description),
            publication_date = VALUES(publication_date);
    """

    for titulo, descricao, link, data_publicacao_texto in zip(
        lista_titulos, 
        lista_descricoes, 
        lista_links, 
        lista_datas_publicacao
    ):
        busca_data = re.search(r"\d{2}/\d{2}/\d{4}", data_publicacao_texto)
        
        if busca_data:
            data_extraida = busca_data.group(0)
            data_formatada_banco = datetime.strptime(data_extraida, "%d/%m/%Y").strftime("%Y-%m-%d")
        else:
            data_formatada_banco = None

        dados_noticia = (titulo, descricao, link, data_formatada_banco)
        cursor_banco.execute(comando_sql_upsert, dados_noticia)

    conexao_banco.commit()
    conexao_banco.close()

    print("Região Sudeste: Dados processados e salvos com sucesso!")