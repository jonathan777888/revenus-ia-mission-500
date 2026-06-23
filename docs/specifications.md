# Spécifications — Revenus IA Mission 500 $

## 1. Objectif du système

Créer une application qui aide à rechercher, comparer, filtrer et suivre des opportunités légales de revenus en ligne.

L'application doit aider à atteindre un objectif de 500 $ ou plus en gains confirmés, sans promettre de revenus automatiques.

## 2. Problème à résoudre

Il existe beaucoup d'opportunités en ligne, mais elles ne sont pas toutes fiables.

Le système doit aider à :

- éviter les arnaques
- comparer les plateformes
- calculer la rentabilité réelle
- suivre les gains
- vérifier les retraits possibles
- garder une trace claire des décisions

## 3. Utilisateur cible

L'utilisateur principal est une personne qui veut gagner de l'argent légalement en ligne, mais qui veut éviter :

- les fausses plateformes
- les missions qui demandent un dépôt
- les retraits bloqués
- les promesses irréalistes
- les pertes de temps
- les risques de sécurité

## 4. Modules principaux

### 4.1 Plateformes

Le système doit permettre d'ajouter et d'analyser des plateformes.

Exemples de champs :

- nom
- site officiel
- catégorie
- pays acceptés
- méthodes de paiement
- seuil minimum de retrait
- frais connus
- statut de fiabilité
- notes

### 4.2 Opportunités

Le système doit permettre d'ajouter des missions ou opportunités.

Exemples de champs :

- titre
- plateforme associée
- description
- gain estimé
- temps estimé
- devise
- lien source
- score de risque
- score de rentabilité
- décision finale

### 4.3 Anti-arnaque

Le système doit détecter les signaux dangereux.

Signaux de rejet automatique :

- dépôt obligatoire
- paiement demandé pour débloquer un retrait
- crypto obligatoire
- transfert d'argent pour une autre personne
- promesse de gain trop élevée
- recrutement obligatoire
- installation d'un logiciel inconnu
- absence de site officiel vérifiable

### 4.4 Rentabilité

Le système doit calculer une estimation simple.

Formule :

```text
gain net = gain brut - frais
gain horaire = gain net / temps estimé
