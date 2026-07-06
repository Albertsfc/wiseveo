export const defaultGroups = [
  { id: "grp-income-100", code: 100, name: "RECEITAS E RENDIMENTOS", type: "INCOME" as const },
  { id: "grp-housing-200", code: 200, name: "MORADIA", type: "EXPENSE" as const },
  { id: "grp-food-300", code: 300, name: "ALIMENTAÇÃO", type: "EXPENSE" as const },
  { id: "grp-transport-400", code: 400, name: "TRANSPORTE", type: "EXPENSE" as const },
  { id: "grp-health-500", code: 500, name: "SAÚDE", type: "EXPENSE" as const },
  { id: "grp-leisure-600", code: 600, name: "LAZER E ESTILO DE VIDA", type: "EXPENSE" as const },
  { id: "grp-education-700", code: 700, name: "EDUCAÇÃO", type: "EXPENSE" as const },
  { id: "grp-others-800", code: 800, name: "OUTROS", type: "EXPENSE" as const },
  { id: "grp-transfer-900", code: 900, name: "TRANSFERÊNCIAS", type: "TRANSFER" as const },
];

export const defaultCategories = [
  // Receitas (100)
  { id: "cat-salario", code: "100.001", name: "Salário", type: "INCOME" as const, groupId: "grp-income-100" },
  { id: "cat-freelance", code: "100.002", name: "Freelance / Serviços", type: "INCOME" as const, groupId: "grp-income-100" },
  { id: "cat-rendimentos", code: "100.003", name: "Rendimentos", type: "INCOME" as const, groupId: "grp-income-100" },

  // Moradia (200)
  { id: "cat-aluguel", code: "200.001", name: "Aluguel / Prestação", type: "EXPENSE" as const, groupId: "grp-housing-200" },
  { id: "cat-condominio", code: "200.002", name: "Condomínio", type: "EXPENSE" as const, groupId: "grp-housing-200" },
  { id: "cat-consumo", code: "200.003", name: "Contas de Consumo (Luz/Água/Gás)", type: "EXPENSE" as const, groupId: "grp-housing-200" },
  { id: "cat-internet", code: "200.004", name: "Internet / TV", type: "EXPENSE" as const, groupId: "grp-housing-200" },

  // Alimentação (300)
  { id: "cat-supermercado", code: "300.001", name: "Supermercado", type: "EXPENSE" as const, groupId: "grp-food-300" },
  { id: "cat-restaurantes", code: "300.002", name: "Restaurantes / Delivery", type: "EXPENSE" as const, groupId: "grp-food-300" },

  // Transporte (400)
  { id: "cat-combustivel", code: "400.001", name: "Combustível", type: "EXPENSE" as const, groupId: "grp-transport-400" },
  { id: "cat-transp-publico", code: "400.002", name: "Transporte Público / Uber", type: "EXPENSE" as const, groupId: "grp-transport-400" },
  { id: "cat-manut-veiculo", code: "400.003", name: "Manutenção Veículo", type: "EXPENSE" as const, groupId: "grp-transport-400" },

  // Saúde (500)
  { id: "cat-saude-geral", code: "500.001", name: "Plano de Saúde / Farmácia", type: "EXPENSE" as const, groupId: "grp-health-500" },

  // Lazer e Estilo de Vida (600)
  { id: "cat-cinema", code: "600.001", name: "Cinema / Shows / Viagens", type: "EXPENSE" as const, groupId: "grp-leisure-600" },
  { id: "cat-assinaturas", code: "600.002", name: "Assinaturas (Netflix, Spotify, etc.)", type: "EXPENSE" as const, groupId: "grp-leisure-600" },

  // Educação (700)
  { id: "cat-cursos", code: "700.001", name: "Cursos / Faculdade / Livros", type: "EXPENSE" as const, groupId: "grp-education-700" },

  // Outros Custos (800)
  { id: "cat-despesas-diversas", code: "800.001", name: "Despesas Diversas", type: "EXPENSE" as const, groupId: "grp-others-800" },
  { id: "cat-impostos", code: "800.002", name: "Impostos / Tarifas", type: "EXPENSE" as const, groupId: "grp-others-800" },

  // Transferências (900)
  { id: "cat-transferencia", code: "900.001", name: "Transferência entre Contas", type: "TRANSFER" as const, groupId: "grp-transfer-900" },
];

export const defaultStatuses = [
  { id: "st-pago", code: 1, name: "Pago" },
  { id: "st-pendente", code: 2, name: "Pendente" },
  { id: "st-vencido", code: 3, name: "Vencido" },
  { id: "st-agendado", code: 4, name: "Agendado" },
];

export const defaultAccounts = [
  { id: 1, name: "Conta Corrente", type: "CHECKING" as const, balance: 0.0 },
  { id: 2, name: "Reserva Financeira", type: "SAVINGS" as const, balance: 0.0 },
  { id: 3, name: "Carteira", type: "WALLET" as const, balance: 0.0 },
];
