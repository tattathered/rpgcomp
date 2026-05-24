/**
 * Converte un importo totale in monete di bronzo (MB) nelle rispettive monete fisiche a cascata:
 * 1 MO (oro) = 100 MB
 * 1 MA (argento) = 10 MB
 * 1 MB (bronzo) = 1 MB
 * 1 MR (rame) = 0.1 MB
 * 1 MS (stagno) = 0.01 MB
 * 
 * Gestisce importi negativi.
 */
export function formatMBToCoins(totalMB) {
  const isNegative = totalMB < 0;
  let absMB = Math.abs(totalMB);
  
  // Oro (MO): 1 MO = 100 MB
  const MO = Math.floor(absMB * 0.01);
  let resto = Math.round((absMB - MO * 100) * 100) / 100;
  
  // Argento (MA): 1 MA = 10 MB
  const MA = Math.floor(resto * 0.1);
  resto = Math.round((resto - MA * 10) * 100) / 100;
  
  // Bronzo (MB): 1 MB = 1 MB
  const MB = Math.floor(resto);
  resto = Math.round((resto - MB) * 100) / 100;
  
  // Rame (MR): 1 MR = 0.1 MB (ossia 10 MR = 1 MB)
  const MR = Math.floor(resto * 10);
  resto = Math.round((resto - MR * 0.1) * 100) / 100;
  
  // Stagno (MS): 1 MS = 0.01 MB (ossia 100 MS = 1 MB)
  const MS = Math.round(resto * 100);
  
  return {
    isNegative,
    MO,
    MA,
    MB,
    MR,
    MS
  };
}

/**
 * Formatta un oggetto monete in una stringa leggibile (es: "1 MO, 2 MA, 5 MB, 4 MS").
 * Se il valore è zero, restituisce "0 MB".
 */
export function formatCoinsToString(coins) {
  const parts = [];
  if (coins.MO > 0) parts.push(`${coins.MO} MO`);
  if (coins.MA > 0) parts.push(`${coins.MA} MA`);
  if (coins.MB > 0) parts.push(`${coins.MB} MB`);
  if (coins.MR > 0) parts.push(`${coins.MR} MR`);
  if (coins.MS > 0) parts.push(`${coins.MS} MS`);
  
  if (parts.length === 0) return "0 MB";
  
  const prefix = coins.isNegative ? "-" : "";
  return prefix + parts.join(", ");
}
