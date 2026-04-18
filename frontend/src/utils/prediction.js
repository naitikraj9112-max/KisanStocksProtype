// Ideal growing condition baselines for major crops
const CROP_BASELINES = {
  wheat: { name: 'Wheat', n: 120, p: 60, k: 40, ph: 6.5, temp: 20, humidity: 60, rainfall: 40, baseYield: 4.5 },
  rice: { name: 'Rice', n: 100, p: 50, k: 50, ph: 6.0, temp: 25, humidity: 80, rainfall: 200, baseYield: 5.2 },
  maize: { name: 'Maize (Corn)', n: 140, p: 70, k: 60, ph: 6.5, temp: 24, humidity: 65, rainfall: 80, baseYield: 6.0 },
  cotton: { name: 'Cotton', n: 100, p: 40, k: 80, ph: 6.8, temp: 28, humidity: 55, rainfall: 50, baseYield: 2.5 },
  soybean: { name: 'Soybean', n: 40, p: 60, k: 80, ph: 6.5, temp: 25, humidity: 70, rainfall: 70, baseYield: 3.2 },
  sugarcane: { name: 'Sugarcane', n: 200, p: 80, k: 120, ph: 7.0, temp: 30, humidity: 80, rainfall: 150, baseYield: 75.0 },
};

/**
 * Evaluates a single crop's suitability based on environmental parameters.
 */
function evaluateCrop(crop, n, p, k, ph, temp, humidity, rainfall) {
  // Max penalty capped so extreme values don't break the model completely
  const calcPenalty = (actual, target, weight) => {
    const variance = Math.abs(actual - target) / target;
    return Math.min(variance, 1.0) * weight;
  };

  const pN = calcPenalty(n, crop.n, 15);
  const pP = calcPenalty(p, crop.p, 10);
  const pK = calcPenalty(k, crop.k, 10);
  const pPH = calcPenalty(ph, crop.ph, 25);
  const pTemp = calcPenalty(temp, crop.temp, 15);
  const pHum = calcPenalty(humidity, crop.humidity, 10);
  const pRain = calcPenalty(rainfall, crop.rainfall, 15);

  const totalPenalty = pN + pP + pK + pPH + pTemp + pHum + pRain;
  const suitabilityScore = Math.max(0, 100 - totalPenalty);

  const yieldModifier = 0.2 + (0.8 * (suitabilityScore / 100)); 
  let finalYield = crop.baseYield * yieldModifier;
  
  const randomVariance = 1 + ((Math.random() * 0.04) - 0.02);
  finalYield = finalYield * randomVariance;

  const confidence = Math.min(98, 50 + (suitabilityScore / 2));

  let suggestion = "Moderate";
  if (suitabilityScore >= 80) suggestion = "Highly Suitable";
  else if (suitabilityScore >= 60) suggestion = "Good";
  else if (suitabilityScore <= 35) suggestion = "Not Recommended";

  return {
    cropName: crop.name,
    yieldResult: Math.round(finalYield * 10) / 10,
    confidence: Math.round(confidence),
    suitability: Math.round(suitabilityScore),
    suggestion: suggestion,
  };
}

/**
 * Predict crop yield recommendations based on soil and weather.
 * Returns an array of the top 3 recommended crops.
 */
export function predictYield(nitrogen, phosphorus, potassium, ph, temp, humidity, rainfall, targetCrop = 'auto') {
  const recommendations = [];

  for (const key in CROP_BASELINES) {
    const crop = CROP_BASELINES[key];
    const evaluation = evaluateCrop(crop, nitrogen, phosphorus, potassium, ph, temp, humidity, rainfall);
    recommendations.push({ ...evaluation, key });
  }

  // Sort by highest suitability score
  recommendations.sort((a, b) => b.suitability - a.suitability);

  // If a target crop is specified, extract it and pin it to the top
  if (targetCrop && targetCrop !== 'auto') {
    const targetIndex = recommendations.findIndex(r => r.key === targetCrop);
    if (targetIndex > -1) {
       const [target] = recommendations.splice(targetIndex, 1);
       // Add a special flag so the UI knows this was manually targeted
       target.isTargeted = true;
       recommendations.unshift(target);
    }
  }

  // Return the top 3 recommendations (or Target + Top 3)
  return recommendations.slice(0, 4);
}
