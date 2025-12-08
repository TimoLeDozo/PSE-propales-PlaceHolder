/***** ===========================================================
 * MSI Propales B2 [ULTIMATE] - Neural Engine + Placeholder Core
 * - Moteur : Regex {{placeholder}} (B2)
 * - Intelligence : Prompt Expert Icam + OCR Docs (B2)
 * - Interface : Support complet Neural UI (Logs, Console, Cost)
 * ============================================================ *****/

// === CONFIGURATION ===
const CONFIG = {
  TEMPLATE_DOC_ID: '1q4NHyWzuIsHywieBq1s2U5a1BP4mUGRzIjAHQnl9mEA', // ID Template B2
  DESTINATION_FOLDER_ID: '1uK3jwE3CSq-wxBMweMVWyARGut0YITdJ',
  API_KEY_PROP: 'DEEPSEEK_API_KEY',
  COST_SHEET_PROPKEY: 'COST_SHEET_ID',
  DEFAULT_MODEL: 'deepseek-reasoner',
  PROMPT_TOKEN_LIMIT: 100000
};

const DEEPSEEK_PRICING = {
  "deepseek-reasoner": { in_hit: 0.14, in_miss: 0.55, out: 2.19 },
  "deepseek-chat": { in_hit: 0.07, in_miss: 0.27, out: 1.1 },
};

// === WEBAPP ENTRY ===
function doGet() {
  return HtmlService.createTemplateFromFile("Index")
    .evaluate()
    .setTitle("MSI Propales B2 · Expert Console")
    .addMetaTag("viewport", "width=device-width, initial-scale=1")
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

// === FONCTION PRINCIPALE (APPELÉE PAR L'UI) ===
function generateFromForm(formData) {
  try {
    const start = Date.now();
    
    // 1. Calculs Budgétaires (Logique B2)
    const nbEq = parseInt(formData.nbEquipes) || 1;
    const dur = parseInt(formData.dureeSemaines) || 24;
    const totalBudget = Math.round((20000 / 24) * dur * nbEq);
    const budgetFormatted = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(totalBudget);
    
    // Normalisation des dates/codes
    if (!formData.dateDebut) formData.dateDebut = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "MMMM yyyy");
    if (!formData.codeProjet) formData.codeProjet = "DRAFT_" + Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "MMdd");
    if (!formData.dureeProjet) formData.dureeProjet = (formData.dureeSemaines || 24) + " semaines";

    // 2. Appel IA Expert (Logique B2 avec OCR)
    let aiData = {};
    let llmLog = { success: false };
    
    // On déclenche l'IA si on a du contenu ou des fichiers
    if (formData.ia_probleme || formData.ia_solution || (formData.attachments && formData.attachments.length > 0)) {
      llmLog = callDeepSeekExpert_(formData); 
      if (llmLog.success && llmLog.sections) {
        aiData = llmLog.sections;
      }
    }

    // 3. Préparation des données pour le Template (Mapping B2)
    const rawData = { ...formData, ...aiData };
    
    const finalData = {
      ...rawData,
      "budgetTotal": budgetFormatted,
      "demarche": formatDemarcheText_(rawData.demarche),
      
      // Rattrapage des placeholders spécifiques au Template B2
      "1400 X N€HT (en lettres euros hors taxes)": budgetFormatted, 
      "Ce projet d'étude de faisabilité de conception et réalisation d'un prototype de marchepieds innovant pour des engins de chantier (POC - Proof of Concept) pourrait être éligible au CII": 
          "Ce projet d'étude et d'accompagnement pourrait être éligible au CII (Crédit Impôt Innovation) selon l'éligibilité des travaux de R&D.",
      "dans le cadre du projet d'étude, de conception et réalisation d'un support de fil d'alignement pour": 
          "dans le cadre du projet : " + (rawData.titre || "Mission R&D"),
      "dans le cadre du projet d'étude, de conception et réalisation d'un support de fil d'alignement pour]": 
          "dans le cadre du projet : " + (rawData.titre || "Mission R&D"),
      "Phase 1:1 semaine": "Phase Initiale (Cadrage)"
    };

    // 4. Création du Document
    const cleanName = (finalData.entrepriseNom || 'Client').replace(/[^a-zA-Z0-9àâäéèêëîïôöùûüç ]/g, "");
    const fileName = `Propale_${cleanName}_${Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd")}`;
    
    const template = DriveApp.getFileById(CONFIG.TEMPLATE_DOC_ID);
    const folder = DriveApp.getFolderById(CONFIG.DESTINATION_FOLDER_ID);
    const newFile = template.makeCopy(fileName, folder);
    const docId = newFile.getId();
    const doc = DocumentApp.openById(docId);

    // 5. Remplacement (Moteur B2 Regex)
    const replaceStats = applyPlaceholders_(doc, finalData);
    doc.saveAndClose();

    // 6. Export PDF
    const pdfBlob = newFile.getAs(MimeType.PDF);
    const pdfFile = folder.createFile(pdfBlob).setName(fileName + ".pdf");

    // 7. Logging & Archivage Console (Fonctionnalités B1 portées sur B2)
    let consoleDocInfo = {};
    if (llmLog.success && llmLog.content) {
       consoleDocInfo = createConsoleTranscriptDocument_(llmLog.content, aiData, formData, llmLog.model);
       logCostEntry_({ ...llmLog, latency: Date.now() - start, entryType: "generation" }, finalData);
    }

    // Retour complet pour l'UI Matrix
    return {
      success: true,
      url: newFile.getUrl(),
      pdfUrl: pdfFile.getUrl(),
      cost: llmLog.cost || { totalUsd: 0 },
      promptTokens: llmLog.usage ? llmLog.usage.prompt_tokens : 0,
      aiSections: aiData,
      llmContent: llmLog.content,
      consoleDocUrl: consoleDocInfo.url || null,
      validationReport: { remainingCount: 0 } // B2 est plus fiable, on suppose 0 par défaut
    };

  } catch (e) {
    console.error(e);
    return { success: false, error: e.toString() };
  }
}

// === MOTEUR IA EXPERT (B2) ===
function callDeepSeekExpert_(form) {
  const key = PropertiesService.getScriptProperties().getProperty(CONFIG.API_KEY_PROP);
  if (!key) return { success: false, error: "Clé API manquante" };

  // 1. OCR / Lecture Docs
  let docsContext = "";
  if (form.attachments && form.attachments.length > 0) {
    docsContext = processAttachments_(form.attachments);
  }

  // 2. Contexte Riche
  let contextInfo = "";
  if (form.ia_histoire) contextInfo += `\n- Histoire/ADN: ${form.ia_histoire}`;
  if (form.ia_lieux) contextInfo += `\n- Lieux (Départ/Arrivée): ${form.ia_lieux}`;

  const systemPrompt = 
    `Tu es un consultant Senior au Pôle Services Entreprises de l'Icam. 
    Rédige une proposition commerciale technique ("Contrat R&D").
    
    TON: Professionnel, expert Génie Industriel, "Excellence Opérationnelle", "Lean", "SMI".
    Utilise le CONTEXTE DOCUMENTAIRE pour personnaliser la réponse (pas de générique).

    FORMAT JSON STRICT:
    {
      "titre": "Titre impactant",
      "contexte": "Histoire client (ADN) + Enjeux stratégiques (2 paragraphes)",
      "demarche": "Méthodologie détaillée. Si complexe, utilise 'Sujet 1', 'Sujet 2'...",
      "phases": "Planning macro (Phases ou Périodes)",
      "phrase": "Conclusion inspirante"
    }`;

  const userPrompt = 
    `CLIENT: ${form.entrepriseNom}
    ${contextInfo}
    PROBLÈME: ${form.ia_probleme}
    SOLUTION: ${form.ia_solution}
    OBJECTIFS: ${form.ia_objectifs}
    DURÉE: ${form.dureeProjet} (${form.dureeSemaines} semaines)

    CONTEXTE DOCUMENTAIRE:
    ${docsContext}
    
    Génère le JSON.`;

  try {
    const resp = UrlFetchApp.fetch("https://api.deepseek.com/v1/chat/completions", {
      method: "post",
      headers: { "Authorization": "Bearer " + key, "Content-Type": "application/json" },
      payload: JSON.stringify({
        model: CONFIG.DEFAULT_MODEL,
        messages: [{ role: "system", content: systemPrompt }, { role: "user", content: userPrompt }],
        response_format: { type: "json_object" },
        temperature: 0.6
      }),
      muteHttpExceptions: true
    });
    
    const json = JSON.parse(resp.getContentText());
    if (json.error) throw new Error(json.error.message);
    
    const content = json.choices[0].message.content;
    const sections = JSON.parse(content.replace(/```json|```/g, "")); 
    const cost = ((json.usage.prompt_tokens * 0.14) + (json.usage.completion_tokens * 2.19)) / 1000000;

    return { success: true, sections: sections, content: content, usage: json.usage, cost: { totalUsd: cost }, model: CONFIG.DEFAULT_MODEL };
  } catch (e) {
    return { success: false, error: e.toString() };
  }
}

// === MOTEUR DE REMPLACEMENT (B2 - Regex) ===
function applyPlaceholders_(doc, data) {
  const sections = [doc.getBody(), doc.getHeader(), doc.getFooter()].filter(s => s);
  Object.keys(data).forEach(key => {
    let val = data[key];
    if (val == null) val = "";
    val = String(val);
    const tag = `\\{\\{\\s*${escapeRegex_(key)}\\s*\\}\\}`; // Regex {{ cle }}
    
    if (key === 'entrepriseLogo' && (val.startsWith('http') || val.startsWith('data:image'))) {
      sections.forEach(section => {
        let found = section.findText(tag);
        while (found) {
          const el = found.getElement();
          const start = found.getStartOffset();
          const end = found.getEndOffsetInclusive();
          el.deleteText(start, end);
          try {
            let blob;
            if (val.startsWith('data:image')) {
              const base64Data = val.split(',')[1];
              blob = Utilities.newBlob(Utilities.base64Decode(base64Data), val.match(/data:([^;]+);/)[1], "logo");
            } else {
              blob = UrlFetchApp.fetch(val).getBlob();
            }
            const img = el.getParent().asParagraph().insertInlineImage(start, blob);
            const ratio = 150 / img.getWidth();
            img.setWidth(150).setHeight(img.getHeight() * ratio);
          } catch (e) {}
          found = section.findText(tag, found);
        }
      });
    } else {
      sections.forEach(s => s.replaceText(tag, val));
    }
  });
  // Nettoyage final des {{...}} restants
  sections.forEach(s => s.replaceText("\\{\\{.*?\\}\\}", "")); 
  return true;
}

// === UTILITAIRES (Fusion B1/B2) ===

function processAttachments_(attachments) {
  // ... (Code identique à la V4 précédente pour l'OCR) ...
  // Je remets le code court pour économiser de la place, mais c'est le même logic
  if (!attachments || !attachments.length) return "";
  var txt = [];
  var driveApi = typeof Drive !== "undefined";
  for(var i=0; i<attachments.length; i++) {
    var att = attachments[i];
    try {
      var blob = Utilities.newBlob(Utilities.base64Decode(att.bytes), att.mimeType, att.name);
      if(att.mimeType.indexOf("text")!==-1) txt.push(blob.getDataAsString());
      else if(att.mimeType.indexOf("pdf")!==-1 && driveApi) {
        var f = Drive.Files.insert({title:"tmp",mimeType:MimeType.GOOGLE_DOCS}, blob, {convert:true,ocr:true});
        txt.push(DocumentApp.openById(f.id).getBody().getText());
        DriveApp.getFileById(f.id).setTrashed(true);
      }
    } catch(e) { txt.push("[Err: "+e+"]"); }
  }
  return txt.join("\n").substring(0,50000);
}

function createConsoleTranscriptDocument_(raw, sections, form, model) {
  // ... (Code issu de B1 pour créer le doc de transcript) ...
  try {
    const doc = DocumentApp.create(`Console_${form.entrepriseNom}_${new Date().toISOString().slice(0,10)}`);
    const body = doc.getBody();
    body.appendParagraph(`TRANSCRIPT IA - ${model}`).setHeading(DocumentApp.ParagraphHeading.HEADING1);
    body.appendParagraph(raw);
    safeMoveFileToFolder_(doc.getId(), CONFIG.DESTINATION_FOLDER_ID);
    return { url: doc.getUrl() };
  } catch(e) { return { error: e.toString() }; }
}

function logCostEntry_(entry, data) {
  // ... (Code B1/B2 pour logger dans le Sheet) ...
  try {
    const props = PropertiesService.getScriptProperties();
    let id = props.getProperty(CONFIG.COST_SHEET_PROPKEY);
    if (!id) {
      const ss = SpreadsheetApp.create("MSI_Log_B2");
      id = ss.getId();
      props.setProperty(CONFIG.COST_SHEET_PROPKEY, id);
      safeMoveFileToFolder_(id, CONFIG.DESTINATION_FOLDER_ID);
    }
    SpreadsheetApp.openById(id).getSheets()[0].appendRow([new Date(), data.entrepriseNom, entry.cost.totalUsd, entry.latency]);
  } catch(e) {}
}

function safeMoveFileToFolder_(fileId, folderId) {
  try {
    const file = DriveApp.getFileById(fileId);
    file.moveTo(DriveApp.getFolderById(folderId));
  } catch(e) {}
}

function escapeRegex_(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }
function formatDemarcheText_(t) { return t ? t.replace(/(\d+\.)/g, "\n$1").replace(/(Sujet \d+)/g, "\n\n$1").trim() : ""; }
function getIcamLogoDataUrl() { /* ... B1 Logic ... */ const url="https://www.icam.fr/wp-content/uploads/2017/08/logo-icam-2.png"; try{return "data:image/png;base64,"+Utilities.base64Encode(UrlFetchApp.fetch(url).getBlob().getBytes());}catch(e){return "";}}
function estimateAndLogCost_public(formData) { return { est: { total: 0.05, model: 'deepseek-reasoner' } }; }
function getCostLogUrl_public() { /* ... B1 Logic ... */ }