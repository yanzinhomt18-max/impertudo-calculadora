# Calculadora Técnica IMPERTUDO

Calculadora técnica de materiais IMPERTUDO, com pré-dimensionamento, consumo, embalagens comerciais, reservatórios, selantes, proposta comercial e PWA.

## V8.3 — estabilização

A V8.3 é uma versão de correção e confiabilidade antes da reconstrução do próximo projeto do zero.

### Correções principais

- catálogo local realmente carregado antes do núcleo da aplicação e persistido em `localStorage`;
- demãos duplicadas removidas nos cálculos guiados;
- consumo total x consumo por demão definido automaticamente quando a ficha técnica cadastrada permite identificar a base;
- validação de área, dimensões de reservatório, juntas, faixa mínima/máxima e diluição;
- regra de IMPERTUDO TOP em pressão negativa revisada para a faixa cadastrada de 4,0 a 5,0 kg/m²;
- faixa mínima e máxima de embalagens preservada, com máximo destacado como referência de compra;
- desconto comercial do item simplificado: percentual **ou** valor fixo, evitando soma acidental dos dois formatos;
- desconto adicional de PIX/Dinheiro separado do desconto comercial do item;
- PDF nativo com logo proporcional;
- `jsPDF` instalado localmente no projeto para funcionar offline após cache da PWA;
- Service Worker corrigido para nunca devolver HTML no lugar de arquivos JS/CSS;
- orientação específica para instalação no iPhone/iPad;
- layout com melhor legibilidade, sem altura mínima artificial dos cards e com campos maiores no mobile;
- GitHub Actions valida sintaxe, dependências, build e arquivos essenciais do pacote de produção.

### Fluxo de publicação

`branch de trabalho → Pull Request → validação GitHub Actions → main → Vercel`

O projeto Vercel está conectado ao repositório GitHub e publica automaticamente a branch `main`.

## Próximo projeto

Após a V8.3 estabilizada, a próxima etapa será um novo projeto desenvolvido do zero, incorporando as ideias levantadas na pesquisa de referência: modo Obra/Projeto, cálculo por sistema, assistente técnico por problema/ambiente, alertas de compatibilidade, ficha com aplicação/dados técnicos, margem inteligente e proposta por composição completa de materiais.
