from urllib.request import urlopen
from bs4 import BeautifulSoup
page = urlopen("https://www.pciconcursos.com.br/concursos/sudeste/")
soup = BeautifulSoup(page, "html.parser")

concursos = soup.find_all("div", class_="da")

if concursos:
    numeroConcurso = concursos[0].text
    for i in range(len(concursos)):
        print(concursos[i].get_text(strip=True))
        print("-------------------------------------------------------------------------")
else:
    print("Nenhum concurso encontrado")
