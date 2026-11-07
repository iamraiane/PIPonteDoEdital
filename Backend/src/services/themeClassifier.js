// Classificador de temas de editais por palavras-chave (multi-label, sem custo).
// Os temas retornados usam exatamente os mesmos rótulos do INTERESSES do cadastro.

export const THEMES = [
    "Tecnologia",
    "Educação",
    "Saúde",
    "Infraestrutura",
    "Cultura",
    "Serviços",
    "Consultoria",
    "Engenharia",
];

const KEYWORDS = {
    "Tecnologia": [
        "tecnologia", "tecnologico", "informatica", "software", "hardware",
        "computador", "computadores", "computacao", "redes de computadores",
        "rede de computadores", "telecomunicacoes", "ciberseguranca", "ciber",
        "seguranca da informacao", "sistemas de informacao", "desenvolvimento de sistemas",
        "banco de dados", "dados abertos", "inteligencia artificial", "machine learning",
        "automacao", "robotica", "programacao", "nuvem",
        "tecnico em informatica", "tecnico em redes", "tecnico em desenvolvimento de sistemas",
        "ti", "digital", "eletronica digital", "internet das coisas", "iot",
        "full stack", "front end", "back end", "devops", "cloud",
    ],
    "Educação": [
        "educacao", "ensino", "escola", "escolas", "escolar", "escolaridade",
        "professor", "professores", "magisterio", "pedagogia", "pedagogico",
        "alfabetizacao", "educacional", "secretaria de educacao", "rede de ensino",
        "ensino medio", "ensino fundamental", "ensino tecnico", "formacao docente",
        "coordenador pedagogico", "orientador educacional", "gestao escolar",
        "merenda escolar", "alimentacao escolar", "material didatico",
        "creche", "pre-escola", "educacao infantil", "jardim de infancia",
        "biblioteca escolar", "monitoria", "estagio em ensino",
    ],
    "Saúde": [
        "saude", "hospital", "hospitalar", "hospitais", "enfermagem", "enfermeiro",
        "enfermeira", "medico", "medicos", "medicina", "farmacia", "farmaceutico",
        "clinica", "clinicas", "psicologo", "psicologia", "nutricao", "nutricionista",
        "odontologia", "dentista", "laboratorio", "laboratorial", "sanitaria",
        "assistencia medica", "urgencia", "emergencia", "posto de saude",
        "unidade basica de saude", "ubs", "vacina", "vacinacao", "sus",
        "tecnico em enfermagem", "tecnico em saude", "bioquimica", "biomedicina",
        "fonoaudiologia", "fisioterapia", "terapia ocupacional", "radiologia",
        "citotecnico", "hemoterapia", "sap", "cnes", "paciente", "pacientes",
        "saude publica", "saude mental", "epidemiologia", "vacinal",
    ],
    "Infraestrutura": [
        "infraestrutura", "construcao", "construcoes", "estrada", "estradas",
        "ponte", "pontes", "saneamento", "obra", "obras", "pavimentacao",
        "urbanizacao", "drenagem", "canalizacao", "iluminacao publica",
        "movimentacao de terra", "aterro", "calcada", "asfalto", "concreto",
        "mobilidade urbana", "habitacao", "moradia", "habitar", "vias de acesso",
        "coleta de residuos", "lixao", "aterro sanitario", "gestao de residuos",
        "rede de esgoto", "rede de agua", "abastecimento de agua", "galeria",
        "terminais rodoviarios", "aeroporto", "porto", "ferrovia", "rodovia",
        "construcao civil", "reforma predial", "reforma de escola", "reforma de posto",
    ],
    "Cultura": [
        "cultura", "cultural", "museu", "museus", "biblioteca", "bibliotecas",
        "patrimonio", "patrimonio historico", "artes", "artesanato", "teatro",
        "cinema", "danca", "musica", "orquestra", "folclore", "literatura",
        "turismo", "turistico", "ponto turistico", "centro historico",
        "evento cultural", "festivais", "festival", "exposicao", "galeria de arte",
        "centro cultural", "casa de cultura", "sinfonica", "coral", "poesia",
        "pintura", "escultura", "fotografia artistica", "ceramica", "tapeçaria",
    ],
    "Serviços": [
        "assistencia social", "assistente social", "atendimento ao publico",
        "acolhimento", "casa de acolhimento", "cras", "creas", "bem estar social",
        "recepcao", "recepcionista", "limpeza", "higienizacao", "conservacao",
        "vigilancia", "seguranca patrimonial", "apoio administrativo",
        "agente de servicos", "agente comunitario", "apoio aos servicos",
        "servicos de apoio", "servico de apoio", "copa", "cozinha",
        "lavanderia", "manutencao predial", "jardinagem", "poda", "capinagem",
        "transporte de alunos", "veiculo de apoio", "apoio operacional",
    ],
    "Consultoria": [
        "consultoria", "consultor", "consultores", "assessoria", "assessor",
        "assessores", "laudo", "laudos", "pericia", "pericias", "perito",
        "auditoria", "auditor", "parecer", "pareceres", "viabilidade",
        "estudo tecnico", "planejamento estrategico", "diagnostico tecnico",
        "consultoria tecnica", "prestacao de servicos de consultoria",
        "servico de consultoria", "gestao de projetos", "analise de processos",
        "capacitacao de equipes", "treinamento corporativo",
    ],
    "Engenharia": [
        "engenharia", "engenheiro", "engenheiros", "calculo estrutural",
        "calculo de estruturas", "projeto executivo", "projeto de engenharia",
        "engenharia civil", "engenharia ambiental", "engenharia de producao",
        "engenharia eletrica", "engenharia mecanica", "mecanica", "eletrica",
        "hidraulica", "instalacoes eletricas", "instalacao eletrica",
        "manutencao mecanica", "manutencao eletrica", "maquinas", "equipamentos",
        "estrutural", "estruturas", "comissionamento", "supervisao tecnica",
        "tecnico em mecanica", "tecnico em eletrica", "tecnico em eletronica",
        "tecnico em automacao industrial", "desenho tecnico", "cad",
        "topografia", "levantamento topografico", "geologia", "geotecnia",
    ],
};

export function normalizeText(value) {
    if (!value) return "";
    return value
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase();
}

function escapeRegex(value) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// Pré-compila: tema -> [{ keyword, regex }] com fronteira de palavra inteira.
const COMPILED = {};
for (const theme of THEMES) {
    COMPILED[theme] = (KEYWORDS[theme] ?? []).map((keyword) => ({
        keyword,
        regex: new RegExp(`\\b${escapeRegex(keyword)}\\b`),
    }));
}

function countHits(text, entries) {
    let hits = 0;
    for (const { regex } of entries) {
        if (regex.test(text)) hits += 1;
    }
    return hits;
}

// Retorna os temas do edital (multi-label), ordenados por relevância.
// Acerto no título vale o dobro do acerto na descrição.
export function classifyNotice(title, description) {
    const normalizedTitle = normalizeText(title);
    const normalizedDescription = normalizeText(description);

    const scores = [];
    for (const theme of THEMES) {
        const entries = COMPILED[theme];
        if (entries.length === 0) continue;

        const titleHits = countHits(normalizedTitle, entries);
        const descriptionHits = countHits(normalizedDescription, entries);
        const score = titleHits * 2 + descriptionHits;

        if (score > 0) scores.push({ theme, score });
    }

    scores.sort((a, b) => b.score - a.score);
    return scores.map((entry) => entry.theme);
}

// Número de temas do edital que batem com as preferências do usuário.
export function matchScore(noticeThemes, userPreferences) {
    if (!Array.isArray(noticeThemes) || noticeThemes.length === 0) return 0;
    if (!Array.isArray(userPreferences) || userPreferences.length === 0) return 0;

    const prefs = new Set(userPreferences.map((p) => normalizeText(p)));
    let score = 0;
    for (const theme of noticeThemes) {
        if (prefs.has(normalizeText(theme))) score += 1;
    }
    return score;
}
