// Internationalization (i18n) translations
// Supported languages: English, Spanish, French, German, Hindi

const translations = {
    en: {
        // Navigation
        nav: {
            dashboard: 'Dashboard',
            projects: 'Projects',
            upload: 'Upload RFP',
            answers: 'Answer Library',
            knowledge: 'Knowledge Base',
            settings: 'Settings',
            logout: 'Logout',
            login: 'Login',
            signup: 'Sign Up'
        },
        // Common
        common: {
            save: 'Save',
            cancel: 'Cancel',
            delete: 'Delete',
            edit: 'Edit',
            close: 'Close',
            search: 'Search',
            filter: 'Filter',
            loading: 'Loading...',
            noResults: 'No results found',
            error: 'An error occurred',
            success: 'Success!',
            confirm: 'Confirm',
            back: 'Back',
            next: 'Next',
            previous: 'Previous'
        },
        // Dashboard
        dashboard: {
            welcome: 'Welcome back',
            recentProjects: 'Recent Projects',
            quickActions: 'Quick Actions',
            uploadNew: 'Upload New RFP',
            viewAll: 'View All',
            noProjects: 'No projects yet. Upload your first RFP to get started!'
        },
        // Editor
        editor: {
            generateAll: 'Generate All Responses',
            regenerate: 'Regenerate',
            suggest: 'Suggest',
            edit: 'Edit',
            history: 'History',
            approve: 'Approve',
            exportPdf: 'Export PDF',
            exportWord: 'Export Word',
            trustScore: 'Trust Score',
            pending: 'Pending',
            generated: 'Generated',
            edited: 'Edited',
            approved: 'Approved'
        },
        // Answer Library
        answerLibrary: {
            title: 'Answer Library',
            addAnswer: 'Add Answer',
            editAnswer: 'Edit Answer',
            savedAnswers: 'saved answers',
            question: 'Question',
            answer: 'Answer',
            category: 'Category',
            tags: 'Tags',
            used: 'times used',
            cleanup: 'Cleanup',
            duplicates: 'Duplicates',
            outdated: 'Outdated'
        },
        // Go/No-Go
        goNoGo: {
            title: 'Go/No-Go Decision',
            evaluate: 'Evaluate Opportunity',
            budgetFit: 'Budget Fit',
            timeline: 'Timeline Feasibility',
            capability: 'Technical Capability',
            strategic: 'Strategic Alignment',
            resources: 'Resource Availability',
            competition: 'Competition Level',
            relationship: 'Client Relationship',
            winProb: 'Win Probability',
            go: 'Go',
            noGo: 'No-Go',
            maybe: 'Maybe'
        },
        // Upload
        upload: {
            title: 'Upload RFP',
            dragDrop: 'Drag and drop your RFP document here',
            orClick: 'or click to browse',
            supportedFormats: 'Supported formats: PDF, Word, Excel',
            projectName: 'Project Name',
            clientName: 'Client Name',
            dueDate: 'Due Date',
            uploading: 'Uploading & Processing...'
        },
        // Settings
        settings: {
            title: 'Settings',
            profile: 'Profile',
            account: 'Account',
            language: 'Language',
            theme: 'Theme',
            notifications: 'Notifications',
            billing: 'Billing',
            team: 'Team'
        }
    },

    es: {
        nav: {
            dashboard: 'Panel',
            projects: 'Proyectos',
            upload: 'Subir RFP',
            answers: 'Biblioteca de Respuestas',
            knowledge: 'Base de Conocimiento',
            settings: 'Configuración',
            logout: 'Cerrar Sesión',
            login: 'Iniciar Sesión',
            signup: 'Registrarse'
        },
        common: {
            save: 'Guardar',
            cancel: 'Cancelar',
            delete: 'Eliminar',
            edit: 'Editar',
            close: 'Cerrar',
            search: 'Buscar',
            filter: 'Filtrar',
            loading: 'Cargando...',
            noResults: 'Sin resultados',
            error: 'Ocurrió un error',
            success: '¡Éxito!',
            confirm: 'Confirmar',
            back: 'Atrás',
            next: 'Siguiente',
            previous: 'Anterior'
        },
        dashboard: {
            welcome: 'Bienvenido',
            recentProjects: 'Proyectos Recientes',
            quickActions: 'Acciones Rápidas',
            uploadNew: 'Subir Nuevo RFP',
            viewAll: 'Ver Todo',
            noProjects: '¡No hay proyectos aún. Sube tu primer RFP para comenzar!'
        },
        editor: {
            generateAll: 'Generar Todas las Respuestas',
            regenerate: 'Regenerar',
            suggest: 'Sugerir',
            edit: 'Editar',
            history: 'Historial',
            approve: 'Aprobar',
            exportPdf: 'Exportar PDF',
            exportWord: 'Exportar Word',
            trustScore: 'Puntuación de Confianza',
            pending: 'Pendiente',
            generated: 'Generado',
            edited: 'Editado',
            approved: 'Aprobado'
        },
        answerLibrary: {
            title: 'Biblioteca de Respuestas',
            addAnswer: 'Agregar Respuesta',
            editAnswer: 'Editar Respuesta',
            savedAnswers: 'respuestas guardadas',
            question: 'Pregunta',
            answer: 'Respuesta',
            category: 'Categoría',
            tags: 'Etiquetas',
            used: 'veces usado',
            cleanup: 'Limpieza',
            duplicates: 'Duplicados',
            outdated: 'Obsoleto'
        },
        goNoGo: {
            title: 'Decisión Go/No-Go',
            evaluate: 'Evaluar Oportunidad',
            budgetFit: 'Ajuste de Presupuesto',
            timeline: 'Viabilidad del Cronograma',
            capability: 'Capacidad Técnica',
            strategic: 'Alineación Estratégica',
            resources: 'Disponibilidad de Recursos',
            competition: 'Nivel de Competencia',
            relationship: 'Relación con Cliente',
            winProb: 'Probabilidad de Ganar',
            go: 'Ir',
            noGo: 'No Ir',
            maybe: 'Quizás'
        },
        upload: {
            title: 'Subir RFP',
            dragDrop: 'Arrastra y suelta tu documento RFP aquí',
            orClick: 'o haz clic para buscar',
            supportedFormats: 'Formatos soportados: PDF, Word, Excel',
            projectName: 'Nombre del Proyecto',
            clientName: 'Nombre del Cliente',
            dueDate: 'Fecha de Entrega',
            uploading: 'Subiendo y Procesando...'
        },
        settings: {
            title: 'Configuración',
            profile: 'Perfil',
            account: 'Cuenta',
            language: 'Idioma',
            theme: 'Tema',
            notifications: 'Notificaciones',
            billing: 'Facturación',
            team: 'Equipo'
        }
    },

    fr: {
        nav: {
            dashboard: 'Tableau de Bord',
            projects: 'Projets',
            upload: 'Télécharger RFP',
            answers: 'Bibliothèque de Réponses',
            knowledge: 'Base de Connaissances',
            settings: 'Paramètres',
            logout: 'Déconnexion',
            login: 'Connexion',
            signup: 'Inscription'
        },
        common: {
            save: 'Sauvegarder',
            cancel: 'Annuler',
            delete: 'Supprimer',
            edit: 'Modifier',
            close: 'Fermer',
            search: 'Rechercher',
            filter: 'Filtrer',
            loading: 'Chargement...',
            noResults: 'Aucun résultat',
            error: 'Une erreur est survenue',
            success: 'Succès!',
            confirm: 'Confirmer',
            back: 'Retour',
            next: 'Suivant',
            previous: 'Précédent'
        },
        dashboard: {
            welcome: 'Bienvenue',
            recentProjects: 'Projets Récents',
            quickActions: 'Actions Rapides',
            uploadNew: 'Nouveau RFP',
            viewAll: 'Voir Tout',
            noProjects: 'Pas encore de projets. Téléchargez votre premier RFP!'
        },
        editor: {
            generateAll: 'Générer Toutes les Réponses',
            regenerate: 'Régénérer',
            suggest: 'Suggérer',
            edit: 'Modifier',
            history: 'Historique',
            approve: 'Approuver',
            exportPdf: 'Exporter PDF',
            exportWord: 'Exporter Word',
            trustScore: 'Score de Confiance',
            pending: 'En Attente',
            generated: 'Généré',
            edited: 'Modifié',
            approved: 'Approuvé'
        },
        answerLibrary: {
            title: 'Bibliothèque de Réponses',
            addAnswer: 'Ajouter Réponse',
            editAnswer: 'Modifier Réponse',
            savedAnswers: 'réponses sauvegardées',
            question: 'Question',
            answer: 'Réponse',
            category: 'Catégorie',
            tags: 'Tags',
            used: 'fois utilisé',
            cleanup: 'Nettoyage',
            duplicates: 'Doublons',
            outdated: 'Obsolète'
        },
        goNoGo: {
            title: 'Décision Go/No-Go',
            evaluate: 'Évaluer Opportunité',
            budgetFit: 'Adéquation Budget',
            timeline: 'Faisabilité Délais',
            capability: 'Capacité Technique',
            strategic: 'Alignement Stratégique',
            resources: 'Disponibilité Ressources',
            competition: 'Niveau Concurrence',
            relationship: 'Relation Client',
            winProb: 'Probabilité de Gain',
            go: 'Go',
            noGo: 'No-Go',
            maybe: 'Peut-être'
        },
        upload: {
            title: 'Télécharger RFP',
            dragDrop: 'Glissez-déposez votre document RFP ici',
            orClick: 'ou cliquez pour parcourir',
            supportedFormats: 'Formats supportés: PDF, Word, Excel',
            projectName: 'Nom du Projet',
            clientName: 'Nom du Client',
            dueDate: 'Date Limite',
            uploading: 'Téléchargement et Traitement...'
        },
        settings: {
            title: 'Paramètres',
            profile: 'Profil',
            account: 'Compte',
            language: 'Langue',
            theme: 'Thème',
            notifications: 'Notifications',
            billing: 'Facturation',
            team: 'Équipe'
        }
    },

    de: {
        nav: {
            dashboard: 'Dashboard',
            projects: 'Projekte',
            upload: 'RFP Hochladen',
            answers: 'Antwortbibliothek',
            knowledge: 'Wissensdatenbank',
            settings: 'Einstellungen',
            logout: 'Abmelden',
            login: 'Anmelden',
            signup: 'Registrieren'
        },
        common: {
            save: 'Speichern',
            cancel: 'Abbrechen',
            delete: 'Löschen',
            edit: 'Bearbeiten',
            close: 'Schließen',
            search: 'Suchen',
            filter: 'Filtern',
            loading: 'Laden...',
            noResults: 'Keine Ergebnisse',
            error: 'Ein Fehler ist aufgetreten',
            success: 'Erfolg!',
            confirm: 'Bestätigen',
            back: 'Zurück',
            next: 'Weiter',
            previous: 'Vorherige'
        },
        dashboard: {
            welcome: 'Willkommen zurück',
            recentProjects: 'Aktuelle Projekte',
            quickActions: 'Schnellaktionen',
            uploadNew: 'Neues RFP',
            viewAll: 'Alle Anzeigen',
            noProjects: 'Noch keine Projekte. Laden Sie Ihr erstes RFP hoch!'
        },
        editor: {
            generateAll: 'Alle Antworten Generieren',
            regenerate: 'Regenerieren',
            suggest: 'Vorschlagen',
            edit: 'Bearbeiten',
            history: 'Verlauf',
            approve: 'Genehmigen',
            exportPdf: 'PDF Exportieren',
            exportWord: 'Word Exportieren',
            trustScore: 'Vertrauenswert',
            pending: 'Ausstehend',
            generated: 'Generiert',
            edited: 'Bearbeitet',
            approved: 'Genehmigt'
        },
        answerLibrary: {
            title: 'Antwortbibliothek',
            addAnswer: 'Antwort Hinzufügen',
            editAnswer: 'Antwort Bearbeiten',
            savedAnswers: 'gespeicherte Antworten',
            question: 'Frage',
            answer: 'Antwort',
            category: 'Kategorie',
            tags: 'Tags',
            used: 'mal verwendet',
            cleanup: 'Aufräumen',
            duplicates: 'Duplikate',
            outdated: 'Veraltet'
        },
        goNoGo: {
            title: 'Go/No-Go Entscheidung',
            evaluate: 'Chance Bewerten',
            budgetFit: 'Budgeteignung',
            timeline: 'Zeitplan Machbarkeit',
            capability: 'Technische Fähigkeit',
            strategic: 'Strategische Ausrichtung',
            resources: 'Ressourcenverfügbarkeit',
            competition: 'Wettbewerbsniveau',
            relationship: 'Kundenbeziehung',
            winProb: 'Gewinnwahrscheinlichkeit',
            go: 'Go',
            noGo: 'No-Go',
            maybe: 'Vielleicht'
        },
        upload: {
            title: 'RFP Hochladen',
            dragDrop: 'RFP-Dokument hier ablegen',
            orClick: 'oder klicken zum Durchsuchen',
            supportedFormats: 'Unterstützte Formate: PDF, Word, Excel',
            projectName: 'Projektname',
            clientName: 'Kundenname',
            dueDate: 'Fälligkeitsdatum',
            uploading: 'Hochladen und Verarbeiten...'
        },
        settings: {
            title: 'Einstellungen',
            profile: 'Profil',
            account: 'Konto',
            language: 'Sprache',
            theme: 'Thema',
            notifications: 'Benachrichtigungen',
            billing: 'Abrechnung',
            team: 'Team'
        }
    },

    hi: {
        nav: {
            dashboard: 'डैशबोर्ड',
            projects: 'प्रोजेक्ट्स',
            upload: 'RFP अपलोड करें',
            answers: 'उत्तर पुस्तकालय',
            knowledge: 'ज्ञान आधार',
            settings: 'सेटिंग्स',
            logout: 'लॉग आउट',
            login: 'लॉग इन',
            signup: 'साइन अप करें'
        },
        common: {
            save: 'सहेजें',
            cancel: 'रद्द करें',
            delete: 'हटाएं',
            edit: 'संपादित करें',
            close: 'बंद करें',
            search: 'खोजें',
            filter: 'फ़िल्टर',
            loading: 'लोड हो रहा है...',
            noResults: 'कोई परिणाम नहीं',
            error: 'एक त्रुटि हुई',
            success: 'सफलता!',
            confirm: 'पुष्टि करें',
            back: 'वापस',
            next: 'अगला',
            previous: 'पिछला'
        },
        dashboard: {
            welcome: 'स्वागत है',
            recentProjects: 'हाल के प्रोजेक्ट्स',
            quickActions: 'त्वरित कार्रवाई',
            uploadNew: 'नया RFP अपलोड करें',
            viewAll: 'सभी देखें',
            noProjects: 'अभी तक कोई प्रोजेक्ट नहीं। शुरू करने के लिए अपना पहला RFP अपलोड करें!'
        },
        editor: {
            generateAll: 'सभी उत्तर उत्पन्न करें',
            regenerate: 'पुनः उत्पन्न करें',
            suggest: 'सुझाव दें',
            edit: 'संपादित करें',
            history: 'इतिहास',
            approve: 'अनुमोदन करें',
            exportPdf: 'PDF निर्यात करें',
            exportWord: 'Word निर्यात करें',
            trustScore: 'विश्वास स्कोर',
            pending: 'लंबित',
            generated: 'उत्पन्न',
            edited: 'संपादित',
            approved: 'अनुमोदित'
        },
        answerLibrary: {
            title: 'उत्तर पुस्तकालय',
            addAnswer: 'उत्तर जोड़ें',
            editAnswer: 'उत्तर संपादित करें',
            savedAnswers: 'सहेजे गए उत्तर',
            question: 'प्रश्न',
            answer: 'उत्तर',
            category: 'श्रेणी',
            tags: 'टैग',
            used: 'बार उपयोग किया गया',
            cleanup: 'सफाई',
            duplicates: 'डुप्लिकेट',
            outdated: 'पुराना'
        },
        goNoGo: {
            title: 'Go/No-Go निर्णय',
            evaluate: 'अवसर का मूल्यांकन करें',
            budgetFit: 'बजट फिट',
            timeline: 'समयरेखा व्यवहार्यता',
            capability: 'तकनीकी क्षमता',
            strategic: 'रणनीतिक संरेखण',
            resources: 'संसाधन उपलब्धता',
            competition: 'प्रतिस्पर्धा स्तर',
            relationship: 'ग्राहक संबंध',
            winProb: 'जीतने की संभावना',
            go: 'Go',
            noGo: 'No-Go',
            maybe: 'शायद'
        },
        upload: {
            title: 'RFP अपलोड करें',
            dragDrop: 'अपना RFP दस्तावेज़ यहाँ खींचें और छोड़ें',
            orClick: 'या ब्राउज़ करने के लिए क्लिक करें',
            supportedFormats: 'समर्थित प्रारूप: PDF, Word, Excel',
            projectName: 'प्रोजेक्ट का नाम',
            clientName: 'ग्राहक का नाम',
            dueDate: 'नियत तारीख',
            uploading: 'अपलोड और प्रोसेसिंग हो रही है...'
        },
        settings: {
            title: 'सेटिंग्स',
            profile: 'प्रोफ़ाइल',
            account: 'खाता',
            language: 'भाषा',
            theme: 'थीम',
            notifications: 'सूचनाएं',
            billing: 'बिलिंग',
            team: 'टीम'
        }
    }
};

// Available languages
export const LANGUAGES = [
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'es', name: 'Español', flag: '🇪🇸' },
    { code: 'fr', name: 'Français', flag: '🇫🇷' },
    { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
    { code: 'hi', name: 'हिंदी', flag: '🇮🇳' }
];

// Get translations for a specific language
export function getTranslations(lang = 'en') {
    return translations[lang] || translations.en;
}

// Translation helper function
export function t(key, lang = 'en') {
    const keys = key.split('.');
    let result = translations[lang] || translations.en;

    for (const k of keys) {
        result = result?.[k];
    }

    return result || key;
}

export default translations;
