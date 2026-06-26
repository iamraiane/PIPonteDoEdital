from urllib.request import urlopen
from conn import conectar
from bs4 import BeautifulSoup
from datetime import datetime


def scrape_norte():
    page = urlopen("https://www.pciconcursos.com.br/concursos/norte/")
    soup = BeautifulSoup(page, "html.parser")

    conn, cursor = conectar()

    titles = soup.find_all("div", class_="ua")
    descriptions = soup.find_all("div", class_="cd")
    links = soup.find_all("div", class_="na")
    publication_date = soup.find_all("div", class_="ce")
    
    
    umPorUmTitle = [t.get_text(strip=True) for t in titles]
    umPorUmDescription = [d.get_text(strip=True) for d in descriptions]
    umPorUmLink = [l.get_text(strip=True) for l in links]
    umPorUmPublicationDate = [pd.get_text(strip=True) for pd in publication_date]
    print("Total title encontrados: ", len(umPorUmTitle))
    print("Total descrições encontradas: ", len(umPorUmDescription))
    print("Total links encontrados: ", len(umPorUmLink))
    print("Total datas postadas encontradas: ", len(umPorUmPublicationDate))
    
    for title, description, link, publication_date in zip(umPorUmTitle, umPorUmDescription, umPorUmLink, umPorUmPublicationDate):
        # print("Título: ", title)
        # print("Descrição: ", description)
        # print("Link: ", link)
        # print("Data Postada: ", publication_date)
        data_convertida = datetime.strptime(publication_date, "%d/%m/%Y").strftime("%Y-%m-%d")
        cursor.execute(
            "INSERT INTO notices(title, description, link, publication_date) VALUES (%s, %s, %s, %s)",
            (title, description, link, data_convertida)
        )
    
    conn.commit()
    conn.close()
    
    print("Dados salvos com sucesso!")