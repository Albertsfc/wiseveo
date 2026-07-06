import crypto from "crypto"
import { periodFromDate } from "../../src/lib/financial"

// Generates ~200 transactions, some payees, budgets, and recurring transactions for a demo user.
export function generateMockData(userId: string) {
  console.log(`[generateMockData] Generating mock data for user: ${userId}`);

  const payees = [
    { id: 1, name: "Supermercado Pão de Açúcar" },
    { id: 2, name: "Uber Brasil" },
    { id: 3, name: "Netflix" },
    { id: 4, name: "Spotify Brasil" },
    { id: 5, name: "iFood" },
    { id: 6, name: "Posto Ipiranga" },
    { id: 7, name: "Droga Raia" },
    { id: 8, name: "Amazon Prime" },
    { id: 9, name: "Academia SmartFit" },
    { id: 10, name: "Imobiliária Alfa (Aluguel)" },
  ];

  const transactions: any[] = [];
  const budgets: any[] = [];
  const recurring: any[] = [];

  const startDate = new Date(2026, 0, 1); // Jan 1st, 2026
  const endDate = new Date(2026, 5, 30); // Jun 30th, 2026

  // Keep track of transaction number (NUM)
  let transactionNum = 1;

  // Let's generate data month by month
  for (let month = 0; month < 6; month++) {
    const year = 2026;
    const currentMonthDate = new Date(year, month, 15);
    const period = periodFromDate(currentMonthDate);

    // 1. MONTHLY INCOME (Salário: ~R$ 8.500,00 on 5th)
    const salaryDate = new Date(year, month, 5, 12, 0, 0);
    transactions.push({
      id: crypto.randomUUID(),
      num: transactionNum++,
      period,
      date: salaryDate,
      reference: "MENSAL",
      note: "Recebimento de salário mensal",
      description: "Salário CLT",
      amount: 8500.0,
      type: "INCOME",
      userId,
      accountId: 1, // Conta Corrente
      groupCode: 100, // RECEITAS
      categoryCode: "100.001", // Salário
      statusCode: 1, // Pago
    });

    // 2. FREELANCE INCOME (Freelance: ~R$ 2.000,00 on 18th in months 1, 3, 5)
    if (month % 2 === 1) {
      const freeDate = new Date(year, month, 18, 12, 0, 0);
      transactions.push({
        id: crypto.randomUUID(),
        num: transactionNum++,
        period,
        date: freeDate,
        reference: "PROJETO-WEB",
        note: "Desenvolvimento de landing page",
        description: "Freelance Landing Page",
        amount: 2200.0,
        type: "INCOME",
        userId,
        accountId: 1, // Conta Corrente
        groupCode: 100,
        categoryCode: "100.002", // Freelance
        statusCode: 1,
      });
    }

    // 3. MORADIA EXPENSES (Aluguel: R$ 2.300,00 on 10th)
    const rentDate = new Date(year, month, 10, 12, 0, 0);
    transactions.push({
      id: crypto.randomUUID(),
      num: transactionNum++,
      period,
      date: rentDate,
      reference: "ALUGUEL",
      note: "Pagamento aluguel apto 402",
      description: "Aluguel",
      amount: -2300.0,
      type: "EXPENSE",
      userId,
      accountId: 1,
      groupCode: 200, // Moradia
      categoryCode: "200.001", // Aluguel
      statusCode: 1,
      payeeId: 10, // Imobiliária Alfa
    });

    // 4. CONDOMÍNIO (R$ 550,00 on 10th)
    transactions.push({
      id: crypto.randomUUID(),
      num: transactionNum++,
      period,
      date: rentDate,
      reference: "CONDO",
      note: "Condomínio edifício Solar",
      description: "Condomínio",
      amount: -550.0,
      type: "EXPENSE",
      userId,
      accountId: 1,
      groupCode: 200,
      categoryCode: "200.002", // Condominio
      statusCode: 1,
    });

    // 5. INTERNET & TV (R$ 150,00 on 12th)
    const netDate = new Date(year, month, 12, 12, 0, 0);
    transactions.push({
      id: crypto.randomUUID(),
      num: transactionNum++,
      period,
      date: netDate,
      reference: "CLARO",
      note: "Internet fibra 500mb",
      description: "Internet Fibra",
      amount: -150.0,
      type: "EXPENSE",
      userId,
      accountId: 1,
      groupCode: 200,
      categoryCode: "200.004", // Internet
      statusCode: 1,
    });

    // 6. CONSUMO: LUZ/ÁGUA (R$ 220,00 on 15th)
    const energyDate = new Date(year, month, 15, 12, 0, 0);
    transactions.push({
      id: crypto.randomUUID(),
      num: transactionNum++,
      period,
      date: energyDate,
      reference: "ENEL",
      note: "Conta de luz",
      description: "Energia Elétrica",
      amount: -220.0,
      type: "EXPENSE",
      userId,
      accountId: 1,
      groupCode: 200,
      categoryCode: "200.003", // Consumo
      statusCode: 1,
    });

    // 7. ASSINATURAS (Netflix: R$ 55.90, Spotify: R$ 34.90)
    const subDate = new Date(year, month, 8, 12, 0, 0);
    transactions.push({
      id: crypto.randomUUID(),
      num: transactionNum++,
      period,
      date: subDate,
      reference: "NETFLIX",
      note: "Netflix assinatura mensal",
      description: "Netflix",
      amount: -55.9,
      type: "EXPENSE",
      userId,
      accountId: 1,
      groupCode: 600, // Lazer
      categoryCode: "600.002", // Assinaturas
      statusCode: 1,
      payeeId: 3,
    });

    transactions.push({
      id: crypto.randomUUID(),
      num: transactionNum++,
      period,
      date: subDate,
      reference: "SPOTIFY",
      note: "Spotify Family",
      description: "Spotify",
      amount: -34.9,
      type: "EXPENSE",
      userId,
      accountId: 1,
      groupCode: 600,
      categoryCode: "600.002", // Assinaturas
      statusCode: 1,
      payeeId: 4,
    });

    // 8. TRANSFERS: Reserva de investimento (R$ 1.500,00 on 6th)
    const transDate = new Date(year, month, 6, 12, 0, 0);
    transactions.push({
      id: crypto.randomUUID(),
      num: transactionNum++,
      period,
      date: transDate,
      reference: "APLICACAO",
      note: "Reserva mensal",
      description: "Investimento mensal",
      amount: -1500.0,
      type: "TRANSFER",
      userId,
      accountId: 1, // Origem: Conta Corrente
      destAccountId: 2, // Destino: Reserva Financeira
      groupCode: 900,
      categoryCode: "900.001", // Transferência entre Contas
      statusCode: 1,
    });

    // 9. SUPERMERCADO (Weekly: R$ 300,00 - 450,00 on 3rd, 11th, 17th, 25th)
    const supermarketDays = [3, 11, 17, 25];
    supermarketDays.forEach((day, idx) => {
      const price = -(320 + (idx * 25) + (month * 10));
      const marketDate = new Date(year, month, day, 12, 0, 0);
      transactions.push({
        id: crypto.randomUUID(),
        num: transactionNum++,
        period,
        date: marketDate,
        reference: "COMPRAS",
        note: "Supermercado mensal",
        description: "Supermercado",
        amount: price,
        type: "EXPENSE",
        userId,
        accountId: 1,
        groupCode: 300, // Alimentação
        categoryCode: "300.001", // Supermercado
        statusCode: 1,
        payeeId: 1,
      });
    });

    // 10. UBER (8-10 rides per month, R$ 15 - 45 each)
    for (let ride = 0; ride < 9; ride++) {
      const day = 2 + ride * 3;
      const rideDate = new Date(year, month, day, 12, 0, 0);
      const ridePrice = -(18.5 + ride * 2.5);
      transactions.push({
        id: crypto.randomUUID(),
        num: transactionNum++,
        period,
        date: rideDate,
        reference: "UBER",
        note: "Viagem Uber",
        description: "Corrida Uber",
        amount: parseFloat(ridePrice.toFixed(2)),
        type: "EXPENSE",
        userId,
        accountId: 1,
        groupCode: 400, // Transporte
        categoryCode: "400.002", // Transporte Publico
        statusCode: 1,
        payeeId: 2,
      });
    }

    // 11. RESTAURANTES / DELIVERY (Weekly: R$ 60 - 150)
    const deliveryDays = [4, 12, 19, 26];
    deliveryDays.forEach((day, idx) => {
      const price = -(70 + idx * 20);
      const deliveryDate = new Date(year, month, day, 12, 0, 0);
      transactions.push({
        id: crypto.randomUUID(),
        num: transactionNum++,
        period,
        date: deliveryDate,
        reference: "IFOOD",
        note: "Jantar / Almoço fora",
        description: "Restaurante",
        amount: price,
        type: "EXPENSE",
        userId,
        accountId: 1,
        groupCode: 300,
        categoryCode: "300.002", // Restaurante / Delivery
        statusCode: 1,
        payeeId: 5,
      });
    });

    // 12. COMBUSTÍVEL (Bi-weekly: R$ 200 on 8th, 22nd)
    const fuelDays = [8, 22];
    fuelDays.forEach((day) => {
      const fuelDate = new Date(year, month, day, 12, 0, 0);
      transactions.push({
        id: crypto.randomUUID(),
        num: transactionNum++,
        period,
        date: fuelDate,
        reference: "POSTO IPIRANGA",
        note: "Abastecimento",
        description: "Gasolina",
        amount: -200.0,
        type: "EXPENSE",
        userId,
        accountId: 1,
        groupCode: 400,
        categoryCode: "400.001", // Combustível
        statusCode: 1,
        payeeId: 6,
      });
    });

    // 13. SAÚDE: FARMÁCIA (R$ 80 on 14th)
    const pharmaDate = new Date(year, month, 14, 12, 0, 0);
    transactions.push({
      id: crypto.randomUUID(),
      num: transactionNum++,
      period,
      date: pharmaDate,
      reference: "DROGA RAIA",
      note: "Medicamentos e higiene",
      description: "Farmácia",
      amount: -85.5,
      type: "EXPENSE",
      userId,
      accountId: 1,
      groupCode: 500,
      categoryCode: "500.001",
      statusCode: 1,
      payeeId: 7,
    });

    // 14. LAZER / CINEMA (R$ 120 in months 0, 2, 4)
    if (month % 2 === 0) {
      const leisureDate = new Date(year, month, 20, 12, 0, 0);
      transactions.push({
        id: crypto.randomUUID(),
        num: transactionNum++,
        period,
        date: leisureDate,
        reference: "CINEMARK",
        note: "Ingressos e pipoca",
        description: "Cinema / Lazer",
        amount: -120.0,
        type: "EXPENSE",
        userId,
        accountId: 1,
        groupCode: 600,
        categoryCode: "600.001",
        statusCode: 1,
      });
    }

    // 15. BUDGET FOR THE MONTH
    budgets.push({
      id: `bgt-food-${month}`,
      amount: 1500.0,
      month: month + 1,
      year: 2026,
      groupId: "grp-food-300",
      spent: 0.0,
      userId,
    });

    budgets.push({
      id: `bgt-housing-${month}`,
      amount: 3200.0,
      month: month + 1,
      year: 2026,
      groupId: "grp-housing-200",
      spent: 0.0,
      userId,
    });
  }

  // Budgets for the current year
  const currentYear = 2026;
  const targetCategory = "cat-supermercado";

  // Create Recurring Models
  recurring.push({
    id: "rec-aluguel",
    period: "202601",
    note: "Aluguel Apartamento",
    description: "Aluguel Mensal",
    amount: -2300.0,
    type: "EXPENSE",
    userId,
    accountId: 1,
    groupCode: 200,
    categoryCode: "200.001",
    statusCode: 2, // Pendente
    reference: "RECORRENTE",
  });

  recurring.push({
    id: "rec-salario",
    period: "202601",
    note: "Salário Principal",
    description: "Salário CLT",
    amount: 8500.0,
    type: "INCOME",
    userId,
    accountId: 1,
    groupCode: 100,
    categoryCode: "100.001",
    statusCode: 1, // Pago
    reference: "RECORRENTE",
  });

  return { payees, transactions, budgets, recurring };
}
