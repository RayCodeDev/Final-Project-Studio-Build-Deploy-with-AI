# 🎵 Music App - Specifications

## 1. Description
Une application web simple permettant de rechercher de la musique via l’API publique **Deezer**, d’afficher les résultats avec titre, artiste, pochette, et un extrait audio de 30 secondes.

---

## 2. Fonctionnalités
- **Recherche** : L’utilisateur entre un mot-clé (ex. "lofi") et l’application récupère les morceaux correspondants.
- **Affichage dynamique** :
  - Pochette de l’album
  - Nom du morceau
  - Nom de l’artiste
  - Bouton pour écouter un extrait audio
- **Lecture audio** : L’utilisateur peut écouter un extrait de 30s directement depuis l’interface.

---

## 3. Technologies utilisées
- **HTML5** : Structure de la page
- **CSS3** : Mise en page et style
- **JavaScript** : Logique et interactions
- **Deezer API** : Fournisseur de données musicales

---

## 4. API utilisée
**Endpoint** :  
https://api.deezer.com/search?q={mot-clé}

pgsql
Copier
Modifier
**Réponse JSON** :  
```json
{
  "data": [
    {
      "title": "Nom du morceau",
      "artist": { "name": "Nom de l'artiste" },
      "album": { "cover": "URL pochette" },
      "preview": "URL extrait audio"
    }
  ]
}
5. Exemple d’exécution
Entrée : "lofi"
Output (affichage dans l’app) :

Pochette :

Titre : Lofi Study
Artiste : LoFi Beats
[▶ Écouter l’extrait]

Pochette :

Titre : Chill Vibes
Artiste : Chillhop
[▶ Écouter l’extrait]

6. Instructions d’installation
Cloner le repo :

bash
Copier
Modifier
git clone https://github.com/RayCodeDev/-Final-Project-Studio-Build-Deploy-with-AI
Ouvrir index.html dans un navigateur.

Entrer un mot-clé dans le champ de recherche et valider.

7. Limitations
L’API Deezer impose un extrait de 30 secondes maximum.

Les résultats dépendent de la disponibilité dans la base Deezer.

8. Améliorations possibles
Ajouter la pagination des résultats.

Permettre de créer des playlists locales.

Système de favoris stocké en localStorage.