import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Configuration des notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

// Ordre des prières
const PRAYER_ORDER = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'] as const;

// Fonction pour demander les permissions
export const requestNotificationPermissions = async (): Promise<boolean> => {
  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    // Pour Android 13+, demander la permission POST_NOTIFICATIONS
    if (Platform.OS === 'android' && Platform.Version >= 33) {
      const { status: androidStatus } = await Notifications.getPermissionsAsync();
      if (androidStatus !== 'granted') {
        console.log('⚠️ Permission notifications Android 13+ requise');
        return false;
      }
    }
    
    if (finalStatus !== 'granted') {
      console.log('❌ Permission notifications refusée');
      return false;
    }
    
    console.log('✅ Permission notifications accordée');
    return true;
  } catch (error) {
    console.error('❌ Erreur demande permission notifications:', error);
    return false;
  }
};

// Fonction pour programmer les notifications du jour
export const scheduleTodayNotifications = async (timings: Record<string, string>): Promise<void> => {
  try {
    // Annuler toutes les notifications existantes
    await Notifications.cancelAllScheduledNotificationsAsync();
    console.log('🗑️ Toutes les notifications annulées');
    
    // Vérifier les permissions
    const hasPermission = await requestNotificationPermissions();
    if (!hasPermission) {
      console.log('⚠️ Pas de permission pour les notifications');
      return;
    }
    
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    // Programmer les notifications pour chaque prière
    for (const prayerKey of PRAYER_ORDER) {
      const prayerTime = timings[prayerKey];
      if (!prayerTime) continue;
      
      const [hours, minutes] = prayerTime.split(':').map(Number);
      const notificationTime = new Date(today);
      notificationTime.setHours(hours, minutes, 0, 0);
      
      // Si l'heure est déjà passée aujourd'hui, programmer pour demain
      if (notificationTime <= now) {
        notificationTime.setDate(notificationTime.getDate() + 1);
      }
      
      // Noms des prières en français
      const prayerNames: Record<string, string> = {
        Fajr: 'Subh',
        Dhuhr: 'Dhuhr',
        Asr: 'Asr',
        Maghrib: 'Maghrib',
        Isha: 'Isha'
      };
      
      const prayerName = prayerNames[prayerKey] || prayerKey;
      
                           // Programmer la notification
         await Notifications.scheduleNotificationAsync({
           content: {
             title: `Heure de ${prayerName}`,
             body: `C'est l'heure de la prière de ${prayerName}`,
             sound: 'default',
             priority: Notifications.AndroidNotificationPriority.HIGH,
           },
           trigger: {
             seconds: Math.floor((notificationTime.getTime() - Date.now()) / 1000),
           },
         });
      
      console.log(`⏰ Notification programmée pour ${prayerName} à ${prayerTime}`);
    }
    
    console.log('✅ Toutes les notifications du jour programmées');
  } catch (error) {
    console.error('❌ Erreur programmation notifications:', error);
  }
};

// Fonction pour initialiser les notifications de prière
export const initializePrayerNotifications = async (timings: Record<string, string>): Promise<void> => {
  try {
    console.log('🔔 Initialisation des notifications de prière');
    await scheduleTodayNotifications(timings);
  } catch (error) {
    console.error('❌ Erreur initialisation notifications:', error);
  }
};

// Fonction pour gérer le toggle des notifications
export const handleNotificationToggle = async (
  prayerKey: string,
  enabled: boolean,
  timings: Record<string, string>
): Promise<void> => {
  try {
    if (enabled) {
      // Réactiver les notifications
      await scheduleTodayNotifications(timings);
    } else {
      // Désactiver toutes les notifications
      await Notifications.cancelAllScheduledNotificationsAsync();
      console.log('🔕 Toutes les notifications désactivées');
    }
  } catch (error) {
    console.error('❌ Erreur toggle notifications:', error);
  }
};

// Fonction pour replanifier les notifications (appelée au retour en foreground)
export const rescheduleNotifications = async (timings: Record<string, string>): Promise<void> => {
  try {
    console.log('🔄 Replanification des notifications');
    await scheduleTodayNotifications(timings);
  } catch (error) {
    console.error('❌ Erreur replanification notifications:', error);
  }
};

// Fonction pour obtenir le statut des notifications
export const getNotificationStatus = async (): Promise<{
  granted: boolean;
  scheduled: number;
}> => {
  try {
    const { status } = await Notifications.getPermissionsAsync();
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    
    return {
      granted: status === 'granted',
      scheduled: scheduled.length
    };
  } catch (error) {
    console.error('❌ Erreur statut notifications:', error);
    return { granted: false, scheduled: 0 };
  }
}; 