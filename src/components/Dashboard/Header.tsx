import React, { useState } from 'react';
import { Moon, Sun, LogOut, User, Clock, Edit3, RotateCcw, Settings } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { useFirebase } from '../../hooks/useFirebase';
import AdminPanel from './AdminPanel';

const Header: React.FC = () => {
  const { state, dispatch } = useApp();
  const { logout } = useFirebase();
  const [isEditingTimecode, setIsEditingTimecode] = useState(false);
  const [tempTimecode, setTempTimecode] = useState(state.currentTimecode);
  const [showAdminPanel, setShowAdminPanel] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Erro de logout:', error);
    }
  };

  const handleTimecodeEdit = () => {
    if (isEditingTimecode) {
      // Salvar o timecode editado
      dispatch({ type: 'SET_TIMECODE', payload: tempTimecode });
      setIsEditingTimecode(false);
    } else {
      setTempTimecode(state.currentTimecode);
      setIsEditingTimecode(true);
    }
  };

  const handleSyncTimecode = () => {
    // Sincronizar com o horário atual do sistema
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    const frames = String(Math.floor(now.getMilliseconds() / 33.33)).padStart(2, '0'); // 30fps
    
    const systemTimecode = `${hours}:${minutes}:${seconds}:${frames}`;
    dispatch({ type: 'SET_TIMECODE', payload: systemTimecode });
    setTempTimecode(systemTimecode);
    setIsEditingTimecode(false);
  };

  const isAdmin = state.currentUser?.role === 'admin';

  return (
    <>
      <header className={`${state.darkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'} border-b sticky top-0 z-50 transition-all duration-200 shadow-lg`}>
        <div className="max-w-[1600px] mx-auto px-6">
          <div className="flex items-center justify-between h-20">
            
            {/* Logo & User Info */}
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-red-600 rounded-xl flex items-center justify-center shadow-lg">
                  <span className="text-white font-bold text-lg">📺</span>
                </div>
                <div>
                  <h1 className={`text-2xl font-bold ${state.darkMode ? 'text-white' : 'text-gray-900'}`}>
                    SIS LOGGUER 
                  </h1>
                  <p className={`text-sm ${state.darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    Sistema Profissional p/ Reality
                  </p>
                </div>
              </div>

              {/* User Info */}
              <div className={`flex items-center space-x-3 px-4 py-2 rounded-xl ${state.darkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  isAdmin ? 'bg-gradient-to-r from-red-500 to-pink-600' : 'bg-gradient-to-r from-blue-500 to-purple-600'
                }`}>
                  <User className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div className={`text-sm font-semibold ${state.darkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                    {state.currentUser?.displayName || 'Operador'}
                  </div>
                  <div className={`text-xs ${
                    isAdmin ? 'text-red-500 font-bold' : state.darkMode ? 'text-gray-400' : 'text-gray-500'
                  }`}>
                    {state.currentUser?.role?.toUpperCase() || 'LOGGER'}
                  </div>
                </div>
              </div>
            </div>

            {/* Timecode Central */}
            <div className="flex items-center space-x-4">
              <div className={`flex items-center space-x-4 px-6 py-3 rounded-2xl ${state.darkMode ? 'bg-gray-800 border border-gray-700' : 'bg-gray-100 border border-gray-200'} shadow-lg`}>
                <Clock className={`w-6 h-6 ${state.darkMode ? 'text-cyan-400' : 'text-cyan-600'}`} />
                
                {isEditingTimecode ? (
                  <input
                    type="text"
                    value={tempTimecode}
                    onChange={(e) => setTempTimecode(e.target.value)}
                    className={`font-mono text-2xl font-bold bg-transparent border-none outline-none w-32 text-center ${state.darkMode ? 'text-cyan-400' : 'text-cyan-600'}`}
                    placeholder="00:00:00:00"
                    pattern="[0-9]{2}:[0-9]{2}:[0-9]{2}:[0-9]{2}"
                  />
                ) : (
                  <span className={`font-mono text-2xl font-bold ${state.darkMode ? 'text-cyan-400' : 'text-cyan-600'}`}>
                    {state.currentTimecode}
                  </span>
                )}

                <div className="flex items-center space-x-2">
                  <button
                    onClick={handleTimecodeEdit}
                    className={`p-2 rounded-lg transition-all duration-200 ${
                      isEditingTimecode 
                        ? 'bg-green-500 text-white' 
                        : state.darkMode 
                        ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' 
                        : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                    }`}
                    title={isEditingTimecode ? 'Salvar' : 'Editar Timecode'}
                  >
                    {isEditingTimecode ? '✓' : <Edit3 className="w-4 h-4" />}
                  </button>
                  
                  <button
                    onClick={handleSyncTimecode}
                    className={`p-2 rounded-lg transition-all duration-200 ${state.darkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'}`}
                    title="Sincronizar com horário do sistema"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Data atual */}
              <div className={`px-4 py-2 rounded-xl ${state.darkMode ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-700'}`}>
                <div className="text-sm font-medium">
                  {new Date().toLocaleDateString('pt-BR', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </div>
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center space-x-4">
              <button
                onClick={() => dispatch({ type: 'TOGGLE_DARK_MODE' })}
                className={`p-3 rounded-xl transition-all duration-200 ${state.darkMode ? 'bg-gray-800 text-yellow-400 hover:bg-gray-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
              >
                {state.darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>

              {/* Admin Settings Button */}
              {isAdmin && (
                <button
                  onClick={() => setShowAdminPanel(!showAdminPanel)}
                  className={`p-3 rounded-xl transition-all duration-200 ${
                    showAdminPanel 
                      ? 'bg-red-500 text-white' 
                      : state.darkMode 
                      ? 'bg-gray-800 text-red-400 hover:bg-gray-700' 
                      : 'bg-gray-100 text-red-600 hover:bg-gray-200'
                  }`}
                  title="Painel Administrativo"
                >
                  <Settings className="w-5 h-5" />
                </button>
              )}

              <button
                onClick={handleLogout}
                className={`p-3 rounded-xl transition-all duration-200 ${state.darkMode ? 'bg-red-900/30 text-red-400 hover:bg-red-900/50' : 'bg-red-100 text-red-600 hover:bg-red-200'}`}
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Admin Panel Modal */}
      {showAdminPanel && isAdmin && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="max-w-6xl w-full max-h-[90vh] overflow-y-auto">
            <AdminPanel onClose={() => setShowAdminPanel(false)} />
          </div>
        </div>
      )}
    </>
  );
};

export default Header;