from urllib.request import urlopen
from bs4 import BeautifulSoup
page = urlopen("https://www.pciconcursos.com.br/concursos/sudeste/")
soup = BeautifulSoup(page, "html.parser")

concursos = soup.find_all("div", class_="da")

if concursos:
    for concurso in concursos:
        print(concurso.get_text())
else:
    print("Nenhum concurso encontrado")
