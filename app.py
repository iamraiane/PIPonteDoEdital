from PciConcursos.norte import extrair_concursos_regiao_norte
from PciConcursos.sudeste import extrair_concursos_regiao_sudeste
from PciConcursos.sul import extrair_concursos_regiao_sul
from PciConcursos.nordeste import extrair_concursos_regiao_nordeste
from PciConcursos.centro_oeste import extrair_concursos_regiao_centro_oeste

from ConcursosNoBrasil.sul.parana import extrair_concursos_parana
from ConcursosNoBrasil.sul.santa_catarina import extrair_concursos_santaCatarina
from ConcursosNoBrasil.sul.rio_grande_do_sul import extrair_concursos_rio_grande_do_sul
from ConcursosNoBrasil.sudeste.espirito_santo import extrair_concursos_espirito_santo
from ConcursosNoBrasil.sudeste.minas_gerais import extrair_concursos_minas_gerais
from ConcursosNoBrasil.sudeste.rio_de_janeiro import extrair_concursos_rio_de_janeiro
from ConcursosNoBrasil.sudeste.sao_paulo import extrair_concursos_sao_paulo
from ConcursosNoBrasil.nordeste.alagoas import extrair_concursos_alagoas
from ConcursosNoBrasil.nordeste.bahia import extrair_concursos_bahia
from ConcursosNoBrasil.nordeste.ceara import extrair_concursos_ceara
from ConcursosNoBrasil.nordeste.maranhao import extrair_concursos_maranhao
from ConcursosNoBrasil.nordeste.paraiba import extrair_concursos_paraiba
from ConcursosNoBrasil.nordeste.pernambuco import extrair_concursos_pernambuco
from ConcursosNoBrasil.nordeste.piaui import extrair_concursos_piaui
from ConcursosNoBrasil.nordeste.rio_grande_do_norte import extrair_concursos_rio_grande_do_norte
from ConcursosNoBrasil.nordeste.sergipe import extrair_concursos_sergipe
from ConcursosNoBrasil.norte.para import extrair_concursos_para
from ConcursosNoBrasil.norte.amapa import extrair_concursos_amapa
from ConcursosNoBrasil.norte.amazonas import extrair_concursos_amazonas
from ConcursosNoBrasil.norte.roraima import extrair_concursos_roraima
from ConcursosNoBrasil.norte.rondonia import extrair_concursos_rondonia
from ConcursosNoBrasil.norte.tocantins import extrair_concursos_tocantins
from ConcursosNoBrasil.centro_oeste.goias import extrair_concursos_goias
from ConcursosNoBrasil.centro_oeste.mato_grosso import extrair_concursos_mato_grosso
from ConcursosNoBrasil.centro_oeste.mato_grosso_do_sul import extrair_concursos_mato_grosso_do_sul
from ConcursosNoBrasil.centro_oeste.distrito_federal import extrair_concursos_distrito_federal

from FDR import extrair_concursos_fdr


def rodar_todos():

    extrair_concursos_regiao_sul()
    extrair_concursos_regiao_sudeste()
    extrair_concursos_regiao_nordeste()
    extrair_concursos_regiao_norte()
    extrair_concursos_regiao_centro_oeste()

    extrair_concursos_amapa()
    extrair_concursos_amazonas()
    extrair_concursos_rondonia()
    extrair_concursos_roraima()
    extrair_concursos_tocantins()
    extrair_concursos_para()
    extrair_concursos_parana()
    extrair_concursos_santaCatarina()
    extrair_concursos_rio_grande_do_sul()
    extrair_concursos_espirito_santo()
    extrair_concursos_minas_gerais()
    extrair_concursos_rio_de_janeiro()
    extrair_concursos_sao_paulo()
    extrair_concursos_alagoas()
    extrair_concursos_bahia()
    extrair_concursos_ceara()
    extrair_concursos_maranhao()
    extrair_concursos_paraiba()
    extrair_concursos_pernambuco()
    extrair_concursos_piaui()
    extrair_concursos_rio_grande_do_norte()
    extrair_concursos_sergipe()
    extrair_concursos_goias()
    extrair_concursos_mato_grosso()
    extrair_concursos_mato_grosso_do_sul()
    extrair_concursos_distrito_federal()

    extrair_concursos_fdr()

if __name__ == "__main__":
    rodar_todos()