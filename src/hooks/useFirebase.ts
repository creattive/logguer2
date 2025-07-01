import { useState, useEffect } from 'react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';
import { 
  doc, 
  setDoc, 
  getDoc, 
  collection, 
  addDoc, 
  onSnapshot, 
  query, 
  orderBy,
  serverTimestamp 
} from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import { User, LogEntry, Participant, Location, ActionCategory, Tag } from '../types';

export const useFirebase = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        try {
          // Get user data from Firestore
          const userRef = doc(db, 'users', firebaseUser.uid);
          const userSnap = await getDoc(userRef);
          
          if (userSnap.exists()) {
            const userData = userSnap.data();
            setCurrentUser({
              uid: firebaseUser.uid,
              email: firebaseUser.email!,
              displayName: firebaseUser.displayName || userData.displayName,
              role: userData.role || 'viewer',
              createdAt: userData.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
              lastActive: new Date().toISOString()
            });
          } else {
            // Create user document if it doesn't exist
            const newUser = {
              email: firebaseUser.email!,
              displayName: firebaseUser.displayName || firebaseUser.email!.split('@')[0],
              role: 'viewer' as const,
              createdAt: serverTimestamp(),
              lastActive: serverTimestamp()
            };
            
            await setDoc(userRef, newUser);
            
            setCurrentUser({
              uid: firebaseUser.uid,
              email: firebaseUser.email!,
              displayName: newUser.displayName,
              role: newUser.role,
              createdAt: new Date().toISOString(),
              lastActive: new Date().toISOString()
            });
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
          setCurrentUser(null);
        }
      } else {
        setCurrentUser(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      return result.user;
    } catch (error) {
      throw error;
    }
  };

  const register = async (email: string, password: string, displayName: string, role: 'admin' | 'logger' | 'viewer' = 'viewer') => {
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      
      // Save user data to Firestore
      const userRef = doc(db, 'users', result.user.uid);
      await setDoc(userRef, {
        email,
        displayName,
        role,
        createdAt: serverTimestamp(),
        lastActive: serverTimestamp()
      });

      return result.user;
    } catch (error) {
      throw error;
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      throw error;
    }
  };

  const addLogEntry = async (entry: Omit<LogEntry, 'id' | 'createdAt' | 'createdBy'>) => {
    if (!currentUser) throw new Error('User not authenticated');

    const logRef = collection(db, 'logEntries');
    
    const docRef = await addDoc(logRef, {
      ...entry,
      createdBy: currentUser.uid,
      createdAt: serverTimestamp()
    });

    return docRef.id;
  };

  const useRealtimeData = <T>(collectionName: string): [T[], boolean] => {
    const [data, setData] = useState<T[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
      const q = query(collection(db, collectionName), orderBy('createdAt', 'desc'));
      
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const dataArray: T[] = [];
        snapshot.forEach((doc) => {
          dataArray.push({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || new Date().toISOString()
          } as T);
        });
        setData(dataArray);
        setLoading(false);
      }, (error) => {
        console.error(`Error fetching ${collectionName}:`, error);
        setLoading(false);
      });

      return unsubscribe;
    }, [collectionName]);

    return [data, loading];
  };

  return {
    currentUser,
    loading,
    login,
    register,
    logout,
    addLogEntry,
    useRealtimeData
  };
};