// ==========================================================
// 1. IMPORTATIONS ET CONFIGURATION DES CLÉS (EN HAUT DU FICHIER)
// ==========================================================
const express = require('express');
const fs = require('fs'); // Module pour la suppression des fichiers locaux
const dotenv = require('dotenv');
const cloudinary = require('cloudinary').v2;
const multer = require('multer');

// Charge les variables d'environnement depuis le fichier .env
dotenv.config(); 

const app = express();

// Middlewares de base (pour Express)
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configuration Cloudinary : utilise les clés secrètes du .env
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Configuration de Multer : Stockage temporaire dans le dossier 'uploads/'
const upload = multer({ dest: 'uploads/' });

// ==========================================================
// 2. ROUTE DE TÉLÉVERSEMENT (VOTRE CODE CORRIGÉ)
// ==========================================================

app.post('/upload-photo', upload.single('photo'), async (req, res) => {
    
    // 🛑 VÉRIFICATION IMPORTANTE : Le fichier Multer doit être là
    if (!req.file) {
        return res.status(400).json({ error: 'Aucun fichier photo n\'a été reçu.' });
    }
    
    const filePath = req.file.path; // Le chemin temporaire où Multer a sauvé le fichier

    try {
        // 1. Envoi du fichier à Cloudinary
        const result = await cloudinary.uploader.upload(filePath, {
            folder: "photos-app-levig", // Dossier pour mieux organiser vos photos dans Cloudinary
            use_filename: true,
            unique_filename: false,
            overwrite: true
        });

        // 2. Suppression du fichier temporaire local (Très important sur un serveur cloud !)
        // On utilise 'fs' qui a été importé en haut du fichier.
        fs.unlinkSync(filePath); 

        // 3. Récupération du lien public et envoi au client
        const secureUrl = result.secure_url; // L'URL de votre photo stockée sur Cloudinary

        // TODO: INTÉGRATION BASE DE DONNÉES : ENREGISTRER 'secureUrl' ICI

        console.log("Photo sauvegardée sur Cloudinary :", secureUrl);

        res.status(200).json({ 
            message: "Photo téléversée avec succès", 
            photoUrl: secureUrl 
        });

    } catch (error) {
        console.error("Erreur d'upload Cloudinary:", error);
        
        // Si l'upload échoue, on s'assure de supprimer le fichier temporaire
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath); 
        }
        
        res.status(500).json({ error: "Erreur interne lors de l'envoi de la photo." });
    }
});

// ==========================================================
// 3. DÉMARRAGE DU SERVEUR (ADAPTÉ POUR LE CLOUD)
// ==========================================================

// Le cloud (Render) définira la variable d'environnement PORT. 
// Si elle n'existe pas, nous utilisons 5000 par défaut (pour les tests locaux).
const PORT = process.env.PORT || 5000; 

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});