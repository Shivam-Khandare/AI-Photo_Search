import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useState, useEffect } from 'react';
import {
  StatusBar,
  Text,
  StyleSheet,
  View,
  TextInput,
  FlatList,
  Image,
  Dimensions,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useGallery } from '../hooks/useGallery';
import { indexPhoto, searchPhotos } from '../api/imageService';

interface Photo {
  uri: string;
}

const HomeScreen = (): React.JSX.Element => {
  const [searchQuery, setSearchQuery] = useState('');
  const { photos: allPhotos } = useGallery();

  const [searchResults, setSearchResults] = useState<Photo[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const [indexingStatus, setIndexingStatus] = useState('idle');
  const [progress, setProgress] = useState('');

  // This function runs whenever the user types in the search bar
  useEffect(() => {
    console.log(`[LOG] useEffect triggered. Current searchQuery: "${searchQuery}"`);

    if (searchQuery.trim() === '') {
      console.log('[LOG] Search query is empty. Clearing results.');
      setSearchResults([]);
      return;
    }

    console.log('[LOG] Setting a timeout to call the search API...');
    setIsSearching(true);
    const handler = setTimeout(() => {
      console.log('[LOG] Timeout finished. Calling searchPhotos() now.');
      searchPhotos(searchQuery)
        .then(results => {
          console.log('[LOG] searchPhotos() successful. Received results:', results);
          const formattedResults = results.map((r: any) => ({ uri: r.deviceImagePath }));
          setSearchResults(formattedResults);
        })
        .catch(err => {
          // This will catch the error if the fetch itself fails
          console.error('[ERROR] The searchPhotos() promise was rejected:', err);
        })
        .finally(() => {
          console.log('[LOG] Search process finished.');
          setIsSearching(false);
        });
    }, 500);

    return () => {
      console.log('[LOG] Cleanup: Clearing previous timeout.');
      clearTimeout(handler);
    };
  }, [searchQuery]);


  const handleIndexPhotos = async () => {
    // ... same indexing code as before
    setIndexingStatus('indexing');
    const totalPhotos = allPhotos.length;
    let indexedCount = 0;
    const userId = 'user123';

    for (const photo of allPhotos) {
      try {
        setProgress(`Indexing ${indexedCount + 1} of ${totalPhotos}...`);
        await indexPhoto(photo, userId);
        indexedCount++;
      } catch (error) {
        console.error(`Failed to index photo: ${photo.uri}`, error);
      }
    }

    setProgress(`Indexing complete! ${indexedCount} photos processed.`);
    setIndexingStatus('complete');
  };

  const photosToShow = searchQuery.trim().length > 0 ? searchResults : allPhotos;
  const numColumns = 3;
  const imageSize = Dimensions.get('window').width / numColumns;

  return (
    <SafeAreaView style={styles.container}>
      {/* ... The rest of your UI code (JSX) is exactly the same ... */}
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <Text style={styles.title}>Photo Search</Text>
      </View>
      <View style={styles.searchSection}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search for photos by description..."
          placeholderTextColor="#999"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {isSearching && <ActivityIndicator style={styles.searchSpinner} />}
      </View>
      <FlatList
        data={photosToShow}
        keyExtractor={item => item.uri}
        numColumns={numColumns}
        renderItem={({ item }) => (
          <Image
            source={{ uri: item.uri }}
            style={{ width: imageSize, height: imageSize }}
          />
        )}
      />
      <View style={styles.footer}>
        {indexingStatus === 'indexing' ? (
          <View style={styles.progressContainer}>
            <ActivityIndicator size="small" color="#FFFFFF" />
            <Text style={styles.progressText}>{progress}</Text>
          </View>
        ) : (
          <TouchableOpacity style={styles.button} onPress={handleIndexPhotos}>
            <Text style={styles.buttonText}>
              {indexingStatus === 'complete' ? 'Re-Index All Photos' : 'Start Indexing Photos'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
};

// ... All your styles are exactly the same ...
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  header: { paddingVertical: 16, paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: '#E0E0E0' },
  title: { fontSize: 28, fontWeight: 'bold', color: '#111' },
  searchSection: { backgroundColor: '#FFFFFF', padding: 16 },
  searchInput: { backgroundColor: '#F0F0F0', borderRadius: 12, paddingVertical: 12, paddingHorizontal: 16, fontSize: 16 },
  searchSpinner: { position: 'absolute', right: 30, top: 30 },
  footer: { padding: 20, backgroundColor: '#111' },
  button: { backgroundColor: '#007AFF', paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  buttonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
  progressContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  progressText: { color: '#FFFFFF', fontSize: 16, marginLeft: 10 },
});

export default HomeScreen;