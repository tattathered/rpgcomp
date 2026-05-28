const { onCall, HttpsError } = require("firebase-functions/v2/https");
const logger = require("firebase-functions/logger");
const admin = require("firebase-admin");

// Inizializza l'SDK Admin di Firebase
admin.initializeApp();
const db = admin.firestore();

/**
 * Crea un nuovo account giocatore (Firebase Auth + Firestore)
 * Chiamabile solo da un GM autenticato.
 */
exports.createPlayer = onCall({ cors: true }, async (request) => {
  // Verifica autenticazione del chiamante
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "L'utente deve essere autenticato per creare un giocatore.");
  }

  const callerUid = request.auth.uid;
  const { email, password, displayName } = request.data;

  // Validazione argomenti
  if (!email || !password || !displayName) {
    throw new HttpsError("invalid-argument", "Email, password e displayName sono campi obbligatori.");
  }

  let callerDoc;
  try {
    // Verifica che il chiamante sia effettivamente un GM
    callerDoc = await db.collection("users").doc(callerUid).get();
    if (!callerDoc.exists || callerDoc.data().role !== "GM") {
      throw new HttpsError("permission-denied", "Solo un utente con ruolo GM può creare giocatori.");
    }

    logger.info(`GM ${callerUid} sta creando il giocatore: ${email}`);

    // Crea l'utente in Firebase Auth
    const userRecord = await admin.auth().createUser({
      email,
      password,
      displayName
    });

    const playerId = userRecord.uid;

    // Crea il profilo utente globale in /users/{playerId}
    await db.collection("users").doc(playerId).set({
      uid: playerId,
      role: "player",
      displayName,
      enabled: true,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // Crea il record giocatore associato sotto il workspace del GM
    await db.collection("gms").doc(callerUid).collection("players").doc(playerId).set({
      uid: playerId,
      displayName,
      email,
      enabled: true,
      characterIds: [],
      gmDisplayName: callerDoc.data().displayName || "Custode delle Rune",
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    logger.info(`Giocatore creato con successo: ${playerId}`);
    return { success: true, uid: playerId };
  } catch (error) {
    logger.error("Errore durante la creazione del giocatore:", error);
    // Gestione errore per email già esistente
    if (error.code === "auth/email-already-exists") {
      // Se l'utente Auth esiste già globale, vediamo se possiamo associarlo al GM
      try {
        const existingUser = await admin.auth().getUserByEmail(email);
        const playerId = existingUser.uid;

        // Verifica se è già associato a questo GM
        const playerDoc = await db.collection("gms").doc(callerUid).collection("players").doc(playerId).get();
        if (playerDoc.exists) {
          throw new HttpsError("already-exists", "Questo giocatore è già associato al tuo workspace.");
        }

        // Recupera info dell'utente esistente
        const userDoc = await db.collection("users").doc(playerId).get();
        const existingDisplayName = userDoc.exists ? userDoc.data().displayName : (existingUser.displayName || displayName);

        // Associa il giocatore al workspace del GM
        await db.collection("gms").doc(callerUid).collection("players").doc(playerId).set({
          uid: playerId,
          displayName: existingDisplayName,
          email,
          enabled: true,
          characterIds: [],
          gmDisplayName: callerDoc.data().displayName || "Custode delle Rune",
          createdAt: admin.firestore.FieldValue.serverTimestamp()
        });

        logger.info(`Giocatore esistente associato al GM ${callerUid}: ${playerId}`);
        return { success: true, uid: playerId, associatedExisting: true };
      } catch (assocError) {
        if (assocError instanceof HttpsError) throw assocError;
        throw new HttpsError("internal", "Impossibile associare l'utente esistente: " + assocError.message);
      }
    }
    throw new HttpsError("internal", error.message);
  }
});

/**
 * Abilita o disabilita l'accesso di un giocatore (Firebase Auth + Firestore)
 * Chiamabile solo dal GM che ha nel proprio spazio il giocatore.
 */
exports.togglePlayerStatus = onCall({ cors: true }, async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "L'utente deve essere autenticato.");
  }

  const callerUid = request.auth.uid;
  const { playerId, enabled } = request.data;

  if (!playerId || typeof enabled !== "boolean") {
    throw new HttpsError("invalid-argument", "playerId ed enabled (booleano) sono obbligatori.");
  }

  try {
    // Verifica che il chiamante sia un GM
    const callerDoc = await db.collection("users").doc(callerUid).get();
    if (!callerDoc.exists || callerDoc.data().role !== "GM") {
      throw new HttpsError("permission-denied", "Solo un GM può gestire i giocatori.");
    }

    // Verifica che il giocatore appartenga al workspace del GM chiamante
    const playerDoc = await db.collection("gms").doc(callerUid).collection("players").doc(playerId).get();
    if (!playerDoc.exists) {
      throw new HttpsError("not-found", "Giocatore non associato al tuo workspace.");
    }

    logger.info(`GM ${callerUid} sta impostando enabled=${enabled} per il giocatore ${playerId}`);

    // Disabilita/Abilita in Firebase Auth
    await admin.auth().updateUser(playerId, {
      disabled: !enabled
    });

    // Aggiorna profilo globale
    await db.collection("users").doc(playerId).update({
      enabled: enabled
    });

    // Aggiorna record del GM
    await db.collection("gms").doc(callerUid).collection("players").doc(playerId).update({
      enabled: enabled
    });

    return { success: true };
  } catch (error) {
    logger.error("Errore durante il toggle dello stato del giocatore:", error);
    throw new HttpsError("internal", error.message);
  }
});

/**
 * Modifica il nome e/o la password di un giocatore
 * Chiamabile solo dal GM che ha nel proprio spazio il giocatore.
 */
exports.updatePlayer = onCall({ cors: true }, async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "L'utente deve essere autenticato.");
  }

  const callerUid = request.auth.uid;
  const { playerId, displayName, password } = request.data;

  if (!playerId) {
    throw new HttpsError("invalid-argument", "playerId è obbligatorio.");
  }

  try {
    // Verifica che il chiamante sia un GM
    const callerDoc = await db.collection("users").doc(callerUid).get();
    if (!callerDoc.exists || callerDoc.data().role !== "GM") {
      throw new HttpsError("permission-denied", "Solo un GM può gestire i giocatori.");
    }

    // Verifica che il giocatore appartenga al workspace del GM chiamante
    const playerDoc = await db.collection("gms").doc(callerUid).collection("players").doc(playerId).get();
    if (!playerDoc.exists) {
      throw new HttpsError("not-found", "Giocatore non associato al tuo workspace.");
    }

    const updateParams = {};
    if (displayName) {
      updateParams.displayName = displayName.trim();
    }
    if (password) {
      updateParams.password = password;
    }

    // Aggiorna Firebase Auth se ci sono modifiche
    if (Object.keys(updateParams).length > 0) {
      logger.info(`GM ${callerUid} sta aggiornando Auth per il giocatore ${playerId}`);
      await admin.auth().updateUser(playerId, updateParams);
    }

    // Aggiorna Firestore se il nome è cambiato
    if (displayName) {
      logger.info(`GM ${callerUid} sta aggiornando Firestore (displayName) per il giocatore ${playerId}`);
      await db.collection("users").doc(playerId).update({ displayName: displayName.trim() });
      await db.collection("gms").doc(callerUid).collection("players").doc(playerId).update({ displayName: displayName.trim() });
    }

    return { success: true };
  } catch (error) {
    logger.error("Errore durante l'aggiornamento del giocatore:", error);
    throw new HttpsError("internal", error.message);
  }
});

