import { createContext, useContext, useEffect, useState } from 'react';
import * as authService from '../services/authService';

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

  async function entrar(email, senha) {
    await authService.login(email, senha);
    const dados = await authService.buscarUsuarioLogado();
    setUsuario(dados);
    return dados;
  }

  function sair() {
    authService.logout();
    setUsuario(null);
  }

  return (
    <AuthContext.Provider value={{ usuario, carregando, entrar, sair }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth precisa estar dentro de um AuthProvider');
  return ctx;
}
