import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { collection, getDocs, getFirestore, limit, orderBy, query, startAfter } from 'firebase/firestore';
import React, { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Card from '../components/Card';
import colors from '../theme/colors';
import { typography } from '../theme/typography';

const NOTIFICATIONS_PER_PAGE = 20;

type Notification = {
  id: string;
  category: string;
  text: string;
  title?: string;
  source: string;
  createdAt: any;
};

export default function NotificationsScreen() {
  const navigation = useNavigation();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [lastDoc, setLastDoc] = useState<any>(null);
  const [hasMore, setHasMore] = useState(true);
  const db = getFirestore();

  const loadNotifications = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
        setHasMore(true);
        setLastDoc(null);
      } else {
        setLoadingMore(true);
      }

      const notifRef = collection(db, 'notifications');
      let q;
      
      if (isRefresh || !lastDoc) {
        q = query(notifRef, orderBy('createdAt', 'desc'), limit(NOTIFICATIONS_PER_PAGE));
      } else {
        q = query(notifRef, orderBy('createdAt', 'desc'), startAfter(lastDoc), limit(NOTIFICATIONS_PER_PAGE));
      }

      const snapshot = await getDocs(q);
      const newNotifications: Notification[] = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          category: data.type || 'Général',
          text: data.message || 'Notification',
          title: data.title || '',
          source: data.source || 'Système',
          createdAt: data.createdAt || new Date()
        };
      });

      if (isRefresh) {
        setNotifications(newNotifications);
      } else {
        setNotifications(prev => {
          const existingIds = new Set(prev.map(n => n.id));
          const uniqueNewNotifications = newNotifications.filter(n => !existingIds.has(n.id));
          return [...prev, ...uniqueNewNotifications];
        });
      }

      setLastDoc(snapshot.docs[snapshot.docs.length - 1]);
      setHasMore(snapshot.docs.length === NOTIFICATIONS_PER_PAGE);

    } catch (error) {
      console.error('Erreur lors du chargement des notifications:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  }, [db]);

  React.useEffect(() => {
    loadNotifications(true);
  }, []);

  const onRefresh = useCallback(() => {
    loadNotifications(true);
  }, [loadNotifications]);

  const loadMore = useCallback(() => {
    if (hasMore && !loadingMore && !refreshing) {
      loadNotifications(false);
    }
  }, [hasMore, loadingMore, refreshing]);

  const formatDate = (date: Date) => {
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      return 'À l\'instant';
    } else if (diffInHours < 24) {
      return `Il y a ${diffInHours}h`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return `Il y a ${diffInDays}j`;
    }
  };

  const getCategoryIcon = (category: string) => {
    if (!category) return 'bell';
    
    switch (category.toLowerCase()) {
      case 'gratitude':
        return 'heart';
      case 'prière':
        return 'hands-pray';
      case 'sabah':
        return 'weather-sunny';
      case 'hadith':
        return 'book-open-variant';
      default:
        return 'bell';
    }
  };

  const renderNotification = ({ item }: { item: Notification }) => (
    <Card variant="elevated" style={styles.notificationCard}>
      <View style={styles.notificationHeader}>
        <View style={styles.notificationIcon}>
          <MaterialCommunityIcons 
            name={getCategoryIcon(item.category)} 
            size={20} 
            color={colors.primary} 
          />
        </View>
        <View style={styles.notificationContent}>
          <Text style={[typography.overline, { color: colors.primary }]}>
            {item.category || 'Notification'}
          </Text>
          <Text style={[typography.caption, { color: colors.gray }]}>
            {formatDate(item.createdAt?.toDate?.() || new Date(item.createdAt))}
          </Text>
        </View>
      </View>
      {item.title ? (
        <Text style={[typography.h3, { color: colors.text, marginBottom: 4 }]}>
          {item.title}
        </Text>
      ) : null}
      <Text style={[typography.body1, styles.notificationText]}>
        {item.text || 'Aucun contenu'}
      </Text>
      <Text style={[typography.body2, styles.notificationSource]}>
        — {item.source || 'Source inconnue'}
      </Text>
    </Card>
  );

  const renderFooter = () => {
    if (!loadingMore) return null;
    return (
      <View style={styles.loadingFooter}>
        <ActivityIndicator size="small" color={colors.primary} />
        <Text style={[typography.body2, styles.loadingText]}>Chargement...</Text>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <MaterialCommunityIcons name="arrow-left" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[typography.h3, styles.headerTitle]}>Notifications</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[typography.body1, styles.loadingText]}>Chargement des notifications...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[typography.h3, styles.headerTitle]}>Notifications</Text>
        <View style={styles.placeholder} />
      </View>

      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        renderItem={renderNotification}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        ListFooterComponent={renderFooter}
        removeClippedSubviews={true}
        maxToRenderPerBatch={10}
        windowSize={10}
        initialNumToRender={10}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="bell-off" size={64} color={colors.gray} />
            <Text style={[typography.h3, styles.emptyTitle]}>Aucune notification</Text>
            <Text style={[typography.body2, styles.emptySubtitle]}>
              Vous n'avez pas encore reçu de notifications
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F7F6',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
  },
  headerTitle: {
    color: colors.text,
  },
  placeholder: {
    width: 40,
  },
  listContainer: {
    padding: 16,
  },
  notificationCard: {
    padding: 20,
    marginBottom: 16,
  },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  notificationIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  notificationContent: {
    flex: 1,
  },
  notificationText: {
    color: colors.text,
    marginBottom: 8,
    fontStyle: 'italic',
  },
  notificationSource: {
    color: colors.gray,
    textAlign: 'right',
    fontWeight: '500',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingFooter: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
  },
  loadingText: {
    marginLeft: 8,
    color: colors.gray,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    color: colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    color: colors.gray,
    textAlign: 'center',
  },
}); 