/**
 * Utilidad avanzada para calcular ecoCoins basada en múltiples factores
 */

class EcoCoinCalculator {

  /**
   * Cálculo base: 1 ecoCoin por cada 10 unidades.
   * rounding: 'floor' (legacy) o 'ceil' (para evitar subpago por redondeo).
   */
  static calculateBaseEcoCoins(amount, rounding = 'floor') {
    const n = Number(amount);
    if (!Number.isFinite(n) || n <= 0) return 0;
    const fn = rounding === 'ceil' ? Math.ceil : Math.floor;
    return Math.max(0, fn(n / 10));
  }

  /**
   * Costo requerido en ecoCoins para pagar un producto.
   * Usamos ceil para evitar subpago cuando el precio no es múltiplo de 10.
   */
  static calculateRequiredEcoCoinsForPayment(amount) {
    return this.calculateBaseEcoCoins(amount, 'ceil');
  }
  
  /**
   * Calcula ecoCoins para una transacción basándose en varios factores
   * @param {Object} transactionData - Datos de la transacción
   * @returns {Object} - Objeto con distribución de ecoCoins
   */
  static calculateTransactionEcoCoins(transactionData) {
    const {
      amount,
      productCategory,
      productCondition,
      sellerSustainabilityScore = 0,
      buyerSustainabilityScore = 0,
      isFirstPurchase = false,
      discountPercentage = 0
    } = transactionData;

    // Fórmula base: 1 ecoCoin por cada $10 (legacy)
    const baseEcoCoins = this.calculateBaseEcoCoins(amount, 'floor');

    // Multiplicadores por categoría (productos más eco-friendly generan más ecoCoins)
    const categoryMultipliers = {
      'Electrónica': 1.2,      // Alta reutilización = mayor impacto
      'Vehículos': 1.5,        // Máximo impacto ambiental
      'Muebles': 1.1,
      'Ropa': 1.0,
      'Herramientas': 1.1,
      'Libros': 0.8,           // Menor impacto pero sigue siendo valioso
      'Deportes': 0.9,
      'Hogar': 1.0,
      'Otros': 0.9
    };

    // Multiplicadores por condición
    const conditionMultipliers = {
      'Nuevo': 0.8,            // Menos recompensa porque es nuevo
      'Como nuevo': 1.0,       // Base
      'Bueno': 1.1,           // Más recompensa por dar segunda vida
      'Aceptable': 1.2,       // Aún más por rescatar producto
      'Reparar': 1.3          // Máximo por reparación/upcycling
    };

    // Bonificaciones por sustainability score
    const sellerBonus = Math.min(0.2, sellerSustainabilityScore / 500); // Max 20% extra
    const buyerBonus = Math.min(0.1, buyerSustainabilityScore / 1000);  // Max 10% extra

    // Bonificación por primera compra
    const firstPurchaseBonus = isFirstPurchase ? 0.5 : 0; // 50% extra

    // Bonificación por descuento (incentiva precios justos)
    const discountBonus = Math.min(0.3, discountPercentage / 100 * 2); // Max 30% extra

    // Calcular multiplicador total
    const categoryMult = categoryMultipliers[productCategory] || 1.0;
    const conditionMult = conditionMultipliers[productCondition] || 1.0;
    const totalMultiplier = categoryMult * conditionMult * 
      (1 + sellerBonus + buyerBonus + firstPurchaseBonus + discountBonus);

    // EcoCoins totales
    const totalEcoCoins = Math.round(baseEcoCoins * totalMultiplier);

    // Distribución: 60% vendedor, 40% comprador
    const sellerEcoCoins = Math.round(totalEcoCoins * 0.6);
    const buyerEcoCoins = Math.round(totalEcoCoins * 0.4);

    return {
      total: totalEcoCoins,
      seller: sellerEcoCoins,
      buyer: buyerEcoCoins,
      breakdown: {
        base: baseEcoCoins,
        categoryMultiplier: categoryMult,
        conditionMultiplier: conditionMult,
        bonuses: {
          seller: Math.round(baseEcoCoins * sellerBonus),
          buyer: Math.round(baseEcoCoins * buyerBonus),
          firstPurchase: Math.round(baseEcoCoins * firstPurchaseBonus),
          discount: Math.round(baseEcoCoins * discountBonus)
        },
        finalMultiplier: totalMultiplier
      }
    };
  }

  /**
   * Calcula ecoCoins para acciones especiales del usuario
   * @param {String} action - Tipo de acción
   * @param {Object} context - Contexto adicional
   * @returns {Number} - EcoCoins otorgados
   */
  static calculateActionEcoCoins(action, context = {}) {
    const actionRewards = {
      // Acciones de onboarding
      'profile_complete': 50,
      'first_product_listed': 25,
      'identity_verified': 100,
      'location_added': 20,

      // Acciones sociales
      'referral_success': 75,
      'social_share': 5,
      'review_written': 10,
      'helpful_review': 15,

      // Acciones de engagement
      'daily_login': 2,
      'weekly_active': 10,
      'monthly_milestone': 50,

      // Acciones especiales
      'upcycling_project': 150,
      'repair_documentation': 100,
      'sustainability_challenge': 200,

      // Penalizaciones (valores negativos)
      'transaction_cancelled': -10,
      'negative_review': -20,
      'policy_violation': -50
    };

    let baseReward = actionRewards[action] || 0;

    // Aplicar multiplicadores contextuales
    if (context.streak && context.streak > 1) {
      // Bonificación por racha (hasta 50% extra)
      const streakBonus = Math.min(0.5, (context.streak - 1) * 0.1);
      baseReward = Math.round(baseReward * (1 + streakBonus));
    }

    if (context.challengeActive) {
      // Bonificación durante eventos especiales
      baseReward = Math.round(baseReward * 1.2);
    }

    return Math.max(0, baseReward); // No permitir valores negativos que bajen de 0
  }

  /**
   * Calcula el costo en ecoCoins para usar como método de pago
   * @param {Number} ecoCoins - Cantidad de ecoCoins a usar
   * @param {Number} totalAmount - Monto total de la transacción
   * @returns {Object} - Conversión y límites
   */
  static calculateEcoCoinPayment(ecoCoins, totalAmount) {
    // Tasa de conversión: 1 ecoCoin = $2 (mejor que ganar)
    const conversionRate = 2;
    const maxDiscount = 0.5; // Máximo 50% del total puede pagarse con ecoCoins

    const cashValue = ecoCoins * conversionRate;
    const maxAllowedValue = totalAmount * maxDiscount;
    const actualValue = Math.min(cashValue, maxAllowedValue);
    const ecoCoinsUsed = Math.floor(actualValue / conversionRate);
    const remainingPayment = totalAmount - actualValue;

    return {
      ecoCoinsUsed,
      cashValue: actualValue,
      remainingPayment,
      conversionRate,
      maxAllowed: maxAllowedValue,
      discountPercentage: (actualValue / totalAmount) * 100
    };
  }

  /**
   * Calcula proyección de ecoCoins para motivar al usuario
   * @param {Object} userData - Datos del usuario
   * @returns {Object} - Proyecciones y metas
   */
  static calculateProjections(userData) {
    const {
      currentEcoCoins = 0,
      monthlyTransactions = 0,
      averageTransactionAmount = 0,
      sustainabilityScore = 0
    } = userData;

    // Proyecciones mensuales basadas en actividad actual
    const estimatedMonthlyEcoCoins = this.calculateTransactionEcoCoins({
      amount: averageTransactionAmount,
      productCategory: 'Otros', // Promedio
      productCondition: 'Bueno',
      sellerSustainabilityScore: sustainabilityScore
    }).total * monthlyTransactions;

    // Metas y niveles
    const levels = [
      { name: 'Eco-Novato', minEcoCoins: 0, benefits: ['Acceso básico'] },
      { name: 'Eco-Consciente', minEcoCoins: 100, benefits: ['5% descuento en compras'] },
      { name: 'Eco-Warrior', minEcoCoins: 500, benefits: ['10% descuento', 'Productos destacados'] },
      { name: 'Eco-Champion', minEcoCoins: 1000, benefits: ['15% descuento', 'Acceso anticipado'] },
      { name: 'Eco-Master', minEcoCoins: 2000, benefits: ['20% descuento', 'Soporte prioritario'] }
    ];

    const currentLevel = levels.reverse().find(level => currentEcoCoins >= level.minEcoCoins) || levels[0];
    const nextLevel = levels.find(level => level.minEcoCoins > currentEcoCoins);

    return {
      current: {
        ecoCoins: currentEcoCoins,
        level: currentLevel,
        cashValue: currentEcoCoins * 2 // Valor en pesos
      },
      projections: {
        weekly: Math.round(estimatedMonthlyEcoCoins / 4),
        monthly: estimatedMonthlyEcoCoins,
        yearly: estimatedMonthlyEcoCoins * 12
      },
      nextLevel: nextLevel ? {
        ...nextLevel,
        ecoCoinsNeeded: nextLevel.minEcoCoins - currentEcoCoins,
        progress: (currentEcoCoins / nextLevel.minEcoCoins) * 100
      } : null
    };
  }

  /**
   * Calcula recompensas por hitos de sostenibilidad
   * @param {Object} achievements - Logros del usuario
   * @returns {Number} - EcoCoins de bonificación
   */
  static calculateSustainabilityMilestones(achievements) {
    let bonusEcoCoins = 0;
    
    const milestones = {
      // Hitos de productos salvados
      '10_products_saved': 100,
      '50_products_saved': 300,
      '100_products_saved': 500,
      
      // Hitos de CO2 ahorrado
      '100_kg_co2_saved': 150,
      '500_kg_co2_saved': 400,
      '1000_kg_co2_saved': 750,
      
      // Hitos de tiempo
      '30_days_active': 200,
      '90_days_active': 500,
      '365_days_active': 1000,
      
      // Hitos sociales
      '10_referrals': 250,
      '50_positive_reviews': 300,
      '100_transactions': 400
    };

    Object.entries(achievements).forEach(([achievement, unlocked]) => {
      if (unlocked && milestones[achievement]) {
        bonusEcoCoins += milestones[achievement];
      }
    });

    return bonusEcoCoins;
  }
}

// Función legacy para compatibilidad
function calculateEcoCoins(transaction) {
  if (typeof transaction === 'number') {
    // Comportamiento legacy: solo monto
    return Math.floor(transaction / 10);
  }
  
  // Nuevo comportamiento con objeto
  return EcoCoinCalculator.calculateTransactionEcoCoins(transaction);
}

module.exports = {
  calculateEcoCoins, // Función legacy
  EcoCoinCalculator  // Clase completa
};
