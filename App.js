import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import BooksScreen from './src/screens/BooksScreen';
import ChapterScreen from './src/screens/ChapterScreen';

const Stack = createStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Books">
        <Stack.Screen name="Books" component={BooksScreen} />
        <Stack.Screen name="Chapter" component={ChapterScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
