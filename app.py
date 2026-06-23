from urllib.request import urlopen
from conn import conectar
from bs4 import BeautifulSoup
page = urlopen("https://www.pciconcursos.com.br/concursos/sudeste/")
soup = BeautifulSoup(page, "html.parser")

# conn, cursor = conectar()

concursos = soup.find_all("div", class_="da")
totalConcursos = len(concursos)
umPorUm = []

if concursos:
    numeroConcurso = concursos[0].text
    for i in range(len(concursos)):
        umPorUm.append(concursos[i].get_text(strip=True))

else:
    print("Nenhum concurso encontrado")


print("Total de concursos encontrados: ", totalConcursos)
print("Concursos encontrados: ", umPorUm[0:3])




# cursor.execute("INSERT INTO notices(title,description,link) VALUES (%s,%s,%s)", (title, description, link)) 
#conn.commit()
#conn.close()