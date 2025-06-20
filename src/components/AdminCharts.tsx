import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { Dimensions, StyleSheet, Text, View } from 'react-native';

const { width } = Dimensions.get('window');

interface ChartData {
  label: string;
  value: number;
  color: string;
  percentage: number;
}

interface AdminChartsProps {
  usersData: ChartData[];
  contentData: ChartData[];
  activityData: ChartData[];
}

export default function AdminCharts({ usersData, contentData, activityData }: AdminChartsProps) {
  const BarChart = ({ data, title }: { data: ChartData[]; title: string }) => (
    <View style={styles.chartContainer}>
      <Text style={styles.chartTitle}>{title}</Text>
      <View style={styles.barsContainer}>
        {data.map((item, index) => (
          <View key={index} style={styles.barItem}>
            <View style={styles.barContainer}>
              <LinearGradient
                colors={[item.color, item.color + '80']}
                style={[styles.bar, { height: item.percentage * 2 }]}
                start={{ x: 0, y: 1 }}
                end={{ x: 0, y: 0 }}
              />
            </View>
            <Text style={styles.barLabel}>{item.label}</Text>
            <Text style={styles.barValue}>{item.value}</Text>
          </View>
        ))}
      </View>
    </View>
  );

  const PieChart = ({ data, title }: { data: ChartData[]; title: string }) => (
    <View style={styles.chartContainer}>
      <Text style={styles.chartTitle}>{title}</Text>
      <View style={styles.pieContainer}>
        <View style={styles.pieChart}>
          {data.map((item, index) => (
            <View
              key={index}
              style={[
                styles.pieSlice,
                {
                  backgroundColor: item.color,
                  transform: [
                    { rotate: `${(index * 360) / data.length}deg` }
                  ]
                }
              ]}
            />
          ))}
        </View>
        <View style={styles.pieLegend}>
          {data.map((item, index) => (
            <View key={index} style={styles.legendItem}>
              <View style={[styles.legendColor, { backgroundColor: item.color }]} />
              <Text style={styles.legendText}>{item.label}: {item.value}</Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );

  const LineChart = ({ data, title }: { data: ChartData[]; title: string }) => (
    <View style={styles.chartContainer}>
      <Text style={styles.chartTitle}>{title}</Text>
      <View style={styles.lineContainer}>
        <View style={styles.lineChart}>
          {data.map((item, index) => (
            <View key={index} style={styles.linePoint}>
              <View style={[styles.point, { backgroundColor: item.color }]} />
              {index < data.length - 1 && (
                <View style={[styles.line, { backgroundColor: item.color }]} />
              )}
            </View>
          ))}
        </View>
        <View style={styles.lineLabels}>
          {data.map((item, index) => (
            <Text key={index} style={styles.lineLabel}>{item.label}</Text>
          ))}
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <BarChart data={usersData} title="Répartition des Utilisateurs" />
      <PieChart data={contentData} title="Répartition du Contenu" />
      <LineChart data={activityData} title="Activité Récente" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
  },
  chartContainer: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    overflow: 'hidden',
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 15,
    textAlign: 'center',
  },
  barsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    height: 120,
  },
  barItem: {
    alignItems: 'center',
    flex: 1,
  },
  barContainer: {
    height: 100,
    justifyContent: 'flex-end',
    marginBottom: 8,
  },
  bar: {
    width: 20,
    borderRadius: 10,
    minHeight: 10,
  },
  barLabel: {
    fontSize: 12,
    color: '#fff',
    textAlign: 'center',
    marginBottom: 4,
  },
  barValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
  },
  pieContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  pieChart: {
    width: 120,
    height: 120,
    borderRadius: 60,
    overflow: 'hidden',
    position: 'relative',
  },
  pieSlice: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: 60,
  },
  pieLegend: {
    flex: 1,
    marginLeft: 20,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  legendText: {
    fontSize: 14,
    color: '#fff',
  },
  lineContainer: {
    alignItems: 'center',
  },
  lineChart: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 80,
    marginBottom: 15,
  },
  linePoint: {
    alignItems: 'center',
    flex: 1,
  },
  point: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginBottom: 8,
  },
  line: {
    position: 'absolute',
    height: 2,
    width: '100%',
    top: 5,
  },
  lineLabels: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  lineLabel: {
    fontSize: 12,
    color: '#fff',
    textAlign: 'center',
  },
}); 