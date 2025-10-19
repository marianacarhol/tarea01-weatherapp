import { Text, View, Image, StyleSheet, ActivityIndicator, FlatList, TextInput, ImageBackground} from 'react-native';
import {SafeAreaProvider, SafeAreaView} from 'react-native-safe-area-context'
import {useState, useEffect} from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import {useFonts, Merriweather_400Regular, Merriweather_400Regular_Italic, Merriweather_700Bold,} from '@expo-google-fonts/merriweather';

const API_KEY = '5f76db61568a755b5e43ab3a98b7c68c';

const Cell = ({item, timezoneOffset = 0}) => {
  const d = new Date((item.dt + timezoneOffset) * 1000); //para ajustar el desfase de segundos al del área local
  const day = d.toLocaleString('en-US', {weekday: 'long'}); //para formatear el día de la semana
  const time = d.toLocaleTimeString('en-GB', {hour: '2-digit', minute: '2-digit'}); //para formatear el tiempo en 24 h
  const desc = item.weather?.[0]?.description ?? ''; //manejo de null/undefined para la descripción del clima
  const icon = item.weather?.[0]?.icon ?? '01d'; //manejo de null/undefined para el ícono del clima
  const temp = `${Math.round(item.main?.temp ?? 0)}°C`; //manejo de null/undefined para el ícono del clima y además redondea los grados Celsius a entero

  return (
    <View style={styles.cellOuter}>
      <BlurView intensity={28} tint="light" style={styles.glass}>
        <LinearGradient
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            colors={['rgba(255,255,255,0.28)', 'rgba(255,255,255,0.08)']}
            style={styles.glassBg}
        />    
        <Text style ={styles.day}>{day}</Text>
        <Image style={styles.weatherIcon} source={{ uri: `https://openweathermap.org/img/wn/${icon}@2x.png` }}/>
        <View style={styles.textContainer}>
          <Text style={styles.textInsideDescription}>{desc}</Text>
          <Text style={styles.textInsideTime}>{time}</Text>
        </View>
        <Text style={styles.temperatureCell}>{temp}</Text>
      </BlurView>
    </View>
  );
};

const Weather = ({city}) => {
  const [isLoading, setLoading] = useState(false); //para ActivityIndicator
  const [weatherData, setWeatherData] = useState([]); //para el json.list
  const [timezoneOffset, setTimezoneOffset] = useState(0); //para json.city.timezone
  const [error, setError] = useState(''); //para mensajes de error al usuarip

  const getData = async() => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(city)}&units=metric&appid=${API_KEY}`);
      const json = await response.json();

      if (response.ok && json.cod === '200') { //200 OK, código de éxito HTTP. Este if-else es para manejar el caso de éxito y el de error
        setWeatherData(json.list || []);
        setTimezoneOffset(json.city?.timezone ?? 0);
      }
      else{
        setWeatherData([]);
        setTimezoneOffset(0);
        setError(json?.message || 'Error de consulta');
      }
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { // para implementar lo de esperar 1 segundo después de que el usuario haya dejado de escribir en el TextInput antes de hacer la consulta
    if (!city.trim()) { //si el valor de city esta vacío, se limpia todo y no se hace consulta
      setWeatherData([]);
      setError('');
      setTimezoneOffset(0);
      setLoading(false);
      return;
    }

    setLoading(true);

    const timer = setTimeout(() => {
      getData();
    }, 1000);

    return () => clearTimeout(timer);
  }, [city]);

  const current = weatherData[0]; //primer elemento del json que se usa para el encabezado

  if (current) {
    const headerDate = new Date((current.dt + timezoneOffset) * 1000);
    headerTime = headerDate.toLocaleTimeString('en-GB', { hour: '2-digit',minute: '2-digit'});
  }     

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container}>
      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator/>
        </View>
      ) : (
        <>
          {current && (
            <View style={styles.header}>
              <View style={styles.headerTopRow}>
                <Text style={styles.temperatureHeader}>{Math.round(current.main.temp)}°C</Text>
                <Image style={styles.headerIcon} source={{ uri: `https://openweathermap.org/img/wn/${current.weather[0].icon}@2x.png`}}
                />
              </View>

              <View style={styles.headerBottomRow}>
                <Text style={styles.headerTime}>{headerTime}</Text>
                <Text style={styles.descriptionHeader}>{current.weather[0].description}</Text>
              </View>
            </View>
          )}

          {/* en caso de error, sale el mensaje */}
          {error && <Text style={styles.error}>{error}</Text>}
          
          {/* es para un mensaje vacío cuando no hay error, no hay loading, y la lista viene vacía */}
          {!error && !isLoading && weatherData.length === 0 && (
            <Text style={styles.empty}>No hay datos para “{city}”.</Text>
          )}       

          <FlatList
            data={weatherData.slice(1)} // me salto el primer elemento porque ya lo usó en header
            keyExtractor={(item) => String(item.dt)}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => <Cell item={item} timezoneOffset={timezoneOffset} />}
          />   
        </>
      )}
      </SafeAreaView>
    </SafeAreaProvider>
  );
};

export default function App () {
  const [city, setCity] = useState('Hermosillo');
    const [fontsLoaded] = useFonts({
    Merriweather_400Regular,
    Merriweather_400Regular_Italic,
    Merriweather_700Bold,
  });

  if (!fontsLoaded) {
    return (
      <ImageBackground
        source={require('imagebg_weatherapp.jpg')}
        style={{ flex: 1 }}
        resizeMode="cover"
      >
        <View style={[styles.centered, { backgroundColor: 'rgba(0,0,0,0.25)' }]}>
          <ActivityIndicator size="large" color="#FFFFFF" />
        </View>
      </ImageBackground>
    );
  }  

  return (
    <ImageBackground
      source={require('imagebg_weatherapp.jpg')}
      style={{ flex: 1 }}
      resizeMode="cover"
    >
      <View style={styles.inputcontainer}>
        <TextInput style={styles.input} value={city} onChangeText={setCity} />

        {city.trim() ? (
          <Weather city={city} />
        ) : (
          <Text style={styles.empty}>Escribe una ciudad para ver el clima :)</Text>
        )}
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  inputcontainer: {
    flex: 1,
    paddingTop: 75,
    paddingLeft: 20,
    paddingRight: 20,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
    flex: 1,
  },
  input: {
    width: '100%',
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.20)',
    color: '#FFFFFF',
    marginBottom: 12,
    fontFamily: 'Merriweather_400Regular',
    fontSize: 16,
  },
  header: {
    alignItems: 'center',
  },
  temperatureHeader: {
    fontSize: 56,
    color: '#FFFFFF',
    fontFamily: 'Merriweather_700Bold',
  },
  descriptionHeader: {
    fontSize: 18,
    color: '#FFFFFF',
    textTransform: 'capitalize',
    fontFamily: 'Merriweather_400Regular',
  },
  headerIcon: {
    width: 100,
    height: 100,
  },
  headerTopRow: {
    paddingLeft: 20,
    flexDirection: 'row',  
    alignItems: 'center', 
    gap: 5              
  },
  headerBottomRow: {
    flexDirection: 'row',  
    alignItems: 'center',
    paddingBottom: 30,
    gap: 17                
  },
  headerTime: {
    fontSize: 20,                         
    color: '#FFFFFF',                                              
    fontFamily: 'Merriweather_400Regular_Italic', 
  },
  cellOuter: {
    marginHorizontal: 8,
    marginVertical: 6,
    borderRadius: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.18,
    shadowRadius: 20,
    elevation: 6,
  },
  glass: {
    height: 76,
    overflow: 'hidden',
    borderRadius: 18,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.35)',
    backgroundColor: 'rgba(255,255,255,0.12)',
    flexDirection: 'row',
    alignItems: 'center',
  },
  glassBg: { /*atajo de React Native. Es para que el LinearGradient se posiciona absolutamente y ocupe todo el alto y ancho del BlurView padre*/
    ...StyleSheet.absoluteFillObject,
  },
  day: {
    color: '#FFFFFF',
    fontSize: 16,
    width: 92,
    textTransform: 'capitalize',
    marginRight: 6,
    fontFamily: 'Merriweather_700Bold',
  },
  weatherIcon: {
    width: 36,
    height: 36
  },
  textContainer: {
    flex: 1,
    paddingLeft: 5,
    flexShrink: 1,
    minWidth: 0,
  },
  textInsideDescription: {
    color: '#FFFFFF',
    fontSize: 15,
    opacity: 0.98,
    textTransform: 'capitalize',
    lineHeight: 18,
    fontFamily: 'Merriweather_400Regular',
  },
  textInsideTime: {
    color: '#FFFFFF',
    fontSize: 15,
    opacity: 0.8,
    marginTop: 2,
    fontFamily: 'Merriweather_400Regular_Italic',
  },
  temperatureCell: {
    color: '#FFFFFF',
    fontSize: 20,
    marginLeft: 8,
    width: 52,
    textAlign: 'right',
    fontFamily: 'Merriweather_700Bold',
  },
  empty: {
    color: '#FFFFFF',
    textAlign: 'center',
    marginTop: 12,
    opacity: 0.9,
    fontFamily: 'Merriweather_400Regular',
  },
  error: {
    color: '#FFFFFF',
    textAlign: 'center',
    marginVertical: 8,
    fontFamily: 'Merriweather_400Regular',
  },
});