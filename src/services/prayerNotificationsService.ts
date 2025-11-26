import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { PRAYER_ORDER, PrayerTimings } from './prayerTimesService';

// Handler global: afficher la notif avec son, pas de badge
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

const CHANNEL_ID = 'prayer-reminders';

// Création du canal Android
const ensureChannel = async () => {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
      name: 'Rappels de prière',
      importance: Notifications.AndroidImportance.HIGH,
      sound: 'default',
      vibrationPattern: [0, 250, 250, 250],
      enableVibrate: true,
      lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
    });
  }
};

// Convertit "HH:MM" en Date d’aujourd’hui, puis applique un offset négatif (ex: -15 minutes)
const buildTriggerDate = (time: string, preMinutes: number): Date | null => {
  const match = time.match(/(\d{1,2}):(\d{2})/);
  if (!match) return null;

  const now = new Date();
  const date = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    parseInt(match[1], 10),
    parseInt(match[2], 10),
    0,
    0
  );

  // On enlève preMinutes
  date.setMinutes(date.getMinutes() - preMinutes);
  if (date <= now) {
    // L’heure est déjà passée (ou dans moins de preMinutes) → on ne programme rien
    return null;
  }

  return date;
};

// Annule toutes les notifications de type "prayer-reminder"
export const cancelAllPrayerNotifications = async () => {
  try {
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    const idsToCancel = scheduled
      .filter((n) => n.content?.data?.type === 'prayer-reminder')
      .map((n) => n.identifier);

    await Promise.all(
      idsToCancel.map((id) => Notifications.cancelScheduledNotificationAsync(id))
    );
  } catch (error) {
    console.error('❌ Erreur annulation notifications prière:', error);
  }
};

/**
 * Programme une notification 15 minutes (par défaut) avant chaque prière
 * encore à venir aujourd’hui.
 *
 * ⚠️ À APPELER UNIQUEMENT si l’utilisateur a explicitement activé les notifications.
 */
export const initializePrayerNotifications = async (
  timings: PrayerTimings,
  preNotificationMinutes: number = 15
): Promise<void> => {
  try {
    // 1) Permissions
    const { status } = await Notifications.getPermissionsAsync();
    let finalStatus = status;

    if (status !== 'granted') {
      const req = await Notifications.requestPermissionsAsync();
      finalStatus = req.status;
    }

    if (finalStatus !== 'granted') {
      console.log('🔕 Notifications non autorisées par l’utilisateur');
      return;
    }

    // 2) Canal Android
    await ensureChannel();

    // 3) Annuler les anciens rappels
    await cancelAllPrayerNotifications();

    // 4) Programmer une notification avant chaque prière
    const now = new Date();
    let scheduledCount = 0;

    for (const key of PRAYER_ORDER) {
      const rawTime = timings[key];
      if (!rawTime) continue;

      const triggerDate = buildTriggerDate(rawTime, preNotificationMinutes);
      if (!triggerDate || triggerDate <= now) continue;

      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Rappel de prière',
          body: `L’heure de ${key} approche.`,
          sound: 'default',
          data: {
            type: 'prayer-reminder',
            prayerKey: key,
          },
        },
        trigger: triggerDate,
      });

      scheduledCount += 1;
    }

    console.log(`📅 Notifications de prière programmées: ${scheduledCount}`);
  } catch (error) {
    console.error('❌ Erreur initializePrayerNotifications:', error);
  }
};

// Petit utilitaire pour afficher le statut dans l’UI si besoin
export const getNotificationStatus = async (): Promise<{
  granted: boolean;
  scheduled: number;
}> => {
  try {
    const { status } = await Notifications.getPermissionsAsync();
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();

    return {
      granted: status === 'granted',
      scheduled: scheduled.filter((n) => n.content?.data?.type === 'prayer-reminder').length,
    };
  } catch (error) {
    console.error('❌ Erreur statut notifications:', error);
    return { granted: false, scheduled: 0 };
  }
};

