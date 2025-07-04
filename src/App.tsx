import React, { useState, useEffect } from 'react';
import { AppProvider } from './contexts/AppContext';
import { useFirebase } from './hooks/useFirebase';
import LoginForm from './components/Auth/LoginForm';
import Dashboard from './components/Dashboard/Dashboard';
import FirebaseDebug from './components/Debug/FirebaseDebug';
import { doc, setDoc, collection, addDoc, serverTimestamp, getDocs, deleteDoc } from 'firebase/firestore';
import { db } from './config/firebase';





// Clean and initialize sample data with only 5 items each
const initializeSampleData = async () => {
  try {
    console.log('🧹 Limpando dados antigos...');
    
    // Clean existing data
    const collections = ['participants', 'locations', 'actionCategories', 'tags'];
    
    for (const collectionName of collections) {
      const snapshot = await getDocs(collection(db, collectionName));
      const deletePromises = snapshot.docs.map(doc => deleteDoc(doc.ref));
      await Promise.all(deletePromises);
      console.log(`✅ Limpou ${snapshot.size} itens de ${collectionName}`);
    }

    // Sample Participants (only 5)
    const participants = [
      { name: 'Alex Johnson', bio: 'Fitness enthusiast and team leader', isActive: true },
      { name: 'Sarah Wilson', bio: 'Artist and creative strategist', isActive: true },
      { name: 'Mike Chen', bio: 'Chef and food innovator', isActive: true },
      { name: 'Emma Davis', bio: 'Adventure seeker and motivator', isActive: true },
      { name: 'Lucas Silva', bio: 'Tech expert and problem solver', isActive: true }
    ];

    // Sample Locations (only 5)
    const locations = [
      { name: 'Sala Principal', description: 'Central hub for daily activities', color: '#3B82F6' },
      { name: 'Cozinha', description: 'Cooking and meal prep area', color: '#EF4444' },
      { name: 'Jardim', description: 'Outdoor activities and challenges', color: '#10B981' },
      { name: 'Confessional', description: 'Private interview space', color: '#8B5CF6' },
      { name: 'Quarto', description: 'Rest and private conversations', color: '#F59E0B' }
    ];

    // Sample Action Categories (only 5)
    const actionCategories = [
      { name: 'Desafio', description: 'Competition or task-based activities', color: '#F59E0B' },
      { name: 'Conflito', description: 'Disagreements or tensions', color: '#DC2626' },
      { name: 'Aliança', description: 'Strategic partnerships', color: '#059669' },
      { name: 'Confissão', description: 'Private thoughts and strategies', color: '#7C3AED' },
      { name: 'Social', description: 'Casual interactions and bonding', color: '#2563EB' }
    ];

    // Sample Tags (only 5)
    const tags = [
      { name: 'Drama', color: '#DC2626' },
      { name: 'Estratégia', color: '#059669' },
      { name: 'Emocional', color: '#7C3AED' },
      { name: 'Engraçado', color: '#F59E0B' },
      { name: 'Importante', color: '#DC2626' }
    ];

    // Add new clean data
    for (const participant of participants) {
      await addDoc(collection(db, 'participants'), {
        ...participant,
        createdAt: serverTimestamp()
      });
    }
    
    for (const location of locations) {
      await addDoc(collection(db, 'locations'), {
        ...location,
        createdAt: serverTimestamp()
      });
    }
    
    for (const actionCategory of actionCategories) {
      await addDoc(collection(db, 'actionCategories'), {
        ...actionCategory,
        createdAt: serverTimestamp()
      });
    }
    
    for (const tag of tags) {
      await addDoc(collection(db, 'tags'), {
        ...tag,
        createdAt: serverTimestamp()
      });
    }

    console.log('✅ Dados de amostra limpos e inicializados com sucesso (5 itens cada)');
  } catch (error) {
    console.error('❌ Error initializing sample data:', error);
  }
};

const AppContent: React.FC = () => {
  const { currentUser, loading } = useFirebase();
  const [dataInitialized, setDataInitialized] = useState(false);
  const [showDebug, setShowDebug] = useState(false);

  useEffect(() => {
    const initData = async () => {
      if (!dataInitialized && currentUser) {
        await initializeSampleData();
        setDataInitialized(true);
      }
    };
    initData();
  }, [dataInitialized, currentUser]);

  // Mostrar debug se houver problemas de login
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'D') {
        setShowDebug(!showDebug);
      }
    };
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [showDebug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-cyan-400/30 border-t-cyan-400 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white text-lg">Loading Reality Show Logger...</p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <>
        <LoginForm onSuccess={() => {}} />
        {showDebug && <FirebaseDebug />}
        <div className="fixed bottom-4 left-4 text-xs text-gray-500">
          Pressione Ctrl+Shift+D para debug
        </div>
      </>
    );
  }

  return <Dashboard />;
};

function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}

export default App;