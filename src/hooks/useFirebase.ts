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
  serverTimestamp,
  updateDoc,
  writeBatch
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
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    return docRef.id;
  };

  const updateLogEntry = async (entryId: string, updates: Partial<LogEntry>) => {
    if (!currentUser) {
      throw new Error('Usuário não autenticado');
    }

    try {
      console.log('🔄 Tentando atualizar entrada:', entryId, updates);
      
      // Verificar se o documento existe primeiro
      const entryRef = doc(db, 'logEntries', entryId);
      const entrySnap = await getDoc(entryRef);
      
      if (!entrySnap.exists()) {
        throw new Error('Entrada não encontrada');
      }

      const entryData = entrySnap.data();
      console.log('📄 Dados atuais da entrada:', entryData);

      // Verificar permissões - admin pode editar tudo, logger pode editar suas próprias entradas
      const canEdit = currentUser.role === 'admin' || 
                     currentUser.role === 'logger' || 
                     entryData.createdBy === currentUser.uid;

      if (!canEdit) {
        throw new Error('Sem permissão para editar esta entrada');
      }

      // Preparar dados para atualização
      const updateData = {
        ...updates,
        updatedAt: serverTimestamp(),
        updatedBy: currentUser.uid
      };

      console.log('💾 Dados para atualização:', updateData);

      // Tentar atualizar usando batch para garantir atomicidade
      const batch = writeBatch(db);
      batch.update(entryRef, updateData);
      await batch.commit();

      console.log('✅ Entrada atualizada com sucesso');
      return true;

    } catch (error: any) {
      console.error('❌ Erro detalhado ao atualizar entrada:', {
        error: error.message,
        code: error.code,
        entryId,
        updates,
        currentUser: currentUser?.uid
      });

      // Mensagens de erro mais específicas
      if (error.code === 'permission-denied') {
        throw new Error('Sem permissão para editar. Verifique suas credenciais.');
      } else if (error.code === 'not-found') {
        throw new Error('Entrada não encontrada. Pode ter sido removida.');
      } else if (error.code === 'unavailable') {
        throw new Error('Serviço temporariamente indisponível. Tente novamente.');
      } else if (error.message.includes('network')) {
        throw new Error('Erro de conexão. Verifique sua internet.');
      } else {
        throw new Error(`Erro ao salvar: ${error.message}`);
      }
    }
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
            createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
            updatedAt: doc.data().updatedAt?.toDate?.()?.toISOString() || new Date().toISOString()
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
    updateLogEntry,
    useRealtimeData
  };
};