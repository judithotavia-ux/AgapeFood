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

export default function TermosDeUso() {
  return (
    <div style={ESTILO}>
      <div style={{ maxWidth: 760, margin: '0 auto', padding: '40px 20px 80px' }}>
        <h1 style={{ fontFamily: 'Georgia, serif', fontSize: 26, color: COR, marginBottom: 6 }}>Termos de Uso — AgapeFood</h1>
        <p style={{ fontSize: 12, color: '#b8ac8e', marginBottom: 30 }}>Última atualização: 10 de agosto de 2026</p>

        <Secao titulo="1. Sobre o AgapeFood">
          <p>
            O AgapeFood é uma plataforma de software como serviço (SaaS) voltada à gestão de restaurantes,
            lanchonetes e estabelecimentos similares, oferecendo módulos de cardápio digital, pedidos, cozinha,
            caixa, salão, delivery, estoque, financeiro, marketing e impressão de comandas. Ao criar uma conta
            e utilizar a plataforma, a empresa contratante ("Contratante", "você") concorda com estes Termos de Uso.
          </p>
        </Secao>

        <Secao titulo="2. Cadastro e conta">
          <p>
            Você é responsável por fornecer informações verdadeiras no cadastro e por manter a confidencialidade
            de suas credenciais de acesso (e-mail e senha). Todo uso feito através da sua conta é de sua
            responsabilidade. Avise-nos imediatamente em caso de suspeita de uso não autorizado.
          </p>
        </Secao>

        <Secao titulo="3. Planos, cobrança e inadimplência">
          <p>
            O acesso à plataforma pode estar condicionado à contratação de um plano pago, com cobrança recorrente
            (mensal ou conforme o ciclo escolhido) através do meio de pagamento disponibilizado na plataforma.
            Em caso de atraso ou não pagamento, o AgapeFood poderá suspender total ou parcialmente o acesso à
            conta até a regularização, mediante aviso prévio nos canais cadastrados. O cancelamento pode ser
            solicitado a qualquer momento, sem multa, produzindo efeitos ao final do ciclo de cobrança vigente,
            salvo condição diversa informada no momento da contratação do plano.
          </p>
        </Secao>

        <Secao titulo="4. Uso permitido">
          <p>
            A plataforma deve ser utilizada exclusivamente para fins lícitos relacionados à gestão do seu
            estabelecimento. É vedado: (a) utilizar o AgapeFood para armazenar ou transmitir conteúdo ilegal;
            (b) tentar acessar dados de outras empresas cadastradas na plataforma; (c) realizar engenharia
            reversa, cópia ou revenda não autorizada do software; (d) utilizar a plataforma de forma que
            comprometa sua disponibilidade para os demais clientes.
          </p>
        </Secao>

        <Secao titulo="5. Dados dos clientes do seu estabelecimento">
          <p>
            Ao utilizar módulos que coletam dados de seus próprios clientes (nome, telefone, endereço, histórico
            de pedidos, avaliações etc.), você — Contratante — atua como controlador desses dados perante a Lei
            Geral de Proteção de Dados (LGPD), sendo responsável por possuir base legal adequada para tal
            tratamento (ex: consentimento do cliente, execução de contrato). O AgapeFood atua como operador,
            processando esses dados conforme suas instruções e nos limites desta plataforma.
          </p>
        </Secao>

        <Secao titulo="6. Disponibilidade do serviço">
          <p>
            Envidamos esforços para manter a plataforma disponível de forma contínua, mas não garantimos
            operação livre de interrupções, já que dependemos de provedores de infraestrutura terceiros (hospedagem,
            banco de dados, conectividade). Manutenções programadas serão comunicadas quando possível.
          </p>
        </Secao>

        <Secao titulo="7. Limitação de responsabilidade">
          <p>
            O AgapeFood não se responsabiliza por perdas decorrentes de uso indevido da plataforma, falhas de
            conectividade do estabelecimento, indisponibilidade de serviços de terceiros integrados (ex: impressoras,
            gateways de pagamento) ou por decisões comerciais tomadas com base nos dados e relatórios da plataforma.
          </p>
        </Secao>

        <Secao titulo="8. Alterações destes termos">
          <p>
            Estes Termos podem ser atualizados periodicamente. Alterações relevantes serão comunicadas com
            antecedência razoável pelos canais de contato cadastrados ou por aviso na própria plataforma.
          </p>
        </Secao>

        <Secao titulo="9. Foro e legislação aplicável">
          <p>
            Estes Termos são regidos pelas leis da República Federativa do Brasil. Fica eleito o foro do
            domicílio do Contratante para dirimir eventuais controvérsias, salvo disposição legal em contrário.
          </p>
        </Secao>

        <p style={{ fontSize: 11, color: '#8a7f66', marginTop: 40, borderTop: '1px solid rgba(255,255,255,.08)', paddingTop: 16 }}>
          Este documento é um modelo inicial e não substitui a revisão por um advogado antes do uso comercial da plataforma.
        </p>
      </div>
    </div>
  );
}
