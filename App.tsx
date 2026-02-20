import { StatusBar, StyleSheet, useColorScheme } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import RootNavigator from './src/navigations/RootNavigation';

function App() {
  const isDarkMode = useColorScheme() === 'dark';

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
        <RootNavigator />
      </SafeAreaView>
    </SafeAreaProvider>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default App;
