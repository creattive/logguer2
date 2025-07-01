import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { AppState, LogEntry, Participant, Location, ActionCategory, Tag } from '../types';
import { useFirebase } from '../hooks/useFirebase';

interface AppContextType {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
  addLogEntry: (entry: Omit<LogEntry, 'id' | 'createdAt' | 'createdBy'>) => Promise<void>;
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

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);
  const { currentUser, addLogEntry: firebaseAddLogEntry, useRealtimeData } = useFirebase();

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

  // Timecode contínuo baseado no horário do sistema
  useEffect(() => {
    const updateTimecode = () => {
      const now = new Date();
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const seconds = String(now.getSeconds()).padStart(2, '0');
      const frames = String(Math.floor(now.getMilliseconds() / 33.33)).padStart(2, '0'); // 30fps
      
      const timecode = `${hours}:${minutes}:${seconds}:${frames}`;
      dispatch({ type: 'SET_TIMECODE', payload: timecode });
    };

    // Atualizar imediatamente
    updateTimecode();
    
    // Atualizar a cada 33ms (30fps)
    const interval = setInterval(updateTimecode, 33);

    return () => clearInterval(interval);
  }, []);

  const addLogEntry = async (entry: Omit<LogEntry, 'id' | 'createdAt' | 'createdBy'>) => {
    await firebaseAddLogEntry(entry);
  };

  return (
    <AppContext.Provider value={{ state, dispatch, addLogEntry }}>
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