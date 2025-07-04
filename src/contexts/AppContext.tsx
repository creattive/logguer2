import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { AppState, LogEntry, Participant, Location, ActionCategory, Tag } from '../types';
import { useFirebase } from '../hooks/useFirebase';

interface AppContextType {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
  addLogEntry: (entry: Omit<LogEntry, 'id' | 'createdAt' | 'createdBy'>) => Promise<void>;
  updateLogEntry: (entryId: string, updates: Partial<LogEntry>) => Promise<void>;
  deleteLogEntry: (entryId: string) => Promise<void>;
  deleteAllLogEntries: () => Promise<number>;
}

type AppAction = 
  | { type: 'SET_USER'; payload: any }
  | { type: 'SET_PARTICIPANTS'; payload: Participant[] }
  | { type: 'SET_LOCATIONS'; payload: Location[] }
  | { type: 'SET_ACTION_CATEGORIES'; payload: ActionCategory[] }
  | { type: 'SET_TAGS'; payload: Tag[] }
  | { type: 'SET_LOG_ENTRIES'; payload: LogEntry[] }
  | { type: 'TOGGLE_DARK_MODE' }
  | { type: 'SET_RECORDING'; payload: boolean }
  | { type: 'SET_TIMECODE'; payload: string }
  | { type: 'SET_MANUAL_TIMECODE'; payload: { isManual: boolean; startTime?: number; baseTimecode?: string } }
  | { type: 'SET_SELECTED_PARTICIPANTS'; payload: string[] }
  | { type: 'SET_SELECTED_LOCATION'; payload: string }
  | { type: 'SET_SELECTED_ACTION'; payload: string }
  | { type: 'SET_SELECTED_TAGS'; payload: string[] };

const initialState: AppState = {
  currentUser: null,
  participants: [],
  locations: [],
  actionCategories: [],
  tags: [],
  logEntries: [],
  darkMode: localStorage.getItem('darkMode') === 'true',
  isRecording: false,
  currentTimecode: '00:00:00:00',
  isManualTimecode: false,
  manualTimecodeStart: null,
  manualTimecodeBase: null,
  selectedParticipants: [],
  selectedLocation: '',
  selectedAction: '',
  selectedTags: []
};

const appReducer = (state: AppState, action: AppAction): AppState => {
  switch (action.type) {
    case 'SET_USER':
      return { ...state, currentUser: action.payload };
    case 'SET_PARTICIPANTS':
      return { ...state, participants: action.payload };
    case 'SET_LOCATIONS':
      return { ...state, locations: action.payload };
    case 'SET_ACTION_CATEGORIES':
      return { ...state, actionCategories: action.payload };
    case 'SET_TAGS':
      return { ...state, tags: action.payload };
    case 'SET_LOG_ENTRIES':
      return { ...state, logEntries: action.payload };
    case 'TOGGLE_DARK_MODE':
      const newDarkMode = !state.darkMode;
      localStorage.setItem('darkMode', newDarkMode.toString());
      return { ...state, darkMode: newDarkMode };
    case 'SET_RECORDING':
      return { ...state, isRecording: action.payload };
    case 'SET_TIMECODE':
      return { ...state, currentTimecode: action.payload };
    case 'SET_MANUAL_TIMECODE':
      return { 
        ...state, 
        isManualTimecode: action.payload.isManual,
        manualTimecodeStart: action.payload.startTime || null,
        manualTimecodeBase: action.payload.baseTimecode || null
      };
    case 'SET_SELECTED_PARTICIPANTS':
      return { ...state, selectedParticipants: action.payload };
    case 'SET_SELECTED_LOCATION':
      return { ...state, selectedLocation: action.payload };
    case 'SET_SELECTED_ACTION':
      return { ...state, selectedAction: action.payload };
    case 'SET_SELECTED_TAGS':
      return { ...state, selectedTags: action.payload };
    default:
      return state;
  }
};

// Função para converter timecode em segundos
const timecodeToSeconds = (timecode: string): number => {
  const [hours, minutes, seconds, frames] = timecode.split(':').map(Number);
  return hours * 3600 + minutes * 60 + seconds + frames / 30; // 30fps
};

// Função para converter segundos em timecode
const secondsToTimecode = (totalSeconds: number): string => {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.floor(totalSeconds % 60);
  const frames = Math.floor((totalSeconds % 1) * 30); // 30fps
  
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}:${String(frames).padStart(2, '0')}`;
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);
  const { 
    currentUser, 
    addLogEntry: firebaseAddLogEntry, 
    updateLogEntry: firebaseUpdateLogEntry,
    deleteLogEntry: firebaseDeleteLogEntry,
    deleteAllLogEntries: firebaseDeleteAllLogEntries,
    useRealtimeData 
  } = useFirebase();

  const [participants] = useRealtimeData<Participant>('participants');
  const [locations] = useRealtimeData<Location>('locations');
  const [actionCategories] = useRealtimeData<ActionCategory>('actionCategories');
  const [tags] = useRealtimeData<Tag>('tags');
  const [logEntries] = useRealtimeData<LogEntry>('logEntries');

  useEffect(() => {
    dispatch({ type: 'SET_USER', payload: currentUser });
  }, [currentUser]);

  useEffect(() => {
    dispatch({ type: 'SET_PARTICIPANTS', payload: participants });
  }, [participants]);

  useEffect(() => {
    dispatch({ type: 'SET_LOCATIONS', payload: locations });
  }, [locations]);

  useEffect(() => {
    dispatch({ type: 'SET_ACTION_CATEGORIES', payload: actionCategories });
  }, [actionCategories]);

  useEffect(() => {
    dispatch({ type: 'SET_TAGS', payload: tags });
  }, [tags]);

  useEffect(() => {
    dispatch({ type: 'SET_LOG_ENTRIES', payload: logEntries });
  }, [logEntries]);

  // Timecode contínuo - automático ou manual
  useEffect(() => {
    const updateTimecode = () => {
      if (state.isManualTimecode && state.manualTimecodeStart && state.manualTimecodeBase) {
        // Modo manual: calcular timecode baseado no tempo decorrido desde o início manual
        const now = Date.now();
        const elapsedSeconds = (now - state.manualTimecodeStart) / 1000;
        const baseSeconds = timecodeToSeconds(state.manualTimecodeBase);
        const newTimecode = secondsToTimecode(baseSeconds + elapsedSeconds);
        dispatch({ type: 'SET_TIMECODE', payload: newTimecode });
      } else if (!state.isManualTimecode) {
        // Modo automático: usar horário do sistema
        const now = new Date();
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const seconds = String(now.getSeconds()).padStart(2, '0');
        const frames = String(Math.floor(now.getMilliseconds() / 33.33)).padStart(2, '0'); // 30fps
        
        const timecode = `${hours}:${minutes}:${seconds}:${frames}`;
        dispatch({ type: 'SET_TIMECODE', payload: timecode });
      }
    };

    // Atualizar imediatamente
    updateTimecode();
    
    // Atualizar a cada 33ms (30fps)
    const interval = setInterval(updateTimecode, 33);

    return () => clearInterval(interval);
  }, [state.isManualTimecode, state.manualTimecodeStart, state.manualTimecodeBase]);

  const addLogEntry = async (entry: Omit<LogEntry, 'id' | 'createdAt' | 'createdBy'>) => {
    await firebaseAddLogEntry(entry);
  };

  const updateLogEntry = async (entryId: string, updates: Partial<LogEntry>) => {
    await firebaseUpdateLogEntry(entryId, updates);
  };

  const deleteLogEntry = async (entryId: string) => {
    await firebaseDeleteLogEntry(entryId);
  };

  const deleteAllLogEntries = async () => {
    return await firebaseDeleteAllLogEntries();
  };

  return (
    <AppContext.Provider value={{ 
      state, 
      dispatch, 
      addLogEntry, 
      updateLogEntry, 
      deleteLogEntry, 
      deleteAllLogEntries 
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};