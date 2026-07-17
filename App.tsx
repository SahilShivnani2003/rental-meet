import { StatusBar, StyleSheet, useColorScheme, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import RootNavigator from './src/navigations/RootNavigation';
import { Colors } from '@/theme/theme';
import { useEffect } from 'react';
import { getCitiesByState, getStates } from '@/utils/location';
import requestNotificationPermission from '@/utils/requestNotificationPermission';

function App() {
    const isDarkMode = useColorScheme() === 'dark';

    useEffect(()=>{
        requestNotificationPermission();
    },[])

    return (
        <SafeAreaProvider>
            <SafeAreaView style={styles.container}>
                <StatusBar barStyle="light-content" backgroundColor={Colors.primary} />
                <RootNavigator />
            </SafeAreaView>
        </SafeAreaProvider>
    );
}
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.primary,
    },
});

export default App;
