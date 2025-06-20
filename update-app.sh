#!/bin/bash

echo "🚀 Script de mise à jour At-Taqwa App"
echo "======================================"
echo ""

# Vérifier si EAS CLI est installé
if ! command -v eas &> /dev/null; then
    echo "❌ EAS CLI n'est pas installé. Installation..."
    npm install -g @expo/eas-cli
fi

echo "📱 Choisissez une option :"
echo "1) Mise à jour OTA (modifications de code uniquement)"
echo "2) Build complet Android (nouvelles dépendances)"
echo "3) Build complet iOS (nouvelles dépendances)"
echo "4) Build de développement Android"
echo "5) Build de développement iOS"
echo "6) Build complet Android + iOS"
echo "7) Voir les builds récents"
echo "8) Annuler un build en cours"
echo ""

read -p "Entrez votre choix (1-8) : " choice

case $choice in
    1)
        echo "🔄 Mise à jour OTA en cours..."
        read -p "Message de mise à jour : " message
        eas update --branch preview --message "$message"
        echo "✅ Mise à jour OTA terminée !"
        ;;
    2)
        echo "🔨 Build Android en cours..."
        eas build --platform android --profile preview
        echo "✅ Build Android terminé !"
        ;;
    3)
        echo "🍎 Build iOS en cours..."
        eas build --platform ios --profile preview
        echo "✅ Build iOS terminé !"
        ;;
    4)
        echo "🔨 Build de développement Android en cours..."
        eas build --platform android --profile development
        echo "✅ Build de développement Android terminé !"
        ;;
    5)
        echo "🍎 Build de développement iOS en cours..."
        eas build --platform ios --profile development
        echo "✅ Build de développement iOS terminé !"
        ;;
    6)
        echo "🔨🍎 Build complet Android + iOS en cours..."
        echo "Build Android..."
        eas build --platform android --profile preview &
        echo "Build iOS..."
        eas build --platform ios --profile preview &
        wait
        echo "✅ Builds Android + iOS terminés !"
        ;;
    7)
        echo "📋 Builds récents :"
        eas build:list --limit 10
        ;;
    8)
        echo "📋 Builds en cours :"
        eas build:list --status in-progress
        read -p "Entrez l'ID du build à annuler : " build_id
        eas build:cancel $build_id
        echo "✅ Build annulé !"
        ;;
    *)
        echo "❌ Choix invalide"
        exit 1
        ;;
esac

echo ""
echo "🎉 Opération terminée !"
echo "📱 Vérifiez votre téléphone pour les mises à jour OTA"
echo "📥 Ou téléchargez l'APK/IPA depuis EAS Dashboard" 