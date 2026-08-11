import { useEffect, useState } from 'react';
import AdminLayout from '../layouts/AdminLayout';
import * as auditoriaService from '../services/auditoriaService';

const ACAO_LABEL = {
  'perfil_personalizado.criar': 'Criou perfil personalizado',
  'perfil_personalizado.atualizar': 'Editou perfil personalizado',
  'perfil_personalizado.remover': 'Removeu perfil personalizado',
  'limite_aprovacao.atualizar': 'Alterou limite de desconto',
  'permissao_temporaria.conceder': 'Concedeu permissão temporária',
  'permissao_temporaria.revogar': 'Revogou permissão temporária',
  'usuario.atribuir_perfil_personalizado': 'Atribuiu perfil a alguém',
  'usuario.revogar_sessao': 'Encerrou sessão de alguém'
};

function fmtDataHora(iso) {
  return new Date(iso).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' });
}

export default function LogAuditoria() {
  const [logs, setLogs] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [aberto, setAberto] = useState(null);

  useEffect(() => {
    auditoriaService.listarAuditoria().then(setLogs).finally(() => setCarregando(false));
  }, []);

  return (
    <AdminLayout titulo="Log de Auditoria">
      <p style={{ color: 'var(--texto2)', fontSize: 13.5, marginBottom: 22 }}>Registro de alterações no sistema de permissões: quem fez o quê e quando.</p>

      {carregando ? <p style={{ color: 'var(--texto2)' }}>Carregando…</p> : (
        logs.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', color: 'var(--texto2)' }}>Nenhum registro ainda.</div>
        ) : (
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            {logs.map((log) => (
              <div key={log.id} style={{ padding: '12px 18px', borderBottom: '1px solid var(--borda)', cursor: 'pointer' }} onClick={() => setAberto(aberto === log.id ? null : log.id)}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                  <div><strong>{log.usuario?.nome || 'Sistema'}</strong> — {ACAO_LABEL[log.acao] || log.acao}</div>
                  <div style={{ color: 'var(--texto2)', fontSize: 11.5 }}>{fmtDataHora(log.criadoEm)}</div>
                </div>
                {aberto === log.id && (
                  <pre style={{ fontSize: 11, color: 'var(--texto2)', marginTop: 8, whiteSpace: 'pre-wrap', overflowX: 'auto' }}>
                    {JSON.stringify({ antes: log.valorAntes, depois: log.valorDepois }, null, 2)}
                  </pre>
                )}
              </div>
            ))}
          </div>
        )
      )}
    </AdminLayout>
  );
}
