import React, { useState, useEffect } from 'react';
import { AppProvider } from './contexts/AppContext';
import { useFirebase } from './hooks/useFirebase';
import LoginForm from './components/Auth/LoginForm';
import Dashboard from './components/Dashboard/Dashboard';
import FirebaseDebug from './components/Debug/FirebaseDebug';
import { doc, setDoc, collection } from 'firebase/firestore';
import { db } from './config/firebase';

// Initialize sample data
const initializeSampleData = async () => {
  try {
    // Sample Participants
    const participants = [
      { id: 'p1', name: 'Alex Johnson', bio: 'Fitness enthusiast and team leader', isActive: true, createdAt: new Date() },
      { id: 'p2', name: 'Sarah Wilson', bio: 'Artist and creative strategist', isActive: true, createdAt: new Date() },
      { id: 'p3', name: 'Mike Chen', bio: 'Chef and food innovator', isActive: true, createdAt: new Date() },
      { id: 'p4', name: 'Emma Davis', bio: 'Adventure seeker and motivator', isActive: true, createdAt: new Date() }
    ];

    // Sample Locations
    const locations = [
      { id: 'l1', name: 'Main Living Area', description: 'Central hub for daily activities', color: '#3B82F6', createdAt: new Date() },
      { id: 'l2', name: 'Kitchen', description: 'Cooking and meal prep area', color: '#EF4444', createdAt: new Date() },
      { id: 'l3', name: 'Backyard', description: 'Outdoor activities and challenges', color: '#10B981', createdAt: new Date() },
      { id: 'l4', name: 'Confessional', description: 'Private interview space', color: '#8B5CF6', createdAt: new Date() }
    ];

    // Sample Action Categories
    const actionCategories = [
      { id: 'a1', name: 'Challenge', description: 'Competition or task-based activities', color: '#F59E0B', createdAt: new Date() },
      { id: 'a2', name: 'Conflict', description: 'Disagreements or tensions', color: '#DC2626', createdAt: new Date() },
      { id: 'a3', name: 'Alliance', description: 'Strategic partnerships', color: '#059669', createdAt: new Date() },
      { id: 'a4', name: 'Confession', description: 'Private thoughts and strategies', color: '#7C3AED', createdAt: new Date() },
      { id: 'a5', name: 'Social', description: 'Casual interactions and bonding', color: '#2563EB', createdAt: new Date() }
    ];

    // Sample Tags
    const tags = [
      { id: 't1', name: 'Drama', color: '#DC2626', createdAt: new Date() },
      { id: 't2', name: 'Strategy', color: '#059669', createdAt: new Date() },
      { id: 't3', name: 'Emotional', color: '#7C3AED', createdAt: new Date() },
      { id: 't4', name: 'Funny', color: '#F59E0B', createdAt: new Date() },
      { id: 't5', name: 'Important', color: '#DC2626', createdAt: new Date() }
    ];

    // Set sample data in Firestore
    for (const participant of participants) {
      await setDoc(doc(db, 'participants', participant.id), participant);
    }
    
    for (const location of locations) {
      await setDoc(doc(db, 'locations', location.id), location);
    }
    
    for (const actionCategory of actionCategories) {
      await setDoc(doc(db, 'actionCategories', actionCategory.id), actionCategory);
    }
    
    for (const tag of tags) {
      await setDoc(doc(db, 'tags', tag.id), tag);
    }

    console.log('Sample data initialized successfully');
  } catch (error) {
    console.error('Error initializing sample data:', error);
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