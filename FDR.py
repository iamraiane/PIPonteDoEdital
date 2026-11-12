import re
from datetime import datetime
from urllib.request import Request, urlopen

from bs4 import BeautifulSoup

from conn import conectar

ESTADOS = {
    "AC": "ACRE", "AL": "ALAGOAS", "AP": "AMAPÁ", "AM": "AMAZONAS",
    "BA": "BAHIA", "CE": "CEARÁ", "DF": "DISTRITO FEDERAL",
    "ES": "ESPÍRITO SANTO", "GO": "GOIÁS", "MA": "MARANHÃO",
    "MT": "MATO GROSSO", "MS": "MATO GROSSO DO SUL", "MG": "MINAS GERAIS",
    "PA": "PARÁ", "PB": "PARAÍBA", "PR": "PARANÁ", "PE": "PERNAMBUCO",
    "PI": "PIAUÍ", "RJ": "RIO DE JANEIRO", "RN": "RIO GRANDE DO NORTE",
    "RS": "RIO GRANDE DO SUL", "RO": "RONDÔNIA", "RR": "RORAIMA",
    "SC": "SANTA CATARINA", "SP": "SÃO PAULO", "SE": "SERGIPE",
    "TO": "TOCANTINS",
}


def texto(linha, seletor):
    tag = linha.select_one(seletor)
    return tag.get_text(" ", strip=True) if tag else ""


def extrair_data(linha, seletor):
    busca = re.search(r"\d{2}/\d{2}/\d{4}", texto(linha, seletor))
    if not busca:
        return None
    return datetime.strptime(busca.group(0), "%d/%m/%Y").strftime("%Y-%m-%d")


def extrair_concursos_fdr():
    url = "https://fdr.com.br/concursos-publicos-abertos/"

    requisicao = Request(
        url,
        headers={
            "User-Agent": (
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                "AppleWebKit/537.36 (KHTML, like Gecko) "
                "Chrome/124.0.0.0 Safari/537.36"
            ),
            "Accept-Language": "pt-BR,pt;q=0.9",
        },
    )

    pagina_html = urlopen(requisicao)
    conteudo_soup = BeautifulSoup(pagina_html, "html.parser")

    conexao_banco, cursor_banco = conectar()

    comando_sql_upsert = """
        INSERT INTO notices (
            title, state, state_code, description, link,
            publication_date, deadline_date
        )
        VALUES (%s, %s, %s, %s, %s, %s, %s)
        ON DUPLICATE KEY UPDATE
            title = VALUES(title),
            state = VALUES(state),
            state_code = VALUES(state_code),
            description = VALUES(description),
            publication_date = VALUES(publication_date),
            deadline_date = VALUES(deadline_date)
    """

    total_novos = 0
    total_atualizados = 0
    total_iguais = 0
    total_erros = 0

    for linha in conteudo_soup.select("table tbody tr"):

        link_tag = linha.select_one("a.fdrc-c")
        if not link_tag:
            continue

        try:
            titulo = texto(link_tag, ".fdrc-c__titulo")
            link = link_tag.get("href", "")

            sigla = texto(linha, "td.c-uf").upper()
            estado = ESTADOS.get(sigla, sigla)

            cidade = texto(linha, "td.c-cidade")
            cargos = texto(linha, "td.c-cargos")
            salario = texto(linha, "td.c-salario")
            descricao = " - ".join(p for p in [cidade, cargos, salario] if p)

            data_inicio = extrair_data(linha, "td.c-inicio")
            data_fim = extrair_data(linha, "td.c-fim")

            cursor_banco.execute(
                comando_sql_upsert,
                (titulo, estado, sigla, descricao, link, data_inicio, data_fim),
            )

            if cursor_banco.rowcount == 1:
                total_novos += 1
            elif cursor_banco.rowcount == 2:
                total_atualizados += 1
            else:
                total_iguais += 1

        except Exception as erro:
            total_erros += 1
            print(f"Erro na linha ({link}): {erro}", flush=True)

    conexao_banco.commit()
    cursor_banco.close()
    conexao_banco.close()

    print(
        f"FDR: {total_novos} novos, {total_atualizados} atualizados, "
        f"{total_iguais} sem mudança, {total_erros} erros.",
        flush=True,
    )


if __name__ == "__main__":
    extrair_concursos_fdr()