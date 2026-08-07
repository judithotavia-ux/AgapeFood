import { createContext, useContext, useEffect, useState } from 'react';
import * as authService from '../services/authService';
import { conectarSocket, desconectarSocket } from '../services/socket';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    async function carregar() {
      if (!authService.estaAutenticado()) {
        setCarregando(false);
        return;
      }
      try {
        const dados = await authService.buscarUsuarioLogado();
        setUsuario(dados);
      } catch (e) {
        authService.logout();
      } finally {
        setCarregando(false);
      }
    }
    carregar();
  }, []);

  useEffect(() => {
    if (usuario) conectarSocket();
    else desconectarSocket();
  }, [usuario]);

  async function entrar(email, senha) {
    await authService.login(email, senha);
    const dados = await authService.buscarUsuarioLogado();
    setUsuario(dados);
    return dados;
  }

  async function entrarComToken(token) {
    authService.salvarToken(token);
    const dados = await authService.buscarUsuarioLogado();
    setUsuario(dados);
    return dados;
  }

  function sair() {
    authService.logout();
    desconectarSocket();
    setUsuario(null);
  }

  return (
    <AuthContext.Provider value={{ usuario, carregando, entrar, entrarComToken, sair }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth precisa estar dentro de um AuthProvider');
  return ctx;
}
