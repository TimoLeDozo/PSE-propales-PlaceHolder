# 🚀 PSE - Générateur de Propales (Moteur PlaceHolder)

> ##L'alliance de l'interface "Neural" et de la robustesse documentaire par balises.##

Ce projet est une **Web App Google Apps Script** autonome destinée au Pôle Services Entreprises (PSE) de l'Icam. Elle permet de générer des propositions commerciales (Contrats R&D) complètes, chiffrées et mises en forme en moins d'une minute, grâce à l'intelligence artificielle (DeepSeek).

---

## 📜 Genèse du projet : Pourquoi la solution placeHolder ? 

Ce projet est né d'un constat technique critique sur la version précédente (Color Mapping).

### Le problème de la Solution (Color Mapping)
Initialement, le moteur de génération reposait sur une détection par **couleur de fond** (ex: le script cherchait du texte surligné en `#FFFF00` pour le remplacer par le "Nom de l'entreprise").
* ❌ **Fragilité :** Si un utilisateur changeait la nuance de jaune d'un pixel, le script échouait.
* ❌ **Maintenance :** Le template ressemblait à un arlequin, difficile à lire pour un humain.
* ❌ **Rigidité :** Impossible de gérer proprement des insertions complexes (images, tableaux dynamiques).

### La solution (Placeholders)
Nous avons pivoté vers une approche standardisée industrielle : les **Placeholders Textuels**.
* ✅ **Robustesse :** Le script cherche des balises explicites comme `{{entrepriseNom}}` ou `{{budgetTotal}}`.
* ✅ **Flexibilité :** Le template est un document lisible, propre, où les balises se fondent dans le texte.
* ✅ **Puissance :** Permet l'injection d'images (logos) en Base64 et la gestion de blocs conditionnels.

Ce dépôt contient donc la **version ultime**, fusionnant l'interface utilisateur avancée de la B1 avec le moteur robuste de la B2.

---

## ✨ Fonctionnalités Clés

### 🧠 Intelligence Artificielle (DeepSeek)
* Intégration du modèle **DeepSeek-Reasoner** via API.
* **Prompt Expert :** L'IA agit comme un consultant Senior Icam (ton, vocabulaire technique, structure "Sujets").
* **Contexte Riche :** L'utilisateur peut fournir l'histoire de l'entreprise, les lieux et les enjeux spécifiques.

### 👁️ OCR & Analyse Documentaire (RAG)
* **Upload Multi-fichiers :** L'utilisateur peut déposer des PDF, images ou fichiers texte.
* **Lecture Automatique :** Le script extrait le texte de ces documents (via OCR Drive) pour nourrir l'IA avant la rédaction.

### 🎨 Interface "Neural Matrix"
* Design sombre, moderne et réactif.
* **Feedback temps réel :** Estimation des tokens, coût API, barres de progression.
* **Dictée Vocale :** Remplissage des champs par la voix.
* **Console de Debug :** Affichage transparent du "raisonnement" de l'IA.

### ⚙️ Moteur Technique (Google Apps Script)
* **Regex Engine :** Remplacement ultra-rapide des balises `{{...}}`.
* **Gestion Image :** Détection automatique des URLs d'images pour insertion et redimensionnement dans le Doc.
* **Calculs Automatiques :** Budget, dates, durées basés sur les règles métiers du PSE.
* **Archivage :** Sauvegarde automatique des PDF et des logs de coûts dans un dossier Drive cible.

---

## 🛠️ Structure du Projet

Le projet est conçu pour être "Standalone" (facile à déployer) :

* `Code.js` : Le cerveau (Backend). Gère les appels API, la manipulation Drive/Doc et l'OCR.
* `Index.html` : Le corps (Frontend). Contient tout le HTML, CSS (Neural Design) et JavaScript client.

---

## 🚀 Installation & Déploiement

1.  Créer un nouveau projet sur **script.google.com**.
2.  Copier le contenu de `Code.js` et `Index.html`.
3.  Activer le service avancé **Drive API** (pour l'OCR).
4.  Renseigner les constantes dans `Code.js` :
    * `TEMPLATE_DOC_ID` : ID du Google Doc modèle (avec les balises `{{...}}`).
    * `DESTINATION_FOLDER_ID` : ID du dossier de destination.
    * `API_KEY` : Dans les propriétés du script.
5.  Déployer en tant qu'**Application Web**.

---

*Projet maintenu par [TimoLeDozo](https://github.com/TimoLeDozo).*

