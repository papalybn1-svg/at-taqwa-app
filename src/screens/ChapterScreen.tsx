import { MaterialCommunityIcons } from '@expo/vector-icons';
// Stockage local scoping par utilisateur
import React, { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Animated, BackHandler, Dimensions, Image, Modal, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { GestureHandlerRootView, PanGestureHandler, State } from 'react-native-gesture-handler';
import chaptersDataRaw from '../../data/chapitres.json';
import { useAuth } from '../hooks/useAuth';
import { ChaptersData } from '../types/chapters';
import { isQuizUnlocked } from '../utils/quizUnlock';
import { ChapterState, read as readUserStorage, write as writeUserStorage } from '../utils/userStorage';

const chaptersData = chaptersDataRaw as ChaptersData;

const chapterFiles: { [key: string]: any } = {
  "1": require('../../data/chapitres/chapitre_01.json'),
  "2": require('../../data/chapitres/chapitre_02.json'),
  "3": require('../../data/chapitres/chapitre_03.json'),
  "4": require('../../data/chapitres/chapitre_04.json'),
  "5": require('../../data/chapitres/chapitre_05.json'),
  "6": require('../../data/chapitres/chapitre_06.json'),
  "7": require('../../data/chapitres/chapitre_07.json'),
  "8": require('../../data/chapitres/chapitre_08.json'),
  "9": require('../../data/chapitres/chapitre_09.json'),
  "10": require('../../data/chapitres/chapitre_10.json'),
  "11": require('../../data/chapitres/chapitre_11.json'),
  "12": require('../../data/chapitres/chapitre_12.json'),
};

// Fonction utilitaire pour découper l'intro et les sections
function splitIntroAndSections(contenu: any[]) {
  const sections: { title: string, items: any[] }[] = [];
  let currentSection: { title: string, items: any[] } | null = null;
  let introItems: any[] = [];

  contenu.forEach((item) => {
    // Si c'est un titre de section (I., II., III., etc.)
    if (item.contenu && typeof item.contenu === 'string' && item.contenu.match(/^\s*[IVXLCDM]+[\.-]/)) {
      // Si on a des éléments d'intro et qu'on n'a pas encore de section, créer la première section avec l'intro
      if (introItems.length > 0 && !currentSection) {
        currentSection = { title: item.contenu, items: [...introItems, item] };
        introItems = [];
      } else {
        // Sauvegarder la section précédente si elle existe
        if (currentSection) {
          sections.push(currentSection);
        }
        // Créer une nouvelle section avec ce titre
        currentSection = { title: item.contenu, items: [item] };
      }
    } else {
      // Si on a une section en cours, ajouter l'item à cette section
      if (currentSection) {
        currentSection.items.push(item);
      } else {
        // Si on n'a pas encore de section, accumuler les éléments d'intro
        introItems.push(item);
      }
    }
  });
  
  // Ajouter la dernière section si elle existe
  if (currentSection) {
    sections.push(currentSection);
  }
  
  // Si on a des éléments d'intro sans section, créer une section d'introduction
  if (introItems.length > 0) {
    sections.unshift({ title: "", items: introItems });
  }
  
  // Garder toutes les sections non vides
  const filteredSections = sections.filter(section => {
    return section.items && section.items.length > 0;
  });
  
  return { sections: filteredSections };
}

function getAllChapters() {
  // Retourne un tableau à plat de tous les chapitres avec leur partie et leur index
  const result: any[] = [];
  (Object.keys(chaptersData) as (keyof ChaptersData)[]).forEach((partieKey) => {
    const partie = chaptersData[partieKey];
    partie.chapitres.forEach((ch: any, idx: number) => {
      result.push({ ...ch, partieKey, partieTitre: partie.titre, chapitreIndex: idx });
    });
  });
  return result;
}

function getChaptersInPartie(partieKey: string) {
  // Retourne seulement les chapitres de la partie spécifiée
  const partie = chaptersData[partieKey as keyof ChaptersData];
  if (!partie) return [];
  
  return partie.chapitres.map((ch: any, idx: number) => ({
    ...ch, 
    partieKey, 
    partieTitre: partie.titre, 
    chapitreIndex: idx 
  }));
}

const ChapterScreen = ({ route, navigation }: { route: any, navigation: any }) => {
  // TOUS LES HOOKS EN PREMIER
  const { user } = useAuth();
  const [textSize, setTextSize] = useState(16);
  const screenWidth = Dimensions.get('window').width;
  const scrollViewRef = useRef<ScrollView>(null);
  const { chapter } = route.params;
  const [chapterContent, setChapterContent] = useState<any>(null);
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0); // 0 = première section
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const [isFavorite, setIsFavorite] = useState(false);
  const [favorites, setFavorites] = useState<any[]>([]);
  const [scrollProgress, setScrollProgress] = useState(0); // Ajout pour la progression verticale
  const [isScrollable, setIsScrollable] = useState(false); // Pour savoir si la page est scrollable
  
  // États pour la gestion des quiz
  const [quizScores, setQuizScores] = useState<Record<string, number>>({});
  const [showLockModal, setShowLockModal] = useState(false);
  const [lockedChapter, setLockedChapter] = useState<any>(null);
  const [previousScore, setPreviousScore] = useState<number | undefined>(undefined);

  // useEffect pour charger le contenu du chapitre
  useEffect(() => {
    if (chapter && chapter.image && chapterFiles[chapter.image]) {
      const content = chapterFiles[chapter.image];
      setChapterContent(content);
      
      // Récupérer le titre principal du chapitre depuis le contenu JSON
      const mainTitle = content.contenu?.find((item: any) => item.type === "titre")?.contenu || chapter.desc;
      
      // Migration désactivée pour éviter de copier les anciennes données globales d'un autre compte

      // Démarrer à la section spécifiée si on vient des favoris, sinon toujours commencer par la page 1
      const loadInitialSection = async () => {
        const initialFromParams = route.params.initialSection;
        if (typeof initialFromParams === 'number') {
          // Si on vient des favoris avec une section spécifique, utiliser cette section
          setCurrentSectionIndex(initialFromParams);
        } else {
          // Sinon, toujours commencer par la page 1
              setCurrentSectionIndex(0);
        }
        // Initialiser la progression si c'est la première fois qu'on lit ce chapitre
        initializeChapterProgress();
      };
      loadInitialSection();
    }
  }, [chapter, route.params.initialSection, user?.uid]);

  // useEffect pour charger les favoris
  useEffect(() => {
    loadFavorites();
  }, []);

  // useEffect pour vérifier si cette page/section est en favoris
  useEffect(() => {
    if (chapter && favorites.length >= 0) {
      const pageId = `${chapter.image}_${chapter.title}_section_${currentSectionIndex}`;
      setIsFavorite(favorites.some(fav => fav.id === pageId));
    }
  }, [chapter, favorites, currentSectionIndex]);

  // useEffect pour l'animation de fondu
  useEffect(() => {
    fadeAnim.setValue(0);
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 350,
      useNativeDriver: true,
    }).start();
    scrollViewRef.current?.scrollTo({ y: 0, animated: false });
  }, [currentSectionIndex]);

  // useEffect pour mettre à jour la progression
  useEffect(() => {
    if (chapter && chapterContent) {
      updateChapterProgress();
      
      // Marquer comme complètement lu si on est à la dernière section
      const { sections } = splitIntroAndSections(chapterContent.contenu as any[]);
      const totalSections = sections.length;
      if (currentSectionIndex === totalSections - 1) {
        markChapterAsComplete();
      }
    }
  }, [currentSectionIndex, chapter, chapterContent]);

  // Tailles de texte disponibles
  const textSizes = [16, 19, 22];
  const nextTextSize = () => {
    setTextSize(s => textSizes[(textSizes.indexOf(s) + 1) % textSizes.length]);
  };

  // Fonctions de gestion des favoris
  const loadFavorites = async () => {
    try {
      const storedFavorites = await readUserStorage<any[]>(user?.uid, 'favorites');
      if (storedFavorites) setFavorites(storedFavorites);
    } catch (error) {
      console.error('Erreur lors du chargement des favoris:', error);
    }
  };

  const saveFavorites = async (newFavorites: any[]) => {
    try {
      console.log('Sauvegarde des favoris:', newFavorites);
      await writeUserStorage(user?.uid, 'favorites', newFavorites);
      setFavorites(newFavorites);
      console.log('Favoris sauvegardés avec succès');
    } catch (error) {
      console.error('Erreur lors de la sauvegarde des favoris:', error);
    }
  };

  const toggleFavorite = async () => {
    if (!chapter) return;
    
    // Créer un ID unique pour cette page/section spécifique
    const pageId = `${chapter.image}_${chapter.title}_section_${currentSectionIndex}`;
    console.log('Toggle favori pour la page:', pageId);
    
    const allChapters = getAllChapters();
    const currentChapterData = allChapters.find(ch => ch.image === chapter.image && ch.title === chapter.title);
    
    // Récupérer le titre de la section actuelle
          const { sections } = splitIntroAndSections(chapterContent.contenu as any[]);
      let sectionTitle = sections[currentSectionIndex]?.title || "";
    if (currentSectionIndex > 0) {
      sectionTitle = sections[currentSectionIndex - 1]?.title || `Section ${currentSectionIndex}`;
    }
    
    const favoriteItem = {
      id: pageId,
      title: `${chapter.title} - ${sectionTitle}`,
      desc: `Page ${currentSectionIndex + 1} du chapitre`,
      author: 'At-Taqwa',
      image: chapter.image,
      partie: currentChapterData?.partieTitre || '',
      chapterData: {
        ...chapter,
        startSection: currentSectionIndex // Sauvegarder la section pour y revenir
      }
    };

    let newFavorites;
    if (isFavorite) {
      // Retirer des favoris
      console.log('Retirer la page des favoris');
      newFavorites = favorites.filter(fav => fav.id !== pageId);
    } else {
      // Ajouter aux favoris
      console.log('Ajouter la page aux favoris:', favoriteItem);
      newFavorites = [...favorites, favoriteItem];
    }
    
    await saveFavorites(newFavorites);
    setIsFavorite(!isFavorite);
  };

  // Fonction pour mettre à jour la progression du chapitre
  const updateChapterProgress = async () => {
    if (!chapter || !chapterContent) return;
    
    try {
      // Charger la progression existante (scopée utilisateur)
      const saved = (await readUserStorage<ChapterState>(user?.uid, 'chapterProgress')) || {};
      
      // Trouver l'index du chapitre dans sa partie
      const allChapters = getAllChapters();
      const currentChapterData = allChapters.find(ch => ch.image === chapter.image && ch.title === chapter.title);
      
      if (!currentChapterData) return;
      
      // Calculer la progression basée sur la section actuelle
      const { sections } = splitIntroAndSections(chapterContent.contenu as any[]);
      const totalSections = sections.length;
      const currentProgress = Math.round(((currentSectionIndex + 1) / totalSections) * 100);
      
      // Créer la clé de progression
      const progressKey = `chapter${currentChapterData.partieKey}_${currentChapterData.chapitreIndex + 1}`;
      
      const previous = saved[progressKey]?.percent ?? 0;
      const updated: ChapterState = {
        ...saved,
        [progressKey]: {
          percent: currentProgress > previous ? currentProgress : previous,
          lastSection: currentSectionIndex,
          updatedAt: Date.now(),
        },
      };
      await writeUserStorage(user?.uid, 'chapterProgress', updated);
      console.log(`Progression mise à jour: ${progressKey} = ${updated[progressKey].percent}% (section ${currentSectionIndex})`);
    } catch (error) {
      console.error('Erreur lors de la mise à jour de la progression:', error);
    }
  };

  // Fonction pour marquer un chapitre comme complètement lu
  const markChapterAsComplete = async () => {
    if (!chapter) return;
    
    try {
      // Charger la progression existante
      const saved = (await readUserStorage<ChapterState>(user?.uid, 'chapterProgress')) || {};
      
      // Trouver l'index du chapitre dans sa partie
      const allChapters = getAllChapters();
      const currentChapterData = allChapters.find(ch => ch.image === chapter.image && ch.title === chapter.title);
      
      if (!currentChapterData) return;
      
      // Créer la clé de progression
      const progressKey = `chapter${currentChapterData.partieKey}_${currentChapterData.chapitreIndex + 1}`;
      
      // Marquer comme 100% lu et dernière section
      const { sections } = splitIntroAndSections(chapterContent.contenu as any[]);
      const updated: ChapterState = {
        ...saved,
        [progressKey]: {
          percent: 100,
          lastSection: Math.max(0, sections.length - 1),
          updatedAt: Date.now(),
        },
      };
      await writeUserStorage(user?.uid, 'chapterProgress', updated);
      console.log(`Chapitre marqué comme complètement lu: ${progressKey}`);
    } catch (error) {
      console.error('Erreur lors du marquage du chapitre comme lu:', error);
    }
  };

  // Fonction pour gérer le retour vers la page des chapitres de cette partie
  const handleBackPress = () => {
    // Toujours retourner vers la page des chapitres de cette partie
    const allChapters = getAllChapters();
    const currentChapterData = allChapters.find(ch => ch.image === chapter.image && ch.title === chapter.title);
    if (currentChapterData) {
      navigation.navigate('Books', { selectedPart: currentChapterData.partieKey });
    } else {
      // Fallback si on ne trouve pas la partie
      navigation.goBack();
    }
  };

  // Gestionnaire de geste de swipe
  const onGestureEvent = (event: any) => {
    if (event.nativeEvent.state === State.END) {
      const { translationX, velocityX } = event.nativeEvent;
      if ((translationX > 50 && velocityX > 500) || translationX > 150) {
        handleBackPress();
      }
    }
  };

  const initializeChapterProgress = async () => {
    if (!chapter) return;
    
    try {
      // Charger la progression existante
      const saved = (await readUserStorage<ChapterState>(user?.uid, 'chapterProgress')) || {};
      
      // Trouver l'index du chapitre dans sa partie
      const allChapters = getAllChapters();
      const currentChapterData = allChapters.find(ch => ch.image === chapter.image && ch.title === chapter.title);
      
      if (!currentChapterData) return;
      
      // Créer la clé de progression
      const progressKey = `chapter${currentChapterData.partieKey}_${currentChapterData.chapitreIndex + 1}`;
      
      // Initialiser si pas encore de progression
      if (!saved[progressKey]) {
        const updated: ChapterState = {
          ...saved,
          [progressKey]: { percent: 0, lastSection: 0, updatedAt: Date.now() },
        };
        await writeUserStorage(user?.uid, 'chapterProgress', updated);
        console.log(`Progression initialisée: ${progressKey} = 0%`);
      }
    } catch (error) {
      console.error('Erreur lors de l\'initialisation de la progression:', error);
    }
  };

  // Fonction pour charger les scores des quiz
  const loadQuizScores = async () => {
    try {
      const scores = await readUserStorage<Record<string, number>>(user?.uid, 'quizScores');
      if (scores) {
        setQuizScores(scores);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des scores de quiz:', error);
    }
  };

  // Fonction pour obtenir la clé du quiz du chapitre actuel
  const getCurrentChapterQuizKey = () => {
    if (!chapter) return null;
    const allChapters = getAllChapters();
    
    // Chercher par image d'abord (plus fiable)
    let currentChapterData = allChapters.find(ch => ch.image === chapter.image);
    
    // Si pas trouvé par image, essayer par titre
    if (!currentChapterData) {
      currentChapterData = allChapters.find(ch => ch.title === chapter.title);
    }
    
    // Si toujours pas trouvé, essayer par titre modifié (cas HomeScreen)
    if (!currentChapterData) {
      // Extraire le numéro du titre modifié "Chapitre X."
      const titleMatch = chapter.title?.match(/Chapitre (\d+)\./);
      if (titleMatch) {
        const chapterNumber = parseInt(titleMatch[1], 10);
        currentChapterData = allChapters.find(ch => {
          // Chercher par position dans la liste globale
          const globalIndex = allChapters.indexOf(ch) + 1;
          return globalIndex === chapterNumber;
        });
      }
    }
    
    if (!currentChapterData) {
      console.log('❌ Chapitre non trouvé pour le quiz:', { 
        image: chapter.image, 
        title: chapter.title,
        availableChapters: allChapters.map(ch => ({ image: ch.image, title: ch.title }))
      });
      return null;
    }
    
    // Utiliser le numéro du chapitre comme clé de quiz
    return currentChapterData.chapitreIndex + 1;
  };

  // Fonction pour gérer le clic sur "Faire le quiz"
  const handleQuizPress = () => {
    const quizKey = getCurrentChapterQuizKey();
    if (!quizKey) {
      console.log('❌ Impossible de déterminer la clé du quiz pour ce chapitre');
      return;
    }

    console.log('🔍 Quiz key trouvée:', quizKey, 'pour le chapitre:', chapter.title);

    // Vérifier si le quiz est débloqué
    if (!isQuizUnlocked(quizKey.toString(), quizScores)) {
      // Trouver le quiz précédent pour afficher son score actuel
      const allChapters = getAllChapters();
      
      // Utiliser la même logique de recherche que getCurrentChapterQuizKey
      let currentChapterData = allChapters.find(ch => ch.image === chapter.image);
      if (!currentChapterData) {
        currentChapterData = allChapters.find(ch => ch.title === chapter.title);
      }
      if (!currentChapterData) {
        const titleMatch = chapter.title?.match(/Chapitre (\d+)\./);
        if (titleMatch) {
          const chapterNumber = parseInt(titleMatch[1], 10);
          currentChapterData = allChapters.find(ch => {
            const globalIndex = allChapters.indexOf(ch) + 1;
            return globalIndex === chapterNumber;
          });
        }
      }
      
      if (!currentChapterData) {
        console.log('❌ Chapitre non trouvé pour le déverrouillage');
        return;
      }

      const previousQuizKey = currentChapterData.chapitreIndex; // Quiz précédent
      const score = quizScores[previousQuizKey.toString()];
      
      setLockedChapter(chapter);
      setPreviousScore(score);
      setShowLockModal(true);
      return;
    }
    
    console.log('✅ Quiz débloqué, navigation vers OriginalQuiz');
    
    // Quiz débloqué, naviguer vers le quiz avec la section actuelle pour le retour
    navigation.navigate('OriginalQuiz', { 
      exercicesKey: quizKey.toString(), 
      chapterTitle: chapter.title, 
      chapterPart: chapter.partie,
      returnToChapter: {
        image: chapter.image,
        title: chapter.title,
        section: currentSectionIndex
      }
    });
  };

  // useEffect pour charger les scores des quiz
  useEffect(() => {
    loadQuizScores();
  }, [user?.uid]);

  // Gestionnaire pour le bouton retour Android
  useEffect(() => {
    const onBackPress = () => {
      handleBackPress();
      return true; // Empêcher le comportement par défaut
    };

    const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);

    return () => subscription.remove();
  }, []);

  // On ne retourne rien avant d'avoir appelé tous les hooks !
  if (!chapterContent) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#174C3C" />
        <Text style={{ marginTop: 16 }}>Chargement du chapitre...</Text>
      </View>
    );
  }

      // Découpage sections
    const { sections } = splitIntroAndSections(chapterContent.contenu as any[]);
    const totalSections = sections.length;
    
    // Vérifier si la section actuelle est vide et passer à la suivante si nécessaire
    const currentSection = sections[currentSectionIndex];
    const hasVisibleContent = currentSection && currentSection.items && 
      currentSection.items.some(item => {
        // Ignorer les items qui ne sont pas affichés
        if (item.type === "titre" || 
            (item.contenu && typeof item.contenu === 'string' && item.contenu.match(/^[IVXLCDM]+\./))) {
          return false;
        }
        // Vérifier si l'item a du contenu visible
        return item.contenu && 
               typeof item.contenu === 'string' && 
               item.contenu.trim() !== '';
      });
    
    // Si la section actuelle est vide et qu'il y a une section suivante, passer à la suivante
    if (!hasVisibleContent && currentSectionIndex < totalSections - 1) {
      setCurrentSectionIndex(currentSectionIndex + 1);
    }

  // Trouver la partie actuelle du chapitre
  const allChapters = getAllChapters();
  const currentChapter = allChapters.find(
    (ch) => ch.image === chapter.image && ch.title === chapter.title
  );
  
  // Obtenir seulement les chapitres de la partie actuelle
  const partieChapters = currentChapter ? getChaptersInPartie(currentChapter.partieKey) : [];
  
  // Trouver l'index du chapitre courant dans sa partie
  const currentChapterIndex = partieChapters.findIndex(
    (ch) => ch.image === chapter.image && ch.title === chapter.title
  );
  
  // Le chapitre suivant sera dans la même partie
  const nextChapter = partieChapters[currentChapterIndex + 1];
  // Le chapitre précédent sera dans la même partie
  const previousChapter = partieChapters[currentChapterIndex - 1];

  // Rendu du contenu d'une section
  const renderContent = (items: any[]) => (
    items.map((item, idx) => {
      // 1. Gestion des tableaux
      if (item.type === "tableau" && Array.isArray(item.contenu)) {
        return (
          <View key={idx} style={{ marginVertical: 18, borderWidth: 1, borderColor: '#174C3C', borderRadius: 8, overflow: 'hidden' }}>
            {item.contenu.map((row: string[], rIdx: number) => (
              <View key={rIdx} style={{ 
                flexDirection: 'row', 
                backgroundColor: rIdx === 0 ? '#E8F5E8' : '#fff',
                borderBottomWidth: rIdx < item.contenu.length - 1 ? 1 : 0,
                borderBottomColor: '#174C3C'
              }}>
                {row.map((cell, cIdx) => (
                  <Text
                    key={cIdx}
                    style={{
                      flex: 1,
                      padding: 8,
                      borderRightWidth: cIdx < row.length - 1 ? 1 : 0,
                      borderRightColor: '#174C3C',
                      fontWeight: rIdx === 0 ? 'bold' : 'normal',
                      color: '#174C3C',
                      fontSize: textSize - 1,
                      textAlign: 'center'
                    }}
                  >
                    {(() => {
                      const parts = cell.split(/(\bAllah\b|\bProphète\b)/gi);
                      return parts.map((part: string, index: number) => {
                        if (part.toLowerCase() === 'allah' || part.toLowerCase() === 'prophète') {
                          return (
                            <Text key={index} style={{ color: '#19514A', fontWeight: 'bold' }}>
                              {part}
                            </Text>
                          );
                        }
                        return part;
                      });
                    })()}
                  </Text>
                ))}
              </View>
            ))}
          </View>
        );
      }

      // 2. Gestion des titres principaux (I., II., etc.) - On les ignore complètement
      if (item.contenu && typeof item.contenu === 'string' && item.contenu.match(/^\s*[IVXLCDM]+[\.-]/)) {
        return null; // On ignore complètement les titres de section
      }

      // 3. Gestion des titres (type "titre") - On ne les affiche pas dans le contenu
      if (item.type === "titre") {
        return null; // On ignore les titres principaux dans le contenu
      }

      // 4. Gestion des textes arabes (JAUNE)
      if (item.type === "arabe") {
        return (
          <View key={idx} style={styles.arabicContainer}>
            <Text style={[styles.arabicText, { fontSize: textSize + 4 }]}> 
              {(() => {
                const parts = item.contenu.split(/(\bAllah\b|\bProphète\b)/gi);
                return parts.map((part: string, index: number) => {
                  if (part.toLowerCase() === 'allah' || part.toLowerCase() === 'prophète') {
                    return (
                      <Text key={index} style={{ color: '#19514A', fontWeight: 'bold' }}>
                        {part}
                      </Text>
                    );
                  }
                  return part;
                });
              })()}
            </Text>
          </View>
        );
      }

      // 5. Gestion des explications (type "explication") - VERT
      if (item.type === "explication") {
        return (
          <View key={idx} style={styles.explanationContainer}>
            <Text style={[styles.explanationText, { fontSize: textSize }]}> 
              {(() => {
                const parts = item.contenu.split(/(\bAllah\b|\bProphète\b)/gi);
                return parts.map((part: string, index: number) => {
                  if (part.toLowerCase() === 'allah' || part.toLowerCase() === 'prophète') {
                    return (
                      <Text key={index} style={{ color: '#19514A', fontWeight: 'bold' }}>
                        {part}
                      </Text>
                    );
                  }
                  return part;
                });
              })()}
            </Text>
          </View>
        );
      }

      // 6. Tout le reste (NOIR)
      // Vérifier si le contenu commence par "." ou par un numéro suivi d'un point
      const content = item.contenu;
      const startsWithDot = content && typeof content === 'string' && content.trim().startsWith('.');
      const startsWithNumber = content && typeof content === 'string' && content.trim().match(/^\d+\./);
      const startsWithBullet = content && typeof content === 'string' && content.trim().startsWith('•');
      
      // Vérifier si c'est un exercice ou un corrigé
      const isExercise = content && typeof content === 'string' && (
        content.toLowerCase().includes('exercice') || 
        content.toLowerCase().includes('révision') ||
        content.toLowerCase().includes('comment réparer')
      );
      
      // Détecter les corrigés par leur structure : numéro + réponse
      const isCorrection = content && typeof content === 'string' && (
        content.toLowerCase().includes('corrigé des exercices') ||
        (content.match(/^\d+\)/) && (
          content.toLowerCase().includes('sujûd avant') ||
          content.toLowerCase().includes('sujûd après') ||
          content.toLowerCase().includes('sujûd ba') ||
          content.toLowerCase().includes('ba\'da salam') ||
          content.toLowerCase().includes('habla salam') ||
          content.toLowerCase().includes('hâbla salam')
        ))
      );
      
      return (
        <Text 
          key={idx} 
          style={[
            styles.paragraph, 
            { 
              fontSize: textSize,
              lineHeight: textSize * 1.6,
              marginBottom: 16,
              fontWeight: (startsWithDot || startsWithNumber) ? 'bold' : 'normal',
              color: isExercise ? '#174C3C' : isCorrection ? '#2E7D32' : '#333',
              backgroundColor: isExercise ? '#E8F5E8' : isCorrection ? '#F1F8E9' : 'transparent',
              padding: (isExercise || isCorrection) ? 12 : 0,
              borderRadius: (isExercise || isCorrection) ? 8 : 0,
              borderLeftWidth: isExercise ? 4 : isCorrection ? 4 : 0,
              borderLeftColor: isExercise ? '#174C3C' : isCorrection ? '#2E7D32' : 'transparent',
              marginLeft: startsWithBullet ? 20 : 0,
              paddingLeft: startsWithBullet ? 10 : 0
            }
          ]}
        >
          {(() => {
            const text = startsWithDot ? content.trim().substring(1) : content;
            const parts = text.split(/(\bAllah\b|\bProphète\b)/gi);
            return parts.map((part: string, index: number) => {
              if (part.toLowerCase() === 'allah' || part.toLowerCase() === 'prophète') {
                return (
                  <Text key={index} style={{ color: '#19514A', fontWeight: 'bold' }}>
                    {part}
                  </Text>
                );
              }
              return part;
            });
          })()}
        </Text>
      );
    })
  );

  // Indicateur de section
  let sectionIndicator = "";
  if (currentSectionIndex === 0) {
    // Si la première section a un titre (comme "I. La Qibla"), l'afficher directement
    if (sections[0]?.title && sections[0].title.trim() !== "") {
      sectionIndicator = sections[0].title.trim();
    } else {
      // Vérifier s'il y a du contenu dans la première section (introduction)
      const hasIntroContent = sections[0]?.items && sections[0].items.some(item => 
        item.type !== "titre" && 
        item.contenu && 
        typeof item.contenu === 'string' && 
        item.contenu.trim() !== ''
      );
      sectionIndicator = hasIntroContent ? "Introduction" : sections[0]?.title?.trim() || "";
    }
  } else {
    sectionIndicator = sections[currentSectionIndex]?.title?.trim() || "";
  }

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: '#F4F7F6' }}>
      <PanGestureHandler enabled={Platform.OS === 'ios'} onHandlerStateChange={onGestureEvent}>
        <View style={{ flex: 1, backgroundColor: '#F4F7F6' }}>
      {/* Header simplifié sans image */}
      <View style={{ 
        backgroundColor: '#174C3C', 
        paddingTop: Platform.OS === 'ios' ? 50 : 30,
        paddingBottom: 20,
        paddingHorizontal: 20
      }}>
        {/* Numéro du chapitre */}
        <Text style={{ 
          fontSize: 18, 
          fontWeight: 'bold', 
          color: '#D4AF37', 
          textAlign: 'center', 
          letterSpacing: 0.5, 
          marginBottom: 4 
        }}>
          {chapter.title.replace(/\.\s*$/, ':')}
        </Text>
        {/* Nom du chapitre */}
        <Text style={{ 
          fontSize: 18, 
          fontWeight: 'bold', 
          color: '#FFFFFF', 
          textAlign: 'center', 
          lineHeight: 24,
          marginBottom: 8
        }}>
          {chapterContent?.contenu?.find((item: any) => item.type === "titre")?.contenu || chapter.desc}
        </Text>
        {/* Affichage de la partie */}
        <Text style={{ 
          fontSize: 14, 
          fontWeight: '500', 
          color: '#B8D4B8', 
          textAlign: 'center', 
          letterSpacing: 0.3 
        }}>
          {(() => {
            const allChapters = getAllChapters();
            const currentChapterIndex = allChapters.findIndex(ch => ch.image === chapter?.image && ch.title === chapter?.title);
            return allChapters[currentChapterIndex]?.partieTitre || '';
          })()}
        </Text>
      </View>
      
      {/* Boutons en premier plan */}
      {/* Bouton retour */}
      <TouchableOpacity 
        onPress={handleBackPress}
        style={{
          position: 'absolute',
          top: 45,
          left: 16,
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          borderRadius: 22,
          padding: 10,
          elevation: 10,
          shadowColor: '#000',
          shadowOpacity: 0.25,
          shadowRadius: 6,
          shadowOffset: { width: 0, height: 3 },
          zIndex: 1000,
        }}
      >
        <MaterialCommunityIcons name="arrow-left" size={24} color="#174C3C" />
      </TouchableOpacity>
      {/* Bouton zoom */}
      <TouchableOpacity 
        onPress={nextTextSize}
        style={{
          position: 'absolute',
          top: 45,
          right: 16,
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          borderRadius: 22,
          padding: 10,
          elevation: 10,
          shadowColor: '#000',
          shadowOpacity: 0.25,
          shadowRadius: 6,
          shadowOffset: { width: 0, height: 3 },
          zIndex: 1000,
        }}
      >
        <MaterialCommunityIcons name="magnify-plus" size={24} color="#174C3C" />
      </TouchableOpacity>

      {/* Indicateur de section - seulement si il y a un titre */}
      {sectionIndicator && (
        <View style={{ alignItems: 'center', paddingHorizontal: 24, marginTop: 60, marginBottom: (sectionIndicator === "Introduction" || sectionIndicator.match(/^[IVXLCDM]+\./)) ? 0 : 16 }}>
          <View style={{
            backgroundColor: '#E8F5E8',
            paddingHorizontal: 16,
            paddingVertical: 8,
            borderRadius: 16,
            borderWidth: 1,
            borderColor: '#174C3C20'
          }}>
            <Text style={{ color: '#174C3C', fontWeight: 'bold', fontSize: 16, textAlign: 'center' }}>{sectionIndicator}</Text>
          </View>
        </View>
      )}

      {/* Contenu animé */}
      <View style={{ flex: 1 }}>
      <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
        <ScrollView
          ref={scrollViewRef}
          style={{ flex: 1, width: '100%' }}
          contentContainerStyle={{ 
            paddingHorizontal: 16, 
            paddingTop: currentSectionIndex === 0 ? 20 : 16, 
            paddingBottom: 120, 
            maxWidth: 420, 
            alignSelf: 'center',
            flexGrow: 1,
          }}
          showsVerticalScrollIndicator={false}
          nestedScrollEnabled
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
            onScroll={e => {
              const { contentOffset, contentSize, layoutMeasurement } = e.nativeEvent;
              const totalScrollable = contentSize.height - layoutMeasurement.height;
              if (totalScrollable > 0) {
                setIsScrollable(true);
                setScrollProgress(Math.min(1, Math.max(0, contentOffset.y / totalScrollable)));
              } else {
                setIsScrollable(false);
                setScrollProgress(0);
              }
            }}
            scrollEventThrottle={16}
        >
          {renderContent(sections[currentSectionIndex]?.items || [])}
    </ScrollView>
          {/* Barre de progression verticale */}
          {isScrollable && (
            <View style={{ position: 'absolute', right: 6, top: 0, bottom: 0, width: 8, justifyContent: 'center', alignItems: 'center', pointerEvents: 'none' }}>
              <View style={{ width: 4, height: '80%', backgroundColor: '#E8F5E8', borderRadius: 2, overflow: 'hidden', justifyContent: 'flex-start' }}>
                <Animated.View style={{
                  width: 4,
                  backgroundColor: '#174C3C',
                  borderRadius: 2,
                  height: `${Math.round(scrollProgress * 100)}%`,
                  position: 'absolute',
                  top: 0,
                }} />
              </View>
              {/* Affichage du pourcentage */}
              <Text style={{ fontSize: 11, color: '#174C3C', marginTop: 4, fontWeight: 'bold' }}>{Math.round(scrollProgress * 100)}%</Text>
            </View>
          )}
      </Animated.View>
      </View>

      {/* Navigation bas */}
      <View style={{ flexDirection: 'column', backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#eee', position: 'absolute', bottom: 0, left: 0, right: 0 }}>
        {/* Bouton Favoris */}
        <TouchableOpacity
          onPress={toggleFavorite}
          style={styles.favoriteButton}
        >
          <MaterialCommunityIcons 
            name={isFavorite ? "heart" : "heart-outline"} 
            size={18} 
            color="#174C3C"
          />
          <Text style={[styles.favoriteButtonText, { color: "#174C3C" }]}>
            {isFavorite ? "Retirer" : "Favoris"}
          </Text>
        </TouchableOpacity>
        
        {/* Navigation sections */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingVertical: 12 }}>
        {totalSections === 1 ? (
          // Navigation compacte pour les chapitres d'une seule page
          <>
            {previousChapter ? (
              <TouchableOpacity
                onPress={() => navigation.navigate('Chapter', { chapter: previousChapter })}
                style={{ backgroundColor: '#D4AF37', borderRadius: 12, paddingVertical: 6, paddingHorizontal: 12 }}
              >
                <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 14 }}>Chapitre précédent</Text>
              </TouchableOpacity>
            ) : (
              <View style={{ opacity: 0.4, backgroundColor: '#174C3C', borderRadius: 12, paddingVertical: 6, paddingHorizontal: 12 }}>
                <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 14 }}>Chapitre précédent</Text>
              </View>
            )}
            
            {/* Pagination centrée */}
            <View style={{ minWidth: 40, alignItems: 'center' }}>
              <Text style={{ color: '#174C3C', fontWeight: 'bold', fontSize: 16 }}>1/1</Text>
            </View>
            
              <TouchableOpacity
              onPress={handleQuizPress}
              style={{ backgroundColor: 'colors.secondary', borderRadius: 12, paddingVertical: 6, paddingHorizontal: 12 }}
              >
              <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 14 }}>Faire le quiz</Text>
              </TouchableOpacity>
          </>
        ) : (
          // Navigation normale pour les chapitres multi-pages
          <>
            {currentSectionIndex === 0 ? (
              previousChapter ? (
                <TouchableOpacity
                  onPress={() => navigation.navigate('Chapter', { chapter: previousChapter })}
                  style={{ backgroundColor: '#D4AF37', borderRadius: 18, paddingVertical: 8, paddingHorizontal: 18 }}
                >
                  <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>Chapitre précédent</Text>
                </TouchableOpacity>
              ) : (
                <View style={{ opacity: 0.4, backgroundColor: '#174C3C', borderRadius: 18, paddingVertical: 8, paddingHorizontal: 18 }}>
                  <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>Précédent</Text>
                </View>
              )
            ) : (
              <TouchableOpacity
                onPress={() => setCurrentSectionIndex(i => Math.max(0, i - 1))}
                style={{ backgroundColor: '#174C3C', borderRadius: 18, paddingVertical: 8, paddingHorizontal: 18 }}
              >
                <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>Précédent</Text>
              </TouchableOpacity>
            )}
            
            {/* Pagination */}
            <View style={{ minWidth: 60, alignItems: 'center' }}>
              <Text style={{ color: '#174C3C', fontWeight: 'bold', fontSize: 16 }}>{currentSectionIndex + 1}/{totalSections}</Text>
            </View>
            
            {currentSectionIndex === totalSections - 1 ? (
                <TouchableOpacity
                onPress={handleQuizPress}
                style={{ backgroundColor: 'colors.secondary', borderRadius: 18, paddingVertical: 8, paddingHorizontal: 18 }}
                >
                <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>Faire le quiz</Text>
                </TouchableOpacity>
            ) : (
              <TouchableOpacity
                onPress={() => setCurrentSectionIndex(i => Math.min(totalSections - 1, i + 1))}
                style={{ backgroundColor: '#174C3C', borderRadius: 18, paddingVertical: 8, paddingHorizontal: 18 }}
              >
                <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>Suivant</Text>
              </TouchableOpacity>
            )}
          </>
        )}
        </View>
      </View>
        </View>
      </PanGestureHandler>
      
      {/* Modal pour les quiz verrouillés */}
      <Modal
        visible={showLockModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowLockModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Image
                source={require('../../assets/lock-closed.png')}
                style={styles.modalLockIcon}
                resizeMode="contain"
              />
              <Text style={styles.modalTitle}>Quiz verrouillé</Text>
            </View>
            
            <Text style={styles.modalMessage}>
              Pour débloquer ce quiz, vous devez obtenir au moins 80% au quiz précédent.
            </Text>
            
            {previousScore !== undefined && (
              <View style={styles.modalScoreContainer}>
                <Text style={styles.modalScoreLabel}>Votre score actuel :</Text>
                <Text style={styles.modalScoreValue}>{previousScore}%</Text>
                <Text style={styles.modalScoreRequired}>
                  Score requis : 80%
                </Text>
              </View>
            )}
            
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={styles.modalButtonSecondary}
                onPress={() => setShowLockModal(false)}
              >
                <Text style={styles.modalButtonTextSecondary}>Fermer</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.modalButtonPrimary}
                onPress={() => {
                  setShowLockModal(false);
                  // Naviguer vers le quiz précédent
                  const allChapters = getAllChapters();
                  const currentChapterData = allChapters.find(ch => ch.image === chapter.image && ch.title === chapter.title);
                  if (currentChapterData && currentChapterData.chapitreIndex > 0) {
                    const previousChapter = allChapters.find(ch => ch.chapitreIndex === currentChapterData.chapitreIndex - 1);
                    if (previousChapter) {
                      navigation.navigate('OriginalQuiz', { 
                        exercicesKey: previousChapter.chapitreIndex.toString(), 
                        chapterTitle: previousChapter.title, 
                        chapterPart: previousChapter.partieTitre,
                        returnToChapter: {
                          image: chapter.image,
                          title: chapter.title,
                          section: currentSectionIndex
                        }
                      });
                    }
                  }
                }}
              >
                <Text style={styles.modalButtonTextPrimary}>Faire le quiz précédent</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  sectionTitle: {
    fontWeight: 'bold',
    color: '#174C3C',
    marginTop: 24,
    marginBottom: 12,
    textAlign: 'left',
  },
  mainTitle: {
    fontWeight: 'bold',
    color: '#174C3C',
    marginTop: 20,
    marginBottom: 10,
    textAlign: 'left',
  },
  subtitle: {
    fontWeight: 'bold',
    color: '#174C3C',
    marginTop: 20,
    marginBottom: 10,
    textAlign: 'left',
  },
  paragraph: {
    color: '#333',
    textAlign: 'left',
  },
  arabicContainer: {
    backgroundColor: '#FFF9E6',
    borderRadius: 12,
    padding: 16,
    marginVertical: 16,
    borderRightWidth: 4,
    borderRightColor: '#D4AF37',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  arabicText: {
    fontFamily: 'System',
    textAlign: 'right',
    color: '#174C3C',
    direction: 'rtl',
    lineHeight: 28,
  },
  verseContainer: {
    backgroundColor: '#F0F8FF',
    borderRadius: 12,
    padding: 16,
    marginVertical: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#174C3C',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  verseText: {
    fontStyle: 'italic',
    color: '#174C3C',
    textAlign: 'left',
    lineHeight: 24,
  },
  explanationContainer: {
    backgroundColor: '#E8F5E8',
    borderRadius: 12,
    padding: 16,
    marginVertical: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#174C3C',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  explanationText: {
    color: '#174C3C',
    textAlign: 'left',
    lineHeight: 24,
    fontWeight: '500',
  },
  favoriteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAF9',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E8F5E8',
  },
  favoriteButtonText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  // Styles pour le modal de quiz verrouillé
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 24,
    margin: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 10,
  },
  modalHeader: {
    alignItems: 'center',
    marginBottom: 16,
  },
  modalLockIcon: {
    width: 48,
    height: 48,
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#174C3C',
    textAlign: 'center',
  },
  modalMessage: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 20,
  },
  modalScoreContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  modalScoreLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  modalScoreValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#174C3C',
    marginBottom: 4,
  },
  modalScoreRequired: {
    fontSize: 14,
    color: '#666',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  modalButtonSecondary: {
    backgroundColor: '#f0f0f0',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    flex: 1,
    marginRight: 8,
    alignItems: 'center',
  },
  modalButtonPrimary: {
    backgroundColor: '#174C3C',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    flex: 1,
    marginLeft: 8,
    alignItems: 'center',
  },
  modalButtonTextSecondary: {
    color: '#666',
    fontWeight: 'bold',
    fontSize: 16,
  },
  modalButtonTextPrimary: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default ChapterScreen;