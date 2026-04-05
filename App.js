// App.js
import React, {useEffect} from 'react';
import {PaperProvider} from 'react-native-paper';
import BootSplash from 'react-native-bootsplash';
import AppStack from './src/navigation/AppStack';

const App = () => {
  useEffect(() => {
    const init = async () => {
      // Sembunyikan splash screen dengan animasi fade setelah app siap
      await BootSplash.hide({fade: true});
    };
    init();
  }, []);

  return (
    <PaperProvider>
      <AppStack />
    </PaperProvider>
  );
};

export default App;
