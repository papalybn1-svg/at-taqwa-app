import { MaterialCommunityIcons } from '@expo/vector-icons';
import { collection, getDocs, getFirestore, query, Timestamp, where } from 'firebase/firestore';
import React, { useCallback, useContext, useEffect, useState } from 'react';
import { Dimensions, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { BarChart, LineChart } from 'react-native-chart-kit';
import { SafeAreaView } from 'react-native-safe-area-context';
import colors from '../theme/colors';
import { AuthContext } from './LoginScreen';

const { width } = Dimensions.get('window');

interface ChartData {
  labels: string[];
  datasets: { data: number[] }[];
}

const StatCard = ({ icon, title, value }: { icon: any; title: string; value: string | number }) => (
  <View style={styles.statCard}>
    <MaterialCommunityIcons name={icon} size={28} color={colors.primary} />
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statTitle}>{title}</Text>
  </View>
);

export default function AdminDashboardScreen() {
  const { user } = useContext(AuthContext);
  const [stats, setStats] = useState({
    users: 0,
    admins: 0,
    readingsToday: 0,
    avgQuizScore: '0%',
  });
  const [newUsersData, setNewUsersData] = useState<ChartData>({
    labels: [],
    datasets: [{ data: [] }],
  });
  const [mostReadChapters, setMostReadChapters] = useState<ChartData>({
    labels: [],
    datasets: [{ data: [] }]
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const db = getFirestore();

  const loadDashboardData = useCallback(async () => {
    try {
      if (!refreshing) setLoading(true);

      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const todayTimestamp = Timestamp.fromDate(todayStart);

      const usersQuery = query(collection(db, 'users'));
      const adminsQuery = query(collection(db, 'users'), where('role', '==', 'admin'));
      const readingsTodayQuery = query(collection(db, 'readingActivity'), where('readAt', '>=', todayTimestamp));
      const allQuizzesQuery = query(collection(db, 'quizResults'));
      const allReadingsQuery = query(collection(db, 'readingActivity'));

      const [usersSnapshot, adminsSnapshot, readingsTodaySnapshot, allQuizzesSnapshot, allReadingsSnapshot] = await Promise.all([
        getDocs(usersQuery),
        getDocs(adminsQuery),
        getDocs(readingsTodayQuery),
        getDocs(allQuizzesQuery),
        getDocs(allReadingsQuery),
      ]);

      let totalScore = 0;
      let totalQuestions = 0;
      allQuizzesSnapshot.forEach(doc => {
        totalScore += doc.data().score;
        totalQuestions += doc.data().totalQuestions;
      });
      const avgQuizScore = totalQuestions > 0 ? ((totalScore / totalQuestions) * 100).toFixed(0) + '%' : '0%';

      setStats({
        users: usersSnapshot.size,
        admins: adminsSnapshot.size,
        readingsToday: readingsTodaySnapshot.size,
        avgQuizScore,
      });

      const today = new Date();
      const weeklyData = Array(7).fill(0);
      const dayLabels = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
      const sortedDayLabels = [...Array(7)].map((_, i) => {
        const d = new Date();
        d.setDate(today.getDate() - i);
        return dayLabels[d.getDay()];
      }).reverse();
      
      usersSnapshot.forEach(doc => {
        const createdAt = doc.data().createdAt?.toDate();
        if (createdAt) {
          const daysDiff = Math.floor((today.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24));
          if (daysDiff >= 0 && daysDiff < 7) {
            weeklyData[6 - daysDiff]++;
          }
        }
      });
      setNewUsersData({ labels: sortedDayLabels, datasets: [{ data: weeklyData }] });

      const chapterCounts: { [key: string]: number } = {};
      allReadingsSnapshot.forEach(doc => {
        const { chapterTitle } = doc.data();
        chapterCounts[chapterTitle] = (chapterCounts[chapterTitle] || 0) + 1;
      });
      const sortedChapters = Object.entries(chapterCounts).sort(([,a],[,b]) => b-a).slice(0, 4);
      setMostReadChapters({
        labels: sortedChapters.map(([title]) => title.substring(0, 12) + '...'),
        datasets: [{ data: sortedChapters.map(([, count]) => count) }]
      });

    } catch (error) {
      console.error("Erreur de chargement:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [refreshing]);

  useEffect(() => { loadDashboardData() }, [loadDashboardData]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadDashboardData();
  }, [loadDashboardData]);

  const chartConfig = {
    backgroundGradientFrom: colors.white,
    backgroundGradientTo: colors.white,
    color: (opacity = 1) => `rgba(23, 76, 60, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(100, 100, 100, ${opacity})`,
    strokeWidth: 2,
    barPercentage: 0.8,
    useShadowColorFromDataset: false,
    decimalPlaces: 0,
    propsForDots: { r: "5", strokeWidth: "2", stroke: colors.secondary }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} tintColor={colors.primary} />}
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Tableau de Bord</Text>
          <Text style={styles.headerSubtitle}>Synthèse de l'activité</Text>
        </View>

        {loading && !refreshing? <Text style={styles.loadingText}>Chargement des données...</Text> :
        <>
          <View style={styles.statsContainer}>
            <StatCard icon="account-group-outline" title="Utilisateurs" value={stats.users} />
            <StatCard icon="shield-account-outline" title="Admins" value={stats.admins} />
            <StatCard icon="book-open-page-variant-outline" title="Lectures (jour)" value={stats.readingsToday} />
            <StatCard icon="chart-donut" title="Score Quiz" value={stats.avgQuizScore} />
          </View>

          {newUsersData.datasets[0].data.length > 0 &&
            <View style={styles.chartCard}>
              <Text style={styles.chartTitle}>Nouveaux utilisateurs (7 jours)</Text>
              <LineChart
                data={newUsersData}
                width={width - 48}
                height={230}
                chartConfig={chartConfig}
                bezier
                style={styles.chartStyle}
                fromZero
              />
            </View>
          }

          {mostReadChapters.datasets[0].data.length > 0 &&
            <View style={styles.chartCard}>
              <Text style={styles.chartTitle}>Chapitres les plus lus</Text>
              <BarChart
                data={mostReadChapters}
                width={width - 48}
                height={230}
                yAxisLabel=""
                yAxisSuffix=""
                chartConfig={chartConfig}
                style={styles.chartStyle}
                fromZero
                showValuesOnTopOfBars
                verticalLabelRotation={10}
              />
            </View>
          }
          <View style={{height: 40}} />
        </>
        }
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f4f7f6' },
  container: { flex: 1, paddingHorizontal: 16 },
  header: { paddingVertical: 20, paddingHorizontal: 8 },
  headerTitle: { fontSize: 32, fontWeight: 'bold', color: colors.text },
  headerSubtitle: { fontSize: 18, color: colors.gray, marginTop: 4 },
  loadingText: { textAlign: 'center', marginTop: 50, fontSize: 16, color: colors.gray },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    marginTop: 10,
  },
  statCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    width: '48%',
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
  },
  statValue: { fontSize: 26, fontWeight: 'bold', color: colors.primary, marginVertical: 8 },
  statTitle: { fontSize: 14, color: colors.gray, textAlign: 'center' },
  chartCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    paddingVertical: 20,
    paddingHorizontal: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    marginBottom: 20,
    alignItems: 'center',
  },
  chartTitle: { fontSize: 18, fontWeight: 'bold', color: colors.text, marginBottom: 16, alignSelf: 'flex-start', paddingHorizontal: 12 },
  chartStyle: { borderRadius: 12 },
}); 