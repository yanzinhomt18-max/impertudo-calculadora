# Calculadora Técnica IMPERTUDO — V9.0

Reconstrução do projeto em arquitetura limpa, com banco técnico rastreável e um único motor de cálculo reutilizado pela interface, Projeto/Obra e proposta comercial.

## Estado atual

A V9 está em **homologação alpha funcional**. A V8.3 permanece como produção.

### Já implementado

- banco mestre com 68 produtos, 28 categorias e 18 ambientes;
- status e fonte por produto;
- bloqueio automático de dados pendentes ou ainda não revalidados;
- área por m² direto, comprimento × largura e perímetro × altura;
- reservatórios retangulares e cilíndricos;
- cálculo por produto;
- cálculo por sistema em camadas;
- assistente técnico por ambiente e filtros cadastrados;
- consumo mínimo/máximo e margem de perda;
- embalagens mínimas e compra recomendada;
- combinação comercial com menor sobra;
- Modo Projeto/Obra com persistência local;
- consolidação dos materiais antes do arredondamento de embalagens;
- orçamento com preço por embalagem;
- desconto por item em percentual **ou** valor fixo;
- desconto adicional para PIX/Dinheiro separado do desconto do item;
- cartão sem desconto adicional à vista;
- resumo copiável e envio via WhatsApp;
- PDF nativo;
- PWA, Service Worker e orientação de instalação Android/iOS;
- layout responsivo e logo original IMPERTUDO;
- testes automatizados, validação do banco e validação do pacote PWA no GitHub Actions.

## Política técnica

1. **Fonte rastreável:** todo dado técnico possui status e fonte.
2. **Nada presumido:** produto sem ficha suficiente não alimenta cálculo automático.
3. **Revalidar não significa liberado:** registros `previous_technical_pending_revalidation` ficam visíveis para auditoria, mas bloqueados no motor genérico.
4. **Produto ≠ sistema:** uma regra de produto isolado não substitui uma regra específica de composição técnica.
5. **Cálculo único:** o mesmo motor alimenta resultado, Projeto/Obra, consolidação e proposta.
6. **Compra depois da consolidação:** a V9 soma a necessidade total do mesmo produto antes de arredondar embalagens.

## Banco inicial

- 68 produtos;
- 28 categorias internas;
- 18 ambientes/áreas;
- 3 sistemas técnicos iniciais.

A cobertura automática crescerá conforme as fichas forem revalidadas. Produtos pendentes continuam no catálogo para pesquisa, mas não recebem fórmula presumida.

## Stack

- React 19.2
- TypeScript 7
- Vite 8.1
- Zod 4
- Vitest 4
- jsPDF 4.2.1
- Vercel

## Validação

O workflow `Validate V9` executa:

1. validação de integridade do banco;
2. testes do motor matemático;
3. checagem TypeScript;
4. build Vite;
5. verificação dos arquivos essenciais do PWA no pacote de produção.

Consulte `docs/execution-plan.md` para a ordem completa de desenvolvimento.

## Limites conscientes da homologação

- nem todos os 68 produtos possuem dados técnicos suficientes para cálculo automático;
- a quantidade de sistemas completos cadastrados ainda é pequena e será ampliada somente com base técnica rastreável;
- a V9 ainda não substitui a V8.3 em produção enquanto estiver em homologação.
