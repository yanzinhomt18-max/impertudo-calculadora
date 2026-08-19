# Calculadora Técnica IMPERTUDO — V9.0

Reconstrução do projeto a partir de uma arquitetura limpa.

## Objetivo da V9

A V9 não herda a lógica da V8.3. O projeto começa pelo banco técnico e só depois adiciona calculadoras e interface operacional.

### Princípios

1. **Fonte rastreável:** todo dado técnico possui status e fonte.
2. **Nada presumido:** produto sem ficha revisada fica `pending` e não alimenta cálculo automático.
3. **Produto ≠ sistema:** o banco separa produto individual de composição técnica completa.
4. **Cálculo paramétrico:** cada produto declara seu modelo de cálculo.
5. **Ambiente e condição:** reservatório, laje, fachada, junta etc. são dados do domínio, não textos soltos no formulário.
6. **Evolução segura:** banco validado em CI antes de cada build.

## Banco inicial

- 68 produtos identificados no portfólio oficial;
- 28 categorias internas;
- 18 ambientes/áreas;
- 3 sistemas iniciais;
- status de verificação por produto;
- fontes oficiais e referências técnicas separadas.

Os dados do projeto anterior foram usados somente para identificar o portfólio e preservar informações já revisadas. Campos técnicos não confirmados novamente entram como pendentes ou “revalidar ficha”.

## Stack

- React 19.2
- TypeScript 7
- Vite 8.1
- Zod 4
- Vercel

## Próximas etapas

1. enriquecer e revalidar fichas técnicas;
2. motor matemático de cálculo;
3. modo Projeto/Obra;
4. cálculo por sistema;
5. assistente por problema/ambiente;
6. compatibilidades e alertas técnicos;
7. orçamento/proposta;
8. PWA e persistência offline.
