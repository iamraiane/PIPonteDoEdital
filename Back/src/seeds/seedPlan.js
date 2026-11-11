import { AppDataSource } from "../../data-source.js";
import { PlanEntity } from "../entities/Plan.js";

/** Dados do plano "Premium" usado no seed (valor padrão de R$ 1,00 via SEED_PLAN_VALUE). */
const PLAN = {
  name: "Premium",
  description: "Acesso Premium mensal",
  value: Number(process.env.SEED_PLAN_VALUE || "1.00"),
  activate: true,
};

/**
 * Executa o seed do plano: inicializa a conexão, cria o plano "Premium" se não existir
 * e encerra a conexão com o banco.
 * @returns {Promise<void>} Não retorna valor.
 */
async function run() {
  await AppDataSource.initialize();

  const repo = AppDataSource.getRepository(PlanEntity);
  const existing = await repo.findOneBy({ name: PLAN.name });

  if (existing) {
    console.log(`Plano já existe (id ${existing.id}). Nada a fazer.`);
  } else {
    const created = await repo.save(PLAN);
    console.log(`Plano criado com id ${created.id}.`);
  }

  await AppDataSource.destroy();
}

run().catch((error) => {
  console.error("Erro no seed do plano:", error.message);
  process.exit(1);
});
