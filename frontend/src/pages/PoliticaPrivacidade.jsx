const ESTILO = { minHeight: '100vh', background: '#0a0a0a', color: '#f2ead9', fontFamily: "'Segoe UI', Arial, sans-serif" };
const COR = '#D4AF37';

function Secao({ titulo, children }) {
  return (
    <section style={{ marginBottom: 24 }}>
      <h2 style={{ fontSize: 15, color: COR, marginBottom: 8 }}>{titulo}</h2>
      <div style={{ fontSize: 13.5, lineHeight: 1.7, color: '#d8cfba' }}>{children}</div>
    </section>
  );
}

export default function PoliticaPrivacidade() {
  return (
    <div style={ESTILO}>
      <div style={{ maxWidth: 760, margin: '0 auto', padding: '40px 20px 80px' }}>
        <h1 style={{ fontFamily: 'Georgia, serif', fontSize: 26, color: COR, marginBottom: 6 }}>Política de Privacidade — AgapeFood</h1>
        <p style={{ fontSize: 12, color: '#b8ac8e', marginBottom: 30 }}>Última atualização: 10 de agosto de 2026 · Conforme a Lei Geral de Proteção de Dados (Lei 13.709/2018)</p>

        <Secao titulo="1. Quem trata os seus dados">
          <p>
            Esta política descreve como o AgapeFood coleta, usa e protege dados pessoais ao operar a plataforma.
            Para dados de funcionários e da própria empresa contratante, o AgapeFood atua como controlador. Para
            dados de clientes finais dos estabelecimentos (coletados através dos módulos de pedidos, cardápio
            digital e marketing), o estabelecimento contratante é o controlador e o AgapeFood atua como operador.
          </p>
        </Secao>

        <Secao titulo="2. Quais dados coletamos">
          <p><strong>Da empresa contratante:</strong> razão social, CNPJ, endereço, contatos, dados fiscais.</p>
          <p><strong>Dos usuários/funcionários da empresa:</strong> nome, e-mail, CPF, RG, telefone, data de nascimento, foto (quando enviada).</p>
          <p><strong>Dos clientes finais do estabelecimento:</strong> nome, telefone, e-mail, endereços de entrega, data de nascimento, histórico de pedidos e avaliações, saldo de cashback.</p>
          <p><strong>Dados de acesso:</strong> registros de login, endereço IP e informações técnicas de uso da plataforma, para fins de segurança.</p>
          <p>
            <strong>Não armazenamos dados completos de cartão de crédito.</strong> Quando aplicável, o processamento
            de pagamentos é realizado por gateways de pagamento terceirizados especializados, sujeitos às
            próprias políticas de segurança (PCI-DSS).
          </p>
        </Secao>

        <Secao titulo="3. Para que usamos esses dados">
          <ul style={{ margin: 0, paddingLeft: 18 }}>
            <li>Viabilizar o funcionamento dos módulos contratados (pedidos, cardápio, financeiro, impressão etc.);</li>
            <li>Autenticação e segurança de acesso;</li>
            <li>Comunicação sobre a conta, cobranças e atualizações da plataforma;</li>
            <li>Geração de relatórios e estatísticas para o próprio estabelecimento;</li>
            <li>Quando configurado pelo estabelecimento, geração de textos de campanhas de marketing por
              inteligência artificial (processado por provedor de IA terceirizado, sem uso dos dados para
              treinamento de modelos de terceiros).</li>
          </ul>
        </Secao>

        <Secao titulo="4. Compartilhamento com terceiros">
          <p>
            Utilizamos provedores de infraestrutura para hospedar a plataforma e o banco de dados, que podem
            estar localizados fora do Brasil. Esses provedores tratam os dados exclusivamente para viabilizar a
            operação técnica da plataforma, sob obrigações contratuais de confidencialidade e segurança. Não
            vendemos dados pessoais a terceiros para fins de publicidade.
          </p>
        </Secao>

        <Secao titulo="5. Armazenamento e segurança">
          <p>
            Senhas são armazenadas de forma criptografada (hash), nunca em texto plano. Códigos de verificação
            (OTP) também são armazenados de forma criptografada e possuem prazo de expiração curto. O acesso aos
            dados é restrito por autenticação e escopo por empresa — nenhuma empresa cadastrada consegue acessar
            dados de outra.
          </p>
        </Secao>

        <Secao titulo="6. Seus direitos como titular de dados">
          <p>Nos termos da LGPD, você pode solicitar ao estabelecimento (controlador) ou a nós, quando aplicável:</p>
          <ul style={{ margin: 0, paddingLeft: 18 }}>
            <li>Confirmação da existência de tratamento e acesso aos dados;</li>
            <li>Correção de dados incompletos, inexatos ou desatualizados;</li>
            <li>Anonimização, bloqueio ou eliminação de dados desnecessários ou tratados em desconformidade com a lei;</li>
            <li>Portabilidade dos dados a outro fornecedor de serviço;</li>
            <li>Eliminação dos dados tratados com base no consentimento;</li>
            <li>Revogação do consentimento a qualquer momento;</li>
            <li>Informação sobre entidades com as quais os dados foram compartilhados.</li>
          </ul>
          <p>
            Clientes finais podem exercer esses direitos diretamente pelo Portal do Cliente (área "Minha Conta"),
            que permite editar dados, gerenciar preferências de comunicação e solicitar a exclusão da conta.
          </p>
        </Secao>

        <Secao titulo="7. Retenção de dados">
          <p>
            Mantemos os dados pelo tempo necessário para cumprir as finalidades descritas nesta política e
            obrigações legais/fiscais aplicáveis. Solicitações de exclusão são atendidas ressalvados os casos em
            que a manutenção dos dados seja exigida por lei (ex: registros fiscais de pedidos).
          </p>
        </Secao>

        <Secao titulo="8. Cookies e armazenamento local">
          <p>
            Utilizamos armazenamento local do navegador (localStorage) para manter sua sessão autenticada. Não
            utilizamos cookies de rastreamento publicitário de terceiros.
          </p>
        </Secao>

        <Secao titulo="9. Encarregado de Proteção de Dados (DPO)">
          <p>
            Para exercer seus direitos ou esclarecer dúvidas sobre esta política, entre em contato através do
            e-mail informado no cadastro do estabelecimento em que você é cliente, ou diretamente com o
            estabelecimento contratante.
          </p>
        </Secao>

        <Secao titulo="10. Alterações desta política">
          <p>
            Esta política pode ser atualizada periodicamente para refletir mudanças na plataforma ou na
            legislação aplicável. A data da última atualização está indicada no topo deste documento.
          </p>
        </Secao>

        <p style={{ fontSize: 11, color: '#8a7f66', marginTop: 40, borderTop: '1px solid rgba(255,255,255,.08)', paddingTop: 16 }}>
          Este documento é um modelo inicial e não substitui a revisão por um advogado ou encarregado de proteção
          de dados antes do uso comercial da plataforma.
        </p>
      </div>
    </div>
  );
}
